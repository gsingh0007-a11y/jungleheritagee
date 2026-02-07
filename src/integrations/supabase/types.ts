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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          blocked_date: string
          booking_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reason: string
          room_id: string
        }
        Insert: {
          blocked_date: string
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason?: string
          room_id: string
        }
        Update: {
          blocked_date?: string
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_dates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          assigned_room_numbers: string[] | null
          base_price: number | null
          booking_reference: string
          check_in_date: string
          check_out_date: string
          created_at: string
          discount: number | null
          extras: number | null
          grand_total: number | null
          guest_country: string | null
          guest_email: string
          guest_name: string
          guest_phone: string | null
          id: string
          internal_notes: string | null
          is_enquiry_only: boolean
          num_adults: number
          num_children: number
          num_rooms: number
          package_id: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          room_category_id: string | null
          room_id: string | null
          source: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          taxes: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_room_numbers?: string[] | null
          base_price?: number | null
          booking_reference: string
          check_in_date: string
          check_out_date: string
          created_at?: string
          discount?: number | null
          extras?: number | null
          grand_total?: number | null
          guest_country?: string | null
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          internal_notes?: string | null
          is_enquiry_only?: boolean
          num_adults?: number
          num_children?: number
          num_rooms?: number
          package_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          room_category_id?: string | null
          room_id?: string | null
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          taxes?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_room_numbers?: string[] | null
          base_price?: number | null
          booking_reference?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          discount?: number | null
          extras?: number | null
          grand_total?: number | null
          guest_country?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          internal_notes?: string | null
          is_enquiry_only?: boolean
          num_adults?: number
          num_children?: number
          num_rooms?: number
          package_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          room_category_id?: string | null
          room_id?: string | null
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          taxes?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_category_id_fkey"
            columns: ["room_category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          responded_at: string | null
          subject: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          responded_at?: string | null
          subject?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          responded_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      experiences: {
        Row: {
          best_time: string | null
          created_at: string
          description: string | null
          display_order: number
          duration: string | null
          gallery_images: Json | null
          highlights: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          long_description: string | null
          name: string
          slug: string
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          best_time?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          gallery_images?: Json | null
          highlights?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name: string
          slug: string
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          best_time?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          gallery_images?: Json | null
          highlights?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name?: string
          slug?: string
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string
          category: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          alt_text: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          inclusions: Json | null
          is_active: boolean
          is_percentage: boolean
          name: string
          price_modifier: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          inclusions?: Json | null
          is_active?: boolean
          is_percentage?: boolean
          name: string
          price_modifier?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          inclusions?: Json | null
          is_active?: boolean
          is_percentage?: boolean
          name?: string
          price_modifier?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          occasion: string | null
          rating: number
          review_text: string
          reviewer_location: string | null
          reviewer_name: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          occasion?: string | null
          rating?: number
          review_text: string
          reviewer_location?: string | null
          reviewer_name: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          occasion?: string | null
          rating?: number
          review_text?: string
          reviewer_location?: string | null
          reviewer_name?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      room_categories: {
        Row: {
          amenities: Json | null
          base_occupancy: number
          base_price_per_night: number
          created_at: string
          description: string | null
          display_order: number
          extra_adult_price: number
          extra_child_price: number
          id: string
          images: Json | null
          is_active: boolean
          max_adults: number
          max_children: number
          name: string
          slug: string
          total_rooms: number
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          base_occupancy?: number
          base_price_per_night?: number
          created_at?: string
          description?: string | null
          display_order?: number
          extra_adult_price?: number
          extra_child_price?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          max_adults?: number
          max_children?: number
          name: string
          slug: string
          total_rooms?: number
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          base_occupancy?: number
          base_price_per_night?: number
          created_at?: string
          description?: string | null
          display_order?: number
          extra_adult_price?: number
          extra_child_price?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          max_adults?: number
          max_children?: number
          name?: string
          slug?: string
          total_rooms?: number
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          floor: number | null
          id: string
          is_active: boolean
          notes: string | null
          room_category_id: string
          room_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          room_category_id: string
          room_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          room_category_id?: string
          room_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_category_id_fkey"
            columns: ["room_category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      block_dates_for_booking: {
        Args: {
          _booking_id: string
          _check_in: string
          _check_out: string
          _room_id: string
        }
        Returns: undefined
      }
      check_room_availability: {
        Args: {
          _check_in: string
          _check_out: string
          _exclude_booking_id?: string
          _room_id: string
        }
        Returns: boolean
      }
      count_available_rooms: {
        Args: { _date: string; _room_category_id: string }
        Returns: number
      }
      get_available_rooms: {
        Args: {
          _check_in: string
          _check_out: string
          _room_category_id: string
        }
        Returns: {
          room_id: string
          room_number: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "staff" | "guest"
      booking_status:
        | "new_enquiry"
        | "enquiry_responded"
        | "quote_sent"
        | "booking_confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
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
      app_role: ["super_admin", "staff", "guest"],
      booking_status: [
        "new_enquiry",
        "enquiry_responded",
        "quote_sent",
        "booking_confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
    },
  },
} as const
