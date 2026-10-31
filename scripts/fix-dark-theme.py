#!/usr/bin/env python3
"""Replace old light-mode color classes with dark premium equivalents."""
import os
import re

BASE = "/home/z/my-project/src"

# Replacements: (old, new)
REPLACEMENTS = [
    # Text colors
    ("text-noor-navy dark:text-white", "text-white"),
    ("text-noor-navy", "text-white"),
    ("text-white dark:text-white", "text-white"),
    
    # Background colors
    ("bg-white/60 dark:bg-transparent", "bg-transparent"),
    ("bg-white/60", "bg-transparent"),
    ("bg-white/40", "bg-transparent"),
    ("bg-white dark:bg-background", "bg-transparent"),
    ("bg-white dark:bg-card", "bg-transparent"),
    
    # Borders
    ("border-noor-navy/15", "border-white/10"),
    ("border-noor-navy/20", "border-white/10"),
    ("border-noor-navy/10", "border-white/5"),
    ("border-white/30 dark:border-white/10", "border-white/10"),
    
    # Shadows
    ("shadow-[0_8px_0_0_rgba(25,25,112,0.12),0_18px_30px_-12px_rgba(25,25,112,0.25)]", ""),
    ("shadow-[0_6px_0_0_rgba(25,25,112,0.08),0_14px_24px_-12px_rgba(25,25,112,0.2)]", ""),
    
    # Nav/button backgrounds
    ("bg-noor-navy text-white", "bg-noor-yellow text-[#0a0e27]"),
    
    # Hover states
    ("hover:bg-noor-navy/5 dark:hover:bg-white/5", "hover:bg-white/5"),
    ("hover:bg-noor-sky/20", "hover:bg-white/10"),
    ("hover:bg-noor-sky/40", "hover:bg-white/15"),
    
    # Misc
    ("bg-noor-sky/10", "bg-noor-sky/15"),
    ("bg-noor-yellow/10", "bg-noor-yellow/15"),
    ("bg-noor-coral/10", "bg-noor-coral/15"),
    ("bg-noor-green/10", "bg-noor-green/15"),
    
    # Hero backgrounds
    ("bg-noor-hero", "bg-noor-premium"),
    
    # Text muted
    ("text-muted-foreground", "text-white/50"),
    
    # Dark variants that are now default
    ("dark:text-white/50", "text-white/50"),
    ("dark:text-white/60", "text-white/60"),
    ("dark:text-white/70", "text-white/70"),
    ("dark:bg-white/5", "bg-white/5"),
    ("dark:bg-white/10", "bg-white/10"),
    ("dark:border-white/10", "border-white/10"),
    ("dark:border-white/5", "border-white/5"),
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

print(f"\n✅ Updated {count} files")
