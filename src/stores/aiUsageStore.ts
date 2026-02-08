import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { useFamilyStore } from './familyStore'

const DAILY_FREE_LIMIT = 3
const LS_KEY = 'fg_ai_usage'

/** Emails with unlimited AI usage (no daily cap) */
const UNLIMITED_EMAILS = ['skypeople41@gmail.com']

type AiFeature = 'chat' | 'extract'

interface AiUsageState {
  todayCount: number
  loading: boolean
  /** True when user has hit the daily free limit */
  limitReached: boolean
  remaining: number

  loadTodayUsage: () => Promise<void>
  recordUsage: (feature: AiFeature) => Promise<boolean>
  canUse: () => boolean
}

function isUnlimitedUser(): boolean {
  const email = useAuthStore.getState().user?.email
  return !!email && UNLIMITED_EMAILS.includes(email.toLowerCase())
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

function getLocalCount(): number {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw) as { date: string; count: number }
    return data.date === todayKey() ? data.count : 0
  } catch {
    return 0
  }
}

function setLocalCount(count: number) {
  localStorage.setItem(LS_KEY, JSON.stringify({ date: todayKey(), count }))
}

export const useAiUsageStore = create<AiUsageState>((set, get) => ({
  todayCount: 0,
  loading: false,
  limitReached: false,
  remaining: DAILY_FREE_LIMIT,

  loadTodayUsage: async () => {
    if (isUnlimitedUser()) {
      set({ todayCount: 0, limitReached: false, remaining: Infinity, loading: false })
      return
    }

    if (!isSupabaseConfigured) {
      const count = getLocalCount()
      set({
        todayCount: count,
        limitReached: count >= DAILY_FREE_LIMIT,
        remaining: Math.max(0, DAILY_FREE_LIMIT - count),
      })
      return
    }

    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    set({ loading: true })
    const startOfDay = todayKey() + 'T00:00:00.000Z'

    const { count } = await supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('used_at', startOfDay)

    const c = count ?? 0
    set({
      todayCount: c,
      limitReached: c >= DAILY_FREE_LIMIT,
      remaining: Math.max(0, DAILY_FREE_LIMIT - c),
      loading: false,
    })
  },

  recordUsage: async (feature: AiFeature) => {
    if (isUnlimitedUser()) return true

    const { todayCount } = get()
    if (todayCount >= DAILY_FREE_LIMIT) return false

    const newCount = todayCount + 1

    if (!isSupabaseConfigured) {
      setLocalCount(newCount)
      set({
        todayCount: newCount,
        limitReached: newCount >= DAILY_FREE_LIMIT,
        remaining: Math.max(0, DAILY_FREE_LIMIT - newCount),
      })
      return true
    }

    const userId = useAuthStore.getState().user?.id
    const familyId = useFamilyStore.getState().activeFamilyId
    if (!userId || !familyId) return false

    const { error } = await supabase.from('ai_usage').insert({
      user_id: userId,
      family_id: familyId,
      feature,
    })

    if (error) {
      console.error('[ai_usage] insert error:', error)
      return false
    }

    set({
      todayCount: newCount,
      limitReached: newCount >= DAILY_FREE_LIMIT,
      remaining: Math.max(0, DAILY_FREE_LIMIT - newCount),
    })
    return true
  },

  canUse: () => isUnlimitedUser() || get().todayCount < DAILY_FREE_LIMIT,
}))
