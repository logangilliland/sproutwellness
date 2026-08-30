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
      accounts: {
        Row: {
          balance: number
          id: string
          is_savings: boolean
          kind: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          is_savings?: boolean
          kind?: string
          name: string
          sort_order?: number
          user_id?: string
        }
        Update: {
          balance?: number
          id?: string
          is_savings?: boolean
          kind?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      change_log: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          summary: string
          user_id?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          location: string | null
          meeting_times: string | null
          name: string
          notes: string | null
          professor: string | null
          term: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          meeting_times?: string | null
          name: string
          notes?: string | null
          professor?: string | null
          term?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          meeting_times?: string | null
          name?: string
          notes?: string | null
          professor?: string | null
          term?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          date: string
          exercise_minutes: number
          id: string
          mood: number | null
          notes: string | null
          productivity_score: number | null
          user_id: string
          vape_free: boolean | null
          weed_night_only: boolean | null
        }
        Insert: {
          created_at?: string
          date?: string
          exercise_minutes?: number
          id?: string
          mood?: number | null
          notes?: string | null
          productivity_score?: number | null
          user_id?: string
          vape_free?: boolean | null
          weed_night_only?: boolean | null
        }
        Update: {
          created_at?: string
          date?: string
          exercise_minutes?: number
          id?: string
          mood?: number | null
          notes?: string | null
          productivity_score?: number | null
          user_id?: string
          vape_free?: boolean | null
          weed_night_only?: boolean | null
        }
        Relationships: []
      }
      day_scores: {
        Row: {
          breakdown: Json
          created_at: string
          date: string
          id: string
          overall_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          date: string
          id?: string
          overall_pct?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          date?: string
          id?: string
          overall_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          date: string
          end_date: string | null
          id: string
          is_milestone: boolean
          location: string | null
          notes: string | null
          time: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_date?: string | null
          id?: string
          is_milestone?: boolean
          location?: string | null
          notes?: string | null
          time?: string | null
          title: string
          type?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_date?: string | null
          id?: string
          is_milestone?: boolean
          location?: string | null
          notes?: string | null
          time?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string
          created_at: string
          current_value: number
          deadline: string | null
          description: string | null
          id: string
          name: string
          priority: number
          status: string
          target_value: number | null
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          priority?: number
          status?: string
          target_value?: number | null
          unit?: string | null
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          priority?: number
          status?: string
          target_value?: number | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id: string
          id?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          category: string
          created_at: string
          emoji: string
          frequency: string
          id: string
          name: string
          sort_order: number
          target_per_week: number
          user_id: string
          weight: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          emoji?: string
          frequency?: string
          id?: string
          name: string
          sort_order?: number
          target_per_week?: number
          user_id?: string
          weight?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          emoji?: string
          frequency?: string
          id?: string
          name?: string
          sort_order?: number
          target_per_week?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      point_activities: {
        Row: {
          category_id: string
          created_at: string
          date: string
          id: string
          points: number
          reason: string | null
          source: string
          title: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          date?: string
          id?: string
          points?: number
          reason?: string | null
          source?: string
          title: string
          user_id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          date?: string
          id?: string
          points?: number
          reason?: string | null
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "point_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      point_categories: {
        Row: {
          active: boolean
          created_at: string
          daily_target: number
          emoji: string
          id: string
          key: string
          label: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          daily_target?: number
          emoji?: string
          id?: string
          key: string
          label: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          daily_target?: number
          emoji?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_suggestions: {
        Row: {
          category_id: string
          created_at: string
          date: string
          id: string
          points: number
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          date?: string
          id?: string
          points?: number
          sort_order?: number
          title: string
          user_id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          date?: string
          id?: string
          points?: number
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_suggestions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "point_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          seeded: boolean
          settings: Json
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          seeded?: boolean
          settings?: Json
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          seeded?: boolean
          settings?: Json
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          name: string
          priority: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          priority?: number
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          priority?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          date: string | null
          done: boolean
          done_at: string | null
          id: string
          notes: string | null
          priority: number
          project_id: string | null
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          done?: boolean
          done_at?: string | null
          id?: string
          notes?: string | null
          priority?: number
          project_id?: string | null
          sort_order?: number
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          done?: boolean
          done_at?: string | null
          id?: string
          notes?: string | null
          priority?: number
          project_id?: string | null
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          id: string
          kind: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          kind?: string
          notes?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          kind?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_shifts: {
        Row: {
          created_at: string
          date: string
          earnings: number
          hours: number
          id: string
          miles: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          earnings?: number
          hours?: number
          id?: string
          miles?: number | null
          notes?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          earnings?: number
          hours?: number
          id?: string
          miles?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_life_os: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
