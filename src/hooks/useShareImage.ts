import { useCallback, useRef } from 'react'
import { useGraphStore } from '@/stores/graphStore'

/**
 * Share hook — uses html-to-image (SVG foreignObject approach)
 * Much more reliable than html2canvas for modern CSS (oklch, gradients, etc.)
 *
 * 3-tier sharing:
 * 1. Web Share API (mobile native share sheet)
 * 2. Clipboard text + download (fallback)
 * 3. Direct download (final fallback)
 */
export function useShareImage() {
  const ref = useRef<HTMLDivElement>(null)
  const addToast = useGraphStore((s) => s.addToast)

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) {
      addToast('캡처할 요소가 없습니다', 'error')
      return null
    }

    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        style: {
          // Ensure the element renders at its natural size in the clone
          transform: 'none',
          animation: 'none',
        },
      })
      return blob
    } catch (err) {
      console.error('Share image capture failed:', err)
      addToast('이미지 생성에 실패했습니다', 'error')
      return null
    }
  }, [addToast])

  const download = useCallback(async (filename = 'family-graph-share.png') => {
    const blob = await capture()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = filename
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    addToast('이미지가 저장되었습니다!', 'success')
  }, [capture, addToast])

  const share = useCallback(async (title = '가족 독서 기록', filename = 'family-graph') => {
    const blob = await capture()
    if (!blob) return
    const file = new File([blob], `${filename}.png`, { type: 'image/png' })

    // Tier 1: Web Share API (mobile native)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: title, url: 'https://family-graph-six.vercel.app' })
        return
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return
      }
    }

    // Tier 2: Clipboard text + download
    try {
      await navigator.clipboard.writeText(`${title}\nhttps://family-graph-six.vercel.app`)
      addToast('링크가 복사되었습니다', 'success')
    } catch { /* clipboard not available */ }

    // Tier 3: Download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [capture, addToast])

  return { ref, download, share }
}
