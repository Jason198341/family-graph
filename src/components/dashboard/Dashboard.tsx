import { useGraphStore } from '@/stores/graphStore'

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[d.getDay()]
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

function StatCard({ emoji, value, label, delay }: { emoji: string; value: number; label: string; delay: number }) {
  return (
    <div
      className="animate-fade-in-up bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 flex flex-col gap-2 hover:border-primary-500/30 transition-colors"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{emoji}</span>
        <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

function ImpactBadge({ impact }: { impact: string }) {
  const styles: Record<string, string> = {
    positive: 'bg-growth-500/15 text-growth-400 border-growth-500/30',
    neutral: 'bg-warm-500/15 text-warm-400 border-warm-500/30',
    challenge: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels: Record<string, string> = {
    positive: '긍정적',
    neutral: '중립',
    challenge: '도전',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles[impact] ?? styles.neutral}`}>
      {labels[impact] ?? impact}
    </span>
  )
}

export default function Dashboard() {
  const persons = useGraphStore((s) => s.persons)
  const interests = useGraphStore((s) => s.interests)
  const goals = useGraphStore((s) => s.goals)
  const events = useGraphStore((s) => s.events)
  const insights = useGraphStore((s) => s.insights)
  const relations = useGraphStore((s) => s.relations)

  const getPersonById = useGraphStore((s) => s.getNodeById)
  const personInterests = (personId: string) => {
    const interestIds = relations
      .filter((r) => r.sourceId === personId && r.targetType === 'interest')
      .map((r) => r.targetId)
    return interests.filter((i) => interestIds.includes(i.id))
  }

  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          가족 성장 대시보드 <span className="text-2xl">✨</span>
        </h1>
        <p className="text-gray-400 mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard emoji="👨‍👩‍👧" value={persons.length} label="가족 구성원" delay={100} />
        <StatCard emoji="🎯" value={interests.length} label="관심 분야" delay={200} />
        <StatCard emoji="🚀" value={goals.length} label="성장 목표" delay={300} />
        <StatCard emoji="💡" value={insights.length} label="인사이트" delay={400} />
      </div>

      {/* Family Members Section */}
      <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>👥</span> 가족 구성원
        </h2>
        {persons.length === 0 ? (
          <div className="bg-surface-light/60 border border-surface-border rounded-2xl p-8 text-center text-gray-500">
            아직 등록된 가족 구성원이 없습니다
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
            {persons.map((person) => {
              const pInterests = personInterests(person.id)
              return (
                <div
                  key={person.id}
                  className="shrink-0 snap-start bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 w-56 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 group-hover:scale-110 transition-transform"
                      style={{ borderColor: person.color, backgroundColor: `${person.color}12` }}
                    >
                      {person.emoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{person.name}</h3>
                      <p className="text-xs text-gray-400">{person.role}</p>
                    </div>
                    {pInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {pInterests.map((int) => (
                          <span
                            key={int.id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter border border-surface-border text-gray-300"
                          >
                            {int.emoji} {int.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Active Goals Section */}
      <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span> 성장 목표 현황
        </h2>
        {goals.length === 0 ? (
          <div className="bg-surface-light/60 border border-surface-border rounded-2xl p-8 text-center text-gray-500">
            등록된 성장 목표가 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const personNode = getPersonById(goal.personId)
              const personData = personNode?.data as Record<string, unknown> | undefined
              const personColor = (personData?.color as string) ?? '#3b82f6'
              const personName = (personData?.name as string) ?? '알 수 없음'

              return (
                <div
                  key={goal.id}
                  className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 hover:border-surface-hover transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{goal.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{goal.title}</h3>
                        <p className="text-[11px] text-gray-500">{personName} | 목표일: {goal.targetDate}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: personColor }}>
                      {goal.progress}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{goal.description}</p>
                  {/* Progress bar */}
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${goal.progress}%`,
                        backgroundColor: personColor,
                        boxShadow: `0 0 8px ${personColor}60`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent Events Timeline */}
      <section className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📅</span> 최근 이벤트
        </h2>
        {sortedEvents.length === 0 ? (
          <div className="bg-surface-light/60 border border-surface-border rounded-2xl p-8 text-center text-gray-500">
            기록된 이벤트가 없습니다
          </div>
        ) : (
          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary-500/40 via-accent-500/40 to-transparent" />

            <div className="space-y-4">
              {sortedEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${700 + idx * 100}ms` }}
                >
                  {/* Dot on timeline */}
                  <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-surface-light border-2 border-primary-500" />

                  <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl p-4 hover:border-surface-hover transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{event.emoji}</span>
                        <div>
                          <h3 className="font-medium text-white text-sm">{event.title}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{event.date}</p>
                        </div>
                      </div>
                      <ImpactBadge impact={event.impact} />
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-400 mt-2 pl-8">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  )
}
