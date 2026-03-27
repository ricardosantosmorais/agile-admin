'use client'

import { useCallback, useEffect, useState } from 'react'

function isElementVisible(element: HTMLElement) {
  const bounds = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth

  return bounds.bottom > 0
    && bounds.right > 0
    && bounds.top < viewportHeight
    && bounds.left < viewportWidth
}

export function useFooterActionsVisibility<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [isFooterVisible, setIsFooterVisible] = useState(false)

  const footerRef = useCallback((element: T | null) => {
    setNode(element)
    if (!element) {
      setIsFooterVisible(false)
    }
  }, [])

  useEffect(() => {
    if (!node) {
      return
    }

    const updateVisibility = () => {
      setIsFooterVisible(isElementVisible(node))
    }

    updateVisibility()
    const animationFrame = window.requestAnimationFrame(updateVisibility)

    window.addEventListener('resize', updateVisibility)
    window.addEventListener('scroll', updateVisibility, { passive: true })

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateVisibility())
      : null
    resizeObserver?.observe(node)

    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          ([entry]) => {
            setIsFooterVisible(entry.isIntersecting || isElementVisible(node))
          },
          { threshold: 0 },
        )
      : null
    intersectionObserver?.observe(node)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', updateVisibility)
      window.removeEventListener('scroll', updateVisibility)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
    }
  }, [node])

  return { footerRef, isFooterVisible }
}
