export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string | null }
        Insert: { blocker_id: string; blocked_id: string; created_at?: string | null }
        Update: Partial<Database["public"]["Tables"]["blocks"]["Insert"]>
        Relationships: []
      }
      escrows: {
        Row: {
          id: string
          engagement_id: string
          company_id: string
          talent_id: string
          amount_dzd: number
          provider: string
          checkout_id: string | null
          status: string
          created_at: string | null
          funded_at: string | null
          released_at: string | null
        }
        Insert: {
          id?: string
          engagement_id: string
          company_id: string
          talent_id: string
          amount_dzd: number
          provider?: string
          checkout_id?: string | null
          status?: string
          created_at?: string | null
          funded_at?: string | null
          released_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["escrows"]["Insert"]>
        Relationships: []
      }
      company_profiles: {
        Row: {
          description: string | null
          direct_message_quota: number | null
          legal_name: string
          logo_url: string | null
          nif: string
          profile_id: string
          rc_number: string
          sector: string | null
          urgent_quota: number | null
        }
        Insert: {
          description?: string | null
          direct_message_quota?: number | null
          legal_name: string
          logo_url?: string | null
          nif: string
          profile_id: string
          rc_number: string
          sector?: string | null
          urgent_quota?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["company_profiles"]["Insert"]>
        Relationships: []
      }
      contact_requests: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          message: string | null
          mission_id: string | null
          status: string | null
          talent_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          mission_id?: string | null
          status?: string | null
          talent_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["contact_requests"]["Insert"]>
        Relationships: []
      }
      engagements: {
        Row: {
          created_at: string | null
          deliverable_proof: string | null
          id: string
          match_id: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          presence_qr: string | null
          status: Database["public"]["Enums"]["mission_status"] | null
        }
        Insert: {
          created_at?: string | null
          deliverable_proof?: string | null
          id?: string
          match_id?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          presence_qr?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
        }
        Update: Partial<Database["public"]["Tables"]["engagements"]["Insert"]>
        Relationships: []
      }
      matches: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          mission_id: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"] | null
          talent_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"] | null
          talent_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          match_id: string | null
          sender_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          sender_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
        Relationships: []
      }
      missions: {
        Row: {
          company_id: string | null
          created_at: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_urgent: boolean | null
          latitude: number | null
          longitude: number | null
          mission_type: Database["public"]["Enums"]["mission_type"]
          pay_dzd: number | null
          positions: number | null
          required_profile: Json | null
          start_date: string | null
          status: string | null
          title: string
          wilaya: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_urgent?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mission_type: Database["public"]["Enums"]["mission_type"]
          pay_dzd?: number | null
          positions?: number | null
          required_profile?: Json | null
          start_date?: string | null
          status?: string | null
          title: string
          wilaya?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["missions"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          languages: string[] | null
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          verification_status: Database["public"]["Enums"]["verification_status"] | null
          wilaya: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          wilaya?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          engagement_id: string | null
          id: string
          ratee_id: string | null
          rater_id: string | null
          stars: number | null
          tags: string[] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          ratee_id?: string | null
          rater_id?: string | null
          stars?: number | null
          tags?: string[] | null
        }
        Update: Partial<Database["public"]["Tables"]["ratings"]["Insert"]>
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string | null
          reporter_id: string | null
          status: string | null
          target_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string | null
          target_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string | null
          direction: Database["public"]["Enums"]["swipe_direction"]
          id: string
          mission_id: string | null
          swiper_id: string | null
          target_talent_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          mission_id?: string | null
          swiper_id?: string | null
          target_talent_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["swipes"]["Insert"]>
        Relationships: []
      }
      talent_profiles: {
        Row: {
          availability: string[] | null
          bio: string | null
          birth_date: string | null
          daily_rate_dzd: number | null
          deliverable_types: string[] | null
          event_types: string[] | null
          experience_years: number | null
          gender: string | null
          height_cm: number | null
          niches: string[] | null
          portfolio_urls: string[] | null
          profile_id: string
          rate_per_post_dzd: number | null
          social_handles: Json | null
          talent_type: Database["public"]["Enums"]["talent_type"]
        }
        Insert: {
          availability?: string[] | null
          bio?: string | null
          birth_date?: string | null
          daily_rate_dzd?: number | null
          deliverable_types?: string[] | null
          event_types?: string[] | null
          experience_years?: number | null
          gender?: string | null
          height_cm?: number | null
          niches?: string[] | null
          portfolio_urls?: string[] | null
          profile_id: string
          rate_per_post_dzd?: number | null
          social_handles?: Json | null
          talent_type: Database["public"]["Enums"]["talent_type"]
        }
        Update: Partial<Database["public"]["Tables"]["talent_profiles"]["Insert"]>
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string | null
          doc_url: string | null
          id: string
          profile_id: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
        }
        Insert: {
          created_at?: string | null
          doc_url?: string | null
          id?: string
          profile_id?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
        }
        Update: Partial<Database["public"]["Tables"]["verifications"]["Insert"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      app_role: { Args: Record<string, never>; Returns: Database["public"]["Enums"]["user_role"] }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_match_member: { Args: { p_match_id: string }; Returns: boolean }
      get_company_deck: {
        Args: { p_mission_id: string; p_radius_km?: number; p_wilaya?: string }
        Returns: {
          availability: string[]
          bio: string
          daily_rate_dzd: number
          distance_km: number
          event_types: string[]
          experience_years: number
          full_name: string
          height_cm: number
          id: string
          is_verified: boolean
          languages: string[]
          latitude: number
          longitude: number
          photo_url: string
          talent_type: Database["public"]["Enums"]["talent_type"]
          wilaya: string
          niches: string[]
          social_handles: Json
          rate_per_post_dzd: number
          deliverable_types: string[]
          rating_avg: number
          rating_count: number
          rank_score: number
        }[]
      }
      check_in: { Args: { p_engagement_id: string; p_token: string }; Returns: Json }
      profile_rating: {
        Args: { p_id: string }
        Returns: { rating_avg: number; rating_count: number }[]
      }
      get_talent_deck: {
        Args: { p_radius_km?: number; p_wilaya?: string }
        Returns: Database["public"]["Tables"]["missions"]["Row"][]
      }
      process_swipe: {
        Args: {
          p_direction: Database["public"]["Enums"]["swipe_direction"]
          p_mission_id: string
          p_target_talent_id: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      mission_status:
        | "proposed" | "accepted" | "awaiting_payment" | "in_progress"
        | "presence_confirmed" | "delivered" | "completed" | "disputed" | "cancelled"
      mission_type: "onsite" | "influencer"
      moderation_status: "not_required" | "pending_admin" | "approved" | "rejected"
      swipe_direction: "like" | "dislike" | "superlike"
      talent_type: "host" | "influencer"
      user_role: "talent" | "company" | "admin"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
