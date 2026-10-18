"""
Serializers for Route Analysis API.
"""
from datetime import datetime, timezone
from rest_framework import serializers


class RouteAnalysisRequestSerializer(serializers.Serializer):
    origin = serializers.CharField(
        required=True,
        max_length=255,
        help_text="Origin address, city/state, or lat,lng coordinates."
    )
    destination = serializers.CharField(
        required=True,
        max_length=255,
        help_text="Destination address, city/state, or lat,lng coordinates."
    )
    departure_time = serializers.DateTimeField(
        required=False,
        default=lambda: datetime.now(timezone.utc),
        help_text="ISO 8601 departure datetime (e.g. 2026-10-15T08:00:00Z)."
    )
    load_weight_lb = serializers.FloatField(
        required=True,
        min_value=0.0,
        max_value=120000.0,
        help_text="Gross truck load weight in pounds (lb)."
    )
    sampling_interval_miles = serializers.ChoiceField(
        choices=[10, 25, 50],
        default=25,
        required=False,
        help_text="Weather checkpoint sampling interval (10, 25, or 50 miles)."
    )

    def validate_load_weight_lb(self, value):
        if value < 0:
            raise serializers.ValidationError("Load weight cannot be negative.")
        return value
