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

# Lessons are numbered per device on the site; file names and saved progress keys stay lesson-1..7 / l1..l7.
DEVICES = {
    "t8": ("הטי־8", "T-8", "תופים ובס בקופסה אחת", (4, 5, 6, 7)),
    "volca": ("הוולקות", "Volca Beats · Volca Bass", "מכונת תופים ובס, שני מכשירים קטנים", (1, 2, 3)),
}
DEV = {n: (d, i + 1) for d, v in DEVICES.items() for i, n in enumerate(v[3])}
SHORT = {"t8": "טי־8", "volca": "וולקות"}


def label(n, full=True):
    d, k = DEV[n]
    return f"{SHORT[d]} · שיעור {k}" if full else f"שיעור {k}"


NAVCSS = '<link rel="stylesheet" href="nav.css">'
SETTAB = '<a class="tb" href="settings.html">💾 מה נשמר</a>'
NAVJS = '<script src="nav.js"></script>\n'

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


XREF_RE = re.compile(r"\[\[go:([^|\]]+)\|([^\]]+)\]\]")


def xref_href(t, here=None):
    """[[go:TARGET|text]] targets: "5" a lesson, "5:s2" a stage, "5:2.3" a card, "set:pan" a row in settings.html.
    Lesson numbers are file numbers (lesson-5.html), not the per-device numbers the text shows."""
    if t.startswith("set:"):
        return "settings.html#set-" + t[4:]
    n, _, rest = t.partition(":")
    n = int(n)
    assert n in LESSONS, ("unknown lesson in [[go]]", t)
    anchor = f"l{n}-" + rest.replace(".", "-") if re.fullmatch(r"\d+\.\d+", rest) else rest
    if n == here and anchor:
        return "#" + anchor
    return f"lesson-{n}.html" + ("#" + anchor if anchor else "")


def xrefs(html, here=None):
    """Turn every [[go:TARGET|text]] into a direct link. check_links() makes sure each one lands on a real card."""
    return XREF_RE.sub(lambda m: f'<a class="xref" href="{xref_href(m.group(1), here)}">{m.group(2)}</a>', html)


def set_notes(html, n, S):
    """Each card listed in a settings row (src/settings.py) gets one line: is this saved, wiped, or unknown. Links to the row."""
    want = {}
    for gid, _t, _l, _a, rows in S.GROUPS:
        for rid, *_x, cards, _src in rows:
            for c in cards:
                ln, _, num = c.partition(":")
                if int(ln) == n:
                    want.setdefault(num, []).append((gid, rid, _x[0]))
    for num, lst in want.items():
        m = re.search(r'<span class="num">' + re.escape(num) + r"</span>", html)
        assert m, ("settings row points to a missing card", n, num)
        end = html.index("</article>", m.end())
        learn = html.find('<div class="learn">', m.end(), end)
        at = learn if learn >= 0 else end
        notes = "".join(f'<a class="setnote g-{g}" href="settings.html#set-{r}"><i aria-hidden="true"></i><span><b>{name}:</b> {S.NOTE[g]}</span></a>' for g, r, name in lst)
        html = html[:at] + f'<div class="setnotes">{notes}</div>\n    ' + html[at:]
    return html


def page(n):
    title, _ = LESSONS[n]
    html = (SRC / f"l{n}.html").read_text(encoding="utf8")
    # topnav from the artifact version is replaced by the toolbar
    html = re.sub(r'<nav class="topnav".*?</nav>\s*', "", html, count=1, flags=re.S)
    for k in LESSONS:
        html = html.replace(f"URL_L{k}", f"lesson-{k}.html")
    html = xrefs(html, n)
    if n in T8_LESSONS:
        import settings
        html = set_notes(html, n, settings)
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
    dev = DEV[n][0]
    html = html.replace("<h1>", f'<span class="eyebrow {dev}">{label(n)}</span>\n  <h1>', 1)
    tabs = "".join(
        f'<a class="tb{" cur" if k == n else ""}" href="lesson-{k}.html"{" aria-current=page" if k == n else ""}>{label(k, False)}</a>'
        for k in DEVICES[dev][3])
    if dev == "t8":
        tabs += '<a class="tb" href="map.html">▦ מה אפשר לעשות</a>' + SETTAB
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
<title>{title} · {label(n)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">{chr(10) + '<link rel="stylesheet" href="kit.css">' if n in KIT_LESSONS else ""}
{NAVCSS}
</head>
<body data-lesson="{n}">
<div class="toolbar"><div class="in"><a class="tb" href="index.html">⌂ הבית</a>{tabs}<button class="tb play" id="playmode" type="button">▶ מצב נגינה</button><a class="tb" href="notebook.html">☆ פנקס</a><a class="tb" href="glossary.html">א־ת מילון</a><span class="sp"></span><span class="ver">גרסת קלוד</span><button class="tb" id="wake" type="button">☀ מסך דלוק</button></div></div>
<div class="wrap">
{html}
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
{KITJS if n in KIT_LESSONS else ""}{T8JS if n in T8_LESSONS else ""}{NAVJS}</body>
</html>
"""
    (HERE / f"lesson-{n}.html").write_text(out, encoding="utf8")
    return total


def hub(totals, mtotal):
    """index.html: Claude's home. Grouped by device; each device numbers its own lessons from 1."""
    secs = ""
    icons = {"t8": "🥁", "volca": "🎛️"}
    for dev, (name, code, sub, nums) in DEVICES.items():
        tiles = ""
        for n in nums:
            title, desc = LESSONS[n]
            k = DEV[n][1]
            tiles += f"""<li><a class="tile" href="lesson-{n}.html" data-l="{n}"><span class="bub">{k}</span><div class="tx"><span class="kind">שיעור {k}</span><h3>{title}</h3><p>{desc}</p>
<div data-progress="l{n}" data-total="{totals[n]}"><div class="bar"><div class="progress"><span style="width:0"></span></div></div><small class="ptxt">0 מתוך {totals[n]} כרטיסים</small></div></div></a></li>
"""
        if dev == "t8":
            tiles += f"""<li><a class="tile ref" href="map.html"><span class="bub">▦</span><div class="tx"><span class="kind">דף עזר</span><h3>מה אפשר לעשות</h3><p>{mtotal} דברים שהטי־8 יודע לעשות. מחפשים לפי מה שרוצים או לפי כפתור, ונכנסים לכרטיס שמלמד.</p></div></a></li>
<li><a class="tile ref" href="settings.html"><span class="bub">💾</span><div class="tx"><span class="kind">דף עזר</span><h3>מה נשמר ומה נמחק</h3><p>לכל הגדרה: האם היא נשמרת עם התבנית, האם מחיקה מוחקת אותה, ומה נשאר תמיד. בדוק מול המדריך.</p></div></a></li>
"""
        secs += f"""<section class="dev {dev}" id="{dev}">
<div class="dhead"><span class="ico" aria-hidden="true">{icons[dev]}</span><div><h2>{name}</h2><p>{sub} <span class="code">{code}</span></p></div></div>
<ol class="tiles">
{tiles}</ol>
</section>
"""
    out = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#1d2433">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="השיעורים שלי">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<title>השיעורים שלי</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">
<style>
:root{{--t8:#e0561b;--volca:#12907f}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--t8:#ff8a4c;--volca:#3fd0bb}}}}
:root[data-theme="dark"]{{--t8:#ff8a4c;--volca:#3fd0bb}}
.wrap{{max-width:900px;gap:22px;padding-top:max(22px,env(safe-area-inset-top,0px))}}
.hello{{display:flex;flex-direction:column;gap:6px}}
.hello h1{{font-size:2.3rem}}
.hello p{{color:var(--muted)}}
.resume{{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:22px;text-decoration:none;color:#fff;
  background:linear-gradient(135deg,var(--dev),color-mix(in srgb,var(--dev) 70%,#000));box-shadow:0 8px 22px color-mix(in srgb,var(--dev) 35%,transparent)}}
.resume[hidden]{{display:none}}
.resume .pl{{flex:none;width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center;font-size:1.4rem}}
.resume small{{display:block;opacity:.85;font-weight:600}}
.resume b{{font-family:var(--f-display);font-weight:400;font-size:1.3rem;line-height:1.25}}
.resume:active,.tile:active{{transform:scale(.98)}}
.dev{{--dev:var(--t8);display:flex;flex-direction:column;gap:14px;padding:18px 14px;border-radius:26px;
  background:color-mix(in srgb,var(--dev) 9%,var(--bg));border:2px solid color-mix(in srgb,var(--dev) 22%,transparent)}}
.dev.volca{{--dev:var(--volca)}}
.dhead{{display:flex;align-items:center;gap:14px;padding-inline:4px}}
.ico{{flex:none;width:60px;height:60px;border-radius:20px;background:var(--dev);display:grid;place-items:center;font-size:2rem;
  box-shadow:0 5px 0 color-mix(in srgb,var(--dev) 65%,#000);transform:rotate(-4deg)}}
.dhead h2{{font-size:1.75rem;color:var(--fg)}}
.dhead p{{color:var(--muted);font-size:.95rem}}
.code{{font-family:var(--f-mono);font-size:.78rem;font-weight:600;direction:ltr;unicode-bidi:isolate;white-space:nowrap;
  border:1px solid var(--line);border-radius:6px;padding:1px 6px;background:var(--surface)}}
.tiles{{list-style:none;margin:0;padding:0;display:grid;gap:12px}}
@media (min-width:700px){{.tiles{{grid-template-columns:1fr 1fr}}}}
.tile{{display:flex;gap:14px;align-items:flex-start;height:100%;padding:16px;border-radius:20px;background:var(--surface);
  color:var(--fg);text-decoration:none;border:1px solid var(--line);box-shadow:0 3px 0 color-mix(in srgb,var(--dev) 25%,var(--line));transition:transform .08s}}
.bub{{flex:none;width:52px;height:52px;border-radius:50%;background:var(--dev);color:#fff;display:grid;place-items:center;
  font-family:var(--f-display);font-size:1.6rem;line-height:1}}
.tile.done .bub{{background:var(--ok);font-size:1.4rem}}
.tile.ref{{border:2px dashed color-mix(in srgb,var(--dev) 55%,transparent);box-shadow:none;background:color-mix(in srgb,var(--dev) 5%,var(--surface))}}
.tile.ref .bub{{background:var(--fg);color:var(--dev)}}
.tx{{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}}
.kind{{font-weight:700;font-size:.82rem;color:var(--dev);letter-spacing:.02em}}
.tx h3{{font-size:1.25rem}}
.tx p{{color:var(--muted);font-size:.95rem;line-height:1.5}}
.tx .bar{{margin-top:8px}}
.tx .progress{{height:8px;border-radius:99px;background:color-mix(in srgb,var(--dev) 15%,var(--bg));overflow:hidden}}
.tx .progress span{{display:block;height:100%;border-radius:99px;background:var(--dev)}}
.tx small{{color:var(--muted);font-size:.85rem}}
.tile.done small{{color:var(--ok);font-weight:700}}
.install{{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px 16px;color:var(--muted)}}
.install summary{{cursor:pointer;font-weight:700;color:var(--fg)}}
.install ol{{margin:10px 0 0;padding-inline-start:22px;display:flex;flex-direction:column;gap:4px}}
</style>
</head>
<body>
<div class="wrap">
<header class="hello"><h1>מה מנגנים היום?</h1><p>בוחרים מכשיר ושיעור. ההתקדמות נשמרת באייפד, ובכל דף יש כפתור חזרה למטה.</p></header>
<a class="resume" id="resume" href="#" hidden><span class="pl" aria-hidden="true">▶</span><span><small>להמשיך מאיפה שעצרת</small><b id="resume-t"></b></span></a>
{secs}<details class="install"><summary>לשמור את העמוד הזה במסך הבית</summary>
<ol>
<li>פתח את העמוד הזה בספארי.</li>
<li>גע בכפתור השיתוף, הריבוע עם החץ למעלה.</li>
<li>בחר ״הוספה למסך הבית״.</li>
<li>את האייקון הישן אפשר למחוק: לוחצים עליו לחיצה ארוכה, ״הסר״.</li>
</ol>
</details>
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
<script>
(function(){{
var L={{{", ".join(f'"{n}":["{label(n)}","{LESSONS[n][0]}","{DEV[n][0]}"]' for n in LESSONS)}}};
function get(k,d){{ try{{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }}catch(e){{ return d; }} }}
var done=get("ml2:done",{{}});
[].forEach.call(document.querySelectorAll(".tile[data-l]"),function(a){{
  var p=a.querySelector("[data-progress]"), n=a.dataset.l, tot=+p.dataset.total, c=0;
  Object.keys(done).forEach(function(k){{ if(k.indexOf("l"+n+":")===0) c++; }});
  if(tot && c>=tot){{ a.classList.add("done"); a.querySelector(".bub").textContent="✓"; p.querySelector(".ptxt").textContent="✓ סיימת את כל הכרטיסים"; }}
}});
var last=get("ml2:last",null), r=document.getElementById("resume");
if(last && L[last.l]){{ r.href="lesson-"+last.l+".html"; document.getElementById("resume-t").textContent=L[last.l][0]+": "+L[last.l][1];
  r.style.setProperty("--dev","var(--"+L[last.l][2]+")"); r.hidden=false; }}
}})();
</script>
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
    tabs = ""
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
{NAVCSS}
</head>
<body>
<div class="toolbar"><div class="in"><a class="tb" href="index.html">⌂ הבית</a>{tabs}{links}<span class="sp"></span><span class="ver">גרסת קלוד</span></div></div>
<div class="wrap">
<header style="display:flex;flex-direction:column;gap:8px"><h1>{title}</h1><p class="lede">{lede}</p></header>
{body}
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
{NAVJS}</body>
</html>
"""
    (HERE / f"{key}.html").write_text(out, encoding="utf8")


def map_page(t8map):
    """map.html: everything you can do on the T-8, by goal and by button (data in src/tricks.py)."""
    import tricks, html as H
    total = 0
    sections, chips = [], []
    for gid, gname, gsub, items in tricks.GOALS:
        chips.append(f'<a href="#g-{gid}">{gname}</a>')
        rows = []
        for tid, title, line, seq, cards, extra, also in items:
            total += 1
            ctl = []
            for part in (seq.split(",") if seq else []):
                verb, _, key = part.partition(":")
                if verb not in ("hold", "tap", "turn"):
                    continue
                cid = "s" + key if key.isdigit() else (t8map.ALIAS.get(key) or [None])[0]
                assert cid, ("unknown control", tid, key)
                if cid not in ctl:
                    ctl.append(cid)
            for c in extra:
                assert c in t8map.C, ("unknown control", tid, c)
                if c not in ctl:
                    ctl.append(c)
            keys, links = [], []
            for c in cards:
                n, _, num = c.partition(":")
                n = int(n)
                assert n in LESSONS, c
                if num.replace(".", "").isdigit():
                    anchor = f"l{n}-" + num.replace(".", "-")
                    keys.append(f"l{n}:{num}")
                    lbl = f"{label(n, False)} · {num}"
                else:
                    anchor, lbl = num, label(n, False)
                src = (HERE / f"lesson-{n}.html").read_text(encoding="utf8")
                assert f'id="{anchor}"' in src, ("missing card", tid, c)
                links.append(f'<a class="go" href="lesson-{n}.html#{anchor}">ללמוד: {lbl}</a>')
            combo = f'<div class="combo" data-seq="{H.escape(seq)}" data-title="איך"></div>' if seq else ""
            knobs = "" if seq else '<p class="knobs">' + " ".join(f"<kbd>{H.escape(t8map.C[c][5] or t8map.C[c][0])}</kbd>" for c in extra if t8map.C[c][5]) + "</p>"
            rows.append(f'<div class="trick" id="t-{tid}" data-ctl="{" ".join(ctl)}" data-cards="{" ".join(keys)}">'
                        f'<div class="tt"><span class="mark" aria-hidden="true"></span><b>{title}</b></div><p>{line}</p>{combo}{knobs}'
                        f'<div class="links">{"".join(links)}</div></div>')
        sections.append(f'<section class="goal" id="g-{gid}"><h2>{gname}</h2><p class="sub">{gsub}</p><div class="tricks">{"".join(rows)}</div></section>')
    tabs = "".join(f'<a class="tb" href="lesson-{k}.html">{label(k, False)}</a>' for k in DEVICES["t8"][3])
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
<title>מה אפשר לעשות בטי־8 · גרסת קלוד</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">
<link rel="stylesheet" href="kit.css">
<link rel="stylesheet" href="map.css">
{NAVCSS}
</head>
<body data-t8="map">
<div class="toolbar"><div class="in"><a class="tb" href="index.html">⌂ הבית</a><a class="tb cur" href="map.html">▦ מה אפשר לעשות</a>{SETTAB}{tabs}<span class="sp"></span><span class="ver">גרסת קלוד</span></div></div>
<div class="wrap">
<header style="display:flex;flex-direction:column;gap:8px">
  <h1>מה אפשר לעשות בטי־8</h1>
  <p class="lede">כל מה שהמכשיר יודע, מכל שיעורי הטי־8, במקום אחד. {total} דברים. לכל אחד: מה הוא עושה, איך עושים, ואיפה לומדים אותו.</p>
  <p class="progress-line" id="mp-prog"></p>
</header>
<div class="mviews" role="tablist">
  <button type="button" class="mv" role="tab" id="mv-goal" aria-selected="true">לפי מה שרוצים</button>
  <button type="button" class="mv" role="tab" id="mv-btn" aria-selected="false">לפי כפתור</button>
</div>
<div id="view-goal">
  <nav class="gjump" aria-label="מטרות">{"".join(chips)}</nav>
  {"".join(sections)}
</div>
<div id="view-btn" hidden>
  <p class="lede">נוגעים בכפתור בתרשים, ורואים את כל מה שאפשר לעשות איתו.</p>
  <div id="mp-map"></div>
  <div id="mp-sel" class="t8-info" aria-live="polite"><b>גע בכפתור בתרשים</b><p>יופיעו כאן כל הדברים שהוא משתתף בהם.</p></div>
  <div id="mp-list" class="tricks"></div>
</div>
<p class="legend">✓ = סימנת ״סיימתי״ בכרטיס שמלמד את זה. הסימונים נשמרים באייפד הזה.</p>
</div>
<script src="kit.js"></script>
<script src="t8-data.js"></script>
<script src="t8.js"></script>
<script src="map.js"></script>
{NAVJS}</body>
</html>
"""
    (HERE / "map.html").write_text(out, encoding="utf8")
    return total


def settings_page(S):
    """settings.html: what the T-8 keeps with a pattern, what clearing wipes, what stays (data in src/settings.py)."""
    MARK = {"yes": "✓", "no": "✕", "dash": "–", "q": "?"}
    head = "".join(f"<th>{q}</th>" for q in ("נשמר עם התבנית?", "מחיקה מוחקת?", "נשאר תמיד?"))
    mx = ""
    for gid, title, _line, ans, _rows in S.GROUPS:
        cells = "".join(f'<td class="m-{m}"><b aria-hidden="true">{MARK[m]}</b><small>{t}</small></td>' for m, t in ans)
        mx += f'<tr class="g-{gid}"><th><a href="#g-{gid}"><i aria-hidden="true"></i>{title}</a></th>{cells}</tr>'

    def at(cards):
        """Links to the cards that teach it, grouped by lesson: "שיעור 3: 1.2 1.4" """
        by = {}
        for c in cards:
            by.setdefault(int(c.partition(":")[0]), []).append(c)
        parts = "".join(f'<span class="atl">{label(n, False)}:</span>' + "".join(f'<a class="xref" href="{xref_href(c)}">{c.partition(":")[2]}</a>' for c in cs)
                        for n, cs in by.items())
        return f'<p class="at"><b>לומדים:</b>{parts}</p>' if cards else ""

    acts = ""
    for name, how, what, card, src in S.ACTIONS:
        url = S.SRC[src][0]
        acts += (f'<div class="act"><h3>{name}</h3><p class="how">{how}</p><p>{what} '
                 f'<a class="src man" href="{url}" target="_blank" rel="noopener">📖 במדריך</a></p>{at([card])}</div>')

    groups = ""
    for gid, title, line, _ans, rows in S.GROUPS:
        cards = ""
        for rid, name, how, note, rcards, src in rows:
            if src:
                badge = f'<a class="src man" href="{S.SRC[src][0]}" target="_blank" rel="noopener">📖 במדריך</a>'
            else:
                badge = "" if gid == "unknown" else '<span class="src no">🔍 לא כתוב במדריך</span>'
            cards += (f'<article class="card set-row" id="set-{rid}"><div class="sr-top"><h3>{name}</h3>{badge}</div>'
                      + (f'<p class="how">{how}</p>' if how else "") + (f'<p class="note">{note}</p>' if note else "")
                      + at(rcards) + "</article>\n")
        test = S.TEST if gid == "unknown" else ""
        groups += (f'<section class="sgroup g-{gid}" id="g-{gid}"><div class="sg-head"><span class="dot" aria-hidden="true"></span>'
                   f'<div><h2>{title}</h2><p>{line}</p></div></div><div class="sg-rows">{cards}</div>{test}</section>\n')

    srcs = "".join(f'<li><a href="{u}" target="_blank" rel="noopener">{t}</a></li>' for u, t in S.SRC.values())
    tabs = "".join(f'<a class="tb" href="lesson-{k}.html">{label(k, False)}</a>' for k in DEVICES["t8"][3])
    body = macros(xrefs(f"""<header style="display:flex;flex-direction:column;gap:8px">
  <span class="eyebrow t8">טי־8 · דף עזר</span>
  <h1>מה נשמר, מה נמחק, מה נשאר</h1>
  <p class="lede">כל הגדרה שהשיעורים משנים, בארבע קבוצות לפי צבע. כל שורה בדוקה מול המדריך הרשמי, גרסה 1.02. מה שהמדריך לא אומר, צהוב. גם בכרטיסים בשיעורים יש עכשיו שורה בצבע של הקבוצה.</p>
</header>
<div class="tbl-box set-sum"><table class="set-mx"><thead><tr><th></th>{head}</tr></thead><tbody>{mx}</tbody></table></div>
<section class="sgroup g-act" id="g-act"><div class="sg-head"><span class="dot" aria-hidden="true"></span><div><h2>חמש פעולות שקובעות הכל</h2><p>מה כל אחת עושה לתבנית.</p></div></div>
<div class="acts">{acts}</div>
<p class="info">מחקת בטעות? כל עוד לא שמרת, שחזור (<kbd>PATTERN</kbd> + <kbd>16</kbd>) או כיבוי מחזירים את מה ששמרת.</p></section>
{groups}<section class="set-srcs"><h2>מקורות</h2><p>המדריך הרשמי של הטי־8, גרסה 1.02:</p><ul>{srcs}</ul>
<p>מה שלא כתוב שם מסומן בכל שורה. ספר לי מה ראית על המכשיר, ואעדכן.</p></section>"""))
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
<title>מה נשמר ומה נמחק בטי־8 · גרסת קלוד</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="app.css">
<link rel="stylesheet" href="kit.css">
{NAVCSS}
</head>
<body>
<div class="toolbar"><div class="in"><a class="tb" href="index.html">⌂ הבית</a><a class="tb" href="map.html">▦ מה אפשר לעשות</a><a class="tb cur" href="settings.html">💾 מה נשמר</a>{tabs}<span class="sp"></span><span class="ver">גרסת קלוד</span></div></div>
<div class="wrap set-page">
{body}
</div>
<script src="app.js"></script>
<script src="extras.js"></script>
{NAVJS}</body>
</html>
"""
    (HERE / "settings.html").write_text(out, encoding="utf8")


def check_links():
    """Every in-site link with an anchor on Claude's pages must land on an element with that id."""
    ids = {}
    for p in HERE.glob("*.html"):
        ids[p.name] = set(re.findall(r'\bid="([^"]+)"', p.read_text(encoding="utf8")))
    bad = []
    for name in ids:
        for href in re.findall(r'href="([^"#]*)#([^"]+)"', (HERE / name).read_text(encoding="utf8")):
            target = href[0] or name
            if target in ids and href[1] not in ids[target]:
                bad.append((name, href[0] + "#" + href[1]))
    assert not bad, ("links to missing anchors", bad)


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(SRC))
    import t8map
    t8map.build()
    totals = {n: page(n) for n in LESSONS}
    for k in TOOLS:
        tool_page(k)
    mtotal = map_page(t8map)
    import settings
    settings_page(settings)
    hub(totals, mtotal)
    check_links()
    print("map", mtotal)
    print("built", totals)
