import { useFamilyStore } from '@/stores/familyStore'
import InviteCode from './InviteCode'

export default function MemberManager() {
  const family = useFamilyStore((s) => s.family)
  const members = useFamilyStore((s) => s.members)
  const myMembership = useFamilyStore((s) => s.myMembership)
  const approveMember = useFamilyStore((s) => s.approveMember)
  const rejectMember = useFamilyStore((s) => s.rejectMember)
  const regenerateInviteCode = useFamilyStore((s) => s.regenerateInviteCode)

  if (!family) return null

  const isAdmin = myMembership?.role === 'admin'
  const pendingMembers = members.filter((m) => m.status === 'pending')
  const approvedMembers = members.filter((m) => m.status === 'approved')

  return (
    <div className="space-y-6">
      {/* Family info + invite code */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>{family.emoji}</span> {family.name}
        </h3>
        {isAdmin && (
          <InviteCode code={family.inviteCode} onRegenerate={regenerateInviteCode} />
        )}
      </div>

      {/* Pending approvals */}
      {isAdmin && pendingMembers.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            승인 대기 ({pendingMembers.length})
          </h4>
          <div className="space-y-2">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-surface border border-amber-500/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.avatarEmoji ?? '👤'}</span>
                  <div>
                    <p className="text-sm text-white">{m.displayName ?? m.email ?? '알 수 없음'}</p>
                    {m.email && <p className="text-[10px] text-gray-500">{m.email}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => approveMember(m.id)}
                    className="px-2.5 py-1 bg-growth-600/20 text-growth-400 border border-growth-500/30 rounded text-xs hover:bg-growth-600/30 transition-colors cursor-pointer"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => rejectMember(m.id)}
                    className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-600/30 transition-colors cursor-pointer"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved members */}
      <div>
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
          구성원 ({approvedMembers.length})
        </h4>
        <div className="space-y-1.5">
          {approvedMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg">
              <span className="text-lg">{m.avatarEmoji ?? '👤'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{m.displayName ?? m.email ?? '알 수 없음'}</p>
              </div>
              {m.role === 'admin' && (
                <span className="text-[10px] px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                  관리자
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
