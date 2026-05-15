from decimal import Decimal
from .models import TransportPricingRule, calculate_transport_fee
from apps.common.constants import TRANSPORT_CONFIG

class TransportPricingService:
    @staticmethod
    def get_estimated_distance(origin_wilaya, origin_commune, dest_wilaya, dest_commune):
        """
        Geographic Haversine estimation between Wilaya centers.
        """
        if not origin_wilaya or not dest_wilaya:
            return TRANSPORT_CONFIG['BRACKETS']['DISTANT_WILAYA']

        from apps.common.constants import WILAYA_COORDS
        import math

        def haversine(lat1, lon1, lat2, lon2):
            R = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        # Try to find Wilaya IDs
        from apps.common.constants import ALGERIAN_WILAYAS
        def get_id(name):
            for wid, wname in ALGERIAN_WILAYAS:
                if str(name).lower() == wname.lower() or str(name) == wid:
                    return wid
            return None

        id1 = get_id(origin_wilaya)
        id2 = get_id(dest_wilaya)

        if id1 and id2 and id1 == id2:
             if origin_commune and dest_commune and str(origin_commune).lower() == str(dest_commune).lower():
                 return TRANSPORT_CONFIG['BRACKETS']['SAME_COMMUNE']
             return TRANSPORT_CONFIG['BRACKETS']['SAME_WILAYA']

        if id1 and id2 and id1 in WILAYA_COORDS and id2 in WILAYA_COORDS:
            c1 = WILAYA_COORDS[id1]
            c2 = WILAYA_COORDS[id2]
            direct = haversine(c1[0], c1[1], c2[0], c2[1])
            # Add 30% for road circuitry
            return round(direct * 1.3, 1)

        return TRANSPORT_CONFIG['BRACKETS']['DISTANT_WILAYA']

    @classmethod
    def estimate_order_transport(cls, farm_wilaya, farm_commune, dest_wilaya, dest_commune, total_quantity, distance=None):
        """
        Calculates transport cost for a single farmer order using the official pricing rules.
        """
        if distance is None:
            distance = cls.get_estimated_distance(farm_wilaya, farm_commune, dest_wilaya, dest_commune)
        
        # Default to 'truck' for general estimation unless specified otherwise
        pricing_result = calculate_transport_fee(
            distance=distance,
            weight_kg=total_quantity, # Quantity is treated as weight in this simple model
            vehicle_type='standard'
        )
        
        return {
            'total_transport': Decimal(str(pricing_result['total'])),
            'base_fee': Decimal(str(pricing_result['breakdown']['base'])),
            'distance_km': distance,
            'distance_cost': Decimal(str(pricing_result['breakdown']['distance'])),
            'quantity': total_quantity,
            'quantity_cost': Decimal(str(pricing_result['breakdown']['weight'])),
            'labels': {
                'distance_label': 'Intra-commune' if distance <= 15 else 'Regional' if distance <= 100 else 'Inter-Wilaya',
                'description': f"Estimated {distance}km routing ({pricing_result['rule_source']})"
            }
        }

