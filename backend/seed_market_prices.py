"""
Seed script to populate initial market intelligence data.
Run: python manage.py shell < seed_market_prices.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.market_intelligence.models import MarketPrice, MarketPriceHistory
from apps.accounts.models import User

admin = User.objects.filter(role='admin').first()

MARKET_DATA = [
    # Vegetables
    {"product_name": "Tomato", "category": "VEGETABLES", "current_price": 120, "previous_price": 105, "unit": "KG", "trend": "INCREASING", "is_highlighted": True, "highlight_message": "Tomato prices increased by 15% due to seasonal demand", "market_note": "High demand expected this week"},
    {"product_name": "Potato", "category": "VEGETABLES", "current_price": 75, "previous_price": 85, "unit": "KG", "trend": "DECREASING", "is_highlighted": True, "highlight_message": "Low potato supply expected this week due to heatwave", "market_note": "Heatwave may affect potato supply"},
    {"product_name": "Onion", "category": "VEGETABLES", "current_price": 90, "previous_price": 90, "unit": "KG", "trend": "STABLE", "market_note": "Stable supply from Mascara region"},
    {"product_name": "Pepper", "category": "VEGETABLES", "current_price": 200, "previous_price": 180, "unit": "KG", "trend": "INCREASING", "market_note": "Greenhouse production stable"},
    {"product_name": "Carrot", "category": "VEGETABLES", "current_price": 65, "previous_price": 70, "unit": "KG", "trend": "DECREASING", "market_note": "Good harvest season"},
    {"product_name": "Zucchini", "category": "VEGETABLES", "current_price": 80, "previous_price": 80, "unit": "KG", "trend": "STABLE"},
    {"product_name": "Lettuce", "category": "VEGETABLES", "current_price": 110, "previous_price": 95, "unit": "KG", "trend": "INCREASING", "market_note": "Summer demand surge"},
    {"product_name": "Eggplant", "category": "VEGETABLES", "current_price": 95, "previous_price": 100, "unit": "KG", "trend": "DECREASING"},
    # Fruits
    {"product_name": "Orange", "category": "FRUITS", "current_price": 150, "previous_price": 140, "unit": "KG", "trend": "INCREASING", "market_note": "Blida region harvest ongoing"},
    {"product_name": "Apple", "category": "FRUITS", "current_price": 250, "previous_price": 250, "unit": "KG", "trend": "STABLE"},
    {"product_name": "Watermelon", "category": "FRUITS", "current_price": 40, "previous_price": 55, "unit": "KG", "trend": "DECREASING", "market_note": "Peak season — prices dropping"},
    {"product_name": "Banana", "category": "FRUITS", "current_price": 300, "previous_price": 280, "unit": "KG", "trend": "INCREASING", "is_highlighted": True, "highlight_message": "Import prices rising due to currency fluctuation"},
    # Cereals
    {"product_name": "Wheat", "category": "CEREALS", "current_price": 5500, "previous_price": 5500, "unit": "Quintal", "trend": "STABLE", "market_note": "Government-regulated price"},
    {"product_name": "Barley", "category": "CEREALS", "current_price": 4200, "previous_price": 4000, "unit": "Quintal", "trend": "INCREASING"},
    # Legumes
    {"product_name": "Chickpea", "category": "LEGUMES", "current_price": 320, "previous_price": 300, "unit": "KG", "trend": "INCREASING"},
    {"product_name": "Lentil", "category": "LEGUMES", "current_price": 280, "previous_price": 290, "unit": "KG", "trend": "DECREASING"},
]

created = 0
for data in MARKET_DATA:
    mp, was_created = MarketPrice.objects.get_or_create(
        product_name=data['product_name'],
        defaults={**data, 'updated_by': admin}
    )
    if was_created:
        MarketPriceHistory.objects.create(market_price=mp, price=mp.current_price, recorded_by=admin)
        if mp.previous_price:
            MarketPriceHistory.objects.create(market_price=mp, price=mp.previous_price, recorded_by=admin)
        created += 1

print(f"✅ Market Intelligence: {created} prices seeded ({MarketPrice.objects.count()} total)")
