'use client'

export type TreeSelectionNode = {
  id: string
  children?: TreeSelectionNode[]
}

export type TreeSelectionState = 'checked' | 'indeterminate' | 'unchecked'

function normalizeNodes(nodes: TreeSelectionNode[]) {
  const ids = new Set<string>()

  function visit(node: TreeSelectionNode) {
    ids.add(node.id)
    node.children?.forEach(visit)
  }

  nodes.forEach(visit)
  return ids
}

function walkTree(nodes: TreeSelectionNode[], visitor: (node: TreeSelectionNode) => void) {
  function visit(node: TreeSelectionNode) {
    visitor(node)
    node.children?.forEach(visit)
  }

  nodes.forEach(visit)
}

function addDescendants(node: TreeSelectionNode, target: Set<string>) {
  target.add(node.id)
  node.children?.forEach((child) => addDescendants(child, target))
}

function removeDescendants(node: TreeSelectionNode, target: Set<string>) {
  target.delete(node.id)
  node.children?.forEach((child) => removeDescendants(child, target))
}

function findNode(nodes: TreeSelectionNode[], targetId: string): TreeSelectionNode | null {
  let match: TreeSelectionNode | null = null

  walkTree(nodes, (node) => {
    if (!match && node.id === targetId) {
      match = node
    }
  })

  return match
}

function syncAncestors(nodes: TreeSelectionNode[], selectedIds: Set<string>) {
  function visit(node: TreeSelectionNode): boolean {
    const children = node.children ?? []
    if (!children.length) {
      return selectedIds.has(node.id)
    }

    const childStates = children.map(visit)
    const allChecked = childStates.every(Boolean)

    if (allChecked) {
      selectedIds.add(node.id)
      return true
    }

    selectedIds.delete(node.id)
    return false
  }

  nodes.forEach(visit)
}

export function normalizeTreeSelection(nodes: TreeSelectionNode[], selectedIds: string[]) {
  const knownIds = normalizeNodes(nodes)
  const normalized = new Set(selectedIds.filter((id) => knownIds.has(id)))

  walkTree(nodes, (node) => {
    if (normalized.has(node.id)) {
      addDescendants(node, normalized)
    }
  })

  syncAncestors(nodes, normalized)

  return [...normalized]
}

export function getTreeSelectionState(nodes: TreeSelectionNode[], selectedIds: string[], targetId: string): TreeSelectionState {
  const normalized = new Set(normalizeTreeSelection(nodes, selectedIds))

  function visit(node: TreeSelectionNode): { found: boolean; state: TreeSelectionState } {
    const children = node.children ?? []

    if (!children.length) {
      const state = normalized.has(node.id) ? 'checked' : 'unchecked'
      return {
        found: node.id === targetId,
        state,
      }
    }

    const childResults = children.map(visit)
    const childStates = childResults.map((result) => result.state)
    const allChecked = childStates.every((state) => state === 'checked')
    const anyActive = childStates.some((state) => state !== 'unchecked')
    const currentState = allChecked && normalized.has(node.id)
      ? 'checked'
      : anyActive
        ? 'indeterminate'
        : (normalized.has(node.id) ? 'checked' : 'unchecked')

    if (node.id === targetId) {
      return { found: true, state: currentState }
    }

    const childMatch = childResults.find((result) => result.found)
    if (childMatch) {
      return childMatch
    }

    return { found: false, state: currentState }
  }

  for (const node of nodes) {
    const result = visit(node)
    if (result.found) {
      return result.state
    }
  }

  return 'unchecked'
}

export function toggleTreeSelection(nodes: TreeSelectionNode[], selectedIds: string[], targetId: string) {
  const normalized = new Set(normalizeTreeSelection(nodes, selectedIds))
  const target = findNode(nodes, targetId)

  if (!target) {
    return [...normalized]
  }

  const currentState = getTreeSelectionState(nodes, [...normalized], targetId)

  if (currentState === 'checked' || currentState === 'indeterminate') {
    removeDescendants(target, normalized)
  } else {
    addDescendants(target, normalized)
  }

  syncAncestors(nodes, normalized)

  return [...normalized]
}

export function collectIndeterminateTreeIds(nodes: TreeSelectionNode[], selectedIds: string[]) {
  const normalized = new Set(normalizeTreeSelection(nodes, selectedIds))
  const indeterminateIds = new Set<string>()

  function visit(node: TreeSelectionNode): TreeSelectionState {
    const children = node.children ?? []

    if (!children.length) {
      return normalized.has(node.id) ? 'checked' : 'unchecked'
    }

    const childStates = children.map(visit)
    const allChecked = childStates.every((state) => state === 'checked')
    const anyActive = childStates.some((state) => state !== 'unchecked')

    if (allChecked && normalized.has(node.id)) {
      return 'checked'
    }

    if (anyActive) {
      indeterminateIds.add(node.id)
      return 'indeterminate'
    }

    return 'unchecked'
  }

  nodes.forEach(visit)

  return [...indeterminateIds]
}

export function serializeTreeSelection(nodes: TreeSelectionNode[], selectedIds: string[]) {
  const normalized = normalizeTreeSelection(nodes, selectedIds)
  const indeterminateIds = collectIndeterminateTreeIds(nodes, normalized)
  return [...new Set([...normalized, ...indeterminateIds])]
}
