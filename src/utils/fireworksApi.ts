import type { ExtractionResult, NodeCategory, RelationType } from '@/types'

const API_URL = '/api/fireworks/inference/v1/chat/completions'
const MODEL = 'accounts/fireworks/models/deepseek-v3p1'
/** Hard timeout for all non-streaming API calls (ms) */
const API_TIMEOUT = 30_000
/** Hard timeout for streaming calls (ms) */
const STREAM_TIMEOUT = 60_000
/** Max response text length to prevent runaway costs */
const MAX_RESPONSE_LENGTH = 8_000

function getHeaders(): Record<string, string> {
  const apiKey = import.meta.env.VITE_FIREWORKS_API_KEY as string
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

/** Create an AbortSignal that times out, optionally chained with an external signal */
function timeoutSignal(ms: number, external?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new Error(`API timeout after ${ms}ms`)), ms)
  if (external) {
    external.addEventListener('abort', () => ctrl.abort(external.reason), { once: true })
  }
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) }
}

// ─── Streaming Chat ──────────────────────────

interface StreamChatOptions {
  systemPrompt: string
  userMessage: string
  onChunk: (text: string) => void
  signal?: AbortSignal
}

export async function streamChat({
  systemPrompt,
  userMessage,
  onChunk,
  signal,
}: StreamChatOptions): Promise<string> {
  const { signal: tSignal, clear } = timeoutSignal(STREAM_TIMEOUT, signal)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      signal: tSignal,
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Fireworks API error ${response.status}: ${errText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body stream available')

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[]
          }
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullText += content
            // Safety: stop if response is too long
            if (fullText.length > MAX_RESPONSE_LENGTH) {
              reader.cancel()
              return fullText
            }
            onChunk(content)
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    return fullText
  } finally {
    clear()
  }
}

// ─── Entity Extraction ───────────────────────

function buildExtractionPrompt(existingPersons?: { name: string; role: string }[]): string {
  const personList = existingPersons && existingPersons.length > 0
    ? existingPersons.map((p) => `  - "${p.name}" (${p.role})`).join('\n')
    : null

  const personRule = personList
    ? `\n## IMPORTANT: Existing Family Members\nThe following persons are already registered in the family graph. You MUST use their EXACT name (not role/nickname) when referencing them. Do NOT create new person entities for these people.\n${personList}\n\nIf the text mentions "아빠", "엄마", "아들", "딸" etc., match them to the registered person above by role. Only create a new person entity if someone appears who is NOT in this list.`
    : ''

  return `You are a Family Knowledge Graph entity extractor. You analyze text about a family and extract structured entities and relationships.
${personRule}

## Entity Types
- **person**: Family members. Fields: name, description. (Only create if NOT already registered above)
- **interest**: Hobbies, career fields, sports, skills, or areas of study. Fields: name, description.
- **value**: Family principles, shared beliefs, daily habits that reflect values. Fields: name, description.
- **event**: Milestones, trips, achievements, important dates. Fields: name, description.
- **goal**: Personal or family targets, things to achieve. Fields: name, description.
- **book**: Books being read by the family. Fields: name, description.

## Relation Types
- **participates**: Someone participates in an interest/activity.
- **practices**: Someone practices a value.
- **strengthens**: One entity strengthens another (e.g., a value strengthens another value).
- **contributes**: One entity contributes to another (e.g., interest contributes to a goal).
- **influences**: One entity influences another.
- **supports**: One entity supports another.
- **learns**: Someone learns something.
- **achieves**: Someone achieves a goal/event.
- **family**: A family relationship between two people (e.g., parent-child, siblings, spouse).
- **reads**: Someone reads a book.

## Output Format
Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "entities": [
    { "name": "...", "category": "person|interest|value|event|goal", "emoji": "...", "description": "..." }
  ],
  "relations": [
    { "sourceName": "...", "targetName": "...", "relationType": "participates|practices|strengthens|contributes|influences|supports|learns|achieves|family|reads", "label": "short Korean label" }
  ],
  "summary": "Brief Korean summary of what was extracted"
}

Rules:
- Use Korean for descriptions, labels, and summary.
- Choose the most fitting single emoji for each entity.
- Entity names should be concise (1-3 words).
- Only extract what is explicitly stated or strongly implied.
- Each relation's sourceName and targetName must exactly match an entity name from the entities array or a registered person name above.
- For registered persons, include them in the entities array with their exact registered name (so relations can reference them).`
}

const VALID_CATEGORIES: NodeCategory[] = ['person', 'interest', 'value', 'event', 'goal', 'book']
const VALID_RELATIONS: RelationType[] = [
  'participates', 'practices', 'strengthens', 'contributes',
  'influences', 'supports', 'learns', 'achieves', 'family', 'reads',
]

export async function extractEntities(
  text: string,
  existingPersons?: { name: string; role: string }[],
): Promise<ExtractionResult> {
  const systemPrompt = buildExtractionPrompt(existingPersons)
  const { signal, clear } = timeoutSignal(API_TIMEOUT)
  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `다음 텍스트에서 가족 지식 그래프 엔티티와 관계를 추출해주세요:\n\n${text}` },
        ],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    })
  } finally {
    clear()
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Fireworks API error ${response.status}: ${errText}`)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const content = json.choices?.[0]?.message?.content ?? ''

  // Extract JSON from response (handle possible markdown wrapping)
  let jsonStr = content.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let parsed: ExtractionResult
  try {
    parsed = JSON.parse(jsonStr) as ExtractionResult
  } catch {
    throw new Error(`Failed to parse extraction result: ${jsonStr.slice(0, 200)}`)
  }

  // Validate and sanitize
  if (!Array.isArray(parsed.entities)) parsed.entities = []
  if (!Array.isArray(parsed.relations)) parsed.relations = []
  if (typeof parsed.summary !== 'string') parsed.summary = ''

  // Filter invalid categories and relation types
  parsed.entities = parsed.entities.filter(
    (e) => e.name && VALID_CATEGORIES.includes(e.category),
  )
  parsed.relations = parsed.relations.filter(
    (r) => r.sourceName && r.targetName && VALID_RELATIONS.includes(r.relationType),
  )

  return parsed
}

// ─── Growth Advice ───────────────────────────

const ADVICE_SYSTEM_PROMPT = `You are a caring family growth advisor for a Korean family. You have access to their Family Knowledge Graph which tracks their interests, values, events, goals, and relationships.

Your role:
- Provide warm, actionable advice in Korean.
- Reference specific entities from the graph to make advice personal.
- Suggest connections between interests, values, and goals.
- Be encouraging and specific.
- Keep responses concise but meaningful (2-4 paragraphs).
- Use relevant emojis sparingly.`

export async function getGrowthAdvice(
  question: string,
  graphContext: string,
): Promise<string> {
  const { signal, clear } = timeoutSignal(API_TIMEOUT)
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: ADVICE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `다음은 우리 가족의 지식 그래프입니다:\n\n${graphContext}\n\n---\n\n질문: ${question}`,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Fireworks API error ${response.status}: ${errText}`)
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    return json.choices?.[0]?.message?.content ?? '응답을 생성할 수 없습니다.'
  } finally {
    clear()
  }
}
