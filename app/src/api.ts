import type { ExportManifest, FileResponse } from './types'

const BASE = '/api'

export async function loadFile(file: File): Promise<FileResponse> {
  const form = new FormData()
  form.append('file', file)
  const r = await fetch(`${BASE}/file`, { method: 'POST', body: form })
  if (!r.ok) throw new Error(`Failed to parse file (${r.status})`)
  return r.json()
}

export async function exportFile(file: File, manifest: ExportManifest): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  form.append('manifest', JSON.stringify(manifest))
  const r = await fetch(`${BASE}/export`, { method: 'POST', body: form })
  if (!r.ok) throw new Error(`Export failed (${r.status})`)
  return r.blob()
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
