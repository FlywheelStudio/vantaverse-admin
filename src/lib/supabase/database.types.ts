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
      account_deletions: {
        Row: {
          deleted_at: string
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          deleted_at?: string
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          deleted_at?: string
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      app_links: {
        Row: {
          created_at: string | null
          id: number
          slug: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          slug: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          slug?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          calendly_uri: string
          cancel_url: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          created_at: string | null
          end_time: string | null
          event_name: string | null
          event_uri: string | null
          id: number
          invitee_email: string | null
          invitee_name: string | null
          location_type: string | null
          location_value: string | null
          raw_payload: Json | null
          reschedule_url: string | null
          start_time: string | null
          status: string
          timezone: string | null
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendly_uri: string
          cancel_url?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          end_time?: string | null
          event_name?: string | null
          event_uri?: string | null
          id?: number
          invitee_email?: string | null
          invitee_name?: string | null
          location_type?: string | null
          location_value?: string | null
          raw_payload?: Json | null
          reschedule_url?: string | null
          start_time?: string | null
          status?: string
          timezone?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendly_uri?: string
          cancel_url?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          end_time?: string | null
          event_name?: string | null
          event_uri?: string | null
          id?: number
          invitee_email?: string | null
          invitee_name?: string | null
          location_type?: string | null
          location_value?: string | null
          raw_payload?: Json | null
          reschedule_url?: string | null
          start_time?: string | null
          status?: string
          timezone?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          last_updated_at: string | null
          name: string
          organization_id: string | null
          target_type: string
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          last_updated_at?: string | null
          name: string
          organization_id?: string | null
          target_type: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          last_updated_at?: string | null
          name?: string
          organization_id?: string | null
          target_type?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          button_label: string | null
          button_url: string | null
          content: string
          created_at: string | null
          id: string
          slug: string
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          button_label?: string | null
          button_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          slug: string
          subject?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          button_label?: string | null
          button_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          slug?: string
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_tracker: {
        Row: {
          created_at: string | null
          id: string
          sent_at: string
          template_slug: string | null
          trigger_key: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sent_at?: string
          template_slug?: string | null
          trigger_key: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sent_at?: string
          template_slug?: string | null
          trigger_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      empowerment_threshold: {
        Row: {
          base_power: number
          created_at: string | null
          effects: string | null
          id: number
          metadata: Json | null
          title: string
          top_power: number
          updated_at: string | null
        }
        Insert: {
          base_power: number
          created_at?: string | null
          effects?: string | null
          id?: number
          metadata?: Json | null
          title: string
          top_power: number
          updated_at?: string | null
        }
        Update: {
          base_power?: number
          created_at?: string | null
          effects?: string | null
          id?: number
          metadata?: Json | null
          title?: string
          top_power?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_tags: {
        Row: {
          created_at: string | null
          exercise_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string | null
          exercise_id: number
          tag_id: number
        }
        Update: {
          created_at?: string | null
          exercise_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_tags_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_tags_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_templates: {
        Row: {
          created_at: string | null
          distance: string | null
          distance_override: string[] | null
          exercise_id: number
          id: string
          notes: string | null
          rep: number | null
          rep_override: number[] | null
          rest_time: number | null
          rest_time_override: number[] | null
          sets: number | null
          template_hash: string
          tempo: string[] | null
          time: number | null
          time_override: number[] | null
          updated_at: string | null
          weight: string | null
          weight_override: string[] | null
        }
        Insert: {
          created_at?: string | null
          distance?: string | null
          distance_override?: string[] | null
          exercise_id: number
          id?: string
          notes?: string | null
          rep?: number | null
          rep_override?: number[] | null
          rest_time?: number | null
          rest_time_override?: number[] | null
          sets?: number | null
          template_hash: string
          tempo?: string[] | null
          time?: number | null
          time_override?: number[] | null
          updated_at?: string | null
          weight?: string | null
          weight_override?: string[] | null
        }
        Update: {
          created_at?: string | null
          distance?: string | null
          distance_override?: string[] | null
          exercise_id?: number
          id?: string
          notes?: string | null
          rep?: number | null
          rep_override?: number[] | null
          rest_time?: number | null
          rest_time_override?: number[] | null
          sets?: number | null
          template_hash?: string
          tempo?: string[] | null
          time?: number | null
          time_override?: number[] | null
          updated_at?: string | null
          weight?: string | null
          weight_override?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_templates_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_templates_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          exercise_id: number | null
          exercise_name: string
          id: number
          library_check_in_question: string | null
          library_tip: string | null
          match_score: number | null
          matched_library_exercise_name: string | null
          thumbnail_url: Json | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          video_type: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: number | null
          exercise_name: string
          id?: number
          library_check_in_question?: string | null
          library_tip?: string | null
          match_score?: number | null
          matched_library_exercise_name?: string | null
          thumbnail_url?: Json | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_type?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: number | null
          exercise_name?: string
          id?: number
          library_check_in_question?: string | null
          library_tip?: string | null
          match_score?: number | null
          matched_library_exercise_name?: string | null
          thumbnail_url?: Json | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_type?: string
          video_url?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string | null
          exercise_template_ids: string[] | null
          group_hash: string
          id: string
          is_superset: boolean | null
          note: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_template_ids?: string[] | null
          group_hash: string
          id?: string
          is_superset?: boolean | null
          note?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_template_ids?: string[] | null
          group_hash?: string
          id?: string
          is_superset?: boolean | null
          note?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      habit_contents: {
        Row: {
          content_1: string | null
          content_2_quiz: Json | null
          content_2_response: Json | null
          content_3: Json | null
          created_at: string | null
          email_content: string | null
          habit_id: number
          habit_secret: string
          id: number
          next_habit: number | null
          photo_url: Json | null
          stars: number | null
          type: string
          updated_at: string | null
          win_state: Json | null
        }
        Insert: {
          content_1?: string | null
          content_2_quiz?: Json | null
          content_2_response?: Json | null
          content_3?: Json | null
          created_at?: string | null
          email_content?: string | null
          habit_id: number
          habit_secret: string
          id?: number
          next_habit?: number | null
          photo_url?: Json | null
          stars?: number | null
          type: string
          updated_at?: string | null
          win_state?: Json | null
        }
        Update: {
          content_1?: string | null
          content_2_quiz?: Json | null
          content_2_response?: Json | null
          content_3?: Json | null
          created_at?: string | null
          email_content?: string | null
          habit_id?: number
          habit_secret?: string
          id?: number
          next_habit?: number | null
          photo_url?: Json | null
          stars?: number | null
          type?: string
          updated_at?: string | null
          win_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_contents_next_habit_fkey"
            columns: ["next_habit"]
            isOneToOne: false
            referencedRelation: "habit_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_contents_user: {
        Row: {
          confirmed_at: string | null
          content_id: number
          created_at: string | null
          due_date: string | null
          habit_id: number | null
          id: number
          response: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          content_id: number
          created_at?: string | null
          due_date?: string | null
          habit_id?: number | null
          id?: number
          response?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          content_id?: number
          created_at?: string | null
          due_date?: string | null
          habit_id?: number | null
          id?: number
          response?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_contents_user_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "habit_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_contents_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_contents_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_pledges: {
        Row: {
          created_at: string | null
          id: string
          photo: Json
          pledge: string
          signature: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo: Json
          pledge: string
          signature: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo?: Json
          pledge?: string
          signature?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_pledges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_pledges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      hp_level_thresholds: {
        Row: {
          created_at: string | null
          description: string
          hp_range_max: number | null
          hp_range_min: number
          hp_required_for_next_level: number | null
          id: string
          image_url: string | null
          level: number
          total_hp_at_level: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          hp_range_max?: number | null
          hp_range_min: number
          hp_required_for_next_level?: number | null
          id?: string
          image_url?: string | null
          level: number
          total_hp_at_level: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          hp_range_max?: number | null
          hp_range_min?: number
          hp_required_for_next_level?: number | null
          id?: string
          image_url?: string | null
          level?: number
          total_hp_at_level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      mc_intake_contents: {
        Row: {
          body: string
          created_at: string | null
          icon: string
          id: number
          source: string
          subtitle: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          icon: string
          id?: number
          source: string
          subtitle: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          icon?: string
          id?: number
          source?: string
          subtitle?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mc_intake_options: {
        Row: {
          content_id: number | null
          created_at: string | null
          icon: string | null
          icon_selected: string | null
          id: number
          step: Database["public"]["Enums"]["e_intake"]
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_id?: number | null
          created_at?: string | null
          icon?: string | null
          icon_selected?: string | null
          id?: number
          step: Database["public"]["Enums"]["e_intake"]
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_id?: number | null
          created_at?: string | null
          icon?: string | null
          icon_selected?: string | null
          id?: number
          step?: Database["public"]["Enums"]["e_intake"]
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc_intake_options_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "mc_intake_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      mc_intake_survey: {
        Row: {
          activity_level: number | null
          commitment_days: number | null
          commitment_minutes: number | null
          created_at: string | null
          health_conditions: number[] | null
          id: number
          occupation: string | null
          preconditions: boolean | null
          preconditions_details: string | null
          symptoms: number[] | null
          updated_at: string | null
          user_confirmed: boolean | null
          user_id: string
        }
        Insert: {
          activity_level?: number | null
          commitment_days?: number | null
          commitment_minutes?: number | null
          created_at?: string | null
          health_conditions?: number[] | null
          id?: number
          occupation?: string | null
          preconditions?: boolean | null
          preconditions_details?: string | null
          symptoms?: number[] | null
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id: string
        }
        Update: {
          activity_level?: number | null
          commitment_days?: number | null
          commitment_minutes?: number | null
          created_at?: string | null
          health_conditions?: number[] | null
          id?: number
          occupation?: string | null
          preconditions?: boolean | null
          preconditions_details?: string | null
          symptoms?: number[] | null
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mc_intake_survey_activity_level_fkey"
            columns: ["activity_level"]
            isOneToOne: false
            referencedRelation: "mc_intake_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc_intake_survey_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc_intake_survey_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message_id: string
          message_snapshot: string
          note: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message_id: string
          message_snapshot: string
          note?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message_id?: string
          message_snapshot?: string
          note?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reason_fkey"
            columns: ["reason"]
            isOneToOne: false
            referencedRelation: "message_reports_reasons"
            referencedColumns: ["code"]
          },
        ]
      }
      message_reports_reasons: {
        Row: {
          code: string
        }
        Insert: {
          code: string
        }
        Update: {
          code?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          chat_id: string
          content: string
          created_at: string | null
          id: string
          last_seen_at: string | null
          message_type: string
          metadata: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          message_type: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          message_type?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_statuses: {
        Row: {
          status: string
        }
        Insert: {
          status: string
        }
        Update: {
          status?: string
        }
        Relationships: []
      }
      notification_types: {
        Row: {
          type: string
        }
        Insert: {
          type: string
        }
        Update: {
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          error_message: string | null
          id: string
          metadata: Json
          notification_type: string
          read_at: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_type: string
          read_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          error_message?: string | null
          id?: string
          metadata?: Json
          notification_type?: string
          read_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          consultation_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_super_admin: boolean | null
          name: string
          picture_url: string | null
          screening_url: string | null
          updated_at: string | null
        }
        Insert: {
          consultation_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          name: string
          picture_url?: string | null
          screening_url?: string | null
          updated_at?: string | null
        }
        Update: {
          consultation_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          name?: string
          picture_url?: string | null
          screening_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions_roles: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["organization_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["organization_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
        }
        Relationships: [
          {
            foreignKeyName: "permissions_roles_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          created_at: string | null
          end_day: number | null
          id: number
          start_day: number
          title: string
          updated_at: string | null
          weekly_question_limit: number
        }
        Insert: {
          created_at?: string | null
          end_day?: number | null
          id?: number
          start_day: number
          title: string
          updated_at?: string | null
          weekly_question_limit: number
        }
        Update: {
          created_at?: string | null
          end_day?: number | null
          id?: number
          start_day?: number
          title?: string
          updated_at?: string | null
          weekly_question_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area_code: string | null
          avatar_url: string | null
          certificate_url: Json | null
          consultation_completed: boolean | null
          created_at: string | null
          description: string | null
          email: string | null
          email_notifications: boolean
          first_login: string | null
          first_name: string | null
          id: string
          intro_completed: boolean | null
          journey_phase: Database["public"]["Enums"]["journey_phase"] | null
          last_name: string | null
          last_sign_in: string | null
          loyalty_onboarded_at: string | null
          override_flag: string | null
          phone: string | null
          program_assigned: boolean | null
          program_due_date: string | null
          pushfire_subscriber_id: string | null
          screening_completed: boolean | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          area_code?: string | null
          avatar_url?: string | null
          certificate_url?: Json | null
          consultation_completed?: boolean | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean
          first_login?: string | null
          first_name?: string | null
          id: string
          intro_completed?: boolean | null
          journey_phase?: Database["public"]["Enums"]["journey_phase"] | null
          last_name?: string | null
          last_sign_in?: string | null
          loyalty_onboarded_at?: string | null
          override_flag?: string | null
          phone?: string | null
          program_assigned?: boolean | null
          program_due_date?: string | null
          pushfire_subscriber_id?: string | null
          screening_completed?: boolean | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          area_code?: string | null
          avatar_url?: string | null
          certificate_url?: Json | null
          consultation_completed?: boolean | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean
          first_login?: string | null
          first_name?: string | null
          id?: string
          intro_completed?: boolean | null
          journey_phase?: Database["public"]["Enums"]["journey_phase"] | null
          last_name?: string | null
          last_sign_in?: string | null
          loyalty_onboarded_at?: string | null
          override_flag?: string | null
          phone?: string | null
          program_assigned?: boolean | null
          program_due_date?: string | null
          pushfire_subscriber_id?: string | null
          screening_completed?: boolean | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_admins: {
        Row: {
          area_code: string | null
          avatar_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          email_notifications: boolean
          first_login: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_sign_in: string | null
          phone: string | null
          pushfire_subscriber_id: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          area_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean
          first_login?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          last_sign_in?: string | null
          phone?: string | null
          pushfire_subscriber_id?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          area_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          email_notifications?: boolean
          first_login?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_sign_in?: string | null
          phone?: string | null
          pushfire_subscriber_id?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_assignment: {
        Row: {
          acknowledged: boolean
          base: string | null
          completion: Json[] | null
          created_at: string | null
          end_date: string | null
          hijack_first_day_applied: boolean | null
          id: string
          organization_id: string | null
          patient_override: Json[] | null
          program_completed: boolean | null
          program_template_id: string
          schedule_offset: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          workout_schedule_id: string | null
        }
        Insert: {
          acknowledged?: boolean
          base?: string | null
          completion?: Json[] | null
          created_at?: string | null
          end_date?: string | null
          hijack_first_day_applied?: boolean | null
          id?: string
          organization_id?: string | null
          patient_override?: Json[] | null
          program_completed?: boolean | null
          program_template_id: string
          schedule_offset?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workout_schedule_id?: string | null
        }
        Update: {
          acknowledged?: boolean
          base?: string | null
          completion?: Json[] | null
          created_at?: string | null
          end_date?: string | null
          hijack_first_day_applied?: boolean | null
          id?: string
          organization_id?: string | null
          patient_override?: Json[] | null
          program_completed?: boolean | null
          program_template_id?: string
          schedule_offset?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workout_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_assignment_base_fkey"
            columns: ["base"]
            isOneToOne: false
            referencedRelation: "program_assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_base_fkey"
            columns: ["base"]
            isOneToOne: false
            referencedRelation: "program_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_workout_schedule_id_fkey"
            columns: ["workout_schedule_id"]
            isOneToOne: false
            referencedRelation: "workout_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      program_template: {
        Row: {
          active: boolean | null
          coming_soon_weeks: number
          created_at: string | null
          description: string | null
          goals: string | null
          id: string
          image_url: Json | null
          name: string
          notes: string | null
          organization_id: string | null
          updated_at: string | null
          weeks: number
        }
        Insert: {
          active?: boolean | null
          coming_soon_weeks?: number
          created_at?: string | null
          description?: string | null
          goals?: string | null
          id?: string
          image_url?: Json | null
          name: string
          notes?: string | null
          organization_id?: string | null
          updated_at?: string | null
          weeks: number
        }
        Update: {
          active?: boolean | null
          coming_soon_weeks?: number
          created_at?: string | null
          description?: string | null
          goals?: string | null
          id?: string
          image_url?: Json | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          updated_at?: string | null
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_template_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_emails_sent: {
        Row: {
          created_at: string | null
          id: number
          reminder_template_id: number
          sent_at: string
          sent_date: string
          user_id: string
          variant_index: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          reminder_template_id: number
          sent_at?: string
          sent_date?: string
          user_id: string
          variant_index: number
        }
        Update: {
          created_at?: string | null
          id?: number
          reminder_template_id?: number
          sent_at?: string
          sent_date?: string
          user_id?: string
          variant_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "reminder_emails_sent_reminder_template_id_fkey"
            columns: ["reminder_template_id"]
            isOneToOne: false
            referencedRelation: "reminder_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_emails_sent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_emails_sent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_templates: {
        Row: {
          button_text: string
          created_at: string | null
          footer: string
          header: string
          id: number
          message: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          subject: string
          time_slot: Database["public"]["Enums"]["time_slot"]
          trigger_at: string
          updated_at: string | null
        }
        Insert: {
          button_text: string
          created_at?: string | null
          footer: string
          header: string
          id?: number
          message: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          subject: string
          time_slot: Database["public"]["Enums"]["time_slot"]
          trigger_at: string
          updated_at?: string | null
        }
        Update: {
          button_text?: string
          created_at?: string | null
          footer?: string
          header?: string
          id?: number
          message?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          subject?: string
          time_slot?: Database["public"]["Enums"]["time_slot"]
          trigger_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reminder_user_config: {
        Row: {
          created_at: string | null
          id: number
          is_enabled: boolean
          mode: Database["public"]["Enums"]["reminder_type"]
          time_preference: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_enabled?: boolean
          mode: Database["public"]["Enums"]["reminder_type"]
          time_preference: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_enabled?: boolean
          mode?: Database["public"]["Enums"]["reminder_type"]
          time_preference?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_user_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_user_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_membership: {
        Row: {
          created_at: string | null
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_membership_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_schedules: {
        Row: {
          created_at: string | null
          exercise_template_counts: Json | null
          exercise_template_ids: string[] | null
          group_counts: Json | null
          group_ids: string[] | null
          id: string
          notes: string | null
          schedule: Json[] | null
          schedule_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_template_counts?: Json | null
          exercise_template_ids?: string[] | null
          group_counts?: Json | null
          group_ids?: string[] | null
          id?: string
          notes?: string | null
          schedule?: Json[] | null
          schedule_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_template_counts?: Json | null
          exercise_template_ids?: string[] | null
          group_counts?: Json | null
          group_ids?: string[] | null
          id?: string
          notes?: string | null
          schedule?: Json[] | null
          schedule_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      appointments_with_stats: {
        Row: {
          calendly_uri: string | null
          cancel_url: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          created_at: string | null
          end_time: string | null
          event_name: string | null
          event_uri: string | null
          id: number | null
          invitee_email: string | null
          invitee_name: string | null
          location_type: string | null
          location_value: string | null
          raw_payload: Json | null
          reschedule_url: string | null
          start_time: string | null
          status: string | null
          timezone: string | null
          type: Database["public"]["Enums"]["appointment_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calendly_uri?: string | null
          cancel_url?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          end_time?: string | null
          event_name?: string | null
          event_uri?: string | null
          id?: number | null
          invitee_email?: string | null
          invitee_name?: string | null
          location_type?: string | null
          location_value?: string | null
          raw_payload?: Json | null
          reschedule_url?: string | null
          start_time?: string | null
          status?: never
          timezone?: string | null
          type?: Database["public"]["Enums"]["appointment_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calendly_uri?: string | null
          cancel_url?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          end_time?: string | null
          event_name?: string | null
          event_uri?: string | null
          id?: number | null
          invitee_email?: string | null
          invitee_name?: string | null
          location_type?: string | null
          location_value?: string | null
          raw_payload?: Json | null
          reschedule_url?: string | null
          start_time?: string | null
          status?: never
          timezone?: string | null
          type?: Database["public"]["Enums"]["appointment_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises_with_stats: {
        Row: {
          assigned_count: number | null
          created_at: string | null
          exercise_id: number | null
          exercise_name: string | null
          id: number | null
          library_check_in_question: string | null
          library_tip: string | null
          match_score: number | null
          matched_library_exercise_name: string | null
          thumbnail_url: Json | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          assigned_count?: never
          created_at?: string | null
          exercise_id?: number | null
          exercise_name?: string | null
          id?: number | null
          library_check_in_question?: string | null
          library_tip?: string | null
          match_score?: number | null
          matched_library_exercise_name?: string | null
          thumbnail_url?: Json | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          assigned_count?: never
          created_at?: string | null
          exercise_id?: number | null
          exercise_name?: string | null
          id?: number | null
          library_check_in_question?: string | null
          library_tip?: string | null
          match_score?: number | null
          matched_library_exercise_name?: string | null
          thumbnail_url?: Json | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      habit_contents_user_with_status: {
        Row: {
          accumulated_stars: number | null
          confirmed_at: string | null
          content_id: number | null
          created_at: string | null
          due_date: string | null
          habit_id: number | null
          id: number | null
          response: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_contents_user_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "habit_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_contents_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_contents_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_with_stats: {
        Row: {
          attachments: Json | null
          chat_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
          last_seen_at: string | null
          message_type: string | null
          metadata: Json | null
          sender_avatar_url: string | null
          sender_first_name: string | null
          sender_id: string | null
          sender_is_admin: boolean | null
          sender_last_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_with_stats: {
        Row: {
          area_code: string | null
          avatar_url: string | null
          certificate_url: Json | null
          consultation_completed: boolean | null
          consultation_link: string | null
          created_at: string | null
          current_level: number | null
          current_phase: string | null
          description: string | null
          email: string | null
          email_notifications: boolean | null
          empowerment: number | null
          empowerment_base: number | null
          empowerment_metadata: Json | null
          empowerment_threshold: number | null
          empowerment_title: string | null
          empowerment_top: number | null
          first_name: string | null
          hp_historic: number | null
          hp_historic_tier: string | null
          hp_points: number | null
          hp_tier: string | null
          id: string | null
          intro_completed: boolean | null
          ip_tier: string | null
          journey_phase: Database["public"]["Enums"]["journey_phase"] | null
          last_name: string | null
          last_sign_in: string | null
          loyalty_status: string | null
          loyalty_updated_at: string | null
          max_gate_type: string | null
          max_gate_unlocked: number | null
          max_gates: number | null
          next_hp_level_percentage: number | null
          override_flag: string | null
          phone: string | null
          points_for_next_level: number | null
          program_acknowledged: boolean | null
          program_assigned: boolean | null
          program_assignment_id: string | null
          program_assignment_name: string | null
          program_completion_percentage: number | null
          program_due_date: string | null
          program_weeks: number | null
          screening_completed: boolean | null
          screening_link: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      program_with_stats: {
        Row: {
          acknowledged: boolean | null
          admin_avatar_url: string | null
          admin_description: string | null
          admin_full_name: string | null
          admin_id: string | null
          admin_name: string | null
          compliance: number | null
          id: string | null
          organization_id: string | null
          program_completed: boolean | null
          program_completion_percentage: number | null
          program_description: string | null
          program_end_date: string | null
          program_goal: string | null
          program_name: string | null
          program_start_date: string | null
          program_template_id: string | null
          total_weeks: number | null
          user_full_name: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_assignment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_program_template_id_fkey"
            columns: ["program_template_id"]
            isOneToOne: false
            referencedRelation: "program_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_user_config_groups: {
        Row: {
          mode: Database["public"]["Enums"]["reminder_type"] | null
          templates: Json | null
          time_preference: string | null
          timezone: string | null
          trigger_at: Json | null
          users: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      _calculate_total_sets_from_exercises: {
        Args: { p_day_exercises: Json }
        Returns: number
      }
      answer_check_in_question: {
        Args: { p_exercise_template_id: string }
        Returns: Json
      }
      broadcast_program_template_schedule_updated: {
        Args: { p_workout_schedule_id: string }
        Returns: undefined
      }
      broadcast_program_template_update: {
        Args: {
          p_data?: Json
          p_event: string
          p_program_assignment_id: string
          p_program_template_id: string
          p_user_id?: string
        }
        Returns: undefined
      }
      broadcast_user_channel: {
        Args: { p_event: string; p_payload?: Json; p_user_id: string }
        Returns: undefined
      }
      calculate_compliance: {
        Args: { p_program_assignment_id: string }
        Returns: number
      }
      collect_historic_loyalty: { Args: never; Returns: Json }
      collect_historic_loyalty_paginated: {
        Args: { p_page_size?: number; p_skip?: number }
        Returns: Json
      }
      complete_set: {
        Args: {
          p_date?: string
          p_mode?: string
          p_organization_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      delete_my_account: { Args: { reason?: string }; Returns: Json }
      delete_program: {
        Args: { p_program_assignment_id: string }
        Returns: Json
      }
      edit_exercise_template: {
        Args: {
          p_distance?: string
          p_distance_override?: string[]
          p_exercise_id: number
          p_notes?: string
          p_rep?: number
          p_rep_override?: number[]
          p_rest_time?: number
          p_rest_time_override?: number[]
          p_sets?: number
          p_template_id: string
          p_tempo?: string[]
          p_time?: number
          p_time_override?: number[]
          p_weight?: string
          p_weight_override?: string[]
        }
        Returns: Json
      }
      edit_group: {
        Args: {
          p_exercise_template_ids?: string[]
          p_group_id: string
          p_is_superset?: boolean
          p_note?: string
          p_title: string
        }
        Returns: Json
      }
      effective_profile_timezone: { Args: { p_tz: string }; Returns: string }
      ensure_pre_program_assignment: {
        Args: { p_start_date?: string; p_user_id: string }
        Returns: string
      }
      extract_schedule_references: {
        Args: { normalized_schedule: Json[] }
        Returns: Json
      }
      get_admin_filter_counts: { Args: never; Returns: Json }
      get_dashboard_analytics: {
        Args: {
          p_bucket?: string
          p_from?: string
          p_organization_ids?: string[]
          p_to?: string
        }
        Returns: Json
      }
      get_dashboard_needs_attention: {
        Args: { p_organization_ids?: string[] }
        Returns: Json
      }
      get_exercise_assignment_counts: { Args: never; Returns: Json }
      get_exercise_tags: {
        Args: { p_exercise_id: number }
        Returns: {
          category: string
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tags"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_habit_status: {
        Args: { due_date: string; response: string }
        Returns: string
      }
      get_member_filter_counts: { Args: never; Returns: Json }
      get_messages_paginated: {
        Args: {
          p_chat_id?: string
          p_page_size?: number
          p_skip?: number
        }
        Returns: Json
      }
      get_next_workout_date: {
        Args: {
          p_patient_override?: Json[]
          p_schedule?: Json[]
          p_schedule_offset?: number
          p_start_date?: string
          p_weeks?: number
        }
        Returns: string
      }
      get_onboarding_intake: { Args: never; Returns: Json }
      get_profiles_onboarding: { Args: never; Returns: Json }
      get_template_member_stats: {
        Args: { p_template_ids: string[] }
        Returns: {
          avg_completion: number
          members: number
          program_template_id: string
        }[]
      }
      get_user_organization_role: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["organization_role"]
      }
      get_user_super_admin_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["organization_role"]
      }
      get_weekly_detail_by_week: {
        Args: { week_number?: number }
        Returns: Json
      }
      get_wokouts_historic: { Args: never; Returns: Json }
      get_workouts_by_id: {
        Args: { p_date?: string; p_exercise_id: number }
        Returns: Json
      }
      get_workouts_by_program_day: {
        Args: { program_day: number }
        Returns: Json
      }
      handle_initial_page: { Args: never; Returns: Json }
      hijack_first_day_find_first_exercises: {
        Args: { p_schedule: Json[]; p_total_weeks: number }
        Returns: Json
      }
      hijack_first_day_set_override_cell: {
        Args: {
          p_day: number
          p_existing_override: Json[]
          p_total_weeks: number
          p_value: Json
          p_week: number
        }
        Returns: Json[]
      }
      hp_points_to_next_level: { Args: { p_balance: number }; Returns: number }
      is_pre_program_template_program_template: {
        Args: { p_program_template_id: string }
        Returns: boolean
      }
      list_admins_filtered: {
        Args: {
          p_joined?: string
          p_last_active?: string
          p_org_id?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status?: string
          p_team_id?: string
        }
        Returns: Json
      }
      list_exercises_filtered: {
        Args: {
          p_assignment?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_tag_ids?: number[]
          p_type?: string
        }
        Returns: Json
      }
      list_profiles_filtered: {
        Args: {
          p_due?: string
          p_joined?: string
          p_last_active?: string
          p_org_id?: string
          p_page?: number
          p_page_size?: number
          p_physiologist?: string
          p_program?: string
          p_role?: string
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status?: string
          p_team_id?: string
        }
        Returns: Json
      }
      list_tag_categories: {
        Args: never
        Returns: {
          category: string
        }[]
      }
      loyalty_acquire_token: {
        Args: { p_priority?: "sync_award" | "get_loyalty" | "retry" }
        Returns: Json
      }
      loyalty_circuit_breaker_record_failure: {
        Args: { p_open_after?: number }
        Returns: Json
      }
      loyalty_circuit_breaker_record_success: {
        Args: never
        Returns: undefined
      }
      loyalty_circuit_breaker_state: { Args: never; Returns: Json }
      loyalty_circuit_breaker_tick: { Args: never; Returns: undefined }
      loyalty_dedup_claim: {
        Args: {
          p_event_type: string
          p_idempotency_key: string
          p_user_id: string
        }
        Returns: Json
      }
      loyalty_dedup_complete: {
        Args: {
          p_error?: string
          p_event_type: string
          p_idempotency_key: string
          p_status?: "pending" | "completed" | "failed"
          p_user_id: string
        }
        Returns: undefined
      }
      loyalty_enqueue_event: {
        Args: {
          p_attributes?: Json
          p_event_type: string
          p_idempotency_key?: string
          p_sleep_seconds?: number
          p_user_id: string
        }
        Returns: number
      }
      loyalty_expect_session: {
        Args: {
          p_external_session_id: string
          p_ttl_seconds?: number
          p_user_id: string
        }
        Returns: undefined
      }
      loyalty_invoke_consume_queues: { Args: never; Returns: Json }
      loyalty_is_expected_session: {
        Args: { p_external_session_id: string; p_user_id: string }
        Returns: boolean
      }
      loyalty_program_start_date_iso: {
        Args: { p_start_date: string }
        Returns: string
      }
      loyalty_purge_expected_sessions: { Args: never; Returns: number }
      loyalty_queue_archive: {
        Args: { p_message_id: number; p_queue_name: string }
        Returns: boolean
      }
      loyalty_queue_read: {
        Args: { p_n: number; p_queue_name: string; p_sleep_seconds: number }
        Returns: Json
      }
      loyalty_queue_send: {
        Args: {
          p_message: Json
          p_queue_name: string
          p_sleep_seconds?: number
        }
        Returns: number
      }
      loyalty_refill_tokens: { Args: never; Returns: undefined }
      loyalty_start_of_day_iso: { Args: { p_user_id: string }; Returns: string }
      loyalty_start_of_week_iso: {
        Args: { p_user_id: string }
        Returns: string
      }
      loyalty_submit_event_async: {
        Args: {
          p_attributes?: Json
          p_event_type: string
          p_idempotency_key?: string
          p_user_id: string
        }
        Returns: Json
      }
      normalize_exercise_template_structure: {
        Args: {
          p_distance: string
          p_distance_override: string[]
          p_exercise_id: number
          p_rep: number
          p_rep_override: number[]
          p_rest_time: number
          p_rest_time_override: number[]
          p_sets: number
          p_tempo: string[]
          p_time: number
          p_time_override: number[]
          p_weight: string
          p_weight_override: string[]
        }
        Returns: Json
      }
      normalize_group_structure: {
        Args: {
          p_exercise_template_ids: string[]
          p_is_superset: boolean
          p_title: string
        }
        Returns: Json
      }
      normalize_schedule_structure: {
        Args: { schedule_input: Json }
        Returns: Json[]
      }
      process_habit: {
        Args: { p_response?: string; p_user_id?: string }
        Returns: Json
      }
      process_scheduled_notifications: { Args: never; Returns: Json }
      profile_consultation_link: {
        Args: { p_user_id: string }
        Returns: string
      }
      profile_local_date: {
        Args: { p_at?: string; p_tz: string }
        Returns: string
      }
      profile_screening_link: { Args: { p_user_id: string }; Returns: string }
      pushfire_archive_orphaned_queue_messages: { Args: never; Returns: Json }
      pushfire_archive_user_queue_messages: {
        Args: { p_user_id: string }
        Returns: Json
      }
      pushfire_enqueue_reset_tags: {
        Args: { p_user_id: string }
        Returns: Json
      }
      pushfire_enqueue_screening_upcoming: { Args: never; Returns: Json }
      pushfire_enqueue_tag_sync: {
        Args: { p_ops: Json; p_sleep_seconds?: number; p_user_id: string }
        Returns: number
      }
      pushfire_enqueue_unread_messages: { Args: never; Returns: Json }
      pushfire_enqueue_workflow_trigger: {
        Args: {
          p_sleep_seconds?: number
          p_user_id: string
          p_workflow_id?: string
          p_workflow_key?: string
        }
        Returns: number
      }
      pushfire_format_date: {
        Args: { p_timestamp: string; p_timezone: string }
        Returns: string
      }
      pushfire_format_time: {
        Args: { p_timestamp: string; p_timezone: string }
        Returns: string
      }
      pushfire_habit_step_counter: {
        Args: { p_content_type: string; p_habit_id: number }
        Returns: number
      }
      pushfire_invoke_consume_queues: { Args: never; Returns: Json }
      pushfire_invoke_cron_send_reminders_v2: { Args: never; Returns: Json }
      pushfire_queue_archive: {
        Args: { p_message_id: number; p_queue_name: string }
        Returns: boolean
      }
      pushfire_queue_read: {
        Args: { p_n: number; p_queue_name: string; p_sleep_seconds: number }
        Returns: Json
      }
      pushfire_queue_send: {
        Args: {
          p_message: Json
          p_queue_name: string
          p_sleep_seconds?: number
        }
        Returns: number
      }
      report_message: {
        Args: { p_message_id: string; p_note?: string; p_reason?: string }
        Returns: Json
      }
      reset_user_data: {
        Args: { hard_reset?: boolean; user_id_param?: string }
        Returns: Json
      }
      resolve_habit_email_content: {
        Args: { p_habit_id: number }
        Returns: string
      }
      run_email_triggers: { Args: never; Returns: Json }
      run_message_notification_emails: { Args: never; Returns: Json }
      search_tags: {
        Args: { p_category?: string; p_limit?: number; p_q?: string }
        Returns: {
          category: string
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tags"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      serve_daily_workout: {
        Args: {
          p_date?: string
          p_mode?: string
          p_organization_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      set_exercise_tags: {
        Args: { p_exercise_id: number; p_tag_ids?: number[] }
        Returns: Json
      }
      set_onboarding_state: {
        Args: { p_target: string; p_user_id: string }
        Returns: Json
      }
      sync_last_sign_in: { Args: never; Returns: undefined }
      sync_program_due_date_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      test_delete_appointment: {
        Args: { p_appointment_id: number }
        Returns: Json
      }
      test_insert_appointment: {
        Args: {
          p_start_time: string
          p_type: Database["public"]["Enums"]["appointment_type"]
          p_user_id: string
        }
        Returns: Json
      }
      test_mark_as_attended: {
        Args: { appointment_id_param: number }
        Returns: Json
      }
      test_mark_exercise_as_completed: {
        Args: { exercise_id_param: number; p_date?: string }
        Returns: Json
      }
      test_reschedule_appointment: {
        Args: {
          p_start_time: string
          p_type: Database["public"]["Enums"]["appointment_type"]
          p_user_id: string
        }
        Returns: Json
      }
      toggle_pushfire_email_notification: {
        Args: { p_force?: boolean }
        Returns: boolean
      }
      update_workout_schedule_references: {
        Args: { p_schedule_id: string }
        Returns: undefined
      }
      upsert_exercise_template: {
        Args: {
          p_distance?: string
          p_distance_override?: string[]
          p_exercise_id: number
          p_notes?: string
          p_rep?: number
          p_rep_override?: number[]
          p_rest_time?: number
          p_rest_time_override?: number[]
          p_sets?: number
          p_tempo?: string[]
          p_time?: number
          p_time_override?: number[]
          p_weight?: string
          p_weight_override?: string[]
        }
        Returns: Json
      }
      upsert_group: {
        Args: {
          p_exercise_template_ids?: string[]
          p_is_superset?: boolean
          p_note?: string
          p_title: string
        }
        Returns: Json
      }
      upsert_tag: {
        Args: { p_category: string; p_name: string }
        Returns: Json
      }
      upsert_workout_schedule: {
        Args: { p_notes?: string; p_schedule: Json }
        Returns: Json
      }
      url_encode: { Args: { p_text: string }; Returns: string }
      user_can_access_chat_folder: {
        Args: { p_object_name: string }
        Returns: boolean
      }
      user_can_manage_organization: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      user_has_admin_role: { Args: { p_user_id: string }; Returns: boolean }
      user_has_permission: {
        Args: {
          p_action: string
          p_organization_id: string
          p_resource: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_in_super_admin_org: { Args: { p_user_id: string }; Returns: boolean }
      user_max_gate: {
        Args: { p_user_id: string }
        Returns: {
          max_gate_type: string
          max_gate_unlocked: number
        }[]
      }
      uuid_generate_v4: { Args: never; Returns: string }
    }
    Enums: {
      appointment_type:
        | "onboarding_screening"
        | "onboarding_consultation"
        | "consultation"
        | "other"
      e_intake:
        | "preconditions"
        | "preconditions_details"
        | "symptoms"
        | "activity_level"
        | "commitment_days"
        | "commitment_minutes"
        | "health_conditions"
      journey_phase: "discovery" | "onboarding" | "scaffolding"
      organization_role: "admin" | "patient"
      reminder_type: "SoftMode" | "FocusMode" | "BeastMode"
      time_slot:
        | "morning"
        | "midday"
        | "afternoon"
        | "evening"
        | "weekend"
        | "vanta_choice"
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
    Enums: {
      appointment_type: [
        "onboarding_screening",
        "onboarding_consultation",
        "consultation",
        "other",
      ],
      e_intake: [
        "preconditions",
        "preconditions_details",
        "symptoms",
        "activity_level",
        "commitment_days",
        "commitment_minutes",
        "health_conditions",
      ],
      journey_phase: ["discovery", "onboarding", "scaffolding"],
      organization_role: ["admin", "patient"],
      reminder_type: ["SoftMode", "FocusMode", "BeastMode"],
      time_slot: [
        "morning",
        "midday",
        "afternoon",
        "evening",
        "weekend",
        "vanta_choice",
      ],
    },
  },
} as const
