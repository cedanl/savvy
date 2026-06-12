import io
import json

import pandas as pd


def _manifest(**column_configs):
    return json.dumps({"columns": column_configs})


def _post_export(client, sample_sav, manifest):
    with open(sample_sav, "rb") as f:
        return client.post(
            "/api/export",
            files={"file": ("sample.sav", f, "application/octet-stream")},
            data={"manifest": manifest},
        )


def test_malformed_manifest_returns_422(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/export",
            files={"file": ("sample.sav", f, "application/octet-stream")},
            data={"manifest": "not valid json {{{"},
        )
    assert r.status_code == 422


def test_export_returns_csv(client, sample_sav):
    manifest = _manifest(
        q1={"include": True, "export_mode": "labels"},
        q2={"include": True, "export_mode": "codes"},
        age={"include": True, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]


def test_export_excludes_columns(client, sample_sav):
    manifest = _manifest(
        q1={"include": False, "export_mode": "labels"},
        q2={"include": True, "export_mode": "labels"},
        age={"include": True, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert "q1" not in df.columns
    assert "q2" in df.columns


def test_export_labels_mode_replaces_codes(client, sample_sav):
    manifest = _manifest(
        q1={"include": True, "export_mode": "labels"},
        q2={"include": False, "export_mode": "labels"},
        age={"include": False, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert set(df["q1"].dropna()) <= {"Very satisfied", "Satisfied", "Dissatisfied"}


def test_export_codes_mode_keeps_numeric(client, sample_sav):
    manifest = _manifest(
        q1={"include": True, "export_mode": "codes"},
        q2={"include": False, "export_mode": "codes"},
        age={"include": False, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert df["q1"].dtype in ["float64", "int64"]


def test_export_both_mode_creates_two_columns(client, sample_sav):
    manifest = _manifest(
        q1={"include": True, "export_mode": "both"},
        q2={"include": False, "export_mode": "codes"},
        age={"include": False, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert "q1_code" in df.columns
    assert "q1_label" in df.columns


def test_export_both_mode_numeric_column_is_single(client, sample_sav):
    manifest = _manifest(
        q1={"include": False, "export_mode": "codes"},
        q2={"include": False, "export_mode": "codes"},
        age={"include": True, "export_mode": "both"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert "age" in df.columns
    assert "age_code" not in df.columns


def test_export_both_mode_uses_label_as_header_base_when_requested(client, sample_sav):
    manifest = _manifest(
        q1={"include": True, "export_mode": "both", "use_label_as_header": True},
        q2={"include": False, "export_mode": "codes"},
        age={"include": False, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert "Overall satisfaction_code" in df.columns
    assert "Overall satisfaction_label" in df.columns
    assert "q1_code" not in df.columns
    assert "q1_label" not in df.columns


def test_manifest_wrong_pydantic_shape_returns_422(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/export",
            files={"file": ("sample.sav", f, "application/octet-stream")},
            data={"manifest": '{"columns": "not_a_dict"}'},
        )
    assert r.status_code == 422


def test_export_uses_column_label_as_header_option(client, sample_sav):
    manifest = _manifest(
        q1={"include": True, "export_mode": "labels", "use_label_as_header": True},
        q2={"include": False, "export_mode": "codes"},
        age={"include": False, "export_mode": "codes"},
    )
    r = _post_export(client, sample_sav, manifest)
    df = pd.read_csv(io.StringIO(r.text))
    assert "Overall satisfaction" in df.columns
