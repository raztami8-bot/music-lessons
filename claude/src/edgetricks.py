"""Everything you can do on the Edge, grouped by what you want to achieve.
Used by build.py to make edge-map.html (same format as tricks.py; panel ids from edgemap.py).

Each trick: (id, title, one line, seq, cards, extra_controls, also)
  seq    = combination in kit syntax ("tap:ADVANCE,tap:TRIGGER"), or "" when it is just knobs and switches.
           Works on any step? Write the example as @vel:N or @pitch:N and give the trick a line in ANY.
  cards  = where it is taught: "21:1.3" -> lesson-21.html#l21-1-3 (file numbers)
  extra_controls = panel ids for tricks without a seq, or to add to it (see edgemap.P.C)
"""

GOALS = [
    ("start", "להתמצא", "קצב, נגינה, וצעד אחד לבד.", [
        ("play", "נגינה ועצירה", "מהצעד שבו הוא עומד. הלחצן דולק כשמנגן.", "tap:PLAY/STOP", ["25:3.2", "21:1.3"], [], []),
        ("tempo", "מהירות", "רק כש־CLOCK על INT/EXT.", "turn:TEMPO,ear", ["25:3.2", "21:1.3"], ["clock"], []),
        ("clock", "מי קובע את הקצב", "INT/EXT: האדג׳ או כבל. MIDI: הטי־8. USB: מחשב.", "", ["25:4.1"], ["clock", "scale"], []),
        ("audition", "צעד לבד", "כשעצור: ADVANCE עד הצעד, ואז TRIGGER.", "tap:ADVANCE,tap:TRIGGER", ["25:4.2", "21:1.3"], [], []),
        ("home", "חזרה הביתה", "שלושה שלבים, חצי דקה.", "", ["25:5.2"], ["osc2lvl", "fm", "noise", "noisevcf", "osc1freq", "osc1env", "vcadec"], []),
    ]),
    ("sound", "לעצב מכה", "מתנדים, רעש, מסנן ואורך.", [
        ("body", "גוף", "נמוך: קיק. גבוה: טום.", "turn:FREQUENCY (VCO 1),ear", ["20:1.2"], ["osc1shape"], []),
        ("boom", "בום", "כמה הגובה צונח, וכמה מהר.", "turn:ENVELOPE (VCO 1),ear,turn:DECAY (EG),ear", ["20:1.3"], [], []),
        ("metal", "מתכת", "מתנד 2, FM ו־HARD SYNC.", "turn:1-2 FM AMT,ear", ["20:1.4"], ["osc2lvl", "osc2freq", "hardsync"], []),
        ("noise", "רעש", "כמה, ובאיזה צבע.", "turn:NOISE/EXT,ear", ["20:2.1"], ["noisecolor"], []),
        ("filter", "מסנן", "CUTOFF, RESONANCE, ו־LP או HP.", "", ["20:2.2"], ["cutoff", "reso", "vcfsel"], []),
        ("talk", "מכה שמדברת", "המסנן נפתח ונסגר בכל מכה.", "", ["20:2.3"], ["vcfenv", "vcfdec"], []),
        ("rough", "חספוס", "הרעש מנענע את המסנן.", "", ["20:2.4"], ["noisevcf"], []),
        ("length", "טיק או בום", "אורך המכה, וכניסה חדה או רכה.", "turn:DECAY (VCA),ear", ["20:3.1"], ["vcamode"], []),
        ("recipes", "חמישה מתכונים", "קיק, טום, סנר, היי־האט ומתכת.", "", ["20:4.1"], ["osc1freq", "egdec", "vcadec", "noise", "fm"], []),
        ("bass", "האדג׳ כבס", "שמונה צעדים של קו בס.", "", ["27:2.1"], ["seqpitch", "osc1env", "vcadec", "cutoff", "vcfenv"], []),
        ("syncscream", "סנכרון שצורח", "HARD SYNC, ושורת PITCH רק למתנד 2.", "", ["27:2.2"], ["hardsync", "seqpitch", "osc2lvl"], []),
        ("riser", "לייזר עולה", "הגובה עולה במקום לצנוח.", "turn:ENVELOPE (VCO 1),say:שמאלה, שעה 9", ["27:2.3"], ["egdec"], []),
    ]),
    ("steps", "צעדים", "שתי שורות: כמה חזק, ואיזה כלי.", [
        ("mutestep", "להשתיק צעד", "VEL עד הסוף שמאלה.", "turn:@vel:3,say:עד הסוף שמאלה", ["21:1.1", "21:2.1"], [], []),
        ("pitchstep", "כלי אחר בצעד", "PITCH של הצעד, כש־SEQ PITCH MOD לא על OFF.", "turn:@pitch:3,ear", ["21:2.2"], ["seqpitch"], []),
        ("ghost", "מכות רפאים", "VEL נמוך ו־PITCH גבוה, ברווחים.", "turn:VEL 8,say:שעה 10,turn:PITCH 8,say:שעה 4", ["21:2.3"], ["noise"], []),
        ("ring", "קיק קבוע וצלצול", "SEQ PITCH MOD על VCO 2.", "", ["21:2.4"], ["seqpitch", "osc2lvl"], []),
        ("openclosed", "פתוח וסגור", "VEL קובע גם את האורך.", "", ["27:1.1"], ["vcadec"], []),
        ("fill", "פיל במתג", "PITCH מוכן מראש, ו־SEQ PITCH MOD רק בתיבה של הפיל.", "", ["27:1.2"], ["seqpitch", "p5", "p6", "p7", "p8"], []),
        ("shift", "מזיזים את הקצב", "ADVANCE בזמן נגינה.", "tap:ADVANCE", ["27:1.3"], [], []),
        ("hand", "תוף ביד", "TRIGGER כשהסיקוונסר עצור.", "tap:TRIGGER", ["27:1.4"], [], []),
    ]),
    ("live", "לנגן חי", "בזמן שהקצב רץ.", [
        ("jamknobs", "ארבעה כפתורים לג׳אם", "אורך, בום, בילד ומתכת.", "", ["21:3.1"], ["vcadec", "egdec", "cutoff", "fm"], []),
        ("audiorate", "קצב שהופך לצליל", "TEMPO עד הסוף, רק ב־INT/EXT.", "turn:TEMPO,say:עד הסוף ימינה", ["21:3.2"], [], []),
    ]),
    ("cables", "כבלים", "תמיד מיציאה לכניסה.", [
        ("velnoise", "רעש רק בחזקים", "VELOCITY אל NOISE LEVEL.", "", ["22:2.1"], ["j_velout", "j_noisein"], []),
        ("pitchdecay", "שורה של אורכים", "PITCH אל VCA DECAY.", "", ["22:2.2"], ["j_pitchout", "j_vcadec"], []),
        ("growl", "מתנד שמנענע את המסנן", "OSC 2 אל VCF MOD.", "", ["22:2.3"], ["j_osc2", "j_vcfmod"], []),
        ("metalfade", "מתכת שנעלמת", "VCA EG אל 1-2 FM AMT.", "", ["22:2.4"], ["j_vcaeg", "j_fmin"], []),
        ("velswing", "סווינג מהעוצמה", "VELOCITY אל TEMPO.", "", ["27:3.1"], ["j_velout", "j_tempo"], []),
        ("reversefm", "נהמה הפוכה", "OSC 2 אל OSC 1 CV.", "", ["27:3.2"], ["j_osc2", "j_osc1cv"], []),
    ]),
]

ANY = {
    "mutestep": "כל צעד. 3 הוא דוגמה.",
    "pitchstep": "כל צעד. 3 הוא דוגמה.",
}
CARD_ANY = {}
