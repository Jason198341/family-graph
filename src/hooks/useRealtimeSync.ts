import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useFamilyStore } from '@/stores/familyStore'
import { useGraphStore } from '@/stores/graphStore'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Map DB table names to graphStore array keys + row→client transform
const TABLE_MAP = {
  persons: {
    key: 'persons' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      role: r.role as string,
      emoji: r.emoji as string,
      bio: r.bio as string,
      color: r.color as string,
      birthYear: (r.birth_year as number) ?? undefined,
      goalLines: (r.goal_lines as number) ?? undefined,
      goalWritingCount: (r.goal_writing_count as number) ?? undefined,
      goalWritingAvg: (r.goal_writing_avg as number) ?? undefined,
    }),
  },
  interests: {
    key: 'interests' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      category: r.category as string,
      emoji: r.emoji as string,
      description: r.description as string,
    }),
  },
  family_values: {
    key: 'values' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      emoji: r.emoji as string,
      description: r.description as string,
      practiceFrequency: r.practice_frequency as string,
    }),
  },
  life_events: {
    key: 'events' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      description: r.description as string,
      date: r.date as string,
      personIds: r.person_ids as string[],
      emoji: r.emoji as string,
      impact: r.impact as string,
    }),
  },
  growth_goals: {
    key: 'goals' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      description: r.description as string,
      personId: r.person_id as string,
      targetDate: r.target_date as string,
      progress: r.progress as number,
      emoji: r.emoji as string,
    }),
  },
  books: {
    key: 'books' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      author: r.author as string,
      totalPages: r.total_pages as number,
      linesPerPage: r.lines_per_page as number,
      emoji: r.emoji as string,
      color: r.color as string,
      currentPage: (r.current_page as number) ?? undefined,
      completed: (r.completed as boolean) ?? undefined,
      completedDate: (r.completed_date as string) ?? undefined,
    }),
  },
  reading_logs: {
    key: 'readingLogs' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      personId: r.person_id as string,
      bookId: r.book_id as string,
      date: r.date as string,
      linesRead: r.lines_read as number,
    }),
  },
  reading_goals: {
    key: 'readingGoals' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      personId: r.person_id as string,
      month: r.month as string,
      targetLines: r.target_lines as number,
    }),
  },
  graph_relations: {
    key: 'relations' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      sourceId: r.source_id as string,
      targetId: r.target_id as string,
      sourceType: r.source_type as string,
      targetType: r.target_type as string,
      relationType: r.relation_type as string,
      label: r.label as string,
      strength: r.strength as number,
      createdAt: new Date(r.created_at as string).getTime(),
    }),
  },
  insights: {
    key: 'insights' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      content: r.content as string,
      relatedNodeIds: r.related_node_ids as string[],
      createdAt: new Date(r.created_at as string).getTime(),
      emoji: r.emoji as string,
    }),
  },
  chat_messages: {
    key: 'chatMessages' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      role: r.role as string,
      content: r.content as string,
      timestamp: new Date(r.created_at as string).getTime(),
      relatedNodeIds: r.related_node_ids as string[],
    }),
  },
  writing_entries: {
    key: 'writingEntries' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      personId: r.person_id as string,
      date: r.date as string,
      title: r.title as string,
      content: r.content as string,
      charCount: r.char_count as number,
      wordCount: r.word_count as number,
      scores: r.scores as { content: number; logic: number; depth: number; specificity: number; clarity: number },
      totalScore: r.total_score as number,
      grade: r.grade as string,
      feedback: r.feedback as { content: string; logic: string; depth: string; specificity: string; clarity: string; overall: string },
      badges: r.badges as string[],
    }),
  },
  writing_goals: {
    key: 'writingGoals' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      personId: r.person_id as string,
      year: r.year as number,
      targetCount: r.target_count as number,
      targetAvgScore: r.target_avg_score as number,
    }),
  },
} as const

type TableName = keyof typeof TABLE_MAP

function handleChange(table: TableName, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) {
  const config = TABLE_MAP[table]
  if (!config) return

  const storeKey = config.key
  const store = useGraphStore.getState()

  if (payload.eventType === 'INSERT') {
    const newItem = config.transform(payload.new)
    const current = store[storeKey] as unknown[]
    // Skip if already exists (optimistic update)
    if (current.some((item: unknown) => (item as { id: string }).id === newItem.id)) return
    useGraphStore.setState({ [storeKey]: [...current, newItem] })
  } else if (payload.eventType === 'UPDATE') {
    const updated = config.transform(payload.new)
    const current = store[storeKey] as unknown[]
    useGraphStore.setState({
      [storeKey]: current.map((item: unknown) =>
        (item as { id: string }).id === updated.id ? updated : item,
      ),
    })
  } else if (payload.eventType === 'DELETE') {
    const deletedId = (payload.old as { id?: string })?.id
    if (!deletedId) return
    const current = store[storeKey] as unknown[]
    useGraphStore.setState({
      [storeKey]: current.filter((item: unknown) => (item as { id: string }).id !== deletedId),
    })
  }
}

/**
 * Subscribe to realtime changes for the active family's data tables.
 * Also subscribe to family_members for member approval notifications.
 */
export function useRealtimeSync() {
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId)
  const loadFamily = useFamilyStore((s) => s.loadFamily)

  useEffect(() => {
    if (!isSupabaseConfigured || !activeFamilyId) return

    const channel = supabase
      .channel(`family-${activeFamilyId}`)

    // Subscribe to all data tables
    const tables: TableName[] = Object.keys(TABLE_MAP) as TableName[]
    for (const table of tables) {
      channel.on(
        'postgres_changes' as 'system',
        { event: '*', schema: 'public', table, filter: `family_id=eq.${activeFamilyId}` } as unknown as { event: 'system' },
        (payload: unknown) => handleChange(table, payload as RealtimePostgresChangesPayload<Record<string, unknown>>),
      )
    }

    // Subscribe to family_members changes (for approval notifications)
    channel.on(
      'postgres_changes' as 'system',
      { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${activeFamilyId}` } as unknown as { event: 'system' },
      () => { loadFamily() },
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeFamilyId, loadFamily])
}
