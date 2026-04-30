import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT_DIR = process.cwd()
const SOURCE_DIRS = ['app', 'src']
const IGNORED_DIRS = new Set(['.git', '.next', '.playwright-mcp', 'node_modules'])
const CONTRACT_TEST_TIMEOUT_MS = 60_000

type CallMatch = {
  file: string
  line: number
  call: string
}

function listSourceFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue
    }

    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath))
      continue
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function extractCall(source: string, index: number, functionName: string) {
  let cursor = index + functionName.length
  while (/\s/.test(source[cursor] ?? '')) {
    cursor += 1
  }

  if (source[cursor] !== '(') {
    return null
  }

  let depth = 0
  let quote: string | null = null
  let escaped = false

  for (let i = cursor; i < source.length; i += 1) {
    const char = source[i]

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === '(') {
      depth += 1
      continue
    }

    if (char === ')') {
      depth -= 1
      if (depth === 0) {
        return source.slice(index, i + 1)
      }
    }
  }

  return source.slice(index)
}

function findFunctionCalls(functionName: string): CallMatch[] {
  const files = SOURCE_DIRS.flatMap((dir) => listSourceFiles(join(ROOT_DIR, dir)))
  const matches: CallMatch[] = []

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    let index = 0

    while ((index = source.indexOf(functionName, index)) >= 0) {
      const call = extractCall(source, index, functionName)
      if (call) {
        matches.push({
          file: relative(ROOT_DIR, file).replace(/\\/g, '/'),
          line: source.slice(0, index).split(/\r?\n/).length,
          call,
        })
      }
      index += functionName.length
    }
  }

  return matches
}

describe('tenant context contract', () => {
  it('keeps local API calls behind the tenant-aware clients', () => {
    const directLocalApiFetches = findFunctionCalls('fetch')
      .filter(({ file }) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .filter(({ call }) => /^fetch\(\s*['"`]\/?api\//.test(call))

    expect(directLocalApiFetches).toEqual([])
  }, CONTRACT_TEST_TIMEOUT_MS)

  it('requires every API v3 bridge call to pass a tenant id explicitly', () => {
    const missingTenant = findFunctionCalls('serverApiFetch')
      .filter(({ file }) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .filter(({ file }) => !file.endsWith('src/services/http/server-api.ts'))
      .filter(({ call }) => !/\btenantId\b/.test(call))
      .map(({ file, line }) => `${file}:${line}`)

    expect(missingTenant).toEqual([])
  }, CONTRACT_TEST_TIMEOUT_MS)
})
