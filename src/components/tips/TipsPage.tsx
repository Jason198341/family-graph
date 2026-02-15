import { useState, useRef, useEffect } from 'react'
import { useReadingStore } from '@/stores/readingStore'
import { readingTips, CATEGORIES, type ReadingTip } from '@/data/readingTips'

const DIFFICULTY_LABEL: Record<number, string> = { 1: '쉬움', 2: '보통', 3: '고급' }
const DIFFICULTY_COLOR: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-rose-100 text-rose-700',
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

  const persons = useReadingStore((s) => s.persons)
  const books = useReadingStore((s) => s.books)
  const bookProgress = useReadingStore((s) => s.bookProgress)
  const readingLogs = useReadingStore((s) => s.readingLogs)

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
    <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-24 md:p-6 md:pb-8 space-y-4 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Gowun Batang', serif" }}>
          📚 더보기
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">AI 코치 "책벗"과 독서법 가이드</p>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 bg-white border border-stone-200/60 rounded-xl p-1 shadow-sm animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => setShowCoach(true)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            showCoach ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          🤖 AI 코치
        </button>
        <button
          onClick={() => setShowCoach(false)}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            !showCoach ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          📖 독서법
        </button>
      </div>

      {/* AI Coach */}
      {showCoach && (
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          {/* Daily limit notice */}
          {aiUsedToday && messages.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 text-center">
              <p className="text-2xl mb-2">🌙</p>
              <p className="text-sm font-semibold text-stone-700">오늘의 AI 코치 상담을 이미 사용했어요</p>
              <p className="text-xs text-stone-400 mt-1">하루에 1회 사용할 수 있어요. 내일 다시 만나요!</p>
              <p className="text-xs text-stone-400 mt-3">독서법 가이드 탭에서 다양한 독서 팁을 확인해보세요</p>
            </div>
          )}

          {/* Quick prompts */}
          {messages.length === 0 && !aiUsedToday && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-stone-500">빠른 질문</p>
                <p className="text-[10px] text-stone-400">하루 1회</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs p-3 bg-stone-50 rounded-xl border border-stone-100 text-stone-600 hover:border-amber-300 hover:bg-amber-50/50 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4 max-h-96 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-amber-100 text-stone-800'
                        : 'bg-stone-50 text-stone-700 border border-stone-100'
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
                  <div className="bg-stone-50 rounded-2xl px-4 py-2.5 border border-stone-100">
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
            <p className="text-center text-xs text-stone-400 py-1">오늘의 상담이 완료되었습니다</p>
          )}
          {!aiUsedToday && (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="독서 코치에게 질문해보세요..."
                className="flex-1 text-sm p-3 bg-white rounded-xl border border-stone-200 text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
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
          <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  category === c.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-stone-500 hover:text-stone-700 border border-stone-200'
                }`}
              >
                <span>{c.emoji}</span> {c.key}
              </button>
            ))}
          </div>

          {/* Tips grid */}
          <div className="space-y-2 stagger-fade">
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
      className={`bg-white rounded-xl p-4 border shadow-sm transition-all cursor-pointer ${
        expanded ? 'border-amber-300' : 'border-stone-200/60 hover:border-stone-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{tip.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-stone-800">{tip.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[tip.difficulty]}`}>
              {DIFFICULTY_LABEL[tip.difficulty]}
            </span>
            <span className="text-[10px] text-stone-400">{tip.category}</span>
          </div>
        </div>
        <span className={`text-stone-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </div>

      <p className="mt-2 text-xs text-stone-600 leading-relaxed">{tip.summary}</p>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-stone-100 space-y-2 animate-fade-in-up">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">실천 단계</p>
          {tip.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                {i + 1}
              </span>
              <p className="text-xs text-stone-600">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
