function toStringSafe(value: unknown) {
  return value == null ? '' : String(value)
}

function phpPathToTwigPath(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^\$([a-zA-Z_]\w*)((?:\[(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\d+)\])*)$/)
  if (!match) {
    return trimmed
  }

  const [, base, suffix = ''] = match
  const parts: string[] = []
  const re = /\[(?:'([^']+)'|"([^"]+)"|(\d+))\]/g
  let token = re.exec(suffix)
  while (token) {
    if (token[1] != null) {
      parts.push(`.${token[1]}`)
    } else if (token[2] != null) {
      parts.push(`.${token[2]}`)
    } else if (token[3] != null) {
      parts.push(`[${token[3]}]`)
    }

    token = re.exec(suffix)
  }

  if (base === 'email') {
    return parts.join('').replace(/^\./, '')
  }

  return `${base}${parts.join('')}`
}

function twigPathToPhpPath(path: string) {
  const normalized = path.trim()
  if (!normalized) {
    return '$email'
  }

  const segments: string[] = []
  let buffer = ''
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]
    if (char === '.') {
      if (buffer) {
        segments.push(buffer)
        buffer = ''
      }
      continue
    }

    if (char === '[') {
      if (buffer) {
        segments.push(buffer)
        buffer = ''
      }

      const end = normalized.indexOf(']', i)
      if (end > i) {
        segments.push(normalized.slice(i, end + 1))
        i = end
        continue
      }
    }

    buffer += char
  }

  if (buffer) {
    segments.push(buffer)
  }

  const [first = '', ...rest] = segments
  const startsWithEmailRoot = first === 'email'
  let result = startsWithEmailRoot ? '$email' : `$email['${first}']`

  for (const segment of rest) {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const index = segment.slice(1, -1)
      if (/^\d+$/.test(index)) {
        result += `[${index}]`
      } else {
        result += `['${index.replace(/^['"]|['"]$/g, '')}']`
      }
      continue
    }

    result += `['${segment}']`
  }

  return result
}

function phpExprToTwig(expr: string) {
  let output = expr.trim()
  output = output.replace(/\$[a-zA-Z_]\w*(?:\[(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\d+)\])*/g, (match) => phpPathToTwigPath(match))

  output = output
    .replace(/\s+\.\s+/g, ' ~ ')
    .replace(/&&/g, ' and ')
    .replace(/\|\|/g, ' or ')

  output = output
    .replace(/!\s*empty\(([^)]+)\)/gi, '$1 is not empty')
    .replace(/\bempty\(([^)]+)\)/gi, '$1 is empty')
    .replace(/!\s*isset\(([^)]+)\)/gi, '$1 is not defined')
    .replace(/\bisset\(([^)]+)\)/gi, '$1 is defined')
    .replace(/!\s*is_null\(([^)]+)\)/gi, '$1 is not null')
    .replace(/\bis_null\(([^)]+)\)/gi, '$1 is null')

  output = output
    .replace(/\bnumber_format\(\s*([^,()]+(?:\([^)]*\))?)\s*(?:,[^)]*)?\)/gi, '($1)|number_format')
    .replace(/\bformatPrice\(([^)]+)\)/gi, '($1)|formatPrice')
    .replace(/\bformatCnpjCpf\(([^)]+)\)/gi, '($1)|formatCnpjCpf')
    .replace(/\bformatCEP\(([^)]+)\)/gi, '($1)|formatCEP')
    .replace(/\bformatPhone\(([^)]+)\)/gi, '($1)|formatPhone')
    .replace(/\bucfirst\(([^)]+)\)/gi, '($1)|ucfirst')
    .replace(/\bstrtolower\(([^)]+)\)/gi, '($1)|lower')
    .replace(/\bstrtoupper\(([^)]+)\)/gi, '($1)|upper')
    .replace(/\bcount\(([^)]+)\)/gi, '($1)|length')
    .replace(/\bmb_strlen\(([^)]+)\)/gi, '($1)|length')

  output = output.replace(/\b!\s*(?=[\w(])/g, 'not ')

  return output.trim()
}

function twigExprToPhp(expr: string) {
  let output = expr.trim()

  output = output
    .replace(/\s+and\s+/gi, ' && ')
    .replace(/\s+or\s+/gi, ' || ')
    .replace(/\bnot\b\s*/gi, '!')
    .replace(/\s*~\s*/g, ' . ')

  output = output
    .replace(/\(([^)]+)\)\s*\|\s*number_format\b/gi, 'number_format($1)')
    .replace(/\(([^)]+)\)\s*\|\s*formatPrice\b/gi, 'formatPrice($1)')
    .replace(/\(([^)]+)\)\s*\|\s*formatCnpjCpf\b/gi, 'formatCnpjCpf($1)')
    .replace(/\(([^)]+)\)\s*\|\s*formatCEP\b/gi, 'formatCEP($1)')
    .replace(/\(([^)]+)\)\s*\|\s*formatPhone\b/gi, 'formatPhone($1)')
    .replace(/\(([^)]+)\)\s*\|\s*ucfirst\b/gi, 'ucfirst($1)')
    .replace(/\(([^)]+)\)\s*\|\s*lower\b/gi, 'strtolower($1)')
    .replace(/\(([^)]+)\)\s*\|\s*upper\b/gi, 'strtoupper($1)')
    .replace(/\(([^)]+)\)\s*\|\s*length\b/gi, 'count($1)')

  output = output
    .replace(/\b([\w.[\]]+)\s+is\s+not\s+empty\b/gi, '!empty($1)')
    .replace(/\b([\w.[\]]+)\s+is\s+empty\b/gi, 'empty($1)')
    .replace(/\b([\w.[\]]+)\s+is\s+not\s+defined\b/gi, '!isset($1)')
    .replace(/\b([\w.[\]]+)\s+is\s+defined\b/gi, 'isset($1)')
    .replace(/\b([\w.[\]]+)\s+is\s+not\s+null\b/gi, '!is_null($1)')
    .replace(/\b([\w.[\]]+)\s+is\s+null\b/gi, 'is_null($1)')

  output = output.replace(/[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\[\d+\])*/g, (token) => {
    if (/^(true|false|null|and|or|not)$/i.test(token)) {
      return token
    }

    if (/^[A-Z_]+$/.test(token)) {
      return token
    }

    if (/^\d/.test(token)) {
      return token
    }

    return twigPathToPhpPath(token)
  })

  return output.trim()
}

type StackItem = 'if' | 'for'

function tryInlineIfElseEchoChain(code: string) {
  const normalized = toStringSafe(code).trim().replace(/;+\s*$/, '')
  const head = normalized.match(/^if\s*\(([\s\S]*?)\)\s*\{\s*echo\s+([\s\S]*?)\s*;?\s*\}\s*([\s\S]*)$/i)
  if (!head) {
    return null
  }

  const branches: Array<{ type: 'if' | 'elseif' | 'else'; condition?: string; expression: string }> = [
    {
      type: 'if',
      condition: head[1],
      expression: head[2],
    },
  ]

  let rest = head[3].trim()
  const elseIfPattern = /^\s*(?:else\s*if|elseif)\s*\(([\s\S]*?)\)\s*\{\s*echo\s+([\s\S]*?)\s*;?\s*\}\s*([\s\S]*)$/i
  const elsePattern = /^\s*else\s*\{\s*echo\s+([\s\S]*?)\s*;?\s*\}\s*$/i

  while (rest) {
    const elseIfMatch = rest.match(elseIfPattern)
    if (elseIfMatch) {
      branches.push({
        type: 'elseif',
        condition: elseIfMatch[1],
        expression: elseIfMatch[2],
      })
      rest = elseIfMatch[3].trim()
      continue
    }

    const elseMatch = rest.match(elsePattern)
    if (elseMatch) {
      branches.push({
        type: 'else',
        expression: elseMatch[1],
      })
      rest = ''
      break
    }

    return null
  }

  let output = ''
  for (const branch of branches) {
    if (branch.type === 'if') {
      output += `{% if ${phpExprToTwig(branch.condition || '')} %}{{ ${phpExprToTwig(branch.expression)} }}`
      continue
    }

    if (branch.type === 'elseif') {
      output += `{% elseif ${phpExprToTwig(branch.condition || '')} %}{{ ${phpExprToTwig(branch.expression)} }}`
      continue
    }

    output += `{% else %}{{ ${phpExprToTwig(branch.expression)} }}`
  }

  output += '{% endif %}'
  return output
}

function convertPhpTag(code: string, stack: StackItem[]) {
  const source = toStringSafe(code).trim()
  const inlineChain = tryInlineIfElseEchoChain(source)
  if (inlineChain) {
    return inlineChain
  }

  let match = source.match(/^\}\s*else\s*if\s*\(([\s\S]*)\)\s*\{$/i)
  if (match) {
    return `{% elseif ${phpExprToTwig(match[1])} %}`
  }

  if (/^\}\s*else\s*\{$/i.test(source)) {
    return '{% else %}'
  }

  match = source.match(/^if\s*\(([\s\S]*)\)\s*\{$/i)
  if (match) {
    stack.push('if')
    return `{% if ${phpExprToTwig(match[1])} %}`
  }

  match = source.match(/^(?:else\s*if|elseif)\s*\(([\s\S]*)\)\s*\{$/i)
  if (match) {
    return `{% elseif ${phpExprToTwig(match[1])} %}`
  }

  if (/^else\s*\{$/i.test(source)) {
    return '{% else %}'
  }

  match = source.match(/^foreach\s*\((.+?)\s+as\s+(.+?)\)\s*\{$/i)
  if (match) {
    stack.push('for')
    const iterable = phpExprToTwig(match[1])
    const vars = match[2].split('=>').map((item) => item.trim())
    if (vars.length === 2) {
      return `{% for ${phpPathToTwigPath(vars[0]).replace(/^\./, '')}, ${phpPathToTwigPath(vars[1]).replace(/^\./, '')} in ${iterable} %}`
    }

    return `{% for ${phpPathToTwigPath(vars[0]).replace(/^\./, '')} in ${iterable} %}`
  }

  if (/^\}$/.test(source)) {
    const tag = stack.pop()
    return tag === 'for' ? '{% endfor %}' : '{% endif %}'
  }

  match = source.match(/^echo\s+([\s\S]*?);?$/i)
  if (match) {
    return `{{ ${phpExprToTwig(match[1])} }}`
  }

  return `{# php: ${source.replace(/#/g, '')} #}`
}

export function convertPhpToTwig(template: string) {
  const source = toStringSafe(template)
  const stack: StackItem[] = []
  let cursor = 0
  let output = ''

  while (cursor < source.length) {
    const start = source.indexOf('<?', cursor)
    if (start < 0) {
      output += source.slice(cursor)
      break
    }

    output += source.slice(cursor, start)

    if (source.startsWith('<?=', start)) {
      const end = source.indexOf('?>', start + 3)
      const code = end >= 0 ? source.slice(start + 3, end) : source.slice(start + 3)
      output += `{{ ${phpExprToTwig(code)} }}`
      cursor = end >= 0 ? end + 2 : source.length
      continue
    }

    if (source.startsWith('<?php', start)) {
      const end = source.indexOf('?>', start + 5)
      const code = end >= 0 ? source.slice(start + 5, end) : source.slice(start + 5)
      output += convertPhpTag(code, stack)
      cursor = end >= 0 ? end + 2 : source.length
      continue
    }

    output += source.slice(start, start + 2)
    cursor = start + 2
  }

  while (stack.length) {
    const tag = stack.pop()
    output += tag === 'for' ? '{% endfor %}' : '{% endif %}'
  }

  return output
}

export function convertTwigToPhp(template: string) {
  let output = toStringSafe(template)

  output = output.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (_full, expression) => `<?php echo ${twigExprToPhp(expression)}; ?>`)

  output = output.replace(/{%\s*for\s+([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s+in\s+([\s\S]*?)\s*%}/g, (_full, key, value, iterable) => {
    return `<?php foreach (${twigExprToPhp(iterable)} as $${key} => $${value}) { ?>`
  })

  output = output.replace(/{%\s*for\s+([a-zA-Z_]\w*)\s+in\s+([\s\S]*?)\s*%}/g, (_full, value, iterable) => {
    return `<?php foreach (${twigExprToPhp(iterable)} as $${value}) { ?>`
  })

  output = output.replace(/{%\s*if\s+([\s\S]*?)\s*%}/g, (_full, condition) => {
    return `<?php if (${twigExprToPhp(condition)}) { ?>`
  })

  output = output.replace(/{%\s*elseif\s+([\s\S]*?)\s*%}/g, (_full, condition) => {
    return `<?php } else if (${twigExprToPhp(condition)}) { ?>`
  })

  output = output.replace(/{%\s*else\s*%}/g, '<?php } else { ?>')
  output = output.replace(/{%\s*endif\s*%}/g, '<?php } ?>')
  output = output.replace(/{%\s*endfor\s*%}/g, '<?php } ?>')
  output = output.replace(/\{#([\s\S]*?)#\}/g, '')

  return output
}

export function buildVariableToken(path: string, model: 'twig' | 'php') {
  const normalized = toStringSafe(path).trim()
  if (!normalized) {
    return ''
  }

  if (model === 'php') {
    return `<?php echo ${twigPathToPhpPath(normalized)}; ?>`
  }

  return `{{ ${normalized} }}`
}

export function inferTemplateModel(template: string): 'php' | 'twig' {
  return /<\?(?:php|=)/i.test(toStringSafe(template)) ? 'php' : 'twig'
}

export function resolvePayloadPath(payload: unknown, path: string) {
  const normalized = toStringSafe(path).trim()
  if (!normalized) {
    return ''
  }

  const tokens: Array<string | number> = []
  const regex = /([a-zA-Z_]\w*)|\[(\d+)\]/g
  let match = regex.exec(normalized)
  while (match) {
    if (match[1]) {
      tokens.push(match[1])
    } else if (match[2]) {
      tokens.push(Number(match[2]))
    }
    match = regex.exec(normalized)
  }

  let current: unknown = payload
  for (const token of tokens) {
    if (typeof token === 'number') {
      if (!Array.isArray(current)) {
        return ''
      }
      current = current[token]
      continue
    }

    if (typeof current !== 'object' || current == null) {
      return ''
    }

    current = (current as Record<string, unknown>)[token]
  }

  if (current == null) {
    return ''
  }

  if (typeof current === 'object') {
    return JSON.stringify(current)
  }

  return String(current)
}

export function renderTwigPreviewFallback(template: string, payload: unknown) {
  let output = toStringSafe(template)

  output = output.replace(/\{\{\s*([^}|]+)(?:\|[^}]*)?\s*\}\}/g, (_full, path) => {
    const value = resolvePayloadPath(payload, path)
    return value || ''
  })

  output = output
    .replace(/{%[\s\S]*?%}/g, '')
    .replace(/\s{2,}/g, ' ')

  return output
}
