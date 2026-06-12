from typing import Any, cast

import pandas as pd
import pyreadstat

from backend.models import ColumnInfo, ExportManifest, ExportMode

_SAMPLE_VALUES_CAP = 5


def read_sav(path: str) -> tuple[pd.DataFrame, pyreadstat.metadata_container]:
    try:
        result = pyreadstat.read_sav(path)
        return cast(tuple[pd.DataFrame, pyreadstat.metadata_container], result)
    except pyreadstat.PyreadstatError as e:
        raise ValueError(f"Could not parse SPSS file: {e}") from e


def _to_key(v: Any) -> str:
    """Normalise SPSS value to a string key; whole-number floats become integers."""
    try:
        f = float(v)
        if f == int(f):
            return str(int(f))
    except (ValueError, OverflowError, TypeError):
        pass
    return str(v)


def _col_label(meta: pyreadstat.metadata_container, col_name: str) -> str:
    return meta.column_names_to_labels.get(col_name) or col_name


def _raw_value_labels(meta: pyreadstat.metadata_container, col_name: str) -> dict:
    return meta.variable_value_labels.get(col_name, {})


def parse_columns(
    df: pd.DataFrame, meta: pyreadstat.metadata_container
) -> list[ColumnInfo]:
    columns = []
    for col in df.columns:
        label = _col_label(meta, col)
        raw_labels = _raw_value_labels(meta, col)
        has_labels = bool(raw_labels)

        if has_labels:
            col_type = "categorical"
        elif df[col].dtype == object:
            col_type = "text"
        else:
            col_type = "numeric"

        sample = [_to_key(v) for v in df[col].dropna().unique()[:_SAMPLE_VALUES_CAP]]
        value_labels = {_to_key(k): v for k, v in raw_labels.items()}

        columns.append(ColumnInfo(
            name=col,
            label=label,
            type=col_type,
            sample_values=sample,
            value_labels=value_labels,
        ))
    return columns


def build_export_df(
    df: pd.DataFrame,
    meta: pyreadstat.metadata_container,
    manifest: ExportManifest,
) -> pd.DataFrame:
    result: dict[str, pd.Series] = {}

    for col_name, config in manifest.columns.items():
        if not config.include or col_name not in df.columns:
            continue

        value_labels = _raw_value_labels(meta, col_name)
        col_label = _col_label(meta, col_name)

        if config.export_mode == ExportMode.both and value_labels:
            base = col_label if config.use_label_as_header else col_name
            result[f"{base}_code"] = df[col_name]
            result[f"{base}_label"] = df[col_name].map(value_labels)
        else:
            header = col_label if config.use_label_as_header else col_name
            if config.export_mode == ExportMode.labels and value_labels:
                result[header] = df[col_name].map(value_labels)
            else:
                result[header] = df[col_name]

    return pd.DataFrame(result)
