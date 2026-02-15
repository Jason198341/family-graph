// ─── Core Entity Types ──────────────────────

export interface FamilyPerson {
  id: string
  name: string
  role: string          // 아빠, 엄마, 아들, 딸
  emoji: string         // avatar emoji
  bio: string
  color: string         // hex color
  birthYear?: number
  goalLines?: number    // 연간 독서 목표 줄 수
  avatarUrl?: string    // base64 data URL or external URL
}

// ─── View State ────────────────────────────

export type AppView = 'dashboard' | 'reading' | 'reviews' | 'tips' | 'share'

// ─── Family / Auth Types (Supabase) ────────

export interface Family {
  id: string
  name: string
  emoji: string
  inviteCode: string
  createdBy: string
  createdAt: string
  avatarUrl?: string    // family photo (base64 data URL)
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
}

export interface BookProgress {
  personId: string
  bookId: string
  currentPage: number
  completed: boolean
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

// ─── Review / Recommendation Types ──────────

export interface BookReview {
  id: string
  personId: string
  bookId: string
  rating: number        // 1-5 stars
  content: string
  likes: string[]       // person IDs who liked
  createdAt: string
}

export interface BookRecommendation {
  id: string
  personId: string      // 추천한 사람
  bookTitle: string
  author: string
  reason: string
  emoji: string
  likes: string[]       // person IDs who liked
  createdAt: string
}

// ─── Community Types (cross-family) ──────────

export interface CommunityFeedPost {
  postId: string
  postType: 'review' | 'recommend'
  personName: string
  personEmoji: string
  familyName: string
  familyEmoji: string
  familyId: string
  bookTitle: string
  bookAuthor: string
  bookEmoji: string
  rating: number        // 0 for recommendations
  content: string
  likes: string[]
  commentCount: number
  createdAt: string
}

export interface PostComment {
  commentId: string
  personName: string
  personEmoji: string
  familyName: string
  familyEmoji: string
  familyId: string
  content: string
  createdAt: string
}

export interface BookReaderInfo {
  familyName: string
  familyEmoji: string
  personName: string
  personEmoji: string
  completed: boolean
  currentPage: number
  totalPages: number
  reviewCount: number
}

// ─── Daily Highlight (오늘의 한 줄) ──────────

export interface DailyHighlight {
  id: string
  personId: string
  bookId: string
  content: string       // 인상 깊은 문장
  date: string          // YYYY-MM-DD
  createdAt: string
}

// ─── Reading Letter (독서 편지) ──────────────

export interface ReadingLetter {
  id: string
  fromPersonId: string
  toPersonId: string
  bookId?: string
  content: string
  createdAt: string
}

// ─── Achievement (도전 과제) ─────────────────

export interface Achievement {
  id: string
  type: string
  label: string
  description: string
  emoji: string
  unlocked: boolean
  progress?: number     // 0-100
  unlockedAt?: string
}
