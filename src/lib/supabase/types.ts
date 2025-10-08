export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          goal_words_per_day: number | null;
          deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          goal_words_per_day?: number | null;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          goal_words_per_day?: number | null;
          deadline?: string | null;
          created_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      scenes: {
        Row: {
          id: string;
          chapter_id: string;
          title: string;
          order_index: number;
          content: string;
          word_count: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          title: string;
          order_index: number;
          content?: string;
          word_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          title?: string;
          order_index?: number;
          content?: string;
          word_count?: number;
          updated_at?: string;
        };
      };
      stats_daily: {
        Row: {
          id: string;
          project_id: string;
          date: string;
          words_written: number;
          streak: number;
        };
        Insert: {
          id?: string;
          project_id: string;
          date: string;
          words_written: number;
          streak?: number;
        };
        Update: {
          id?: string;
          project_id?: string;
          date?: string;
          words_written?: number;
          streak?: number;
        };
      };
      embeddings: {
        Row: {
          id: string;
          project_id: string;
          scene_id: string | null;
          chunk_text: string;
          embedding: number[];
        };
        Insert: {
          id?: string;
          project_id: string;
          scene_id?: string | null;
          chunk_text: string;
          embedding: number[];
        };
        Update: {
          id?: string;
          project_id?: string;
          scene_id?: string | null;
          chunk_text?: string;
          embedding?: number[];
        };
      };
      reviews: {
        Row: {
          id: string;
          project_id: string;
          scene_id: string | null;
          scope: string | null;
          model_used: string | null;
          summary: Json | null;
          critiques: Json | null;
          strengths: Json | null;
          challenge: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          scene_id?: string | null;
          scope?: string | null;
          model_used?: string | null;
          summary?: Json | null;
          critiques?: Json | null;
          strengths?: Json | null;
          challenge?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          scene_id?: string | null;
          scope?: string | null;
          model_used?: string | null;
          summary?: Json | null;
          critiques?: Json | null;
          strengths?: Json | null;
          challenge?: string | null;
          created_at?: string;
        };
      };
      entities: {
        Row: {
          id: string;
          project_id: string;
          kind: string;
          name: string;
          details: Json | null;
          occurrences: number;
          last_seen_chapter: number | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          kind: string;
          name: string;
          details?: Json | null;
          occurrences?: number;
          last_seen_chapter?: number | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          kind?: string;
          name?: string;
          details?: Json | null;
          occurrences?: number;
          last_seen_chapter?: number | null;
        };
      };
    };
  };
};
