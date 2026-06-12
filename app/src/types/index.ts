export type ExportMode = 'codes' | 'labels' | 'both'

export interface ColumnInfo {
  name: string
  label: string
  type: 'categorical' | 'numeric' | 'text'
  sample_values: string[]
  value_labels: Record<string, string>
}

export interface FileResponse {
  filename: string
  row_count: number
  columns: ColumnInfo[]
}

export interface ColumnConfig {
  include: boolean
  export_mode: ExportMode
  use_label_as_header: boolean
}

export interface ExportManifest {
  columns: Record<string, ColumnConfig>
}
