from django.db import models
from apps.farms.models import Farm


class SensorReading(models.Model):
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='sensor_readings'
    )
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    soil_moisture = models.FloatField(null=True, blank=True)
    rain_status = models.CharField(max_length=20, null=True, blank=True)
    ir_status = models.CharField(max_length=20, null=True, blank=True)
    sound_status = models.CharField(max_length=20, null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"SensorReading #{self.pk} — {self.farm.name} @ {self.recorded_at:%Y-%m-%d %H:%M}"


class AlertHistory(models.Model):
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='alert_history'
    )
    sensor = models.CharField(max_length=50)
    message = models.CharField(max_length=200)
    level = models.CharField(max_length=20)  # danger / warning / info
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-triggered_at']

    def __str__(self):
        return f"[{self.level.upper()}] {self.sensor} — {self.farm.name} @ {self.triggered_at:%Y-%m-%d %H:%M}"
