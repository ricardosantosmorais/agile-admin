type EmptyTableRowProps = {
  colSpan: number
  message: string
}

export function EmptyTableRow({ colSpan, message }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10">
        <div className="app-table-muted rounded-[1rem] border border-dashed border-line px-6 py-8 text-center text-sm text-slate-500">
          {message}
        </div>
      </td>
    </tr>
  )
}
