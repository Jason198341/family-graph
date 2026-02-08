import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type {
  FamilyPerson,
  Interest,
  FamilyValue,
  LifeEvent,
  GrowthGoal,
  GraphRelation,
  GrowthInsight,
  ChatMessage,
  AppView,
  NodeCategory,
  GraphNodeData,
  ExtractionResult,
  Book,
  ReadingLog,
  ReadingGoal,
} from '@/types'
import {
  seedPersons,
  seedInterests,
  seedValues,
  seedEvents,
  seedGoals,
  seedRelations,
  seedBooks,
  seedReadingLogs,
  seedReadingGoals,
} from '@/data/seed'
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
    const {
      persons, interests, values, events, goals, relations,
      insights, chatMessages, books, readingLogs, readingGoals,
    } = state
    localStorage.setItem(
      FG_KEY,
      JSON.stringify({ persons, interests, values, events, goals, relations, insights, chatMessages, books, readingLogs, readingGoals }),
    )
  }, 1_000)
}

/** Returns true when we should use localStorage instead of Supabase */
function useLocalMode() {
  return !isSupabaseConfigured || !useFamilyStore.getState().activeFamilyId
}

/** Fire-and-forget Supabase call with silent error logging (prevents unhandled rejections) */
function dbSync(p: PromiseLike<{ error: unknown }>) {
  Promise.resolve(p).then(({ error }) => { if (error) console.error('[db sync]', error) })
}

function getFamilyId() {
  return useFamilyStore.getState().activeFamilyId ?? ''
}

/** Prevent concurrent loadFamilyData calls */
let loadingFamilyId: string | null = null

// ─── ID generator ────────────────────────────

function genId(type: string): string {
  // In Supabase mode, generate UUID-compatible IDs
  if (!useLocalMode()) return crypto.randomUUID()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${type}_${Date.now()}_${rand}`
}

// ─── Category color map ──────────────────────

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  person: '#3b82f6',
  interest: '#f59e0b',
  value: '#10b981',
  event: '#8b5cf6',
  goal: '#ef4444',
  book: '#a855f7',
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
  interests: Interest[]
  values: FamilyValue[]
  events: LifeEvent[]
  goals: GrowthGoal[]
  relations: GraphRelation[]
  insights: GrowthInsight[]
  chatMessages: ChatMessage[]
  books: Book[]
  readingLogs: ReadingLog[]
  readingGoals: ReadingGoal[]

  // ui
  activeView: AppView
  selectedNodeId: string | null
  isAiLoading: boolean
  aiError: string | null
  toasts: Toast[]
  dataLoaded: boolean

  // view
  setView: (view: AppView) => void
  selectNode: (id: string | null) => void

  // Supabase data loading
  loadFamilyData: (familyId: string) => Promise<void>

  // entity mutations
  addPerson: (data: Omit<FamilyPerson, 'id'>) => FamilyPerson
  addInterest: (data: Omit<Interest, 'id'>) => Interest
  addValue: (data: Omit<FamilyValue, 'id'>) => FamilyValue
  addEvent: (data: Omit<LifeEvent, 'id'>) => LifeEvent
  addGoal: (data: Omit<GrowthGoal, 'id'>) => GrowthGoal
  addRelation: (data: Omit<GraphRelation, 'id' | 'createdAt'>) => GraphRelation

  removePerson: (id: string) => void
  removeInterest: (id: string) => void
  removeValue: (id: string) => void
  removeEvent: (id: string) => void
  removeGoal: (id: string) => void
  removeRelation: (id: string) => void

  updateEntity: (category: NodeCategory, id: string, updates: Record<string, unknown>) => void
  updateGoalProgress: (id: string, progress: number) => void

  // book / reading mutations
  addBook: (data: Omit<Book, 'id'>) => Book
  removeBook: (id: string) => void
  addReadingLog: (data: Omit<ReadingLog, 'id'>) => ReadingLog
  addReadingGoal: (data: Omit<ReadingGoal, 'id'>) => ReadingGoal
  updateReadingGoal: (id: string, targetLines: number) => void

  // reading queries
  getReadingLogsForMonth: (personId: string, month: string) => ReadingLog[]
  getReadingGoalForMonth: (personId: string, month: string) => ReadingGoal | undefined
  getTotalLinesForMonth: (personId: string, month: string) => number
  getStreakDays: (personId: string) => number

  // AI helpers
  addInsight: (insight: Omit<GrowthInsight, 'id' | 'createdAt'>) => void
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setAiLoading: (v: boolean) => void
  setAiError: (err: string | null) => void

  // toasts
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: number) => void

  // queries
  getNodeById: (id: string) => { category: NodeCategory; data: Record<string, unknown> } | null
  getRelatedNodes: (id: string) => { category: NodeCategory; data: Record<string, unknown> }[]
  getAllGraphNodes: () => Node<GraphNodeData>[]
  getAllGraphEdges: () => Edge[]

  // AI import
  importExtraction: (result: ExtractionResult) => void

  // context for AI
  getGraphContext: () => string
}

// ─── Initial state from persisted or seed ────

function getInitialData() {
  const persisted = loadPersistedState()
  if (persisted && persisted.persons && persisted.persons.length > 0) {
    return {
      persons: persisted.persons ?? seedPersons,
      interests: persisted.interests ?? seedInterests,
      values: persisted.values ?? seedValues,
      events: persisted.events ?? seedEvents,
      goals: persisted.goals ?? seedGoals,
      relations: persisted.relations ?? seedRelations,
      insights: persisted.insights ?? [],
      chatMessages: persisted.chatMessages ?? [],
      books: persisted.books ?? seedBooks,
      readingLogs: persisted.readingLogs ?? seedReadingLogs,
      readingGoals: persisted.readingGoals ?? seedReadingGoals,
    }
  }
  return {
    persons: seedPersons,
    interests: seedInterests,
    values: seedValues,
    events: seedEvents,
    goals: seedGoals,
    relations: seedRelations,
    insights: [] as GrowthInsight[],
    chatMessages: [] as ChatMessage[],
    books: seedBooks,
    readingLogs: seedReadingLogs,
    readingGoals: seedReadingGoals,
  }
}

// ─── Helper to find category of an entity id ─

function findCategory(state: GraphState, id: string): NodeCategory | null {
  if (state.persons.some((p) => p.id === id)) return 'person'
  if (state.interests.some((i) => i.id === id)) return 'interest'
  if (state.values.some((v) => v.id === id)) return 'value'
  if (state.events.some((e) => e.id === id)) return 'event'
  if (state.goals.some((g) => g.id === id)) return 'goal'
  if (state.books.some((b) => b.id === id)) return 'book'
  return null
}

function findEntity(state: GraphState, id: string): Record<string, unknown> | null {
  const p = state.persons.find((x) => x.id === id)
  if (p) return p as unknown as Record<string, unknown>
  const i = state.interests.find((x) => x.id === id)
  if (i) return i as unknown as Record<string, unknown>
  const v = state.values.find((x) => x.id === id)
  if (v) return v as unknown as Record<string, unknown>
  const e = state.events.find((x) => x.id === id)
  if (e) return e as unknown as Record<string, unknown>
  const g = state.goals.find((x) => x.id === id)
  if (g) return g as unknown as Record<string, unknown>
  const b = state.books.find((x) => x.id === id)
  if (b) return b as unknown as Record<string, unknown>
  return null
}

// ─── Build xyflow node from entity ───────────

function entityToGraphNode(
  category: NodeCategory,
  entity: Record<string, unknown>,
  index: number,
  total: number,
): Node<GraphNodeData> {
  const angle = (2 * Math.PI * index) / Math.max(total, 1)
  const radius = category === 'person' ? 120 : category === 'value' ? 300 : 220
  const x = 400 + radius * Math.cos(angle)
  const y = 300 + radius * Math.sin(angle)

  const id = entity.id as string
  const label =
    (entity.name as string | undefined) ??
    (entity.title as string | undefined) ??
    id
  const emoji = (entity.emoji as string | undefined) ?? '📌'
  const color = (entity.color as string | undefined) ?? CATEGORY_COLORS[category]
  const description =
    (entity.description as string | undefined) ??
    (entity.bio as string | undefined) ??
    ''

  return {
    id,
    type: 'custom',
    position: { x, y },
    data: {
      category,
      entityId: id,
      label,
      emoji,
      color,
      description,
      meta: entity,
    },
  }
}

// ─── Create the store ────────────────────────

const initial = getInitialData()

export const useGraphStore = create<GraphState>()((set, get) => ({
  // ── data ──
  ...initial,

  // ── UI state ──
  activeView: 'dashboard' as AppView,
  selectedNodeId: null,
  isAiLoading: false,
  aiError: null,
  toasts: [],
  dataLoaded: false,

  // ── view actions ──
  setView: (view) => set({ activeView: view }),
  selectNode: (id) => set({ selectedNodeId: id }),

  // ── Supabase data loading ──
  loadFamilyData: async (familyId) => {
    if (!isSupabaseConfigured) {
      set({ dataLoaded: true })
      return
    }

    // Prevent duplicate concurrent loads
    if (loadingFamilyId === familyId) return
    loadingFamilyId = familyId

    try {
    const [persons, interests, values, events, goals, books, readingLogs, readingGoals, relations, insights, chatMessages] = await Promise.all([
      supabase.from('persons').select('*').eq('family_id', familyId),
      supabase.from('interests').select('*').eq('family_id', familyId),
      supabase.from('family_values').select('*').eq('family_id', familyId),
      supabase.from('life_events').select('*').eq('family_id', familyId),
      supabase.from('growth_goals').select('*').eq('family_id', familyId),
      supabase.from('books').select('*').eq('family_id', familyId),
      supabase.from('reading_logs').select('*').eq('family_id', familyId),
      supabase.from('reading_goals').select('*').eq('family_id', familyId),
      supabase.from('graph_relations').select('*').eq('family_id', familyId),
      supabase.from('insights').select('*').eq('family_id', familyId),
      supabase.from('chat_messages').select('*').eq('family_id', familyId).order('created_at'),
    ])

    set({
      persons: (persons.data ?? []).map((r) => ({
        id: r.id, name: r.name, role: r.role, emoji: r.emoji, bio: r.bio, color: r.color,
      })),
      interests: (interests.data ?? []).map((r) => ({
        id: r.id, name: r.name, category: r.category as Interest['category'], emoji: r.emoji, description: r.description,
      })),
      values: (values.data ?? []).map((r) => ({
        id: r.id, name: r.name, emoji: r.emoji, description: r.description,
        practiceFrequency: r.practice_frequency as FamilyValue['practiceFrequency'],
      })),
      events: (events.data ?? []).map((r) => ({
        id: r.id, title: r.title, description: r.description, date: r.date,
        personIds: r.person_ids ?? [], emoji: r.emoji, impact: r.impact as LifeEvent['impact'],
      })),
      goals: (goals.data ?? []).map((r) => ({
        id: r.id, title: r.title, description: r.description, personId: r.person_id ?? '',
        targetDate: r.target_date ?? '', progress: r.progress, emoji: r.emoji,
      })),
      books: (books.data ?? []).map((r) => ({
        id: r.id, title: r.title, author: r.author, totalPages: r.total_pages,
        linesPerPage: r.lines_per_page, emoji: r.emoji, color: r.color,
      })),
      readingLogs: (readingLogs.data ?? []).map((r) => ({
        id: r.id, personId: r.person_id, bookId: r.book_id, date: r.date, linesRead: r.lines_read,
      })),
      readingGoals: (readingGoals.data ?? []).map((r) => ({
        id: r.id, personId: r.person_id, month: r.month, targetLines: r.target_lines,
      })),
      relations: (relations.data ?? []).map((r) => ({
        id: r.id, sourceId: r.source_id, targetId: r.target_id,
        sourceType: r.source_type as NodeCategory, targetType: r.target_type as NodeCategory,
        relationType: r.relation_type as GraphRelation['relationType'],
        label: r.label, strength: r.strength, createdAt: new Date(r.created_at).getTime(),
      })),
      insights: (insights.data ?? []).map((r) => ({
        id: r.id, title: r.title, content: r.content,
        relatedNodeIds: r.related_node_ids ?? [], createdAt: new Date(r.created_at).getTime(), emoji: r.emoji,
      })),
      chatMessages: (chatMessages.data ?? []).map((r) => ({
        id: r.id, role: r.role as ChatMessage['role'], content: r.content,
        timestamp: new Date(r.created_at).getTime(), relatedNodeIds: r.related_node_ids ?? [],
      })),
      dataLoaded: true,
    })
    } catch (err) {
      console.error('[loadFamilyData] failed:', err)
      // Still mark as loaded so user isn't stuck on spinner forever
      set({ dataLoaded: true })
    } finally {
      loadingFamilyId = null
    }
  },

  // ── entity add actions (optimistic + Supabase sync) ──
  addPerson: (data) => {
    const id = genId('person')
    const person: FamilyPerson = { ...data, id }
    set((s) => {
      const next = { persons: [...s.persons, person] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      supabase.from('persons').insert({
        id, family_id: getFamilyId(), name: data.name, role: data.role,
        emoji: data.emoji, bio: data.bio, color: data.color,
      }).then(({ error }) => {
        if (error) set((s) => ({ persons: s.persons.filter((p) => p.id !== id) }))
      })
    }
    return person
  },

  addInterest: (data) => {
    const id = genId('interest')
    const interest: Interest = { ...data, id }
    set((s) => {
      const next = { interests: [...s.interests, interest] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      supabase.from('interests').insert({
        id, family_id: getFamilyId(), name: data.name, category: data.category,
        emoji: data.emoji, description: data.description,
      }).then(({ error }) => {
        if (error) set((s) => ({ interests: s.interests.filter((i) => i.id !== id) }))
      })
    }
    return interest
  },

  addValue: (data) => {
    const id = genId('value')
    const value: FamilyValue = { ...data, id }
    set((s) => {
      const next = { values: [...s.values, value] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      supabase.from('family_values').insert({
        id, family_id: getFamilyId(), name: data.name, emoji: data.emoji,
        description: data.description, practice_frequency: data.practiceFrequency,
      }).then(({ error }) => {
        if (error) set((s) => ({ values: s.values.filter((v) => v.id !== id) }))
      })
    }
    return value
  },

  addEvent: (data) => {
    const id = genId('event')
    const event: LifeEvent = { ...data, id }
    set((s) => {
      const next = { events: [...s.events, event] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      supabase.from('life_events').insert({
        id, family_id: getFamilyId(), title: data.title, description: data.description,
        date: data.date, person_ids: data.personIds, emoji: data.emoji, impact: data.impact,
      }).then(({ error }) => {
        if (error) set((s) => ({ events: s.events.filter((e) => e.id !== id) }))
      })
    }
    return event
  },

  addGoal: (data) => {
    const id = genId('goal')
    const goal: GrowthGoal = { ...data, id }
    set((s) => {
      const next = { goals: [...s.goals, goal] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      supabase.from('growth_goals').insert({
        id, family_id: getFamilyId(), title: data.title, description: data.description,
        person_id: data.personId, target_date: data.targetDate, progress: data.progress, emoji: data.emoji,
      }).then(({ error }) => {
        if (error) set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
      })
    }
    return goal
  },

  addRelation: (data) => {
    const id = genId('rel')
    const relation: GraphRelation = { ...data, id, createdAt: Date.now() }
    set((s) => {
      const next = { relations: [...s.relations, relation] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      supabase.from('graph_relations').insert({
        id, family_id: getFamilyId(), source_id: data.sourceId, target_id: data.targetId,
        source_type: data.sourceType, target_type: data.targetType,
        relation_type: data.relationType, label: data.label, strength: data.strength,
      }).then(({ error }) => {
        if (error) set((s) => ({ relations: s.relations.filter((r) => r.id !== id) }))
      })
    }
    return relation
  },

  // ── entity remove actions ──
  removePerson: (id) => {
    set((s) => {
      const next = {
        persons: s.persons.filter((p) => p.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        events: s.events.map((e) => ({ ...e, personIds: e.personIds.filter((pid) => pid !== id) })),
        goals: s.goals.filter((g) => g.personId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('persons').delete().eq('id', id))
      dbSync(supabase.from('graph_relations').delete().or(`source_id.eq.${id},target_id.eq.${id}`))
    }
  },

  removeInterest: (id) => {
    set((s) => {
      const next = {
        interests: s.interests.filter((i) => i.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('interests').delete().eq('id', id))
      dbSync(supabase.from('graph_relations').delete().or(`source_id.eq.${id},target_id.eq.${id}`))
    }
  },

  removeValue: (id) => {
    set((s) => {
      const next = {
        values: s.values.filter((v) => v.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('family_values').delete().eq('id', id))
      dbSync(supabase.from('graph_relations').delete().or(`source_id.eq.${id},target_id.eq.${id}`))
    }
  },

  removeEvent: (id) => {
    set((s) => {
      const next = {
        events: s.events.filter((e) => e.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('life_events').delete().eq('id', id))
      dbSync(supabase.from('graph_relations').delete().or(`source_id.eq.${id},target_id.eq.${id}`))
    }
  },

  removeGoal: (id) => {
    set((s) => {
      const next = {
        goals: s.goals.filter((g) => g.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('growth_goals').delete().eq('id', id))
      dbSync(supabase.from('graph_relations').delete().or(`source_id.eq.${id},target_id.eq.${id}`))
    }
  },

  removeRelation: (id) => {
    set((s) => {
      const next = { relations: s.relations.filter((r) => r.id !== id) }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('graph_relations').delete().eq('id', id))
    }
  },

  // ── generic entity update ──
  updateEntity: (category, id, updates) => {
    const tableMap: Record<NodeCategory, string> = {
      person: 'persons', interest: 'interests', value: 'family_values',
      event: 'life_events', goal: 'growth_goals', book: 'books',
    }
    const fieldMap: Record<NodeCategory, string> = {
      person: 'persons', interest: 'interests', value: 'values',
      event: 'events', goal: 'goals', book: 'books',
    }

    // Build Supabase column mapping (camelCase → snake_case)
    const snakeUpdates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(updates)) {
      const snake = k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
      snakeUpdates[snake] = v
    }

    set((s) => {
      const field = fieldMap[category] as keyof typeof s
      const arr = s[field] as unknown as Record<string, unknown>[]
      const next = {
        [field]: arr.map((item) =>
          (item.id as string) === id ? { ...item, ...updates } : item,
        ),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })

    if (!useLocalMode()) {
      dbSync(supabase.from(tableMap[category]).update(snakeUpdates).eq('id', id))
    }
  },

  // ── goal progress ──
  updateGoalProgress: (id, progress) => {
    const clamped = Math.min(100, Math.max(0, progress))
    set((s) => {
      const next = {
        goals: s.goals.map((g) => g.id === id ? { ...g, progress: clamped } : g),
      }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('growth_goals').update({ progress: clamped }).eq('id', id))
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
      supabase.from('books').insert({
        id, family_id: getFamilyId(), title: data.title, author: data.author,
        total_pages: data.totalPages, lines_per_page: data.linesPerPage,
        emoji: data.emoji, color: data.color,
      }).then(({ error }) => {
        if (error) set((s) => ({ books: s.books.filter((b) => b.id !== id) }))
      })
    }
    return book
  },

  removeBook: (id) => {
    set((s) => {
      const next = {
        books: s.books.filter((b) => b.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        readingLogs: s.readingLogs.filter((l) => l.bookId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
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
      supabase.from('reading_logs').insert({
        id, family_id: getFamilyId(), person_id: data.personId,
        book_id: data.bookId, date: data.date, lines_read: data.linesRead,
      }).then(({ error }) => {
        if (error) set((s) => ({ readingLogs: s.readingLogs.filter((l) => l.id !== id) }))
      })
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
      supabase.from('reading_goals').insert({
        id, family_id: getFamilyId(), person_id: data.personId,
        month: data.month, target_lines: data.targetLines,
      }).then(({ error }) => {
        if (error) set((s) => ({ readingGoals: s.readingGoals.filter((g) => g.id !== id) }))
      })
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

  // ── reading queries ──
  getReadingLogsForMonth: (personId, month) => {
    const s = get()
    return s.readingLogs.filter((l) => l.personId === personId && l.date.startsWith(month))
  },

  getReadingGoalForMonth: (personId, month) => {
    const s = get()
    return s.readingGoals.find((g) => g.personId === personId && g.month === month)
  },

  getTotalLinesForMonth: (personId, month) => {
    const s = get()
    return s.readingLogs
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

  // ── AI state ──
  setAiLoading: (v) => set({ isAiLoading: v }),
  setAiError: (err) => set({ aiError: err }),

  addInsight: (data) => {
    const id = genId('insight')
    const insight: GrowthInsight = { ...data, id, createdAt: Date.now() }
    set((s) => {
      const next = { insights: [...s.insights, insight] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('insights').insert({
        id, family_id: getFamilyId(), title: data.title, content: data.content,
        related_node_ids: data.relatedNodeIds, emoji: data.emoji,
      }))
    }
  },

  addChatMessage: (data) => {
    const id = genId('msg')
    const msg: ChatMessage = { ...data, id, timestamp: Date.now() }
    set((s) => {
      const next = { chatMessages: [...s.chatMessages, msg] }
      if (useLocalMode()) persistLocal({ ...s, ...next })
      return next
    })
    if (!useLocalMode()) {
      dbSync(supabase.from('chat_messages').insert({
        id, family_id: getFamilyId(), role: data.role, content: data.content,
        related_node_ids: data.relatedNodeIds ?? [],
      }))
    }
  },

  // ── toasts ──
  addToast: (message, type) => {
    const id = ++toastCounter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => { get().removeToast(id) }, 4_000)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── queries ──
  getNodeById: (id) => {
    const s = get()
    const category = findCategory(s, id)
    if (!category) return null
    const data = findEntity(s, id)
    if (!data) return null
    return { category, data }
  },

  getRelatedNodes: (id) => {
    const s = get()
    const connectedIds = new Set<string>()
    for (const rel of s.relations) {
      if (rel.sourceId === id) connectedIds.add(rel.targetId)
      if (rel.targetId === id) connectedIds.add(rel.sourceId)
    }
    const results: { category: NodeCategory; data: Record<string, unknown> }[] = []
    for (const connId of connectedIds) {
      const category = findCategory(s, connId)
      const data = findEntity(s, connId)
      if (category && data) results.push({ category, data })
    }
    return results
  },

  getAllGraphNodes: () => {
    const s = get()
    const allEntities: { category: NodeCategory; entity: Record<string, unknown> }[] = []

    for (const p of s.persons) allEntities.push({ category: 'person', entity: p as unknown as Record<string, unknown> })
    for (const i of s.interests) allEntities.push({ category: 'interest', entity: i as unknown as Record<string, unknown> })
    for (const v of s.values) allEntities.push({ category: 'value', entity: v as unknown as Record<string, unknown> })
    for (const e of s.events) allEntities.push({ category: 'event', entity: e as unknown as Record<string, unknown> })
    for (const g of s.goals) allEntities.push({ category: 'goal', entity: g as unknown as Record<string, unknown> })
    for (const b of s.books) allEntities.push({ category: 'book', entity: b as unknown as Record<string, unknown> })

    const total = allEntities.length
    return allEntities.map(({ category, entity }, idx) =>
      entityToGraphNode(category, entity, idx, total),
    )
  },

  getAllGraphEdges: () => {
    const s = get()
    return s.relations.map((rel): Edge => {
      const isFamily = rel.relationType === 'family'
      return {
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        label: rel.label,
        type: 'default',
        animated: isFamily ? false : rel.strength >= 7,
        style: {
          strokeWidth: isFamily ? 1.5 : Math.max(1, Math.round(rel.strength / 3)),
          stroke: isFamily ? '#475569' : (CATEGORY_COLORS[rel.sourceType] ?? '#64748b'),
          strokeDasharray: isFamily ? '6 3' : undefined,
        },
      }
    })
  },

  // ── AI extraction import ──
  importExtraction: (result) => {
    const s = get()
    const nameToId = new Map<string, string>()

    // Map by name AND role for persons (아빠→id, 엄마→id, etc.)
    for (const p of s.persons) {
      nameToId.set(p.name.toLowerCase(), p.id)
      if (p.role && p.role !== '가족') nameToId.set(p.role.toLowerCase(), p.id)
    }
    for (const i of s.interests) nameToId.set(i.name.toLowerCase(), i.id)
    for (const v of s.values) nameToId.set(v.name.toLowerCase(), v.id)
    for (const e of s.events) nameToId.set(e.title.toLowerCase(), e.id)
    for (const g of s.goals) nameToId.set(g.title.toLowerCase(), g.id)
    for (const b of s.books) nameToId.set(b.title.toLowerCase(), b.id)

    const newPersons: FamilyPerson[] = []
    const newInterests: Interest[] = []
    const newValues: FamilyValue[] = []
    const newEvents: LifeEvent[] = []
    const newGoals: GrowthGoal[] = []

    for (const ent of result.entities) {
      const nameLower = ent.name.toLowerCase()
      if (nameToId.has(nameLower)) continue

      const id = genId(ent.category)
      nameToId.set(nameLower, id)

      switch (ent.category) {
        case 'person':
          newPersons.push({ id, name: ent.name, role: '가족', emoji: ent.emoji || '👤', bio: ent.description, color: CATEGORY_COLORS.person })
          break
        case 'interest':
          newInterests.push({ id, name: ent.name, category: 'hobby', emoji: ent.emoji || '⭐', description: ent.description })
          break
        case 'value':
          newValues.push({ id, name: ent.name, emoji: ent.emoji || '💎', description: ent.description, practiceFrequency: 'weekly' })
          break
        case 'event':
          newEvents.push({ id, title: ent.name, description: ent.description, date: new Date().toISOString().slice(0, 10), personIds: [], emoji: ent.emoji || '📅', impact: 'positive' })
          break
        case 'goal':
          newGoals.push({ id, title: ent.name, description: ent.description, personId: s.persons[0]?.id ?? '', targetDate: new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10), progress: 0, emoji: ent.emoji || '🎯' })
          break
      }
    }

    const newRelations: GraphRelation[] = []
    for (const rel of result.relations) {
      const sourceId = nameToId.get(rel.sourceName.toLowerCase())
      const targetId = nameToId.get(rel.targetName.toLowerCase())
      if (!sourceId || !targetId) continue

      const merged = {
        persons: [...s.persons, ...newPersons],
        interests: [...s.interests, ...newInterests],
        values: [...s.values, ...newValues],
        events: [...s.events, ...newEvents],
        goals: [...s.goals, ...newGoals],
        books: s.books,
        relations: s.relations,
        insights: s.insights,
        chatMessages: s.chatMessages,
        readingLogs: s.readingLogs,
        readingGoals: s.readingGoals,
        activeView: s.activeView,
        selectedNodeId: s.selectedNodeId,
        isAiLoading: s.isAiLoading,
        aiError: s.aiError,
        toasts: s.toasts,
        dataLoaded: s.dataLoaded,
      } as unknown as GraphState

      const sourceType = findCategory(merged, sourceId)
      const targetType = findCategory(merged, targetId)
      if (!sourceType || !targetType) continue

      newRelations.push({
        id: genId('rel'), sourceId, targetId, sourceType, targetType,
        relationType: rel.relationType, label: rel.label, strength: 5, createdAt: Date.now(),
      })
    }

    set((prev) => {
      const next = {
        persons: [...prev.persons, ...newPersons],
        interests: [...prev.interests, ...newInterests],
        values: [...prev.values, ...newValues],
        events: [...prev.events, ...newEvents],
        goals: [...prev.goals, ...newGoals],
        relations: [...prev.relations, ...newRelations],
      }
      if (useLocalMode()) persistLocal({ ...prev, ...next })
      return next
    })

    // Sync new entities to Supabase
    if (!useLocalMode()) {
      const fid = getFamilyId()
      for (const p of newPersons) {
        dbSync(supabase.from('persons').insert({ id: p.id, family_id: fid, name: p.name, role: p.role, emoji: p.emoji, bio: p.bio, color: p.color }))
      }
      for (const i of newInterests) {
        dbSync(supabase.from('interests').insert({ id: i.id, family_id: fid, name: i.name, category: i.category, emoji: i.emoji, description: i.description }))
      }
      for (const v of newValues) {
        dbSync(supabase.from('family_values').insert({ id: v.id, family_id: fid, name: v.name, emoji: v.emoji, description: v.description, practice_frequency: v.practiceFrequency }))
      }
      for (const e of newEvents) {
        dbSync(supabase.from('life_events').insert({ id: e.id, family_id: fid, title: e.title, description: e.description, date: e.date, person_ids: e.personIds, emoji: e.emoji, impact: e.impact }))
      }
      for (const g of newGoals) {
        dbSync(supabase.from('growth_goals').insert({ id: g.id, family_id: fid, title: g.title, description: g.description, person_id: g.personId, target_date: g.targetDate, progress: g.progress, emoji: g.emoji }))
      }
      for (const r of newRelations) {
        dbSync(supabase.from('graph_relations').insert({ id: r.id, family_id: fid, source_id: r.sourceId, target_id: r.targetId, source_type: r.sourceType, target_type: r.targetType, relation_type: r.relationType, label: r.label, strength: r.strength }))
      }
    }
  },

  // ── graph context for AI prompts ──
  getGraphContext: () => {
    const s = get()
    const lines: string[] = ['=== Family Knowledge Graph ===', '']

    lines.push('-- People --')
    for (const p of s.persons) {
      lines.push(`${p.emoji} ${p.name} (${p.role}): ${p.bio}`)
    }

    lines.push('', '-- Interests --')
    for (const i of s.interests) {
      lines.push(`${i.emoji} ${i.name} [${i.category}]: ${i.description}`)
    }

    lines.push('', '-- Values --')
    for (const v of s.values) {
      lines.push(`${v.emoji} ${v.name} (${v.practiceFrequency}): ${v.description}`)
    }

    lines.push('', '-- Events --')
    for (const e of s.events) {
      lines.push(`${e.emoji} ${e.title} (${e.date}, ${e.impact}): ${e.description}`)
    }

    lines.push('', '-- Goals --')
    for (const g of s.goals) {
      lines.push(`${g.emoji} ${g.title} [${g.progress}%]: ${g.description} (target: ${g.targetDate})`)
    }

    lines.push('', '-- Books --')
    for (const b of s.books) {
      lines.push(`${b.emoji} ${b.title} by ${b.author} (${b.totalPages}p, ${b.linesPerPage}줄/p)`)
    }

    lines.push('', '-- Relationships --')
    for (const r of s.relations) {
      lines.push(`${r.sourceId} --[${r.relationType}: ${r.label}]--> ${r.targetId} (strength: ${r.strength})`)
    }

    if (s.insights.length > 0) {
      lines.push('', '-- Past Insights --')
      for (const ins of s.insights.slice(-5)) {
        lines.push(`${ins.emoji} ${ins.title}: ${ins.content}`)
      }
    }

    return lines.join('\n')
  },
}))
