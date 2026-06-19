import { supabase } from './supabase';
import type { SwipeDir } from '@/components/SwipeDeck';

export interface SwipeResult {
  matched: boolean;
  match_id?: string;
  moderation_status?: 'not_required' | 'pending_admin' | 'approved' | 'rejected';
  mission_type?: 'onsite' | 'influencer';
}

/** Appelle le RPC serveur process_swipe (§8) et renvoie le résultat typé. */
export async function processSwipe(
  missionId: string,
  targetTalentId: string | null,
  direction: SwipeDir,
): Promise<SwipeResult> {
  const { data, error } = await supabase.rpc('process_swipe', {
    p_mission_id: missionId,
    p_target_talent_id: targetTalentId,
    p_direction: direction,
  });
  if (error) throw error;
  return (data as unknown as SwipeResult) ?? { matched: false };
}

/** Deck talent : annonces filtrées (wilaya + rayon). */
export async function fetchTalentDeck(wilaya: string | null, radiusKm: number | null) {
  const { data, error } = await supabase.rpc('get_talent_deck', {
    p_wilaya: wilaya ?? undefined,
    p_radius_km: radiusKm ?? undefined,
  });
  if (error) throw error;
  return data ?? [];
}

/** Deck entreprise : talents pour une annonce (wilaya + rayon). */
export async function fetchCompanyDeck(missionId: string, wilaya: string | null, radiusKm: number | null) {
  const { data, error } = await supabase.rpc('get_company_deck', {
    p_mission_id: missionId,
    p_wilaya: wilaya ?? undefined,
    p_radius_km: radiusKm ?? undefined,
  });
  if (error) throw error;
  return data ?? [];
}
