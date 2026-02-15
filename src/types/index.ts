// ─── Core Entity Types ──────────────────────

export type NodeCategory = 'person' | 'interest' | 'value' | 'event' | 'goal' | 'book'

export interface FamilyPerson {
  id: string
  name: string
  role: string          // 아빠, 엄마, 아들, 딸
  emoji: string         // avatar emoji
  bio: string
  color: string         // hex color for graph node
  birthYear?: number
  goalLines?: number           // 연간 독서 목표 줄 수
  goalWritingCount?: number    // 연간 글쓰기 목표 편수
  goalWritingAvg?: number      // 연간 글쓰기 목표 평균 점수
}

export interface Interest {
  id: string
  name: string
  category: 'career' | 'fitness' | 'education' | 'hobby' | 'social'
  emoji: string
  description: string
}

export interface FamilyValue {
  id: string
  name: string
  emoji: string
  description: string
  practiceFrequency: 'daily' | 'weekly' | 'monthly'
}

export interface LifeEvent {
  id: string
  title: string
  description: string
  date: string          // ISO date
  personIds: string[]   // related people
  emoji: string
  impact: 'positive' | 'neutral' | 'challenge'
}

export interface GrowthGoal {
  id: string
  title: string
  description: string
  personId: string
  targetDate: string
  progress: number      // 0-100
  emoji: string
}

// ─── Relationship (Edge) Types ─────────────

export type RelationType =
  | 'participates'    // 참여한다
  | 'practices'       // 실천한다
  | 'strengthens'     // 강화한다
  | 'contributes'     // 기여한다
  | 'influences'      // 영향을 준다
  | 'supports'        // 지원한다
  | 'learns'          // 학습한다
  | 'achieves'        // 달성한다
  | 'family'          // 가족이다
  | 'reads'           // 읽는다

export interface GraphRelation {
  id: string
  sourceId: string
  targetId: string
  sourceType: NodeCategory
  targetType: NodeCategory
  relationType: RelationType
  label: string         // human-readable label
  strength: number      // 1-10
  createdAt: number
}

// ─── Graph Node (unified for xyflow) ───────

export interface GraphNodeData {
  category: NodeCategory
  entityId: string
  label: string
  emoji: string
  color: string
  description: string
  meta: Record<string, unknown>
  [key: string]: unknown
}

// ─── AI Types ──────────────────────────────

export interface ExtractedEntity {
  name: string
  category: NodeCategory
  emoji: string
  description: string
}

export interface ExtractedRelation {
  sourceName: string
  targetName: string
  relationType: RelationType
  label: string
}

export interface ExtractionResult {
  entities: ExtractedEntity[]
  relations: ExtractedRelation[]
  summary: string
}

export interface GrowthInsight {
  id: string
  title: string
  content: string
  relatedNodeIds: string[]
  createdAt: number
  emoji: string
}

// ─── Chat Types ────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  relatedNodeIds?: string[]
}

// ─── View State ────────────────────────────

export type AppView = 'dashboard' | 'graph' | 'chat' | 'extract' | 'timeline' | 'reading' | 'writing'

// ─── Family / Auth Types (Supabase) ────────

export interface Family {
  id: string
  name: string
  emoji: string
  inviteCode: string
  createdBy: string
  createdAt: string
}

export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  role: 'admin' | 'member'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  // joined from profiles
  displayName?: string
  email?: string
  avatarEmoji?: string
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarEmoji: string
}

// ─── Book / Reading Types ─────────────────────

export interface Book {
  id: string
  title: string
  author: string
  totalPages: number
  linesPerPage: number
  emoji: string
  color: string
  currentPage?: number
  completed?: boolean
  completedDate?: string
}

export interface ReadingLog {
  id: string
  personId: string
  bookId: string
  date: string            // YYYY-MM-DD
  linesRead: number
}

export interface ReadingGoal {
  id: string
  personId: string
  month: string           // YYYY-MM
  targetLines: number
}

// ─── Writing Types ───────────────────────────

export interface WritingScores {
  content: number       // 0-20 내용 충실도
  logic: number         // 0-20 논리적 구성
  depth: number         // 0-20 사고의 깊이
  specificity: number   // 0-20 구체적 표현
  clarity: number       // 0-20 문장 명확성
}

export interface WritingFeedback {
  content: string
  logic: string
  depth: string
  specificity: string
  clarity: string
  overall: string
}

export type WritingGrade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface WritingEntry {
  id: string
  personId: string
  date: string            // YYYY-MM-DD
  title: string
  content: string
  charCount: number
  wordCount: number
  scores: WritingScores
  totalScore: number      // 0-100
  grade: WritingGrade
  feedback: WritingFeedback
  badges: string[]
}

export interface WritingGoal {
  id: string
  personId: string
  year: number
  targetCount: number
  targetAvgScore: number
}
