'use client'

import { useEffect, useRef, useState } from 'react'

export function useFooterActionsVisibility<T extends HTMLElement>() {
  const footerRef = useRef<T | null>(null)
  const [isFooterVisible, setIsFooterVisible] = useState(
    typeof window !== 'undefined' && typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const element = footerRef.current
    if (!element) {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting)
      },
      { threshold: 0.15 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return { footerRef, isFooterVisible }
}
