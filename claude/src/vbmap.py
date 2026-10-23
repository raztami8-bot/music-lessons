"""Draw the Volca Bass panel: figures in img/vb-*.svg and vb-data.js (window.VB, also window.PANEL).
Same data shape as t8map.py (svg, info, names, areas, alias), so t8.js, kit.js and map.js work with either panel.
Layout follows the photo img/l2-00.webp, left to right, and the official owner's manual for what each control does.
Run: python3 src/vbmap.py   (from the claude folder). build.py runs it too."""
import pathlib, html, json

OUT = pathlib.Path(__file__).resolve().parent.parent / "img"
W, H = 1000, 552
BADGE = "#f2c94c"

C = {}  # id -> (kind, x, y, w, h, label, extra)


def knob(id, cx, cy, r, label):
    C[id] = ("knob", cx, cy, r, r, label, None)


def btn(id, x, label, sub="", cls="btn"):
    C[id] = ("btn", x, 340, 78, 36, label, (cls, sub))


def jack(id, cx, r, label):
    C[id] = ("jack", cx, 70, r, r, label, None)


# top strip: power, EG and tempo knobs, jacks
C["power"] = ("round", 60, 70, 20, 20, "ON", None)
knob("tempo", 255, 70, 18, "TEMPO")
knob("attack", 365, 70, 18, "ATTACK")
knob("decay", 482, 70, 18, "DECAY/RELEASE")
knob("egint", 605, 70, 18, "CUTOFF EG INT")
jack("midiin", 720, 28, "MIDI IN")
jack("syncin", 808, 15, "SYNC IN")
jack("syncout", 872, 15, "SYNC OUT")
jack("phones", 950, 15, "PHONES")

# middle row: big knobs
knob("octave", 80, 228, 32, "OCTAVE")
knob("peak", 200, 228, 28, "PEAK")
knob("cutoff", 330, 228, 46, "CUTOFF")
knob("rate", 470, 228, 28, "RATE")
knob("lfoint", 580, 228, 28, "INT")
knob("pitch1", 690, 228, 17, "PITCH 1")
knob("pitch2", 775, 228, 17, "PITCH 2")
knob("pitch3", 860, 228, 17, "PITCH 3")
knob("volume", 950, 228, 26, "VOLUME")

# display and the button row
C["display"] = ("disp", 24, 326, 176, 64, "", None)
btn("memory", 222, "MEMORY", "WRITE")
btn("stepmode", 310, "STEP MODE", "SLIDE EDIT")
btn("play", 398, "▶", "ACTIVE STEP", "play")
btn("rec", 486, "●", "STEP REC", "rec")
btn("vco1", 574, "VCO1", "MUTE")
btn("vco2", 662, "VCO2", "MUTE")
btn("vco3", 750, "VCO3", "MUTE")
btn("func", 860, "FUNC", "", "func")

FRAMES = [(330, 18, 310, "EG"), (170, 150, 210, "VCF"), (440, 150, 170, "LFO"), (665, 150, 220, "VCO")]

NOTES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"]
GOLD = {2, 5, 7, 10, 12, 14}
FUNCS = ["GROUP 1", "GROUP 2", "GROUP 3", "LFO AMP", "LFO PITCH", "LFO CUTOFF", "LFO WAVE", "WAVE 1",
         "WAVE 2", "WAVE 3", "SUSTAIN", "AMP EG", "CLR SLIDE", "CLR ACT", "CLR PART", "CLR ALL"]
for i in range(16):
    C["s%d" % (i + 1)] = ("key", 22 + i * 60.4, 428, 50, 74, NOTES[i], FUNCS[i])

GROUPS = {
    "top": ["power", "tempo", "attack", "decay", "egint", "midiin", "syncin", "syncout", "phones"],
    "sound": ["octave", "peak", "cutoff", "rate", "lfoint", "pitch1", "pitch2", "pitch3", "volume"],
    "buttons": ["display", "memory", "stepmode", "play", "rec", "vco1", "vco2", "vco3", "func"],
    "keys": ["s%d" % i for i in range(1, 17)],
}

AREAS = [
    ["למעלה: הדלקה, קצב, מעטפת ושקעים", GROUPS["top"]],
    ["באמצע: הצליל", GROUPS["sound"]],
    ["התצוגה והלחצנים", GROUPS["buttons"]],
    ["16 הקלידים", GROUPS["keys"]],
]

# What each control does. From the official owner's manual of the Volca Bass, and lessons 1 to 3 of the Volcas.
INFO = {
    "power": "הדלקה. כיבוי: מחזיקים כשנייה.",
    "tempo": "קצב הרצף. כשמחובר כבל ל־SYNC IN, הוולקה מתעלמת ממנו והולכת אחרי הקצב שנכנס.",
    "attack": "כמה מהר התו עולה. עד הסוף שמאלה: מיד.",
    "decay": "כמה מהר התו דועך. כש־SUSTAIN דולק (FUNC + 11), זה זמן הדעיכה אחרי שעוזבים את הקליד.",
    "egint": "כמה המעטפת פותחת את המסנן בכל תו. ה״וואו״.",
    "midiin": "כניסת MIDI ממכשיר אחר.",
    "syncin": "כניסת קצב. כבל מונו. כשמחובר כאן משהו, הוולקה מתקדמת צעד לפי הטיקים שנכנסים.",
    "syncout": "יציאת קצב למכשיר אחר. כבל מונו.",
    "phones": "יציאת השמע: אוזניות, מיקסר, או MIX IN של הטי־8. מחברים כאן, והרמקול הקטן שותק.",
    "octave": "האזור של הקלידים, בקפיצות מ־1 עד 6. המספר מופיע בתצוגה. בוחרים לפני שכותבים רצף.",
    "peak": "תהודה: צפצוף סביב נקודת החיתוך. גבוה: צורח. נמוך: עגול.",
    "cutoff": "בהירות. שמאלה עמום, ימינה בהיר. הכפתור הראשי של הסיבובים.",
    "rate": "המהירות של התנועה המחזורית (LFO).",
    "lfoint": "העומק של התנועה המחזורית. עד הסוף שמאלה: אין תנועה.",
    "pitch1": "הגובה של מתנד 1, עד אוקטבה למעלה או למטה. באמצע: בדיוק על התו.",
    "pitch2": "הגובה של מתנד 2. קצת מהמרכז: צליל רחב. רחוק: מרווח או אקורד.",
    "pitch3": "הגובה של מתנד 3.",
    "volume": "עוצמת היציאה.",
    "display": "ארבע ספרות. מראה את הערך של מה שמסובבים או לוחצים, למשל oct 3 או את הקצב.",
    "memory": "טעינה: MEMORY ואז קליד 1 עד 8. עם FUNC: שמירה (WRITE).",
    "stepmode": "מצב צעדים: הקלידים מדליקים ומכבים צעדים של המתנד הנבחר. עם FUNC: עריכת גלישות.",
    "play": "נגינה ועצירה. עם FUNC: צעדים פעילים, איזה צעד בכלל קיים בלולאה.",
    "rec": "הקלטה בזמן אמת. עם FUNC: הקלטת צעדים, קליד אחד לכל צעד. בתוך הקלטת צעדים: שתיקה.",
    "vco1": "בוחר את מתנד 1: עליו מנגנים ואותו עורכים. עם FUNC: השתקה.",
    "vco2": "בוחר את מתנד 2. עם FUNC: השתקה.",
    "vco3": "בוחר את מתנד 3. עם FUNC: השתקה.",
    "func": "לבד לא עושה כלום. מחזיקים אותו, והקלידים והלחצנים עושים את מה שכתוב מתחתם. גם יציאה מהקלטת צעדים ומצעדים פעילים.",
}
KEYS = [
    "קיבוץ: שלושת המתנדים נפרדים, כל אחד עם רצף משלו.",
    "קיבוץ: מתנדים 1 ו־2 יחד, 3 לבד.",
    "קיבוץ: שלושתם יחד, צליל אחד עבה.",
    "תנועה מחזורית על העוצמה.",
    "תנועה מחזורית על הגובה.",
    "תנועה מחזורית על המסנן.",
    "צורת התנועה. כבויה: משולש, חלק. דולקת: מרובע, קופץ.",
    "גל של מתנד 1. כבויה: מסור. דולקת: מרובע.",
    "גל של מתנד 2.",
    "גל של מתנד 3.",
    "החזקה: התו נשמע כל עוד מחזיקים את הקליד.",
    "המעטפת שולטת גם בעוצמה, לא רק במסנן.",
    "מוחק את כל הגלישות של המתנד הנבחר.",
    "מוחק את הצעדים הפעילים של המתנד הנבחר.",
    "מוחק את הרצף של המתנד הנבחר.",
    "מוחק את הרצף של כל המתנדים.",
]
for i in range(16):
    s = f"כקליד: התו {NOTES[i]}. עם FUNC: {KEYS[i]}"
    if i < 8:
        s += f" אחרי MEMORY: מקום זיכרון {i + 1}."
    INFO["s%d" % (i + 1)] = s

ALIAS = {}


def _al(key, id):
    ALIAS.setdefault(key, [])
    if id not in ALIAS[key]:
        ALIAS[key].append(id)


for id, v in C.items():
    if v[0] != "key" and v[5]:
        _al(v[5], id)
for i in range(1, 17):
    _al(str(i), "s%d" % i)
for k, ids in {"PLAY": ["play"], "REC": ["rec"], "LFO INT": ["lfoint"], "EG INT": ["egint"], "DECAY": ["decay"],
               "MUTE": ["vco1", "vco2", "vco3"], "WRITE": ["memory"], "SLIDE EDIT": ["stepmode"],
               "ACTIVE STEP": ["play"], "STEP REC": ["rec"]}.items():
    for id in ids:
        _al(k, id)
_al("⏻", "power")


def center(id):
    k, x, y, w, h, _, _ = C[id]
    if k in ("knob", "jack", "round"):
        return x, y, w
    return x + w / 2, y + h / 2, max(w, h) / 2


def draw(id, on):
    k, x, y, w, h, label, extra = C[id]
    s = f'<g opacity="{"1" if on else "0.28"}">'
    lab = html.escape(label)
    if k == "knob":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#b9bdc6" stroke="#6d7280" stroke-width="2"/>'
        s += f'<line x1="{x}" y1="{y - w + 4}" x2="{x}" y2="{y - w * 0.3:.0f}" stroke="#1d2433" stroke-width="3" stroke-linecap="round"/>'
        s += f'<text x="{x}" y="{y - w - 9}" class="l">{lab}</text>'
    elif k == "jack":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#2a2c33" stroke="#6d7280" stroke-width="2"/><circle cx="{x}" cy="{y}" r="{max(6, w // 3)}" fill="#0c0d10"/>'
        s += f'<text x="{x}" y="{y + w + 17}" class="l xs">{lab}</text>'
    elif k == "round":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#1d2433"/><text x="{x}" y="{y + 6}" class="b" style="fill:#e8ecf4;font-size:13px">{lab}</text>'
    elif k == "disp":
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#0c0d10" stroke="#6d7280"/>'
        s += f'<text x="{x + w / 2}" y="{y + 44}" class="seg">notE</text>'
    elif k == "btn":
        cls, sub = extra
        fill = {"func": "#e8e9ee"}.get(cls, "#cfd2da")
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="#6d7280"/>'
        s += f'<text x="{x + w / 2}" y="{y - 8}" class="l">{lab}</text>' if label not in ("▶", "●") else \
             f'<text x="{x + w / 2}" y="{y - 6}" class="l" style="font-size:18px">{lab}</text>'
        if sub:
            s += f'<text x="{x + w / 2}" y="{y + h + 16}" class="l xs">{html.escape(sub)}</text>'
    elif k == "key":
        n = int(id[1:])
        s += f'<rect x="{x:.1f}" y="{y}" width="{w}" height="{h}" rx="5" fill="{"#d8b56a" if n in GOLD else "#2a2c33"}" stroke="#8a8f9c"/>'
        num = f"M{n}" if n <= 8 else str(n)
        s += f'<text x="{x + w / 2:.1f}" y="{y + 50}" class="b" style="fill:{"#1d2433" if n in GOLD else "#e8ecf4"};font-size:15px">{num}</text>'
        s += f'<text x="{x + w / 2:.1f}" y="{y + 20}" class="l xs" style="fill:{"#1d2433" if n in GOLD else "#9aa4b8"}">{lab}</text>'
        for j, t in enumerate(extra.split(" ")):
            s += f'<text x="{x + w / 2:.1f}" y="{y + h + 15 + j * 12}" class="l xs" style="fill:#aeb6c6">{html.escape(t)}</text>'
    return s + "</g>"


STYLE = ('text{font-family:Assistant,Arial,sans-serif;text-anchor:middle}'
         '.l{font-size:13px;font-weight:700;fill:#2a2f3a}.s{font-size:12px}.xs{font-size:10px}'
         '.b{font-size:12px;font-weight:700;fill:#1d2433}.h{font-size:15px;font-weight:700;fill:#2a2f3a}'
         '.seg{font-family:"IBM Plex Mono",monospace;font-size:32px;font-weight:600;fill:#ff3b30}'
         '.k{font-size:17px;font-weight:800;fill:#1d2433}')


def body(scope=""):
    st = STYLE
    if scope:  # prefix every rule, so the page's other svgs keep their own styles
        st = "".join(f".{scope} {r}}}" for r in STYLE.split("}") if r).replace(f".{scope} text{{", f".{scope} text{{pointer-events:none;")
    s = [f'<style>{st}</style>',
         f'<rect x="3" y="3" width="{W - 6}" height="{H - 6}" rx="22" fill="#dfe2e8" stroke="#9aa0ad" stroke-width="2"/>',
         f'<rect x="10" y="408" width="{W - 20}" height="{H - 418}" rx="12" fill="#14161b"/>',
         '<text x="140" y="118" class="h" style="font-size:24px;font-weight:800">KORG</text>',
         '<text x="880" y="140" class="h" style="font-size:18px">volca bass</text>']
    for x, y, w, lab in FRAMES:
        s.append(f'<line x1="{x}" y1="{y}" x2="{x + w}" y2="{y}" stroke="#9aa0ad" stroke-width="2"/>')
        s.append(f'<rect x="{x + w / 2 - 22}" y="{y - 11}" width="44" height="20" fill="#dfe2e8"/><text x="{x + w / 2}" y="{y + 5}" class="l">{lab}</text>')
    return s


def svg(name, on=(), marks=()):
    on = set(on) | set(marks)
    if not on:
        on = set(C)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" direction="ltr">'] + body()
    for id in C:
        s.append(draw(id, id in on))
    for n, id in enumerate(marks, 1):
        cx, cy, r = center(id)
        bx, by = cx + r * 0.75 + 6, cy - r * 0.75 - 6
        s.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="14" fill="{BADGE}" stroke="#1d2433" stroke-width="2"/>'
                 f'<text x="{bx:.0f}" y="{by + 6:.0f}" class="k">{n}</text>')
    s.append("</svg>")
    (OUT / f"{name}.svg").write_text("\n".join(s), encoding="utf8")


def hitbox(id):
    k, x, y, w, h, _, _ = C[id]
    if k in ("knob", "jack", "round"):
        r = max(w, 22)
        return x - r - 6, y - r - 24, 2 * r + 12, 2 * r + 34
    if k == "key":
        return x - 4, y - 4, w + 8, h + 34
    if k == "btn":
        return x - 4, y - 26, w + 8, h + 48
    return x - 6, y - 6, w + 12, h + 12


def interactive():
    """One SVG for tours and drills: every control is a <g class="ctl" data-id>, with a big transparent hit area."""
    s = [f'<svg class="vbi" viewBox="0 0 {W} {H}" direction="ltr" role="img" aria-label="תרשים הלוח של הוולקה בס">'] + body("vbi")
    for id in C:
        hx, hy, hw, hh = hitbox(id)
        g = draw(id, True).replace('<g opacity="1">', "", 1)[:-4]
        s.append(f'<g class="ctl" data-id="{id}"><rect class="hl" x="{hx:.0f}" y="{hy:.0f}" width="{hw:.0f}" height="{hh:.0f}" rx="12"/>'
                 f'{g}<rect class="hit" x="{hx:.0f}" y="{hy:.0f}" width="{hw:.0f}" height="{hh:.0f}"/></g>')
    s.append("</svg>")
    return "".join(s)


def write_data():
    names = {id: C[id][5] for id in C}
    for i in range(1, 17):
        names["s%d" % i] = "קליד %d" % i
    names.update({"display": "התצוגה", "play": "▶ PLAY", "rec": "● REC", "power": "הדלקה"})
    data = {"svg": interactive(), "info": INFO, "names": names, "areas": AREAS, "alias": ALIAS, "stepWord": "קליד", "name": "הוולקה בס"}
    (OUT.parent / "vb-data.js").write_text("window.VB=" + json.dumps(data, ensure_ascii=False) + ";window.PANEL=window.VB;\n", encoding="utf8")


# Figures for the Volca Bass lessons. Order of marks = order of the legend in build.py.
FIGS = {
    "vb-00": ((), ["tempo", "cutoff", "display", "func", "s1"]),
    "vb-01": (["func", "s1", "s2", "s3", "vco1", "vco2", "vco3", "s15", "s16"], ["func", "s1", "vco1", "vco2", "vco3", "s16"]),
    "vb-02": (["func", "play", "rec", "stepmode", "vco1", "vco2", "vco3", "display"], ["func", "play", "rec", "stepmode"]),
    "vb-03": (["func", "s4", "s5", "s6", "s7", "rate", "lfoint"], ["func", "s4", "s5", "s6", "s7", "rate", "lfoint"]),
    "vb-04": (["func", "stepmode", "s13", "decay", "attack"], ["func", "stepmode", "s13"]),
}


def build():
    OUT.mkdir(exist_ok=True)
    write_data()
    for name, (on, marks) in FIGS.items():
        svg(name, on=on or set(C), marks=marks)
    return list(FIGS)


if __name__ == "__main__":
    print(build())
