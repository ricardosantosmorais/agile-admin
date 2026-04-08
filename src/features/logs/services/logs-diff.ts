export type JsonDiffChangeKind = 'added' | 'removed' | 'changed'

export type JsonDiffRow = {
  path: string
  kind: JsonDiffChangeKind
  previousValue: string
  nextValue: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringifyValue(value: unknown) {
  if (value === undefined) {
    return '-'
  }

  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function areEqual(left: unknown, right: unknown) {
  return stringifyValue(left) === stringifyValue(right)
}

function joinPath(base: string, segment: string) {
  if (!base) {
    return segment
  }

  if (segment.startsWith('[')) {
    return `${base}${segment}`
  }

  return `${base}.${segment}`
}

function diffValues(previousValue: unknown, nextValue: unknown, path: string, rows: JsonDiffRow[]) {
  if (Array.isArray(previousValue) || Array.isArray(nextValue)) {
    const previousArray = Array.isArray(previousValue) ? previousValue : []
    const nextArray = Array.isArray(nextValue) ? nextValue : []
    const maxLength = Math.max(previousArray.length, nextArray.length)

    for (let index = 0; index < maxLength; index += 1) {
      diffValues(previousArray[index], nextArray[index], joinPath(path, `[${index}]`), rows)
    }

    return
  }

  if (isObject(previousValue) || isObject(nextValue)) {
    const previousObject = isObject(previousValue) ? previousValue : {}
    const nextObject = isObject(nextValue) ? nextValue : {}
    const keys = new Set([...Object.keys(previousObject), ...Object.keys(nextObject)])

    for (const key of keys) {
      diffValues(previousObject[key], nextObject[key], joinPath(path, key), rows)
    }

    return
  }

  if (areEqual(previousValue, nextValue)) {
    return
  }

  let kind: JsonDiffChangeKind = 'changed'

  if (previousValue === undefined) {
    kind = 'added'
  } else if (nextValue === undefined) {
    kind = 'removed'
  }

  rows.push({
    path: path || '$',
    kind,
    previousValue: stringifyValue(previousValue),
    nextValue: stringifyValue(nextValue),
  })
}

function parseSnapshot(snapshot: string | null) {
  if (!snapshot) {
    return null
  }

  try {
    return JSON.parse(snapshot)
  } catch {
    return null
  }
}

export function buildJsonDiffRows(previousSnapshot: string | null, nextSnapshot: string | null): JsonDiffRow[] {
  const previous = parseSnapshot(previousSnapshot)
  const next = parseSnapshot(nextSnapshot)

  if (!previous && !next) {
    return []
  }

  const rows: JsonDiffRow[] = []
  diffValues(previous, next, '', rows)
  return rows
}

