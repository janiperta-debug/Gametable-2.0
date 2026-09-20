insert into public.mini_catalog_sources
  (code, name, system_code, publisher, source_type, source_url)
values
  ('age-of-sigmar-warhammer-community','Warhammer Age of Sigmar — Warhammer Community','aos_3e','Games Workshop','html','https://www.warhammer-community.com/en-gb/downloads/warhammer-age-of-sigmar/'),
  ('star-wars-legion-atomic-mass-games','Star Wars: Legion — Atomic Mass Games','sw_legion','Atomic Mass Games','html','https://www.atomicmassgames.com/swlegiondocs/')
on conflict (code) do update set
  name=excluded.name, system_code=excluded.system_code, publisher=excluded.publisher,
  source_type=excluded.source_type, source_url=excluded.source_url, updated_at=now();

update public.mini_systems set edition='2026', name='Age of Sigmar' where id='aos_3e';
update public.mini_systems set edition='2026', name='Star Wars: Legion' where id='sw_legion';

insert into public.mini_factions(system_id,name,subfaction)
select 'aos_3e', v.name, null
from (values
  ('Stormcast Eternals'),('Seraphon'),('Skaven'),('Flesh-eater Courts'),('Daughters of Khaine')
) v(name)
where not exists (
  select 1 from public.mini_factions f
  where f.system_id='aos_3e' and lower(f.name)=lower(v.name)
);

with units(faction_name,name) as (
  values
  ('Stormcast Eternals','Annihilators'),('Stormcast Eternals','Decimators'),('Stormcast Eternals','Protectors'),('Stormcast Eternals','Retributors'),('Stormcast Eternals','Vanguard-Palladors'),('Stormcast Eternals','Vanguard-Hunters'),('Stormcast Eternals','Krondys'),('Stormcast Eternals','Karazai'),('Stormcast Eternals','Stormdrake Guard'),('Stormcast Eternals','Knight-Draconis'),('Stormcast Eternals','Yndrasta, the Celestial Spear'),('Stormcast Eternals','Ionis Cryptborn'),('Stormcast Eternals','Lord-Imperatant'),('Stormcast Eternals','Knight-Vexillor'),('Stormcast Eternals','Praetors'),('Stormcast Eternals','Stormstrike Palladors'),('Stormcast Eternals','Vanguard-Raptors with Hurricane Crossbows'),
  ('Seraphon','Blessed Tetaxi'),('Seraphon','Skink Starseer'),('Seraphon','Skinks'),('Seraphon','Terradon Riders'),('Seraphon','Ripperdactyl Riders'),('Seraphon','Stegadon Chief'),('Seraphon','Stegadon'),('Seraphon','Aggradon Lancers'),('Seraphon','Kroxigor Warspawned'),('Seraphon','Saurus Warriors'),('Seraphon','Raptadon Chargers'),('Seraphon','Raptadon Hunters'),('Seraphon','Slann Starmaster'),('Seraphon','Saurus Scar-Veteran on Aggradon'),
  ('Skaven','Vizzik Skour'),('Skaven','Grey Seer Thanquol'),('Skaven','Warlock Galvaneer Grisk Volt-Klaw'),('Skaven','Warpvolt Scourgers'),('Skaven','Ratling Warpblaster'),('Skaven','Clanrats'),('Skaven','Stormvermin'),('Skaven','Tyrannical Packmaster'),
  ('Flesh-eater Courts','Abhorrant Gorewarden'),('Flesh-eater Courts','Crypt Flayers'),('Flesh-eater Courts','Crypt Horrors'),('Flesh-eater Courts','Royal Beastflayers'),('Flesh-eater Courts','Archregent'),('Flesh-eater Courts','Cryptguard'),
  ('Daughters of Khaine','Blood Hags')
)
insert into public.mini_units(faction_id,name,unit_type)
select f.id,u.name,'unit'
from units u join public.mini_factions f on f.system_id='aos_3e' and lower(f.name)=lower(u.faction_name)
where not exists(select 1 from public.mini_units mu where mu.faction_id=f.id and lower(mu.name)=lower(u.name));

insert into public.mini_factions(system_id,name,subfaction)
select 'sw_legion', v.name, null
from (values
  ('Galactic Empire'),('Rebel Alliance'),('Galactic Republic'),('Separatist Alliance'),('Mercenaries')
) v(name)
where not exists (
  select 1 from public.mini_factions f
  where f.system_id='sw_legion' and lower(f.name)=lower(v.name)
);

with units(faction_name,name) as (
  values
  ('Galactic Empire','Stormtroopers'),('Galactic Empire','Stormtrooper Riot Squad'),('Galactic Empire','Stromtroopers Heavy Response Unit'),('Galactic Empire','Snowtroopers'),('Galactic Empire','Shore Troopers'),('Galactic Empire','DF-90 Mortar Trooper'),('Galactic Empire','Scout Troopers'),('Galactic Empire','Scout Trooper Strike Team'),('Galactic Empire','Imperial Death Troopers'),('Galactic Empire','Imperial Special Forces'),('Galactic Empire','Imperial Special Forces- Inferno Squad'),('Galactic Empire','74-Z Speeder Bikes'),('Galactic Empire','E-Web Heavy Blaster Team'),('Galactic Empire','Dewback Rider'),('Galactic Empire','Range Troopers'),('Galactic Empire','AT-ST'),('Galactic Empire','GAVw Assault Tank'),('Galactic Empire','LAAT/le Patrol Transport'),('Galactic Empire','Imperial Dark Troopers'),
  ('Rebel Alliance','Mark II Medium Blaster'),('Rebel Alliance','Rebel Troopers'),('Rebel Alliance','Fleet Troopers'),('Rebel Alliance','Rebel Veterans'),('Rebel Alliance','Rebel Commandos'),('Rebel Alliance','Rebel Commandos, Strike Team'),('Rebel Alliance','Wookiee Warriors, Freedom Fighters'),('Rebel Alliance','Wookiee Warriors, Kashyyyk Resistance'),('Rebel Alliance','Mandalorian Resistance'),('Rebel Alliance','Mandalorian Resistance, Clan Wren'),('Rebel Alliance','Rebel Sleeper Cell'),('Rebel Alliance','AT-RT'),('Rebel Alliance','1.4FD Laser Cannon Team'),('Rebel Alliance','Taunttaun Riders'),('Rebel Alliance','T-47 Airspeeder'),('Rebel Alliance','X-34 Landspeeder'),('Rebel Alliance','A-A5 Speeder Truck'),('Rebel Alliance','Swoop Bike Riders'),('Rebel Alliance','Ewok Slingers'),('Rebel Alliance','Ewok Skirmishers'),
  ('Galactic Republic','Clone Trooper Infantry'),('Galactic Republic','Arc Troopers'),('Galactic Republic','Arc Troopers Strike Team'),('Galactic Republic','Wookiee Warriors, Kashyyyk Defenders'),('Galactic Republic','Wookiee Warriors, Noble Fighters'),('Galactic Republic','BARC Speeder'),('Galactic Republic','AT-RT'),('Galactic Republic','Raddaugh Gnasp Fluttercraft'),('Galactic Republic','Raddaugh Gnasp Fluttercraft, Attack Craft'),('Galactic Republic','Clone Commandos'),('Galactic Republic','Clone Commandos, Delta Squad'),('Galactic Republic','TX-130 Saber Tank'),('Galactic Republic','LAAT/le Patrol Transport'),('Galactic Republic','Infantry Support Platform'),('Galactic Republic','Swoop Bike Riders'),
  ('Separatist Alliance','DRK-1 Probe Droids'),('Separatist Alliance','B1 Battle Droids'),('Separatist Alliance','B2 Battle Droids'),('Separatist Alliance','Geonosian Warriors'),('Separatist Alliance','BX-Series Droid Commandos'),('Separatist Alliance','BX-Series Droid Commandos Strike Team'),('Separatist Alliance','IG-100 Magnaguard'),('Separatist Alliance','IG-100 Prototype Magnaguard'),('Separatist Alliance','Droidekas'),('Separatist Alliance','STAP Riders'),('Separatist Alliance','DSD1 Dward Spider Droid'),('Separatist Alliance','AAT Battle Tank'),('Separatist Alliance','Persuader Class Tank Droid'),('Separatist Alliance','Prototype Tank Droid'),('Separatist Alliance','Pyke Syndacite Foot Soldiers'),('Separatist Alliance','Pyke Syndacite Capo'),('Separatist Alliance','Black Sun Vigo'),('Separatist Alliance','Black Sun Enforcers'),
  ('Mercenaries','Pyke Syndacite Foot Soldiers'),('Mercenaries','Swoop Bike Riders'),('Mercenaries','Pyke Syndacite Capo'),('Mercenaries','Black Sun Vigo'),('Mercenaries','Black Sun Enforcers'),('Mercenaries','Gar Saxon'),('Mercenaries','Maul, A Rival'),('Mercenaries','Bossk'),('Mercenaries','Boba Fett'),('Mercenaries','Boba Fett, Daimyo'),('Mercenaries','Cad Bane'),('Mercenaries','IG-88'),('Mercenaries','IG-11'),('Mercenaries','Din Djarin'),('Mercenaries','Mandalorian Super Commandos'),('Mercenaries','A-A5 Speeder Truck'),('Mercenaries','Grogu')
)
insert into public.mini_units(faction_id,name,unit_type)
select f.id,u.name,'unit'
from units u join public.mini_factions f on f.system_id='sw_legion' and lower(f.name)=lower(u.faction_name)
where not exists(select 1 from public.mini_units mu where mu.faction_id=f.id and lower(mu.name)=lower(u.name));
