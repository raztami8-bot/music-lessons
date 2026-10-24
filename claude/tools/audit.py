"""Crawl the hub and the Claude pages at phone and iPad width: JS errors, horizontal overflow,
leftover [[shorthand]], broken images, dead links and anchors, card refs like "ב־3.2" that point nowhere.
Starts its own local server. Usage: python3 claude/tools/audit.py
Known false positive: lesson 7 values 0.5, 1.0, 2.0 look like card numbers."""
import re, sys, socket, subprocess, time, pathlib
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
sock=socket.socket(); sock.bind(("127.0.0.1",0)); PORT=sock.getsockname()[1]; sock.close()
srv=subprocess.Popen([sys.executable,"-m","http.server",str(PORT),"--bind","127.0.0.1"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
BASE=f"http://127.0.0.1:{PORT}/"
PAGES=["index.html"]+[f"claude/lesson-{n}.html" for n in range(1,12)]+["claude/map.html","claude/vb-map.html","claude/settings.html","claude/notebook.html","claude/glossary.html","claude/index.html"]
problems=[]
ids_cache={}
with sync_playwright() as p:
    b=p.chromium.launch()
    def ids_of(page_url, pg2):
        if page_url in ids_cache: return ids_cache[page_url]
        pg2.goto(page_url); pg2.wait_for_timeout(250)
        s=set(pg2.evaluate("[...document.querySelectorAll('[id]')].map(e=>e.id)")); ids_cache[page_url]=s; return s
    helper=b.new_page()
    helper.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    for vw in (390,820):
        for path in PAGES:
            pg=b.new_page(viewport={"width":vw,"height":900})
            errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
            pg.on("console",lambda m: (m.type=="error" and "googleapis" not in m.text and "ERR_FAILED" not in m.text) and errs.append(m.text))
            pg.route("**/fonts.googleapis.com/**", lambda r: r.abort())
            pg.goto(BASE+path); pg.wait_for_timeout(500)
            if errs: problems.append((path,vw,"js",errs))
            sw=pg.evaluate("document.documentElement.scrollWidth")
            if sw>vw+1: problems.append((path,vw,"overflow",sw, pg.evaluate("""(vw)=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+2 && !e.closest('.t8-map,.grid-box,.tbl-box,.toolbar,.jump,.bar')}).slice(0,5).map(e=>e.tagName+'.'+e.className)""",vw)))
            if vw==390:
                left=pg.evaluate("document.body.innerHTML.match(/\\[\\[(hold|tap|turn|rel|seg|state|combo)/g)")
                if left: problems.append((path,"leftover shorthand",left))
                empty=pg.evaluate("[...document.querySelectorAll('.combo')].filter(c=>!c.hidden && !c.querySelector('.row')).length")
                if empty: problems.append((path,"empty combo",empty))
                # all imgs
                pg.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')"); pg.wait_for_timeout(600)
                bad=pg.evaluate("[...document.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth==0).map(i=>i.getAttribute('src'))")
                if bad: problems.append((path,"broken img",bad))
                links=pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))")
                for h in set(links):
                    if h.startswith(("http","mailto")) : continue
                    full=urljoin(BASE+path,h); u=urlparse(full); target=f"{u.scheme}://{u.netloc}{u.path}"
                    if target.endswith("/"): target+="index.html"
                    r=pg.request.get(target)
                    if r.status!=200: problems.append((path,"dead link",h)); continue
                    if u.fragment and target.endswith(".html") and "/codex/" not in target:
                        if u.fragment not in ids_of(target, helper): problems.append((path,"missing anchor",h))
                    elif u.fragment and "/codex/" in target:
                        if u.fragment not in ids_of(target, helper): problems.append((path,"missing anchor",h))
                # internal "ב־X.Y" refs
                if "lesson-" in path:
                    nums=set(pg.evaluate("[...document.querySelectorAll('.card-head .num')].map(n=>n.textContent.trim())"))
                    txt=pg.evaluate("document.querySelector('.wrap').innerText")
                    refs=set(re.findall(r"(?:ב|מ|ל|כמו ב)־(\d+\.\d+)",txt))
                    miss=sorted(r for r in refs if r not in nums)
                    if miss: problems.append((path,"refs to missing card nums",miss))
            pg.close()
    b.close()
srv.terminate()
for x in problems: print(x)
print("done,",len(problems),"problems")
