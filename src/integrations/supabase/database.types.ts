export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      question_history: {
        Row: {
          created_at: string;
          event_at: string;
          event_type: 'solved' | 'solved-date-updated' | 'revised';
          from_value: string | null;
          id: string;
          question_id: string;
          to_value: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_at: string;
          event_type: 'solved' | 'solved-date-updated' | 'revised';
          from_value?: string | null;
          id?: string;
          question_id: string;
          to_value?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_at?: string;
          event_type?: 'solved' | 'solved-date-updated' | 'revised';
          from_value?: string | null;
          id?: string;
          question_id?: string;
          to_value?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'question_history_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      questions: {
        Row: {
          created_at: string;
          difficulty: 'Easy' | 'Medium' | 'Hard';
          id: string;
          last_revised_at: string;
          link: string | null;
          revision_count: number;
          solved_at: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          difficulty: 'Easy' | 'Medium' | 'Hard';
          id?: string;
          last_revised_at: string;
          link?: string | null;
          revision_count?: number;
          solved_at: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          difficulty?: 'Easy' | 'Medium' | 'Hard';
          id?: string;
          last_revised_at?: string;
          link?: string | null;
          revision_count?: number;
          solved_at?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
