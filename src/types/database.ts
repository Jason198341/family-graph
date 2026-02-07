// ─── Supabase Database Type Definitions ──────────────────
// Manually defined to match 001_schema.sql

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_emoji: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string
          avatar_emoji?: string
        }
        Update: {
          display_name?: string
          avatar_emoji?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          emoji: string
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          emoji?: string
          created_by: string
        }
        Update: {
          name?: string
          emoji?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: 'admin' | 'member'
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          family_id: string
          user_id: string
          role?: 'admin' | 'member'
          status?: 'pending' | 'approved' | 'rejected'
        }
        Update: {
          role?: 'admin' | 'member'
          status?: 'pending' | 'approved' | 'rejected'
        }
      }
      persons: {
        Row: {
          id: string
          family_id: string
          name: string
          role: string
          emoji: string
          bio: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          role?: string
          emoji?: string
          bio?: string
          color?: string
        }
        Update: {
          name?: string
          role?: string
          emoji?: string
          bio?: string
          color?: string
        }
      }
      interests: {
        Row: {
          id: string
          family_id: string
          name: string
          category: string
          emoji: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          category?: string
          emoji?: string
          description?: string
        }
        Update: {
          name?: string
          category?: string
          emoji?: string
          description?: string
        }
      }
      family_values: {
        Row: {
          id: string
          family_id: string
          name: string
          emoji: string
          description: string
          practice_frequency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          emoji?: string
          description?: string
          practice_frequency?: string
        }
        Update: {
          name?: string
          emoji?: string
          description?: string
          practice_frequency?: string
        }
      }
      life_events: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string
          date: string
          person_ids: string[]
          emoji: string
          impact: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string
          date?: string
          person_ids?: string[]
          emoji?: string
          impact?: string
        }
        Update: {
          title?: string
          description?: string
          date?: string
          person_ids?: string[]
          emoji?: string
          impact?: string
        }
      }
      growth_goals: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string
          person_id: string | null
          target_date: string | null
          progress: number
          emoji: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string
          person_id?: string
          target_date?: string
          progress?: number
          emoji?: string
        }
        Update: {
          title?: string
          description?: string
          person_id?: string
          target_date?: string
          progress?: number
          emoji?: string
        }
      }
      books: {
        Row: {
          id: string
          family_id: string
          title: string
          author: string
          total_pages: number
          lines_per_page: number
          emoji: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          author?: string
          total_pages?: number
          lines_per_page?: number
          emoji?: string
          color?: string
        }
        Update: {
          title?: string
          author?: string
          total_pages?: number
          lines_per_page?: number
          emoji?: string
          color?: string
        }
      }
      reading_logs: {
        Row: {
          id: string
          family_id: string
          person_id: string
          book_id: string
          date: string
          lines_read: number
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          person_id: string
          book_id: string
          date?: string
          lines_read?: number
        }
        Update: {
          lines_read?: number
          date?: string
        }
      }
      reading_goals: {
        Row: {
          id: string
          family_id: string
          person_id: string
          month: string
          target_lines: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          person_id: string
          month: string
          target_lines?: number
        }
        Update: {
          target_lines?: number
        }
      }
      graph_relations: {
        Row: {
          id: string
          family_id: string
          source_id: string
          target_id: string
          source_type: string
          target_type: string
          relation_type: string
          label: string
          strength: number
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          source_id: string
          target_id: string
          source_type: string
          target_type: string
          relation_type: string
          label?: string
          strength?: number
        }
        Update: {
          label?: string
          strength?: number
        }
      }
      insights: {
        Row: {
          id: string
          family_id: string
          title: string
          content: string
          related_node_ids: string[]
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          content?: string
          related_node_ids?: string[]
          emoji?: string
        }
        Update: {
          title?: string
          content?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          family_id: string
          user_id: string | null
          role: string
          content: string
          related_node_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id?: string
          role: string
          content: string
          related_node_ids?: string[]
        }
        Update: {
          content?: string
        }
      }
    }
    Functions: {
      my_family_ids: { Args: Record<string, never>; Returns: string[] }
      is_family_member: { Args: { fid: string }; Returns: boolean }
      is_family_admin: { Args: { fid: string }; Returns: boolean }
      join_family_by_code: { Args: { code: string }; Returns: Record<string, unknown> }
      approve_member: { Args: { member_id: string }; Returns: Record<string, unknown> }
      reject_member: { Args: { member_id: string }; Returns: Record<string, unknown> }
      regenerate_invite_code: { Args: { fid: string }; Returns: Record<string, unknown> }
    }
  }
}

// ─── Row type aliases ───────────────────────────────────

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type FamilyRow = Database['public']['Tables']['families']['Row']
export type FamilyMemberRow = Database['public']['Tables']['family_members']['Row']
export type PersonRow = Database['public']['Tables']['persons']['Row']
export type InterestRow = Database['public']['Tables']['interests']['Row']
export type FamilyValueRow = Database['public']['Tables']['family_values']['Row']
export type LifeEventRow = Database['public']['Tables']['life_events']['Row']
export type GrowthGoalRow = Database['public']['Tables']['growth_goals']['Row']
export type BookRow = Database['public']['Tables']['books']['Row']
export type ReadingLogRow = Database['public']['Tables']['reading_logs']['Row']
export type ReadingGoalRow = Database['public']['Tables']['reading_goals']['Row']
export type GraphRelationRow = Database['public']['Tables']['graph_relations']['Row']
export type InsightRow = Database['public']['Tables']['insights']['Row']
export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row']
