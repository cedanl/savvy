# Savvy

## Overview
Local browser-based tool for working with SPSS survey files. Reads `.sav` files and lets non-technical users control column selection and value handling — no data leaves the machine.

## Standards
Follow CEDA technical standards: https://github.com/cedanl/.github/tree/main/standards/README.md

## Tech Stack
Python 3.13, FastAPI, pyreadstat, pandas, React (Vite + TypeScript). Package management: uv (Python), npm (Node).

## Project Structure
```
savvy/
├── .devcontainer/          # Python 3.13 + Node 22
├── .github/workflows/
├── app/                    # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/     # FileUpload, ColumnTable, SummaryBar, ExportPreview
│       ├── types/          # TypeScript types mirroring backend models
│       ├── api.ts          # fetch wrappers for /file and /export
│       └── App.tsx         # root component, all state lives here
├── backend/
│   ├── main.py             # FastAPI routes (/file, /export, /health)
│   ├── models.py           # Pydantic models
│   ├── spss.py             # pyreadstat wrapper (parse_columns, extract_sample_rows, build_export_df)
│   └── config.toml
├── tests/                  # pytest (backend)
├── Makefile
├── pyproject.toml
└── .python-version
```

## How to Run

```bash
make install    # uv sync + npm install
make dev        # starts both servers; Ctrl+C kills both
make url        # prints the correct URL when using devcontainer-cli (plain Docker)
```

Backend: port 8000 (proxied — not accessed directly by the browser).
Frontend: port 5173 — this is the URL to open.

## API

| Route | Method | Description |
|---|---|---|
| `/file` | POST | Multipart `.sav` upload → returns column metadata + sample rows |
| `/export` | POST | Multipart `.sav` + manifest JSON form field → returns CSV |
| `/health` | GET | Liveness check |

The Vite dev server proxies `/api/*` → `http://localhost:8000/*`, so the frontend uses relative `/api` paths.

## Key Design Decisions
- `pyreadstat` is the underlying SPSS reader — this repo wraps it but does not reimplement it
- Backend is a thin API layer; no business logic beyond what's needed to translate pyreadstat output into JSON
- Export preview is computed client-side using `value_labels` from the column metadata — no extra API call
- All state (file, column config, search query) lives in `App.tsx`; all child components are stateless
- Column labels fall back to the coded name when the `.sav` file has no label set for a column

## Testing

```bash
make test                          # all tests
uv run pytest tests/ -q            # backend only
cd app && npx vitest run           # frontend only
```

19 backend tests (pytest + httpx TestClient), 47 frontend tests (vitest + React Testing Library).
