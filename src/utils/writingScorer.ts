import type { WritingScores, WritingFeedback, WritingGrade } from '@/types'

const API_URL = '/api/fireworks/inference/v1/chat/completions'
const MODEL = 'accounts/fireworks/models/deepseek-v3p1'
const API_TIMEOUT = 30_000

function getHeaders(): Record<string, string> {
  const apiKey = import.meta.env.VITE_FIREWORKS_API_KEY as string
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

export function calcGrade(total: number): WritingGrade {
  if (total >= 90) return 'S'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  return 'D'
}

export function calcBadges(scores: WritingScores, totalScore: number, isFirst: boolean): string[] {
  const badges: string[] = []
  if (isFirst) badges.push('첫걸음')
  if (scores.logic >= 17) badges.push('논리왕')
  if (scores.depth >= 17) badges.push('깊은생각')
  if (scores.specificity >= 17) badges.push('구체적표현')
  if (scores.clarity >= 17) badges.push('명문가')
  if (totalScore >= 95) badges.push('완벽한글')
  return badges
}

function buildSystemPrompt(writerAge: number): string {
  const ageGroup = writerAge <= 10
    ? '초등 저학년 (쉬운 표현 기대, 격려 위주)'
    : writerAge <= 13
      ? '초등 고학년 (기본 구조 기대, 발전 격려)'
      : writerAge <= 18
        ? '중고등학생 (논리적 구성 기대, 구체적 조언)'
        : '성인 (높은 수준 기대, 전문적 피드백)'

  return `당신은 한국어 글쓰기 채점 전문가입니다. 글쓴이의 연령대: ${ageGroup} (${writerAge}세)

## 채점 기준 (각 항목 0~20점)
1. **content** (내용 충실도): 주제를 잘 다루었는가, 내용이 풍부한가
2. **logic** (논리적 구성): 글의 흐름이 자연스럽고 논리적인가
3. **depth** (사고의 깊이): 표면적 서술을 넘어 깊은 생각이 담겼는가
4. **specificity** (구체적 표현): 감각적이고 구체적인 표현을 사용했는가
5. **clarity** (문장 명확성): 문장이 명확하고 읽기 쉬운가

연령대에 맞게 기대 수준을 조절하세요. 어린 학생에게는 격려를, 성인에게는 발전적 피드백을 주세요.

## 출력 형식
반드시 아래 JSON만 출력하세요 (마크다운 없이):
{
  "scores": { "content": 0, "logic": 0, "depth": 0, "specificity": 0, "clarity": 0 },
  "feedback": {
    "content": "한 줄 피드백",
    "logic": "한 줄 피드백",
    "depth": "한 줄 피드백",
    "specificity": "한 줄 피드백",
    "clarity": "한 줄 피드백",
    "overall": "2~3문장 종합 피드백"
  }
}`
}

interface ScoreResult {
  scores: WritingScores
  feedback: WritingFeedback
}

function localFallback(content: string): ScoreResult {
  const len = content.length
  const base = Math.min(15, Math.max(8, Math.round(len / 20)))
  return {
    scores: {
      content: base,
      logic: base - 1,
      depth: base - 2,
      specificity: base,
      clarity: base + 1,
    },
    feedback: {
      content: '글의 내용을 확인했습니다.',
      logic: '글의 구성을 확인했습니다.',
      depth: '생각의 깊이를 확인했습니다.',
      specificity: '표현의 구체성을 확인했습니다.',
      clarity: '문장의 명확성을 확인했습니다.',
      overall: 'AI 채점 서비스에 일시적으로 연결할 수 없어 기본 점수가 부여되었습니다. 나중에 다시 시도해 주세요.',
    },
  }
}

export async function scoreWriting(
  title: string,
  content: string,
  writerAge: number,
): Promise<ScoreResult> {
  const systemPrompt = buildSystemPrompt(writerAge)
  const userMessage = `제목: ${title}\n\n${content}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      signal: ctrl.signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    })

    if (!response.ok) throw new Error(`API error ${response.status}`)

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    let raw = json.choices?.[0]?.message?.content?.trim() ?? ''
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) raw = match[1].trim()

    const parsed = JSON.parse(raw) as ScoreResult

    // Validate scores are in range
    for (const key of ['content', 'logic', 'depth', 'specificity', 'clarity'] as const) {
      const v = parsed.scores[key]
      parsed.scores[key] = Math.min(20, Math.max(0, Math.round(typeof v === 'number' ? v : 10)))
    }

    return parsed
  } catch (err) {
    console.error('[scoreWriting] fallback:', err)
    return localFallback(content)
  } finally {
    clearTimeout(timer)
  }
}
