
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import re

path = r'c:\Users\USER\project\frontend\src\pages\complaints\ComplaintFormPage.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # Success State
    ('bg-[#22543d]', 'bg-indigo-600'),
    ('hover:bg-[#1a402e]', 'hover:bg-indigo-700'),
    ('text-[#22543d]', 'text-indigo-600'),
    ('hover:text-[#1a402e]', 'hover:text-indigo-800'),
    ('bg-emerald-50 text-emerald-500', 'bg-indigo-50 text-indigo-500'),
    ('border-emerald-100', 'border-indigo-100'),
    ('rgba(34,84,61,0.08)', 'rgba(79,70,229,0.08)'),
    ('rgba(34,84,61,0.3)', 'rgba(79,70,229,0.3)'),
    ('Incident Report Filed', 'Complaint Submitted'),
    ('Your grievance network protocol has been submitted. Our administrative team will review your ticket and update you in the Complaints Center.', 
     'Your complaint has been successfully submitted. Our team will review the details and update you soon.'),
    ('Return Previous', 'Go Back'),
    ('Open Complaints', 'View Complaints'),
    
    # Header
    ('<Link to={`/farmer/orders`}', '<button onClick={() => navigate(-1)}'),
    ('Back to Orders</Link>', 'Go Back</button>'),
    ("onClick={() => navigate('/farmer-dashboard')}", "onClick={() => navigate('/profile')}"),
    ('Back to Dashboard', 'Dashboard'),
    ('File New Report', 'New Complaint'),
    ('text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3', 'text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-2'),
    ('Log Global Incident', 'Submit a Complaint'),
    ('Provide detailed intelligence regarding the operational failure, financial discrepancy, or behavioral misconduct.', 
     'Please provide the details of your issue so we can help resolve it.'),
     
    # Form Jargon
    ('Primary Concern Class', 'Complaint Category'),
    ('Select Grievance Classification...', 'Select Category...'),
    ('Detailed Situation Report', 'Description'),
    ('Describe the exact sequence of events, personnel involved, and desired resolution...', 
     'Please describe your issue in detail...'),
    ('Attach Corroborating Evidence', 'Attach Evidence (Optional)'),
    ('Transmit Official Report', 'Submit Complaint'),
    ('Validating...', 'Submitting...'),
    ('System Processing Error', 'Submission Failed')
]

for old, new in replacements:
    if old in c:
        c = c.replace(old, new)
        print(f"OK: {old[:50]}")
    else:
        print(f"MISS: {old[:50]}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated ComplaintFormPage.js")
