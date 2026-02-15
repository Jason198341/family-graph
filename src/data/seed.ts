import type { FamilyPerson, Interest, FamilyValue, LifeEvent, GrowthGoal, GraphRelation, Book, ReadingLog, ReadingGoal, WritingEntry, WritingGoal } from '@/types'

// ─── 가족 구성원 ────────────────────────────

export const seedPersons: FamilyPerson[] = [
  {
    id: 'person-dad',
    name: '현규',
    role: '아빠',
    emoji: '👨‍💼',
    bio: '자동차 공학 전문가. 마라톤과 자기계발에 열정적인 가장.',
    color: '#3b82f6',
    birthYear: 1985,
    goalLines: 200000,
    goalWritingCount: 24,
    goalWritingAvg: 75,
  },
  {
    id: 'person-mom',
    name: '선미',
    role: '엄마',
    emoji: '👩‍🍳',
    bio: '가족의 건강과 정서를 챙기는 따뜻한 중심축.',
    color: '#e879f9',
    birthYear: 1987,
    goalLines: 150000,
    goalWritingCount: 12,
    goalWritingAvg: 70,
  },
  {
    id: 'person-child1',
    name: '세연',
    role: '첫째',
    emoji: '👧',
    bio: '호기심 많은 학생. 독서와 그림 그리기를 좋아함.',
    color: '#fb923c',
    birthYear: 2015,
    goalLines: 100000,
    goalWritingCount: 24,
    goalWritingAvg: 65,
  },
  {
    id: 'person-child2',
    name: '성후',
    role: '둘째',
    emoji: '👦',
    bio: '활발하고 에너지 넘치는 둘째.',
    color: '#4ade80',
    birthYear: 2018,
    goalLines: 50000,
    goalWritingCount: 12,
    goalWritingAvg: 60,
  },
]

// ─── 관심 분야 ──────────────────────────────

export const seedInterests: Interest[] = [
  {
    id: 'interest-auto',
    name: '자동차 공학',
    category: 'career',
    emoji: '🚗',
    description: '차량 부품 설계, 원가 분석, 품질 관리 전문 지식',
  },
  {
    id: 'interest-marathon',
    name: '마라톤',
    category: 'fitness',
    emoji: '🏃',
    description: '지구력과 정신력을 키우는 러닝 훈련',
  },
  {
    id: 'interest-reading',
    name: '자존감 수업',
    category: 'education',
    emoji: '📖',
    description: '자기긍정과 회복탄력성을 위한 독서 학습',
  },
  {
    id: 'interest-cooking',
    name: '요리',
    category: 'hobby',
    emoji: '🍳',
    description: '가족의 건강한 식사를 위한 요리 활동',
  },
  {
    id: 'interest-english',
    name: '영어 학습',
    category: 'education',
    emoji: '📝',
    description: '글로벌 커뮤니케이션을 위한 영어 실력 향상',
  },
]

// ─── 가치 ────────────────────────────────────

export const seedValues: FamilyValue[] = [
  {
    id: 'value-breakfast',
    name: '아침 식사 함께하기',
    emoji: '🍽️',
    description: '매일 아침 가족이 모여 식사하며 유대감을 강화',
    practiceFrequency: 'daily',
  },
  {
    id: 'value-growth',
    name: '지속적인 성장',
    emoji: '🌱',
    description: '가족 모두가 각자의 분야에서 끊임없이 배우고 성장',
    practiceFrequency: 'daily',
  },
  {
    id: 'value-support',
    name: '서로 응원하기',
    emoji: '💪',
    description: '가족 구성원의 도전과 목표를 적극적으로 응원',
    practiceFrequency: 'daily',
  },
]

// ─── 이벤트 ──────────────────────────────────

export const seedEvents: LifeEvent[] = [
  {
    id: 'event-1',
    title: '자존감 수업 2회독 완료',
    description: '현규가 자존감 수업 책을 2번째 정독 완료',
    date: '2026-01-28',
    personIds: ['person-dad'],
    emoji: '📚',
    impact: 'positive',
  },
  {
    id: 'event-2',
    title: '인도 출장',
    description: '현규 인도 출장 - 자동차 부품 협업 미팅',
    date: '2026-02-01',
    personIds: ['person-dad'],
    emoji: '✈️',
    impact: 'challenge',
  },
  {
    id: 'event-3',
    title: '가족 마라톤 참가',
    description: '주말 가족 마라톤 5km 완주',
    date: '2026-01-20',
    personIds: ['person-dad', 'person-child1'],
    emoji: '🏅',
    impact: 'positive',
  },
]

// ─── 성장 목표 ───────────────────────────────

export const seedGoals: GrowthGoal[] = [
  {
    id: 'goal-1',
    title: '하프마라톤 완주',
    description: '3월까지 하프마라톤 2시간 이내 완주',
    personId: 'person-dad',
    targetDate: '2026-03-31',
    progress: 45,
    emoji: '🏃',
  },
  {
    id: 'goal-2',
    title: '영어 독서 10권',
    description: '올해 영어 원서 10권 읽기',
    personId: 'person-child1',
    targetDate: '2026-12-31',
    progress: 20,
    emoji: '📖',
  },
]

// ─── 책 ─────────────────────────────────────

export const seedBooks: Book[] = [
  {
    id: 'book-1',
    title: '자존감 수업',
    author: '윤홍균',
    totalPages: 320,
    linesPerPage: 25,
    emoji: '📖',
    color: '#f59e0b',
  },
  {
    id: 'book-2',
    title: '아몬드',
    author: '손원평',
    totalPages: 264,
    linesPerPage: 28,
    emoji: '🌰',
    color: '#10b981',
  },
  {
    id: 'book-3',
    title: '해리포터와 마법사의 돌',
    author: 'J.K. 롤링',
    totalPages: 340,
    linesPerPage: 30,
    emoji: '⚡',
    color: '#8b5cf6',
  },
]

// ─── 독서 목표 ──────────────────────────────

export const seedReadingGoals: ReadingGoal[] = [
  // 1월 목표
  { id: 'rg-jan-1', personId: 'person-dad', month: '2026-01', targetLines: 20000 },
  { id: 'rg-jan-2', personId: 'person-mom', month: '2026-01', targetLines: 10000 },
  { id: 'rg-jan-3', personId: 'person-child1', month: '2026-01', targetLines: 20000 },
  { id: 'rg-jan-4', personId: 'person-child2', month: '2026-01', targetLines: 10000 },
  // 2월 목표 (1월 성취 기준)
  { id: 'rg-1', personId: 'person-dad', month: '2026-02', targetLines: 19259 },
  { id: 'rg-2', personId: 'person-mom', month: '2026-02', targetLines: 3400 },
  { id: 'rg-3', personId: 'person-child1', month: '2026-02', targetLines: 19260 },
  { id: 'rg-4', personId: 'person-child2', month: '2026-02', targetLines: 7800 },
]

// ─── 독서 기록 ──────────────────────────────

// 1월 독서 기록 생성 헬퍼
function generateJanLogs(): ReadingLog[] {
  const logs: ReadingLog[] = []
  let idx = 100

  // 아빠 (현규): 1월 총 19,259줄 (28일, 688줄/일 + 마지막날 683줄)
  for (let d = 1; d <= 28; d++) {
    logs.push({ id: `rl-jan-${idx++}`, personId: 'person-dad', bookId: 'book-1', date: `2026-01-${String(d).padStart(2, '0')}`, linesRead: d < 28 ? 688 : 683 })
  }

  // 엄마 (선미): 1월 총 3,400줄 (11일, 310줄/일 + 마지막날 300줄)
  const momDays = [2, 5, 7, 9, 12, 15, 17, 20, 23, 26, 28]
  momDays.forEach((d, i) => {
    logs.push({ id: `rl-jan-${idx++}`, personId: 'person-mom', bookId: 'book-2', date: `2026-01-${String(d).padStart(2, '0')}`, linesRead: i < 10 ? 310 : 300 })
  })

  // 세연 (첫째): 1월 총 19,260줄 (28일, 688줄/일 + 마지막날 684줄)
  for (let d = 1; d <= 28; d++) {
    logs.push({ id: `rl-jan-${idx++}`, personId: 'person-child1', bookId: 'book-3', date: `2026-01-${String(d).padStart(2, '0')}`, linesRead: d < 28 ? 688 : 684 })
  }

  // 성후 (둘째): 1월 총 7,800줄 (28일, 279줄/일 + 마지막날 267줄)
  for (let d = 1; d <= 28; d++) {
    logs.push({ id: `rl-jan-${idx++}`, personId: 'person-child2', bookId: 'book-3', date: `2026-01-${String(d).padStart(2, '0')}`, linesRead: d < 28 ? 279 : 267 })
  }

  return logs
}

export const seedReadingLogs: ReadingLog[] = [
  // 1월 기록
  ...generateJanLogs(),
  // 2월 기록
  { id: 'rl-1', personId: 'person-dad', bookId: 'book-1', date: '2026-02-01', linesRead: 750 },
  { id: 'rl-2', personId: 'person-dad', bookId: 'book-1', date: '2026-02-02', linesRead: 500 },
  { id: 'rl-3', personId: 'person-mom', bookId: 'book-2', date: '2026-02-01', linesRead: 420 },
  { id: 'rl-4', personId: 'person-child1', bookId: 'book-3', date: '2026-02-01', linesRead: 300 },
  { id: 'rl-5', personId: 'person-child1', bookId: 'book-3', date: '2026-02-02', linesRead: 350 },
  { id: 'rl-6', personId: 'person-child2', bookId: 'book-3', date: '2026-02-03', linesRead: 200 },
]

// ─── 관계 (Edges) ────────────────────────────

export const seedRelations: GraphRelation[] = [
  {
    id: 'rel-1', sourceId: 'person-dad', targetId: 'interest-auto',
    sourceType: 'person', targetType: 'interest',
    relationType: 'participates', label: '전문 분야', strength: 9, createdAt: Date.now(),
  },
  {
    id: 'rel-2', sourceId: 'person-dad', targetId: 'interest-marathon',
    sourceType: 'person', targetType: 'interest',
    relationType: 'participates', label: '훈련 중', strength: 7, createdAt: Date.now(),
  },
  {
    id: 'rel-3', sourceId: 'person-dad', targetId: 'interest-reading',
    sourceType: 'person', targetType: 'interest',
    relationType: 'learns', label: '학습 중', strength: 8, createdAt: Date.now(),
  },
  {
    id: 'rel-4', sourceId: 'person-mom', targetId: 'interest-cooking',
    sourceType: 'person', targetType: 'interest',
    relationType: 'participates', label: '담당', strength: 9, createdAt: Date.now(),
  },
  {
    id: 'rel-5', sourceId: 'person-child1', targetId: 'interest-english',
    sourceType: 'person', targetType: 'interest',
    relationType: 'learns', label: '학습 중', strength: 6, createdAt: Date.now(),
  },
  {
    id: 'rel-6', sourceId: 'value-breakfast', targetId: 'value-support',
    sourceType: 'value', targetType: 'value',
    relationType: 'strengthens', label: '유대감 강화', strength: 8, createdAt: Date.now(),
  },
  {
    id: 'rel-7', sourceId: 'interest-reading', targetId: 'value-growth',
    sourceType: 'interest', targetType: 'value',
    relationType: 'contributes', label: '정신적 성장', strength: 8, createdAt: Date.now(),
  },
  {
    id: 'rel-8', sourceId: 'interest-marathon', targetId: 'value-growth',
    sourceType: 'interest', targetType: 'value',
    relationType: 'contributes', label: '체력 성장', strength: 7, createdAt: Date.now(),
  },
  {
    id: 'rel-9', sourceId: 'person-mom', targetId: 'value-breakfast',
    sourceType: 'person', targetType: 'value',
    relationType: 'practices', label: '매일 실천', strength: 10, createdAt: Date.now(),
  },
  {
    id: 'rel-10', sourceId: 'interest-auto', targetId: 'interest-english',
    sourceType: 'interest', targetType: 'interest',
    relationType: 'influences', label: '글로벌 협업', strength: 6, createdAt: Date.now(),
  },
  {
    id: 'rel-11', sourceId: 'person-child2', targetId: 'interest-marathon',
    sourceType: 'person', targetType: 'interest',
    relationType: 'participates', label: '함께 달리기', strength: 5, createdAt: Date.now(),
  },
  {
    id: 'rel-12', sourceId: 'person-child2', targetId: 'value-support',
    sourceType: 'person', targetType: 'value',
    relationType: 'practices', label: '응원 받는 중', strength: 7, createdAt: Date.now(),
  },
  // ── 가족 관계 ──
  {
    id: 'rel-fam-1', sourceId: 'person-dad', targetId: 'person-mom',
    sourceType: 'person', targetType: 'person',
    relationType: 'family', label: '부부', strength: 10, createdAt: Date.now(),
  },
  {
    id: 'rel-fam-2', sourceId: 'person-dad', targetId: 'person-child1',
    sourceType: 'person', targetType: 'person',
    relationType: 'family', label: '부녀', strength: 10, createdAt: Date.now(),
  },
  {
    id: 'rel-fam-3', sourceId: 'person-dad', targetId: 'person-child2',
    sourceType: 'person', targetType: 'person',
    relationType: 'family', label: '부자', strength: 10, createdAt: Date.now(),
  },
  {
    id: 'rel-fam-4', sourceId: 'person-mom', targetId: 'person-child1',
    sourceType: 'person', targetType: 'person',
    relationType: 'family', label: '모녀', strength: 10, createdAt: Date.now(),
  },
  {
    id: 'rel-fam-5', sourceId: 'person-mom', targetId: 'person-child2',
    sourceType: 'person', targetType: 'person',
    relationType: 'family', label: '모자', strength: 10, createdAt: Date.now(),
  },
  {
    id: 'rel-fam-6', sourceId: 'person-child1', targetId: 'person-child2',
    sourceType: 'person', targetType: 'person',
    relationType: 'family', label: '남매', strength: 9, createdAt: Date.now(),
  },
  // ── 독서 관계 (사람↔책) ──
  {
    id: 'rel-reads-1', sourceId: 'person-dad', targetId: 'book-1',
    sourceType: 'person', targetType: 'book',
    relationType: 'reads', label: '읽는 중', strength: 8, createdAt: Date.now(),
  },
  {
    id: 'rel-reads-2', sourceId: 'person-mom', targetId: 'book-2',
    sourceType: 'person', targetType: 'book',
    relationType: 'reads', label: '읽는 중', strength: 7, createdAt: Date.now(),
  },
  {
    id: 'rel-reads-3', sourceId: 'person-child1', targetId: 'book-3',
    sourceType: 'person', targetType: 'book',
    relationType: 'reads', label: '읽는 중', strength: 6, createdAt: Date.now(),
  },
]

// ─── 글쓰기 목표 ──────────────────────────────

export const seedWritingGoals: WritingGoal[] = [
  { id: 'wg-1', personId: 'person-dad', year: 2026, targetCount: 24, targetAvgScore: 75 },
  { id: 'wg-2', personId: 'person-mom', year: 2026, targetCount: 12, targetAvgScore: 70 },
  { id: 'wg-3', personId: 'person-child1', year: 2026, targetCount: 24, targetAvgScore: 65 },
  { id: 'wg-4', personId: 'person-child2', year: 2026, targetCount: 12, targetAvgScore: 60 },
]

// ─── 글쓰기 기록 (샘플) ──────────────────────

export const seedWritingEntries: WritingEntry[] = [
  {
    id: 'we-1',
    personId: 'person-dad',
    date: '2026-02-10',
    title: '마라톤을 통해 배운 것',
    content: '마라톤을 시작한 지 3개월이 되었다. 처음에는 5km도 힘들었지만 지금은 15km를 뛸 수 있게 되었다. 가장 큰 배움은 꾸준함의 힘이다.',
    charCount: 78,
    wordCount: 32,
    scores: { content: 16, logic: 15, depth: 14, specificity: 13, clarity: 16 },
    totalScore: 74,
    grade: 'B',
    feedback: {
      content: '개인적 경험을 잘 담았습니다.',
      logic: '시간순으로 잘 구성했어요.',
      depth: '깨달음을 더 구체적으로 풀어보세요.',
      specificity: '구체적인 에피소드를 추가하면 좋겠어요.',
      clarity: '문장이 명확하고 읽기 좋습니다.',
      overall: '꾸준함에 대한 진솔한 글입니다. 구체적인 순간의 묘사를 추가하면 더 풍부해질 거예요.',
    },
    badges: ['첫걸음'],
  },
  {
    id: 'we-2',
    personId: 'person-child1',
    date: '2026-02-12',
    title: '내가 좋아하는 계절',
    content: '나는 가을이 좋다. 단풍이 빨갛고 노란 색으로 물드는 게 예쁘다. 시원한 바람도 좋고 감도 맛있다.',
    charCount: 52,
    wordCount: 22,
    scores: { content: 14, logic: 12, depth: 11, specificity: 15, clarity: 14 },
    totalScore: 66,
    grade: 'C',
    feedback: {
      content: '좋아하는 이유를 잘 설명했어요.',
      logic: '생각을 더 연결해보세요.',
      depth: '왜 가을이 특별한지 더 생각해볼까요?',
      specificity: '감각적 표현이 좋아요!',
      clarity: '짧고 명확한 문장이에요.',
      overall: '감각적인 표현이 좋습니다! 가을과 관련된 특별한 추억을 하나 더 써보면 어떨까요?',
    },
    badges: ['첫걸음', '구체적표현'],
  },
]
