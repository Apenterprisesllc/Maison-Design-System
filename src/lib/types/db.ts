export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendant_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendant_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      attendants: {
        Row: {
          active: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          property_id: string | null
        }
        Insert: {
          active?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          property_id?: string | null
        }
        Update: {
          active?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_attachments: {
        Row: {
          booking_id: string
          caption: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          booking_id: string
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          storage_path: string
          uploaded_by: string
        }
        Update: {
          booking_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_attachments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_events: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          arrived_at: string | null
          assignee_name: string | null
          attendant_id: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string
          created_by: string | null
          duration_min: number
          guest_address: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_guest: boolean
          note: string | null
          price_cents: number
          property_id: string
          reference: string
          resident_snapshot: Json
          scheduled_at: string
          service_id: string
          service_snapshot: Json
          status: Database["public"]["Enums"]["booking_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          assignee_name?: string | null
          attendant_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string | null
          duration_min?: number
          guest_address?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_guest?: boolean
          note?: string | null
          price_cents: number
          property_id: string
          reference?: string
          resident_snapshot?: Json
          scheduled_at: string
          service_id: string
          service_snapshot?: Json
          status?: Database["public"]["Enums"]["booking_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          assignee_name?: string | null
          attendant_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string | null
          duration_min?: number
          guest_address?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_guest?: boolean
          note?: string | null
          price_cents?: number
          property_id?: string
          reference?: string
          resident_snapshot?: Json
          scheduled_at?: string
          service_id?: string
          service_snapshot?: Json
          status?: Database["public"]["Enums"]["booking_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "attendants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      property_review_state: {
        Row: {
          last_reviewed_at: string
          property_id: string
          super_admin_id: string
          updated_at: string
        }
        Insert: {
          last_reviewed_at?: string
          property_id: string
          super_admin_id: string
          updated_at?: string
        }
        Update: {
          last_reviewed_at?: string
          property_id?: string
          super_admin_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_review_state_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_review_state_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          payload: Json
          read_at: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          email: string
          full_name: string
          id: string
          must_change_password: boolean
          phone: string | null
          primary_property_id: string | null
          primary_track: Database["public"]["Enums"]["client_track"] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          full_name: string
          id: string
          must_change_password?: boolean
          phone?: string | null
          primary_property_id?: string | null
          primary_track?: Database["public"]["Enums"]["client_track"] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          full_name?: string
          id?: string
          must_change_password?: boolean
          phone?: string | null
          primary_property_id?: string | null
          primary_track?: Database["public"]["Enums"]["client_track"] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_property_id_fkey"
            columns: ["primary_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          active: boolean
          address: string | null
          city: string
          cover_image: string | null
          created_at: string
          id: string
          name: string
          slug: string
          unit_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city: string
          cover_image?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          unit_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string
          cover_image?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          unit_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          booking_id: string | null
          commission_status: Database["public"]["Enums"]["commission_status"]
          created_at: string
          id: string
          note: string | null
          property_id: string
          reference: string
          referred_name: string
          referred_phone: string
          referrer_id: string
          status: Database["public"]["Enums"]["referral_status"]
          suggested_service_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          commission_status?: Database["public"]["Enums"]["commission_status"]
          created_at?: string
          id?: string
          note?: string | null
          property_id: string
          reference?: string
          referred_name: string
          referred_phone: string
          referrer_id: string
          status?: Database["public"]["Enums"]["referral_status"]
          suggested_service_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          commission_status?: Database["public"]["Enums"]["commission_status"]
          created_at?: string
          id?: string
          note?: string | null
          property_id?: string
          reference?: string
          referred_name?: string
          referred_phone?: string
          referrer_id?: string
          status?: Database["public"]["Enums"]["referral_status"]
          suggested_service_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_suggested_service_id_fkey"
            columns: ["suggested_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          cadence: Database["public"]["Enums"]["service_cadence"]
          created_at: string
          description: string
          icon: string
          id: string
          kicker: string
          name: string
          photo_path: string | null
          price_cents: number
          property_id: string | null
          slug: string
          sort_order: number
          tone: Database["public"]["Enums"]["service_tone"]
          track: Database["public"]["Enums"]["client_track"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          cadence?: Database["public"]["Enums"]["service_cadence"]
          created_at?: string
          description: string
          icon: string
          id?: string
          kicker: string
          name: string
          photo_path?: string | null
          price_cents: number
          property_id?: string | null
          slug: string
          sort_order?: number
          tone?: Database["public"]["Enums"]["service_tone"]
          track: Database["public"]["Enums"]["client_track"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          cadence?: Database["public"]["Enums"]["service_cadence"]
          created_at?: string
          description?: string
          icon?: string
          id?: string
          kicker?: string
          name?: string
          photo_path?: string | null
          price_cents?: number
          property_id?: string | null
          slug?: string
          sort_order?: number
          tone?: Database["public"]["Enums"]["service_tone"]
          track?: Database["public"]["Enums"]["client_track"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_members: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          role: Database["public"]["Enums"]["unit_role"]
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["unit_role"]
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["unit_role"]
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_members_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          external_id: string
          floor: string
          id: string
          kind: Database["public"]["Enums"]["client_track"]
          notes: string | null
          property_id: string
          since: string
          status: Database["public"]["Enums"]["unit_status"]
          updated_at: string
          visits: number
        }
        Insert: {
          created_at?: string
          external_id: string
          floor: string
          id?: string
          kind: Database["public"]["Enums"]["client_track"]
          notes?: string | null
          property_id: string
          since?: string
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
          visits?: number
        }
        Update: {
          created_at?: string
          external_id?: string
          floor?: string
          id?: string
          kind?: Database["public"]["Enums"]["client_track"]
          notes?: string | null
          property_id?: string
          since?: string
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_property_new_counts: {
        Args: Record<PropertyKey, never>
        Returns: { property_id: string; new_count: number }[]
      }
      get_weekly_booking_counts: {
        Args: { p_start: string; p_end: string }
        Returns: { property_id: string; day: string; count: number }[]
      }
      is_manager_of: { Args: { p_property: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_unit_member: { Args: { p_unit: string }; Returns: boolean }
      mark_property_reviewed: { Args: { p_property_id: string }; Returns: void }
    }
    Enums: {
      attachment_kind: "before" | "after" | "incident" | "invoice" | "other"
      booking_status:
        | "scheduled"
        | "confirmed"
        | "enroute"
        | "active"
        | "closed"
        | "cancelled"
      client_track: "residential" | "commercial"
      commission_status: "pending" | "paid"
      notification_kind:
        | "booking_created"
        | "booking_status_changed"
        | "booking_cancelled"
        | "unit_invited"
        | "password_reset"
      referral_status:
        | "pending"
        | "contacted"
        | "booked"
        | "completed"
        | "declined"
      service_cadence:
        | "once"
        | "on_request"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "seasonal"
        | "nightly"
        | "per_event"
        | "per_visit"
        | "per_listing"
        | "project_based"
      service_tone: "ink" | "stone" | "wood"
      unit_role: "owner" | "tenant" | "manager" | "contact"
      unit_status: "active" | "paused"
      user_role: "super_admin" | "property_manager" | "resident" | "attendant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attachment_kind: ["before", "after", "incident", "invoice", "other"],
      booking_status: ["scheduled", "confirmed", "enroute", "active", "closed", "cancelled"],
      client_track: ["residential", "commercial"],
      commission_status: ["pending", "paid"],
      notification_kind: [
        "booking_created",
        "booking_status_changed",
        "booking_cancelled",
        "unit_invited",
        "password_reset",
      ],
      referral_status: ["pending", "contacted", "booked", "completed", "declined"],
      service_cadence: [
        "once",
        "on_request",
        "weekly",
        "monthly",
        "quarterly",
        "seasonal",
        "nightly",
        "per_event",
        "per_visit",
        "per_listing",
        "project_based",
      ],
      service_tone: ["ink", "stone", "wood"],
      unit_role: ["owner", "tenant", "manager", "contact"],
      unit_status: ["active", "paused"],
      user_role: ["super_admin", "property_manager", "resident", "attendant"],
    },
  },
} as const

// ── Hand-rolled aliases ────────────────────────────────────────────────────
// The rest of the codebase imports these named types directly. Keep them as
// thin aliases over the generated schema so renames in the DB stay visible
// here with a typecheck error.

export type PropertyRow = Database['public']['Tables']['properties']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type UnitRow = Database['public']['Tables']['units']['Row'];
export type UnitMemberRow = Database['public']['Tables']['unit_members']['Row'];
export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type AttendantRow = Database['public']['Tables']['attendants']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type BookingStatusEventRow = Database['public']['Tables']['booking_status_events']['Row'];
export type BookingAttachmentRow = Database['public']['Tables']['booking_attachments']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type AttendantMessageRow = Database['public']['Tables']['attendant_messages']['Row'];
export type PropertyReviewStateRow = Database['public']['Tables']['property_review_state']['Row'];
export type ReferralRow = Database['public']['Tables']['referrals']['Row'];
export type ReferralInsert = Database['public']['Tables']['referrals']['Insert'];
export type ReferralStatus = Database['public']['Enums']['referral_status'];
export type CommissionStatus = Database['public']['Enums']['commission_status'];

export type UserRole = Database['public']['Enums']['user_role'];
export type ClientTrack = Database['public']['Enums']['client_track'];
export type UnitMemberRole = Database['public']['Enums']['unit_role'];
export type UnitStatus = Database['public']['Enums']['unit_status'];
export type BookingStatus = Database['public']['Enums']['booking_status'];
export type ServiceCadence = Database['public']['Enums']['service_cadence'];
export type ServiceTone = Database['public']['Enums']['service_tone'];
export type AttachmentKind = Database['public']['Enums']['attachment_kind'];
export type NotificationKind = Database['public']['Enums']['notification_kind'];
