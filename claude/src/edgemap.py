"""The Edge panel, drawn left to right as on the photo of the real unit (a Behringer demo video Raz sent),
with what each control does from the official quick start guide. Figures: img/ed-*.svg. Tour data: edge-data.js.
Run: python3 src/edgemap.py   (from the claude folder). build.py runs it too."""
from panel import Panel

P = Panel("edge", "EDGE", "האדג׳", 1000, 640, "#d6299a", "#93146a", "EDGE")
P.step_word = "צעד"

# ---------- patch bay: MIDI, then two rows of jacks. Outlined label = input, dark label = output ----------
P.din("midiin", 48, 96, "MIDI IN")
P.din("midiout", 108, 96, "MIDI OUT/THRU")
TOP = [("j_osc1cv", "OSC 1\nCV", 0), ("j_osc2cv", "OSC 2\nCV", 0), ("j_oscdec", "OSC\nDECAY", 0), ("j_adv", "ADV/\nCLOCK", 0),
       ("j_trigin", "TRIGGER", 0), ("j_velin", "VELOCITY", 0), ("j_noisein", "NOISE\nLEVEL", 0), ("j_osc1", "OSC 1", 1),
       ("j_osc2", "OSC 2", 1), ("j_osceg", "OSC EG", 1), ("j_trigout", "TRIGGER", 1), ("j_velout", "VELOCITY", 1), ("j_phones", "PHONES", 1)]
BOT = [("j_fmin", "1-2 FM\nAMT", 0), ("j_ext", "EXT\nAUDIO", 0), ("j_tempo", "TEMPO", 0), ("j_play", "PLAY/\nSTOP", 0),
       ("j_vcfmod", "VCF MOD", 0), ("j_vcfdec", "VCF\nDECAY", 0), ("j_vcacv", "VCA CV", 0), ("j_vcadec", "VCA\nDECAY", 0),
       ("j_pitchout", "PITCH", 1), ("j_vcfeg", "VCF EG", 1), ("j_vca", "VCA", 1), ("j_vcaeg", "VCA EG", 1)]

# ---------- row 1: VCO 1, EG, noise, output ----------
P.bar(16, 444, 158, "OSCILLATOR (VCO 1)")
P.bar(450, 546, 158, "EG (VCO 1&2)")
P.bar(552, 690, 158, "NOISE")
P.bar(778, 984, 158, "OUTPUT (VCA)")
Y1 = 232
P.knob("osc1freq", 66, Y1, 26, "FREQUENCY")
P.sw("osc1shape", 150, Y1 + 8, "SHAPE", {"t": "PULSE", "b": "TRI"})
P.knob("osc1env", 232, Y1, 22, "ENVELOPE", bip=True)
P.sw("seqpitch", 322, Y1 + 8, "SEQ PITCH MOD", {"t": "VCO 1&2", "r": "OFF", "b": "VCO 2"})
P.knob("osc1lvl", 406, Y1, 22, "LEVEL")
P.knob("egdec", 493, Y1, 22, "DECAY")
P.sw("noisecolor", 580, Y1 + 8, "COLOR", {"t": "PINK", "b": "WHITE"})
P.knob("noise", 652, Y1, 22, "NOISE/EXT")
P.text(732, Y1 + 18, "EDGE", "l", "font-size:30px;font-weight:900;fill:#d6299a;letter-spacing:1px")
P.led("led", 732, Y1 - 22, "", "#ffb020")
P.sw("vcamode", 818, Y1 + 8, "VCA MODE", {"t": "FAST", "b": "SLOW"})
P.knob("vcadec", 885, Y1, 22, "DECAY")
P.knob("volume", 952, Y1, 22, "VOLUME")

# ---------- row 2: VCO 2, filter ----------
P.bar(16, 536, 276, "OSCILLATOR (VCO 2)")
P.bar(542, 984, 276, "FILTER (VCF)")
Y2 = 352
P.knob("osc2freq", 66, Y2, 26, "FREQUENCY")
P.sw("osc2shape", 150, Y2 + 8, "SHAPE", {"t": "PULSE", "b": "TRI"})
P.knob("osc2env", 232, Y2, 22, "ENVELOPE", bip=True)
P.sw("hardsync", 322, Y2 + 8, "HARD SYNC", {"t": "ON", "b": "OFF"})
P.knob("osc2lvl", 406, Y2, 22, "LEVEL")
P.knob("fm", 493, Y2, 22, "1-2 FM AMT")
P.sw("vcfsel", 568, Y2 + 8, "VCF", {"t": "HP", "b": "LP"})
P.knob("cutoff", 650, Y2, 26, "CUTOFF")
P.knob("reso", 734, Y2, 22, "RESONANCE")
P.knob("vcfdec", 815, Y2, 22, "DECAY")
P.knob("vcfenv", 885, Y2, 22, "ENVELOPE", bip=True)
P.knob("noisevcf", 952, Y2, 22, "NOISE/\nVCF MOD")

# ---------- row 3: sequencer ----------
P.bar(16, 984, 396, "SEQUENCER")
P.knob("tempo", 64, 466, 26, "TEMPO")
P.sw("clock", 150, 470, "CLOCK", {"t": "MIDI", "r": "USB", "b": "INT/EXT"})
P.knob("scale", 240, 466, 22, "SCALE")
P.text(240, 506, "1/4 … 1/32 · T", "p")
P.btn("trigger", 30, 560, 58, 34, "TRIGGER", where="above")
P.btn("play", 98, 560, 58, 34, "PLAY/\nSTOP", where="above")
P.btn("advance", 166, 560, 58, 34, "ADVANCE", where="above")
P.text(302, 470, "PITCH", "l")
P.text(302, 572, "VEL", "l")
for i in range(8):
    x = 360 + i * 86
    P.text(x, 409, str(i + 1), "hd", "text-anchor:middle")
    P.knob(f"p{i + 1}", x, 466, 21, f"PITCH {i + 1}", bip=True, show=False)
    P.raw(f'<circle cx="{x}" cy="518" r="5" fill="{"#ff3b30" if i == 0 else "#3a3a3a"}" stroke="#000"/>')
    P.knob(f"v{i + 1}", x, 568, 21, f"VEL {i + 1}", show=False)

for (id, lab, out), x in zip(TOP, range(168, 1000, 64)):
    P.jack(id, x, 66, lab, bool(out))
for (id, lab, out), x in zip(BOT, range(168, 1000, 64)):
    P.jack(id, x, 132, lab, bool(out))
P.raw('<rect x="958" y="102" width="26" height="13" rx="2" fill="none" stroke="#1a1a1a"/><text x="971" y="112" class="j" style="fill:#1a1a1a">IN</text>'
      '<rect x="958" y="118" width="26" height="13" rx="2" fill="#1a1a1a"/><text x="971" y="128" class="j" style="fill:#fff">OUT</text>')
P.raw('<rect x="12" y="148" width="976" height="480" rx="10" fill="#141414"/>')
P.deco.insert(0, P.deco.pop())

# ---------- names: the panel repeats FREQUENCY, ENVELOPE, DECAY... these say which one ----------
P.NAMES.update({
    "osc1freq": "FREQUENCY (VCO 1)", "osc2freq": "FREQUENCY (VCO 2)", "osc1shape": "SHAPE (VCO 1)", "osc2shape": "SHAPE (VCO 2)",
    "osc1env": "ENVELOPE (VCO 1)", "osc2env": "ENVELOPE (VCO 2)", "vcfenv": "ENVELOPE (VCF)",
    "osc1lvl": "LEVEL (VCO 1)", "osc2lvl": "LEVEL (VCO 2)",
    "egdec": "DECAY (EG)", "vcadec": "DECAY (VCA)", "vcfdec": "DECAY (VCF)",
    "noisecolor": "NOISE COLOR", "vcfsel": "VCF SELECT", "led": "נורית ההפעלה",
    "j_trigin": "TRIGGER (שקע כניסה)", "j_trigout": "TRIGGER (שקע יציאה)", "j_velin": "VELOCITY (שקע כניסה)",
    "j_velout": "VELOCITY (שקע יציאה)", "j_tempo": "TEMPO (שקע)", "j_play": "PLAY/STOP (שקע)",
    "j_fmin": "1-2 FM AMT (שקע)", "j_pitchout": "PITCH (שקע)", "j_vca": "VCA (יציאה ראשית)",
})
P.EXTRA.update({
    "EG (VCO 1&2) DECAY": ["egdec"], "EG DECAY": ["egdec"], "NOISE / EXT": ["noise"], "NOISE / VCF MOD": ["noisevcf"],
    "PITCH": [f"p{i}" for i in range(1, 9)] + ["j_pitchout"], "VEL": [f"v{i}" for i in range(1, 9)],
    "ADV": ["j_adv"], "CLOCK": ["clock"],
})

# ---------- what each control does (official quick start guide) ----------
P.INFO.update({
    "midiin": "כניסת מידי עגולה: שעון מהטי־8 (כשהמתג CLOCK על MIDI), או תווים ממקלדת.",
    "midiout": "יציאת מידי. אפשר להעביר דרכה הלאה את מה שנכנס.",
    "j_osc1cv": "כניסה: הגובה של מתנד 1, וולט לאוקטבה.",
    "j_osc2cv": "כניסה: הגובה של מתנד 2, וולט לאוקטבה.",
    "j_oscdec": "כניסה: כמה מהר הגובה צונח.",
    "j_adv": "כניסה: כל דפיקה מקדמת צעד אחד. כשמחובר כאן כבל, TEMPO לא עובד.",
    "j_trigin": "כניסה: מכה בעוצמה של הצעד הנוכחי, בלי להתקדם.",
    "j_velin": "כניסה: העוצמה המקסימלית של שלוש הדעיכות.",
    "j_noisein": "כניסה: כמות הרעש.",
    "j_osc1": "יציאה: מתנד 1 לבד, לפני המסנן. צליל, או תנועה מהירה לכבל אחר.",
    "j_osc2": "יציאה: מתנד 2 לבד, לפני המסנן.",
    "j_osceg": "יציאה: דעיכת הגובה, כמתח.",
    "j_trigout": "יציאה: דפיקה בכל צעד. שעון למכשיר אחר.",
    "j_velout": "יציאה: המיקום של כפתור VEL בצעד שמנגן.",
    "j_phones": "אוזניות. VOLUME שולט גם בה. מורידים עוצמה לפני שמחברים.",
    "j_fmin": "כניסה: כמות המתכת (1-2 FM).",
    "j_ext": "כניסה: צליל מבחוץ, במקום הרעש. הכמות ב־NOISE/EXT.",
    "j_tempo": "כניסה: המהירות של הסיקוונסר.",
    "j_play": "כניסה: מתח מתחיל ועוצר את הסיקוונסר.",
    "j_vcfmod": "כניסה: מנענע את המסנן במקום הרעש. העומק ב־NOISE/VCF MOD.",
    "j_vcfdec": "כניסה: כמה מהר המסנן נסגר.",
    "j_vcacv": "כניסה: העוצמה של הכל.",
    "j_vcadec": "כניסה: אורך המכה.",
    "j_pitchout": "יציאה: המיקום של כפתור PITCH בצעד שמנגן.",
    "j_vcfeg": "יציאה: דעיכת המסנן, כמתח.",
    "j_vca": "היציאה הראשית, למיקסר. כבל מונו. VOLUME שולט בה.",
    "j_vcaeg": "יציאה: דעיכת העוצמה, כמתח.",
    "osc1freq": "הגובה של מתנד 1, בטווח של 10 אוקטבות. נמוך: קיק. גבוה: טום וטיק.",
    "osc2freq": "הגובה של מתנד 2. מול מתנד 1 הוא נותן צלצול, כמו פעמון.",
    "osc1shape": "ריבוע או משולש. משולש רך, טוב לקיק. ריבוע חד, טוב לטום ולמתכת.",
    "osc2shape": "ריבוע או משולש, למתנד 2.",
    "osc1env": "כמה הגובה של מתנד 1 צונח בכל מכה. שעה 12: כלום. ימינה: צונח, זה הבום. שמאלה: עולה.",
    "osc2env": "כמה הגובה של מתנד 2 צונח בכל מכה. שעה 12: כלום.",
    "seqpitch": "לאן שורת PITCH הולכת: לשני המתנדים (VCO 1&2), רק למתנד 2, או לאף אחד (OFF).",
    "osc1lvl": "כמה ממתנד 1 נשמע.",
    "osc2lvl": "כמה ממתנד 2 נשמע.",
    "egdec": "כמה מהר הגובה צונח, לשני המתנדים יחד. קצר: בום הדוק. ארוך: לייזר.",
    "hardsync": "מתנד 2 ננעל על מתנד 1. סיבוב FREQUENCY של מתנד 2 נותן שריקה חדה.",
    "fm": "מתנד 1 מלכלך את מתנד 2. ככל שמעלים: יותר מתכת.",
    "noisecolor": "לבן: בהיר וחד. ורוד: כהה ורך.",
    "noise": "כמה רעש. כשמחובר כבל ל־EXT AUDIO: כמה מהצליל החיצוני.",
    "led": "נורית ההפעלה. אדומה: מצב שרשרת של כמה מכשירים.",
    "vcamode": "FAST: המכה נכנסת חדה, תוך אלפית שנייה. SLOW: רכה, תוך עשירית.",
    "vcadec": "אורך המכה. קצר: טיק. ארוך: בום.",
    "volume": "העוצמה ביציאה הראשית ובאוזניות.",
    "vcfsel": "LP חותך את הגבוהים. HP חותך את הנמוכים: טוב להיי־האט.",
    "cutoff": "כמה המסנן פתוח. שמאלה עמום, ימינה בהיר.",
    "reso": "שריקה סביב נקודת החיתוך.",
    "vcfdec": "כמה מהר המסנן נסגר אחרי כל מכה.",
    "vcfenv": "כמה כל מכה פותחת את המסנן. שעה 12: כלום. שמאלה: סוגרת.",
    "noisevcf": "כמה הרעש מנענע את המסנן: חספוס. כשמחובר כבל ל־VCF MOD: כמה ממנו.",
    "tempo": "המהירות, כשהמתג CLOCK על INT/EXT. מגיע עד 10,000 בדקה, ושם הקצב הופך לצליל.",
    "clock": "מי קובע את הקצב. INT/EXT: האדג׳ עצמו, או כבל בשקע ADV/CLOCK. MIDI: השקע העגול, למשל מהטי־8. USB: מחשב.",
    "scale": "כשהקצב בא ממידי או מ־USB: כמה ארוך כל צעד. 1/16 כמו צעד בטי־8. T: שלישונים.",
    "trigger": "כשהסיקוונסר עצור: מנגן את הצעד הנוכחי, בלי להתקדם. ככה מכוונים צעד.",
    "play": "מתחיל ועוצר, מהצעד שבו הוא עומד. נורית הצעד מראה איפה.",
    "advance": "צעד אחד קדימה. ככה מגיעים לצעד שרוצים לכוון.",
})
for i in range(1, 9):
    P.INFO[f"p{i}"] = f"PITCH של צעד {i}: הגובה שלו. שעה 12: כלום. ימינה גבוה, שמאלה נמוך. עובד רק כש־SEQ PITCH MOD לא על OFF."
    P.INFO[f"v{i}"] = f"VEL של צעד {i}: העוצמה שלו. עד הסוף שמאלה: הצעד שותק. גבוה: חזק, וגם ארוך יותר."

JACKS = [t[0] for t in TOP] + [t[0] for t in BOT]
P.AREAS = [
    ["למעלה: לוח השקעים", ["midiin", "midiout"] + JACKS],
    ["שורה 1: מתנד 1, רעש ומגבר", ["osc1freq", "osc1shape", "osc1env", "seqpitch", "osc1lvl", "egdec", "noisecolor", "noise", "led", "vcamode", "vcadec", "volume"]],
    ["שורה 2: מתנד 2 ומסנן", ["osc2freq", "osc2shape", "osc2env", "hardsync", "osc2lvl", "fm", "vcfsel", "cutoff", "reso", "vcfdec", "vcfenv", "noisevcf"]],
    ["הסיקוונסר", ["tempo", "clock", "scale", "trigger", "play", "advance"]],
    ["שמונה הצעדים", [f"p{i}" for i in range(1, 9)] + [f"v{i}" for i in range(1, 9)]],
]
P.POOL = ["osc1freq", "osc1env", "egdec", "noise", "vcadec", "volume", "fm", "hardsync", "cutoff", "reso", "vcfenv", "vcfdec",
          "tempo", "clock", "trigger", "play", "advance", "seqpitch", "p3", "v5", "j_vca", "j_adv", "j_velout", "j_noisein"]

from edgefigs import FIGS, PLACE  # noqa: E402  (kept apart: they follow the lesson cards)
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
