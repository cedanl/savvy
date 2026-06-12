import type { ColumnConfig, ColumnInfo, ExportMode } from '../types'
import { getPreviewValues } from '../utils/previewValues'

interface Props {
  columns: ColumnInfo[]
  config: Record<string, ColumnConfig>
  onChange: (name: string, config: ColumnConfig) => void
}

function TypeBadge({ type }: { type: ColumnInfo['type'] }) {
  return (
    <span className={`type-badge type-badge-${type}`}>{type}</span>
  )
}

export function ColumnTable({ columns, config, onChange }: Props) {
  return (
    <div className="table-wrap">
      <table className="column-table" aria-label="columns">
        <thead>
          <tr>
            <th>Include</th>
            <th>Variable</th>
            <th>Type</th>
            <th>Export as</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => {
            const cfg = config[col.name]
            const previewValues = getPreviewValues(col, cfg)
            const hasDistinctLabel = col.label !== col.name
            const hasValueLabels = Object.keys(col.value_labels).length > 0
            return (
              <tr key={col.name} className={cfg.include ? '' : 'row-excluded'}>
                <td>
                  <input
                    type="checkbox"
                    aria-label="Include"
                    checked={cfg.include}
                    onChange={(e) => onChange(col.name, { ...cfg, include: e.target.checked })}
                  />
                </td>
                <td>
                  {hasDistinctLabel ? (
                    <div className="col-header-selector" role="group" aria-label="CSV header">
                      <button
                        className={`col-header-pill${cfg.use_label_as_header ? ' col-header-pill-active' : ''}`}
                        aria-pressed={cfg.use_label_as_header}
                        disabled={!cfg.include}
                        onClick={() => onChange(col.name, { ...cfg, use_label_as_header: true })}
                      >
                        {col.label}
                      </button>
                      <button
                        className={`col-header-pill${!cfg.use_label_as_header ? ' col-header-pill-active' : ''}`}
                        aria-pressed={!cfg.use_label_as_header}
                        disabled={!cfg.include}
                        onClick={() => onChange(col.name, { ...cfg, use_label_as_header: false })}
                      >
                        {col.name}
                      </button>
                    </div>
                  ) : (
                    <span className="col-label">{col.label}</span>
                  )}

                  {previewValues.length > 0 && (
                    <span className="col-preview">
                      {previewValues.map((v, i) => (
                        <span key={i} className="col-preview-chip">{v}</span>
                      ))}
                    </span>
                  )}
                </td>
                <td>
                  <TypeBadge type={col.type} />
                </td>
                <td>
                  {hasValueLabels ? (
                    <select
                      className="export-select"
                      disabled={!cfg.include}
                      value={cfg.export_mode}
                      onChange={(e) =>
                        onChange(col.name, { ...cfg, export_mode: e.target.value as ExportMode })
                      }
                    >
                      <option value="labels">Text answers</option>
                      <option value="codes">Numbers</option>
                      <option value="both">Both</option>
                    </select>
                  ) : (
                    <span className="export-mode-fixed">Numbers</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
