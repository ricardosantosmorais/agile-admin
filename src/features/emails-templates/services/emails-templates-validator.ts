export type EmailTemplateValidationIssue = {
  line: number
  column: number
  endLine?: number
  endColumn?: number
  message: string
}

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function stripTemplateSyntax(source: string) {
  return source
    .replace(/<\?(?:php|=)?[\s\S]*?\?>/g, (match) => ' '.repeat(match.length))
    .replace(/\{\{[\s\S]*?\}\}/g, (match) => ' '.repeat(match.length))
    .replace(/\{%[\s\S]*?%\}/g, (match) => ' '.repeat(match.length))
    .replace(/\{#[\s\S]*?#\}/g, (match) => ' '.repeat(match.length))
}

function getLineColumn(source: string, index: number) {
  let line = 1
  let column = 1

  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }

  return { line, column }
}

export function validateEmailTemplateMarkup(template: string) {
  const source = String(template || '')
  const normalized = stripTemplateSyntax(source)
  const issues: EmailTemplateValidationIssue[] = []
  const stack: Array<{ tag: string; index: number }> = []
  const tagPattern = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w:-]*)\b[^>]*?>/g

  let match = tagPattern.exec(normalized)
  while (match) {
    const fullMatch = match[0]
    const tagName = String(match[1] || '').toLowerCase()
    const index = match.index

    if (fullMatch.startsWith('<!--')) {
      match = tagPattern.exec(normalized)
      continue
    }

    const position = getLineColumn(source, index)

    if (fullMatch.startsWith('</')) {
      const last = stack[stack.length - 1]
      if (!last) {
        issues.push({
          line: position.line,
          column: position.column,
          message: `Tag de fechamento </${tagName}> sem abertura correspondente.`,
        })
        match = tagPattern.exec(normalized)
        continue
      }

      if (last.tag !== tagName) {
        issues.push({
          line: position.line,
          column: position.column,
          message: `Esperado fechamento de <${last.tag}>, mas encontrado </${tagName}>.`,
        })
        match = tagPattern.exec(normalized)
        continue
      }

      stack.pop()
      match = tagPattern.exec(normalized)
      continue
    }

    const selfClosing = fullMatch.endsWith('/>') || VOID_TAGS.has(tagName)
    if (!selfClosing) {
      stack.push({ tag: tagName, index })
    }

    match = tagPattern.exec(normalized)
  }

  for (const pending of stack.reverse()) {
    const position = getLineColumn(source, pending.index)
    issues.push({
      line: position.line,
      column: position.column,
      message: `Tag <${pending.tag}> sem fechamento correspondente.`,
    })
  }

  return issues
}
