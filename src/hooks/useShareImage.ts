import { useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import { useGraphStore } from '@/stores/graphStore'

export function useShareImage() {
  const ref = useRef<HTMLDivElement>(null)
  const addToast = useGraphStore((s) => s.addToast)

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) return null
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      })
      return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    } catch {
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
      await navigator.share({ title, files: [file] })
    } else {
      // Fallback to download
      await download()
    }
  }, [capture, download])

  return { ref, download, share }
}
