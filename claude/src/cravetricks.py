"""Everything you can do on the Crave, grouped by what you want to achieve.
Used by build.py to make crave-map.html (same format as tricks.py; panel ids from cravemap.py).

Each trick: (id, title, one line, seq, cards, extra_controls, also)
  seq    = combination in kit syntax ("hold:SHIFT,tap:<KYBD,rel"), or "" when it is just knobs and switches.
           Works on any step? Write the example as @step:N and give the trick a line in ANY.
  cards  = where it is taught: "18:1.3" -> lesson-18.html#l18-1-3 (file numbers)
  extra_controls = panel ids for tricks without a seq, or to add to it (see cravemap.P.C)
"""

SET = "hold:SHIFT,hold:HOLD/REST,tap:STEP 8,rel"

GOALS = [
    ("start", "להתמצא", "נגינה, מצבים, ואיך יוצאים מכל מצב.", [
        ("play", "נגינה ועצירה", "מנגן ועוצר את הרצף. הלחצן דולק כשמנגן.", "tap:PLAY/STOP", ["18:1.4"], [], []),
        ("keys", "לנגן ביד", "כשהסיקוונסר עצור, כל קליד מנגן תו.", "", ["24:3.2"], ["s1", "s5", "b1"], []),
        ("octave", "אוקטבה", "הנורה האדומה מראה איפה.", "tap:STEP>", ["24:3.2", "17:1.1"], ["kybd", "leds"], []),
        ("kybdmode", "מצב קלידים", "מקלידים תווים לפי הסדר. נורה ירוקה.", "hold:SHIFT,tap:<KYBD,rel", ["24:4.2", "18:1.2"], [], []),
        ("stepmode", "מצב צעדים", "בוחרים צעד ונותנים לו תו. נורה צהובה.", "hold:SHIFT,tap:STEP>,rel", ["24:4.2", "18:2.1"], [], []),
        ("settings", "הגדרות", "נורה 1 מהבהבת בצהוב. אותו צירוף יוצא ושומר.", SET, ["24:4.1", "24:4.3"], [], []),
        ("exit", "יציאה מכל מצב", "השאלה הראשונה: מה מהבהב?", "", ["24:4.3"], ["play", "rec", "arp", "shift", "holdrest"], []),
        ("home", "הבית של הצליל", "מיקום קבוע לכל כפתור ומתג. צילום הוא השמירה.", "", ["24:5.1"], ["shape", "vcfmode", "vcamode", "susw"], []),
    ]),
    ("write", "לכתוב רצף", "הקלטה, עריכה, שמירה וטעינה.", [
        ("clear", "דף נקי", "מנקה את הרצף שפתוח עכשיו.", "hold:SHIFT,hold:RESET/ACCENT,tap:PATTERN/BANK,rel", ["18:1.2"], [], []),
        ("rec", "הקלטה", "קליד לכל צעד, HOLD/REST לשקט, REC לסיום.", "tap:REC,say:קלידים,tap:REC", ["18:1.3"], ["holdrest"], []),
        ("end", "אורך הרצף", "1 עד 32. לצעדים 9 ומעלה: קודם PAGE.", "hold:SHIFT,hold:ARP/SET END,tap:@step:8,rel", ["18:1.4", "26:1.1"], ["page"], []),
        ("edit", "לפתוח צעד", "הצעד מהבהב. אותו צירוף סוגר.", "hold:SHIFT,tap:@step:3,rel", ["18:2.1", "18:2.2"], [], []),
        ("glide", "גלישה לצעד", "בצעד פתוח: GLIDE מעט ימינה. נורה 5.", "turn:GLIDE,ear", ["18:2.2"], [], []),
        ("accent", "הדגשה לצעד", "בצעד פתוח, או בהקלטה. נורה 7.", "tap:RESET/ACCENT", ["18:2.2"], [], []),
        ("gate", "אורך התו", "בצעד פתוח: 1 קצר מאוד, 8 מתחבר לצעד הבא.", "turn:TEMPO/GATE LENGTH,say:1 עד 8", ["18:2.3"], ["leds"], []),
        ("ratchet", "חזרות מהירות", "בצעד פתוח: 1 עד 4 מכות בצעד אחד.", "hold:SHIFT,turn:GLIDE,ear,rel", ["18:2.3"], [], []),
        ("note", "להחליף תו", "כשהרצף עצור, ב־REC.", "tap:REC,hold:SHIFT,tap:@step:8,rel,say:קליד חדש,tap:REC", ["18:2.4"], [], []),
        ("save", "שמירה", "64 מקומות: 8 בנקים של 8.", "hold:SHIFT,hold:PLAY/STOP,say:2 שניות,rel,tap:@step:2,hold:SHIFT,tap:REC,rel", ["18:3.1"], ["pattern"], []),
        ("load", "טעינה", "גם בזמן נגינה.", "hold:PATTERN/BANK,tap:@step:2,rel", ["18:3.2"], [], []),
        ("undo", "לבטל שינויים", "חוזר לגרסה השמורה של הרצף.", "hold:PATTERN/BANK,tap:RESET/ACCENT,rel", ["18:2.4"], [], []),
    ]),
    ("sound", "לעצב צליל", "מתנד, מסנן, מעטפת ומגבר.", [
        ("wave", "צורת גל", "SAW לאסיד, PULSE חלול. PULSE WIDTH רק ב־PULSE.", "", ["17:1.2"], ["shape", "pw"], []),
        ("noise", "רעש", "MIX ימינה.", "", ["17:1.3"], ["mix"], []),
        ("cutoff", "בהירות", "שמאלה עמום, ימינה בהיר.", "", ["17:2.1"], ["cutoff"], []),
        ("reso", "שריקה", "קרוב לסוף שורק בעצמו. עוצמה נמוכה.", "", ["17:2.1"], ["reso"], []),
        ("hp", "חותך נמוכים", "MODE על HP.", "", ["17:2.2"], ["vcfmode"], []),
        ("acid", "היאו של האסיד", "המעטפת פותחת את המסנן בכל תו.", "", ["17:2.3"], ["vcfmod", "vcfsrc", "vcfpol", "decay"], []),
        ("env", "קצר או ארוך", "ATTACK ו־DECAY.", "", ["17:3.1"], ["attack", "decay"], []),
        ("sustain", "להחזיק תו", "מתג SUSTAIN על ON, והכפתור קובע כמה.", "", ["17:3.2"], ["susw", "sustain"], []),
        ("drone", "צליל שלא נגמר", "VCA MODE על ON. כשהקרייב לא שותק, זה המתג.", "", ["17:3.3"], ["vcamode"], []),
        ("pwm", "פולס שנושם", "LFO איטי על רוחב הפולס.", "", ["26:2.2"], ["shape", "oscsrc", "oscdest", "oscmod", "lforate"], []),
    ]),
    ("move", "תנועה", "יד שנייה שמסובבת בשבילך.", [
        ("lfofilter", "LFO על המסנן", "MOD SOURCE של המסנן על LFO.", "", ["17:4.1"], ["vcfsrc", "vcfmod", "lforate", "lfoshape"], []),
        ("vibrato", "LFO על הגובה", "רעד, סירנה, או טריל בגל ריבועי.", "", ["17:1.4", "26:2.1"], ["oscsrc", "oscdest", "oscmod", "lforate", "lfoshape"], []),
        ("glideall", "גלישה על הכל", "GLIDE כשמנגנים ביד.", "", ["17:4.2"], ["glide"], []),
    ]),
    ("live", "לנגן חי", "בזמן שהקו רץ. לא נשמר.", [
        ("freeze", "להקפיא צעד", "כמו גמגום, כל עוד מחזיקים.", "hold:HOLD/REST,say:כל עוד מחזיקים,rel", ["18:4.1"], [], []),
        ("restart", "חזרה לצעד 1", "באמצע הקו, על הפעמה.", "tap:RESET/ACCENT", ["18:4.1"], [], []),
        ("mute", "השתקה", "לשבירה.", "hold:SHIFT,tap:HOLD/REST,rel", ["18:4.1"], [], []),
        ("accentall", "הכל מודגש", "לשיא.", "hold:SHIFT,tap:RESET/ACCENT,rel", ["18:4.1"], [], []),
        ("swing", "סווינג", "באמצע: ישר.", "hold:SHIFT,turn:TEMPO/GATE LENGTH,ear,rel", ["18:4.1"], [], []),
        ("reverse", "הפוך", "לחיצה קצרה. החזקה של 2 שניות פותחת שמירה.", "hold:SHIFT,tap:PLAY/STOP,rel", ["18:4.1", "24:2.2"], [], []),
        ("shorten", "קו שמתקצר", "SET END בזמן נגינה, ואז חזרה לאורך המלא.", "hold:SHIFT,hold:ARP/SET END,tap:STEP 4,rel", ["26:1.1"], [], []),
        ("octdrop", "אוקטבה בשבירה", "למטה בשבירה, למעלה בדרופ.", "tap:<KYBD,say:בדרופ,tap:STEP>", ["26:1.2"], [], []),
        ("arp", "ארפג׳יו", "מחזיקים תווים. HOLD/REST מחזיק אותו.", "tap:ARP/SET END,say:מחזיקים קלידים,tap:HOLD/REST", ["18:4.2"], [], []),
        ("riser", "רוח לפני הדרופ", "רעש שנפתח לאט.", "", ["26:2.3"], ["vcamode", "mix", "cutoff"], []),
    ]),
    ("cables", "כבלים", "תמיד מיציאה לכניסה.", [
        ("lfocut", "שתי ידיים על המסנן", "LFO TRI אל VCF CUTOFF.", "", ["19:2.1"], ["j_lfotri", "j_vcfcut"], []),
        ("track", "המסנן עוקב אחרי התווים", "KB CV אל VCF CUTOFF.", "", ["19:2.2"], ["j_kbcv", "j_vcfcut"], []),
        ("dirt", "לכלוך", "NOISE אל VCF CUTOFF.", "", ["19:2.3"], ["j_noise", "j_vcfcut"], []),
        ("chirp", "צפצוף בכל תו", "ENV אל VCF RES.", "", ["19:2.4"], ["j_env", "j_vcfres"], []),
        ("mult", "מפצל", "מקור אחד, שני יעדים.", "", ["19:2.5"], ["j_multin", "j_mult1", "j_mult2"], []),
        ("random", "מסנן אקראי בכל צעד", "ASSIGN על ערך 8, אל VCF CUTOFF.", SET + ",tap:STEP>,tap:STEP 8," + SET, ["26:3.1"], ["j_assign", "j_vcfcut"], []),
        ("accentres", "הדגשה שצועקת", "ASSIGN על ערך 1, אל VCF RES.", SET + ",tap:STEP>,tap:STEP 1," + SET, ["26:3.2"], ["j_assign", "j_vcfres"], []),
        ("autofreeze", "הקפאות אוטומטיות", "LFO SQU אל HOLD.", "", ["26:3.3"], ["j_lfosqu", "j_hold"], []),
    ]),
]

ANY = {
    "end": "כל צעד יכול להיות הסוף. 8 הוא דוגמה. בעמודים הבאים, אחרי PAGE, אותו קליד הוא צעד 16, 24 או 32.",
    "edit": "כל צעד. 3 הוא דוגמה.",
    "note": "כל צעד. 8 הוא דוגמה.",
    "save": "כל מקום 1 עד 8. 2 הוא דוגמה.",
    "load": "כל רצף 1 עד 8. 2 הוא דוגמה.",
}
CARD_ANY = {}
