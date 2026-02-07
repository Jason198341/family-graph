import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useGraphStore } from '@/stores/graphStore'
import { useAiUsageStore } from '@/stores/aiUsageStore'
import { streamChat } from '@/utils/fireworksApi'
import PaywallBanner from '@/components/common/PaywallBanner'

/** Throttle streaming text updates to avoid render storms */
function useThrottledState<T>(initial: T, ms = 80) {
  const [value, setValue] = useState(initial)
  const latest = useRef(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = useCallback((v: T) => {
    latest.current = v
    if (!timer.current) {
      timer.current = setTimeout(() => {
        setValue(latest.current)
        timer.current = null
      }, ms)
    }
  }, [ms])

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setValue(latest.current)
  }, [])

  const reset = useCallback((v: T) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    latest.current = v
    setValue(v)
  }, [])

  return [value, set, flush, reset] as const
}

const suggestedQuestions = [
  '현규의 이번 주 성장 조언은?',
  '가족 목표 달성 현황은?',
  '마라톤과 독서의 연결점은?',
  '세연이의 영어 학습을 도울 방법은?',
  '우리 가족 가치를 실천하는 루틴은?',
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{
            animation: `typingBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function GrowthChat() {
  const chatMessages = useGraphStore((s) => s.chatMessages)
  const addChatMessage = useGraphStore((s) => s.addChatMessage)
  const isAiLoading = useGraphStore((s) => s.isAiLoading)
  const setAiLoading = useGraphStore((s) => s.setAiLoading)
  const getGraphContext = useGraphStore((s) => s.getGraphContext)
  const addToast = useGraphStore((s) => s.addToast)

  const canUse = useAiUsageStore((s) => s.canUse)
  const limitReached = useAiUsageStore((s) => s.limitReached)
  const recordUsage = useAiUsageStore((s) => s.recordUsage)
  const loadTodayUsage = useAiUsageStore((s) => s.loadTodayUsage)

  const [input, setInput] = useState('')
  const [streamingText, setStreaming, flushStreaming, resetStreaming] = useThrottledState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const usageLoaded = useRef(false)

  useEffect(() => {
    if (!usageLoaded.current) {
      usageLoaded.current = true
      loadTodayUsage()
    }
  }, [loadTodayUsage])

  // Scroll on new messages or AI loading state change (NOT on every streaming chunk)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAiLoading])

  const handleSubmit = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isAiLoading) return

    // Check AI usage limit
    if (!canUse()) {
      setShowPaywall(true)
      return
    }

    setInput('')
    resetStreaming('')
    addChatMessage({ role: 'user', content: msg })
    setAiLoading(true)

    // Record usage before calling AI
    const allowed = await recordUsage('chat')
    if (!allowed) {
      setAiLoading(false)
      setShowPaywall(true)
      return
    }

    try {
      const context = getGraphContext()
      const systemPrompt = `당신은 '가족 성장 어드바이저'입니다. 아래 가족 지식그래프 컨텍스트를 기반으로 가족의 성장, 목표 달성, 관계 강화에 대해 따뜻하고 구체적인 조언을 해주세요. 한국어로 답변하세요. 마크다운 형식으로 깔끔하게 답변하세요.\n\n${context}`

      let response: string
      try {
        let accumulated = ''
        response = await streamChat({
          systemPrompt,
          userMessage: msg,
          onChunk: (chunk) => {
            accumulated += chunk
            setStreaming(accumulated)
          },
        })
      } catch {
        response = generateLocalResponse(msg, context)
      }

      flushStreaming()
      resetStreaming('')
      addChatMessage({ role: 'assistant', content: response })
    } catch {
      addToast('AI 응답 중 오류가 발생했습니다', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Paywall modal */}
      {showPaywall && <PaywallBanner variant="modal" onClose={() => setShowPaywall(false)} />}

      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-border bg-surface-light/50 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">💬</span> 가족 성장 어드바이저
          </h2>
          <PaywallBanner variant="inline" />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">AI가 가족 지식그래프를 기반으로 맞춤 조언을 제공합니다</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatMessages.length === 0 && !isAiLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center">
              <span className="text-3xl">🌱</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-300">가족 성장 어드바이저에 오신 것을 환영합니다</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                가족의 목표, 관심사, 이벤트에 대해 질문해 보세요. AI가 지식그래프를 분석하여 맞춤 조언을 드립니다.
              </p>
            </div>
          </div>
        )}

        {chatMessages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-primary-600/20 border border-primary-500/20 text-gray-200 rounded-br-md'
                    : 'bg-surface-lighter border border-surface-border text-gray-300 rounded-bl-md'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:bg-surface/50 [&_code]:px-1 [&_code]:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                <p className={`text-[9px] mt-2 ${isUser ? 'text-primary-400/50' : 'text-gray-600'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}

        {isAiLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-surface-lighter border border-surface-border text-sm leading-relaxed text-gray-300">
              {streamingText ? (
                <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:bg-surface/50 [&_code]:px-1 [&_code]:rounded">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                  <span className="inline-block w-1.5 h-4 bg-primary-400 rounded-sm ml-0.5 animate-pulse" />
                </div>
              ) : (
                <TypingIndicator />
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {chatMessages.length === 0 && (
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSubmit(q)}
                className="px-3 py-1.5 rounded-full bg-surface-lighter border border-surface-border text-xs text-gray-400 hover:text-primary-300 hover:border-primary-500/30 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-surface-border bg-surface-light/30">
        {limitReached ? (
          <div className="text-center py-2">
            <PaywallBanner variant="inline" />
          </div>
        ) : (
          <div className="flex items-end gap-3 bg-surface-lighter border border-surface-border rounded-2xl px-4 py-2 focus-within:border-primary-500/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 resize-none outline-none max-h-28 min-h-[24px]"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 112) + 'px'
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isAiLoading}
              className="shrink-0 w-8 h-8 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-border disabled:opacity-50 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Local fallback response generator ──────────
function generateLocalResponse(question: string, context: string): string {
  const lower = question.toLowerCase()

  if (lower.includes('목표') && lower.includes('현황')) {
    const goalLines = context.split('\n').filter((l) => l.includes('[') && l.includes('%'))
    if (goalLines.length > 0) {
      return `## 가족 목표 달성 현황 📊\n\n${goalLines.map((l) => `- ${l.trim()}`).join('\n')}\n\n꾸준히 진행 중이시네요! 작은 진전도 큰 의미가 있습니다. 매주 목표를 점검하고 서로 격려하면 더 빠르게 달성할 수 있습니다. 💪`
    }
  }

  if (lower.includes('마라톤') && lower.includes('독서')) {
    return `## 마라톤과 독서의 연결점 🏃📖\n\n마라톤과 독서는 놀라울 정도로 공통점이 많습니다:\n\n1. **인내력과 지구력**: 두 활동 모두 꾸준한 노력이 필요합니다\n2. **자기성찰**: 러닝 중 명상적 상태와 독서의 내면 탐구\n3. **성장 마인드셋**: 한 계단씩 올라가는 과정의 즐거움\n4. **루틴의 힘**: 매일 조금씩 실천하는 습관의 중요성\n\n> 현규님의 마라톤 훈련과 자존감 수업 독서가 서로 시너지를 내고 있습니다. 달리면서 배운 것을 생각하고, 읽은 것을 달리면서 실천해보세요! 🌱`
  }

  if (lower.includes('성장') && lower.includes('조언')) {
    return `## 이번 주 성장 조언 ✨\n\n가족 지식그래프를 분석한 결과:\n\n### 1. 현재 잘하고 있는 점\n- 다양한 관심사를 균형있게 유지하고 있습니다\n- 가족 가치(아침 식사 함께하기, 서로 응원하기)를 실천하고 있습니다\n\n### 2. 이번 주 제안\n- 가족 목표를 리뷰하는 시간을 가져보세요\n- 서로의 관심사에 대해 대화하는 시간을 만들어보세요\n- 작은 성취도 기록하고 축하하세요\n\n### 3. 작은 실천 하나\n> \"오늘 하루 가족 구성원에게 감사 한 마디를 전해보세요\" 💝`
  }

  if (lower.includes('영어')) {
    return `## 영어 학습 도움 방법 📝\n\n가족 그래프에서 분석한 결과:\n\n1. **함께 읽기**: 자존감 수업을 영어 원서로 다시 읽어보는 것도 좋은 방법입니다\n2. **일상 적용**: 아침 식사 시간에 간단한 영어 표현 하나씩 공유하기\n3. **관심사 연결**: 자동차 관련 영어 영상을 함께 시청하기\n4. **목표 관리**: 영어 독서 10권 목표를 주 단위로 분해하여 트래킹\n\n> 가족이 함께 배우면 동기부여가 두 배가 됩니다! 🚀`
  }

  return `## AI 분석 결과 🤖\n\n질문을 잘 받았습니다. 현재 가족 지식그래프에는 **${context.split('People')[1]?.split('--')[0]?.split('\n').filter((l) => l.trim()).length ?? 3}명의 구성원**과 다양한 관심사, 목표가 등록되어 있습니다.\n\n더 구체적인 질문을 해주시면 맞춤 조언을 드릴 수 있습니다. 예를 들어:\n- 특정 구성원의 성장 조언\n- 목표 달성 전략\n- 가족 활동 추천\n- 관심사 간 연결점 분석\n\n무엇이든 물어보세요! 🌟`
}
