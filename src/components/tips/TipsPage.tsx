import { useState, useRef, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { readingTips, CATEGORIES, type ReadingTip } from '@/data/readingTips'

const DIFFICULTY_LABEL: Record<number, string> = { 1: '쉬움', 2: '보통', 3: '고급' }
const DIFFICULTY_COLOR: Record<number, string> = {
  1: 'bg-olive-500/20 text-olive-300',
  2: 'bg-amber-500/20 text-amber-600',
  3: 'bg-rose-500/20 text-rose-300',
}

const FIREWORKS_KEY = import.meta.env.VITE_FIREWORKS_API_KEY

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  '우리 가족에게 맞는 독서 전략을 추천해주세요',
  '아이와 함께 읽을 책을 추천해주세요',
  '이번 주 가족 독서 미션을 만들어주세요',
  '읽은 책으로 가족 토론 질문을 만들어주세요',
]

const AI_LIMIT_KEY = 'fg_ai_last_used'
const getToday = () => new Date().toISOString().slice(0, 10)
const isUsedToday = () => localStorage.getItem(AI_LIMIT_KEY) === getToday()
const markUsedToday = () => localStorage.setItem(AI_LIMIT_KEY, getToday())

export default function TipsPage() {
  const [category, setCategory] = useState('전체')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCoach, setShowCoach] = useState(true)
  const [aiUsedToday, setAiUsedToday] = useState(isUsedToday)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const bookProgress = useGraphStore((s) => s.bookProgress)
  const readingLogs = useGraphStore((s) => s.readingLogs)

  const filtered = category === '전체'
    ? readingTips
    : readingTips.filter((t) => t.category === category)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildSystemPrompt = () => {
    const memberInfo = persons.map((p) => `${p.emoji} ${p.name} (${p.role})`).join(', ')
    const bookInfo = books.map((b) => {
      const completed = bookProgress.some((bp) => bp.bookId === b.id && bp.completed)
      return `${b.emoji} ${b.title} by ${b.author}${completed ? ' [완독]' : ''}`
    }).join(', ')
    const totalLogs = readingLogs.length
    const totalLines = readingLogs.reduce((s, l) => s + l.linesRead, 0)

    return `당신은 따뜻하고 지혜로운 가족 독서 코치입니다. 이름은 "책벗"입니다.

가족 정보:
- 구성원: ${memberInfo || '아직 없음'}
- 보유 도서: ${bookInfo || '아직 없음'}
- 총 독서 기록: ${totalLogs}회, ${totalLines.toLocaleString()}줄

당신의 역할:
1. 가족 구성원의 나이와 역할에 맞는 독서 전략을 제안합니다
2. 가족이 함께 읽을 책을 추천합니다
3. 주간 가족 독서 미션을 만들어줍니다
4. 읽은 책에 대한 토론 질문을 생성합니다
5. 독서 습관 형성을 위한 구체적 조언을 합니다

대화 규칙:
- 한국어로 답변합니다
- 가족 전체를 고려한 답변을 합니다
- 구체적이고 실천 가능한 조언을 합니다
- 따뜻하고 격려하는 톤을 유지합니다
- 답변은 300자 이내로 간결하게 합니다
- 이모지를 적절히 사용합니다`
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    if (aiUsedToday) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/fireworks/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIREWORKS_KEY}`,
        },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/deepseek-v3p1',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content ?? '죄송합니다, 응답을 생성하지 못했어요.'
      setMessages([...newMessages, { role: 'assistant', content: reply }])
      markUsedToday()
      setAiUsedToday(true)
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '연결에 실패했어요. 잠시 후 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 md:p-8 space-y-2 md:space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>📚</span> 독서 코치
        </h1>
        <p className="text-sm text-espresso-300 mt-1">
          AI 독서 코치 "책벗"과 대화하고, 독서법을 익혀보세요
        </p>
      </div>

      {/* Tab toggle: Coach / Tips */}
      <div className="flex items-center gap-1 bg-surface-light/80 border border-surface-border rounded-xl p-1 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => setShowCoach(true)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            showCoach ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
          }`}
        >
          <span>🤖</span> AI 코치
        </button>
        <button
          onClick={() => setShowCoach(false)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            !showCoach ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
          }`}
        >
          <span>📖</span> 독서법
        </button>
      </div>

      {/* AI Coach */}
      {showCoach && (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          {/* Daily limit notice */}
          {aiUsedToday && messages.length === 0 && (
            <div className="border border-amber-500/30 rounded-xl md:rounded-2xl p-3 md:p-5 text-center">
              <p className="text-2xl mb-2">🌙</p>
              <p className="text-sm font-semibold text-cream-100">오늘의 AI 코치 상담을 이미 사용했어요</p>
              <p className="text-xs text-espresso-300 mt-1">하루에 1회 사용할 수 있어요. 내일 다시 만나요!</p>
              <p className="text-xs text-espresso-400 mt-3">독서법 가이드 탭에서 다양한 독서 팁을 확인해보세요</p>
            </div>
          )}

          {/* Quick prompts */}
          {messages.length === 0 && !aiUsedToday && (
            <div className="md:bg-surface-light/80 md:backdrop-blur-md md:border md:border-surface-border md:rounded-2xl md:p-5">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <p className="text-xs text-espresso-400">빠른 질문</p>
                <p className="text-xs text-espresso-400">하루 1회</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs p-3 bg-surface-lighter rounded-xl border border-surface-border text-cream-200 hover:border-amber-500/30 hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.length > 0 && (
            <div className="md:bg-surface-light/80 md:backdrop-blur-md md:border md:border-surface-border md:rounded-2xl md:p-5 max-h-96 overflow-y-auto space-y-3 md:space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-amber-500/20 text-cream-100'
                        : 'bg-surface-lighter text-cream-200 border border-surface-border'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <p className="text-xs text-amber-600 font-semibold mb-1">📚 책벗</p>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surface-lighter rounded-2xl px-4 py-2.5 border border-surface-border">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          {aiUsedToday && messages.length > 0 && (
            <div className="text-center py-2">
              <p className="text-xs text-espresso-400">오늘의 상담이 완료되었습니다. 내일 다시 이용해주세요.</p>
            </div>
          )}
          {!aiUsedToday && (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="독서 코치에게 질문해보세요..."
                className="flex-1 text-sm p-3 bg-surface-light/80 rounded-xl border border-surface-border text-cream-100 placeholder:text-espresso-400"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                전송
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips guide */}
      {!showCoach && (
        <>
          {/* Category filter */}
          <div
            className="flex flex-wrap gap-2 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  category === c.key
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-light/80 text-espresso-300 hover:text-cream-100 border border-surface-border'
                }`}
              >
                <span>{c.emoji}</span> {c.key}
              </button>
            ))}
          </div>

          {/* Tips grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 stagger-fade">
            {filtered.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                expanded={expandedId === tip.id}
                onToggle={() => setExpandedId(expandedId === tip.id ? null : tip.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TipCard({
  tip,
  expanded,
  onToggle,
}: {
  tip: ReadingTip
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`py-2 px-1 md:bg-surface-light/80 md:backdrop-blur-md border-b md:border md:rounded-2xl md:p-5 transition-all cursor-pointer ${
        expanded ? 'border-amber-500/40' : 'border-surface-border md:hover:border-surface-hover'
      }`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">{tip.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-cream-100">{tip.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[tip.difficulty]}`}>
              {DIFFICULTY_LABEL[tip.difficulty]}
            </span>
            <span className="text-xs text-espresso-400">{tip.category}</span>
          </div>
        </div>
        <span className={`text-espresso-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>

      {/* Summary */}
      <p className="mt-3 text-sm text-cream-200 leading-relaxed">{tip.summary}</p>

      {/* Steps (expanded) */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-border space-y-2 animate-fade-in-up">
          <p className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">
            실천 단계
          </p>
          {tip.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-cream-200">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
