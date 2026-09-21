-- Remove misleading Wahapedia page-derived images and keep only verified official assets.
update mini_units
set image_url = null,
    image_source_url = null
where image_url like 'https://wahapedia.ru/%';

-- Verified official Games Workshop imagery for representative 40K units.
update mini_units
set image_url = 'https://assets.warhammer-community.com/gallery/all/4r1gquo00vw8xg0s.jpg',
    image_source_url = 'https://www.warhammer-community.com/en-gb/articles/0bBdYJkj/indomitus-space-marines-and-necrons-clash-with-new-rules-in-kill-team/'
where name = 'Assault Intercessor Squad';

update mini_units
set image_url = 'https://assets.warhammer-community.com/articles/0-2026/september/wc07-09/sundaypreview-sep13-40k_04-intercessors-caw9fne958.jpg',
    image_source_url = 'https://www.warhammer-community.com/en-gb/articles/c4icjvyy/sunday-preview-space-marines-drop-in-from-orbit/'
where name = 'Intercessor Squad';

update mini_units
set image_url = 'https://assets.warhammer-community.com/40k_gkfaction-may20-image3_wide-twdprm8dnk.jpg',
    image_source_url = 'https://www.warhammer-community.com/en-gb/articles/twdi1vya/warhammer-40000-faction-focus-grey-knights/'
where name = 'Interceptor Squad'
  and image_url is null;
