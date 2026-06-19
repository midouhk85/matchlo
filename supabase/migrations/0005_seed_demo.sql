-- ════════════════════════════════════════════════════════════════
-- MATCHLO — Seed de démonstration (entreprises + missions + talents hôtes)
-- Sert de données de démo pour peupler les decks (cf. §13 : seed = démo).
-- ════════════════════════════════════════════════════════════════
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111101','authenticated','authenticated','demo.eventpro@matchlo.app', now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111102','authenticated','authenticated','demo.salonalger@matchlo.app', now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111103','authenticated','authenticated','demo.brandagency@matchlo.app', now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222201','authenticated','authenticated','demo.amina@matchlo.app', now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222202','authenticated','authenticated','demo.sara@matchlo.app', now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222203','authenticated','authenticated','demo.yacine@matchlo.app', now(), now(), '{"provider":"email","providers":["email"]}','{}')
on conflict (id) do nothing;

insert into profiles (id, role, full_name, wilaya, latitude, longitude, is_verified, verification_status)
values
  ('11111111-1111-1111-1111-111111111101','company','EventPro Algérie','Alger',36.7538,3.0588,true,'verified'),
  ('11111111-1111-1111-1111-111111111102','company','Salon d''Alger','Alger',36.7000,3.2100,true,'verified'),
  ('11111111-1111-1111-1111-111111111103','company','Brand Agency DZ','Oran',35.6976,-0.6337,true,'verified')
on conflict (id) do nothing;

insert into company_profiles (profile_id, legal_name, sector, description, rc_number, nif)
values
  ('11111111-1111-1111-1111-111111111101','EventPro Algérie SARL','Événementiel','Agence d''événementiel premium à Alger.','16/00-1234567','000016001234567'),
  ('11111111-1111-1111-1111-111111111102','Société des Salons d''Alger','Salons & Foires','Organisateur de salons professionnels.','16/00-7654321','000016007654321'),
  ('11111111-1111-1111-1111-111111111103','Brand Agency DZ SARL','Marketing','Agence de marketing et activations de marque.','31/00-1122334','000031001122334')
on conflict (profile_id) do nothing;

insert into profiles (id, role, full_name, wilaya, latitude, longitude, languages, is_verified, verification_status)
values
  ('22222222-2222-2222-2222-222222222201','talent','Amina B.','Alger',36.7600,3.0500,array['Français','Arabe','Anglais'],true,'verified'),
  ('22222222-2222-2222-2222-222222222202','talent','Sara K.','Alger',36.7300,3.0900,array['Français','Arabe'],false,'unverified'),
  ('22222222-2222-2222-2222-222222222203','talent','Yacine M.','Oran',35.7000,-0.6300,array['Français','Arabe','Anglais'],true,'verified')
on conflict (id) do nothing;

insert into talent_profiles (profile_id, talent_type, birth_date, gender, bio, height_cm, experience_years, event_types, daily_rate_dzd, availability)
values
  ('22222222-2222-2222-2222-222222222201','host','1998-04-12','F','Hôtesse d''accueil expérimentée, salons et conférences.',172,4,array['Salon','Conférence','Concert'],8000,array['Semaine','Week-end']),
  ('22222222-2222-2222-2222-222222222202','host','2000-09-03','F','Souriante et dynamique, première expérience en accueil.',168,1,array['Salon','Soirée'],5000,array['Week-end']),
  ('22222222-2222-2222-2222-222222222203','host','1996-01-20','M','Agent d''accueil bilingue, événements sportifs et corporate.',182,6,array['Conférence','Sport','Corporate'],9000,array['Semaine','Week-end'])
on conflict (profile_id) do nothing;

insert into missions (company_id, title, mission_type, event_type, wilaya, latitude, longitude, start_date, end_date, positions, pay_dzd, required_profile, is_urgent, status)
values
  ('11111111-1111-1111-1111-111111111101','Hôtesses pour salon de l''automobile','onsite','Salon','Alger',36.7000,3.2100, current_date + 7, current_date + 9, 5, 7000, '{"langues":["Français","Arabe"],"experience_min":1,"genre":"F"}', true,'active'),
  ('11111111-1111-1111-1111-111111111102','Accueil conférence tech','onsite','Conférence','Alger',36.7538,3.0588, current_date + 14, current_date + 14, 3, 8000, '{"langues":["Français","Anglais"],"experience_min":2}', false,'active'),
  ('11111111-1111-1111-1111-111111111101','Staff concert open-air','onsite','Concert','Alger',36.7200,3.0400, current_date + 21, current_date + 21, 8, 6000, '{"langues":["Arabe"]}', false,'active'),
  ('11111111-1111-1111-1111-111111111103','Activation de marque centre commercial','onsite','Corporate','Oran',35.6976,-0.6337, current_date + 10, current_date + 12, 4, 7500, '{"langues":["Français","Arabe"],"experience_min":1}', true,'active')
on conflict do nothing;
