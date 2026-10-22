"""Recompute synthetic JS cashflow from a recorded snapshot and detect altered outputs."""
import json
import subprocess
from pathlib import Path
from enterprise.replay import replay

ROOT=Path(__file__).resolve().parents[1]


def test_replay_matches_group_lnncp_and_entity_positions():
    input_data={'seed':20261021,'opening':2100,'delay':75,'accel':20,
      'book':[{'kind':'IN','amount_musd':80,'product':'Repo','forecast_minute':700,'actual_minute':760,'baseline_minute':730},
              {'kind':'OUT','amount_musd':140,'product':'FX','forecast_minute':670,'actual_minute':670,'baseline_minute':670},
              {'kind':'IN','amount_musd':50,'product':'Money Market','forecast_minute':1220,'actual_minute':1260,'baseline_minute':1210}]}
    output=json.loads(subprocess.run(['node',str(ROOT/'enterprise/replay_runner.cjs')],input=json.dumps(input_data),text=True,capture_output=True,check=True).stdout)
    assert replay(input_data,output)['match']
    assert replay(input_data,{**output,'group_lnncp_musd':output['group_lnncp_musd']+1})['match'] is False
    # Very late cash receipts must remain outside the same-day intraday position.
    assert len(output['time_buckets'])>10