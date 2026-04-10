'use client'

import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import type { DepartamentoTreeRecord } from '@/src/features/produtos-departamentos/services/produtos-departamentos-client'

type DepartmentTreeNode = DepartamentoTreeRecord & {
  children: DepartmentTreeNode[]
}

type DepartamentoTreeSelectorProps = {
  items: DepartamentoTreeRecord[]
  search: string
  selectedIds: string[]
  onToggle: (id: string) => void
}

function buildTree(items: DepartamentoTreeRecord[]) {
  const byParent = new Map<string | null, DepartmentTreeNode[]>()
  const nodes = items.map<DepartmentTreeNode>((item) => ({ ...item, children: [] }))
  const byId = new Map(nodes.map((node) => [node.id, node]))

  nodes.forEach((node) => {
    const parentId = node.id_departamento_pai || null
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node)
      return
    }

    const rootItems = byParent.get(null) || []
    rootItems.push(node)
    byParent.set(null, rootItems)
  })

  return byParent.get(null) || []
}

function filterTree(nodes: DepartmentTreeNode[], search: string): DepartmentTreeNode[] {
  const normalized = search.trim().toLowerCase()
  if (!normalized) {
    return nodes
  }

  return nodes
    .map((node) => ({
      ...node,
      children: filterTree(node.children, normalized),
    }))
    .filter((node) => node.nome.toLowerCase().includes(normalized) || node.children.length > 0)
}

function TreeNode({
  node,
  level,
  selectedIds,
  onToggle,
}: {
  node: DepartmentTreeNode
  level: number
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(level <= 1)
  const checked = selectedIds.includes(node.id)
  const hasChildren = node.children.length > 0

  return (
    <Fragment>
      <div className="app-table-row-hover flex items-center gap-2 rounded-[0.95rem] px-2.5 py-2" style={{ paddingLeft: `${level * 16 + 8}px` }}>
        {hasChildren ? (
          <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--app-muted)]">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center text-[color:var(--app-muted)]/70">
            <FolderTree className="h-4 w-4" />
          </span>
        )}
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[color:var(--app-text)]">
          <input type="checkbox" checked={checked} onChange={() => onToggle(node.id)} className="h-4 w-4 rounded border-[color:var(--app-control-border)]" />
          <span className="truncate">{node.nome}</span>
        </label>
      </div>
      {hasChildren && open ? (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} selectedIds={selectedIds} onToggle={onToggle} />
          ))}
        </div>
      ) : null}
    </Fragment>
  )
}

export function DepartamentoTreeSelector({
  items,
  search,
  selectedIds,
  onToggle,
}: DepartamentoTreeSelectorProps) {
  const nodes = useMemo(() => filterTree(buildTree(items), search), [items, search])

  if (!nodes.length) {
    return <div className="app-pane rounded-[1rem] border border-dashed border-[color:var(--app-card-border)] px-4 py-6 text-sm text-[color:var(--app-muted)]">Nenhum departamento encontrado.</div>
  }

  return (
    <div className="app-pane max-h-[420px] overflow-y-auto rounded-[1rem] border border-[color:var(--app-card-border)] py-2">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} level={0} selectedIds={selectedIds} onToggle={onToggle} />
      ))}
    </div>
  )
}
