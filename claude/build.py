"""Build the v2 lesson pages from the content files in src/.
Run: python3 build.py   (from the v2 folder)"""
import re, pathlib

HERE = pathlib.Path(__file__).parent
SRC = HERE / "src"

LESSONS = {
    1: ("ג׳אם אסיד ראשון", "תופים, בס חומצי וסיבובים חיים בקצב 128"),
    2: ("צלילה לעומק הבס", "מתנדים, מסנן, מעטפת, תנועה מחזורית ותרגילים"),
    3: ("הקלידים של הבס", "16 הקלידים, אוקטבה, סולמות לאסיד והעברת ריף"),
}

# Photos: (lesson, kind, anchor) -> images + legend. Legend order matches the numbers drawn on each photo.
PHOTOS = [
    (1, "after", "<h2>מה צריך</h2>", ["l1-00", "l1-01"], [], "התופים והבס שלך"),
    (1, "after", "<h2>קצב ודף נקי</h2>", ["l1-03"], ["TEMPO|כפתור הקצב", "|התצוגה האדומה", "FUNC|", "STEP MODE|", "▶|המשולש", "16|קליד 16"], ""),
    (1, "after", "<h2>ארבע שכבות תופים</h2>", ["l1-04"], ["FUNC|", "STEP MODE|", "1|קיק", "5|היי־האט סגור", "6|היי־האט פתוח", "7|קלאפ"], ""),
    (1, "card", "2.5", ["l1-05"], ["CLOSED DECAY|אורך הסגור", "OPEN DECAY|אורך הפתוח", "PART LEVEL|עוצמת הכלי הנבחר", "DECAY|אורך הקיק"], ""),
    (1, "card", "3.0", ["l1-02"], ["FUNC|", "VCO1|", "VCO2 · VCO3|", "1|קליד 1", "8|צורת גל", "11|החזקה", "12|מעטפת לעוצמה"], ""),
    (1, "card", "3.1", ["l1-06"], ["ATTACK|", "DECAY/RELEASE|", "CUTOFF EG INT|", "CUTOFF|", "PEAK|", "INT|באזור LFO", "OCTAVE|", "VOLUME|", "TEMPO|"], "כל הכפתורים של שלב 3"),
    (1, "card", "4.1", ["l1-07"], ["FUNC|", "●|העיגול", "▶|המשולש", "VCO1|", "1|לה נמוך", "13|לה גבוה", "15|מחיקה"], ""),
    (1, "card", "4.3", ["l1-08"], ["FUNC|", "STEP MODE|", "6 · 14|קלידי הגלישה"], ""),
    (1, "card", "5.1", ["l1-09", "l1-10"], ["SYNC OUT → SYNC IN|כבל הסנכרון", "PHONES|לערוץ נפרד במיקסר", "▶|בכל מכשיר"], "משמאל התופים, מימין הבס"),
    (1, "card", "6.1", ["l1-11"], ["CUTOFF|יד ימין", "PEAK|יד שמאל", "CUTOFF EG INT|", "DECAY/RELEASE|"], ""),
    (2, "after", "<h2>נקודת התחלה</h2>", ["l2-00"], [], "הבס שלך"),
    (2, "card", "1.1", ["l2-01"], ["FUNC|", "VCO1|", "VCO2|", "VCO3|", "1|שלושה נפרדים", "2|1 ו־2 יחד", "3|כולם יחד"], ""),
    (2, "card", "2.1", ["l2-02"], ["FUNC|", "8|גל מתנד 1", "9|גל מתנד 2", "10|גל מתנד 3", "VCO1|"], ""),
    (2, "card", "2.2", ["l2-03"], ["PITCH 1|", "PITCH 2|", "PITCH 3|", "OCTAVE|", "VCO1|"], ""),
    (2, "card", "3.1", ["l2-04"], ["CUTOFF|", "PEAK|", "CUTOFF EG INT|", "ATTACK|", "DECAY/RELEASE|"], ""),
    (2, "card", "4.1", ["l2-05"], ["RATE|", "INT|", "CUTOFF|", "FUNC|", "4|יעד: עוצמה", "5|יעד: גובה", "6|יעד: מסנן", "7|צורת התנועה"], ""),
    (2, "card", "6.1", ["l2-06"], ["FUNC|", "STEP MODE|", "6|גלישה", "14|גלישה", "13|ניקוי גלישות"], ""),
    (2, "card", "6.2", ["l2-07"], ["FUNC|", "▶|צעדים פעילים", "STEP MODE|שתיקה", "1|צעד לדוגמה", "5 · 9 · 13|צעדים לדוגמה"], ""),
    (3, "card", "1.1", ["l3-01"], ["OCTAVE|", "1 … 16|הקלידים", "FUNC|", "MEMORY|", "STEP MODE|", "▶|", "●|", "VCO1 · 2 · 3|"], ""),
    (3, "card", "1.1", ["l3-00"], [], "הקלידים שלך, עם שם התו מעל כל קליד"),
    (3, "card", "2.1", ["l3-02"], ["OCTAVE|", "1 … 16|הקלידים שהוא מזיז"], ""),
    (3, "card", "3.1", ["l3-03"], ["●|", "▶|", "VCO1 · 2 · 3|", "1 … 16|הקלידים", "TEMPO|"], ""),
    (3, "after", "<h2>אותו קליד, הרבה תפקידים</h2>", ["l3-04"], ["FUNC|", "1 · 2 · 3|קיבוץ", "4 · 5 · 6 · 7|תנועה מחזורית", "8 · 9 · 10|צורת גל", "11 · 12|החזקה ומעטפת", "13 … 16|מחיקות"], ""),
    (3, "card", "4.3", ["l3-05"], ["MEMORY|", "FUNC|", "M1 … M8|", "|התצוגה"], ""),
]

SIZES = {}
try:
    from PIL import Image
    for p in (HERE / "img").glob("*.webp"):
        SIZES[p.stem] = Image.open(p).size
except Exception:
    pass


def figure(imgs, legend, cap):
    two = " two" if len(imgs) > 1 else ""
    tags = []
    for i in imgs:
        w, h = SIZES.get(i, (1140, 660))
        tags.append(f'<img src="img/{i}.webp" width="{w}" height="{h}" loading="lazy" alt="צילום המכשיר עם סימונים">')
    lis = ""
    for item in legend:
        a, b = item.split("|")
        lis += "<li>" + (f"<b>{a}</b>" if a else "") + (" " + b if b else "") + "</li>"
    cap_html = ""
    if lis or cap:
        cap_html = "<figcaption>" + (f"<p>{cap}</p>" if cap else "") + (f'<ol class="marks">{lis}</ol>' if lis else "") + "<p>אפשר לגעת בתמונה כדי להגדיל.</p></figcaption>"
    return f'<figure class="photo"><div class="imgs{two}">{"".join(tags)}</div>{cap_html}</figure>\n'


def split_cards(html, n):
    """Give numbered cards an id, and on cards with a theory block, split action and theory into two columns."""
    def fix(m):
        body = m.group(1)
        num = re.search(r'<span class="num">([^<]+)</span>', body)
        attrs = ' class="card"'
        if num:
            attrs += f' data-id="l{n}:{num.group(1)}"'
        learn = re.search(r'<div class="learn">.*?</div>', body, re.S)
        head = re.search(r'<div class="card-head">.*?</div>', body, re.S)
        if learn:
            rest = body.replace(learn.group(0), "")
            head_html = ""
            if head:
                head_html = head.group(0)
                rest = rest.replace(head_html, "", 1)
            attrs = attrs.replace('class="card"', 'class="card split"')
            body = f'{head_html}<div class="col-do">{rest}</div><div class="col-learn">{learn.group(0)}</div>'
        return f"<article{attrs}>{body}</article>"
    return re.sub(r'<article class="card">(.*?)</article>', fix, html, flags=re.S)


def page(n):
    title, _ = LESSONS[n]
    html = (SRC / f"l{n}.html").read_text(encoding="utf8")
    # topnav from the artifact version is replaced by the toolbar
    html = re.sub(r'<nav class="topnav".*?</nav>\s*', "", html, count=1, flags=re.S)
    for k in (1, 2, 3):
        html = html.replace(f"URL_L{k}", f"lesson-{k}.html")
    for (ln, kind, anchor, imgs, legend, cap) in PHOTOS:
        if ln != n:
            continue
        fig = figure(imgs, legend, cap)
        if kind == "after":
            assert anchor in html, anchor
            html = html.replace(anchor, anchor + "\n" + fig, 1)
        else:
            pat = re.compile(r'(<article class="card">\s*<div class="card-head"><span class="num">' + re.escape(anchor) + r'</span>)')
            assert pat.search(html), (n, anchor)
            html = pat.sub(lambda m: fig + m.group(1), html, count=1)
    html = split_cards(html, n)
    tabs = "".join(
        f'<a class="tb{" cur" if k == n else ""}" href="lesson-{k}.html"{" aria-current=page" if k == n else ""}>שיעור {k}</a>'
        for k in LESSONS)
    total = len(re.findall(r'data-id="l%d:' % n, html))
    out = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1d2433">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="שיעורים · קלוד">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<title>{title} · גרסת קלוד</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">
</head>
<body data-lesson="{n}">
<div class="toolbar"><div class="in"><a class="tb" href="index.html">☰ כל השיעורים</a>{tabs}<span class="sp"></span><span class="ver">גרסת קלוד</span><button class="tb" id="wake" type="button">☀ להשאיר מסך דלוק</button></div></div>
<div class="wrap">
{html}
</div>
<script src="app.js"></script>
</body>
</html>
"""
    (HERE / f"lesson-{n}.html").write_text(out, encoding="utf8")
    return total


def hub(totals):
    items = ""
    for n, (title, sub) in LESSONS.items():
        items += f"""<li><a class="lesson" href="lesson-{n}.html"><span class="ln">{n}</span><div class="lt"><h2>{title}</h2><p>{sub}</p>
<div data-progress="l{n}" data-total="{totals[n]}"><div class="progress"><span style="width:0"></span></div><small class="ptxt">0 מתוך {totals[n]} כרטיסים</small></div></div></a></li>
"""
    out = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1d2433">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="שיעורים · קלוד">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<title>שיעורי מוזיקה · גרסת קלוד</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">
<style>
.hero{{display:flex;flex-direction:column;gap:6px;padding-block:12px 4px}}
.hero .k{{font-family:var(--f-mono);color:var(--accent);font-weight:600;letter-spacing:.06em;font-size:.85rem}}
.lessons{{list-style:none;margin:0;padding:0;display:grid;gap:12px}}
@media (min-width:820px){{.lessons{{grid-template-columns:repeat(3,1fr)}}}}
.lesson{{display:flex;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;text-decoration:none;color:var(--fg);height:100%}}
.lesson:active{{background:var(--accent-soft)}}
.ln{{flex:none;width:40px;height:40px;border-radius:50%;background:var(--fg);color:var(--accent);display:grid;place-items:center;font-family:var(--f-display);font-size:1.3rem}}
.lt{{display:flex;flex-direction:column;gap:8px;min-width:0;flex:1}}
.lt h2{{font-size:1.25rem}}
.lt p{{color:var(--muted);font-size:.95rem}}
.lt small{{color:var(--muted)}}
</style>
</head>
<body>
<div class="wrap">
<header class="hero"><span class="k">גרסת קלוד</span><h1>שיעורי מוזיקה</h1><p class="lede">בס חומצי ומכונת תופים, צעד אחר צעד. ההתקדמות נשמרת במכשיר שבו סימנת ״סיימתי״.</p></header>
<ul class="lessons">
{items}</ul>
<article class="card">
<h3>להתקנה באייפד כמו אפליקציה</h3>
<ol class="steps">
<li><div>פתח את העמוד הזה בספארי.</div></li>
<li><div>גע בכפתור השיתוף (ריבוע עם חץ למעלה).</div></li>
<li><div>בחר ״הוספה למסך הבית״.</div></li>
</ol>
<p class="info">באפליקציה מהמסך הבית, ההתקדמות נשמרת בנפרד מספארי.</p>
</article>
<p class="legend"><a href="../index.html#grok">לגרסת גרוק של השיעורים</a></p>
</div>
<script src="app.js"></script>
</body>
</html>
"""
    (HERE / "index.html").write_text(out, encoding="utf8")


if __name__ == "__main__":
    totals = {n: page(n) for n in LESSONS}
    hub(totals)
    print("built", totals)
