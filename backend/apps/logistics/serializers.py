from rest_framework import serializers
from .models import DeliveryRequest
from apps.orders.models import Order, OrderItem

class TransporterVisibilityMixin:
    def _is_visible_to_buyer(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        # Must be the buyer of the order
        if obj.order.buyer != request.user:
            return False
        # Status must be accepted or beyond
        return obj.status in ['assigned', 'picked_up', 'in_transit', 'delivered']

    def get_transporter_name(self, obj):
        if self._is_visible_to_buyer(obj) and obj.transporter:
            name = obj.transporter.full_name or obj.transporter.email
            parts = name.split()
            if len(parts) >= 2:
                # Format: First name + last initial only (e.g. "Djalil B.")
                return f"{parts[0]} {parts[-1][0]}."
            return name
        return None

    def get_transporter_phone(self, obj):
        if self._is_visible_to_buyer(obj) and obj.transporter:
            return obj.transporter.phone
        return None

    def get_vehicle_type(self, obj):
        if self._is_visible_to_buyer(obj):
            v_type = obj.assigned_vehicle_info.get('type')
            if not v_type and obj.transporter and hasattr(obj.transporter, 'transporterprofile'):
                v_type = obj.transporter.transporterprofile.vehicle_type
            return v_type
        return None

    def get_plate_number_masked(self, obj):
        if self._is_visible_to_buyer(obj):
            plate = obj.assigned_vehicle_info.get('plate')
            if not plate and obj.transporter and hasattr(obj.transporter, 'transporterprofile'):
                plate = obj.transporter.transporterprofile.plate_number
            if plate:
                if len(plate) > 3:
                    return f"{plate[:3]}***"
                return "***"
        return None

class MissionOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_unit = serializers.SerializerMethodField()
    product_quality = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_unit', 'product_quality', 'quantity', 'farm_name']

    def get_product_name(self, obj):
        return obj.product.title if obj.product else "Deleted Product"

    def get_product_unit(self, obj):
        return obj.product.unit if obj.product else "units"

    def get_product_quality(self, obj):
        return getattr(obj.product, 'quality', 'Standard') if obj.product else "Standard"

    def get_farm_name(self, obj):
        if obj.product and obj.product.farm:
            return obj.product.farm.name
        return "Unknown Farm"

class MissionOrderSerializer(serializers.ModelSerializer):
    items = MissionOrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    buyer_phone = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'items', 'buyer_name', 'buyer_phone', 'delivery_address', 'wilaya', 'refusal_reason', 'refusal_note']

    def get_buyer_phone(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
            
        delivery_request = getattr(obj, 'delivery_request', None)
        if delivery_request and delivery_request.transporter == request.user:
            return obj.buyer_phone
        return None

class DeliveryRequestSerializer(TransporterVisibilityMixin, serializers.ModelSerializer):
    order_detail = MissionOrderSerializer(source='order', read_only=True)
    transporter_name = serializers.SerializerMethodField()
    transporter_phone = serializers.SerializerMethodField()
    vehicle_type = serializers.SerializerMethodField()
    plate_number_masked = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'order', 'order_detail', 'transporter', 'status', 
            'pickup_location', 'pickup_wilaya', 'delivery_location', 'preferred_delivery_date', 
            'notes', 'vehicle_size', 'created_at', 'updated_at',
            'total_quantity', 'assigned_vehicle_id', 'assigned_vehicle_info',
            'pod_photo', 'pod_recipient_name', 'pod_notes', 'pod_completed_at',
            'transporter_name', 'transporter_phone', 'vehicle_type', 'plate_number_masked'
        ]
        read_only_fields = ('created_at', 'updated_at', 'transporter', 'pod_completed_at', 'total_quantity')

class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['picked_up', 'in_transit', 'delivered', 'cancelled'])

class ProofOfDeliverySerializer(serializers.Serializer):
    pod_recipient_name = serializers.CharField(max_length=100, required=True)
    pod_notes = serializers.CharField(required=False, allow_blank=True)
    pod_photo = serializers.ImageField(required=False, allow_null=True)

class DeliveryRequestPoDSerializer(TransporterVisibilityMixin, serializers.ModelSerializer):
    """
    Simplified version of DeliveryRequest for nesting inside Orders.
    Prevents recursion and only exposes fields needed by Farmer/Buyer.
    """
    transporter_name = serializers.SerializerMethodField()
    transporter_phone = serializers.SerializerMethodField()
    vehicle_type = serializers.SerializerMethodField()
    plate_number_masked = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryRequest
        fields = [
            'id', 'status', 'pod_photo', 'pod_recipient_name', 
            'pod_notes', 'pod_completed_at',
            'transporter_name', 'transporter_phone', 'vehicle_type', 'plate_number_masked'
        ]
        read_only_fields = fields


# ── Vehicle Serializer ──────────────────────────────────────────────────
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'owner_name', 'owner_email',
            'plate', 'model', 'capacity', 'type', 'fuelType',
            'is_active', 'carte_grise',
            'status', 'rejection_reason', 'reviewed_at', 'reviewed_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = (
            'owner', 'status', 'rejection_reason',
            'reviewed_at', 'reviewed_by', 'created_at', 'updated_at',
        )

