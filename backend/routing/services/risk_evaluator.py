"""
Risk Evaluation Service.

Calculates weather risk levels based on:
1. Base weather conditions (Wind, Rain, Snow)
2. Truck load weight rules (Wind stability modifiers)
3. Maximum composite risk aggregation
"""
from typing import Dict, Any, List, Tuple


class RiskLevel:
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    SEVERE = "Severe"
    NO_TRAVEL = "No Travel"

    ORDER = [LOW, MODERATE, HIGH, SEVERE, NO_TRAVEL]
    SCORES = {
        LOW: 1,
        MODERATE: 2,
        HIGH: 3,
        SEVERE: 4,
        NO_TRAVEL: 5,
    }


def classify_wind(wind_mph: float) -> str:
    """
    Classify wind speed in mph based on base risk table:
      < 25 mph: Low
      25 - 34 mph: Moderate
      35 - 44 mph: High
      45 - 54 mph: Severe
      >= 55 mph: No Travel
    """
    if wind_mph < 25.0:
        return RiskLevel.LOW
    elif wind_mph < 35.0:
        return RiskLevel.MODERATE
    elif wind_mph < 45.0:
        return RiskLevel.HIGH
    elif wind_mph < 55.0:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def classify_rain(rain_in_hr: float) -> str:
    """
    Classify rain in inches per hour:
      < 0.10 in/hr: Low
      0.10 - 0.25 in/hr: Moderate
      0.25 - 0.50 in/hr: High
      0.50 - 1.00 in/hr: Severe
      > 1.00 in/hr: No Travel
    """
    if rain_in_hr < 0.10:
        return RiskLevel.LOW
    elif rain_in_hr <= 0.25:
        return RiskLevel.MODERATE
    elif rain_in_hr <= 0.50:
        return RiskLevel.HIGH
    elif rain_in_hr <= 1.00:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def classify_snow(snow_in_hr: float) -> str:
    """
    Classify snowfall in inches per hour:
      < 0.5 in/hr: Low
      0.5 - 1.0 in/hr: Moderate
      1.0 - 2.0 in/hr: High
      2.0 - 3.0 in/hr: Severe
      > 3.0 in/hr: No Travel
    """
    if snow_in_hr < 0.50:
        return RiskLevel.LOW
    elif snow_in_hr <= 1.00:
        return RiskLevel.MODERATE
    elif snow_in_hr <= 2.00:
        return RiskLevel.HIGH
    elif snow_in_hr <= 3.00:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def apply_load_rules(wind_mph: float, load_weight_lb: float) -> Tuple[str, str | None]:
    """
    Apply load weight stability rules:
    - >= 55 mph -> No Travel for any load
    - 45 - 54 mph + > 30,000 lb -> No Travel (elevated from Severe)
    - 35 - 44 mph + > 40,000 lb -> Severe (elevated from High)
    """
    base_wind_risk = classify_wind(wind_mph)
    rule_note = None

    if wind_mph >= 55.0:
        return RiskLevel.NO_TRAVEL, "Wind >= 55 mph: No Travel for any load"

    if 45.0 <= wind_mph < 55.0 and load_weight_lb > 30000:
        return (
            RiskLevel.NO_TRAVEL,
            f"Wind {wind_mph:.1f} mph with > 30,000 lb load ({load_weight_lb:,.0f} lb) elevates risk to No Travel",
        )

    if 35.0 <= wind_mph < 45.0 and load_weight_lb > 40000:
        return (
            RiskLevel.SEVERE,
            f"Wind {wind_mph:.1f} mph with > 40,000 lb load ({load_weight_lb:,.0f} lb) elevates risk to Severe",
        )

    return base_wind_risk, rule_note


def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight_lb: float,
) -> Dict[str, Any]:
    """
    Evaluate comprehensive risk for a single checkpoint.
    Takes the maximum risk level across adjusted wind, rain, and snow.
    """
    base_wind_risk = classify_wind(wind_mph)
    adjusted_wind_risk, load_rule_note = apply_load_rules(wind_mph, load_weight_lb)
    rain_risk = classify_rain(rain_in_hr)
    snow_risk = classify_snow(snow_in_hr)

    risks = [
        ("Wind", adjusted_wind_risk, f"Wind {wind_mph:.1f} mph"),
        ("Rain", rain_risk, f"Rain {rain_in_hr:.2f} in/hr"),
        ("Snow", snow_risk, f"Snow {snow_in_hr:.2f} in/hr"),
    ]

    # Find highest risk level
    max_risk = RiskLevel.LOW
    max_score = 1
    hazard_reasons = []

    for hazard_name, r_level, details in risks:
        score = RiskLevel.SCORES[r_level]
        if score > max_score:
            max_score = score
            max_risk = r_level

        if score >= RiskLevel.SCORES[RiskLevel.HIGH]:
            hazard_reasons.append(f"{hazard_name}: {details} ({r_level})")

    if load_rule_note:
        hazard_reasons.append(f"Load Rule Applied: {load_rule_note}")

    return {
        "overall_risk": max_risk,
        "risk_score": max_score,
        "wind_mph": round(wind_mph, 1),
        "rain_in_hr": round(rain_in_hr, 3),
        "snow_in_hr": round(snow_in_hr, 3),
        "base_wind_risk": base_wind_risk,
        "adjusted_wind_risk": adjusted_wind_risk,
        "rain_risk": rain_risk,
        "snow_risk": snow_risk,
        "load_rule_applied": load_rule_note,
        "hazard_reasons": hazard_reasons,
    }
