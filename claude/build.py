"""Build the v2 lesson pages from the content files in src/.
Run: python3 build.py   (from the v2 folder)"""
import re, pathlib

HERE = pathlib.Path(__file__).parent
SRC = HERE / "src"

LESSONS = {
    1: ("ג׳אם אסיד ראשון", "תופים, בס חומצי וסיבובים חיים בקצב 128"),
    2: ("צלילה לעומק הבס", "מתנדים, מסנן, מעטפת, תנועה מחזורית ותרגילים"),
    3: ("הקלידים של הבס", "16 הקלידים, אוקטבה, סולמות לאסיד והעברת ריף"),
    4: ("היכרות עם הטי־8", "מאפס: הדלקה, מפה של הלוח, כל צליל, והשפה של הלחצנים"),
    5: ("ג׳אם אסיד עם הטי־8", "תופים ובס בקופסה אחת, הדגשות, שאיבה מהקיק וסיבובים חיים"),
    6: ("גרוב חי: הטריקים של הקצב", "סיכוי, עוצמה לכל מכה, גלגולים, אורכים, גמגום, מילוי ואקראי"),
    7: ("צליל: הטריקים של הסאונד", "התפריט, החלפת כלים, עיוות, טרנספוז, הד לקצב, שאיבה ושער"),
}

T8CAP = "תרשים מצויר לפי המדריך הרשמי, לא צילום"
T8_LESSONS = (4, 5, 6, 7)

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
    # lesson 4: drawn map of the T-8 (src/t8map.py), not photos
    (4, "card", "1.1", ["l4-01"], ["CHARGE|נורית הטעינה", "MIX OUT|אוזניות", "VOLUME|עוצמה"], T8CAP),
    (4, "card", "1.3", ["l4-02"], ["|התצוגה", "TEMPO/VALUE|", "▶|נגינה ועצירה"], T8CAP),
    (4, "card", "2.1", ["l4-03"], ["|התצוגה", "TEMPO/VALUE|", "SHIFT|", "PATTERN|", "▶|", "●|"], T8CAP),
    (4, "card", "2.2", ["l4-04"], ["BASS DRUM|", "SNARE DRUM|", "HAND CLAP|", "TOM|", "CLOSED HIHAT|", "OPEN HIHAT|"], T8CAP),
    (4, "card", "2.3", ["l4-06"], ["BASS|", "KYBD|", "CUTOFF|", "RESO|", "ENV MOD|", "DECAY|של הבס"], T8CAP),
    (4, "card", "2.4", ["l4-08"], ["DELAY|", "REVERB|", "ACCENT|"], T8CAP),
    (4, "card", "2.5", ["l4-07"], ["1|C · EXIT", "10|A", "14|OCT-", "15|OCT+", "16|SLIDE"], T8CAP),
    (4, "card", "3.1", ["l4-09"], ["PATTERN|", "16|תבנית 16", "SHIFT|", "11|PTN CLEAR ALL"], T8CAP),
    (4, "card", "3.2", ["l4-05"], ["BASS DRUM|לחצן הכלי", "LEVEL|", "TUNE|", "DECAY|הלחצן העגול", "1|צעד 1"], T8CAP),
    (4, "card", "5.3", ["l4-10"], ["SHIFT|", "15|MENU", "TEMPO/VALUE|", "2|ENTER", "1|EXIT"], T8CAP),
    (6, "card", "1.1", ["l6-01"], ["PATTERN|מחזיקים", "14|תופים", "15|בס", "16|הכל"], T8CAP),
    (6, "card", "1.2", ["l6-02"], ["CLOSED HIHAT|", "4|מחזיקים את הצעד", "TEMPO/VALUE|סיכוי", "ACCENT|עוצמה, בשלב 2"], T8CAP),
    (6, "card", "3.1", ["l6-03"], ["SNARE DRUM|מחזיקים", "16|לוחצים", "ACCENT|סיכוי לגלגול, ב־3.3"], T8CAP),
    (6, "card", "4.1", ["l6-04"], ["SHIFT|", "6|STEP 17-32", "5|STEP 1-16", "4|LAST, ב־4.2"], T8CAP),
    (6, "card", "5.1", ["l6-05"], ["SHIFT|", "PATTERN|", "13|הצעד שבלופ"], T8CAP),
    (6, "card", "6.2", ["l6-06"], ["SHIFT|", "8|FILL PTN", "7|FILL TRG", "1|EXIT"], T8CAP),
    (6, "card", "5.3", ["l6-07"], ["SHIFT|", "9|תופים אקראיים", "10|בס אקראי"], T8CAP),
    (7, "card", "0.1", ["l4-10"], ["SHIFT|", "15|MENU", "TEMPO/VALUE|", "2|ENTER", "1|EXIT"], T8CAP),
    (7, "card", "2.1", ["l7-01"], ["PATTERN|מחזיקים", "10|עיוות", "BASS|", "BASS DRUM|ב־2.2"], T8CAP),
    (7, "card", "3.1", ["l7-02"], ["BASS|מחזיקים", "KYBD|מחזיקים", "TEMPO/VALUE|מסובבים"], T8CAP),
    (7, "card", "4.2", ["l7-03"], ["SHIFT|", "13|שליחה להד", "14|שליחה להדהוד", "DELAY|", "REVERB|"], T8CAP),
    (7, "card", "5.1", ["l7-04"], ["PATTERN|מחזיקים", "12|שאיבה", "ACCENT|הד והדהוד, ב־5.3", "BASS|"], T8CAP),
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
        if (HERE / "img" / f"{i}.svg").exists():
            tags.append(f'<img src="img/{i}.svg" width="1000" height="606" loading="lazy" alt="תרשים הלוח עם סימונים">')
            continue
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
        extra, body = m.group(1) or "", m.group(2)
        num = re.search(r'<span class="num">([^<]+)</span>', body)
        attrs = f' class="card{extra}"'
        if num:
            attrs += f' data-id="l{n}:{num.group(1)}" id="l{n}-{num.group(1).replace(".", "-")}"'
        learn = re.search(r'<div class="learn">.*?</div>', body, re.S)
        head = re.search(r'<div class="card-head">.*?</div>', body, re.S)
        if learn:
            rest = body.replace(learn.group(0), "")
            head_html = ""
            if head:
                head_html = head.group(0)
                rest = rest.replace(head_html, "", 1)
            attrs = attrs.replace(f'class="card{extra}"', f'class="card split{extra}"')
            body = f'{head_html}<div class="col-do">{rest}</div><div class="col-learn">{learn.group(0)}</div>'
        return f"<article{attrs}>{body}</article>"
    return re.sub(r'<article class="card((?: [a-z-]+)*)">(.*?)</article>', fix, html, flags=re.S)


T8JS = '<script src="t8-data.js"></script>\n<script src="t8.js"></script>\n'
KIT_LESSONS = (6,)  # lessons built with the kit: sessions, action marks, display drawings, hand practice
KITJS = '<script src="kit.js"></script>\n'

VERBS = {"hold": ("✋", "החזק"), "tap": ("👆", "לחץ"), "turn": ("⟳", "סובב")}


def _seg(text):
    """Draw text on the 4-digit display, one cell per digit: a dim 8. behind, the character and its dot in front."""
    cells = []
    for ch in text:
        if ch == "." and cells and not cells[-1][1]:
            cells[-1][1] = "."
        else:
            cells.append(["" if ch == " " else ch, ""])
    while len(cells) < 4:
        cells.insert(0, ["", ""])
    inner = "".join(f'<span class="c"><b>8.</b><i>{c}{d}</i></span>' for c, d in cells)
    return f'<span class="seg" role="img" aria-label="בתצוגה: {text}">{inner}</span>'


def macros(html):
    """Shorthand used in kit lessons:
    [[hold:X]] [[tap:X]] [[turn:X]] [[rel]] [[seg:TEXT]]  (X = button name or step number)
    [[state:play|SNARE DRUM|free text]]  start state; first item play or stop, second the selected part
    [[combo:question|seq]] and [[combo-:question|seq]] (hidden, practice only); [[combo:question|seq|state]]"""
    def one(m):
        body = m.group(1)
        kind, _, rest = body.partition(":")
        if kind == "rel":
            return '<span class="a a-rel"><i>🖐</i>שחרר</span>'
        if kind == "seg":
            return _seg(rest)
        if kind in VERBS:
            ic, verb = VERBS[kind]
            name = f"לחצן <kbd>{rest}</kbd>" if rest.isdigit() else f"<kbd>{rest}</kbd>"
            return f'<span class="a a-{kind}"><i>{ic}</i>{verb} {name}</span>'
        if kind == "state":
            parts = rest.split("|")
            items = ['<span>▶ מנגן</span>' if parts[0] == "play" else '<span>■ עצור</span>']
            if len(parts) > 1 and parts[1]:
                items.append(f'<span>נבחר <kbd>{parts[1]}</kbd></span>')
            items += [f"<span>{x}</span>" for x in parts[2:] if x]
            return '<div class="state"><b>מתחילים כש:</b>' + "".join(items) + "</div>"
        if kind in ("combo", "combo-"):
            parts = rest.split("|")
            q, seq = parts[0], parts[1]
            st = f' data-state="{parts[2]}"' if len(parts) > 2 else ""
            hide = ' data-hide="1"' if kind == "combo-" else ""
            return f'<div class="combo" data-q="{q}" data-seq="{seq}"{st}{hide}></div>'
        raise ValueError("unknown macro: " + body)
    return re.sub(r"\[\[((?:hold|tap|turn|rel|seg|state|combo-?)(?::[^\]]*)?)\]\]", one, html)


def page(n):
    title, _ = LESSONS[n]
    html = (SRC / f"l{n}.html").read_text(encoding="utf8")
    # topnav from the artifact version is replaced by the toolbar
    html = re.sub(r'<nav class="topnav".*?</nav>\s*', "", html, count=1, flags=re.S)
    for k in LESSONS:
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
    if n in KIT_LESSONS:
        html = macros(html)
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
<link rel="stylesheet" href="app.css">{chr(10) + '<link rel="stylesheet" href="kit.css">' if n in KIT_LESSONS else ""}
</head>
<body data-lesson="{n}">
<div class="toolbar"><div class="in"><a class="tb" href="index.html">☰ כל השיעורים</a>{tabs}<button class="tb play" id="playmode" type="button">▶ מצב נגינה</button><a class="tb" href="notebook.html">☆ פנקס</a><a class="tb" href="glossary.html">א־ת מילון</a><span class="sp"></span><span class="ver">גרסת קלוד</span><button class="tb" id="wake" type="button">☀ מסך דלוק</button></div></div>
<div class="wrap">
{html}
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
{KITJS if n in KIT_LESSONS else ""}{T8JS if n in T8_LESSONS else ""}</body>
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
<ul class="lessons">
<li><a class="lesson" href="notebook.html"><span class="ln">☆</span><div class="lt"><h2>הפנקס שלי</h2><p>ההערות שכתבת בכרטיסים</p></div></a></li>
<li><a class="lesson" href="glossary.html"><span class="ln">א</span><div class="lt"><h2>מילון מושגים</h2><p>כל המושגים מהשיעורים במקום אחד</p></div></a></li>
</ul>
<article class="card">
<h3>להתקנה באייפד כמו אפליקציה</h3>
<ol class="steps">
<li><div>פתח את העמוד הזה בספארי.</div></li>
<li><div>גע בכפתור השיתוף (ריבוע עם חץ למעלה).</div></li>
<li><div>בחר ״הוספה למסך הבית״.</div></li>
</ol>
<p class="info">באפליקציה מהמסך הבית, ההתקדמות נשמרת בנפרד מספארי.</p>
</article>
<p class="legend"><a href="../index.html">← לעמוד הראשי: כל השיעורים והכלים, גם של גרוק</a></p>
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
</body>
</html>
"""
    (HERE / "index.html").write_text(out, encoding="utf8")


TOOLS = {
    "notebook": ("הפנקס שלי", "ההערות שכתבת בכרטיסים, במקום אחד. נשמר באייפד הזה.", '<div id="notebook"></div>'),
    "glossary": ("מילון מושגים", "כל המושגים מהשיעורים. בתוך השיעורים אפשר גם לגעת במילה עם קו תחתון מנוקד.", '<div id="glossary"></div>'),
}


def tool_page(key):
    title, lede, body = TOOLS[key]
    tabs = "".join(f'<a class="tb" href="lesson-{k}.html">שיעור {k}</a>' for k in LESSONS)
    links = "".join(f'<a class="tb{" cur" if k == key else ""}" href="{k}.html">{lbl}</a>' for k, lbl in (("notebook", "☆ פנקס"), ("glossary", "א־ת מילון")))
    out = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1d2433">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="שיעורים · קלוד">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<title>{title} · גרסת קלוד</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">
</head>
<body>
<div class="toolbar"><div class="in"><a class="tb" href="index.html">☰ כל השיעורים</a>{tabs}{links}<span class="sp"></span><span class="ver">גרסת קלוד</span></div></div>
<div class="wrap">
<header style="display:flex;flex-direction:column;gap:8px"><h1>{title}</h1><p class="lede">{lede}</p></header>
{body}
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
</body>
</html>
"""
    (HERE / f"{key}.html").write_text(out, encoding="utf8")


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(SRC))
    import t8map
    t8map.build()
    totals = {n: page(n) for n in LESSONS}
    hub(totals)
    for k in TOOLS:
        tool_page(k)
    print("built", totals)
