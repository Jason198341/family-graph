import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Family, FamilyMember } from '@/types'

const DEV_FAMILY: Family = {
  id: 'dev-family',
  name: '우리 가족',
  emoji: '👨‍👩‍👧‍👦',
  inviteCode: 'dev12345',
  createdBy: 'dev-local-user',
  createdAt: new Date().toISOString(),
}

const DEV_MEMBER: FamilyMember = {
  id: 'dev-member',
  familyId: 'dev-family',
  userId: 'dev-local-user',
  role: 'admin',
  status: 'approved',
  createdAt: new Date().toISOString(),
  displayName: '개발자',
  avatarEmoji: '🧑‍💻',
}

type FamilyStatus = 'loading' | 'no-family' | 'pending' | 'ready'

interface FamilyState {
  family: Family | null
  members: FamilyMember[]
  myMembership: FamilyMember | null
  activeFamilyId: string | null
  status: FamilyStatus

  // actions
  loadFamily: () => Promise<void>
  createFamily: (name: string, emoji: string) => Promise<Family | null>
  joinByCode: (code: string) => Promise<{ error?: string }>
  approveMember: (memberId: string) => Promise<void>
  rejectMember: (memberId: string) => Promise<void>
  regenerateInviteCode: () => Promise<string | null>
  leaveFamily: () => Promise<void>
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: null,
  members: [],
  myMembership: null,
  activeFamilyId: null,
  status: 'loading',

  loadFamily: async () => {
    if (!isSupabaseConfigured) {
      set({
        family: DEV_FAMILY,
        members: [DEV_MEMBER],
        myMembership: DEV_MEMBER,
        activeFamilyId: DEV_FAMILY.id,
        status: 'ready',
      })
      return
    }

    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      set({ family: null, members: [], myMembership: null, activeFamilyId: null, status: 'no-family' })
      return
    }

    // Find my membership(s)
    const { data: memberships } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!memberships || memberships.length === 0) {
      set({ family: null, members: [], myMembership: null, activeFamilyId: null, status: 'no-family' })
      return
    }

    // Prefer approved, else take first (pending)
    const approved = memberships.find((m) => m.status === 'approved')
    const active = approved ?? memberships[0]

    if (active.status === 'pending') {
      set({
        family: null,
        members: [],
        myMembership: {
          id: active.id,
          familyId: active.family_id,
          userId: active.user_id,
          role: active.role as 'admin' | 'member',
          status: 'pending',
          createdAt: active.created_at,
        },
        activeFamilyId: null,
        status: 'pending',
      })
      return
    }

    // Load the family
    const { data: fam } = await supabase
      .from('families')
      .select('*')
      .eq('id', active.family_id)
      .single()

    if (!fam) {
      set({ status: 'no-family' })
      return
    }

    // Load all members with profile info
    const { data: allMembers } = await supabase
      .from('family_members')
      .select('*, profiles:user_id(display_name, email, avatar_emoji)')
      .eq('family_id', fam.id)

    const members: FamilyMember[] = (allMembers ?? []).map((m) => {
      const profile = m.profiles as unknown as { display_name: string; email: string; avatar_emoji: string } | null
      return {
        id: m.id,
        familyId: m.family_id,
        userId: m.user_id,
        role: m.role as 'admin' | 'member',
        status: m.status as 'pending' | 'approved' | 'rejected',
        createdAt: m.created_at,
        displayName: profile?.display_name,
        email: profile?.email,
        avatarEmoji: profile?.avatar_emoji,
      }
    })

    const family: Family = {
      id: fam.id,
      name: fam.name,
      emoji: fam.emoji,
      inviteCode: fam.invite_code,
      createdBy: fam.created_by,
      createdAt: fam.created_at,
    }

    set({
      family,
      members,
      myMembership: members.find((m) => m.userId === userId) ?? null,
      activeFamilyId: fam.id,
      status: 'ready',
    })
  },

  createFamily: async (name, emoji) => {
    if (!isSupabaseConfigured) return null
    const userId = useAuthStore.getState().user?.id
    if (!userId) return null

    // INSERT without .select() to avoid SELECT RLS timing issue
    const { error } = await supabase
      .from('families')
      .insert({ name, emoji, created_by: userId })

    if (error) {
      console.error('[createFamily] insert error:', error)
      return null
    }

    // Wait for trigger, then verify membership exists
    await new Promise((r) => setTimeout(r, 500))

    // Fallback: if trigger didn't create membership, do it manually
    const { data: existing } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .limit(1)

    if (!existing || existing.length === 0) {
      // Find the family we just created
      const { data: fam } = await supabase
        .from('families')
        .select('id')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fam) {
        await supabase.from('family_members').insert({
          family_id: fam.id,
          user_id: userId,
          role: 'admin',
          status: 'approved',
        })
      }
    }

    await get().loadFamily()
    return get().family
  },

  joinByCode: async (code) => {
    if (!isSupabaseConfigured) return { error: 'Dev mode' }

    const { data, error } = await supabase.rpc('join_family_by_code', { code })
    if (error) return { error: error.message }
    const result = data as { error?: string }
    if (result.error) return { error: result.error }

    await get().loadFamily()
    return {}
  },

  approveMember: async (memberId) => {
    if (!isSupabaseConfigured) return
    await supabase.rpc('approve_member', { member_id: memberId })
    await get().loadFamily()
  },

  rejectMember: async (memberId) => {
    if (!isSupabaseConfigured) return
    await supabase.rpc('reject_member', { member_id: memberId })
    await get().loadFamily()
  },

  regenerateInviteCode: async () => {
    const { activeFamilyId } = get()
    if (!isSupabaseConfigured || !activeFamilyId) return null

    const { data } = await supabase.rpc('regenerate_invite_code', { fid: activeFamilyId })
    const result = data as { invite_code?: string; error?: string } | null
    if (result?.invite_code) {
      set((s) => s.family ? { family: { ...s.family, inviteCode: result.invite_code! } } : {})
      return result.invite_code
    }
    return null
  },

  leaveFamily: async () => {
    const { myMembership } = get()
    if (!isSupabaseConfigured || !myMembership) return

    await supabase.from('family_members').delete().eq('id', myMembership.id)
    set({ family: null, members: [], myMembership: null, activeFamilyId: null, status: 'no-family' })
  },
}))
