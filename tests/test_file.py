def test_upload_returns_columns(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    assert r.status_code == 200
    data = r.json()
    assert "columns" in data
    assert len(data["columns"]) == 3


def test_column_has_required_fields(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    col = r.json()["columns"][0]
    assert "name" in col
    assert "label" in col
    assert "type" in col
    assert "sample_values" in col
    assert "value_labels" in col


def test_categorical_column_has_label_and_value_labels(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    cols = {c["name"]: c for c in r.json()["columns"]}
    assert cols["q1"]["label"] == "Overall satisfaction"
    assert cols["q1"]["type"] == "categorical"
    assert cols["q1"]["value_labels"] == {
        "1": "Very satisfied", "2": "Satisfied", "3": "Dissatisfied"
    }


def test_numeric_column_has_no_value_labels(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    cols = {c["name"]: c for c in r.json()["columns"]}
    assert cols["age"]["type"] == "numeric"
    assert cols["age"]["value_labels"] == {}


def test_sample_values_are_strings(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    for col in r.json()["columns"]:
        for v in col["sample_values"]:
            assert isinstance(v, str)


def test_response_includes_row_count(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    assert r.json()["row_count"] == 4


def test_categorical_sample_values_match_value_label_keys(client, sample_sav):
    with open(sample_sav, "rb") as f:
        r = client.post(
            "/api/file", files={"file": ("sample.sav", f, "application/octet-stream")}
        )
    cols = {c["name"]: c for c in r.json()["columns"]}
    q1 = cols["q1"]
    for v in q1["sample_values"]:
        assert v in q1["value_labels"], (
            f"sample value {v!r} is not a valid key "
            f"in value_labels {list(q1['value_labels'])}"
        )


def test_column_without_label_falls_back_to_name(client, sample_sav_no_labels):
    with open(sample_sav_no_labels, "rb") as f:
        r = client.post(
            "/api/file",
            files={"file": ("nolabels.sav", f, "application/octet-stream")},
        )
    assert r.status_code == 200
    cols = {c["name"]: c for c in r.json()["columns"]}
    assert cols["q1"]["label"] == "q1"
    assert cols["age"]["label"] == "age"


def test_non_sav_file_returns_422(client, tmp_path):
    bad = tmp_path / "bad.txt"
    bad.write_bytes(b"not a sav file")
    with open(bad, "rb") as f:
        r = client.post("/api/file", files={"file": ("bad.txt", f, "text/plain")})
    assert r.status_code == 422
