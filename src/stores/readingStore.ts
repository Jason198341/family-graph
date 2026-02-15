import { create } from 'zustand'
import type {
  FamilyPerson,
  AppView,
  Book,
  BookProgress,
  ReadingLog,
  ReadingGoal,
  BookReview,
  BookRecommendation,
  CommunityFeedPost,
  PostComment,
  BookReaderInfo,
  DailyHighlight,
  ReadingLetter,
  Achievement,
} from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useFamilyStore } from './familyStore'

// ─── localStorage persistence (dev/fallback mode) ────────

const FG_KEY = 'fg_store'

function loadPersistedState(): Partial<ReadingState> | null {
  try {
    const raw = localStorage.getItem(FG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<ReadingState>
  } catch {
    return null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function persistLocal(state: ReadingState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { persons, books, bookProgress, readingLogs, readingGoals, reviews, recommendations, highlights, letters, lastReaderId, lastBookId } = state
    localStorage.setItem(
      FG_KEY,
      JSON.stringify({ persons, books, bookProgress, readingLogs, readingGoals, reviews, recommendations, highlights, letters, lastReaderId, lastBookId }),
    )
  }, 1_000)
}

/** Returns true when we should use localStorage instead of Supabase */
function useLocalMode() {
  return !isSupabaseConfigured || !useFamilyStore.getState().activeFamilyId
}

/** Fire-and-forget Supabase call with error toast + console logging */
function dbSync(p: PromiseLike<{ error: unknown }>) {
  Promise.resolve(p)
    .then(({ error }) => {
      if (error) {
        console.error('[db sync]', error)
        useReadingStore.getState().addToast(`DB 동기화 실패: ${(error as { message?: string }).message ?? error}`, 'error')
      }
    })
    .catch((err) => {
      console.error('[db sync] unexpected:', err)
      useReadingStore.getState().addToast('DB 연결 오류', 'error')
    })
}

/** Supabase call with rollback on failure + error toast */
function dbSyncWithRollback(
  p: PromiseLike<{ error: { message?: string } | null }>,
  rollback: () => void,
  label: string,
) {
  Promise.resolve(p)
    .then(({ error }) => {
      if (error) {
        console.error(`[${label}]`, error)
        rollback()
        useReadingStore.getState().addToast(`저장 실패: ${error.message ?? '알 수 없는 오류'}`, 'error')
      }
    })
    .catch((err) => {
      console.error(`[${label}] unexpected:`, err)
      rollback()
      useReadingStore.getState().addToast('DB 연결 오류', 'error')
    })
}

function getFamilyId() {
  return useFamilyStore.getState().activeFamilyId ?? ''
}

/** Prevent concurrent loadFamilyData calls */
let loadingFamilyId: string | null = null

// ─── ID generator ────────────────────────────

function genId(type: string): string {
  if (!useLocalMode()) return crypto.randomUUID()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${type}_${Date.now()}_${rand}`
}

// ─── Toast counter ───────────────────────────

let toastCounter = 0

// ─── Store types ─────────────────────────────

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ReadingState {
  // data
  persons: FamilyPerson[]
  books: Book[]
  bookProgress: BookProgress[]
  readingLogs: ReadingLog[]
  readingGoals: ReadingGoal[]
  reviews: BookReview[]
  recommendations: BookRecommendation[]
  highlights: DailyHighlight[]
  letters: ReadingLetter[]

  // smart defaults (quick log)
  lastReaderId: string | null
  lastBookId: string | null

  // community data (cross-family)
  communityFeed: CommunityFeedPost[]
  feedComments: Record<string, PostComment[]>
  familyRank: { rank: number; total: number; totalLines: number } | null

  // ui
  activeView: AppView
  toasts: Toast[]
  dataLoaded: boolean
  fontSize: 'normal' | 'large' | 'xlarge'

  // view
  setView: (view: AppView) => void
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void

  // Supabase data loading
  loadFamilyData: (familyId: string) => Promise<void>

  // person mutations
  addPerson: (data: Omit<FamilyPerson, 'id'>) => FamilyPerson
  removePerson: (id: string) => void
  updatePerson: (id: string, updates: Partial<Omit<FamilyPerson, 'id'>>) => void
  updatePersonGoals: (personId: string, goals: { goalLines?: number }) => void

  // book / reading mutations
  addBook: (data: Omit<Book, 'id'>) => Book
  updateBook: (id: string, updates: Partial<Omit<Book, 'id'>>) => void
  removeBook: (id: string) => void
  addReadingLog: (data: Omit<ReadingLog, 'id'>) => ReadingLog
  removeReadingLog: (id: string) => void
  updateReadingLog: (id: string, updates: Partial<Omit<ReadingLog, 'id'>>) => void
  addReadingGoal: (data: Omit<ReadingGoal, 'id'>) => ReadingGoal
  updateReadingGoal: (id: string, targetLines: number) => void
  updateBookProgress: (personId: string, bookId: string, currentPage: number) => void
  getBookProgress: (personId: string, bookId: string) => BookProgress | undefined

  // review mutations
  addReview: (data: Omit<BookReview, 'id' | 'likes' | 'createdAt'>) => BookReview
  removeReview: (id: string) => void
  toggleLike: (reviewId: string, personId: string) => void

  // recommendation mutations
  addRecommendation: (data: Omit<BookRecommendation, 'id' | 'likes' | 'createdAt'>) => BookRecommendation
  removeRecommendation: (id: string) => void

  // highlight mutations
  addHighlight: (data: Omit<DailyHighlight, 'id' | 'createdAt'>) => DailyHighlight
  removeHighlight: (id: string) => void

  // letter mutations
  addLetter: (data: Omit<ReadingLetter, 'id' | 'createdAt'>) => ReadingLetter
  removeLetter: (id: string) => void

  // community actions
  loadCommunityFeed: () => Promise<void>
  loadPostComments: (postId: string, postType: string) => Promise<void>
  addPostComment: (postId: string, postType: string, content: string) => Promise<void>
  toggleFeedLike: (postId: string, postType: 'review' | 'recommend') => Promise<void>
  getBookReaderStats: (bookTitle: string) => Promise<{ familyCount: number; readerCount: number; completedCount: number } | null>
  loadFamilyRank: (month: string) => Promise<void>
  getBookReaders: (bookTitle: string) => Promise<BookReaderInfo[]>

  // reading queries
  getReadingLogsForMonth: (personId: string, month: string) => ReadingLog[]
  getReadingGoalForMonth: (personId: string, month: string) => ReadingGoal | undefined
  getTotalLinesForMonth: (personId: string, month: string) => number
  getStreakDays: (personId: string) => number
  getRaceProgress: (personId: string, month: string) => number

  // achievement queries
  getAchievements: (month: string) => Achievement[]

  // radar chart data
  getRadarData: (personId: string, month: string) => { label: string; value: number }[]

  // family-level streak (any member reads = streak continues)
  getFamilyStreak: () => number

  // toasts
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: number) => void
}

// ─── Initial state from persisted or empty ────

function getInitialData() {
  const persisted = loadPersistedState()
  const p = persisted as Record<string, unknown> | null
  if (persisted && persisted.persons && persisted.persons.length > 0) {
    return {
      persons: persisted.persons ?? [],
      books: persisted.books ?? [],
      bookProgress: (p?.bookProgress as BookProgress[]) ?? [],
      readingLogs: persisted.readingLogs ?? [],
      readingGoals: persisted.readingGoals ?? [],
      reviews: (p?.reviews as BookReview[]) ?? [],
      recommendations: (p?.recommendations as BookRecommendation[]) ?? [],
      highlights: (p?.highlights as DailyHighlight[]) ?? [],
      letters: (p?.letters as ReadingLetter[]) ?? [],
      lastReaderId: (p?.lastReaderId as string) ?? null,
      lastBookId: (p?.lastBookId as string) ?? null,
    }
  }
  return {
    persons: [] as FamilyPerson[],
    books: [] as Book[],
    bookProgress: [] as BookProgress[],
    readingLogs: [] as ReadingLog[],
    readingGoals: [] as ReadingGoal[],
    reviews: [] as BookReview[],
    recommendations: [] as BookRecommendation[],
    highlights: [] as DailyHighlight[],
    letters: [] as ReadingLetter[],
    lastReaderId: null as string | null,
    lastBookId: null as string | null,
  }
}

// ─── Create the store ────────────────────────

const initial = getInitialData()

export const useReadingStore = create<ReadingState>()((set, get) => ({
  // ── data ──
  ...initial,

  // ── smart defaults ──
  lastReaderId: null as string | null,
  lastBookId: null as string | null,

  // ── community data ──
  communityFeed: [],
  feedComments: {},
  familyRank: null,

  // ── UI state ──
  activeView: 'home' as AppView,
  toasts: [],
  dataLoaded: false,
  fontSize: (localStorage.getItem('fg_font_size') as 'normal' | 'large' | 'xlarge') || 'normal',

  // ── view actions ──
  setView: (view) => set({ activeView: view }),
  setFontSize: (size) => {
    localStorage.setItem('fg_font_size', size)
    document.documentElement.dataset.fontSize = size
    set({ fontSize: size })
  },

  // ── Supabase data loading ──
  loadFamilyData: async (familyId) => {
    if (!isSupabaseConfigured) {
      set({ dataLoaded: true })
      return
    }

    if (loadingFamilyId === familyId) return
    loadingFamilyId = familyId

    try {
      const [persons, books, bookProgressRes, readingLogs, readingGoals, reviewsRes, recommendationsRes, highlightsRes, lettersRes] = await Promise.all([
        supabase.from('persons').select('*').eq('family_id', familyId),
        supabase.from('books').select('*').eq('family_id', familyId),
        supabase.from('person_book_progress').select('*').eq('family_id', familyId),
        supabase.from('reading_logs').select('*').eq('family_id', familyId),
        supabase.from('reading_goals').select('*').eq('family_id', familyId),
        supabase.from('book_reviews').select('*').eq('family_id', familyId),
        supabase.from('book_recommendations').select('*').eq('family_id', familyId),
        supabase.from('daily_highlights').select('*').eq('family_id', familyId),
        supabase.from('reading_letters').select('*').eq('family_id', familyId),
      ])

      set({
        persons: (persons.data ?? []).map((r) => ({
          id: r.id, name: r.name, role: r.role, emoji: r.emoji, bio: r.bio, color: r.color,
          birthYear: (r as Record<string, unknown>).birth_year as number | undefined,
          goalLines: (r as Record<string, unknown>).goal_lines as number | undefined,
          avatarUrl: (r as Record<string, unknown>).avatar_url as string | undefined,
        })),
        books: (books.data ?? []).map((r) => ({
          id: r.id, title: r.title, author: r.author, totalPages: r.total_pages,
          linesPerPage: r.lines_per_page, emoji: r.emoji, color: r.color,
          coverUrl: (r as Record<string, unknown>).cover_url as string | undefined,
        })),
        bookProgress: (bookProgressRes.data ?? []).map((r: Record<string, unknown>) => ({
          personId: r.person_id as string,
          bookId: r.book_id as string,
          currentPage: (r.current_page as number) ?? 0,
          completed: (r.completed as boolean) ?? false,
          completedDate: r.completed_date as string | undefined,
        })),
        readingLogs: (readingLogs.data ?? []).map((r) => ({
          id: r.id, personId: r.person_id, bookId: r.book_id, date: r.date, linesRead: r.lines_read,
        })),
        readingGoals: (readingGoals.data ?? []).map((r) => ({
          id: r.id, personId: r.person_id, month: r.month, targetLines: r.target_lines,
        })),
        reviews: (reviewsRes.data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string, personId: r.person_id as string, bookId: r.book_id as string,
          rating: r.rating as number, content: r.content as string,
          likes: (r.likes as string[]) ?? [], createdAt: r.created_at as string,
        })),
        recommendations: (recommendationsRes.data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string, personId: r.person_id as string,
          bookTitle: r.book_title as string, author: r.author as string,
          reason: r.reason as string, emoji: r.emoji as string,
          likes: (r.likes as string[]) ?? [],
          createdAt: r.created_at as string,
        })),
        highlights: (highlightsRes.data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string, personId: r.person_id as string, bookId: r.book_id as string,
          content: r.content as string, date: r.date as string,
          createdAt: r.created_at as string,
        })),
        letters: (lettersRes.data ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string, fromPersonId: r.from_person_id as string,
          toPersonId: r.to_person_id as string, bookId: r.book_id as string | undefined,
          content: r.content as string, createdAt: r.created_at as string,
        })),
        dataLoaded: true,
      })
    } catch (err) {
      console.error('[loadFamilyData] failed:', err)
      set({ dataLoaded: true })
    } finally {
      loadingFamilyId = null
    }
  },

  // ── person mutations ──
  addPerson: (data) => {
    const id = genId('person')
    const person: FamilyPerson = { ...data, id }
    set((s) => {
      const next = { persons: [...s.persons, person] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('persons').insert({
          id, family_id: getFamilyId(), name: data.name, role: data.role,
          emoji: data.emoji, bio: data.bio, color: data.color,
          avatar_url: data.avatarUrl ?? null,
        }),
        () => set((s) => ({ persons: s.persons.filter((p) => p.id !== id) })),
        'addPerson',
      )
    }
    return person
  },

  removePerson: (id) => {
    set((s) => {
      const next = { persons: s.persons.filter((p) => p.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('persons').delete().eq('id', id))
    }
  },

  updatePerson: (id, updates) => {
    set((s) => {
      const next = {
        persons: s.persons.map((p) => p.id === id ? { ...p, ...updates } : p),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      const snakeUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) snakeUpdates.name = updates.name
      if (updates.role !== undefined) snakeUpdates.role = updates.role
      if (updates.emoji !== undefined) snakeUpdates.emoji = updates.emoji
      if (updates.color !== undefined) snakeUpdates.color = updates.color
      if (updates.bio !== undefined) snakeUpdates.bio = updates.bio
      if (updates.avatarUrl !== undefined) snakeUpdates.avatar_url = updates.avatarUrl
      dbSync(supabase.from('persons').update(snakeUpdates).eq('id', id))
    }
  },

  updatePersonGoals: (personId, goals) => {
    set((s) => {
      const next = {
        persons: s.persons.map((p) => p.id === personId ? { ...p, ...goals } : p),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      const snakeUpdates: Record<string, unknown> = {}
      if (goals.goalLines !== undefined) snakeUpdates.goal_lines = goals.goalLines
      dbSync(supabase.from('persons').update(snakeUpdates).eq('id', personId))
    }
  },

  // ── book / reading actions ──
  addBook: (data) => {
    const id = genId('book')
    const book: Book = { ...data, id }
    set((s) => {
      const next = { books: [...s.books, book] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('books').insert({
          id, family_id: getFamilyId(), title: data.title, author: data.author,
          total_pages: data.totalPages, lines_per_page: data.linesPerPage,
          emoji: data.emoji, color: data.color, cover_url: data.coverUrl ?? null,
        }),
        () => set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
        'addBook',
      )
    }
    return book
  },

  updateBook: (id, updates) => {
    const current = get()
    const idx = current.books.findIndex((b) => b.id === id)
    if (idx === -1) return
    const newBooks = current.books.map((b) => (b.id === id ? { ...b, ...updates } : b))
    set({ books: newBooks })
    if (useLocalMode()) persistLocal({ ...current, books: newBooks })
    if (!useLocalMode()) {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.author !== undefined) dbUpdates.author = updates.author
      if (updates.totalPages !== undefined) dbUpdates.total_pages = updates.totalPages
      if (updates.linesPerPage !== undefined) dbUpdates.lines_per_page = updates.linesPerPage
      if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji
      if (updates.color !== undefined) dbUpdates.color = updates.color
      if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl ?? null
      dbSync(supabase.from('books').update(dbUpdates).eq('id', id))
    }
  },

  removeBook: (id) => {
    set((s) => {
      const next = {
        books: s.books.filter((b) => b.id !== id),
        readingLogs: s.readingLogs.filter((l) => l.bookId !== id),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('books').delete().eq('id', id))
    }
  },

  addReadingLog: (data) => {
    const id = genId('rlog')
    const log: ReadingLog = { ...data, id }
    set((s) => {
      const next = { readingLogs: [...s.readingLogs, log], lastReaderId: data.personId, lastBookId: data.bookId }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('reading_logs').insert({
          id, family_id: getFamilyId(), person_id: data.personId,
          book_id: data.bookId, date: data.date, lines_read: data.linesRead,
        }),
        () => set((s) => ({ readingLogs: s.readingLogs.filter((l) => l.id !== id) })),
        'addReadingLog',
      )
    }
    return log
  },

  removeReadingLog: (id) => {
    set((s) => {
      const next = { readingLogs: s.readingLogs.filter((l) => l.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('reading_logs').delete().eq('id', id))
    }
  },

  updateReadingLog: (id, updates) => {
    set((s) => {
      const next = {
        readingLogs: s.readingLogs.map((l) => l.id === id ? { ...l, ...updates } : l),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      const snakeUpdates: Record<string, unknown> = {}
      if (updates.linesRead !== undefined) snakeUpdates.lines_read = updates.linesRead
      if (updates.date !== undefined) snakeUpdates.date = updates.date
      if (updates.personId !== undefined) snakeUpdates.person_id = updates.personId
      if (updates.bookId !== undefined) snakeUpdates.book_id = updates.bookId
      dbSync(supabase.from('reading_logs').update(snakeUpdates).eq('id', id))
    }
  },

  addReadingGoal: (data) => {
    const id = genId('rgoal')
    const goal: ReadingGoal = { ...data, id }
    set((s) => {
      const next = { readingGoals: [...s.readingGoals, goal] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('reading_goals').insert({
          id, family_id: getFamilyId(), person_id: data.personId,
          month: data.month, target_lines: data.targetLines,
        }),
        () => set((s) => ({ readingGoals: s.readingGoals.filter((g) => g.id !== id) })),
        'addReadingGoal',
      )
    }
    return goal
  },

  updateReadingGoal: (id, targetLines) => {
    set((s) => {
      const next = {
        readingGoals: s.readingGoals.map((g) => g.id === id ? { ...g, targetLines } : g),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('reading_goals').update({ target_lines: targetLines }).eq('id', id))
    }
  },

  updateBookProgress: (personId, bookId, currentPage) => {
    const book = get().books.find((b) => b.id === bookId)
    if (!book) return
    const completed = currentPage >= book.totalPages
    const completedDate = completed ? new Date().toISOString().slice(0, 10) : undefined

    set((s) => {
      const existing = s.bookProgress.find((bp) => bp.personId === personId && bp.bookId === bookId)
      const next = {
        bookProgress: existing
          ? s.bookProgress.map((bp) =>
              bp.personId === personId && bp.bookId === bookId
                ? { ...bp, currentPage, completed, completedDate: completedDate ?? bp.completedDate }
                : bp,
            )
          : [...s.bookProgress, { personId, bookId, currentPage, completed, completedDate }],
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('person_book_progress').upsert({
        family_id: getFamilyId(),
        person_id: personId,
        book_id: bookId,
        current_page: currentPage,
        completed,
        completed_date: completedDate ?? null,
      }, { onConflict: 'person_id,book_id' }))
    }
  },

  getBookProgress: (personId, bookId) => {
    return get().bookProgress.find((bp) => bp.personId === personId && bp.bookId === bookId)
  },

  // ── review mutations ──
  addReview: (data) => {
    const id = genId('review')
    const review: BookReview = { ...data, id, likes: [], createdAt: new Date().toISOString() }
    set((s) => {
      const next = { reviews: [...s.reviews, review] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('book_reviews').insert({
          id, family_id: getFamilyId(), person_id: data.personId,
          book_id: data.bookId, rating: data.rating, content: data.content, likes: [],
        }),
        () => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
        'addReview',
      )
    }
    return review
  },

  removeReview: (id) => {
    set((s) => {
      const next = { reviews: s.reviews.filter((r) => r.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('book_reviews').delete().eq('id', id))
    }
  },

  toggleLike: (reviewId, personId) => {
    set((s) => {
      const next = {
        reviews: s.reviews.map((r) => {
          if (r.id !== reviewId) return r
          const liked = r.likes.includes(personId)
          return { ...r, likes: liked ? r.likes.filter((id) => id !== personId) : [...r.likes, personId] }
        }),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      const review = get().reviews.find((r) => r.id === reviewId)
      if (review) {
        dbSync(supabase.from('book_reviews').update({ likes: review.likes }).eq('id', reviewId))
      }
    }
  },

  // ── recommendation mutations ──
  addRecommendation: (data) => {
    const id = genId('rec')
    const rec: BookRecommendation = { ...data, id, likes: [], createdAt: new Date().toISOString() }
    set((s) => {
      const next = { recommendations: [...s.recommendations, rec] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('book_recommendations').insert({
          id, family_id: getFamilyId(), person_id: data.personId,
          book_title: data.bookTitle, author: data.author,
          reason: data.reason, emoji: data.emoji, likes: [],
        }),
        () => set((s) => ({ recommendations: s.recommendations.filter((r) => r.id !== id) })),
        'addRecommendation',
      )
    }
    return rec
  },

  removeRecommendation: (id) => {
    set((s) => {
      const next = { recommendations: s.recommendations.filter((r) => r.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('book_recommendations').delete().eq('id', id))
    }
  },

  // ── community actions ──
  loadCommunityFeed: async () => {
    if (useLocalMode()) {
      // Build feed from local data
      const s = get()
      const family = useFamilyStore.getState().family
      const feed: CommunityFeedPost[] = [
        ...s.reviews.map((r) => {
          const person = s.persons.find((p) => p.id === r.personId)
          const book = s.books.find((b) => b.id === r.bookId)
          return {
            postId: r.id, postType: 'review' as const,
            personName: person?.name ?? '', personEmoji: person?.emoji ?? '',
            familyName: family?.name ?? '', familyEmoji: family?.emoji ?? '', familyId: family?.id ?? '',
            bookTitle: book?.title ?? '', bookAuthor: book?.author ?? '', bookEmoji: book?.emoji ?? '',
            rating: r.rating, content: r.content, likes: r.likes, commentCount: 0, createdAt: r.createdAt,
          }
        }),
        ...s.recommendations.map((r) => {
          const person = s.persons.find((p) => p.id === r.personId)
          return {
            postId: r.id, postType: 'recommend' as const,
            personName: person?.name ?? '', personEmoji: person?.emoji ?? '',
            familyName: family?.name ?? '', familyEmoji: family?.emoji ?? '', familyId: family?.id ?? '',
            bookTitle: r.bookTitle, bookAuthor: r.author, bookEmoji: r.emoji,
            rating: 0, content: r.reason, likes: r.likes ?? [], commentCount: 0, createdAt: r.createdAt,
          }
        }),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      set({ communityFeed: feed })
      return
    }
    try {
      const { data, error } = await supabase.rpc('get_community_feed', { lim: 50 })
      if (!error && data) {
        set({
          communityFeed: (data as Record<string, unknown>[]).map((r) => ({
            postId: r.post_id as string,
            postType: r.post_type as 'review' | 'recommend',
            personName: r.person_name as string,
            personEmoji: r.person_emoji as string,
            familyName: r.family_name as string,
            familyEmoji: r.family_emoji as string,
            familyId: r.family_id as string,
            bookTitle: r.book_title as string,
            bookAuthor: r.book_author as string,
            bookEmoji: (r.book_emoji as string) ?? '',
            rating: r.rating as number,
            content: r.content as string,
            likes: (r.likes as string[]) ?? [],
            commentCount: Number(r.comment_count) ?? 0,
            createdAt: r.created_at as string,
          })),
        })
      }
    } catch (err) {
      console.error('[loadCommunityFeed]', err)
    }
  },

  loadPostComments: async (postId, postType) => {
    if (!isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.rpc('get_post_comments', {
        p_post_id: postId, p_post_type: postType,
      })
      if (!error && data) {
        set((s) => ({
          feedComments: {
            ...s.feedComments,
            [postId]: (data as Record<string, unknown>[]).map((r) => ({
              commentId: r.comment_id as string,
              personName: r.person_name as string, personEmoji: r.person_emoji as string,
              familyName: r.family_name as string, familyEmoji: r.family_emoji as string,
              familyId: r.family_id as string,
              content: r.content as string, createdAt: r.created_at as string,
            })),
          },
        }))
      }
    } catch (err) {
      console.error('[loadPostComments]', err)
    }
  },

  addPostComment: async (postId, postType, content) => {
    const family = useFamilyStore.getState().family
    const familyId = family?.id ?? getFamilyId()
    const familyName = family?.name ?? '우리 가족'
    const familyEmoji = family?.emoji ?? '🏠'

    const comment: PostComment = {
      commentId: genId('comment'),
      personName: familyName, personEmoji: familyEmoji,
      familyName, familyEmoji, familyId,
      content, createdAt: new Date().toISOString(),
    }

    // Optimistic update
    set((s) => ({
      feedComments: {
        ...s.feedComments,
        [postId]: [...(s.feedComments[postId] ?? []), comment],
      },
      communityFeed: s.communityFeed.map((p) =>
        p.postId === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
      ),
    }))

    if (!useLocalMode()) {
      dbSync(supabase.from('post_comments').insert({
        id: comment.commentId,
        family_id: familyId,
        post_id: postId, post_type: postType,
        person_id: familyId,
        person_name: familyName, person_emoji: familyEmoji,
        family_name: familyName, family_emoji: familyEmoji,
        content,
      }))
    }
  },

  toggleFeedLike: async (postId, postType) => {
    const familyId = getFamilyId() || 'local'

    // Optimistic update on communityFeed
    set((s) => ({
      communityFeed: s.communityFeed.map((p) => {
        if (p.postId !== postId) return p
        const liked = p.likes.includes(familyId)
        return { ...p, likes: liked ? p.likes.filter((id) => id !== familyId) : [...p.likes, familyId] }
      }),
    }))

    if (useLocalMode()) {
      // Also update underlying local data for persistence
      if (postType === 'review') {
        set((s) => ({
          reviews: s.reviews.map((r) => {
            if (r.id !== postId) return r
            const liked = r.likes.includes(familyId)
            return { ...r, likes: liked ? r.likes.filter((id) => id !== familyId) : [...r.likes, familyId] }
          }),
        }))
      } else {
        set((s) => ({
          recommendations: s.recommendations.map((r) => {
            if (r.id !== postId) return r
            const liked = (r.likes ?? []).includes(familyId)
            return { ...r, likes: liked ? r.likes.filter((id) => id !== familyId) : [...(r.likes ?? []), familyId] }
          }),
        }))
      }
      persistLocal(get())
    } else {
      try {
        const { error } = await supabase.rpc('toggle_post_like', {
          p_post_id: postId, p_post_type: postType, p_person_id: familyId,
        })
        if (error) console.error('[toggleFeedLike]', error)
      } catch (err) {
        console.error('[toggleFeedLike]', err)
      }
    }
  },

  getBookReaderStats: async (bookTitle) => {
    if (!isSupabaseConfigured) return null
    try {
      const { data, error } = await supabase.rpc('get_book_reader_stats', { p_title: bookTitle })
      if (!error && data && (data as unknown[]).length > 0) {
        const r = (data as Record<string, unknown>[])[0]
        return {
          familyCount: Number(r.family_count),
          readerCount: Number(r.reader_count),
          completedCount: Number(r.completed_count),
        }
      }
    } catch (err) {
      console.error('[getBookReaderStats]', err)
    }
    return null
  },

  loadFamilyRank: async (month) => {
    if (!isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.rpc('get_monthly_family_rankings', { target_month: month })
      if (!error && data) {
        const rankings = data as { family_id: string; total_lines: number }[]
        const familyId = getFamilyId()
        const ourIdx = rankings.findIndex((r) => r.family_id === familyId)
        set({
          familyRank: {
            rank: ourIdx >= 0 ? ourIdx + 1 : rankings.length + 1,
            total: rankings.length,
            totalLines: ourIdx >= 0 ? Number(rankings[ourIdx].total_lines) : 0,
          },
        })
      }
    } catch (err) {
      console.error('[loadFamilyRank]', err)
    }
  },

  getBookReaders: async (bookTitle) => {
    if (!isSupabaseConfigured) return []
    try {
      const { data, error } = await supabase.rpc('get_book_readers', { p_title: bookTitle })
      if (!error && data) {
        return (data as Record<string, unknown>[]).map((r) => ({
          familyName: r.family_name as string,
          familyEmoji: r.family_emoji as string,
          personName: r.person_name as string,
          personEmoji: r.person_emoji as string,
          completed: r.completed as boolean,
          currentPage: r.current_page as number,
          totalPages: r.total_pages as number,
          reviewCount: Number(r.review_count),
        }))
      }
    } catch (err) {
      console.error('[getBookReaders]', err)
    }
    return []
  },

  // ── highlight mutations ──
  addHighlight: (data) => {
    const id = genId('hl')
    const highlight: DailyHighlight = { ...data, id, createdAt: new Date().toISOString() }
    set((s) => {
      const next = { highlights: [...s.highlights, highlight] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('daily_highlights').insert({
          id, family_id: getFamilyId(), person_id: data.personId,
          book_id: data.bookId, content: data.content, date: data.date,
        }),
        () => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
        'addHighlight',
      )
    }
    return highlight
  },

  removeHighlight: (id) => {
    set((s) => {
      const next = { highlights: s.highlights.filter((h) => h.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('daily_highlights').delete().eq('id', id))
    }
  },

  // ── letter mutations ──
  addLetter: (data) => {
    const id = genId('letter')
    const letter: ReadingLetter = { ...data, id, createdAt: new Date().toISOString() }
    set((s) => {
      const next = { letters: [...s.letters, letter] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSyncWithRollback(
        supabase.from('reading_letters').insert({
          id, family_id: getFamilyId(), from_person_id: data.fromPersonId,
          to_person_id: data.toPersonId, book_id: data.bookId ?? null,
          content: data.content,
        }),
        () => set((s) => ({ letters: s.letters.filter((l) => l.id !== id) })),
        'addLetter',
      )
    }
    return letter
  },

  removeLetter: (id) => {
    set((s) => {
      const next = { letters: s.letters.filter((l) => l.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('reading_letters').delete().eq('id', id))
    }
  },

  // ── reading queries ──
  getReadingLogsForMonth: (personId, month) => {
    return get().readingLogs.filter((l) => l.personId === personId && l.date.startsWith(month))
  },

  getReadingGoalForMonth: (personId, month) => {
    return get().readingGoals.find((g) => g.personId === personId && g.month === month)
  },

  getTotalLinesForMonth: (personId, month) => {
    return get().readingLogs
      .filter((l) => l.personId === personId && l.date.startsWith(month))
      .reduce((sum, l) => sum + l.linesRead, 0)
  },

  getStreakDays: (personId) => {
    const s = get()
    const logs = s.readingLogs.filter((l) => l.personId === personId)
    const uniqueDates = [...new Set(logs.map((l) => l.date))].sort().reverse()
    if (uniqueDates.length === 0) return 0

    let streak = 0
    const today = new Date()
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().slice(0, 10)
      if (uniqueDates.includes(dateStr)) {
        streak++
      } else {
        break
      }
    }
    return streak
  },

  getRaceProgress: (personId, month) => {
    const s = get()
    const goal = s.readingGoals.find((g) => g.personId === personId && g.month === month)
    if (!goal || goal.targetLines <= 0) return 0
    const total = s.readingLogs
      .filter((l) => l.personId === personId && l.date.startsWith(month))
      .reduce((sum, l) => sum + l.linesRead, 0)
    return Math.min(100, Math.round((total / goal.targetLines) * 100))
  },

  // ── achievement queries (computed from existing data) ──
  getAchievements: (month) => {
    const s = get()
    const monthLogs = s.readingLogs.filter((l) => l.date.startsWith(month))
    const totalFamilyLines = monthLogs.reduce((sum, l) => sum + l.linesRead, 0)
    const achievements: Achievement[] = []

    // 1. 가족 합산 목표
    const familyGoalSteps = [1000, 5000, 10000, 30000, 50000]
    for (const step of familyGoalSteps) {
      achievements.push({
        id: `family-${step}`, type: 'family-lines',
        label: `${step.toLocaleString()}줄 달성`,
        description: `가족 합산 ${step.toLocaleString()}줄 읽기`,
        emoji: step >= 30000 ? '🌳' : step >= 10000 ? '🌿' : '🌱',
        unlocked: totalFamilyLines >= step,
        progress: Math.min(100, Math.round((totalFamilyLines / step) * 100)),
      })
    }

    // 2. 전원 같은 날 독서
    const dateSet: Record<string, Set<string>> = {}
    for (const log of monthLogs) {
      if (!dateSet[log.date]) dateSet[log.date] = new Set()
      dateSet[log.date].add(log.personId)
    }
    const allTogetherDays = Object.values(dateSet).filter((ps) => ps.size >= s.persons.length && s.persons.length > 1).length
    achievements.push({
      id: 'all-together', type: 'cooperation',
      label: '온 가족 독서의 날',
      description: `가족 전원이 같은 날 읽기 (${allTogetherDays}일)`,
      emoji: '👨‍👩‍👧‍👦',
      unlocked: allTogetherDays > 0,
      progress: Math.min(100, allTogetherDays * 20),
    })

    // 3. 연속 독서 (가족 중 최고 스트릭)
    const maxStreak = Math.max(0, ...s.persons.map((p) => s.getStreakDays(p.id)))
    const streakSteps = [{ d: 7, e: '🔥', l: '7일 연속' }, { d: 14, e: '💪', l: '14일 연속' }, { d: 30, e: '🏆', l: '30일 연속' }]
    for (const ss of streakSteps) {
      achievements.push({
        id: `streak-${ss.d}`, type: 'streak',
        label: ss.l, description: `연속 ${ss.d}일 독서 달성`,
        emoji: ss.e,
        unlocked: maxStreak >= ss.d,
        progress: Math.min(100, Math.round((maxStreak / ss.d) * 100)),
      })
    }

    // 4. 첫 후기 / 첫 추천
    achievements.push({
      id: 'first-review', type: 'milestone',
      label: '첫 후기', description: '첫 독서 후기 작성',
      emoji: '📝', unlocked: s.reviews.length > 0,
      progress: s.reviews.length > 0 ? 100 : 0,
    })
    achievements.push({
      id: 'first-recommend', type: 'milestone',
      label: '첫 추천', description: '첫 책 추천 작성',
      emoji: '💡', unlocked: s.recommendations.length > 0,
      progress: s.recommendations.length > 0 ? 100 : 0,
    })

    // 5. 완독 마일스톤
    const completedBooks = s.bookProgress.filter((bp) => bp.completed).length
    const bookSteps = [{ n: 1, l: '첫 완독' }, { n: 5, l: '5권 완독' }, { n: 10, l: '10권 완독' }]
    for (const bs of bookSteps) {
      achievements.push({
        id: `books-${bs.n}`, type: 'books',
        label: bs.l, description: `${bs.n}권 완독 달성`,
        emoji: '📚', unlocked: completedBooks >= bs.n,
        progress: Math.min(100, Math.round((completedBooks / bs.n) * 100)),
      })
    }

    // 6. 오늘의 한 줄
    const hlCount = s.highlights.filter((h) => h.date.startsWith(month)).length
    achievements.push({
      id: 'highlights-10', type: 'highlights',
      label: '명문장 수집가', description: '이번 달 한 줄 10개 이상',
      emoji: '✨', unlocked: hlCount >= 10,
      progress: Math.min(100, hlCount * 10),
    })

    return achievements
  },

  // ── radar chart data ──
  getRadarData: (personId, month) => {
    const s = get()
    const monthLogs = s.readingLogs.filter((l) => l.personId === personId && l.date.startsWith(month))
    const goal = s.readingGoals.find((g) => g.personId === personId && g.month === month)
    const totalLines = monthLogs.reduce((sum, l) => sum + l.linesRead, 0)

    // 양(Volume): lines read vs goal (or vs 5000 default)
    const volumeTarget = goal?.targetLines ?? 5000
    const volume = Math.min(100, Math.round((totalLines / volumeTarget) * 100))

    // 질(Quality): average review rating * review content length score
    const personReviews = s.reviews.filter((r) => r.personId === personId)
    const avgRating = personReviews.length > 0
      ? personReviews.reduce((sum, r) => sum + r.rating, 0) / personReviews.length
      : 0
    const avgLength = personReviews.length > 0
      ? personReviews.reduce((sum, r) => sum + r.content.length, 0) / personReviews.length
      : 0
    const quality = Math.min(100, Math.round((avgRating / 5) * 50 + Math.min(50, avgLength / 4)))

    // 나눔(Sharing): reviews + recommendations + likes given
    const recsCount = s.recommendations.filter((r) => r.personId === personId).length
    const likesGiven = s.reviews.reduce((sum, r) => sum + (r.likes.includes(personId) ? 1 : 0), 0)
    const sharing = Math.min(100, (personReviews.length * 15) + (recsCount * 20) + (likesGiven * 10))

    // 다양성(Diversity): unique books + unique authors
    const readBookIds = new Set(monthLogs.map((l) => l.bookId))
    const readAuthors = new Set(
      [...readBookIds].map((bid) => s.books.find((b) => b.id === bid)?.author).filter(Boolean),
    )
    const diversity = Math.min(100, readBookIds.size * 15 + readAuthors.size * 10)

    return [
      { label: '양', value: volume },
      { label: '질', value: quality },
      { label: '나눔', value: sharing },
      { label: '다양성', value: diversity },
    ]
  },

  // ── family streak (any member reads = streak continues) ──
  getFamilyStreak: () => {
    const s = get()
    const allDates = [...new Set(s.readingLogs.map((l) => l.date))].sort().reverse()
    if (allDates.length === 0) return 0

    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().slice(0, 10)
      if (allDates.includes(dateStr)) {
        streak++
      } else {
        break
      }
    }
    return streak
  },

  // ── toasts ──
  addToast: (message, type) => {
    const id = ++toastCounter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => { get().removeToast(id) }, 4_000)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
