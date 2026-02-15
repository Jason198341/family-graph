import { useState, useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useAiUsageStore } from '@/stores/aiUsageStore'
import { scoreWriting, calcGrade, calcBadges } from '@/utils/writingScorer'
import ScoreCard from './ScoreCard'
import type { WritingEntry, WritingScores, WritingFeedback, WritingGrade } from '@/types'

export default function WritingForm() {
  const persons = useGraphStore((s) => s.persons)
  const writingEntries = useGraphStore((s) => s.writingEntries)
  const addWritingEntry = useGraphStore((s) => s.addWritingEntry)
  const canUse = useAiUsageStore((s) => s.canUse)
  const recordUsage = useAiUsageStore((s) => s.recordUsage)
  const remaining = useAiUsageStore((s) => s.remaining)

  const [personId, setPersonId] = useState(persons[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scoring, setScoring] = useState(false)
  const [result, setResult] = useState<{
    totalScore: number
    grade: WritingGrade
    scores: WritingScores
    feedback: WritingFeedback
    badges: string[]
  } | null>(null)

  const charCount = content.length
  const wordCount = useMemo(() => {
    const trimmed = content.trim()
    return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  }, [content])

  const selectedPerson = persons.find((p) => p.id === personId)
  const isValid = personId && title.trim().length >= 2 && content.trim().length >= 20

  async function handleSubmit() {
    if (!isValid || scoring) return
    if (!canUse()) return

    setScoring(true)
    setResult(null)

    try {
      const allowed = await recordUsage('writing')
      if (!allowed) {
        setScoring(false)
        return
      }

      const currentYear = new Date().getFullYear()
      const writerAge = selectedPerson?.birthYear
        ? currentYear - selectedPerson.birthYear
        : 30

      const { scores, feedback } = await scoreWriting(title, content, writerAge)
      const totalScore = scores.content + scores.logic + scores.depth + scores.specificity + scores.clarity
      const grade = calcGrade(totalScore)
      const isFirst = writingEntries.filter((e) => e.personId === personId).length === 0
      const badges = calcBadges(scores, totalScore, isFirst)

      const entry: WritingEntry = {
        id: crypto.randomUUID(),
        personId,
        date: new Date().toISOString().slice(0, 10),
        title: title.trim(),
        content: content.trim(),
        charCount,
        wordCount,
        scores,
        totalScore,
        grade,
        feedback,
        badges,
      }

      addWritingEntry(entry)
      setResult({ totalScore, grade, scores, feedback, badges })
      setTitle('')
      setContent('')
    } catch (err) {
      console.error('[WritingForm] error:', err)
    } finally {
      setScoring(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Person selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => setPersonId(p.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              personId === p.id
                ? 'border-primary-500/50 bg-primary-500/10 text-white'
                : 'border-surface-border bg-surface-light/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-base">{p.emoji}</span>
            {p.name}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="글 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        className="w-full px-4 py-2.5 bg-surface-light/80 border border-surface-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
      />

      {/* Content textarea */}
      <div className="relative">
        <textarea
          placeholder="글을 작성해 주세요 (최소 20자)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 bg-surface-light/80 border border-surface-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors resize-y leading-relaxed"
        />
        <div className="absolute bottom-2 right-3 flex gap-3 text-[10px] text-gray-600">
          <span>{charCount}자</span>
          <span>{wordCount}단어</span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid || scoring || !canUse()}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {scoring ? '채점 중...' : '✍️ AI 채점하기'}
        </button>
        <span className="text-[10px] text-gray-600">
          오늘 남은 횟수: {remaining === Infinity ? '∞' : remaining}
        </span>
      </div>

      {/* Result */}
      {result && (
        <ScoreCard
          totalScore={result.totalScore}
          grade={result.grade}
          scores={result.scores}
          feedback={result.feedback}
          badges={result.badges}
        />
      )}
    </div>
  )
}
