export function normalizeActionHref(url?: string) {
  if (!url) {
    return ''
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (url.startsWith('/')) {
    return url
  }

  return `/${url.replace(/^\/+/, '')}`
}
