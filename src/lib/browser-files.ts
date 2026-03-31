'use client'

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  if (typeof window === 'undefined') {
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return ''
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const escapeCell = (value: unknown) => {
    const text = String(value ?? '')
    if (!/[;"\n\r]/.test(text)) {
      return text
    }

    return `"${text.replace(/"/g, '""')}"`
  }

  const lines = [
    columns.map(escapeCell).join(';'),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(';')),
  ]

  return `sep=;\r\n${lines.join('\r\n')}`
}

export function downloadCsvFile(filename: string, rows: Array<Record<string, unknown>>) {
  downloadTextFile(filename, buildCsv(rows), 'text/csv;charset=utf-8')
}

export function downloadJsonFile(filename: string, value: unknown) {
  downloadTextFile(filename, JSON.stringify(value, null, 2), 'application/json;charset=utf-8')
}
