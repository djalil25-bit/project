import re, os

def fix(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    for old, new in replacements:
        if old in c:
            c = c.replace(old, new)
            print(f"  OK: {old[:60]}")
        else:
            print(f"  MISS: {old[:60]}")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

# ── Wishlist card body ──────────────────────────────────────
fix(
    r'c:\Users\USER\project\frontend\src\pages\buyer\Wishlist.js',
    [
        ('flex flex-col flex-1 p-5',
         'flex flex-col flex-1 p-3'),
        ('text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors',
         'text-sm font-black text-slate-900 leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors line-clamp-2'),
        ('text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5',
         'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1'),
        ('text-xl font-extrabold text-slate-900 mb-4',
         'text-sm font-black text-slate-900 mb-2'),
        # add button: remove py-3 shadow-md, add h-9 shadow-sm, fix gap
        ('py-3 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50',
         'h-9 rounded-xl shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50'),
        ('<><AlertCircle size={14} /> Sold Out</>',
         '<><AlertCircle size={12} /> Out</>'),
        ('<><Plus size={14} /> Add</>',
         '<><Plus size={12} /> Add</>'),
        # trash button: w-12/h-12 -> w-9/h-9
        ('w-12 h-12 bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all border border-slate-100 flex items-center justify-center active:scale-90',
         'w-9 h-9 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-slate-200 flex items-center justify-center active:scale-90 shrink-0'),
        ('title="Decommit Asset"',
         'title="Remove"'),
        ('<Trash2 size={16} />',
         '<Trash2 size={13} />'),
    ]
)

# ── CartPage ───────────────────────────────────────────────
fix(
    r'c:\Users\USER\project\frontend\src\pages\buyer\CartPage.js',
    [
        # Summary header
        ('Dispatch Summary',
         'Order Summary'),
        ('FileText size={24}',
         'FileText size={18}'),
        ('mb-6 flex items-center gap-3',
         'mb-4 flex items-center gap-2'),
        ('text-xl font-black text-slate-900 mb-6',
         'text-sm font-black text-slate-900 mb-4'),
        # Net Val -> Subtotal
        ('Net Val',
         'Subtotal'),
        # text-xl subtotal value
        ('font-black text-slate-900 text-xl tracking-tight truncate w-full',
         'font-black text-slate-900 text-sm'),
        # Checkout button
        ('Setup Delivery Parameter',
         'Proceed to Checkout'),
        ('py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]',
         'py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all'),
        ('<ChevronRight size={18} />',
         '<ChevronRight size={16} />'),
    ]
)

# ── OrderHistory jargon cleanup ────────────────────────────
fix(
    r'c:\Users\USER\project\frontend\src\pages\buyer\OrderHistory.js',
    [
        ('Master Logistics',
         'My Orders'),
        ('Scanning ledgers...',
         'Loading orders...'),
        ('Browse Map',
         'Browse Products'),
        ('Zero trace data available',
         'No orders found'),
        ('Your logistics ledger is empty.',
         'You have not placed any orders yet.'),
        ('Zero nodes match status',
         'No orders match filter'),
        ('no trace data available',
         'No orders found'),
        ('Abort Sequence',
         'Cancel Order'),
        ('The supplier has not yet verified this transaction. You may abort the sequence to restore credits instantly.',
         'The farmer has not yet confirmed this order. You may cancel it now to restore your stock.'),
        ('Pending Supplier Auth',
         'Awaiting Confirmation'),
        ('Asset Payload Matrix',
         'Order Items'),
        ('Discrete Nodes',
         'items'),
        ('Financial Settlement',
         'Total'),
        ('Invoice Portal',
         'View Invoice'),
        ('Authorized Target',
         'Delivery Address'),
        ('Flux Logs',
         'Order Timeline'),
        ('Live Flux Tracker',
         'Delivery Progress'),
        ('Route Ref',
         'Order'),
        ('Auth Date',
         'Date'),
        ('Node State',
         'Status'),
        ('All Log',
         'All'),
        ('Order Log',
         'Orders'),
        # Table header colors: dark slate -> indigo
        ('bg-slate-900 text-white uppercase text-[8px] font-black tracking-widest',
         'bg-indigo-700 text-indigo-100 uppercase text-[8px] font-black tracking-widest'),
    ]
)

print("\nAll fixes applied.")
