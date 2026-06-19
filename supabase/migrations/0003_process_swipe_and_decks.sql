-- ════════════════════════════════════════════════════════════════
-- MATCHLO — Matching serveur (§8) + decks avec filtre rayon
-- ════════════════════════════════════════════════════════════════

create or replace function public.process_swipe(
  p_mission_id uuid,
  p_target_talent_id uuid,
  p_direction swipe_direction
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_swiper uuid := auth.uid();
  v_role user_role;
  v_mission missions%rowtype;
  v_reciprocal boolean := false;
  v_talent uuid;
  v_company uuid;
  v_mtype mission_type;
  v_modstatus moderation_status;
  v_match_id uuid;
  v_existing uuid;
begin
  if v_swiper is null then raise exception 'non authentifié'; end if;

  select role into v_role from profiles where id = v_swiper;
  select * into v_mission from missions where id = p_mission_id;
  if v_mission.id is null then raise exception 'mission introuvable'; end if;
  v_mtype := v_mission.mission_type;

  insert into swipes (swiper_id, mission_id, target_talent_id, direction)
  values (v_swiper, p_mission_id, p_target_talent_id, p_direction)
  on conflict (swiper_id, mission_id, target_talent_id)
  do update set direction = excluded.direction, created_at = now();

  if p_direction = 'dislike' then return jsonb_build_object('matched', false); end if;

  if v_role = 'talent' then
    v_talent := v_swiper;
    v_company := v_mission.company_id;
    select exists (
      select 1 from swipes s
      where s.swiper_id = v_company and s.mission_id = p_mission_id
        and s.target_talent_id = v_talent and s.direction in ('like','superlike')
    ) into v_reciprocal;
  else
    v_talent := p_target_talent_id;
    v_company := v_swiper;
    select exists (
      select 1 from swipes s
      where s.swiper_id = v_talent and s.mission_id = p_mission_id
        and s.target_talent_id is null and s.direction in ('like','superlike')
    ) into v_reciprocal;
  end if;

  if not v_reciprocal then return jsonb_build_object('matched', false); end if;

  v_modstatus := case when v_mtype = 'influencer' then 'pending_admin' else 'not_required' end;

  select id into v_existing from matches where mission_id = p_mission_id and talent_id = v_talent;
  if v_existing is not null then
    v_match_id := v_existing;
  else
    insert into matches (mission_id, talent_id, company_id, moderation_status)
    values (p_mission_id, v_talent, v_company, v_modstatus)
    returning id into v_match_id;
    insert into engagements (match_id, status) values (v_match_id, 'proposed');
  end if;

  return jsonb_build_object('matched', true, 'match_id', v_match_id,
    'moderation_status', v_modstatus, 'mission_type', v_mtype);
end;
$$;

create or replace function public.get_talent_deck(p_wilaya text default null, p_radius_km numeric default null)
returns setof missions language sql stable security definer set search_path = public as $$
  with me as (select latitude, longitude from profiles where id = auth.uid())
  select m.* from missions m, me
  where m.status = 'active' and m.company_id <> auth.uid()
    and not exists (select 1 from swipes s where s.swiper_id = auth.uid() and s.mission_id = m.id and s.target_talent_id is null)
    and (p_wilaya is null or m.wilaya = p_wilaya)
    and (p_radius_km is null or m.latitude is null or m.longitude is null or me.latitude is null or me.longitude is null
         or earth_distance(ll_to_earth(me.latitude, me.longitude), ll_to_earth(m.latitude, m.longitude)) <= p_radius_km * 1000)
  order by m.is_urgent desc, m.created_at desc;
$$;

create or replace function public.get_company_deck(p_mission_id uuid, p_wilaya text default null, p_radius_km numeric default null)
returns table (
  id uuid, full_name text, wilaya text, photo_url text, is_verified boolean,
  latitude double precision, longitude double precision, talent_type talent_type,
  bio text, height_cm int, experience_years int, event_types text[],
  daily_rate_dzd int, availability text[], languages text[], distance_km numeric
) language sql stable security definer set search_path = public as $$
  with mission as (select * from missions where id = p_mission_id)
  select p.id, p.full_name, p.wilaya, p.photo_url, p.is_verified, p.latitude, p.longitude,
         tp.talent_type, tp.bio, tp.height_cm, tp.experience_years, tp.event_types,
         tp.daily_rate_dzd, tp.availability, p.languages,
         case when p.latitude is null or mission.latitude is null then null
              else round((earth_distance(ll_to_earth(mission.latitude, mission.longitude),
                                         ll_to_earth(p.latitude, p.longitude)) / 1000)::numeric, 1) end as distance_km
  from profiles p
  join talent_profiles tp on tp.profile_id = p.id
  cross join mission
  where p.role = 'talent' and tp.talent_type = 'host'
    and not exists (select 1 from swipes s where s.swiper_id = auth.uid() and s.mission_id = p_mission_id and s.target_talent_id = p.id)
    and (p_wilaya is null or p.wilaya = p_wilaya)
    and (p_radius_km is null or p.latitude is null or p.longitude is null or mission.latitude is null or mission.longitude is null
         or earth_distance(ll_to_earth(mission.latitude, mission.longitude), ll_to_earth(p.latitude, p.longitude)) <= p_radius_km * 1000)
  order by p.is_verified desc, p.created_at desc;
$$;

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table matches;

-- Restreint l'exécution aux utilisateurs authentifiés
revoke execute on function public.app_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_match_member(uuid) from public, anon;
revoke execute on function public.get_talent_deck(text, numeric) from public, anon;
revoke execute on function public.get_company_deck(uuid, text, numeric) from public, anon;
revoke execute on function public.process_swipe(uuid, uuid, swipe_direction) from public, anon;
grant execute on function public.app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_match_member(uuid) to authenticated;
grant execute on function public.get_talent_deck(text, numeric) to authenticated;
grant execute on function public.get_company_deck(uuid, text, numeric) to authenticated;
grant execute on function public.process_swipe(uuid, uuid, swipe_direction) to authenticated;
