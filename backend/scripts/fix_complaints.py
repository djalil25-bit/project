
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

import re

path = r'c:\Users\USER\project\frontend\src\pages\complaints\UserComplaints.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # Header area
    ('<Link to="/farmer-dashboard" className="hover:underline hover:text-[#1a402e] transition-colors">Farmer Hub</Link>',
     '<Link to="/profile" className="hover:underline hover:text-indigo-600 transition-colors">Dashboard</Link>'),
    ('text-[10px] font-black uppercase tracking-widest text-[#22543d] mb-3',
     'text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3'),
    ('<span className="text-slate-400 flex items-center gap-1"><ShieldAlert size={12}/> Audits & Dispositions</span>',
     '<span className="text-slate-400 flex items-center gap-1"><ShieldAlert size={12}/> Complaints</span>'),
    ('<h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">\n            System Gripes Archive\n          </h1>',
     '<h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">\n            My Complaints\n          </h1>'),
    ('Track official escalations filed against internal systems, third-party logisticians, or financial faults.',
     'Track and manage your complaints regarding orders, deliveries, or system issues.'),
    
    # Button
    ('bg-[#22543d] hover:bg-[#1a402e] text-white px-6 py-3.5 rounded-xl text-sm font-extrabold shadow-[0_4px_15px_rgba(34,84,61,0.3)] hover:shadow-[0_8px_25px_rgba(34,84,61,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95',
     'bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md active:scale-95 transition-all'),
    ('Log Global Incident', 'New Complaint'),
    
    # Loader
    ('border-t-[#22543d]', 'border-t-indigo-600'),
    ('Scanning Archive...', 'Loading complaints...'),
]

for old, new in replacements:
    c = c.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated UserComplaints.js")
