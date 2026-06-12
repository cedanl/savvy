from enum import Enum

from pydantic import BaseModel


class ExportMode(str, Enum):
    codes = "codes"
    labels = "labels"
    both = "both"


class ColumnInfo(BaseModel):
    name: str
    label: str
    type: str  # categorical | numeric | text
    sample_values: list[str]
    value_labels: dict[str, str]


class FileResponse(BaseModel):
    filename: str
    row_count: int
    columns: list[ColumnInfo]


class ColumnConfig(BaseModel):
    include: bool = True
    export_mode: ExportMode = ExportMode.labels
    use_label_as_header: bool = False


class ExportManifest(BaseModel):
    columns: dict[str, ColumnConfig]
