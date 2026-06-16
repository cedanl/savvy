import { useState } from 'react'
import './App.css'
import * as api from './api'
import { ColumnTable } from './components/ColumnTable'
import { FileUpload } from './components/FileUpload'
import { SummaryBar } from './components/SummaryBar'
import type { ColumnConfig, FileResponse } from './types'

function defaultConfig(columns: FileResponse['columns']): Record<string, ColumnConfig> {
  return Object.fromEntries(
    columns.map((col) => [
      col.name,
      {
        include: true,
        export_mode: col.type === 'categorical' ? 'labels' : 'codes',
        use_label_as_header: false,
      } satisfies ColumnConfig,
    ])
  )
}

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<FileResponse | null>(null)
  const [config, setConfig] = useState<Record<string, ColumnConfig>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function handleFile(f: File) {
    setFile(f)
    setLoading(true)
    setError(null)
    setData(null)
    setSearchQuery('')
    try {
      const response = await api.loadFile(f)
      setData(response)
      setConfig(defaultConfig(response.columns))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    if (!file) return
    try {
      const blob = await api.exportFile(file, { columns: config })
      api.triggerDownload(blob, file.name.replace(/\.sav$/i, '.csv'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  function handleSelectAll() {
    setConfig((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, include: true }]))
    )
  }

  function handleDeselectAll() {
    setConfig((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, include: false }]))
    )
  }

  function handleInvertSelection() {
    setConfig((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, include: !v.include }]))
    )
  }

  const filteredColumns = (data?.columns ?? []).filter((col) => {
    const q = searchQuery.toLowerCase()
    return col.name.toLowerCase().includes(q) || col.label.toLowerCase().includes(q)
  })

  const selectedCount = Object.values(config).filter((c) => c.include).length

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-title">Savvy</span>
        <span className="app-subtitle">SPSS to CSV converter</span>
      </header>

      <FileUpload onFile={handleFile} />

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          Reading file…
        </div>
      )}

      {error && (
        <div className="error-state" role="alert">
          {error}
        </div>
      )}

      {data && (
        <>
          <SummaryBar
            filename={data.filename}
            rowCount={data.row_count}
            selectedCount={selectedCount}
            totalCount={data.columns.length}
          />

          <div className="toolbar">
            <input
              className="search-input"
              role="searchbox"
              type="search"
              placeholder="Search columns…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn" onClick={handleSelectAll}>
              Select all
            </button>
            <button className="btn" onClick={handleDeselectAll}>
              Deselect all
            </button>
            <button className="btn" data-testid="invert-btn" onClick={handleInvertSelection}>
              Invert selection
            </button>
          </div>

          <ColumnTable
            columns={filteredColumns}
            config={config}
            onChange={(name, cfg) => setConfig((prev) => ({ ...prev, [name]: cfg }))}
          />

          <div className="export-bar">
            <button className="btn btn-primary" onClick={handleExport}>
              Export to CSV
            </button>
          </div>
        </>
      )}
    </div>
  )
}
