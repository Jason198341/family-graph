import { useState } from 'react'

interface InviteCodeProps {
  code: string
  onRegenerate?: () => Promise<string | null>
}

export default function InviteCode({ code, onRegenerate }: InviteCodeProps) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    if (!onRegenerate) return
    setRegenerating(true)
    await onRegenerate()
    setRegenerating(false)
  }

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-2">초대 코드</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-center text-lg font-mono font-bold text-primary-400 tracking-[0.3em] bg-primary-500/10 rounded-lg py-2">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="px-3 py-2 bg-surface-light border border-surface-border rounded-lg text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors cursor-pointer shrink-0"
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      {onRegenerate && (
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {regenerating ? '생성 중...' : '새 코드 생성'}
        </button>
      )}
    </div>
  )
}
