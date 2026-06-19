-- ════════════════════════════════════════════════════════════════
-- MATCHLO — RLS (cf. §7.1). RLS activée sur TOUTES les tables.
-- ════════════════════════════════════════════════════════════════

create or replace function public.app_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.is_match_member(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id and (m.talent_id = auth.uid() or m.company_id = auth.uid())
  )
$$;

alter table profiles enable row level security;
alter table talent_profiles enable row level security;
alter table company_profiles enable row level security;
alter table missions enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table contact_requests enable row level security;
alter table engagements enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;
alter table verifications enable row level security;
alter table reports enable row level security;

-- PROFILES : lecture authentifiée (decks/matchs/chat), écriture propre
create policy profiles_select_auth on profiles for select to authenticated using (true);
create policy profiles_insert_own on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy talent_select_auth on talent_profiles for select to authenticated using (true);
create policy talent_write_own on talent_profiles for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy company_select_auth on company_profiles for select to authenticated using (true);
create policy company_write_own on company_profiles for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- MISSIONS : lecture publique des actives ; écriture par le propriétaire (company)
-- NOTE : le durcissement "entreprise vérifiée uniquement" (§7.1) s'active avec
-- la console admin en Phase 2.
create policy missions_select_active on missions for select to authenticated using (status = 'active' or company_id = auth.uid());
create policy missions_insert_owner on missions for insert to authenticated with check (company_id = auth.uid() and app_role() = 'company');
create policy missions_update_owner on missions for update to authenticated using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy missions_delete_owner on missions for delete to authenticated using (company_id = auth.uid());

create policy swipes_insert_own on swipes for insert to authenticated with check (swiper_id = auth.uid());
create policy swipes_select_own on swipes for select to authenticated using (swiper_id = auth.uid());

create policy matches_select_members on matches for select to authenticated using (talent_id = auth.uid() or company_id = auth.uid());

create policy cr_select_parties on contact_requests for select to authenticated using (company_id = auth.uid() or talent_id = auth.uid());
create policy cr_insert_company on contact_requests for insert to authenticated with check (company_id = auth.uid() and app_role() = 'company');
create policy cr_update_talent on contact_requests for update to authenticated using (talent_id = auth.uid()) with check (talent_id = auth.uid());

create policy eng_select_members on engagements for select to authenticated using (is_match_member(match_id));
create policy eng_update_members on engagements for update to authenticated using (is_match_member(match_id)) with check (is_match_member(match_id));

-- MESSAGES : deux membres du match ET gate de modération
create policy messages_select_gate on messages for select to authenticated using (
  is_match_member(match_id)
  and exists (select 1 from matches m where m.id = match_id and m.moderation_status in ('not_required','approved'))
);
create policy messages_insert_gate on messages for insert to authenticated with check (
  sender_id = auth.uid()
  and is_match_member(match_id)
  and exists (select 1 from matches m where m.id = match_id and m.moderation_status in ('not_required','approved'))
);

create policy ratings_select_auth on ratings for select to authenticated using (true);
create policy ratings_insert_own on ratings for insert to authenticated with check (rater_id = auth.uid());

-- VERIFICATIONS : doc privé → propriétaire (statut) + admin
create policy verif_select_own_or_admin on verifications for select to authenticated using (profile_id = auth.uid() or is_admin());
create policy verif_insert_own on verifications for insert to authenticated with check (profile_id = auth.uid());
create policy verif_update_admin on verifications for update to authenticated using (is_admin()) with check (is_admin());

-- REPORTS : signalement par le reporter ; lecture réservée admin
create policy reports_insert_own on reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_select_admin on reports for select to authenticated using (is_admin());
create policy reports_update_admin on reports for update to authenticated using (is_admin()) with check (is_admin());
