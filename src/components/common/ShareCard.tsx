import { useState, useMemo } from 'react'
import { useReadingStore } from '@/stores/readingStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useShareImage } from '@/hooks/useShareImage'

interface Props {
  month: string
  onClose: () => void
}

export default function ShareCard({ month, onClose }: Props) {
  const { ref, download, share } = useShareImage()
  const [saving, setSaving] = useState(false)

  const persons = useReadingStore((s) => s.persons)
  const readingLogs = useReadingStore((s) => s.readingLogs)
  const getTotalLinesForMonth = useReadingStore((s) => s.getTotalLinesForMonth)
  const getFamilyStreak = useReadingStore((s) => s.getFamilyStreak)
  const addToast = useReadingStore((s) => s.addToast)
  const family = useFamilyStore((s) => s.family)

  const [y, m] = month.split('-').map(Number)
  const displayMonth = `${y}년 ${m}월`
  const familyStreak = getFamilyStreak()

  const memberStats = useMemo(() => {
    return persons.map((p) => {
      const lines = getTotalLinesForMonth(p.id, month)
      const logCount = readingLogs.filter((l) => l.personId === p.id && l.date.startsWith(month)).length
      return { ...p, lines, logCount }
    }).sort((a, b) => b.lines - a.lines)
  }, [persons, month, getTotalLinesForMonth, readingLogs])

  const totalLines = memberStats.reduce((s, m) => s + m.lines, 0)
  const totalLogs = readingLogs.filter((l) => l.date.startsWith(month)).length
  const booksRead = new Set(readingLogs.filter((l) => l.date.startsWith(month)).map((l) => l.bookId)).size

  const handleSave = async () => {
    setSaving(true)
    try {
      await download(`reading-${month}.png`)
    } catch {
      addToast('이미지 저장에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    setSaving(true)
    try {
      await share(`${family?.name ?? '가족'} ${displayMonth} 독서 리포트`, `reading-${month}`)
    } catch {
      addToast('공유에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="독서 리포트 공유"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-3 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The card to capture — uses inline styles for html2canvas compatibility */}
        <div
          ref={ref}
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 30%, #fffbeb 60%, #fef9c3 100%)',
            borderRadius: '16px',
          }}
        >
          <div style={{ padding: '28px 24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>{displayMonth} 독서 리포트</p>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1c1917', marginTop: '4px', fontFamily: "'Gowun Batang', serif" }}>
                {family?.emoji ?? '📚'} {family?.name ?? '가족 독서'}
              </h2>
            </div>

            {/* Big stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#b45309' }}>{totalLines.toLocaleString()}</p>
                <p style={{ fontSize: '10px', color: '#78716c', marginTop: '2px' }}>읽은 줄</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#b45309' }}>{booksRead}</p>
                <p style={{ fontSize: '10px', color: '#78716c', marginTop: '2px' }}>읽은 책</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '12px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#b45309' }}>{familyStreak}</p>
                <p style={{ fontSize: '10px', color: '#78716c', marginTop: '2px' }}>연속일</p>
              </div>
            </div>

            {/* Member ranking */}
            <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {memberStats.map((member, i) => {
                const maxLines = memberStats[0]?.lines || 1
                const pct = Math.round((member.lines / maxLines) * 100)
                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                    <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <span style={{ fontSize: '12px' }}>{member.emoji}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#44403c', width: '48px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</span>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, backgroundColor: member.color || '#f59e0b' }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: '#78716c', width: '56px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {member.lines.toLocaleString()}줄
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(180, 83, 9, 0.5)' }}>
              Family Reading Race · {totalLogs}건 기록
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-white text-stone-700 font-bold text-sm rounded-xl shadow-sm hover:bg-stone-50 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {saving ? '저장 중...' : '이미지 저장'}
          </button>
          <button
            onClick={handleShare}
            disabled={saving}
            className="flex-1 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-amber-600 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {saving ? '준비 중...' : '공유하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
