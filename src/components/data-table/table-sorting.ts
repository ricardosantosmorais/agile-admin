export function getSortLabel<TColumn extends string>(
  orderBy: TColumn,
  labels: Partial<Record<TColumn, string>>,
  fallback: string,
) {
  return labels[orderBy] ?? fallback
}
