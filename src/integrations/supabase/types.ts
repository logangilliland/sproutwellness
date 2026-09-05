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
      assignment_steps: {
        Row: {
          assignment_id: string
          created_at: string
          done: boolean
          id: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          done?: boolean
          id?: string
          sort_order?: number
          title: string
          user_id?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          done?: boolean
          id?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_steps_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          canvas_id: string | null
          canvas_url: string | null
          class_id: string | null
          completed_on: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_minutes: number | null
          first_steps: Json
          id: string
          important: boolean
          is_large: boolean
          points: number
          points_awarded: number
          progress: number
          size: string
          source: string
          status: string
          term_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_id?: string | null
          canvas_url?: string | null
          class_id?: string | null
          completed_on?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          first_steps?: Json
          id?: string
          important?: boolean
          is_large?: boolean
          points?: number
          points_awarded?: number
          progress?: number
          size?: string
          source?: string
          status?: string
          term_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          canvas_id?: string | null
          canvas_url?: string | null
          class_id?: string | null
          completed_on?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          first_steps?: Json
          id?: string
          important?: boolean
          is_large?: boolean
          points?: number
          points_awarded?: number
          progress?: number
          size?: string
          source?: string
          status?: string
          term_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_connections: {
        Row: {
          access_token: string | null
          base_url: string
          canvas_user_id: string | null
          canvas_user_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          oauth_state: string | null
          refresh_token: string | null
          status: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          base_url: string
          canvas_user_id?: string | null
          canvas_user_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          oauth_state?: string | null
          refresh_token?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          access_token?: string | null
          base_url?: string
          canvas_user_id?: string | null
          canvas_user_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          oauth_state?: string | null
          refresh_token?: string | null
          status?: string
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
          canvas_course_id: string | null
          class_code: string | null
          color: string | null
          created_at: string
          id: string
          location: string | null
          meeting_times: string | null
          name: string
          notes: string | null
          professor: string | null
          term: string | null
          term_id: string | null
          user_id: string
        }
        Insert: {
          canvas_course_id?: string | null
          class_code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          location?: string | null
          meeting_times?: string | null
          name: string
          notes?: string | null
          professor?: string | null
          term?: string | null
          term_id?: string | null
          user_id?: string
        }
        Update: {
          canvas_course_id?: string | null
          class_code?: string | null
          color?: string | null
          created_at?: string
          id?: string
          location?: string | null
          meeting_times?: string | null
          name?: string
          notes?: string | null
          professor?: string | null
          term?: string | null
          term_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
        ]
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
      garden_plants: {
        Row: {
          breakdown: Json
          created_at: string
          date: string
          favorite: boolean
          id: string
          locked: boolean
          overall_pct: number
          perfect: boolean
          rarity: string
          species_key: string
          stage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          date: string
          favorite?: boolean
          id?: string
          locked?: boolean
          overall_pct?: number
          perfect?: boolean
          rarity: string
          species_key: string
          stage?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          date?: string
          favorite?: boolean
          id?: string
          locked?: boolean
          overall_pct?: number
          perfect?: boolean
          rarity?: string
          species_key?: string
          stage?: number
          updated_at?: string
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
      jobs: {
        Row: {
          created_at: string
          employer: string | null
          id: string
          is_primary: boolean
          location: string | null
          name: string
          pay_rate: number
          pay_type: string
          position: string | null
          sort_order: number
          start_date: string | null
          status: string
          typical_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employer?: string | null
          id?: string
          is_primary?: boolean
          location?: string | null
          name: string
          pay_rate?: number
          pay_type?: string
          position?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          typical_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          employer?: string | null
          id?: string
          is_primary?: boolean
          location?: string | null
          name?: string
          pay_rate?: number
          pay_type?: string
          position?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          typical_hours?: number | null
          updated_at?: string
          user_id?: string
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
          display_name: string | null
          id: string
          onboarded: boolean
          seeded: boolean
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          onboarded?: boolean
          seeded?: boolean
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          seeded?: boolean
          settings?: Json
          updated_at?: string
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
      school_terms: {
        Row: {
          archived: boolean
          created_at: string
          ends_on: string
          id: string
          name: string
          starts_on: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          ends_on: string
          id?: string
          name: string
          starts_on: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          ends_on?: string
          id?: string
          name?: string
          starts_on?: string
          user_id?: string
        }
        Relationships: []
      }
      school_todos: {
        Row: {
          class_id: string | null
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          notes: string | null
          points: number
          required: boolean
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          points?: number
          required?: boolean
          sort_order?: number
          title: string
          user_id?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          points?: number
          required?: boolean
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_todos_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
          job_id: string | null
          job_name: string | null
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
          job_id?: string | null
          job_name?: string | null
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
          job_id?: string | null
          job_name?: string | null
          miles?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      canvas_status: {
        Row: {
          base_url: string | null
          canvas_user_name: string | null
          created_at: string | null
          last_error: string | null
          last_sync_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          base_url?: string | null
          canvas_user_name?: string | null
          created_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          base_url?: string | null
          canvas_user_name?: string | null
          created_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      reset_sprout: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
