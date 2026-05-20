
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import re

path = r'c:\Users\USER\project\frontend\src\pages\farmer\OrderList.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # Top level headers and filters
    ('Global Registry', 'Orders'),
    ('Transaction Registry', 'My Orders'),
    ('Scan registry by ID or Buyer Alias...', 'Search by Order ID or Buyer Name...'),
    ('All Log', 'All'),
    ('Completed', 'Delivered'),
    ('Fetching Ledger...', 'Loading orders...'),
    ('Open Complete Registry', 'View All Orders'),

    # Table headers
    ('Ref Code', 'Order ID'),
    ('Buyer Identity', 'Buyer Name'),
    ('Value', 'Total'),
    ('Time', 'Date'),
    ('Op', 'Actions'),

    # Expanded details headers
    ('Payload Schema', 'Order Items'),
    ('Vector Intel & Economy', 'Delivery & Totals'),
    ('Comm Link:', 'Phone:'),
    ('Destination:', 'Delivery Address:'),
    ('Economic Breakdown', 'Order Totals'),
    ('Merchandise Subtotal', 'Subtotal'),
    ('Transport Logistics', 'Transport Fee'),
    ('Gross Total', 'Total'),
    ('Deploy Transporter', 'Request Delivery'),
    ('Logistics Linked', 'Delivery Requested'),
    ('Refusal Intelligence', 'Refusal Reason'),
    ('Primary Discrepancy', 'Reason'),
    ('Field Observations', 'Note'),
    ('Logged At:', 'Refused On:'),
    ('Finalized At:', 'Returned On:'),
    ('POD Handover Log', 'Proof of Delivery'),
    ('Signatory:', 'Signed By:'),
    ('Encountered Anomaly?', 'Have a problem?'),
    ('Grievance API', 'File Complaint'),
    ('Node Status', 'Status'),
    ('Target Routing', 'Delivery Address'),
    ('Gross Yield', 'Total Amount')
]

for old, new in replacements:
    if old in c:
        c = c.replace(old, new)
        print(f"OK: {old}")
    else:
        print(f"MISS: {old}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated OrderList.js")
