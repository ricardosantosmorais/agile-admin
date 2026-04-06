'use client'

import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { inputClasses } from '@/src/components/ui/input-styles'
import {
  getTreeSelectionState,
  toggleTreeSelection,
  type TreeSelectionNode,
} from '@/src/lib/tree-selection'

export type TreeMultiSelectNode = TreeSelectionNode & {
  label: string
  description?: string
}

type TreeMultiSelectProps = {
  nodes: TreeMultiSelectNode[]
  selectedIds: string[]
  onChange: (nextSelectedIds: string[]) => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  searchAriaLabel?: string
  emptyMessage: string
  expandGroupLabel?: string
  collapseGroupLabel?: string
  disabled?: boolean
}

function filterNodes(nodes: TreeMultiSelectNode[], search: string): TreeMultiSelectNode[] {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return nodes
  }

  return nodes
    .map((node) => ({
      ...node,
      children: filterNodes(node.children as TreeMultiSelectNode[] || [], normalizedSearch),
    }))
    .filter((node) => {
      const haystack = `${node.label} ${node.description ?? ''}`.toLowerCase()
      return haystack.includes(normalizedSearch) || (node.children?.length ?? 0) > 0
    })
}

function TreeCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="h-4 w-4 rounded border-[#d8ccb7]"
    />
  )
}

function TreeNodeRow({
  node,
  level,
  allNodes,
  selectedIds,
  onChange,
  disabled,
  expandGroupLabel,
  collapseGroupLabel,
}: {
  node: TreeMultiSelectNode
  level: number
  allNodes: TreeMultiSelectNode[]
  selectedIds: string[]
  onChange: (nextSelectedIds: string[]) => void
  disabled: boolean
  expandGroupLabel: string
  collapseGroupLabel: string
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const currentState = getTreeSelectionState(allNodes, selectedIds, node.id)
  const [open, setOpen] = useState(level < 2 || currentState !== 'unchecked')

  return (
    <Fragment>
      <div
        className="flex items-start gap-2 rounded-[0.95rem] px-2.5 py-2 hover:bg-[#fcfaf5]"
        style={{ paddingLeft: `${level * 18 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 disabled:opacity-50"
            disabled={disabled}
            aria-label={open ? collapseGroupLabel : expandGroupLabel}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center text-slate-300">
            <FolderTree className="h-4 w-4" />
          </span>
        )}

        <label className="flex min-w-0 flex-1 items-start gap-3 text-sm text-slate-700">
          <span className="pt-1">
            <TreeCheckbox
              checked={currentState === 'checked'}
              indeterminate={currentState === 'indeterminate'}
              disabled={disabled}
              onChange={() => onChange(toggleTreeSelection(allNodes, selectedIds, node.id))}
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{node.label}</span>
            {node.description ? <span className="mt-0.5 block text-xs text-slate-500">{node.description}</span> : null}
          </span>
        </label>
      </div>

      {hasChildren && open ? (
        <div>
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child as TreeMultiSelectNode}
              level={level + 1}
              allNodes={allNodes}
              selectedIds={selectedIds}
              onChange={onChange}
              disabled={disabled}
              expandGroupLabel={expandGroupLabel}
              collapseGroupLabel={collapseGroupLabel}
            />
          ))}
        </div>
      ) : null}
    </Fragment>
  )
}

export function TreeMultiSelect({
  nodes,
  selectedIds,
  onChange,
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  emptyMessage,
  expandGroupLabel = 'Expandir grupo',
  collapseGroupLabel = 'Recolher grupo',
  disabled = false,
}: TreeMultiSelectProps) {
  const filteredNodes = useMemo(() => filterNodes(nodes, search), [nodes, search])

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchAriaLabel ?? searchPlaceholder}
        disabled={disabled}
        className={inputClasses()}
      />

      {filteredNodes.length ? (
        <div className="max-h-[440px] overflow-y-auto rounded-[1rem] border border-[#ece5d9] bg-white py-2">
          {filteredNodes.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              level={0}
              allNodes={nodes}
              selectedIds={selectedIds}
              onChange={onChange}
              disabled={disabled}
              expandGroupLabel={expandGroupLabel}
              collapseGroupLabel={collapseGroupLabel}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </div>
  )
}
