import { useCallback, useRef } from 'react'
import { useGraphStore } from '@/stores/graphStore'

/**
 * Share hook — adopted from rundna's 3-tier pattern:
 * 1. Web Share API (mobile native share sheet)
 * 2. Clipboard text + download (fallback)
 * 3. Direct download (final fallback)
 */
export function useShareImage() {
  const ref = useRef<HTMLDivElement>(null)
  const addToast = useGraphStore((s) => s.addToast)

  const renderCanvas = useCallback(async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const html2canvas = (await import('html2canvas')).default
    const computed = getComputedStyle(element)
    const bgColor = computed.backgroundColor

    return html2canvas(element, {
      scale: 2,
      backgroundColor: bgColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : bgColor,
      useCORS: true,
      logging: false,
      onclone: (doc) => {
        // 1. Remove lab/oklch/oklab from stylesheets (html2canvas can't parse them)
        for (const sheet of Array.from(doc.styleSheets)) {
          try {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
              const text = sheet.cssRules[i].cssText
              if (text.match(/(ok)?(lab|lch)\(/i)) {
                const fixed = text.replace(/(ok)?(lab|lch)\([^)]+\)/gi, '#808080')
                try {
                  sheet.deleteRule(i)
                  sheet.insertRule(fixed, i)
                } catch { /* skip malformed rules */ }
              }
            }
          } catch { /* cross-origin stylesheets */ }
        }

        // 2. Inject hex CSS custom property overrides
        const style = doc.createElement('style')
        style.textContent = `
          *, *::before, *::after {
            --color-surface: #f8fafc !important;
            --color-surface-light: #ffffff !important;
            --color-surface-lighter: #f1f5f9 !important;
            --color-surface-border: #e2e8f0 !important;
            --color-cream-100: #0f172a !important;
            --color-cream-200: #334155 !important;
            --color-espresso-300: #475569 !important;
            --color-espresso-400: #64748b !important;
            --color-amber-500: #f59e0b !important;
            --color-amber-600: #d97706 !important;
          }
        `
        doc.head.appendChild(style)

        // 3. Force computed styles on all elements
        doc.querySelectorAll('*').forEach((node) => {
          const el = node as HTMLElement
          if (el.style) {
            el.style.backdropFilter = 'none'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(el.style as any).webkitBackdropFilter = 'none'
          }
          const cs = getComputedStyle(el)
          const props = ['color', 'backgroundColor', 'borderColor'] as const
          for (const prop of props) {
            const val = cs[prop]
            if (val && (val.includes('lab(') || val.includes('oklch(') || val.includes('oklab('))) {
              const cvs = document.createElement('canvas')
              const ctx = cvs.getContext('2d')
              if (ctx) {
                ctx.fillStyle = '#808080'
                ctx.fillStyle = val
                el.style[prop] = ctx.fillStyle
              }
            } else if (val && val !== 'rgba(0, 0, 0, 0)') {
              el.style[prop] = val
            }
          }
        })
      },
    })
  }, [])

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) {
      addToast('캡처할 요소가 없습니다', 'error')
      return null
    }
    try {
      const canvas = await renderCanvas(ref.current)
      return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    } catch (err) {
      console.error('Share image capture failed:', err)
      addToast('이미지 생성에 실패했습니다', 'error')
      return null
    }
  }, [addToast, renderCanvas])

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
