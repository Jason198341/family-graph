import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useFamilyStore } from '@/stores/familyStore'
import { useReadingStore } from '@/stores/readingStore'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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
  book_reviews: {
    key: 'reviews' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      personId: r.person_id as string,
      bookId: r.book_id as string,
      rating: r.rating as number,
      content: r.content as string,
      likes: (r.likes as string[]) ?? [],
      createdAt: r.created_at as string,
    }),
  },
  book_recommendations: {
    key: 'recommendations' as const,
    transform: (r: Record<string, unknown>) => ({
      id: r.id as string,
      personId: r.person_id as string,
      bookTitle: r.book_title as string,
      author: r.author as string,
      reason: r.reason as string,
      emoji: r.emoji as string,
      likes: (r.likes as string[]) ?? [],
      createdAt: r.created_at as string,
    }),
  },
} as const

type TableName = keyof typeof TABLE_MAP

function handleChange(table: TableName, payload: RealtimePostgresChangesPayload<Record<string, unknown>>) {
  const config = TABLE_MAP[table]
  if (!config) return

  const storeKey = config.key
  const store = useReadingStore.getState()

  if (payload.eventType === 'INSERT') {
    const newItem = config.transform(payload.new)
    const current = store[storeKey] as unknown[]
    if (current.some((item: unknown) => (item as { id: string }).id === newItem.id)) return
    useReadingStore.setState({ [storeKey]: [...current, newItem] })
  } else if (payload.eventType === 'UPDATE') {
    const updated = config.transform(payload.new)
    const current = store[storeKey] as unknown[]
    useReadingStore.setState({
      [storeKey]: current.map((item: unknown) =>
        (item as { id: string }).id === updated.id ? updated : item,
      ),
    })
  } else if (payload.eventType === 'DELETE') {
    const deletedId = (payload.old as { id?: string })?.id
    if (!deletedId) return
    const current = store[storeKey] as unknown[]
    useReadingStore.setState({
      [storeKey]: current.filter((item: unknown) => (item as { id: string }).id !== deletedId),
    })
  }
}

export function useRealtimeSync() {
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId)
  const loadFamily = useFamilyStore((s) => s.loadFamily)

  useEffect(() => {
    if (!isSupabaseConfigured || !activeFamilyId) return

    const channel = supabase
      .channel(`family-${activeFamilyId}`)

    const tables: TableName[] = Object.keys(TABLE_MAP) as TableName[]
    for (const table of tables) {
      channel.on(
        'postgres_changes' as 'system',
        { event: '*', schema: 'public', table, filter: `family_id=eq.${activeFamilyId}` } as unknown as { event: 'system' },
        (payload: unknown) => handleChange(table, payload as RealtimePostgresChangesPayload<Record<string, unknown>>),
      )
    }

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
