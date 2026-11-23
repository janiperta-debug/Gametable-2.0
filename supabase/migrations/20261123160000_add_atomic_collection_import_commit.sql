-- Atomic, replay-safe ownership writes for reviewed collection import items.
-- Called only by the server using the service role; no client role can execute it.

create or replace function public.commit_collection_import_item(
  p_item_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item public.collection_import_items%rowtype;
  v_batch public.collection_import_batches%rowtype;
  v_existing_commit public.collection_import_commits%rowtype;
  v_quantity integer;
  v_ownership_id uuid;
  v_card_id uuid;
  v_unit_id uuid;
  v_result jsonb;
begin
  select *
    into v_item
    from public.collection_import_items
   where id = p_item_id
   for update;

  if not found then
    raise exception 'Import item not found';
  end if;

  select *
    into v_batch
    from public.collection_import_batches
   where id = v_item.batch_id;

  if not found or v_batch.user_id <> p_user_id then
    raise exception 'Import item not found';
  end if;

  select *
    into v_existing_commit
    from public.collection_import_commits
   where item_id = p_item_id;

  if found then
    return jsonb_build_object(
      'success', true,
      'alreadyCommitted', true,
      'ownershipRecordId', v_existing_commit.ownership_record_id,
      'result', v_existing_commit.result_data
    );
  end if;

  if v_batch.status not in ('review', 'committing') then
    raise exception 'Import batch is not ready to commit';
  end if;

  if v_item.status <> 'accepted' or v_item.resolved_catalog_id is null then
    raise exception 'Import item has not been accepted';
  end if;

  v_quantity := greatest(1, coalesce((v_item.parsed_data ->> 'quantity')::integer, 1));

  if v_batch.category = 'tcg' then
    if not exists (
      select 1 from public.collection_import_candidates c
       where c.item_id = v_item.id
         and c.catalog_id = v_item.resolved_catalog_id
         and c.catalog_source = 'tcg_cards'
    ) then
      raise exception 'Selected TCG catalog match is invalid';
    end if;

    v_card_id := v_item.resolved_catalog_id::uuid;

    select id
      into v_ownership_id
      from public.tcg_collection
     where user_id = p_user_id
       and card_id = v_card_id
       and condition = 'near_mint'
       and foil = false
     order by added_at asc
     limit 1
     for update;

    if v_ownership_id is not null then
      update public.tcg_collection
         set quantity = coalesce(quantity, 0) + v_quantity
       where id = v_ownership_id;
    else
      insert into public.tcg_collection (user_id, card_id, quantity)
      values (p_user_id, v_card_id, v_quantity)
      returning id into v_ownership_id;
    end if;

    v_result := jsonb_build_object(
      'category', 'tcg',
      'cardId', v_card_id,
      'quantityAdded', v_quantity
    );

  elsif v_batch.category = 'miniatures' then
    if not exists (
      select 1 from public.collection_import_candidates c
       where c.item_id = v_item.id
         and c.catalog_id = v_item.resolved_catalog_id
         and c.catalog_source = 'mini_units'
    ) then
      raise exception 'Selected miniature catalog match is invalid';
    end if;

    v_unit_id := v_item.resolved_catalog_id::uuid;

    insert into public.mini_army_units (
      user_id,
      unit_id,
      model_count,
      points_total,
      owned,
      paint_status,
      army_id,
      custom_name,
      upgrades,
      is_warlord
    )
    select
      p_user_id,
      u.id,
      v_quantity,
      u.base_points,
      true,
      'unpainted',
      null,
      null,
      null,
      false
    from public.mini_units u
    where u.id = v_unit_id
    returning id into v_ownership_id;

    if v_ownership_id is null then
      raise exception 'Miniature catalog unit not found';
    end if;

    v_result := jsonb_build_object(
      'category', 'miniatures',
      'unitId', v_unit_id,
      'modelCountAdded', v_quantity
    );
  else
    raise exception 'Unsupported import category';
  end if;

  insert into public.collection_import_commits (
    item_id, user_id, category, ownership_record_id, result_data
  ) values (
    p_item_id, p_user_id, v_batch.category, v_ownership_id, v_result
  );

  update public.collection_import_items
     set status = 'imported',
         error_message = null,
         updated_at = now()
   where id = p_item_id;

  return jsonb_build_object(
    'success', true,
    'alreadyCommitted', false,
    'ownershipRecordId', v_ownership_id,
    'result', v_result
  );
end;
$$;

revoke all on function public.commit_collection_import_item(uuid, uuid) from public, anon, authenticated;
grant execute on function public.commit_collection_import_item(uuid, uuid) to service_role;
