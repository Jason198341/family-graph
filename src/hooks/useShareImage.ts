import { useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import { useGraphStore } from '@/stores/graphStore'

export function useShareImage() {
  const ref = useRef<HTMLDivElement>(null)
  const addToast = useGraphStore((s) => s.addToast)

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) {
      addToast('캡처할 요소가 없습니다', 'error')
      return null
    }
    try {
      // Resolve CSS custom properties for html2canvas compatibility
      const el = ref.current
      const computed = getComputedStyle(el)
      const bgColor = computed.backgroundColor

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: bgColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : bgColor,
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Inline all styles to avoid CSS variable resolution issues
        onclone: (doc) => {
          // Remove backdrop-filter (unsupported by html2canvas)
          doc.querySelectorAll('*').forEach((node) => {
            const el = node as HTMLElement
            if (el.style) {
              el.style.backdropFilter = 'none'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(el.style as any).webkitBackdropFilter = 'none'
            }
            // Force computed styles for elements using CSS variables
            const cs = getComputedStyle(el)
            if (cs.color) el.style.color = cs.color
            if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              el.style.backgroundColor = cs.backgroundColor
            }
            if (cs.borderColor) el.style.borderColor = cs.borderColor
          })
        },
      })
      return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
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
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    addToast('이미지가 저장되었습니다!', 'success')
  }, [capture, addToast])

  const share = useCallback(async (title = '가족 독서 기록') => {
    const blob = await capture()
    if (!blob) return
    const file = new File([blob], 'family-graph.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, files: [file] })
      } catch {
        // User cancelled share — not an error
      }
    } else {
      await download()
    }
  }, [capture, download])

  return { ref, download, share }
}
