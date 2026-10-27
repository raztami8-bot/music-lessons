"""Figures for the Edge lessons: name -> (lit controls, [(numbered control, legend), ...]); PLACE: card -> figure.
Card keys use file numbers: "25:1.1" is lesson-25.html, card 1.1. Lit = marks when the first list is empty.
Steps are lit without numbers, so a badge never looks like a step number."""

P = [f"p{i}" for i in range(1, 9)]
V = [f"v{i}" for i in range(1, 9)]
JACKS = ["midiin", "midiout"] + ["j_" + x for x in ("osc1cv", "osc2cv", "oscdec", "adv", "trigin", "velin", "noisein", "osc1", "osc2",
                                                      "osceg", "trigout", "velout", "phones", "fmin", "ext", "tempo", "play", "vcfmod",
                                                      "vcfdec", "vcacv", "vcadec", "pitchout", "vcfeg", "vca", "vcaeg")]

FIGS = {
    # lesson 1 (file 25): intro
    "ed-00": ((), [("j_osc1cv", "לוח השקעים: כבלים"), ("osc1freq", "שורה 1: מתנד 1, רעש ומגבר"), ("osc2freq", "שורה 2: מתנד 2 ומסנן"),
                   ("tempo", "הסיקוונסר"), ("p1", "שמונה צעדים")]),
    "ed-01": (["v1"], [("cutoff", "כפתור"), ("osc1env", "אפס באמצע: נקודה צהובה"), ("vcamode", "מתג: למעלה או למטה"),
                       ("seqpitch", "מתג של שלושה מצבים"), ("play", "לחצן"), ("p1", "צעד: PITCH למעלה, VEL למטה"),
                       ("j_osc1cv", "שקע כניסה: שם במסגרת"), ("j_vca", "שקע יציאה: שם על שחור")]),
    "ed-02": ((), [("osc1freq", "FREQUENCY (VCO 1)"), ("osc2freq", "FREQUENCY (VCO 2)"), ("osc1env", "ENVELOPE (VCO 1)"),
                   ("osc2env", "ENVELOPE (VCO 2)"), ("vcfenv", "ENVELOPE (VCF)"), ("egdec", "DECAY (EG)"), ("vcadec", "DECAY (VCA)"),
                   ("vcfdec", "DECAY (VCF)")]),
    "ed-03": ((), [("j_phones", "אוזניות"), ("j_vca", "למיקסר"), ("clock", "INT/EXT"), ("volume", "קודם לאפס"), ("led", "דולקת כשדלוק")]),
    "ed-04": ((), [("play", "נגינה ועצירה"), ("volume", "לאט למעלה"), ("tempo", "מהירות")]),
    "ed-05": ((), [("clock", "מי קובע את הקצב"), ("tempo", "עובד רק ב־INT/EXT"), ("scale", "רק במידי וב־USB"),
                   ("midiin", "השעון מהטי־8"), ("j_adv", "כבל כאן: הקצב מבחוץ")]),
    "ed-06": ((), [("play", "רץ או עצור"), ("advance", "צעד קדימה"), ("trigger", "הצעד הנוכחי, לבד")]),
    "ed-07": (V, [("clock", "INT/EXT"), ("j_adv", "לשלוף"), ("volume", "למעלה")]),
    "ed-08": ([c for c in ("osc1freq", "osc1env", "osc1lvl", "egdec", "osc2freq", "osc2env", "osc2lvl", "fm", "noise", "cutoff", "reso",
                           "vcfdec", "vcfenv", "noisevcf", "vcadec", "volume") + tuple(P + V)],
              [("osc1shape", "TRI"), ("hardsync", "OFF"), ("seqpitch", "OFF"), ("vcfsel", "LP"), ("vcamode", "FAST"), ("clock", "INT/EXT")]),
    "ed-09": (V, [("osc2lvl", "לאפס"), ("fm", "לאפס"), ("noise", "לאפס"), ("noisevcf", "לאפס"), ("seqpitch", "OFF"),
                  ("osc1freq", "שעה 9"), ("osc1env", "שעה 2"), ("vcadec", "שעה 11")]),
    # lesson 2 (file 20): the sound
    "ed-10": ((), [("play", "עוצרים"), ("trigger", "מכה אחת")]),
    "ed-11": ((), [("osc1freq", "גובה"), ("osc1shape", "TRI או PULSE"), ("osc1lvl", "כמה נשמע")]),
    "ed-12": ((), [("osc1env", "כמה צונח"), ("egdec", "כמה מהר")]),
    "ed-13": ((), [("osc2lvl", "שעה 2"), ("osc2freq", "צלצול"), ("fm", "מתכת"), ("hardsync", "שריקה")]),
    "ed-14": ((), [("noise", "כמה רעש"), ("noisecolor", "WHITE או PINK")]),
    "ed-15": ((), [("cutoff", "פתוח או עמום"), ("reso", "שריקה"), ("vcfsel", "LP או HP")]),
    "ed-16": ((), [("cutoff", "שעה 9"), ("reso", "שעה 12"), ("vcfenv", "כמה נפתח"), ("vcfdec", "כמה מהר נסגר")]),
    "ed-17": ((), [("noisevcf", "חספוס"), ("reso", "שעה 12")]),
    "ed-18": ((), [("vcadec", "טיק או בום"), ("vcamode", "FAST או SLOW")]),
    # lesson 3 (file 21): the sequencer
    "ed-19": (P + V, [("seqpitch", "חייב לא להיות OFF כדי ש־PITCH ישפיע")]),
    "ed-20": ((), [("play", "נגינה ועצירה"), ("tempo", "מהירות"), ("advance", "צעד קדימה"), ("trigger", "הצעד, לבד")]),
    "ed-21": (V, []),
    "ed-22": (["v3", "v7", "p3", "p7"], [("seqpitch", "VCO 1&2")]),
    "ed-23": (["v8", "p8", "v4", "v6"], [("noise", "שעה 10")]),
    "ed-24": (P, [("seqpitch", "VCO 2"), ("osc2lvl", "שעה 12")]),
    "ed-25": (V, [("vcadec", "אורך"), ("egdec", "בום או לייזר"), ("cutoff", "בילד"), ("fm", "מתכת")]),
    "ed-26": ((), [("tempo", "עד הסוף ימינה"), ("clock", "רק ב־INT/EXT")]),
    # lesson 4 (file 22): cables
    "ed-27": (JACKS, [("j_osc1cv", "כניסה: שם בתוך מסגרת"), ("j_vca", "יציאה: שם על שחור")]),
    "ed-28": (V, [("j_velout", "יוצא"), ("j_noisein", "נכנס")]),
    "ed-29": (P, [("seqpitch", "OFF"), ("j_pitchout", "יוצא"), ("j_vcadec", "נכנס")]),
    "ed-30": ((), [("j_osc2", "יוצא"), ("j_vcfmod", "נכנס"), ("noisevcf", "כמה"), ("osc2freq", "צבע הנהמה")]),
    "ed-31": ((), [("j_vcaeg", "יוצא"), ("j_fmin", "נכנס"), ("fm", "לאפס")]),
    # lesson 5 (file 27): tricks
    "ed-32": (V, [("vcadec", "שעה 12")]),
    "ed-33": (["p5", "p6", "p7", "p8"], [("seqpitch", "OFF, ולמעלה רק בפיל")]),
    "ed-34": ((), [("advance", "בזמן נגינה")]),
    "ed-35": ((), [("trigger", "מכה ביד"), ("advance", "הצליל הבא")]),
    "ed-36": (P + V, [("seqpitch", "VCO 1&2"), ("osc1env", "שעה 12"), ("osc1shape", "PULSE"), ("vcadec", "שעה 2"),
                      ("cutoff", "שעה 10"), ("reso", "שעה 12"), ("vcfenv", "שעה 2")]),
    "ed-37": (P, [("hardsync", "ON"), ("seqpitch", "VCO 2"), ("osc2lvl", "שעה 2"), ("osc1lvl", "שעה 10")]),
    "ed-38": ((), [("osc1env", "שמאלה: עולה"), ("egdec", "שעה 2")]),
    "ed-39": (V, [("j_velout", "יוצא"), ("j_tempo", "נכנס"), ("clock", "INT/EXT")]),
    "ed-40": ((), [("j_osc2", "יוצא"), ("j_osc1cv", "נכנס"), ("osc2freq", "צבע הנהמה")]),
    # together lesson 3 (file 23)
    "ed-41": ((), [("midiin", "מהקרייב, MIDI THRU"), ("clock", "MIDI, למעלה"), ("scale", "1/16")]),
    "ed-42": ((), [("j_adv", "נכנס מהקרייב: ASSIGN"), ("clock", "INT/EXT")]),
    "ed-43": ((), [("j_play", "נכנס מהקרייב: GATE"), ("clock", "INT/EXT"), ("tempo", "הקצב של האדג׳")]),
    "ed-44": ((), [("j_vca", "לערוץ 2 במיקסר"), ("j_phones", "או אוזניות"), ("volume", "שעה 12")]),
}

PLACE = {
    "25:1.1": "ed-00", "25:2.1": "ed-01", "25:2.2": "ed-02", "25:3.1": "ed-03", "25:3.2": "ed-04", "25:4.1": "ed-05",
    "25:4.2": "ed-06", "25:4.3": "ed-07", "25:5.1": "ed-08", "25:5.2": "ed-09",
    "20:1.1": "ed-10", "20:1.2": "ed-11", "20:1.3": "ed-12", "20:1.4": "ed-13", "20:2.1": "ed-14", "20:2.2": "ed-15",
    "20:2.3": "ed-16", "20:2.4": "ed-17", "20:3.1": "ed-18",
    "21:1.1": "ed-19", "21:1.3": "ed-20", "21:2.1": "ed-21", "21:2.2": "ed-22", "21:2.3": "ed-23", "21:2.4": "ed-24",
    "21:3.1": "ed-25", "21:3.2": "ed-26",
    "22:1.2": "ed-27", "22:2.1": "ed-28", "22:2.2": "ed-29", "22:2.3": "ed-30", "22:2.4": "ed-31",
    "27:1.1": "ed-32", "27:1.2": "ed-33", "27:1.3": "ed-34", "27:1.4": "ed-35", "27:2.1": "ed-36", "27:2.2": "ed-37",
    "27:2.3": "ed-38", "27:3.1": "ed-39", "27:3.2": "ed-40",
}
# ed-41 to ed-44 are placed by hand in build.py (together lesson: two panels side by side)
