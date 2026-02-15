import { useGraphStore } from '@/stores/graphStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useShareImage } from '@/hooks/useShareImage'
import ShareButton from './ShareButton'
import Watermark from './Watermark'

// Sort colors by hue for aesthetic rainbow arrangement
function colorSortKey(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  if (max !== min) {
    const d = max - min
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return h
}

export default function BookShelfCard() {
  const { ref, download, share } = useShareImage()
  const books = useGraphStore((s) => s.books)
  const bookProgress = useGraphStore((s) => s.bookProgress)
  const persons = useGraphStore((s) => s.persons)
  const family = useFamilyStore((s) => s.family)

  const familyName = family?.name ?? '우리 가족'
  const familyEmoji = family?.emoji ?? '🏠'
  const year = new Date().getFullYear()

  // Enrich books with completion info
  const enriched = books.map((book) => {
    const progresses = bookProgress.filter((p) => p.bookId === book.id)
    const readers = progresses.length
    const completers = progresses.filter((p) => p.completed).length
    const readerNames = progresses.map((p) => {
      const person = persons.find((pp) => pp.id === p.personId)
      return person?.emoji ?? ''
    })
    return { ...book, readers, completers, readerNames }
  }).sort((a, b) => colorSortKey(a.color) - colorSortKey(b.color))

  const totalBooks = books.length
  const completedBooks = enriched.filter((b) => b.completers > 0).length

  // Book spine height varies by total pages for visual interest
  const maxPages = Math.max(1, ...books.map((b) => b.totalPages))

  return (
    <div className="space-y-4">
      <div ref={ref} className="w-full max-w-[540px] mx-auto rounded-xl md:rounded-3xl overflow-hidden border shadow-xl" style={{ background: 'linear-gradient(180deg, #fffbeb, #fff7ed, #f5f5f4)', borderColor: '#fde68a' }}>
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-4 md:mb-6">
            <p className="text-xs text-amber-600 font-bold tracking-widest uppercase">📚 가족 서재</p>
            <h2 className="text-lg font-bold text-slate-800 mt-1" style={{ fontFamily: "'Gowun Batang', serif" }}>
              {familyEmoji} {familyName}의 {year}년 책장
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {totalBooks}권 등록 · {completedBooks}권 완독
            </p>
          </div>

          {/* Bookshelf */}
          {enriched.length > 0 ? (
            <div className="space-y-4">
              {/* Render shelves, 6 books per shelf */}
              {Array.from({ length: Math.ceil(enriched.length / 6) }, (_, shelfIdx) => {
                const shelfBooks = enriched.slice(shelfIdx * 6, (shelfIdx + 1) * 6)
                return (
                  <div key={shelfIdx}>
                    {/* Books row */}
                    <div className="flex items-end justify-center gap-1 px-2">
                      {shelfBooks.map((book) => {
                        const heightRatio = 0.6 + (book.totalPages / maxPages) * 0.4
                        const spineH = Math.round(80 * heightRatio)
                        const isCompleted = book.completers > 0

                        return (
                          <div key={book.id} className="flex flex-col items-center group" style={{ width: 56 }}>
                            {/* Book spine */}
                            <div
                              className="relative rounded-sm shadow-md flex flex-col items-center justify-center px-1 transition-transform hover:scale-105"
                              style={{
                                width: 44,
                                height: spineH,
                                backgroundColor: book.color,
                                boxShadow: `2px 2px 8px ${book.color}40`,
                              }}
                            >
                              <span className="text-lg leading-none">{book.emoji}</span>
                              {isCompleted && (
                                <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                              )}
                            </div>
                            {/* Title */}
                            <p className="text-xs text-slate-600 text-center mt-1 leading-tight line-clamp-2 font-medium" style={{ fontSize: 9 }}>
                              {book.title}
                            </p>
                            {/* Reader emojis */}
                            <div className="flex gap-0.5 mt-0.5">
                              {book.readerNames.map((e, i) => (
                                <span key={i} style={{ fontSize: 10 }}>{e}</span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Shelf */}
                    <div className="h-2 rounded-sm mt-0.5 shadow-sm" style={{ background: 'linear-gradient(90deg, #fcd34d, #fde68a, #fcd34d)' }} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-sm">아직 등록된 책이 없습니다</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 md:mt-6 text-xs text-slate-400">
            <span>⭐ = 완독</span>
            <span>이모지 = 읽는 중인 가족</span>
          </div>
        </div>

        <Watermark />
      </div>

      <ShareButton
        onShare={() => share(`${familyName}의 책장`)}
        onDownload={() => download(`bookshelf-${familyName}.png`)}
        className="justify-center"
      />
    </div>
  )
}
