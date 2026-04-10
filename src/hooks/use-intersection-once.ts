import { useEffect, useRef, useState } from 'react'

type UseIntersectionOnceOptions = {
  enabled?: boolean
  rootMargin?: string
  threshold?: number
}

export function useIntersectionOnce<T extends HTMLElement>({
  enabled = true,
  rootMargin = '240px 0px',
  threshold = 0.1,
}: UseIntersectionOnceOptions = {}) {
  const ref = useRef<T | null>(null)
  const [hasIntersected, setHasIntersected] = useState(
    typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (!enabled || hasIntersected) {
      return
    }

    const element = ref.current
    if (!element) {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setHasIntersected(true)
        observer.disconnect()
      },
      {
        rootMargin,
        threshold,
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [enabled, hasIntersected, rootMargin, threshold])

  return {
    ref,
    hasIntersected,
  }
}
