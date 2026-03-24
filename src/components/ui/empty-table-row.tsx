'use client'

type EmptyTableRowProps = {
  colSpan: number
  message: string
}

export function EmptyTableRow({ colSpan, message }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-slate-500">
        {message}
      </td>
    </tr>
  )
}
