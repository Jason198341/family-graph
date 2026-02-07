import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile } from '@/types'
import type { User } from '@supabase/supabase-js'

const DEV_USER: User = {
  id: 'dev-local-user',
  email: 'dev@familygraph.local',
  app_metadata: {},
  user_metadata: { display_name: 'Dev User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const DEV_PROFILE: UserProfile = {
  id: 'dev-local-user',
  email: 'dev@familygraph.local',
  displayName: '개발자',
  avatarEmoji: '🧑‍💻',
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  devMode: boolean

  setUser: (user: User | null) => void
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatarEmoji'>>) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  devMode: !isSupabaseConfigured,

  setUser: (user) => set({ user }),

  fetchProfile: async () => {
    const { user, devMode } = get()
    if (!user) return set({ profile: null })
    if (devMode) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      set({
        profile: {
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          avatarEmoji: data.avatar_emoji,
        },
      })
    }
  },

  updateProfile: async (updates) => {
    const { user, profile, devMode } = get()
    if (!user || !profile) return

    if (!devMode) {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName
      if (updates.avatarEmoji !== undefined) dbUpdates.avatar_emoji = updates.avatarEmoji
      await supabase.from('profiles').update(dbUpdates).eq('id', user.id)
    }
    set({ profile: { ...profile, ...updates } })
  },

  initialize: async () => {
    if (!isSupabaseConfigured) {
      console.warn('[Family Graph] Supabase not configured — running in dev mode')
      set({ user: DEV_USER, profile: DEV_PROFILE, loading: false, initialized: true, devMode: true })
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false, initialized: true })

    if (session?.user) {
      await get().fetchProfile()
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null })
      if (session?.user) {
        await get().fetchProfile()
      } else {
        set({ profile: null })
      }
    })
  },
}))
