"""
Unit tests for Risk Evaluator.
"""
import pytest
from routing.services.risk_evaluator import (
    RiskLevel,
    classify_wind,
    classify_rain,
    classify_snow,
    apply_load_rules,
    evaluate_checkpoint_risk,
)


class TestRiskEvaluator:
    def test_wind_classification(self):
        assert classify_wind(15.0) == RiskLevel.LOW
        assert classify_wind(24.9) == RiskLevel.LOW
        assert classify_wind(25.0) == RiskLevel.MODERATE
        assert classify_wind(34.9) == RiskLevel.MODERATE
        assert classify_wind(35.0) == RiskLevel.HIGH
        assert classify_wind(44.9) == RiskLevel.HIGH
        assert classify_wind(45.0) == RiskLevel.SEVERE
        assert classify_wind(54.9) == RiskLevel.SEVERE
        assert classify_wind(55.0) == RiskLevel.NO_TRAVEL
        assert classify_wind(65.0) == RiskLevel.NO_TRAVEL

    def test_rain_classification(self):
        assert classify_rain(0.05) == RiskLevel.LOW
        assert classify_rain(0.09) == RiskLevel.LOW
        assert classify_rain(0.10) == RiskLevel.MODERATE
        assert classify_rain(0.25) == RiskLevel.MODERATE
        assert classify_rain(0.26) == RiskLevel.HIGH
        assert classify_rain(0.50) == RiskLevel.HIGH
        assert classify_rain(0.51) == RiskLevel.SEVERE
        assert classify_rain(1.00) == RiskLevel.SEVERE
        assert classify_rain(1.05) == RiskLevel.NO_TRAVEL

    def test_snow_classification(self):
        assert classify_snow(0.2) == RiskLevel.LOW
        assert classify_snow(0.49) == RiskLevel.LOW
        assert classify_snow(0.50) == RiskLevel.MODERATE
        assert classify_snow(1.00) == RiskLevel.MODERATE
        assert classify_snow(1.10) == RiskLevel.HIGH
        assert classify_snow(2.00) == RiskLevel.HIGH
        assert classify_snow(2.10) == RiskLevel.SEVERE
        assert classify_snow(3.00) == RiskLevel.SEVERE
        assert classify_snow(3.10) == RiskLevel.NO_TRAVEL

    def test_load_rule_extreme_wind(self):
        # >= 55 mph -> No Travel for ANY load
        risk, note = apply_load_rules(wind_mph=56.0, load_weight_lb=10000)
        assert risk == RiskLevel.NO_TRAVEL
        assert "Wind >= 55 mph" in note

        risk, note = apply_load_rules(wind_mph=55.0, load_weight_lb=45000)
        assert risk == RiskLevel.NO_TRAVEL

    def test_load_rule_heavy_wind_and_weight(self):
        # 45-54 mph + >30,000 lb -> No Travel
        risk_elevated, note = apply_load_rules(wind_mph=48.0, load_weight_lb=35000)
        assert risk_elevated == RiskLevel.NO_TRAVEL
        assert "elevates risk to No Travel" in note

        # 45-54 mph with <= 30,000 lb -> Stays Severe
        risk_normal, note = apply_load_rules(wind_mph=48.0, load_weight_lb=25000)
        assert risk_normal == RiskLevel.SEVERE
        assert note is None

    def test_load_rule_moderate_high_wind_and_heavy_load(self):
        # 35-44 mph + >40,000 lb -> Severe
        risk_elevated, note = apply_load_rules(wind_mph=38.0, load_weight_lb=45000)
        assert risk_elevated == RiskLevel.SEVERE
        assert "elevates risk to Severe" in note

        # 35-44 mph with <= 40,000 lb -> Stays High
        risk_normal, note = apply_load_rules(wind_mph=38.0, load_weight_lb=35000)
        assert risk_normal == RiskLevel.HIGH
        assert note is None

    def test_evaluate_checkpoint_composite_risk(self):
        # Snow is high, wind is low -> overall is High
        res = evaluate_checkpoint_risk(
            wind_mph=10.0,
            rain_in_hr=0.0,
            snow_in_hr=1.5,
            load_weight_lb=20000,
        )
        assert res["overall_risk"] == RiskLevel.HIGH
        assert res["risk_score"] == 3
        assert res["snow_risk"] == RiskLevel.HIGH

        # High wind + load weight > 40k promotes to Severe
        res2 = evaluate_checkpoint_risk(
            wind_mph=40.0,
            rain_in_hr=0.0,
            snow_in_hr=0.0,
            load_weight_lb=45000,
        )
        assert res2["overall_risk"] == RiskLevel.SEVERE
        assert res2["load_rule_applied"] is not None
