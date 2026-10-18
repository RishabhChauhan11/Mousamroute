"""
Route Recommendation Service.

Evaluates and ranks candidate routes based on the 4-tier decision hierarchy:
1. Fewest No Travel & Severe miles
2. Fewest High miles
3. Lowest average risk score
4. Shortest travel times

Generates transparent metrics and justification for the winning recommendation.
"""
from typing import Dict, Any, List
from routing.services.risk_evaluator import RiskLevel


def format_duration(seconds: float) -> str:
    """Format seconds into 'X hrs Y mins'."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def aggregate_route_metrics(route: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes mileage totals per risk tier and weighted average risk score along a route.
    """
    checkpoints = route.get("checkpoints", [])
    total_dist = route.get("distance_miles", 0.0)

    no_travel_miles = 0.0
    severe_miles = 0.0
    high_miles = 0.0
    moderate_miles = 0.0
    low_miles = 0.0
    weighted_score_sum = 0.0

    load_rules_triggered = []

    for cp in checkpoints:
        seg_miles = cp.get("segment_miles", 0.0)
        risk_info = cp.get("risk", {})
        r_level = risk_info.get("overall_risk", RiskLevel.LOW)
        r_score = risk_info.get("risk_score", 1)

        weighted_score_sum += seg_miles * r_score

        if r_level == RiskLevel.NO_TRAVEL:
            no_travel_miles += seg_miles
        elif r_level == RiskLevel.SEVERE:
            severe_miles += seg_miles
        elif r_level == RiskLevel.HIGH:
            high_miles += seg_miles
        elif r_level == RiskLevel.MODERATE:
            moderate_miles += seg_miles
        else:
            low_miles += seg_miles

        if risk_info.get("load_rule_applied"):
            load_rules_triggered.append({
                "checkpoint_index": cp["index"],
                "distance_from_origin_miles": cp["distance_from_origin_miles"],
                "eta_formatted": cp["eta_formatted"],
                "rule_note": risk_info["load_rule_applied"],
            })

    total_sampled_miles = no_travel_miles + severe_miles + high_miles + moderate_miles + low_miles
    if total_sampled_miles > 0:
        avg_risk = weighted_score_sum / total_sampled_miles
    else:
        avg_risk = 1.0

    # Determine dominant risk rating
    if no_travel_miles > 0:
        dominant_risk = RiskLevel.NO_TRAVEL
    elif severe_miles > 0:
        dominant_risk = RiskLevel.SEVERE
    elif high_miles > 0:
        dominant_risk = RiskLevel.HIGH
    elif moderate_miles > 0:
        dominant_risk = RiskLevel.MODERATE
    else:
        dominant_risk = RiskLevel.LOW

    return {
        "no_travel_miles": round(no_travel_miles, 1),
        "severe_miles": round(severe_miles, 1),
        "critical_miles": round(no_travel_miles + severe_miles, 1),
        "high_miles": round(high_miles, 1),
        "moderate_miles": round(moderate_miles, 1),
        "low_miles": round(low_miles, 1),
        "average_risk_score": round(avg_risk, 2),
        "dominant_risk": dominant_risk,
        "load_rules_triggered": load_rules_triggered,
        "load_rules_count": len(load_rules_triggered),
    }


def generate_recommendation_rationale(
    recommended: Dict[str, Any], alternatives: List[Dict[str, Any]]
) -> str:
    """
    Constructs an explicit, human-readable justification for the recommended route.
    """
    reasons = []

    r_crit = recommended["metrics"]["critical_miles"]
    r_high = recommended["metrics"]["high_miles"]
    r_avg = recommended["metrics"]["average_risk_score"]
    r_time = recommended["duration_formatted"]

    # Check comparison with alternatives
    alt_crit_max = max((a["metrics"]["critical_miles"] for a in alternatives), default=0.0)
    alt_high_max = max((a["metrics"]["high_miles"] for a in alternatives), default=0.0)

    if r_crit == 0 and alt_crit_max > 0:
        reasons.append(f"Safely avoids all Severe/No-Travel conditions (alternatives face up to {alt_crit_max} miles)")
    elif r_crit < alt_crit_max:
        reasons.append(f"Minimizes Severe weather exposure to {r_crit} miles (vs {alt_crit_max} miles)")
    else:
        reasons.append(f"Zero severe weather hazards along route ({r_crit} miles)")

    if r_high < alt_high_max:
        reasons.append(f"Lowest high-risk exposure ({r_high} mi vs {alt_high_max} mi)")

    reasons.append(f"Lowest average corridor risk score of {r_avg:.2f}/5.0")
    reasons.append(f"Estimated transit time: {r_time}")

    return " | ".join(reasons)


def rank_and_recommend_routes(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ranks routes according to PDF specification:
      1. Fewest Severe miles (and No Travel miles)
      2. Fewest High miles
      3. Lowest average risk
      4. Shortest travel times
    """
    processed_routes = []

    for r in routes:
        metrics = aggregate_route_metrics(r)
        dur_sec = r.get("duration_seconds", 0)
        formatted_r = {
            **r,
            "metrics": metrics,
            "duration_formatted": format_duration(dur_sec),
            "is_recommended": False,
            "rank": 0,
            "recommendation_rationale": "",
        }
        processed_routes.append(formatted_r)

    # Sort key: (no_travel_miles, severe_miles, high_miles, average_risk_score, duration_seconds)
    processed_routes.sort(
        key=lambda x: (
            x["metrics"]["no_travel_miles"],
            x["metrics"]["severe_miles"],
            x["metrics"]["high_miles"],
            x["metrics"]["average_risk_score"],
            x["duration_seconds"],
        )
    )

    # Assign ranks and mark #1 as recommended
    for i, r in enumerate(processed_routes):
        r["rank"] = i + 1
        if i == 0:
            r["is_recommended"] = True
            alternatives = processed_routes[1:]
            r["recommendation_rationale"] = generate_recommendation_rationale(r, alternatives)
        else:
            r["recommendation_rationale"] = (
                f"Rank #{i + 1} — Higher risk exposure: "
                f"{r['metrics']['severe_miles']} mi Severe, {r['metrics']['high_miles']} mi High risk."
            )

    return processed_routes
