"""Figures for the Crave lessons: name -> (lit controls, [(numbered control, legend), ...]); PLACE: card -> figure.
Card keys use file numbers: "24:1.1" is lesson-24.html, card 1.1. Lit = marks when the first list is empty."""

SEQ = ["tempo", "holdrest", "resetacc", "arp", "pattern", "shift", "page", "play", "rec", "kybd", "step", "leds"]
KEYS = [f"s{i}" for i in range(1, 9)] + [f"b{j}" for j in range(1, 6)]
SOUND = ["freq", "pw", "oscmod", "mix", "shape", "oscsrc", "oscdest", "cutoff", "reso", "vcfmod", "vcfmode", "vcfsrc",
         "vcfpol", "volume", "vcamode", "attack", "decay", "sustain", "susw", "lforate", "lfoled", "lfoshape", "glide", "vcmix"]

FIGS = {
    # lesson 1 (file 24): intro
    "cr-00": ((), [("j_osccv", "לוח השקעים: כבלים"), ("freq", "המתנד"), ("cutoff", "המסנן"), ("volume", "המגבר"),
                   ("attack", "המעטפת"), ("lforate", "התנועה"), ("glide", "עזרים"), ("tempo", "הסיקוונסר"), ("s1", "הקלידים")]),
    "cr-01": ((), [("cutoff", "כפתור: מסובבים"), ("vcamode", "מתג: שמאל או ימין"), ("play", "לחצן: לוחצים"),
                   ("s1", "קליד, וגם STEP 1"), ("leds", "הנורות"), ("j_osccv", "שקע כניסה: שם במסגרת"), ("j_vca", "שקע יציאה: שם על שחור")]),
    "cr-02": ((), [("shift", "מחזיקים"), ("play", "לוחצים ומשחררים")]),
    "cr-03": (["leds", "kybd", "step", "pattern"] + KEYS[:8], [("leds", "אדום, ירוק או צהוב"), ("kybd", "אוקטבה למטה"),
                                                              ("step", "אוקטבה למעלה"), ("pattern", "מחזיקים: מספר רצף בירוק")]),
    "cr-04": ((), [("j_phones", "אוזניות"), ("j_vca", "למיקסר"), ("volume", "קודם לאפס"), ("power", "דולקת כשדלוק")]),
    "cr-05": (KEYS + ["volume", "kybd", "step", "leds"], [("s1", "מנגנים"), ("volume", "לאט למעלה"), ("step", "אוקטבה למעלה"),
                                                         ("kybd", "אוקטבה למטה"), ("leds", "הנורה האדומה זזה")]),
    "cr-06": ((), [("play", "נגינת רצף"), ("rec", "הקלטה"), ("shift", "עם צעד: עריכה"), ("arp", "ארפג׳יו"),
                   ("holdrest", "עם SHIFT ו־STEP 8: הגדרות"), ("s8", "STEP 8")]),
    "cr-07": ((), [("shift", "מחזיקים"), ("kybd", "מצב קלידים"), ("step", "מצב צעדים"), ("leds", "ירוק או צהוב")]),
    "cr-08": ((), [("play", "דולק? לוחצים"), ("holdrest", "הגדרות: SHIFT + HOLD/REST + STEP 8"), ("shift", "צעד מהבהב: SHIFT + הצעד"),
                   ("rec", "דולק? לוחצים"), ("arp", "ארפג׳יו? לוחצים")]),
    "cr-09": (SOUND, [("shape", "SAW"), ("vcfmode", "LP"), ("vcfsrc", "ENV"), ("vcfpol", "+"), ("vcamode", "ENV"), ("susw", "OFF")]),
    "cr-10": ((), [("shift", "מחזיקים"), ("kybd", "מצב קלידים"), ("leds", "ירוק, ואוקטבה באמצע")]),
    # lesson 2 (file 17): the sound
    "cr-11": (["freq", "kybd", "step", "leds"] + KEYS, [("freq", "גובה"), ("step", "אוקטבה למעלה"), ("kybd", "אוקטבה למטה")]),
    "cr-12": ((), [("shape", "SAW או PULSE"), ("pw", "רק ב־PULSE")]),
    "cr-13": ((), [("mix", "שמאל מתנד, ימין רעש")]),
    "cr-14": ((), [("oscsrc", "LFO, אחר כך ENV"), ("oscdest", "FREQ"), ("oscmod", "כמה")]),
    "cr-15": ((), [("cutoff", "פתוח או סגור"), ("reso", "שריקה")]),
    "cr-16": ((), [("vcfmode", "HP"), ("cutoff", "ימינה")]),
    "cr-17": ((), [("vcfsrc", "ENV"), ("vcfpol", "+"), ("cutoff", "שעה 9"), ("reso", "שעה 1"), ("vcfmod", "שעה 2"), ("decay", "קצר או ארוך")]),
    "cr-18": ((), [("attack", "כניסה"), ("decay", "נפילה")]),
    "cr-19": ((), [("susw", "ON"), ("sustain", "שעה 2"), ("decay", "אחרי שעוזבים")]),
    "cr-20": ((), [("vcamode", "ON: לא נגמר"), ("cutoff", "לאט")]),
    "cr-21": ((), [("vcamode", "ON, לשמוע רציף"), ("vcfsrc", "LFO"), ("reso", "שעה 1"), ("vcfmod", "שעה 12"),
                   ("lforate", "מהירות"), ("lfoshape", "TRI או SQU")]),
    "cr-22": ((), [("glide", "שעה 11")]),
    # lesson 3 (file 18): the sequencer
    "cr-23": (SEQ + ["glide"], [("shift", "תפקיד שני"), ("play", "נגינה"), ("rec", "הקלטה"), ("holdrest", "הקפאה, שקט"),
                                ("resetacc", "התחלה, הדגשה"), ("arp", "ארפג׳יו, סוף הרצף"), ("pattern", "רצף ובנק"), ("page", "עמוד")]),
    "cr-24": ((), [("shift", "מחזיקים"), ("kybd", "מצב קלידים"), ("resetacc", "מחזיקים"), ("pattern", "שלושתם יחד: ניקוי")]),
    "cr-25": (["rec", "holdrest"] + KEYS, [("rec", "התחלה וסוף"), ("s1", "C"), ("s4", "F"), ("s5", "G"), ("s8", "C גבוה"), ("holdrest", "שקט")]),
    "cr-26": ((), [("shift", "מחזיקים"), ("arp", "מחזיקים"), ("s8", "סוף בצעד 8"), ("play", "נגינה"), ("tempo", "מהירות")]),
    "cr-27": ((), [("shift", "מחזיקים"), ("step", "מצב צעדים"), ("s3", "הצעד לעריכה")]),
    "cr-28": ((), [("shift", "מחזיקים"), ("s4", "פותחים וסוגרים"), ("glide", "גלישה"), ("s6", "צעד 6"), ("resetacc", "הדגשה"),
                   ("leds", "5 גלישה, 6 חזרות, 7 הדגשה")]),
    "cr-29": ((), [("shift", "מחזיקים"), ("s1", "פותחים וסוגרים"), ("tempo", "אורך התו"), ("glide", "עם SHIFT: חזרות"), ("leds", "הערך")]),
    "cr-30": (["rec", "shift", "s8"] + KEYS, [("rec", "פתיחה וסגירה"), ("shift", "מחזיקים"), ("s8", "הצעד")]),
    "cr-31": ((), [("shift", "מחזיקים"), ("play", "2 שניות"), ("s2", "מקום 2"), ("pattern", "בנק, אם רוצים"), ("rec", "עם SHIFT: שמירה")]),
    "cr-32": ((), [("pattern", "מחזיקים"), ("s2", "רצף 2"), ("shift", "עם PATTERN: בנק"), ("play", "נגינה")]),
    "cr-33": ((), [("holdrest", "הקפאה, ועם SHIFT השתקה"), ("resetacc", "התחלה, ועם SHIFT הכל מודגש"), ("shift", "מחזיקים"),
                   ("glide", "עם SHIFT: חזרות"), ("tempo", "עם SHIFT: סווינג"), ("kybd", "אוקטבה"), ("step", "אוקטבה"), ("play", "עם SHIFT: הפוך")]),
    "cr-34": ((), [("arp", "ארפג׳יו"), ("s1", "C"), ("s3", "E"), ("s5", "G"), ("holdrest", "ממשיך לבד")]),
    # lesson 4 (file 19): cables
    "cr-35": ([k for k in ("midiin", "midithru")] + ["j_" + x for x in ("osccv", "oscfm", "oscmod", "vcfcut", "vcfres", "mix1", "mix2", "vcmixin",
               "multin", "mult1", "mult2", "pulse", "saw", "env", "noise", "vca", "phones", "mixcv", "ext", "tempo", "play", "reset",
               "hold", "envgate", "vcacv", "lforate", "lfotri", "lfosqu", "vcmixout", "assign", "kbcv", "gate", "vcf")],
              [("j_osccv", "כניסה: שם בתוך מסגרת"), ("j_vca", "יציאה: שם על שחור")]),
    "cr-36": ((), [("j_lfotri", "יוצא"), ("j_vcfcut", "נכנס"), ("lforate", "שעה 9")]),
    "cr-37": ((), [("j_kbcv", "יוצא"), ("j_vcfcut", "נכנס")]),
    "cr-38": ((), [("j_noise", "יוצא"), ("j_vcfcut", "נכנס"), ("reso", "שעה 1")]),
    "cr-39": ((), [("j_env", "יוצא"), ("j_vcfres", "נכנס"), ("decay", "בין 9 ל־12")]),
    "cr-40": ((), [("j_lfotri", "יוצא"), ("j_multin", "נכנס למפצל"), ("j_mult1", "עותק 1"), ("j_mult2", "עותק 2"),
                   ("j_vcfcut", "יעד 1"), ("j_vcfres", "יעד 2")]),
    # lesson 5 (file 26): tricks
    "cr-41": ((), [("shift", "מחזיקים"), ("arp", "מחזיקים"), ("s4", "קצר"), ("s8", "חזרה לשמונה")]),
    "cr-42": ((), [("kybd", "בשבירה"), ("step", "בדרופ")]),
    "cr-43": ((), [("oscsrc", "LFO"), ("oscdest", "FREQ"), ("lfoshape", "SQU"), ("oscmod", "גובה הקפיצה"), ("lforate", "מהירות")]),
    "cr-44": ((), [("shape", "PULSE"), ("oscsrc", "LFO"), ("oscdest", "WIDTH"), ("lfoshape", "TRI"), ("lforate", "שעה 9"), ("oscmod", "שעה 12")]),
    "cr-45": ((), [("play", "עוצרים את הקו"), ("vcamode", "ON"), ("mix", "ימינה: רעש"), ("cutoff", "נפתח לאט")]),
    "cr-46": ((), [("holdrest", "עם SHIFT ו־STEP 8: הגדרות"), ("step", "עמוד 2"), ("s8", "ערך 8: אקראי"), ("j_assign", "יוצא"),
                   ("j_vcfcut", "נכנס"), ("cutoff", "נמוך")]),
    "cr-47": ((), [("holdrest", "עם SHIFT ו־STEP 8: הגדרות"), ("step", "עמוד 2"), ("s1", "ערך 1: הדגשה"), ("j_assign", "יוצא"), ("j_vcfres", "נכנס")]),
    "cr-48": ((), [("j_lfosqu", "יוצא"), ("j_hold", "נכנס"), ("lforate", "מהירות ההקפאות")]),
    # together lesson 3 (file 23)
    "cr-49": ((), [("holdrest", "עם SHIFT ו־STEP 8: הגדרות"), ("step", "פעמיים: עמוד 3"), ("s2", "ערך 2: MIDI"), ("leds", "נורה 2 ירוקה"),
                   ("midiin", "מהטי־8"), ("midithru", "לאדג׳")]),
    "cr-50": ((), [("j_assign", "יוצא לאדג׳: ADV/CLOCK")]),
    "cr-51": ((), [("j_gate", "יוצא לאדג׳: PLAY/STOP")]),
    "cr-52": ((), [("j_vca", "לערוץ 1 במיקסר"), ("j_phones", "או אוזניות"), ("volume", "שעה 12")]),
}

PLACE = {
    "24:1.1": "cr-00", "24:2.1": "cr-01", "24:2.2": "cr-02", "24:2.3": "cr-03", "24:3.1": "cr-04", "24:3.2": "cr-05",
    "24:4.1": "cr-06", "24:4.2": "cr-07", "24:4.3": "cr-08", "24:5.1": "cr-09", "24:5.2": "cr-10",
    "17:1.1": "cr-11", "17:1.2": "cr-12", "17:1.3": "cr-13", "17:1.4": "cr-14", "17:2.1": "cr-15", "17:2.2": "cr-16",
    "17:2.3": "cr-17", "17:3.1": "cr-18", "17:3.2": "cr-19", "17:3.3": "cr-20", "17:4.1": "cr-21", "17:4.2": "cr-22",
    "18:1.1": "cr-23", "18:1.2": "cr-24", "18:1.3": "cr-25", "18:1.4": "cr-26", "18:2.1": "cr-27", "18:2.2": "cr-28",
    "18:2.3": "cr-29", "18:2.4": "cr-30", "18:3.1": "cr-31", "18:3.2": "cr-32", "18:4.1": "cr-33", "18:4.2": "cr-34",
    "19:1.3": "cr-35", "19:2.1": "cr-36", "19:2.2": "cr-37", "19:2.3": "cr-38", "19:2.4": "cr-39", "19:2.5": "cr-40",
    "26:1.1": "cr-41", "26:1.2": "cr-42", "26:2.1": "cr-43", "26:2.2": "cr-44", "26:2.3": "cr-45", "26:3.1": "cr-46",
    "26:3.2": "cr-47", "26:3.3": "cr-48",
}
# cr-49 to cr-52 are placed by hand in build.py (together lesson: two panels side by side)
