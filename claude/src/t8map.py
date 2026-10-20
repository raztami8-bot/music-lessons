"""Draw the T-8 panel map for lesson 4 as SVG files in img/.
A schematic, not a photo: areas follow the order of the official manual's panel description.
Each figure dims everything except the controls it is about, and puts numbered badges on them.
Run: python3 src/t8map.py   (from the claude folder). build.py runs it too."""
import pathlib, html

OUT = pathlib.Path(__file__).resolve().parent.parent / "img"
W, H = 1000, 606
BADGE = "#f2c94c"

C = {}  # id -> (kind, x, y, w, h, label, extra)


def knob(id, cx, cy, r, label):
    C[id] = ("knob", cx, cy, r, r, label, None)


def btn(id, x, y, w, h, label, cls="btn"):
    C[id] = ("btn", x, y, w, h, label, cls)


def jack(id, cx, label):
    C[id] = ("jack", cx, 56, 16, 16, label, None)


# top edge: jacks and volume
C["charge"] = ("led", 440, 56, 7, 7, "CHARGE", None)
jack("syncin", 560, "SYNC IN")
jack("syncout", 622, "SYNC OUT")
jack("mixin", 712, "MIX IN")
jack("mixout", 774, "MIX OUT")
knob("volume", 900, 56, 17, "VOLUME")

# common area
C["display"] = ("disp", 48, 128, 160, 58, "", None)
knob("tempo", 128, 240, 32, "TEMPO/VALUE")
btn("shift", 46, 306, 74, 34, "SHIFT")
btn("pattern", 136, 306, 74, 34, "PATTERN")
btn("play", 46, 370, 74, 36, "▶", "play")
btn("rec", 136, 370, 74, 36, "●", "rec")

FRAMES = [("common", 30, 195, ""), ("bd", 235, 100, "BASS DRUM"), ("sd", 345, 100, "SNARE DRUM"),
          ("tc", 455, 100, "TOM/CLAP"), ("hh", 565, 100, "HIHAT"), ("bass", 675, 200, "BASS"), ("fx", 885, 90, "FX")]

for key, x0 in (("bd", 235), ("sd", 345)):
    cx = x0 + 50
    knob(key + "lvl", cx, 160, 18, "LEVEL")
    knob(key + "tune", cx, 236, 14, "TUNE")
    C[key + "dec"] = ("round", cx, 304, 22, 22, "DECAY", None)
    btn(key, x0 + 12, 372, 76, 40, "BASS DRUM" if key == "bd" else "SNARE DRUM", "inst")

knob("tclvl", 505, 160, 18, "LEVEL")
knob("tctune", 505, 236, 14, "TUNE")
btn("clap", 467, 290, 76, 40, "HAND CLAP", "inst")
btn("tom", 467, 372, 76, 40, "TOM", "inst")

knob("hhlvl", 615, 160, 18, "LEVEL")
knob("hhdec", 615, 236, 14, "DECAY")
btn("ch", 577, 290, 76, 40, "CLOSED HIHAT", "inst")
btn("oh", 577, 372, 76, 40, "OPEN HIHAT", "inst")

knob("blvl", 725, 160, 18, "LEVEL")
knob("bpitch", 725, 236, 15, "PITCH")
knob("bdec", 725, 306, 15, "DECAY")
knob("cutoff", 825, 160, 16, "CUTOFF")
knob("reso", 825, 236, 15, "RESO")
knob("envmod", 825, 306, 15, "ENV MOD")
btn("bass", 690, 376, 70, 34, "BASS", "inst")
btn("kybd", 790, 376, 70, 34, "KYBD")

knob("delay", 930, 160, 16, "DELAY")
knob("reverb", 930, 236, 16, "REVERB")
btn("accent", 895, 376, 70, 34, "ACCENT")

NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "OCT-", "OCT+", "SLIDE"]
FUNCS = ["EXIT", "ENTER", "SHUFFLE", "LAST", "STEP|1-16", "STEP|17-32", "FILL|TRG", "FILL|PTN",
         "RANDOM|RHYTHM", "RANDOM|BASS", "PTN CLEAR|ALL", "PTN CLEAR|INST", "DELAY", "REVERB", "MENU", "WRITE"]
for i in range(16):
    C["s%d" % (i + 1)] = ("step", 34 + i * 58.5, 458, 44, 44, NOTES[i], FUNCS[i])

GROUPS = {
    "jacks": ["charge", "syncin", "syncout", "mixin", "mixout", "volume"],
    "common": ["display", "tempo", "shift", "pattern", "play", "rec"],
    "drums": ["bdlvl", "bdtune", "bddec", "bd", "sdlvl", "sdtune", "sddec", "sd", "tclvl", "tctune", "clap", "tom",
              "hhlvl", "hhdec", "ch", "oh"],
    "bass": ["blvl", "bpitch", "bdec", "cutoff", "reso", "envmod", "bass", "kybd"],
    "fx": ["delay", "reverb", "accent"],
    "steps": ["s%d" % i for i in range(1, 17)],
}


# ---------- what each control does (from the official manual, v1.02) ----------
AREAS = [
    ["למעלה: שקעים", ["charge", "syncin", "syncout", "mixin", "mixout", "volume"]],
    ["משותף", ["display", "tempo", "shift", "pattern", "play", "rec"]],
    ["קיק", ["bdlvl", "bdtune", "bddec", "bd"]],
    ["סנר", ["sdlvl", "sdtune", "sddec", "sd"]],
    ["קלאפ וטום", ["tclvl", "tctune", "clap", "tom"]],
    ["היי־האטים", ["hhlvl", "hhdec", "ch", "oh"]],
    ["בס", ["blvl", "bpitch", "bdec", "cutoff", "reso", "envmod", "bass", "kybd"]],
    ["אפקטים", ["delay", "reverb", "accent"]],
    ["שורת הצעדים", ["s%d" % i for i in range(1, 17)]],
]

INFO = {
    "charge": "נורית טעינה. כתום: נטען. ירוק: מלא. אדום כשאין כבל: הסוללה חלשה, והמכשיר ייכבה תוך כחצי שעה.",
    "syncin": "כניסת קצב ממכשיר אחר. כבל מונו. כשמחובר כאן משהו, הטי־8 הולך אחרי הקצב שנכנס.",
    "syncout": "יציאת קצב למכשיר אחר, למשל לוולקה. כבל מונו. לא מחברים כאן אוזניות.",
    "mixin": "כניסת שמע ממכשיר אחר. מה שנכנס כאן יוצא יחד עם הטי־8 מ־MIX OUT. כבל סטריאו.",
    "mixout": "יציאת השמע. כאן מחברים אוזניות או את המיקסר. כבל סטריאו.",
    "volume": "עוצמת היציאה מ־MIX OUT.",
    "display": "ארבע ספרות. בדרך כלל מראה את הקצב. כשמחזיקים לחצן או בתפריט, מראה את הערך שמשנים.",
    "tempo": "הכפתור הכי עסוק: משנה את מה שבתצוגה. רגיל: קצב. עם SHIFT: עשיריות של הקצב. כשמחזיקים צעד: ערך של הצעד.",
    "shift": "לבד לא עושה כלום. מחזיקים אותו כדי לקבל את הפעולה שכתובה בסוגריים מתחת ללחצני הצעדים. עם לחצן כלי: השתקה.",
    "pattern": "בחירת תבנית: לחצני הצעדים הופכים לתבניות 1 עד 16. מחזיקים ולוחצים 1 עד 4: בנק. עם SHIFT: לופ של צעדים.",
    "play": "נגינה ועצירה.",
    "rec": "הקלטה. עם ▶ מקליטים תופים בזמן אמת. עם KYBD כותבים תווי בס.",
    "bd": "לחצן הכלי של הקיק. בוחר אותו, ולחצני הצעדים מראים ועורכים אותו.",
    "bdlvl": "עוצמת הקיק.",
    "bdtune": "גובה הקיק. אחרי לחיצה על DECAY שלידו, שולט באורך הצליל.",
    "bddec": "לחצן עגול: מעביר את TUNE של הקיק לשלוט באורך במקום בגובה.",
    "sd": "לחצן הכלי של הסנר.",
    "sdlvl": "עוצמת הסנר.",
    "sdtune": "גובה הסנר. אחרי לחיצה על DECAY שלידו, שולט באורך.",
    "sddec": "לחצן עגול: מעביר את TUNE של הסנר לשלוט באורך.",
    "clap": "לחצן הכלי של הקלאפ.",
    "tom": "לחצן הכלי של הטום.",
    "tclvl": "עוצמה משותפת לקלאפ ולטום.",
    "tctune": "גובה הכלי שנבחר אחרון: קלאפ או טום.",
    "ch": "לחצן הכלי של ההיי־האט הסגור.",
    "oh": "לחצן הכלי של ההיי־האט הפתוח.",
    "hhlvl": "עוצמה משותפת לשני ההיי־האטים.",
    "hhdec": "אורך הצליל של ההיי־האטים.",
    "bass": "לחצן הכלי של הבס. הצעדים מראים איפה יש תו. צעד חדש מקבל את התו C2.",
    "kybd": "הופך את לחצני הצעדים למקלדת: אפשר לנגן בס ביד. עם ● כותבים תווים לצעדים.",
    "blvl": "עוצמת הבס.",
    "bpitch": "הגובה של כל הבס.",
    "bdec": "אורך כל תו בבס. שמאלה קצר, ימינה ארוך.",
    "cutoff": "בהירות הבס. שמאלה עמום, ימינה בהיר. הכפתור הראשי של האסיד.",
    "reso": "מוסיף צפצוף סביב נקודת הבהירות. גבוה: ה״צרחה״ של האסיד.",
    "envmod": "כמה כל תו נפתח ונסגר, ה״וואו״. יחד עם DECAY ו־RESO נותן את ה״קוואק״.",
    "delay": "כמות ההד. עם SHIFT: זמן ההד.",
    "reverb": "כמות ההדהוד. עם SHIFT: אורך ההדהוד.",
    "accent": "הדגשה. כשתוף נבחר: מדגישים צעדים בתופים. כשהבס נבחר: הדגשות ואז גלישות לבס. מחזיקים ומסובבים TEMPO/VALUE: עוצמת ההדגשה.",
}
STEPS = [
    ("C", "EXIT", "יציאה מתפריט או מהגדרה. הלכת לאיבוד? זה הלחצן.", "בנק 1"),
    ("C#", "ENTER", "אישור בתפריט ובשמירה.", "בנק 2"),
    ("D", "SHUFFLE", "שאפל: נותן לקצב תחושה פחות רובוטית.", "בנק 3"),
    ("D#", "LAST", "אורך התבנית: איפה הצעד האחרון.", "בנק 4"),
    ("E", "STEP 1-16", "עובר לעמוד הראשון של הצעדים.", ""),
    ("F", "STEP 17-32", "עובר לעמוד השני. תבנית של 16 מתארכת ל־32 ומועתקת.", ""),
    ("F#", "FILL TRG", "מנגן מילוי בסוף התבנית.", ""),
    ("G", "FILL PTN", "בוחר איזו תבנית תשמש כמילוי.", ""),
    ("G#", "RANDOM RHYTHM", "תופים אקראיים.", ""),
    ("A", "RANDOM BASS", "בס אקראי.", "הגדרת עיוות"),
    ("A#", "PTN CLEAR ALL", "מוחק את כל התבנית.", "צורת הגל של הבס"),
    ("B", "PTN CLEAR INST", "מוחק רק את הכלי שנבחר.", "שאיבה מהקיק"),
    ("C", "DELAY", "כמה כל כלי שולח להד.", ""),
    ("OCT-", "REVERB", "כמה כל כלי שולח להדהוד.", "שחזור התופים למצב השמור"),
    ("OCT+", "MENU", "התפריט.", "שחזור הבס למצב השמור"),
    ("SLIDE", "WRITE", "שמירה.", "שחזור כל התבנית למצב השמור"),
]
for i, (note, fn, what, pat) in enumerate(STEPS, 1):
    s = f"במקלדת: התו {note}. עם SHIFT: {fn}, {what}"
    if pat:
        s += f" עם PATTERN מוחזק: {pat}."
    INFO["s%d" % i] = s

ALIAS = {}
def _al(key, id):
    ALIAS.setdefault(key, [])
    if id not in ALIAS[key]:
        ALIAS[key].append(id)
for id, v in C.items():
    if v[0] != "step" and v[5]:
        _al(v[5], id)
for i, (note, fn, _, _) in enumerate(STEPS, 1):
    _al(str(i), "s%d" % i)
    _al(note, "s%d" % i)
    _al(f"{note} ({fn})", "s%d" % i)
for k, ids in {"PLAY": ["play"], "REC": ["rec"], "▶": ["play"], "●": ["rec"], "HIHAT DECAY": ["hhdec"],
               "BASS DECAY": ["bdec"], "LFO": [], "C (EXIT)": ["s1"], "C# (ENTER)": ["s2"]}.items():
    for id in ids:
        _al(k, id)
ALIAS.pop("LFO", None)

def center(id):
    k, x, y, w, h, _, _ = C[id]
    if k in ("knob", "jack", "led", "round"):
        return x, y, w
    return x + w / 2, y + h / 2, max(w, h) / 2


def draw(id, on):
    k, x, y, w, h, label, extra = C[id]
    op = "1" if on else "0.28"
    s = f'<g opacity="{op}">'
    lab = html.escape(label)
    if k == "knob":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#3a3d46" stroke="#8a8f9c" stroke-width="2"/>'
        s += f'<line x1="{x}" y1="{y - w + 4}" x2="{x}" y2="{y - w * 0.3:.0f}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'
        s += f'<text x="{x}" y="{y + w + 18}" class="l">{lab}</text>'
    elif k == "jack":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#2a2c33" stroke="#8a8f9c" stroke-width="2"/><circle cx="{x}" cy="{y}" r="7" fill="#0c0d10"/>'
        s += f'<text x="{x}" y="{y + 34}" class="l s">{lab}</text>'
    elif k == "led":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#6fcf97"/><text x="{x}" y="{y + 34}" class="l s">{lab}</text>'
    elif k == "disp":
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#0c0d10" stroke="#8a8f9c"/>'
        s += f'<text x="{x + w / 2}" y="{y + 41}" class="seg">128.0</text>'
    elif k == "round":
        s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#cfd2da"/><text x="{x}" y="{y + 5}" class="b">{lab}</text>'
    elif k == "btn":
        fill = {"play": "#6fcf97", "rec": "#ff6b5e", "inst": "#e8e9ee"}.get(extra, "#cfd2da")
        s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{fill}"/>'
        words = label.split(" ") if extra == "inst" else [label]
        for j, t in enumerate(words):
            ty = y + h / 2 + 5 + (j - (len(words) - 1) / 2) * 14
            s += f'<text x="{x + w / 2}" y="{ty:.0f}" class="b{" big" if label in ("▶", "●") else ""}">{html.escape(t)}</text>'
    elif k == "step":
        s += f'<rect x="{x:.1f}" y="{y}" width="{w}" height="{h}" rx="6" fill="#e8e9ee"/>'
        s += f'<text x="{x + w / 2:.1f}" y="{y + 29}" class="b">{lab}</text>'
        for j, t in enumerate(extra.split("|")):
            s += f'<text x="{x + w / 2:.1f}" y="{y + 60 + j * 12}" class="l xs">{html.escape(t)}</text>'
        s += f'<text x="{x + w / 2:.1f}" y="{y + 100}" class="n">{id[1:]}</text>'
    return s + "</g>"


def svg(name, on=(), marks=(), title=""):
    on = set(on) | {m for m in marks}
    if not on:
        on = set(C)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" direction="ltr">',
         '<style>text{font-family:Assistant,Arial,sans-serif;text-anchor:middle}'
         '.l{font-size:13px;font-weight:700;fill:#c9cdd6}.s{font-size:12px}.xs{font-size:10px}'
         '.b{font-size:12px;font-weight:700;fill:#1d2433}.big{font-size:20px}'
         '.n{font-size:13px;font-weight:700;fill:#9aa4b8}.h{font-size:15px;font-weight:700;fill:#e8ecf4}'
         '.seg{font-family:"IBM Plex Mono",monospace;font-size:30px;font-weight:600;fill:#ff5a4f}'
         '.k{font-size:17px;font-weight:800;fill:#1d2433}</style>',
         f'<rect x="3" y="3" width="{W - 6}" height="{H - 6}" rx="26" fill="#1f2128" stroke="#3a3d46" stroke-width="2"/>',
         '<text x="40" y="66" class="h" style="text-anchor:start;font-size:30px">T-8</text>']
    for key, x, w, lab in FRAMES:
        s.append(f'<rect x="{x}" y="112" width="{w}" height="316" rx="10" fill="none" stroke="#3a3d46" stroke-width="2"/>')
        if lab:
            s.append(f'<text x="{x + w / 2}" y="132" class="l s">{lab}</text>')
    s.append('<rect x="20" y="444" width="960" height="146" rx="10" fill="none" stroke="#3a3d46" stroke-width="2"/>')
    for id in C:
        s.append(draw(id, id in on))
    for n, id in enumerate(marks, 1):
        cx, cy, r = center(id)
        bx, by = cx + r * 0.75 + 6, cy - r * 0.75 - 6
        s.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="14" fill="{BADGE}" stroke="#1d2433" stroke-width="2"/>'
                 f'<text x="{bx:.0f}" y="{by + 6:.0f}" class="k">{n}</text>')
    s.append("</svg>")
    (OUT / f"{name}.svg").write_text("\n".join(s), encoding="utf8")


# Figures used in lesson 4. Order of marks = order of the legend in build.py.
FIGS = {
    "l4-00": ((), ["jacks_", "common_", "drums_", "bass_", "fx_", "steps_"]),
    "l4-01": (GROUPS["jacks"], ["charge", "mixout", "volume"]),
    "l4-02": ((), ["display", "tempo", "play"]),
    "l4-03": (GROUPS["common"], ["display", "tempo", "shift", "pattern", "play", "rec"]),
    "l4-04": (GROUPS["drums"], ["bd", "sd", "clap", "tom", "ch", "oh"]),
    "l4-05": (["bd", "bdlvl", "bdtune", "bddec", "s1"], ["bd", "bdlvl", "bdtune", "bddec", "s1"]),
    "l4-06": (GROUPS["bass"], ["bass", "kybd", "cutoff", "reso", "envmod", "bdec"]),
    "l4-07": (GROUPS["steps"], ["s1", "s10", "s14", "s15", "s16"]),
    "l4-08": (GROUPS["fx"], ["delay", "reverb", "accent"]),
    "l4-09": (["pattern", "shift", "s11", "s16"], ["pattern", "s16", "shift", "s11"]),
    "l4-10": (["shift", "s15", "s1", "s2", "tempo", "display"], ["shift", "s15", "tempo", "s2", "s1"]),
    # lesson 6
    "l6-01": (["pattern", "s14", "s15", "s16"], ["pattern", "s14", "s15", "s16"]),
    "l6-02": (["ch", "display"], ["ch", "s4", "tempo", "accent"]),
    "l6-03": (["display"], ["sd", "s16", "accent"]),
    "l6-04": (["tempo"], ["shift", "s6", "s5", "s4"]),
    "l6-05": ([], ["shift", "pattern", "s13"]),
    "l6-06": ([], ["shift", "s8", "s7", "s1"]),
    "l6-07": (["pattern", "s14", "s15"], ["shift", "s9", "s10"]),
    # lesson 7
    "l7-01": (["display", "tempo"], ["pattern", "s10", "bass", "bd"]),
    "l7-02": (["display"], ["bass", "kybd", "tempo"]),
    "l7-03": ([], ["shift", "s13", "s14", "delay", "reverb"]),
    "l7-04": (["display", "tempo"], ["pattern", "s12", "accent", "bass"]),
}

AREA = {"jacks_": "volume", "common_": "display", "drums_": "bd", "bass_": "bass", "fx_": "delay", "steps_": "s1"}


def hitbox(id):
    k, x, y, w, h, _, _ = C[id]
    if k in ("knob", "jack", "led", "round"):
        r = max(w, 22)
        return x - r - 6, y - r - 6, 2 * r + 12, 2 * r + 30
    if k == "step":
        return x - 6, y - 6, w + 12, 108
    return x - 6, y - 6, w + 12, h + 12


def interactive():
    """One SVG for the tour: every control is a <g class="ctl" data-id>, with a big transparent hit area."""
    s = [f'<svg class="t8i" viewBox="0 0 {W} {H}" direction="ltr" role="img" aria-label="תרשים הלוח של הטי־8">',
         '<style>.t8i text{font-family:Assistant,Arial,sans-serif;text-anchor:middle;pointer-events:none}.t8i .l{font-size:13px;font-weight:700;fill:#c9cdd6}.t8i .s{font-size:12px}.t8i .xs{font-size:10px}.t8i .b{font-size:12px;font-weight:700;fill:#1d2433}.t8i .big{font-size:20px}.t8i .n{font-size:13px;font-weight:700;fill:#9aa4b8}.t8i .h{font-size:15px;font-weight:700;fill:#e8ecf4}.t8i .seg{font-family:"IBM Plex Mono",monospace;font-size:30px;font-weight:600;fill:#ff5a4f}</style>',
         f'<rect x="3" y="3" width="{W - 6}" height="{H - 6}" rx="26" fill="#1f2128" stroke="#3a3d46" stroke-width="2"/>',
         '<text x="40" y="66" class="h" style="text-anchor:start;font-size:30px">T-8</text>']
    for key, x, w, lab in FRAMES:
        s.append(f'<rect x="{x}" y="112" width="{w}" height="316" rx="10" fill="none" stroke="#3a3d46" stroke-width="2"/>')
        if lab:
            s.append(f'<text x="{x + w / 2}" y="132" class="l s">{lab}</text>')
    s.append('<rect x="20" y="444" width="960" height="146" rx="10" fill="none" stroke="#3a3d46" stroke-width="2"/>')
    for id in C:
        hx, hy, hw, hh = hitbox(id)
        g = draw(id, True).replace('<g opacity="1">', "", 1)[:-4]
        s.append(f'<g class="ctl" data-id="{id}"><rect class="hl" x="{hx:.0f}" y="{hy:.0f}" width="{hw:.0f}" height="{hh:.0f}" rx="12"/>'
                 f'{g}<rect class="hit" x="{hx:.0f}" y="{hy:.0f}" width="{hw:.0f}" height="{hh:.0f}"/></g>')
    s.append("</svg>")
    return "".join(s)


def write_data():
    import json
    names = {id: C[id][5] for id in C}
    for i in range(1, 17):
        names["s%d" % i] = "לחצן %d" % i
    for id, nm in (("display", "התצוגה"), ("charge", "CHARGE"), ("play", "▶ PLAY"), ("rec", "● REC")):
        names[id] = nm
    data = {"svg": interactive(), "info": INFO, "names": names, "areas": AREAS, "alias": ALIAS}
    (OUT.parent / "t8-data.js").write_text("window.T8=" + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf8")


def build():
    OUT.mkdir(exist_ok=True)
    write_data()
    for name, (on, marks) in FIGS.items():
        if marks and marks[0].endswith("_"):
            # overview: everything lit, one badge per area
            real = [AREA[m] for m in marks]
            svg(name, on=set(C), marks=real)
        else:
            svg(name, on=on, marks=marks)
    return list(FIGS)


if __name__ == "__main__":
    print(build())
