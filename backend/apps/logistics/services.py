from decimal import Decimal
from apps.common.constants import TRANSPORT_CONFIG

class TransportPricingService:
    @staticmethod
    def get_estimated_distance(origin_wilaya, origin_commune, dest_wilaya, dest_commune):
        """
        Simple bracket-based distance estimation.
        Returns distance in KM.
        """
        if not origin_wilaya or not dest_wilaya:
            return TRANSPORT_CONFIG['BRACKETS']['DISTANT_WILAYA']

        if origin_wilaya == dest_wilaya:
            if origin_commune and dest_commune and origin_commune.lower() == dest_commune.lower():
                return TRANSPORT_CONFIG['BRACKETS']['SAME_COMMUNE']
            return TRANSPORT_CONFIG['BRACKETS']['SAME_WILAYA']
        
        # Simple neighbor detection (Mock logic for demo: shared first char or proximity in list)
        # In a real app, this would use a neighbor map.
        try:
            w1 = int(origin_wilaya)
            w2 = int(dest_wilaya)
            if abs(w1 - w2) <= 3: # Mock neighbor proximity
                return TRANSPORT_CONFIG['BRACKETS']['NEIGHBOR_WILAYA']
        except ValueError:
            pass

        return TRANSPORT_CONFIG['BRACKETS']['DISTANT_WILAYA']

    @classmethod
    def estimate_order_transport(cls, farm_wilaya, farm_commune, dest_wilaya, dest_commune, total_quantity):
        """
        Calculates transport cost for a single farmer order.
        Formula: Base + (Dist * KmRate) + (Qty * QtyRate)
        """
        distance = cls.get_estimated_distance(farm_wilaya, farm_commune, dest_wilaya, dest_commune)
        
        base_fee = Decimal(str(TRANSPORT_CONFIG['BASE_FEE']))
        km_rate = Decimal(str(TRANSPORT_CONFIG['KM_RATE']))
        qty_rate = Decimal(str(TRANSPORT_CONFIG['QUANTITY_RATE']))
        
        distance_cost = Decimal(str(distance)) * km_rate
        quantity_cost = Decimal(str(total_quantity)) * qty_rate
        
        total_transport = base_fee + distance_cost + quantity_cost
        
        return {
            'total_transport': total_transport,
            'base_fee': base_fee,
            'distance_km': distance,
            'distance_cost': distance_cost,
            'quantity': total_quantity,
            'quantity_cost': quantity_cost,
            'labels': {
                'distance_label': 'Intra-commune' if distance <= 5 else 'Regional' if distance <= 30 else 'National',
                'description': f"Estimated {distance}km routing from {farm_wilaya} to {dest_wilaya}"
            }
        }
