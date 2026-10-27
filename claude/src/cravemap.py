"""The Crave panel, drawn left to right as on the photo of the real unit (a Behringer demo video Raz sent),
with what each control does from the official quick start guide. Figures: img/cr-*.svg. Tour data: crave-data.js.
Run: python3 src/cravemap.py   (from the claude folder). build.py runs it too."""
from panel import Panel

P = Panel("crave", "CRAVE", "הקרייב", 1000, 660, "#ef8a1f", "#b45f09", "CRAVE")
P.step_word = "STEP"

# ---------- patch bay: MIDI, then two rows of jacks. Outlined label = input, dark label = output ----------
P.din("midiin", 48, 96, "MIDI IN")
P.din("midithru", 108, 96, "MIDI THRU")
TOP = [("j_osccv", "OSC\nCV", 0), ("j_oscfm", "OSC\nFM", 0), ("j_oscmod", "OSC\nMOD", 0), ("j_vcfcut", "VCF\nCUTOFF", 0),
       ("j_vcfres", "VCF\nRES", 0), ("j_mix1", "MIX 1", 0), ("j_mix2", "MIX 2", 0), ("j_vcmixin", "VC MIX", 0),
       ("j_multin", "MULTIPLE", 0), ("j_mult1", "MULTIPLE", 1), ("j_mult2", "MULTIPLE", 1), ("j_pulse", "OSC\nPULSE", 1),
       ("j_saw", "OSC\nSAW", 1), ("j_env", "ENV", 1), ("j_noise", "NOISE", 1), ("j_vca", "VCA", 1), ("j_phones", "PHONES", 1)]
BOT = [("j_mixcv", "MIX CV", 0), ("j_ext", "EXT\nAUDIO", 0), ("j_tempo", "TEMPO", 0), ("j_play", "PLAY/\nSTOP", 0),
       ("j_reset", "RESET", 0), ("j_hold", "HOLD", 0), ("j_envgate", "ENV\nGATE", 0), ("j_vcacv", "VCA CV", 0),
       ("j_lforate", "LFO\nRATE", 0), ("j_lfotri", "LFO TRI", 1), ("j_lfosqu", "LFO SQU", 1), ("j_vcmixout", "VC MIX", 1),
       ("j_assign", "ASSIGN", 1), ("j_kbcv", "KB CV", 1), ("j_gate", "GATE", 1), ("j_vcf", "VCF", 1)]

# ---------- row 1: oscillator, filter, output ----------
P.bar(16, 444, 158, "OSCILLATOR (VCO)")
P.bar(450, 772, 158, "FILTER (VCF)")
P.bar(778, 984, 158, "OUTPUT (VCA)")
P.knob("freq", 75, 230, 26, "FREQUENCY")
P.knob("pw", 180, 230, 23, "PULSE WIDTH")
P.knob("oscmod", 285, 230, 23, "OSC MOD")
P.knob("mix", 392, 230, 23, "MIX")
P.text(372, 266, "OSC", "p")
P.text(414, 266, "EXT/NOISE", "p")
P.text(75, 306, "CRAVE", "l", "font-size:26px;font-weight:900;fill:#ef8a1f;letter-spacing:1px")
P.sw("shape", 180, 300, "SHAPE", {"l": "PULSE", "r": "SAW"})
P.sw("oscsrc", 285, 300, "MOD SOURCE", {"l": "ENV", "r": "LFO"})
P.sw("oscdest", 392, 300, "MOD DEST", {"l": "WIDTH", "r": "FREQ"})
P.knob("cutoff", 512, 232, 30, "CUTOFF")
P.knob("reso", 612, 230, 23, "RESONANCE")
P.knob("vcfmod", 712, 230, 23, "VCF MOD")
P.sw("vcfmode", 512, 300, "MODE", {"l": "LP", "r": "HP"})
P.sw("vcfsrc", 612, 300, "MOD SOURCE", {"l": "ENV", "r": "LFO"})
P.sw("vcfpol", 712, 300, "MOD POLARITY", {"l": "+", "r": "−"})
P.knob("volume", 880, 230, 25, "VOLUME")
P.sw("vcamode", 880, 300, "VCA MODE", {"l": "ENV", "r": "ON"})

# ---------- row 2: envelope, modulation, utilities ----------
P.bar(16, 444, 330, "ENVELOPE")
P.bar(450, 668, 330, "MODULATION")
P.bar(674, 984, 330, "UTILITIES")
P.knob("attack", 75, 398, 23, "ATTACK")
P.knob("decay", 180, 398, 23, "DECAY")
P.knob("sustain", 285, 398, 23, "SUSTAIN")
P.sw("susw", 392, 404, "SUSTAIN", {"l": "ON", "r": "OFF"})
P.knob("lforate", 512, 398, 23, "LFO RATE")
P.led("lfoled", 548, 372, "", "#ff4b3a")
P.sw("lfoshape", 612, 404, "SHAPE", {"l": "SQU", "r": "TRI"})
P.knob("glide", 760, 398, 23, "GLIDE")
P.knob("vcmix", 880, 398, 23, "VC MIX")
P.text(858, 434, "MIX 1", "p")
P.text(902, 434, "MIX 2", "p")

# ---------- row 3: sequencer and keys ----------
P.bar(16, 984, 452, "SEQUENCER")
P.knob("tempo", 72, 534, 27, "TEMPO/\nGATE LENGTH")
P.raw('<rect x="50" y="572" width="44" height="13" rx="2" fill="none" stroke="#ececec"/>')
P.text(72, 582, "SWING", "p", "fill:#ececec")
X = [140, 214, 288, 362]
for (id, lab), x in zip([("holdrest", "HOLD/\nREST"), ("resetacc", "RESET/\nACCENT"), ("arp", "ARP/\nSET END"), ("pattern", "PATTERN/\nBANK")], X):
    P.btn(id, x, 486, 64, 28, lab)
for (id, lab), x in zip([("shift", "SHIFT"), ("page", "PAGE"), ("play", "PLAY/STOP"), ("rec", "REC")], X):
    P.btn(id, x, 560, 64, 28, lab)
P.leds("leds", 452, 500, 8, 17, "OCTAVE/LOCATION")
P.btn("kybd", 444, 560, 60, 28, "◀ KYBD")
P.btn("step", 516, 560, 60, 28, "STEP ▶")
WHITE = ["C", "D", "E", "F", "G", "A", "B", "C"]
for i, n in enumerate(WHITE):
    P.key(f"s{i + 1}", 610 + i * 42, 532, 38, 100, n, num=str(i + 1))
for j, (n, after) in enumerate([("C#", 1), ("D#", 2), ("F#", 4), ("G#", 5), ("A#", 6)]):
    P.key(f"b{j + 1}", 610 + after * 42 - 17, 472, 30, 52, n, black=True)
P.led("power", 962, 500, "POWER")

for (id, lab, out), x in zip(TOP, range(166, 1000, 50)):
    P.jack(id, x, 66, lab, bool(out))
for (id, lab, out), x in zip(BOT, range(166, 1000, 50)):
    P.jack(id, x, 132, lab, bool(out))
P.raw('<rect x="958" y="102" width="26" height="13" rx="2" fill="none" stroke="#1a1a1a"/><text x="971" y="112" class="j" style="fill:#1a1a1a">IN</text>'
      '<rect x="958" y="118" width="26" height="13" rx="2" fill="#1a1a1a"/><text x="971" y="128" class="j" style="fill:#fff">OUT</text>')
P.raw('<rect x="12" y="148" width="976" height="500" rx="10" fill="#141414"/>')
P.deco.insert(0, P.deco.pop())  # the black control area goes under everything

# ---------- names (unique, for the tour and the "where is it" popup) ----------
P.NAMES.update({
    "oscsrc": "MOD SOURCE (VCO)", "oscdest": "MOD DEST", "shape": "SHAPE (VCO)", "vcfsrc": "MOD SOURCE (VCF)",
    "lfoshape": "SHAPE (LFO)", "susw": "SUSTAIN ON/OFF", "tempo": "TEMPO/GATE LENGTH", "leds": "נורות OCTAVE/LOCATION",
    "lfoled": "נורית ה־LFO", "power": "נורית ההפעלה", "kybd": "◀ KYBD", "step": "STEP ▶",
    "j_oscmod": "OSC MOD (שקע)", "j_tempo": "TEMPO (שקע)", "j_play": "PLAY/STOP (שקע)", "j_lforate": "LFO RATE (שקע)",
    "j_vcmixin": "VC MIX (שקע כניסה)", "j_vcmixout": "VC MIX (שקע יציאה)", "j_multin": "MULTIPLE (כניסה)",
    "j_mult1": "MULTIPLE (יציאה 1)", "j_mult2": "MULTIPLE (יציאה 2)", "j_vca": "VCA (יציאה ראשית)",
})
for i in range(8):
    P.NAMES[f"s{i + 1}"] = f"STEP {i + 1}"
for j, n in enumerate(["C#", "D#", "F#", "G#", "A#"]):
    P.NAMES[f"b{j + 1}"] = f"קליד {n}"

P.EXTRA.update({
    "TEMPO": ["tempo", "j_tempo"], "<KYBD": ["kybd"], "KYBD": ["kybd"], "STEP>": ["step"], "VCA/LINE": ["j_vca"],
    "OCTAVE/LOCATION": ["leds"], "SUSTAIN": ["sustain", "susw"], "ARP": ["arp"], "SET END": ["arp"], "PATTERN": ["pattern"],
    "BANK": ["pattern"], "ACCENT": ["resetacc"], "SWING": ["tempo"], "GATE LENGTH": ["tempo"],
    "MOD SOURCE": ["oscsrc", "vcfsrc"], "SHAPE": ["shape", "lfoshape"],
})
for i in range(8):
    P.EXTRA[str(i + 1)] = [f"s{i + 1}"]

# ---------- what each control does (official quick start guide) ----------
P.INFO.update({
    "midiin": "כניסת מידי עגולה. כאן נכנסים שעון, התחלה ועצירה מהטי־8, וגם תווים ממקלדת. כדי שהקרייב ילך לפי השעון: הגדרות, עמוד 3, ערך 2.",
    "midithru": "מעביר הלאה, כמו שהוא, כל מה שנכנס ב־MIDI IN. מכאן ממשיכים לאדג׳.",
    "j_osccv": "כניסה: הגובה של המתנד, וולט לאוקטבה. כבל לכאן מנגן את הקרייב ממכשיר אחר.",
    "j_oscfm": "כניסה: תנועה של הגובה. צליל שנכנס לכאן נותן צלצול מתכתי.",
    "j_oscmod": "כניסה: נכנסת במקום המעטפת, כשמתג MOD SOURCE של המתנד על ENV. הכפתור OSC MOD קובע כמה.",
    "j_vcfcut": "כניסה: פתיחת המסנן. מתווספת למה שהכפתור CUTOFF קובע.",
    "j_vcfres": "כניסה: השריקה של המסנן.",
    "j_mix1": "כניסה לעזר VC MIX. הכפתור VC MIX מערבב בין מה שנכנס כאן לבין MIX 2.",
    "j_mix2": "כניסה לעזר VC MIX. הכפתור VC MIX מערבב בין MIX 1 לבין מה שנכנס כאן.",
    "j_vcmixin": "כניסה: מזיזה את הכפתור VC MIX בעצמה.",
    "j_multin": "הכניסה של המפצל: מה שנכנס כאן יוצא משתי יציאות MULTIPLE.",
    "j_mult1": "יציאה: עותק של מה שנכנס ב־MULTIPLE.",
    "j_mult2": "יציאה: עותק שני של מה שנכנס ב־MULTIPLE.",
    "j_pulse": "יציאה: המתנד בגל פולס, לפני המסנן.",
    "j_saw": "יציאה: המתנד בגל מסור, לפני המסנן.",
    "j_env": "יציאה: המעטפת. עולה ויורדת בכל תו.",
    "j_noise": "יציאה: הרעש.",
    "j_vca": "היציאה הראשית, למיקסר. כבל מונו. VOLUME שולט בה. במדריך: VCA/LINE.",
    "j_phones": "אוזניות. VOLUME שולט גם בה. מורידים עוצמה לפני שמחברים.",
    "j_mixcv": "כניסה: האיזון בין המתנד לרעש.",
    "j_ext": "כניסה: צליל מבחוץ. נכנס במקום הרעש, ועובר במסנן של הקרייב. הכמות ב־MIX.",
    "j_tempo": "כניסה: קצב לסיקוונסר, בכבל קטן. איך הקרייב קורא אותו נקבע בהגדרות, עמודים 1 ו־3.",
    "j_play": "כניסה: מתחיל ועוצר את הסיקוונסר.",
    "j_reset": "כניסה: מחזיר את הרצף לצעד 1.",
    "j_hold": "כניסה: מקפיא את הצעד, כמו החזקה של HOLD/REST. גם לדוושה.",
    "j_envgate": "כניסה: מפעילה את המעטפת. כל דפיקה כאן היא תו.",
    "j_vcacv": "כניסה: העוצמה.",
    "j_lforate": "כניסה: המהירות של ה־LFO.",
    "j_lfotri": "יציאה: ה־LFO בגל משולש, עולה ויורד חלק.",
    "j_lfosqu": "יציאה: ה־LFO בגל ריבועי, קופץ בין שני מצבים.",
    "j_vcmixout": "יציאה: התוצאה של עזר VC MIX.",
    "j_assign": "יציאה שבוחרים מה יוצא ממנה, בהגדרות בעמוד 2: הדגשה, שעון, שעון לאט פי 2 או פי 4, אקראי לכל צעד, ועוד.",
    "j_kbcv": "יציאה: הגובה של התו שמנגן, מהקלידים או מהסיקוונסר.",
    "j_gate": "יציאה: ״עכשיו!״ כל עוד תו מנגן.",
    "j_vcf": "יציאה: הצליל אחרי המסנן, לפני המגבר.",
    "freq": "הגובה של המתנד, עד אוקטבה לכל צד. גם הכוונון מול כלים אחרים.",
    "pw": "רק בגל פולס: מצליל דק, דרך ריבוע באמצע, לרחב.",
    "oscmod": "כמה המתנד זז מהמקור שבמתג MOD SOURCE. עד הסוף שמאלה: לא זז.",
    "mix": "עד הסוף שמאלה: רק המתנד. עד הסוף ימינה: רק רעש, או צליל שנכנס ב־EXT AUDIO.",
    "shape": "צורת הגל: פולס, חלול, או מסור, בהיר. גל המסור הוא הגל של האסיד.",
    "oscsrc": "מי מזיז את המתנד: המעטפת (או כבל בשקע OSC MOD), או ה־LFO.",
    "oscdest": "מה זז במתנד: רוחב הפולס, או הגובה.",
    "cutoff": "כמה המסנן פתוח. שמאלה עמום, ימינה בהיר. הכפתור הראשי בג׳אם.",
    "reso": "שריקה סביב נקודת החיתוך. קרוב לסוף הוא שורק בעצמו, ובחוזקה.",
    "vcfmod": "כמה המסנן זז מהמקור שבמתג MOD SOURCE שלו. עם המעטפת: ה״יאו״ של האסיד.",
    "vcfmode": "LP חותך את הגבוהים: הבית של בס ואסיד. HP חותך את הנמוכים.",
    "vcfsrc": "מי מזיז את המסנן: המעטפת, או ה־LFO.",
    "vcfpol": "+: המודולציה פותחת את המסנן. −: סוגרת אותו.",
    "volume": "העוצמה ביציאה הראשית ובאוזניות.",
    "vcamode": "ENV: שומעים רק כשתו מנגן. ON: הצליל מזמזם בלי הפסקה, בגובה של התו האחרון. כשהקרייב לא שותק, זה המתג.",
    "attack": "כמה מהר התו נכנס. עד הסוף שמאלה: מיד.",
    "decay": "כמה מהר התו נופל.",
    "sustain": "באיזו עוצמה התו מחזיק, כשמתג SUSTAIN על ON.",
    "susw": "ON: התו מחזיק כל עוד לוחצים. OFF: נופל מיד אחרי הכניסה.",
    "lforate": "המהירות של ה־LFO, הגל האיטי שמזיז כפתורים בשבילך. הנורית לידו מהבהבת לפיו.",
    "lfoled": "מהבהבת במהירות של ה־LFO.",
    "lfoshape": "צורת ה־LFO: ריבוע קופץ בין שני מצבים, משולש עולה ויורד חלק.",
    "glide": "גלישה בין תווים. בעריכת צעד: גלישה רק לצעד הזה. עם SHIFT: חזרות מהירות (ראצ׳ט).",
    "vcmix": "מערבב בין שני כבלים, MIX 1 ו־MIX 2. בלי כבלים הוא לא עושה כלום.",
    "tempo": "המהירות של הסיקוונסר. בעריכת צעד: אורך התו, 1 עד 8. עם SHIFT: סווינג.",
    "holdrest": "בנגינה: מקפיא את הצעד. בהקלטה: שקט. עם SHIFT: משתיק את הרצף. בארפג׳יו: מחזיק אותו.",
    "resetacc": "בנגינה: חזרה לצעד 1. בהקלטה: הדגשה. עם SHIFT: הכל מודגש.",
    "arp": "ארפג׳יו מהתווים שמחזיקים. עם SHIFT ועם צעד: איפה הרצף נגמר.",
    "pattern": "מחזיקים ולוחצים STEP 1 עד 8: בוחר רצף. עם SHIFT: בוחר בנק. עם SHIFT ו־RESET/ACCENT: מנקה את הרצף.",
    "shift": "לבד לא עושה כלום. מחזיקים אותו, ולחצן אחר עושה את התפקיד השני שלו.",
    "page": "עמוד הבא: 8 צעדים בכל עמוד, עד 4 עמודים. עם SHIFT: חזרה לדפדוף אוטומטי.",
    "play": "מנגן ועוצר. עם SHIFT: מנגן הפוך. SHIFT והחזקה של 2 שניות: שמירה.",
    "rec": "מתחיל ומסיים הקלטה או עריכה. עם SHIFT: מאשר שמירה.",
    "kybd": "אוקטבה למטה. עם SHIFT: מצב קלידים, נורית ירוקה. בהגדרות: עמוד קודם.",
    "step": "אוקטבה למעלה. עם SHIFT: מצב צעדים, נורית צהובה. בהגדרות: עמוד הבא.",
    "leds": "שמונה נורות שמראות איפה אתה. אדום: האוקטבה. ירוק: מצב קלידים, או מספר רצף ובנק. צהוב: מצב צעדים, או עמוד בהגדרות. בנגינה: העמוד שמנגן.",
    "power": "דולקת כשהמכשיר דלוק. המתג עצמו בגב.",
})
for i, n in enumerate(WHITE):
    P.INFO[f"s{i + 1}"] = (f"קליד: התו {n}. גם STEP {i + 1}: בעריכה בוחר את צעד {i + 1}, עם PATTERN בוחר רצף {i + 1}, "
                           f"ובהגדרות בוחר ערך {i + 1}. הנורית שלו מראה את הצעד שמנגן או נערך.")
for j, n in enumerate(["C#", "D#", "F#", "G#", "A#"]):
    P.INFO[f"b{j + 1}"] = f"קליד: התו {n}."

JACKS = [t[0] for t in TOP] + [t[0] for t in BOT]
P.AREAS = [
    ["למעלה: לוח השקעים", ["midiin", "midithru"] + JACKS],
    ["המתנד", ["freq", "pw", "oscmod", "mix", "shape", "oscsrc", "oscdest"]],
    ["המסנן והמגבר", ["cutoff", "reso", "vcfmod", "vcfmode", "vcfsrc", "vcfpol", "volume", "vcamode"]],
    ["מעטפת, תנועה ועזרים", ["attack", "decay", "sustain", "susw", "lforate", "lfoled", "lfoshape", "glide", "vcmix"]],
    ["הסיקוונסר", ["tempo", "holdrest", "resetacc", "arp", "pattern", "shift", "page", "play", "rec", "kybd", "step", "leds", "power"]],
    ["13 הקלידים", [f"s{i}" for i in range(1, 9)] + [f"b{j}" for j in range(1, 6)]],
]
P.POOL = ["cutoff", "reso", "freq", "mix", "shape", "decay", "attack", "glide", "volume", "vcamode", "vcfmod", "lforate",
          "shift", "play", "rec", "pattern", "holdrest", "resetacc", "arp", "kybd", "step", "j_vca", "j_gate", "j_kbcv", "j_assign", "s1", "s8"]

# ---------- figures: one per lesson card. (lit controls, [(numbered control, legend), ...]) ----------
SEQ = ["tempo", "holdrest", "resetacc", "arp", "pattern", "shift", "page", "play", "rec", "kybd", "step", "leds"]
P.FIGS.update({})   # filled in figs below

from cravefigs import FIGS, PLACE  # noqa: E402  (kept apart: they follow the lesson cards)
P.FIGS.update(FIGS)
P.PLACE.update(PLACE)

# the same names t8map.py and vbmap.py give build.map_page()
C = P.C
ALIAS = P.alias()


def label(id):
    return P.names()[id]


def build():
    return P.build()


if __name__ == "__main__":
    print(build())
