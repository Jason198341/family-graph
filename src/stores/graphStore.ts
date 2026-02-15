import { create } from 'zustand'
import type {
  FamilyPerson,
  AppView,
  Book,
  ReadingLog,
  ReadingGoal,
  BookReview,
  BookRecommendation,
} from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useFamilyStore } from './familyStore'

// ─── localStorage persistence (dev/fallback mode) ────────

const FG_KEY = 'fg_store'

function loadPersistedState(): Partial<GraphState> | null {
  try {
    const raw = localStorage.getItem(FG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<GraphState>
  } catch {
    return null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function persistLocal(state: GraphState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { persons, books, readingLogs, readingGoals, reviews, recommendations } = state
    localStorage.setItem(
      FG_KEY,
      JSON.stringify({ persons, books, readingLogs, readingGoals, reviews, recommendations }),
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
        useGraphStore.getState().addToast(`DB 동기화 실패: ${(error as { message?: string }).message ?? error}`, 'error')
      }
    })
    .catch((err) => {
      console.error('[db sync] unexpected:', err)
      useGraphStore.getState().addToast('DB 연결 오류', 'error')
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
        useGraphStore.getState().addToast(`저장 실패: ${error.message ?? '알 수 없는 오류'}`, 'error')
      }
    })
    .catch((err) => {
      console.error(`[${label}] unexpected:`, err)
      rollback()
      useGraphStore.getState().addToast('DB 연결 오류', 'error')
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

interface GraphState {
  // data
  persons: FamilyPerson[]
  books: Book[]
  readingLogs: ReadingLog[]
  readingGoals: ReadingGoal[]
  reviews: BookReview[]
  recommendations: BookRecommendation[]

  // ui
  activeView: AppView
  toasts: Toast[]
  dataLoaded: boolean

  // view
  setView: (view: AppView) => void

  // Supabase data loading
  loadFamilyData: (familyId: string) => Promise<void>

  // person mutations
  addPerson: (data: Omit<FamilyPerson, 'id'>) => FamilyPerson
  removePerson: (id: string) => void
  updatePersonGoals: (personId: string, goals: { goalLines?: number }) => void

  // book / reading mutations
  addBook: (data: Omit<Book, 'id'>) => Book
  removeBook: (id: string) => void
  addReadingLog: (data: Omit<ReadingLog, 'id'>) => ReadingLog
  addReadingGoal: (data: Omit<ReadingGoal, 'id'>) => ReadingGoal
  updateReadingGoal: (id: string, targetLines: number) => void
  updateBookProgress: (bookId: string, currentPage: number) => void

  // review mutations
  addReview: (data: Omit<BookReview, 'id' | 'likes' | 'createdAt'>) => BookReview
  removeReview: (id: string) => void
  toggleLike: (reviewId: string, personId: string) => void

  // recommendation mutations
  addRecommendation: (data: Omit<BookRecommendation, 'id' | 'createdAt'>) => BookRecommendation
  removeRecommendation: (id: string) => void

  // reading queries
  getReadingLogsForMonth: (personId: string, month: string) => ReadingLog[]
  getReadingGoalForMonth: (personId: string, month: string) => ReadingGoal | undefined
  getTotalLinesForMonth: (personId: string, month: string) => number
  getStreakDays: (personId: string) => number
  getRaceProgress: (personId: string, month: string) => number

  // toasts
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: number) => void
}

// ─── Initial state from persisted or empty ────

function getInitialData() {
  const persisted = loadPersistedState()
  if (persisted && persisted.persons && persisted.persons.length > 0) {
    return {
      persons: persisted.persons ?? [],
      books: persisted.books ?? [],
      readingLogs: persisted.readingLogs ?? [],
      readingGoals: persisted.readingGoals ?? [],
      reviews: (persisted as Record<string, unknown>).reviews as BookReview[] ?? [],
      recommendations: (persisted as Record<string, unknown>).recommendations as BookRecommendation[] ?? [],
    }
  }
  return {
    persons: [] as FamilyPerson[],
    books: [] as Book[],
    readingLogs: [] as ReadingLog[],
    readingGoals: [] as ReadingGoal[],
    reviews: [] as BookReview[],
    recommendations: [] as BookRecommendation[],
  }
}

// ─── Create the store ────────────────────────

const initial = getInitialData()

export const useGraphStore = create<GraphState>()((set, get) => ({
  // ── data ──
  ...initial,

  // ── UI state ──
  activeView: 'dashboard' as AppView,
  toasts: [],
  dataLoaded: false,

  // ── view actions ──
  setView: (view) => set({ activeView: view }),

  // ── Supabase data loading ──
  loadFamilyData: async (familyId) => {
    if (!isSupabaseConfigured) {
      set({ dataLoaded: true })
      return
    }

    if (loadingFamilyId === familyId) return
    loadingFamilyId = familyId

    try {
      const [persons, books, readingLogs, readingGoals, reviewsRes, recommendationsRes] = await Promise.all([
        supabase.from('persons').select('*').eq('family_id', familyId),
        supabase.from('books').select('*').eq('family_id', familyId),
        supabase.from('reading_logs').select('*').eq('family_id', familyId),
        supabase.from('reading_goals').select('*').eq('family_id', familyId),
        supabase.from('book_reviews').select('*').eq('family_id', familyId),
        supabase.from('book_recommendations').select('*').eq('family_id', familyId),
      ])

      set({
        persons: (persons.data ?? []).map((r) => ({
          id: r.id, name: r.name, role: r.role, emoji: r.emoji, bio: r.bio, color: r.color,
          birthYear: (r as Record<string, unknown>).birth_year as number | undefined,
          goalLines: (r as Record<string, unknown>).goal_lines as number | undefined,
        })),
        books: (books.data ?? []).map((r) => ({
          id: r.id, title: r.title, author: r.author, totalPages: r.total_pages,
          linesPerPage: r.lines_per_page, emoji: r.emoji, color: r.color,
          currentPage: (r as Record<string, unknown>).current_page as number | undefined,
          completed: (r as Record<string, unknown>).completed as boolean | undefined,
          completedDate: (r as Record<string, unknown>).completed_date as string | undefined,
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
          createdAt: r.created_at as string,
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
          emoji: data.emoji, color: data.color,
        }),
        () => set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
        'addBook',
      )
    }
    return book
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
      const next = { readingLogs: [...s.readingLogs, log] }
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

  updateBookProgress: (bookId, currentPage) => {
    set((s) => {
      const book = s.books.find((b) => b.id === bookId)
      if (!book) return {}
      const completed = currentPage >= book.totalPages
      const next = {
        books: s.books.map((b) =>
          b.id === bookId
            ? { ...b, currentPage, completed, completedDate: completed ? new Date().toISOString().slice(0, 10) : b.completedDate }
            : b,
        ),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      const book = get().books.find((b) => b.id === bookId)
      const completed = book ? currentPage >= book.totalPages : false
      dbSync(supabase.from('books').update({
        current_page: currentPage,
        completed,
        completed_date: completed ? new Date().toISOString().slice(0, 10) : null,
      }).eq('id', bookId))
    }
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
    const rec: BookRecommendation = { ...data, id, createdAt: new Date().toISOString() }
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
          reason: data.reason, emoji: data.emoji,
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

  // ── toasts ──
  addToast: (message, type) => {
    const id = ++toastCounter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => { get().removeToast(id) }, 4_000)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
