'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

type EmailTemplateVariableTreeProps = {
  payload: unknown
  buildToken: (path: string) => string
  onInsertToken: (token: string) => void
  disabled?: boolean
  emptyMessage?: string
  rootLabel?: string
  initialExpandDepth?: number
  className?: string
}

type TreeNode = {
  key: string
  path: string
  label: string
  type: 'object' | 'array' | 'value'
  children: TreeNode[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createTreeNode(label: string, path: string, value: unknown): TreeNode {
  if (Array.isArray(value)) {
    const children = value.map((item, index) => createTreeNode(`[${index}]`, path ? `${path}[${index}]` : `[${index}]`, item))
    return {
      key: path || label,
      path,
      label,
      type: 'array',
      children,
    }
  }

  if (isObject(value)) {
    const children = Object.entries(value).map(([key, childValue]) => {
      const nextPath = path ? `${path}.${key}` : key
      return createTreeNode(key, nextPath, childValue)
    })

    return {
      key: path || label,
      path,
      label,
      type: 'object',
      children,
    }
  }

  return {
    key: path || label,
    path,
    label,
    type: 'value',
    children: [],
  }
}

function renderValuePreview(value: unknown) {
  if (value == null) return 'null'
  if (typeof value === 'object') return Array.isArray(value) ? `array(${value.length})` : 'object'
  const normalized = String(value)
  return normalized.length > 38 ? `${normalized.slice(0, 38)}...` : normalized
}

export function collectVariablePaths(payload: unknown) {
  const paths: string[] = []

  function walk(value: unknown, path: string) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const nextPath = path ? `${path}[${index}]` : `[${index}]`
        walk(item, nextPath)
      })
      return
    }

    if (isObject(value)) {
      Object.entries(value).forEach(([key, childValue]) => {
        const nextPath = path ? `${path}.${key}` : key
        walk(childValue, nextPath)
      })
      return
    }

    if (path) {
      paths.push(path)
    }
  }

  walk(payload, '')
  return paths
}

function VariableNode({
  node,
  sourceValue,
  expanded,
  toggle,
  buildToken,
  onInsertToken,
  disabled,
  depth,
}: {
  node: TreeNode
  sourceValue: unknown
  expanded: Record<string, boolean>
  toggle: (key: string) => void
  buildToken: (path: string) => string
  onInsertToken: (token: string) => void
  disabled: boolean
  depth: number
}) {
  const isExpanded = expanded[node.key] ?? false
  const canInsert = Boolean(node.path) && node.path[0] !== '['
  const hasChildren = node.children.length > 0

  if (node.type === 'value') {
    const token = canInsert ? buildToken(node.path) : ''
    return (
      <button
        type="button"
        disabled={disabled || !canInsert}
        className="app-control-muted group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:border-[color:var(--app-control-border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        draggable={!disabled && canInsert}
        onDragStart={(event) => {
          if (!token) return
          event.dataTransfer.setData('text/plain', token)
        }}
        onClick={() => {
          if (!token) return
          onInsertToken(token)
        }}
      >
        <span className="app-button-secondary min-w-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">{node.label}</span>
        <span className="app-control max-w-[52%] truncate rounded-full px-2.5 py-1 text-[11px] font-medium text-[color:var(--app-muted)]">{renderValuePreview(sourceValue)}</span>
      </button>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="app-control-muted flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:border-[color:var(--app-control-border-strong)]"
        onClick={() => toggle(node.key)}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <span className="truncate">{node.label}</span>
        </span>
        <span className="app-button-secondary rounded-full px-2 py-0.5 text-[11px] font-semibold text-[color:var(--app-muted)]">
          {node.type === 'array' ? `[${node.children.length}]` : `{${node.children.length}}`}
        </span>
      </button>

      {isExpanded && hasChildren ? (
        <div className="space-y-1 pl-3">
          {node.children.map((child) => {
            const childValue = isObject(sourceValue)
              ? sourceValue[child.label]
              : Array.isArray(sourceValue)
                ? sourceValue[Number(child.label.replace(/[^\d]/g, ''))]
                : undefined

            return (
              <VariableNode
                key={child.key}
                node={child}
                sourceValue={childValue}
                expanded={expanded}
                toggle={toggle}
                buildToken={buildToken}
                onInsertToken={onInsertToken}
                disabled={disabled}
                depth={depth + 1}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function EmailTemplateVariableTree({
  payload,
  buildToken,
  onInsertToken,
  disabled = false,
  emptyMessage = 'Nenhuma variável disponível para o tipo selecionado.',
  rootLabel = 'payload',
  initialExpandDepth = 0,
  className = '',
}: EmailTemplateVariableTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    if (initialExpandDepth <= 0) {
      return {}
    }

    return {
      [rootLabel]: true,
    }
  })

  const rootNode = useMemo(() => createTreeNode(rootLabel, '', payload), [payload, rootLabel])

  function toggle(key: string) {
    setExpanded((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }))
  }

  if (!payload || (Array.isArray(payload) && payload.length === 0) || (isObject(payload) && Object.keys(payload).length === 0)) {
    return (
      <div className="app-control-muted rounded-xl border-dashed px-3 py-5 text-sm text-[color:var(--app-muted)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`max-h-[540px] overflow-visible rounded-xl bg-transparent p-0 ${className}`.trim()}>
      <VariableNode
        node={rootNode}
        sourceValue={payload}
        expanded={expanded}
        toggle={toggle}
        buildToken={buildToken}
        onInsertToken={onInsertToken}
        disabled={disabled}
        depth={0}
      />
    </div>
  )
}
