https://github.com/cedanl/savvy/releases/download/v0.1.0/demo.mkv

# Savvy

Local tool for working with SPSS survey files. Load a `.sav` file, explore columns and value labels, configure what to export — all in a browser UI that runs entirely on your machine. No data leaves your machine.

Built on [pyreadstat](https://github.com/Roche/pyreadstat) for SPSS file parsing.

## Usage

### Download a release (recommended for end users)

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/)
2. Download the latest `savvy-vX.X.X.tar.gz` from [Releases](https://github.com/cedanl/savvy/releases)
3. Extract and run:

```bash
tar -xzf savvy-v0.1.0.tar.gz
cd savvy
uv run uvicorn backend.main:app --port 8000
```

4. Open http://localhost:8000

### From source (developers)

```bash
git clone https://github.com/cedanl/savvy
cd savvy
make install
make dev
```

Open http://localhost:5173. If running via devcontainer-cli (plain Docker), run `make url` to get the correct address.

## What it does

After loading a `.sav` file:

- See all columns with their full question labels, detected type, and sample values (chips update live as you change the export mode)
- Search and filter columns by name or label
- Toggle columns on/off with select all / deselect all
- For columns with value labels: choose per column whether to export raw codes (Numbers), readable labels (Text answers), or both
- For columns with both a question label and a coded name: pick which to use as the CSV header
- Export to CSV

## API

| Endpoint | Description |
|---|---|
| `POST /api/file` | Upload a `.sav` file, returns column metadata |
| `POST /api/export` | Upload a `.sav` file + JSON manifest, returns CSV |

## Development

Open in a devcontainer for a pre-configured Python 3.13 + Node 22 environment.

```bash
make test       # run all tests (backend + frontend)
make backend    # backend only, port 8000
make frontend   # frontend only, port 5173
```

Tests: 19 backend (pytest) + 68 frontend (vitest).

## License

[EUPL v1.2](LICENSE)
