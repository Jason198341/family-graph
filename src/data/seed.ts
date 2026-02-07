import type { FamilyPerson, Interest, FamilyValue, LifeEvent, GrowthGoal, GraphRelation } from '@/types'

// ─── 가족 구성원 ────────────────────────────

export const seedPersons: FamilyPerson[] = [
  {
    id: 'person-dad',
    name: '현규',
    role: '아빠',
    emoji: '👨‍💼',
    bio: '자동차 공학 전문가. 마라톤과 자기계발에 열정적인 가장.',
    color: '#3b82f6',
  },
  {
    id: 'person-mom',
    name: '엄마',
    role: '엄마',
    emoji: '👩‍🍳',
    bio: '가족의 건강과 정서를 챙기는 따뜻한 중심축.',
    color: '#e879f9',
  },
  {
    id: 'person-child1',
    name: '첫째',
    role: '자녀',
    emoji: '👧',
    bio: '호기심 많은 학생. 독서와 그림 그리기를 좋아함.',
    color: '#fb923c',
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
]
