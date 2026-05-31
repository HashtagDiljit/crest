export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          username: string | null;
          level: number;
          xp: number;
          streak_current: number;
          streak_best: number;
          theme: string | null;
          accent_colour: string | null;
          created_at: string;
          notification_preferences: Json | null;
          weight_unit: string | null;
          distance_unit: string | null;
          time_format: string | null;
          week_starts: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          level?: number;
          xp?: number;
          streak_current?: number;
          streak_best?: number;
          theme?: string | null;
          accent_colour?: string | null;
          created_at?: string;
          notification_preferences?: Json | null;
          weight_unit?: string | null;
          distance_unit?: string | null;
          time_format?: string | null;
          week_starts?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          level?: number;
          xp?: number;
          streak_current?: number;
          streak_best?: number;
          theme?: string | null;
          accent_colour?: string | null;
          created_at?: string;
          notification_preferences?: Json | null;
          weight_unit?: string | null;
          distance_unit?: string | null;
          time_format?: string | null;
          week_starts?: string | null;
          avatar_url?: string | null;
        };
      };
      workout_sessions: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          xp_earned?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          xp_earned?: number;
        };
      };
      workout_templates: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          icon_colour: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          icon_colour?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          icon_colour?: string | null;
        };
      };
      exercises: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          category: string | null;
          muscle_primary: string | null;
          muscle_secondary: string[] | null;
          equipment: string | null;
          is_custom: boolean;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          muscle_primary?: string | null;
          muscle_secondary?: string[] | null;
          equipment?: string | null;
          is_custom?: boolean;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          muscle_primary?: string | null;
          muscle_secondary?: string[] | null;
          equipment?: string | null;
          is_custom?: boolean;
          user_id?: string | null;
        };
      };
      template_exercises: {
        Relationships: [];
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          sets_target: number | null;
          reps_target: number | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id: string;
          sets_target?: number | null;
          reps_target?: number | null;
          order_index: number;
        };
        Update: {
          id?: string;
          template_id?: string;
          exercise_id?: string;
          sets_target?: number | null;
          reps_target?: number | null;
          order_index?: number;
        };
      };
      session_sets: {
        Relationships: [];
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg: number | null;
          reps: number | null;
          rpe: number | null;
          completed_at: string;
          set_type: "warmup" | "working" | "dropset" | "failure";
          superset_group_id: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          completed_at?: string;
          set_type?: "warmup" | "working" | "dropset" | "failure";
          superset_group_id?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          set_number?: number;
          weight_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          completed_at?: string;
          set_type?: "warmup" | "working" | "dropset" | "failure";
          superset_group_id?: string | null;
        };
      };
      habits: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          frequency: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          frequency?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          frequency?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
      };
      habit_logs: {
        Relationships: [];
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          logged_date: string;
          completed: boolean;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          logged_date: string;
          completed?: boolean;
        };
        Update: {
          id?: string;
          habit_id?: string;
          user_id?: string;
          logged_date?: string;
          completed?: boolean;
        };
      };
      sleep_logs: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          duration_hrs: number | null;
          quality_score: number | null;
          bedtime: string | null;
          wake_time: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          duration_hrs?: number | null;
          quality_score?: number | null;
          bedtime?: string | null;
          wake_time?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          duration_hrs?: number | null;
          quality_score?: number | null;
          bedtime?: string | null;
          wake_time?: string | null;
        };
      };
      mood_logs: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          score: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          score?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          score?: number | null;
          note?: string | null;
        };
      };
      health_metrics: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          metric_type: string;
          value: number;
          unit: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          metric_type: string;
          value: number;
          unit?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          metric_type?: string;
          value?: number;
          unit?: string | null;
        };
      };
      journal_entries: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          body: string;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          body: string;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          body?: string;
          tags?: string[] | null;
        };
      };
      goals: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string | null;
          target_date: string | null;
          progress: number;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string | null;
          target_date?: string | null;
          progress?: number;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string | null;
          target_date?: string | null;
          progress?: number;
          completed_at?: string | null;
        };
      };
      goal_milestones: {
        Relationships: [];
        Row: {
          id: string;
          goal_id: string;
          title: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          goal_id: string;
          title: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          goal_id?: string;
          title?: string;
          completed_at?: string | null;
        };
      };
      achievements: {
        Relationships: [];
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          tier: string | null;
          xp_reward: number;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          tier?: string | null;
          xp_reward?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          tier?: string | null;
          xp_reward?: number;
        };
      };
      user_achievements: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
      };
      personal_records: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          pr_type: string;
          weight_kg: number | null;
          reps: number | null;
          achieved_at: string;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          pr_type: string;
          weight_kg?: number | null;
          reps?: number | null;
          achieved_at?: string;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          pr_type?: string;
          weight_kg?: number | null;
          reps?: number | null;
          achieved_at?: string;
          session_id?: string | null;
        };
      };
      readiness_logs: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          score: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          score: number;
          note?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          score?: number;
          note?: string | null;
        };
      };
      body_measurements: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          weight_kg: number | null;
          neck_cm: number | null;
          forearm_cm: number | null;
          calf_cm: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          shoulders_cm: number | null;
          upper_arm_cm: number | null;
          steps: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          weight_kg?: number | null;
          neck_cm?: number | null;
          forearm_cm?: number | null;
          calf_cm?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          shoulders_cm?: number | null;
          upper_arm_cm?: number | null;
          steps?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          weight_kg?: number | null;
          neck_cm?: number | null;
          forearm_cm?: number | null;
          calf_cm?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          shoulders_cm?: number | null;
          upper_arm_cm?: number | null;
          steps?: number | null;
        };
      };
      soreness_logs: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          muscle_group: string;
          severity: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          muscle_group: string;
          severity: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          muscle_group?: string;
          severity?: string;
        };
      };
      nutrition_logs: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          meal_name: string | null;
          protein_g: number | null;
          food_preset: string | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          meal_name?: string | null;
          protein_g?: number | null;
          food_preset?: string | null;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          meal_name?: string | null;
          protein_g?: number | null;
          food_preset?: string | null;
          notes?: string | null;
          logged_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
