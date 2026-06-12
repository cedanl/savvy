interface Props {
  filename: string
  rowCount: number
  selectedCount: number
  totalCount: number
}

export function SummaryBar({ filename, rowCount, selectedCount, totalCount }: Props) {
  return (
    <div className="summary-bar">
      <span className="summary-filename">{filename}</span>
      <span className="summary-sep" aria-hidden="true">·</span>
      <span className="summary-stat">{rowCount} rows</span>
      <span className="summary-sep" aria-hidden="true">·</span>
      <span className="summary-stat">{selectedCount} of {totalCount} columns selected</span>
    </div>
  )
}
