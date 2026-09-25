-- Images live under public/badges/<series>/, matching existing badge asset layout.
update public.badge_definitions set image_url = '/badges/tournament-champion/tournament-master-' || tier || '.png' where series = 'tournament-champion';
update public.badge_definitions set image_url = '/badges/tournament-master/tournament-organizer-' || tier || '.png' where series = 'tournament-master';
update public.badge_definitions set image_url = '/badges/chronicler-of-legends/chronicler-of-legends-' || tier || '.png' where series = 'chronicler-of-legends';
update public.badge_definitions set image_url = '/badges/master-storyteller/master-storyteller-' || tier || '.png' where series = 'master-storyteller';
update public.badge_definitions set image_url = '/badges/league-veteran/league-veteran-' || tier || '.png' where series = 'league-veteran';
update public.badge_definitions set image_url = '/badges/league-commissioner/league-commissioner-' || tier || '.png' where series = 'league-commissioner';
