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
