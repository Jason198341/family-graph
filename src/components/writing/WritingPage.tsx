import WritingForm from './WritingForm'
import WritingHistory from './WritingHistory'

export default function WritingPage() {
  return (
    <div className="space-y-8 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">✍️ 글쓰기</h1>
        <p className="text-xs text-gray-500 mt-1">AI가 5개 항목을 채점하고 피드백을 드립니다</p>
      </div>

      {/* Writing form */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">새 글 작성</h2>
        <WritingForm />
      </div>

      {/* History */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">글쓰기 기록</h2>
        <WritingHistory />
      </div>
    </div>
  )
}
