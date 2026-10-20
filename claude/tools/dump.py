"""Print every instruction in a lesson source, card by card, to read it like a checklist.
Usage: python3 claude/tools/dump.py claude/src/l6.html"""
import sys,re,html
t=open(sys.argv[1],encoding="utf8").read()
t=re.sub(r'<div class="learn">.*?</div>\s*</article>','</article>',t,flags=re.S)  # skip theory blocks
for m in re.finditer(r'<article class="card[^"]*"[^>]*>(.*?)</article>',t,re.S):
    c=m.group(1)
    num=re.search(r'class="num">([^<]+)',c); h=re.search(r'<h3>(.*?)</h3>',c)
    print("##",num.group(1) if num else "", re.sub("<[^>]+>","",h.group(1)) if h else "")
    for st in re.findall(r'\[\[state:([^\]]*)\]\]',c): print("  STATE:",st)
    for cb in re.findall(r'\[\[combo-?:([^\]]*)\]\]',c): print("  COMBO:",cb)
    for li in re.findall(r'<li><div>(.*?)</div></li>',c,re.S):
        s=re.sub(r'<span class="where">(.*?)</span>',r' {\1}',li); s=re.sub(r"<[^>]+>","",s); print("  -",html.unescape(re.sub(r"\s+"," ",s)).strip())
    for k in ("ok","warn","info"):
        for x in re.findall(rf'<(?:p|div) class="{k}">(.*?)</(?:p|div)>',c,re.S):
            print(f"  [{k}]",html.unescape(re.sub(r"\s+"," ",re.sub("<[^>]+>","",x))).strip()[:300])
