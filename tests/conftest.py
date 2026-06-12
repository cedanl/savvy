import pandas as pd
import pyreadstat
import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)



@pytest.fixture
def sample_sav_no_labels(tmp_path):
    """Columns with no column_labels set — as seen in real-world .sav files."""
    df = pd.DataFrame({
        "q1": [1.0, 2.0, 1.0, 3.0],
        "age": [25.0, 34.0, 28.0, 45.0],
    })
    filepath = tmp_path / "nolabels.sav"
    pyreadstat.write_sav(df, str(filepath))
    return filepath


@pytest.fixture
def sample_sav(tmp_path):
    df = pd.DataFrame({
        "q1": [1.0, 2.0, 1.0, 3.0],
        "q2": [2.0, 1.0, 2.0, 1.0],
        "age": [25.0, 34.0, 28.0, 45.0],
    })
    filepath = tmp_path / "sample.sav"
    pyreadstat.write_sav(
        df,
        str(filepath),
        column_labels={
            "q1": "Overall satisfaction", "q2": "Would recommend", "age": "Age"
        },
        variable_value_labels={
            "q1": {1: "Very satisfied", 2: "Satisfied", 3: "Dissatisfied"},
            "q2": {1: "Yes", 2: "No"},
        },
    )
    return filepath
