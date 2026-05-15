# Algeria Wilayas (58)
ALGERIAN_WILAYAS = [
    ("1", "Adrar"), ("2", "Chlef"), ("3", "Laghouat"), ("4", "Oum El Bouaghi"),
    ("5", "Batna"), ("6", "Béjaïa"), ("7", "Biskra"), ("8", "Béchar"),
    ("9", "Blida"), ("10", "Bouira"), ("11", "Tamanrasset"), ("12", "Tébessa"),
    ("13", "Tlemcen"), ("14", "Tiaret"), ("15", "Tizi Ouzou"), ("16", "Alger"),
    ("17", "Djelfa"), ("18", "Jijel"), ("19", "Sétif"), ("20", "Saïda"),
    ("21", "Skikda"), ("22", "Sidi Bel Abbès"), ("23", "Annaba"), ("24", "Guelma"),
    ("25", "Constantine"), ("26", "Médéa"), ("27", "Mostaganem"), ("28", "M'Sila"),
    ("29", "Mascara"), ("30", "Ouargla"), ("31", "Oran"), ("32", "El Bayadh"),
    ("33", "Illizi"), ("34", "Bordj Bou Arreridj"), ("35", "Boumerdès"), ("36", "El Tarf"),
    ("37", "Tindouf"), ("38", "Tissemsilt"), ("39", "El Oued"), ("40", "Khenchela"),
    ("41", "Souk Ahras"), ("42", "Tipaza"), ("43", "Mila"), ("44", "Aïn Defla"),
    ("45", "Naâma"), ("46", "Aïn Témouchent"), ("47", "Ghardaïa"), ("48", "Relizane"),
    ("49", "El M'Ghair"), ("50", "El Meniaa"), ("51", "Ouled Djellal"), ("52", "Bordj Baji Mokhtar"),
    ("53", "Béni Abbès"), ("54", "Timimoun"), ("55", "Touggourt"), ("56", "Djanet"),
    ("57", "In Salah"), ("58", "In Guezzam")
]

def get_wilaya_name(value):
    """
    Normalizes a wilaya value (ID or Name) to the standard Name.
    Example: '17' -> 'Djelfa', 'djelfa' -> 'Djelfa', 'Djelfa' -> 'Djelfa'
    """
    if not value:
        return ""
    
    val_str = str(value).strip()
    
    # 1. Check if it's an ID
    for w_id, w_name in ALGERIAN_WILAYAS:
        if val_str == w_id:
            return w_name
            
    # 2. Check if it's a name (case-insensitive)
    val_lower = val_str.lower()
    for w_id, w_name in ALGERIAN_WILAYAS:
        if val_lower == w_name.lower():
            return w_name
            
    return val_str # Fallback to original string if no match found

# Simple Map for Distance Estimation (Mock proximity)
# This will be used in the service to determine distance brackets if no exact coordinates are available.
# Format: { (WilayaID_Origin, WilayaID_Dest): DistanceClass }
# For this version, we will use a logic-based comparison:
# Same Wilaya = Proximity Code 0
# Neighbor (Mock logic) = Proximity Code 1
# Distant = Proximity Code 2

# Pricing Defaults
TRANSPORT_CONFIG = {
    'BASE_FEE': 500.0,
    'KM_RATE': 15.0,
    'QUANTITY_RATE': 5.0,  # DZD per unit/kg
    'BRACKETS': {
        'SAME_COMMUNE': 5,
        'SAME_WILAYA': 30,
        'NEIGHBOR_WILAYA': 120,
        'DISTANT_WILAYA': 350
    }
}

# Approximate GPS center coordinates for each Algerian wilaya
# Used for auto-populating delivery route coordinates when exact GPS is unavailable
WILAYA_COORDS = {
    '1': (27.87, -0.29), '2': (36.16, 1.33), '3': (33.8, 2.88),
    '4': (35.87, 7.11), '5': (35.56, 6.17), '6': (36.76, 5.08),
    '7': (34.85, 5.73), '8': (31.62, -2.22), '9': (36.47, 2.83),
    '10': (36.38, 3.9), '11': (22.79, 5.53), '12': (35.4, 8.12),
    '13': (34.88, -1.31), '14': (35.37, 1.32), '15': (36.71, 4.05),
    '16': (36.75, 3.06), '17': (34.67, 3.25), '18': (36.82, 5.77),
    '19': (36.19, 5.41), '20': (34.83, 0.15), '21': (36.87, 6.91),
    '22': (35.19, -0.63), '23': (36.9, 7.77), '24': (36.46, 7.43),
    '25': (36.37, 6.61), '26': (36.26, 2.75), '27': (35.93, 0.09),
    '28': (35.7, 4.54), '29': (35.4, 0.14), '30': (31.95, 5.33),
    '31': (35.7, -0.63), '32': (33.68, 1.0), '33': (26.51, 8.48),
    '34': (36.07, 4.76), '35': (36.77, 3.47), '36': (36.77, 8.31),
    '37': (27.67, -8.15), '38': (35.6, 1.81), '39': (33.37, 6.86),
    '40': (35.43, 7.14), '41': (36.29, 7.95), '42': (36.59, 2.45),
    '43': (36.45, 6.26), '44': (36.26, 1.97), '45': (33.27, -0.31),
    '46': (35.3, -1.14), '47': (32.49, 3.67), '48': (35.74, 0.56),
    '49': (33.53, 5.93), '50': (30.58, 2.88), '51': (34.43, 5.07),
    '52': (21.33, 0.95), '53': (30.13, -2.17), '54': (29.26, 0.23),
    '55': (33.1, 6.07), '56': (24.55, 9.48), '57': (27.19, 2.47),
    '58': (19.57, 5.77),
}
