import { useState } from 'react'

interface Props {
  onFile: (file: File) => void
}

function UploadIcon() {
  return (
    <svg
      className="upload-icon"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function FileUpload({ onFile }: Props) {
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.sav')) onFile(file)
  }

  return (
    <label
      className={`upload-zone${dragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        data-testid="file-input"
        type="file"
        accept=".sav"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      <UploadIcon />
      <span className="upload-zone-label">Load a .sav file</span>
      <span className="upload-zone-hint">drag and drop or click to browse</span>
    </label>
  )
}
