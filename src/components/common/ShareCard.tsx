import { useRef, useState, useMemo } from 'react'
import html2canvas from 'html2canvas'
import { useReadingStore } from '@/stores/readingStore'
import { useFamilyStore } from '@/stores/familyStore'

interface Props {
  month: string
  onClose: () => void
}

export default function ShareCard({ month, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const persons = useReadingStore((s) => s.persons)
  const readingLogs = useReadingStore((s) => s.readingLogs)
  const getTotalLinesForMonth = useReadingStore((s) => s.getTotalLinesForMonth)
  const getFamilyStreak = useReadingStore((s) => s.getFamilyStreak)
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
    if (!cardRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `reading-${month}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    if (!cardRef.current) return
    if (!navigator.share) {
      handleSave()
      return
    }
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png'),
      )
      const file = new File([blob], `reading-${month}.png`, { type: 'image/png' })
      await navigator.share({ files: [file], title: `${family?.name ?? '가족'} 독서 현황` })
    } catch {
      // User cancelled share
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-3 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* The card to capture */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 30%, #fffbeb 60%, #fef9c3 100%)',
          }}
        >
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="text-center">
              <p className="text-xs text-amber-700/70 font-medium">{displayMonth} 독서 리포트</p>
              <h2 className="text-xl font-bold text-stone-800 mt-1" style={{ fontFamily: "'Gowun Batang', serif" }}>
                {family?.emoji ?? '📚'} {family?.name ?? '가족 독서'}
              </h2>
            </div>

            {/* Big stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-2xl font-bold text-amber-700">{totalLines.toLocaleString()}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">읽은 줄</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-2xl font-bold text-amber-700">{booksRead}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">읽은 책</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-2xl font-bold text-amber-700">{familyStreak}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">연속일</p>
              </div>
            </div>

            {/* Member ranking */}
            <div className="bg-white/50 rounded-xl p-3 space-y-2">
              {memberStats.map((m, i) => {
                const maxLines = memberStats[0]?.lines || 1
                const pct = Math.round((m.lines / maxLines) * 100)
                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <span className="text-xs">{m.emoji}</span>
                    <span className="text-xs font-medium text-stone-700 w-12 truncate">{m.name}</span>
                    <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: m.color || '#f59e0b' }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 tabular-nums w-14 text-right">
                      {m.lines.toLocaleString()}줄
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <p className="text-center text-[10px] text-amber-700/50">
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
