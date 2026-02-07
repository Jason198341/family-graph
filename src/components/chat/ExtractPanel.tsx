import { useState, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useAiUsageStore } from '@/stores/aiUsageStore'
import { extractEntities as apiExtractEntities } from '@/utils/fireworksApi'
import PaywallBanner from '@/components/common/PaywallBanner'
import type { ExtractedEntity, ExtractedRelation, ExtractionResult } from '@/types'

const sampleText = `오늘 현규가 아침에 5km 러닝을 하고 왔다. 마라톤 훈련이 점점 강도가 올라가고 있다.
엄마는 아이들을 위해 건강한 도시락을 준비했다. 요리 실력이 날로 늘고 있다.
첫째는 영어 원서 "The Little Prince"를 다 읽었다. 벌써 올해 세 번째 책이다.
주말에 가족 모두 근처 공원에서 산책을 했다. 서로의 한 주를 나누며 좋은 시간을 보냈다.
현규는 자동차 부품 원가 분석 프로젝트를 마무리하고, 영어 프레젠테이션을 준비 중이다.`

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  person: { bg: 'bg-primary-500/15', border: 'border-primary-500/30', text: 'text-primary-300' },
  interest: { bg: 'bg-accent-500/15', border: 'border-accent-500/30', text: 'text-accent-300' },
  value: { bg: 'bg-warm-500/15', border: 'border-warm-500/30', text: 'text-warm-300' },
  event: { bg: 'bg-growth-500/15', border: 'border-growth-500/30', text: 'text-growth-300' },
  goal: { bg: 'bg-primary-400/15', border: 'border-primary-400/30', text: 'text-primary-200' },
}

function ShimmerBox() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-10 rounded-xl bg-gradient-to-r from-surface-lighter via-surface-hover to-surface-lighter bg-[length:200%_100%]"
          style={{ animation: `shimmer 1.5s linear infinite`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

function EntityPill({ entity }: { entity: ExtractedEntity }) {
  const colors = categoryColors[entity.category] ?? categoryColors.interest
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${colors.bg} ${colors.border} ${colors.text}`}
    >
      <span>{entity.emoji}</span>
      <span>{entity.name}</span>
      <span className="text-[9px] opacity-60 uppercase">{entity.category}</span>
    </span>
  )
}

function RelationArrow({ rel }: { rel: ExtractedRelation }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span className="font-medium text-gray-300 bg-surface-lighter px-2 py-1 rounded-lg">{rel.sourceName}</span>
      <div className="flex items-center gap-1 text-gray-600">
        <div className="w-6 h-px bg-gray-600" />
        <span className="text-[10px] text-gray-500 whitespace-nowrap">{rel.label}</span>
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M8 6L4 3v6l4-3z" />
        </svg>
      </div>
      <span className="font-medium text-gray-300 bg-surface-lighter px-2 py-1 rounded-lg">{rel.targetName}</span>
    </div>
  )
}

export default function ExtractPanel() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const isAiLoading = useGraphStore((s) => s.isAiLoading)
  const setAiLoading = useGraphStore((s) => s.setAiLoading)
  const importExtraction = useGraphStore((s) => s.importExtraction)
  const addToast = useGraphStore((s) => s.addToast)

  const canUse = useAiUsageStore((s) => s.canUse)
  const limitReached = useAiUsageStore((s) => s.limitReached)
  const recordUsage = useAiUsageStore((s) => s.recordUsage)
  const loadTodayUsage = useAiUsageStore((s) => s.loadTodayUsage)

  useEffect(() => { loadTodayUsage() }, [loadTodayUsage])

  const handleExtract = async () => {
    if (!inputText.trim() || isAiLoading) return

    // Check AI usage limit
    if (!canUse()) {
      setShowPaywall(true)
      return
    }

    setAiLoading(true)
    setResult(null)

    // Record usage before calling AI
    const allowed = await recordUsage('extract')
    if (!allowed) {
      setAiLoading(false)
      setShowPaywall(true)
      return
    }

    try {
      let extraction: ExtractionResult
      try {
        extraction = await apiExtractEntities(inputText)
      } catch {
        extraction = localExtract(inputText)
      }

      setResult(extraction)
      addToast(`${extraction.entities.length}개 엔티티, ${extraction.relations.length}개 관계 추출됨`, 'info')
    } catch {
      addToast('분석 중 오류가 발생했습니다', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleImport = () => {
    if (!result) return
    importExtraction(result)
    addToast('그래프에 추가되었습니다!', 'success')
    setResult(null)
    setInputText('')
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Paywall modal */}
      {showPaywall && <PaywallBanner variant="modal" onClose={() => setShowPaywall(false)} />}

      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-border bg-surface-light/50 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">✨</span> AI 엔티티 추출
          </h2>
          <PaywallBanner variant="inline" />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">일상 텍스트에서 가족 지식그래프 엔티티와 관계를 자동 추출합니다</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Input area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">입력 텍스트</label>
            <button
              onClick={() => setInputText(sampleText)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-accent-500/10 border border-accent-500/20 text-accent-400 hover:bg-accent-500/20 transition-colors cursor-pointer"
            >
              예시 텍스트
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="가족의 일상을 입력하세요... 예: 오늘 현규가 마라톤 훈련을 했다. 엄마는 새로운 요리를 만들었다."
            rows={6}
            className="w-full bg-surface-lighter border border-surface-border rounded-2xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 resize-none outline-none focus:border-primary-500/40 transition-colors"
          />
          {limitReached ? (
            <PaywallBanner variant="inline" />
          ) : (
            <button
              onClick={handleExtract}
              disabled={!inputText.trim() || isAiLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 disabled:from-surface-border disabled:to-surface-border text-white font-medium text-sm rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l1.09 3.26L16 6l-2.91.74L12 10l-1.09-3.26L8 6l2.91-.74L12 2z" />
                    <path d="M5 14l.72 2.17L8 17l-2.28.83L5 20l-.72-2.17L2 17l2.28-.83L5 14z" />
                    <path d="M19 14l.72 2.17L22 17l-2.28.83L19 20l-.72-2.17L16 17l2.28-.83L19 14z" />
                  </svg>
                  AI 분석
                </>
              )}
            </button>
          )}
        </div>

        {/* Loading shimmer */}
        {isAiLoading && (
          <div className="animate-fade-in-up">
            <p className="text-xs text-gray-500 mb-3">텍스트를 분석하고 있습니다...</p>
            <ShimmerBox />
          </div>
        )}

        {/* Results */}
        {result && !isAiLoading && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Summary */}
            {result.summary && (
              <div className="bg-surface-light/80 border border-surface-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">요약</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Extracted entities */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                추출된 엔티티 ({result.entities.length})
              </h3>
              {result.entities.length === 0 ? (
                <p className="text-sm text-gray-600">추출된 엔티티가 없습니다</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.entities.map((ent, i) => (
                    <EntityPill key={`${ent.name}-${i}`} entity={ent} />
                  ))}
                </div>
              )}
            </div>

            {/* Extracted relations */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                추출된 관계 ({result.relations.length})
              </h3>
              {result.relations.length === 0 ? (
                <p className="text-sm text-gray-600">추출된 관계가 없습니다</p>
              ) : (
                <div className="space-y-2.5">
                  {result.relations.map((rel, i) => (
                    <RelationArrow key={`${rel.sourceName}-${rel.targetName}-${i}`} rel={rel} />
                  ))}
                </div>
              )}
            </div>

            {/* Import button */}
            <button
              onClick={handleImport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-growth-600 hover:bg-growth-500 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              그래프에 추가
            </button>
          </div>
        )}

        {/* Empty state */}
        {!result && !isAiLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 border border-accent-500/20 flex items-center justify-center mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-400">텍스트를 입력하고 AI 분석을 시작하세요</h3>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              가족의 일상 기록, 일기, 대화 내용 등을 입력하면 자동으로 엔티티와 관계를 추출합니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Local extraction fallback ──────────────────
function localExtract(text: string): ExtractionResult {
  const entities: ExtractedEntity[] = []
  const relations: ExtractedRelation[] = []
  const seenNames = new Set<string>()

  // Simple Korean entity detection patterns
  const personPatterns = [
    { pattern: /현규/g, name: '현규', emoji: '👨‍💼' },
    { pattern: /엄마/g, name: '엄마', emoji: '👩‍🍳' },
    { pattern: /첫째/g, name: '첫째', emoji: '👧' },
    { pattern: /아빠/g, name: '현규', emoji: '👨‍💼' },
  ]

  const activityPatterns = [
    { pattern: /마라톤|러닝|달리/g, name: '마라톤', emoji: '🏃', category: 'fitness' as const },
    { pattern: /요리|도시락|식사/g, name: '요리', emoji: '🍳', category: 'hobby' as const },
    { pattern: /영어|english/gi, name: '영어 학습', emoji: '📝', category: 'education' as const },
    { pattern: /독서|책|원서|읽/g, name: '독서', emoji: '📖', category: 'education' as const },
    { pattern: /자동차|부품|원가/g, name: '자동차 공학', emoji: '🚗', category: 'career' as const },
    { pattern: /산책|공원|운동/g, name: '가족 산책', emoji: '🚶', category: 'fitness' as const },
    { pattern: /프레젠테이션|발표/g, name: '프레젠테이션', emoji: '📊', category: 'career' as const },
  ]

  const eventPatterns = [
    { pattern: /완주|완료|다 읽/g, name: '목표 달성', emoji: '🎉' },
    { pattern: /주말|오늘/g, name: '일상 기록', emoji: '📅' },
  ]

  // Extract persons
  for (const { pattern, name, emoji } of personPatterns) {
    if (pattern.test(text) && !seenNames.has(name)) {
      seenNames.add(name)
      entities.push({ name, category: 'person', emoji, description: `텍스트에서 언급된 가족 구성원: ${name}` })
    }
    pattern.lastIndex = 0
  }

  // Extract activities/interests
  const foundActivities: string[] = []
  for (const { pattern, name, emoji, category: actCat } of activityPatterns) {
    if (pattern.test(text) && !seenNames.has(name)) {
      seenNames.add(name)
      foundActivities.push(name)
      entities.push({ name, category: 'interest', emoji, description: `텍스트에서 언급된 ${actCat} 활동: ${name}` })
    }
    pattern.lastIndex = 0
  }

  // Extract events
  for (const { pattern, name, emoji } of eventPatterns) {
    if (pattern.test(text) && !seenNames.has(name)) {
      seenNames.add(name)
      entities.push({ name, category: 'event', emoji, description: `텍스트에서 감지된 이벤트` })
    }
    pattern.lastIndex = 0
  }

  // Generate relations between found persons and activities
  const foundPersons = entities.filter((e) => e.category === 'person')
  for (const person of foundPersons) {
    for (const activity of foundActivities) {
      // Check if person and activity appear near each other in text
      const personIdx = text.indexOf(person.name)
      const actIdx = text.indexOf(activity)
      if (personIdx >= 0 && actIdx >= 0 && Math.abs(personIdx - actIdx) < 100) {
        relations.push({
          sourceName: person.name,
          targetName: activity,
          relationType: 'participates',
          label: '참여',
        })
      }
    }
  }

  const summary = `텍스트에서 ${entities.length}개의 엔티티와 ${relations.length}개의 관계를 추출했습니다. ${foundPersons.map((p) => p.name).join(', ')}의 활동이 기록되어 있습니다.`

  return { entities, relations, summary }
}
