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

// ─── Persistence helpers ─────────────────────

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

function persistState(state: GraphState) {
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

// ─── ID generator ────────────────────────────

function genId(type: string): string {
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

  // view
  setView: (view: AppView) => void
  selectNode: (id: string | null) => void

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
  removeRelation: (id: string) => void

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
  // Default circular positions - will be overridden by layout util
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

  // ── view actions ──
  setView: (view) => set({ activeView: view }),
  selectNode: (id) => set({ selectedNodeId: id }),

  // ── entity add actions ──
  addPerson: (data) => {
    const person: FamilyPerson = { ...data, id: genId('person') }
    set((s) => {
      const next = { persons: [...s.persons, person] }
      persistState({ ...s, ...next })
      return next
    })
    return person
  },

  addInterest: (data) => {
    const interest: Interest = { ...data, id: genId('interest') }
    set((s) => {
      const next = { interests: [...s.interests, interest] }
      persistState({ ...s, ...next })
      return next
    })
    return interest
  },

  addValue: (data) => {
    const value: FamilyValue = { ...data, id: genId('value') }
    set((s) => {
      const next = { values: [...s.values, value] }
      persistState({ ...s, ...next })
      return next
    })
    return value
  },

  addEvent: (data) => {
    const event: LifeEvent = { ...data, id: genId('event') }
    set((s) => {
      const next = { events: [...s.events, event] }
      persistState({ ...s, ...next })
      return next
    })
    return event
  },

  addGoal: (data) => {
    const goal: GrowthGoal = { ...data, id: genId('goal') }
    set((s) => {
      const next = { goals: [...s.goals, goal] }
      persistState({ ...s, ...next })
      return next
    })
    return goal
  },

  addRelation: (data) => {
    const relation: GraphRelation = {
      ...data,
      id: genId('rel'),
      createdAt: Date.now(),
    }
    set((s) => {
      const next = { relations: [...s.relations, relation] }
      persistState({ ...s, ...next })
      return next
    })
    return relation
  },

  // ── entity remove actions (cascading relation removal) ──
  removePerson: (id) =>
    set((s) => {
      const next = {
        persons: s.persons.filter((p) => p.id !== id),
        relations: s.relations.filter(
          (r) => r.sourceId !== id && r.targetId !== id,
        ),
        events: s.events.map((e) => ({
          ...e,
          personIds: e.personIds.filter((pid) => pid !== id),
        })),
        goals: s.goals.filter((g) => g.personId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      persistState({ ...s, ...next })
      return next
    }),

  removeInterest: (id) =>
    set((s) => {
      const next = {
        interests: s.interests.filter((i) => i.id !== id),
        relations: s.relations.filter(
          (r) => r.sourceId !== id && r.targetId !== id,
        ),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      persistState({ ...s, ...next })
      return next
    }),

  removeValue: (id) =>
    set((s) => {
      const next = {
        values: s.values.filter((v) => v.id !== id),
        relations: s.relations.filter(
          (r) => r.sourceId !== id && r.targetId !== id,
        ),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      persistState({ ...s, ...next })
      return next
    }),

  removeEvent: (id) =>
    set((s) => {
      const next = {
        events: s.events.filter((e) => e.id !== id),
        relations: s.relations.filter(
          (r) => r.sourceId !== id && r.targetId !== id,
        ),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      persistState({ ...s, ...next })
      return next
    }),

  removeRelation: (id) =>
    set((s) => {
      const next = { relations: s.relations.filter((r) => r.id !== id) }
      persistState({ ...s, ...next })
      return next
    }),

  // ── goal progress ──
  updateGoalProgress: (id, progress) =>
    set((s) => {
      const next = {
        goals: s.goals.map((g) =>
          g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g,
        ),
      }
      persistState({ ...s, ...next })
      return next
    }),

  // ── book / reading actions ──
  addBook: (data) => {
    const book: Book = { ...data, id: genId('book') }
    set((s) => {
      const next = { books: [...s.books, book] }
      persistState({ ...s, ...next })
      return next
    })
    return book
  },

  removeBook: (id) =>
    set((s) => {
      const next = {
        books: s.books.filter((b) => b.id !== id),
        relations: s.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        readingLogs: s.readingLogs.filter((l) => l.bookId !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }
      persistState({ ...s, ...next })
      return next
    }),

  addReadingLog: (data) => {
    const log: ReadingLog = { ...data, id: genId('rlog') }
    set((s) => {
      const next = { readingLogs: [...s.readingLogs, log] }
      persistState({ ...s, ...next })
      return next
    })
    return log
  },

  addReadingGoal: (data) => {
    const goal: ReadingGoal = { ...data, id: genId('rgoal') }
    set((s) => {
      const next = { readingGoals: [...s.readingGoals, goal] }
      persistState({ ...s, ...next })
      return next
    })
    return goal
  },

  updateReadingGoal: (id, targetLines) =>
    set((s) => {
      const next = {
        readingGoals: s.readingGoals.map((g) =>
          g.id === id ? { ...g, targetLines } : g,
        ),
      }
      persistState({ ...s, ...next })
      return next
    }),

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

  addInsight: (data) =>
    set((s) => {
      const insight: GrowthInsight = {
        ...data,
        id: genId('insight'),
        createdAt: Date.now(),
      }
      const next = { insights: [...s.insights, insight] }
      persistState({ ...s, ...next })
      return next
    }),

  addChatMessage: (data) =>
    set((s) => {
      const msg: ChatMessage = {
        ...data,
        id: genId('msg'),
        timestamp: Date.now(),
      }
      const next = { chatMessages: [...s.chatMessages, msg] }
      persistState({ ...s, ...next })
      return next
    }),

  // ── toasts ──
  addToast: (message, type) => {
    const id = ++toastCounter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    // auto-dismiss after 4s
    setTimeout(() => {
      get().removeToast(id)
    }, 4_000)
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
    return s.relations.map((rel): Edge => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      label: rel.label,
      type: 'default',
      animated: rel.strength >= 7,
      style: {
        strokeWidth: Math.max(1, Math.round(rel.strength / 3)),
        stroke: CATEGORY_COLORS[rel.sourceType] ?? '#64748b',
      },
    }))
  },

  // ── AI extraction import ──
  importExtraction: (result) => {
    const s = get()
    const nameToId = new Map<string, string>()

    // Build name->id map for existing entities
    for (const p of s.persons) nameToId.set(p.name.toLowerCase(), p.id)
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

    // Add extracted entities
    for (const ent of result.entities) {
      const nameLower = ent.name.toLowerCase()
      if (nameToId.has(nameLower)) continue // skip duplicates

      const id = genId(ent.category)
      nameToId.set(nameLower, id)

      switch (ent.category) {
        case 'person':
          newPersons.push({
            id,
            name: ent.name,
            role: '가족',
            emoji: ent.emoji || '👤',
            bio: ent.description,
            color: CATEGORY_COLORS.person,
          })
          break
        case 'interest':
          newInterests.push({
            id,
            name: ent.name,
            category: 'hobby',
            emoji: ent.emoji || '⭐',
            description: ent.description,
          })
          break
        case 'value':
          newValues.push({
            id,
            name: ent.name,
            emoji: ent.emoji || '💎',
            description: ent.description,
            practiceFrequency: 'weekly',
          })
          break
        case 'event':
          newEvents.push({
            id,
            title: ent.name,
            description: ent.description,
            date: new Date().toISOString().slice(0, 10),
            personIds: [],
            emoji: ent.emoji || '📅',
            impact: 'positive',
          })
          break
        case 'goal':
          newGoals.push({
            id,
            title: ent.name,
            description: ent.description,
            personId: s.persons[0]?.id ?? '',
            targetDate: new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10),
            progress: 0,
            emoji: ent.emoji || '🎯',
          })
          break
      }
    }

    // Add extracted relations
    const newRelations: GraphRelation[] = []
    for (const rel of result.relations) {
      const sourceId = nameToId.get(rel.sourceName.toLowerCase())
      const targetId = nameToId.get(rel.targetName.toLowerCase())
      if (!sourceId || !targetId) continue

      // Determine source/target types
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
      } as unknown as GraphState

      const sourceType = findCategory(merged, sourceId)
      const targetType = findCategory(merged, targetId)
      if (!sourceType || !targetType) continue

      newRelations.push({
        id: genId('rel'),
        sourceId,
        targetId,
        sourceType,
        targetType,
        relationType: rel.relationType,
        label: rel.label,
        strength: 5,
        createdAt: Date.now(),
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
      persistState({ ...prev, ...next })
      return next
    })
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
