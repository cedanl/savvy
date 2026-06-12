import io
import json
import tempfile
from pathlib import Path

from fastapi import APIRouter, FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from backend.models import ExportManifest, FileResponse
from backend.spss import build_export_df, parse_columns, read_sav

app = FastAPI(title="Savvy")
api = APIRouter(prefix="/api")

DIST = Path(__file__).parent.parent / "app" / "dist"


async def _parse_upload(file: UploadFile):
    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".sav", delete=True) as tmp:
        tmp.write(contents)
        tmp.flush()
        try:
            return read_sav(tmp.name)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e)) from e
        except Exception as e:
            raise HTTPException(
                status_code=422, detail="Could not parse file as SPSS .sav"
            ) from e


@api.get("/health")
def health():
    return {"status": "ok"}


@api.post("/file", response_model=FileResponse)
async def upload_file(file: UploadFile):
    df, meta = await _parse_upload(file)
    return FileResponse(
        filename=file.filename or "file.sav",
        row_count=len(df),
        columns=parse_columns(df, meta),
    )


@api.post("/export")
async def export_file(file: UploadFile, manifest: str = Form(...)):
    try:
        manifest_data = ExportManifest(**json.loads(manifest))
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=422, detail="Invalid manifest") from e

    df, meta = await _parse_upload(file)
    result_df = build_export_df(df, meta, manifest_data)
    buf = io.StringIO()
    result_df.to_csv(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=export.csv"},
    )


app.include_router(api)

# Serve the built frontend when app/dist exists (production / release).
# Mounted after the API router so /api/* routes take precedence.
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="spa")
