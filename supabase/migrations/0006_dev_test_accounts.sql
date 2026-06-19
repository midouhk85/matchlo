-- ════════════════════════════════════════════════════════════════
-- MATCHLO — Comptes de test (DEV uniquement)
-- Permet de se connecter par e-mail + mot de passe sans configurer de SMTP.
-- Mot de passe : matchlo123  ·  e-mails : test1@matchlo.app / test2@matchlo.app
-- ⚠️ À NE PAS exécuter en production. Pour la prod, activer l'OTP/SMTP.
-- ════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

with new_users as (
  select * from (values
    ('aaaaaaaa-0000-0000-0000-0000000000a1'::uuid, 'test1@matchlo.app'),
    ('aaaaaaaa-0000-0000-0000-0000000000a2'::uuid, 'test2@matchlo.app')
  ) as t(id, email)
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', n.id, 'authenticated', 'authenticated',
  n.email, crypt('matchlo123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', ''
from new_users n
on conflict (id) do update
  set encrypted_password = excluded.encrypted_password,
      email_confirmed_at = excluded.email_confirmed_at;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email in ('test1@matchlo.app','test2@matchlo.app')
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );
