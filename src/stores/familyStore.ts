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

    // Load all members
    const { data: allMembers } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', fam.id)

    // Load profiles for those members
    const userIds = (allMembers ?? []).map((m) => m.user_id)
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('*').in('id', userIds)
      : { data: [] }

    const profileMap = new Map(
      (profiles ?? []).map((p: { id: string; display_name: string; email: string; avatar_emoji: string }) => [p.id, p])
    )

    const members: FamilyMember[] = (allMembers ?? []).map((m) => {
      const profile = profileMap.get(m.user_id)
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

    const { data, error } = await supabase.rpc('create_family_with_admin', {
      family_name: name,
      family_emoji: emoji,
    })

    if (error) {
      console.error('[createFamily] rpc error:', error)
      return null
    }

    const result = data as { id: string; name: string; emoji: string; invite_code: string } | null
    if (!result) return null

    await get().loadFamily()
    return get().family ?? {
      id: result.id,
      name: result.name,
      emoji: result.emoji,
      inviteCode: result.invite_code,
      createdBy: useAuthStore.getState().user?.id ?? '',
      createdAt: new Date().toISOString(),
    }
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
