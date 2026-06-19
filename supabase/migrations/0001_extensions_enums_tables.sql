-- ════════════════════════════════════════════════════════════════
-- MATCHLO — Phase 1 : extensions, enums et tables (cf. §7 du cahier)
-- ════════════════════════════════════════════════════════════════

-- Extensions pour le filtre par rayon (distance géographique)
create extension if not exists cube;
create extension if not exists earthdistance;

-- ── Rôles & sous-types ──
create type user_role          as enum ('talent', 'company', 'admin');
create type talent_type        as enum ('host', 'influencer');
create type mission_type        as enum ('onsite', 'influencer');
create type swipe_direction     as enum ('like', 'dislike', 'superlike');
create type mission_status       as enum ('proposed','accepted','awaiting_payment','in_progress','presence_confirmed','delivered','completed','disputed','cancelled');
create type moderation_status    as enum ('not_required','pending_admin','approved','rejected');
create type verification_status  as enum ('unverified','pending','verified','rejected');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text,
  wilaya text,
  latitude double precision,
  longitude double precision,
  languages text[],
  photo_url text,
  is_verified boolean default false,
  verification_status verification_status default 'unverified',
  created_at timestamptz default now()
);

create table talent_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  talent_type talent_type not null,
  birth_date date,
  gender text,
  bio text,
  height_cm int,
  experience_years int,
  event_types text[],
  daily_rate_dzd int,
  availability text[],
  social_handles jsonb,
  niches text[],
  deliverable_types text[],
  rate_per_post_dzd int,
  portfolio_urls text[]
);

create table company_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  legal_name text not null,
  sector text,
  description text,
  logo_url text,
  rc_number text not null,
  nif text not null,
  urgent_quota int default 0,
  direct_message_quota int default 0
);

create table missions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references profiles(id) on delete cascade,
  title text not null,
  mission_type mission_type not null,
  event_type text,
  wilaya text,
  latitude double precision,
  longitude double precision,
  start_date date,
  end_date date,
  positions int,
  pay_dzd int,
  required_profile jsonb,
  is_urgent boolean default false,
  status text default 'active',
  created_at timestamptz default now()
);

create table swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid references profiles(id) on delete cascade,
  mission_id uuid references missions(id) on delete cascade,
  target_talent_id uuid references profiles(id),
  direction swipe_direction not null,
  created_at timestamptz default now(),
  unique (swiper_id, mission_id, target_talent_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references missions(id) on delete cascade,
  talent_id uuid references profiles(id) on delete cascade,
  company_id uuid references profiles(id) on delete cascade,
  moderation_status moderation_status default 'not_required',
  created_at timestamptz default now(),
  unique (mission_id, talent_id)
);

create table contact_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references profiles(id) on delete cascade,
  talent_id uuid references profiles(id) on delete cascade,
  mission_id uuid references missions(id) on delete cascade,
  message text,
  status text default 'pending',
  created_at timestamptz default now(),
  unique (company_id, talent_id, mission_id)
);

create table engagements (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  status mission_status default 'proposed',
  presence_qr text,
  payment_confirmed_at timestamptz,
  payment_confirmed_by uuid references profiles(id),
  deliverable_proof text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id),
  body text,
  created_at timestamptz default now()
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete cascade,
  rater_id uuid references profiles(id),
  ratee_id uuid references profiles(id),
  stars int check (stars between 1 and 5),
  tags text[],
  comment text,
  created_at timestamptz default now()
);

create table verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  doc_url text,
  status verification_status default 'pending',
  reviewed_by uuid,
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  target_id uuid,
  reason text,
  details text,
  status text default 'open',
  created_at timestamptz default now()
);

create index idx_missions_status on missions(status);
create index idx_missions_wilaya on missions(wilaya);
create index idx_missions_company on missions(company_id);
create index idx_profiles_role on profiles(role);
create index idx_swipes_swiper on swipes(swiper_id);
create index idx_messages_match on messages(match_id, created_at);
create index idx_matches_talent on matches(talent_id);
create index idx_matches_company on matches(company_id);
