export interface ReadingTip {
  id: string
  title: string
  emoji: string
  category: '속독' | '정독' | '필사' | '토론' | '습관' | '기술'
  summary: string
  steps: string[]
  difficulty: 1 | 2 | 3
}

export const CATEGORIES = [
  { key: '전체', emoji: '📚' },
  { key: '속독', emoji: '⚡' },
  { key: '정독', emoji: '🔍' },
  { key: '필사', emoji: '✍️' },
  { key: '토론', emoji: '💬' },
  { key: '습관', emoji: '🌱' },
  { key: '기술', emoji: '🛠️' },
] as const

export const readingTips: ReadingTip[] = [
  {
    id: 'skim-first',
    title: '훑어읽기 (스키밍)',
    emoji: '⚡',
    category: '속독',
    summary: '목차, 소제목, 굵은 글씨만 빠르게 훑어 전체 구조를 파악하는 방법입니다.',
    steps: [
      '목차를 먼저 읽고 전체 흐름을 파악합니다',
      '각 장의 첫 문단과 마지막 문단만 읽습니다',
      '굵은 글씨, 밑줄, 도표를 중심으로 훑습니다',
      '5분 안에 책의 핵심 메시지를 정리합니다',
    ],
    difficulty: 1,
  },
  {
    id: 'speed-reading',
    title: '속독법 기초',
    emoji: '🏃',
    category: '속독',
    summary: '눈의 움직임을 최적화하여 읽기 속도를 2~3배 높이는 훈련법입니다.',
    steps: [
      '손가락이나 펜으로 글을 따라가며 읽습니다',
      '한 줄씩이 아닌 2~3줄씩 시야를 넓힙니다',
      '속으로 소리내어 읽는 습관(서브보컬라이제이션)을 줄입니다',
      '매일 15분씩 타이머를 맞추고 연습합니다',
    ],
    difficulty: 2,
  },
  {
    id: 'deep-reading',
    title: '정독법 — 깊이 읽기',
    emoji: '🔍',
    category: '정독',
    summary: '한 문장 한 문장 곱씹으며 저자의 의도와 논리를 정확히 이해하는 독서법입니다.',
    steps: [
      '한 문단을 읽고 핵심 주장을 한 줄로 정리합니다',
      '"왜?"라고 스스로 질문하며 논리를 따져봅니다',
      '모르는 단어나 개념은 바로 찾아봅니다',
      '각 장이 끝날 때마다 요약을 작성합니다',
    ],
    difficulty: 2,
  },
  {
    id: 'sq3r',
    title: 'SQ3R 독서법',
    emoji: '📐',
    category: '정독',
    summary: 'Survey-Question-Read-Recite-Review의 5단계 학술 독서법입니다.',
    steps: [
      'Survey: 목차와 소제목을 훑어봅니다',
      'Question: 각 절에 대해 질문을 만듭니다',
      'Read: 질문의 답을 찾으며 읽습니다',
      'Recite: 책을 덮고 답을 말해봅니다',
      'Review: 전체를 복습하고 정리합니다',
    ],
    difficulty: 3,
  },
  {
    id: 'copywork',
    title: '필사 독서법',
    emoji: '✍️',
    category: '필사',
    summary: '인상 깊은 문장을 직접 손으로 베껴 쓰며 깊이 흡수하는 방법입니다.',
    steps: [
      '하루에 마음에 드는 문장 3~5개를 고릅니다',
      '노트에 정성껏 베껴 씁니다',
      '왜 이 문장이 좋은지 한 줄 감상을 덧붙입니다',
      '일주일 후 다시 읽으며 느낌의 변화를 확인합니다',
    ],
    difficulty: 1,
  },
  {
    id: 'marginalia',
    title: '여백 메모 (마지날리아)',
    emoji: '📝',
    category: '필사',
    summary: '책 여백에 생각, 질문, 반응을 적으며 대화하듯 읽는 능동적 독서법입니다.',
    steps: [
      '연필을 들고 읽기 시작합니다',
      '공감하는 부분에는 밑줄, 의문점에는 ?를 표시합니다',
      '여백에 자신의 생각이나 연결되는 경험을 씁니다',
      '다 읽은 후 메모만 모아 한 페이지로 정리합니다',
    ],
    difficulty: 1,
  },
  {
    id: 'book-club',
    title: '가족 독서 토론',
    emoji: '👨‍👩‍👧‍👦',
    category: '토론',
    summary: '같은 책을 읽고 가족끼리 생각을 나누는 소규모 독서 모임 방법입니다.',
    steps: [
      '매주 1권(또는 1장)을 함께 읽을 범위로 정합니다',
      '각자 가장 인상 깊은 부분 1가지를 준비합니다',
      '돌아가며 발표하고 서로 질문합니다',
      '토론 후 한 줄 소감을 공유합니다',
    ],
    difficulty: 2,
  },
  {
    id: 'socratic',
    title: '소크라테스식 질문법',
    emoji: '🤔',
    category: '토론',
    summary: '"왜?"를 반복하며 깊은 이해에 도달하는 철학적 독서 토론법입니다.',
    steps: [
      '저자의 주장을 한 문장으로 정리합니다',
      '"왜 그렇게 생각하지?"라고 3번 연속 물어봅니다',
      '반대 입장에서 반론을 만들어봅니다',
      '최종적으로 자신의 입장을 정리합니다',
    ],
    difficulty: 3,
  },
  {
    id: 'morning-routine',
    title: '아침 독서 루틴',
    emoji: '🌅',
    category: '습관',
    summary: '하루 시작 전 20분 독서로 집중력과 성취감을 높이는 습관 만들기입니다.',
    steps: [
      '기상 후 핸드폰 대신 책을 집어 듭니다',
      '커피/차 한 잔과 함께 딱 20분만 읽습니다',
      '읽은 분량을 앱에 기록합니다',
      '21일간 연속 실행을 목표로 합니다',
    ],
    difficulty: 1,
  },
  {
    id: 'reading-chain',
    title: '독서 사슬 만들기',
    emoji: '🔗',
    category: '습관',
    summary: '매일 조금이라도 읽어 끊기지 않는 연속 기록을 만드는 동기부여 기법입니다.',
    steps: [
      '캘린더에 읽은 날을 X로 표시합니다',
      '최소 1페이지라도 읽으면 체크합니다',
      '연속 기록이 길어질수록 절대 끊고 싶지 않게 됩니다',
      '30일 연속 달성 시 가족에게 자랑합니다!',
    ],
    difficulty: 1,
  },
  {
    id: 'pomodoro-reading',
    title: '뽀모도로 독서법',
    emoji: '🍅',
    category: '기술',
    summary: '25분 집중 + 5분 휴식 사이클로 장시간 독서의 피로를 줄이는 방법입니다.',
    steps: [
      '타이머를 25분으로 설정합니다',
      '25분간 오직 책에만 집중합니다',
      '타이머가 울리면 5분 쉽니다 (스트레칭 추천)',
      '4사이클(2시간) 후 15~30분 긴 휴식을 합니다',
    ],
    difficulty: 1,
  },
  {
    id: 'mind-map',
    title: '마인드맵 독서',
    emoji: '🧠',
    category: '기술',
    summary: '책의 핵심 내용을 시각적으로 정리하여 기억력을 극대화하는 기법입니다.',
    steps: [
      '중앙에 책 제목을 씁니다',
      '주요 챕터를 가지로 뻗어나갑니다',
      '각 가지에서 핵심 키워드를 연결합니다',
      '색상과 아이콘으로 시각적 구분을 합니다',
    ],
    difficulty: 2,
  },
  {
    id: 'output-reading',
    title: '아웃풋 독서법',
    emoji: '📤',
    category: '기술',
    summary: '읽은 내용을 누군가에게 설명하거나 글로 써서 이해도를 확인하는 방법입니다.',
    steps: [
      '한 챕터를 읽고 가족에게 3분 설명을 해봅니다',
      '설명이 막히는 부분을 다시 읽습니다',
      'SNS나 노트에 한 줄 서평을 씁니다',
      '한 달에 1번 읽은 책 전체를 정리합니다',
    ],
    difficulty: 2,
  },
]
