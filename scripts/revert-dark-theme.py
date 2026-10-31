#!/usr/bin/env python3
"""Reverse the dark theme changes back to original light theme."""
import os

BASE = "/home/z/my-project/src"

# Reverse replacements: (new_dark, original_light)
REPLACEMENTS = [
    # Text colors — back to original
    ("text-white/50", "text-muted-foreground"),
    ("text-white/60", "text-muted-foreground"),
    ("text-white/70", "text-muted-foreground"),
    
    # Background — back to original
    ("bg-transparent", "bg-white/60 dark:bg-transparent"),
    ("bg-noor-premium", "bg-noor-hero"),
    
    # Borders — back to original
    ("border-white/10", "border-noor-navy/15"),
    ("border-white/5", "border-noor-navy/10"),
    
    # Buttons — back to original
    ("text-[#0a0e27]", "text-noor-navy"),
    ("bg-[#111531] text-white border border-white/10 hover:bg-white/5", "bg-noor-navy text-white shadow-chunky hover:brightness-110"),
    ("bg-transparent text-white border-2 border-white/15 hover:bg-white/5", "bg-transparent text-noor-navy dark:text-white border-2 border-noor-navy/30 dark:border-white/30 hover:bg-noor-navy/5 dark:hover:bg-white/5"),
    
    # Nav chips
    ("bg-noor-yellow text-[#0a0e27]", "bg-noor-navy text-white"),
    ("text-white/70 hover:bg-white/5 hover:text-white", "text-noor-navy hover:bg-noor-sky/20 dark:text-white dark:hover:bg-white/10"),
    
    # Hover states
    ("hover:bg-white/10", "hover:bg-noor-sky/20"),
    ("hover:bg-white/15", "hover:bg-noor-sky/40"),
    ("hover:bg-white/5", "hover:bg-noor-navy/5 dark:hover:bg-white/5"),
    
    # Glass effects
    ("glass-nav", "glass-panel"),
    ("glass-card", ""),
    
    # Footer
    ("border-white/5 bg-white/[0.02] backdrop-blur", "border-noor-navy/10 bg-white/40 backdrop-blur dark:border-white/10 dark:bg-white/5"),
    
    # Logo
    ('text-white">\n            منافسه', 'text-noor-navy dark:text-white">\n            منافسه'),
    ("text-white/40", "text-muted-foreground"),
]

count = 0
for root, dirs, files in os.walk(BASE):
    for fname in files:
        if not fname.endswith(".tsx"):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        original = content
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)
        
        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            count += 1
            print(f"  ✓ {fpath}")

print(f"\n✅ Reverted {count} files")
