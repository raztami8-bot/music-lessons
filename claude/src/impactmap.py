"""The Arturia DrumBrute Impact panel, drawn from the product photo Raz sent (2026-11-16), with what each control does
from the official manual (v1.0, July 2018). Raz does not own it yet: everything here is from the manual, not from the device.
No lesson figures: only the tour data, impact-data.js (window.IMPACT), used by impact.html (doors.js).
Run: python3 src/impactmap.py   (from the claude folder). build.py runs it too."""
from panel import Panel

P = Panel("impact", "IMPACT", "האימפקט", 1000, 1000, "#3d3f45", "#1e1f22", "DRUMBRUTE IMPACT")
P.step_word = "צעד"
LT = "#cfd2d6"      # the light grey buttons
BLUE = "#7cc4ff"    # the blue second-function words printed under the buttons
ORANGE = "#ef7d22"

# ---------- backgrounds ----------
P.raw('<rect x="14" y="14" width="440" height="178" rx="8" fill="#1c1d20"/>')          # display and transport
P.raw('<rect x="740" y="14" width="246" height="178" rx="8" fill="#1c1d20"/>')         # output circuit
P.raw('<rect x="14" y="482" width="972" height="402" rx="8" fill="#1c1d20"/>')         # the instruments
P.raw(f'<rect x="150" y="846" width="826" height="26" fill="{ORANGE}"/>')                # the orange color strip under the pads
P.raw('<rect x="14" y="892" width="786" height="96" rx="8" fill="#cfcfcf"/>')          # back panel
P.raw('<text x="24" y="908" class="j" style="fill:#1a1a1a;text-anchor:start;font-size:11px">מאחור · הסדר כאן לפי נושא</text>')

# ---------- top: display, transport, pattern buttons, output ----------
P.raw('<rect x="26" y="30" width="150" height="70" rx="6" fill="#0b0b0b" stroke="#444"/>'
      '<text x="101" y="82" style="font-family:IBM Plex Mono,monospace;font-size:44px;font-weight:600;fill:#ff3b30;text-anchor:middle">120</text>')
P.text(101, 118, "Tempo / Value", "l s")
P.btn("rec", 196, 40, 50, 44, "RECORD", tone="#e8574a")
P.btn("stop", 256, 40, 50, 44, "STOP", tone=LT)
P.btn("play", 316, 40, 56, 44, "PLAY/PAUSE", tone="#5cc46a")
P.btn("sync", 392, 56, 48, 26, "SYNC", tone=LT)
P.text(221, 112, "Unquantized", "p", f"fill:{BLUE}")
for i, w in enumerate(("INT", "USB", "MIDI", "CLK")):
    x = 386 + i * 18
    P.raw(f'<circle cx="{x}" cy="38" r="3.5" fill="{"#ffffff" if w == "MIDI" else "#555"}"/><text x="{x}" y="30" class="p" style="font-size:7.5px">{w}</text>')
P.btn("erase", 470, 44, 58, 28, "ERASE", tone=LT)
P.btn("copy", 470, 120, 58, 28, "COPY", tone=LT)
P.btn("prev", 545, 44, 58, 28, "<<", tone=LT)
P.btn("save", 545, 120, 58, 28, "SAVE", tone=LT)
P.btn("next", 620, 44, 58, 28, ">>", tone=LT)
P.btn("last", 620, 120, 58, 28, "LAST STEP", tone=LT)
P.text(649, 100, "Extend", "p", f"fill:{BLUE}")
for i, w in enumerate(("16", "32", "48", "64")):
    x = 563 + i * 34
    P.raw(f'<circle cx="{x}" cy="30" r="3.5" fill="{"#ffffff" if w == "16" else "#555"}"/><text x="{x}" y="22" class="p" style="font-size:8px">{w}</text>')
P.bar(750, 976, 22, "OUTPUT CIRCUIT")
P.knob("dist", 792, 112, 24, "DISTORTION")
P.btn("diston", 845, 100, 34, 24, "ON", tone=LT)
P.knob("master", 934, 112, 24, "MASTER\nVOLUME")

# ---------- middle: tempo, modes, swing, random, step repeat ----------
P.knob("rate", 75, 268, 28, "RATE / FINE")
P.btn("tap", 45, 330, 60, 28, "TAP TEMPO", tone=LT)
P.bar(170, 474, 212, "MODES")
P.text(240, 246, "Revert", "p", f"fill:{BLUE}")
for i, (id, lab) in enumerate((("song", "SONG"), ("bank", "BANK"), ("ptrn", "PTRN"), ("step", "STEP"), ("accent", "ACCNT"))):
    P.btn(id, 178 + i * 58, 256, 48, 44, lab, tone=LT)
P.knob("swing", 526, 278, 26, "SWING / SHIFT")
P.btn("ctswing", 570, 268, 38, 24, "CURRENT\nTRACK", tone=LT)
P.knob("random", 676, 278, 26, "RANDOM")
P.btn("ctrand", 720, 268, 38, 24, "CURRENT\nTRACK", tone=LT)
P.leds("srled", 818, 236, 4, 47, "STEP REPEAT")
for i, lab in enumerate(("1/4", "1/8", "1/16", "1/32")):
    P.btn(f"rp{i + 1}", 796 + i * 47, 270, 44, 40, lab, tone="#2b2d31")
P.text(890, 352, "ROLLER / LOOPER", "l s")

# ---------- the 16 step buttons ----------
STEP_BLUE = {1: "1/8", 2: "1/8T", 3: "1/16", 4: "1/16T", 5: "1/32", 9: "Roller", 14: "At End", 15: "Global BPM", 16: "Polyrhythm"}
for i in range(1, 17):
    x = 30 + (i - 1) * 57 + (6 if i > 8 else 0)
    P.key(f"st{i}", x, 402, 48, 46, "ABCD"[i - 1] if i <= 4 else "", num=str(i))
    if i in STEP_BLUE:
        P.text(x + 24, 466, STEP_BLUE[i], "p", f"fill:{BLUE};font-size:9px")

# ---------- left column: metronome, mute, solo, shift, color ----------
P.bar(22, 146, 492, "METRONOME")
P.knob("metvol", 84, 562, 20, "METRO VOL")
P.btn("meton", 61, 598, 46, 24, "ON", tone=LT)
P.btn("mute", 54, 656, 60, 28, "MUTE", tone=LT)
P.btn("solo", 54, 712, 60, 28, "SOLO", tone=LT)
P.text(120, 676, "Clear", "p", f"fill:{BLUE};text-anchor:start")
P.text(120, 732, "Clear", "p", f"fill:{BLUE};text-anchor:start")
P.btn("shift", 54, 768, 60, 32, "SHIFT", tone="#9fd4ff")
P.btn("color", 54, 826, 60, 26, "COLOR", tone=ORANGE)

# ---------- the instruments: 8 columns, three rows of knobs, a pad, and the color word ----------
CX = [196 + i * 104 for i in range(8)]
YA, YB, YC, YP = 560, 664, 752, 784
for i, h in enumerate(("KICK", "SNARE 1", "SNARE 2", "TOM HI/LOW", "CYM/COW")):
    P.bar(CX[i] - 48, CX[i] + 48, 492, h)
P.bar(CX[5] - 48, CX[7] + 48, 492, "FM DRUM")
P.bar(CX[5] - 48, CX[5] + 48, 588, "CLOSED HAT")
P.bar(CX[6] - 48, CX[6] + 48, 588, "OPEN HAT")
for c, (a, b) in ((3, ("Tom Hi", "Tom Low")), (4, ("Cym", "Cow"))):
    P.raw(f'<circle cx="{CX[c] - 26}" cy="527" r="3.5" fill="#fff"/><text x="{CX[c] - 18}" y="530" class="p" style="text-anchor:start">{a}</text>'
          f'<circle cx="{CX[c] - 26}" cy="543" r="3.5" fill="#555"/><text x="{CX[c] - 18}" y="546" class="p" style="text-anchor:start">{b}</text>')

P.knob("k_dec", CX[0], YA, 20, "DECAY")
P.knob("k_pit", CX[0], YB, 20, "PITCH")
P.knob("k_lvl", CX[0], YC, 20, "LEVEL")
P.knob("s1_dec", CX[1], YA, 20, "DECAY")
P.knob("s1_tone", CX[1], YB, 20, "TONE / SNAP")
P.knob("s1_lvl", CX[1], YC, 20, "LEVEL")
P.knob("s2_dec", CX[2], YA, 20, "DECAY")
P.knob("s2_tone", CX[2], YB, 20, "TONE")
P.knob("s2_lvl", CX[2], YC, 20, "LEVEL")
P.btn("tom_type", CX[3] - 22, 558, 44, 22, "TYPE", tone=LT)
P.knob("tom_pit", CX[3], YB, 20, "PITCH")
P.knob("tom_lvl", CX[3], YC, 20, "LEVEL")
P.btn("cym_type", CX[4] - 22, 558, 44, 22, "TYPE", tone=LT)
P.knob("cym_dec", CX[4], YB, 20, "CYM DECAY")
P.knob("cym_lvl", CX[4], YC, 20, "LEVEL")
P.knob("fm_mod", CX[5], YA, 20, "MOD PITCH")
P.knob("fm_amt", CX[6], YA, 20, "FM AMT")
P.knob("fm_dec", CX[7], YA, 20, "DECAY")
P.knob("hat_tone", CX[5], YB, 20, "HATS TONE")
P.knob("oh_dec", CX[6], YB, 20, "OPEN HAT\nDECAY")
P.knob("fm_car", CX[7], YB, 20, "CARRIER\nPITCH")
P.knob("ch_lvl", CX[5], YC, 20, "LEVEL")
P.knob("oh_lvl", CX[6], YC, 20, "LEVEL")
P.knob("fm_lvl", CX[7], YC, 20, "LEVEL")
PADS = [("pad_k", "KICK", "DRIVE"), ("pad_s1", "SNARE 1", "BODY"), ("pad_s2", "SNARE 2", "CLAP"), ("pad_tom", "TOM HI/LOW", "DECAY"),
        ("pad_cym", "CYM/COW", "CYM TONE"), ("pad_ch", "CLOSED HAT", "CH DECAY"), ("pad_oh", "OPEN HAT", "HARMONICS"), ("pad_fm", "FM DRUM", "PITCH ENV")]
for (id, lab, col), x in zip(PADS, CX):
    P.btn(id, x - 38, YP, 76, 46, lab, tone="#111214")
    P.text(x, 864, col, "l s", "fill:#1d1d1d")

# ---------- back panel ----------
P.raw('<rect x="14" y="892" width="972" height="96" rx="8" fill="none"/>')
BACK = [("j_mix", "MIX\nOUT", 1), ("j_kick", "KICK\nOUT", 1), ("j_snare", "SNARES\nOUT", 1), ("j_hats", "HI-HATS\nOUT", 1),
        ("j_fm", "FM DRUM\nOUT", 1), ("j_phones", "PHONES", 1), ("j_clkin", "CLOCK\nIN", 0), ("j_clkout", "CLOCK\nOUT", 1)]
for (id, lab, out), x in zip(BACK, range(46, 500, 55)):
    P.jack(id, x, 962, lab, bool(out))
P.din("midiin", 540, 962, "MIDI IN")
P.din("midiout", 620, 962, "MIDI OUT")
P.jack("usb", 696, 962, "USB")
P.jack("power", 762, 962, "12V DC")

# ---------- names: the board repeats DECAY, LEVEL, PITCH, TYPE, CURRENT TRACK... these say which one ----------
P.NAMES.update({
    "k_dec": "DECAY (KICK)", "k_pit": "PITCH (KICK)", "k_lvl": "LEVEL (KICK)",
    "s1_dec": "DECAY (SNARE 1)", "s1_tone": "TONE / SNAP", "s1_lvl": "LEVEL (SNARE 1)",
    "s2_dec": "DECAY (SNARE 2)", "s2_tone": "TONE (SNARE 2)", "s2_lvl": "LEVEL (SNARE 2)",
    "tom_type": "TYPE (TOM)", "tom_pit": "PITCH (TOM)", "tom_lvl": "LEVEL (TOM)",
    "cym_type": "TYPE (CYM/COW)", "cym_dec": "CYM DECAY", "cym_lvl": "LEVEL (CYM/COW)",
    "fm_mod": "MOD PITCH", "fm_amt": "FM AMT", "fm_dec": "DECAY (FM)", "fm_car": "CARRIER PITCH", "fm_lvl": "LEVEL (FM)",
    "hat_tone": "HATS TONE", "ch_lvl": "LEVEL (CLOSED HAT)", "oh_dec": "OPEN HAT DECAY", "oh_lvl": "LEVEL (OPEN HAT)",
    "ctswing": "CURRENT TRACK (SWING)", "ctrand": "CURRENT TRACK (RANDOM)", "diston": "ON (DISTORTION)", "meton": "ON (METRONOME)",
    "srled": "נורות STEP REPEAT", "master": "MASTER VOLUME", "metvol": "METRO VOLUME",
    "rp1": "STRIP 1/4", "rp2": "STRIP 1/8", "rp3": "STRIP 1/16", "rp4": "STRIP 1/32",
    "pad_k": "PAD KICK", "pad_s1": "PAD SNARE 1", "pad_s2": "PAD SNARE 2", "pad_tom": "PAD TOM", "pad_cym": "PAD CYM/COW",
    "pad_ch": "PAD CLOSED HAT", "pad_oh": "PAD OPEN HAT", "pad_fm": "PAD FM DRUM",
    "prev": "<<", "next": ">>",
})
for i in range(1, 17):
    P.NAMES[f"st{i}"] = str(i)
P.EXTRA.update({"CURRENT TRACK": ["ctswing", "ctrand"], "STEP REPEAT": ["rp1", "rp2", "rp3", "rp4"], "PTRN": ["ptrn"], "ACCENT": ["accent"]})

# ---------- what each control does (official manual 1.0) ----------
P.INFO.update({
    "rec": "הקלטה. ● ואז ▶: מכים בפדים, והם נכנסים לתבנית. SHIFT + ●: הקלטה בלי יישור לצעדים (Unquantized).",
    "stop": "עוצר. שלוש לחיצות מהירות משתיקות כל צליל תקוע (All Notes Off).",
    "play": "מנגן. לחיצה בזמן נגינה: השהיה.",
    "sync": "מי קובע את הקצב. כל לחיצה עוברת לאפשרות הבאה: INT (האימפקט עצמו), USB, MIDI, CLK (שקע CLOCK IN מאחור). הנורה מראה מה נבחר.",
    "erase": "מחיקה. ERASE ואז פד: מוחק את הכלי מהתבנית. בזמן הקלטה: מחזיקים ERASE ומכים בפד, והמכות שלו נמחקות בסיבוב.",
    "copy": "העתקה. COPY, PTRN, ואז לחצן צעד: מעתיק את התבנית למקום הזה. COPY ואז פד: מעתיק כלי.",
    "prev": "קבוצת 16 הצעדים הקודמת, בתבנית ארוכה מ־16.",
    "save": "שמירה. מחזיקים SAVE ולוחצים PTRN: שומר את התבנית. בלי זה, השינויים נעלמים בכיבוי.",
    "next": "קבוצת 16 הצעדים הבאה. SHIFT + >>: מכפיל את התבנית, עם התווים שבה (Extend).",
    "last": "אורך התבנית. מחזיקים LAST STEP ולוחצים על לחצן הצעד האחרון.",
    "dist": "עיוות על המיקס הראשי. עובד רק כשהלחצן ON דולק. לא נכנס ליציאות הנפרדות.",
    "diston": "מדליק ומכבה את העיוות.",
    "master": "העוצמה ביציאה הראשית ובאוזניות.",
    "rate": "הקצב. SHIFT + סיבוב: כיוון עדין, בחלקים של מאית.",
    "tap": "קצב בהקשה: מקישים כמה פעמים בקצב. לא עובד כשהקצב בא ממכשיר אחר.",
    "song": "מצב שיר: שרשרת של תבניות. SHIFT + SONG: חוזר לשיר השמור.",
    "bank": "בנק: ארבעה בנקים (A עד D) של 16 תבניות. BANK ואז לחצן 1 עד 4. SHIFT + BANK: חוזר לבנק השמור.",
    "ptrn": "תבנית: PTRN ואז לחצן 1 עד 16. SHIFT + PTRN: מבטל את השינויים וחוזר לתבנית השמורה.",
    "step": "מצב צעדים: 16 הלחצנים מראים את הכלי שנבחר. לחצן דולק: יש מכה. נגיעה מוסיפה או מוחקת.",
    "accent": "מצב הדגשה: נגיעה בצעד הופכת אותו למודגש (אדום). נגיעה שנייה מורידה את ההדגשה, והמכה נשארת.",
    "swing": "שאפל, מ־50 (ישר) עד 75. SHIFT + סיבוב: מזיז את כל הכלי קצת מוקדם או מאוחר. מחזיקים צעד ומסובבים: מזיז רק אותו.",
    "ctswing": "דולק: השאפל משפיע רק על הכלי שנבחר. כבוי: על כל התבנית.",
    "random": "אקראיות, מ־0 עד 100. משנה את הקצב, אם מכה מופיעה, ואם היא מודגשת. 0: כלום.",
    "ctrand": "דולק: האקראיות משפיעה רק על הכלי שנבחר. כבוי: על כל התבנית.",
    "srled": "מראות כמה פעמים צעד חוזר על עצמו, מ־1 עד 4, כשמחזיקים צעד במצב צעדים.",
    "rp1": "פס המגע, 1/4. בנגינה, עם מחזיקים לחצן צעד: הלולאה (Looper) חוזרת על רבע. עם מחזיקים פד ו־ROLLER דולק: גלגול לאט.",
    "rp2": "פס המגע, 1/8.",
    "rp3": "פס המגע, 1/16.",
    "rp4": "פס המגע, 1/32: הכי מהיר.",
    "metvol": "העוצמה של המטרונום.",
    "meton": "מטרונום דולק או כבוי. מחזיקים ON ולוחצים 1 עד 5: איזה ערך הוא מקיש.",
    "mute": "השתקה: MUTE, ואז הפדים שרוצים להשתיק. שוב MUTE: מחזיר. SHIFT + MUTE: מנקה.",
    "solo": "סולו: SOLO, ואז הפדים שרוצים לשמוע לבד. SHIFT + SOLO: מנקה.",
    "shift": "הפונקציה השנייה, הכתובה בכחול. SHIFT + פד: בוחר כלי בלי לנגן אותו.",
    "color": "הגוון השני של כל כלי, הכתוב בכתום מתחת לפד. מחזיקים COLOR ומכים בפד: מכה בגוון השני. SHIFT + COLOR: COLOR נשאר דולק.",
    "k_dec": "אורך הקיק. קצר: הדוק. ארוך: בום נמרח.",
    "k_pit": "הגובה של הקיק.",
    "k_lvl": "עוצמת הקיק.",
    "s1_dec": "אורך הרחש (השרשרת) של סנר 1.",
    "s1_tone": "האיזון בין גוף התוף לרחש. שמאלה: יותר תוף. ימינה: יותר רחש.",
    "s1_lvl": "עוצמת סנר 1.",
    "s2_dec": "אורך סנר 2.",
    "s2_tone": "סנר 2 הוא רעש עם מסנן. TONE מזיז את המסנן: כהה או בהיר.",
    "s2_lvl": "עוצמת סנר 2.",
    "tom_type": "בוחר איזה טום הפד מנגן: גבוה או נמוך. הנורה מראה.",
    "tom_pit": "הגובה של שני הטומים יחד.",
    "tom_lvl": "העוצמה של שני הטומים.",
    "cym_type": "בוחר מה הפד מנגן: מצילה או פעמון (Cowbell).",
    "cym_dec": "אורך המצילה.",
    "cym_lvl": "העוצמה של המצילה והפעמון.",
    "fm_mod": "הגובה של המתנד שמלכלך. הוא קובע את הצבע: פעמון, מתכת, או רעש.",
    "fm_amt": "כמה הלכלוך נכנס. אפס: צליל נקי. גבוה: מתכת.",
    "fm_dec": "אורך התוף של ה־FM.",
    "fm_car": "הגובה הבסיסי של תוף ה־FM: מבום נמוך ועד טיק.",
    "fm_lvl": "עוצמת תוף ה־FM.",
    "hat_tone": "הבהירות של שני ההיי־האטים יחד, הסגור והפתוח.",
    "ch_lvl": "עוצמת ההיי־האט הסגור.",
    "oh_dec": "אורך ההיי־האט הפתוח.",
    "oh_lvl": "עוצמת ההיי־האט הפתוח.",
    "pad_k": "מכה בקיק. רגיש לחוזק: מכה חזקה נשמרת כמודגשת. COLOR: DRIVE, קיק מלוכלך.",
    "pad_s1": "מכה בסנר 1. COLOR: BODY, יותר גוף.",
    "pad_s2": "מכה בסנר 2. COLOR: CLAP, מחיאת כף.",
    "pad_tom": "מכה בטום שנבחר ב־TYPE. COLOR: DECAY, טום ארוך.",
    "pad_cym": "מכה במצילה או בפעמון, לפי TYPE. COLOR: CYM TONE, מצילה אחרת. לפעמון אין COLOR.",
    "pad_ch": "מכה בהיי־האט הסגור. הוא חותך את הפתוח. COLOR: CH DECAY, סגור ארוך.",
    "pad_oh": "מכה בהיי־האט הפתוח. COLOR: HARMONICS, צבע מתכתי אחר.",
    "pad_fm": "מכה בתוף ה־FM. COLOR: PITCH ENV, הגובה צונח בכל מכה.",
    "j_mix": "היציאה הראשית, למיקסר. כל הכלים, עם העיוות.",
    "j_kick": "הקיק לבד. כשמחובר כאן כבל, הקיק יוצא מהיציאה הראשית. העיוות הכללי לא נכנס, ה־DRIVE כן.",
    "j_snare": "שני הסנרים לבד. כשמחובר כבל, הם יוצאים מהיציאה הראשית.",
    "j_hats": "שני ההיי־האטים לבד. כשמחובר כבל, הם יוצאים מהיציאה הראשית.",
    "j_fm": "תוף ה־FM לבד. כשמחובר כבל, הוא יוצא מהיציאה הראשית.",
    "j_phones": "אוזניות. אותו צליל כמו היציאה הראשית, ו־MASTER VOLUME שולט בו.",
    "j_clkin": "כניסת שעון ממכשיר בלי מידי. כש־SYNC על CLK.",
    "j_clkout": "יציאת שעון: דפיקות לקצב, למכשיר אחר. SHIFT + SYNC + סיבוב RATE: כמה דפיקות (1P, 2P, 24P, 48P).",
    "midiin": "כניסת מידי עגולה: שעון ממכשיר אחר (כש־SYNC על MIDI), או תווים שמנגנים את הכלים.",
    "midiout": "יציאת מידי: שעון ותווים למכשיר אחר.",
    "usb": "למחשב: סנכרון, עדכון תוכנה, ותוכנת העריכה של ארטוריה (MIDI Control Center). לא נותן חשמל.",
    "power": "ספק 12 וולט, וכפתור הפעלה.",
})
for i in range(1, 17):
    P.INFO[f"st{i}"] = (f"לחצן {i}. במצב צעדים: הצעד ה־{i}. במצב PTRN: תבנית {i}."
                        + (f" במצב BANK: בנק {'ABCD'[i - 1]}." if i <= 4 else "")
                        + (f" SHIFT + {i}: {STEP_BLUE[i]}." if i in STEP_BLUE else ""))

KNOBS1 = ["k_dec", "k_pit", "k_lvl", "s1_dec", "s1_tone", "s1_lvl", "s2_dec", "s2_tone", "s2_lvl"]
KNOBS2 = ["tom_type", "tom_pit", "tom_lvl", "cym_type", "cym_dec", "cym_lvl", "fm_mod", "fm_amt", "fm_dec", "hat_tone", "oh_dec", "fm_car", "ch_lvl", "oh_lvl", "fm_lvl"]
PADIDS = [p[0] for p in PADS]
P.AREAS = [
    ["למעלה: תצוגה, נגינה, תבניות ועיוות", ["rec", "stop", "play", "sync", "erase", "copy", "prev", "save", "next", "last", "dist", "diston", "master"]],
    ["אמצע: קצב, מצבים, שאפל ואקראיות", ["rate", "tap", "song", "bank", "ptrn", "step", "accent", "swing", "ctswing", "random", "ctrand", "srled", "rp1", "rp2", "rp3", "rp4"]],
    ["16 הלחצנים", [f"st{i}" for i in range(1, 17)]],
    ["משמאל: מטרונום, השתקה, SHIFT ו־COLOR", ["metvol", "meton", "mute", "solo", "shift", "color"]],
    ["הכלים", KNOBS1 + KNOBS2 + PADIDS],
    ["מאחור", [b[0] for b in BACK] + ["midiin", "midiout", "usb", "power"]],
]
P.POOL = ["k_dec", "k_pit", "s1_tone", "s2_tone", "fm_amt", "fm_mod", "hat_tone", "oh_dec", "dist", "swing", "random", "rate",
          "step", "accent", "last", "color", "shift", "mute", "rp3", "st16", "pad_k", "sync"]

C = P.C
ALIAS = P.alias()


def build():
    return P.build()


if __name__ == "__main__":
    print(build())
