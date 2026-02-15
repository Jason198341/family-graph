export default function Watermark({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 py-2 ${dark ? 'text-white/40' : 'text-slate-400'}`}>
      <span className="text-xs font-medium tracking-wide">📚 가족 독서 그래프</span>
      <span className="text-xs">·</span>
      <span className="text-xs">family-graph.vercel.app</span>
    </div>
  )
}
