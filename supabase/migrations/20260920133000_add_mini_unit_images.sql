alter table public.mini_units
  add column if not exists image_url text,
  add column if not exists image_source_url text;

update public.mini_units
set
  image_url = 'https://assets.warhammer-community.com/sundaypreview-mar08-bb_01-highelfteam-dupnbwhuax.jpg',
  image_source_url = 'https://www.warhammer-community.com/en-gb/articles/ngdxmygg/sunday-preview-black-library-celebration-and-blood-bowl-releases/'
where id = '67a2f3ea-f81d-419e-8a73-9e75ab6a325d';
