"""Back to base: on every T-8 card that changes something, a "↩ חזרה לבסיס" button with the exact presses back.
build.py puts it at the top of the card, right after "מתחילים כש:". tools/rules.py checks every sequence.

The base of each lesson:
  T-8 lesson 3 (file 6): card 1.0. Pattern 16, the jam saved at the end of T-8 lesson 2, playing.
  T-8 lesson 4 (file 7): the same, with the sound from T-8 lesson 2 (BASE_KNOBS) and the menu items as they were.

BACK: "lesson:card" (file numbers) -> (sequence in kit syntax, one line on what it does)
START: "lesson:card" -> the "מתחילים כש:" line, for cards that have none ([[state:...]] syntax, without the brackets)
"""

EXIT = "tap:1,tap:1"   # C (EXIT) twice: back to the list, then out. The lesson cards say it the same way
MENU = "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE"
REC = "say:לערך שרשמת"
R14 = "hold:PATTERN,tap:14,rel"   # drums back to the saved pattern
R15 = "hold:PATTERN,tap:15,rel"   # bass
R16 = "hold:PATTERN,tap:16,rel"   # all

DRUMS = "התופים חוזרים למה ששמרת. גם שינויים אחרים בתופים מאז השמירה נמחקים."
BASSN = "הבס חוזר למה ששמרת. גם שינויים אחרים בבס מאז השמירה נמחקים."
ALLN = "כל התבנית חוזרת למה ששמרת."
MENUN = "השחזור לא מחזיר פריטי תפריט בוודאות, לכן מחזירים ביד, לערך שרשמת בתחילת הכרטיס."

# the bass sound from T-8 lesson 2, stage 3 (hours on the knob)
BASE_KNOBS = "turn:CUTOFF,say:שעה 10,turn:RESO,say:שעה 12,turn:ENV MOD,say:שעה 1,turn:DECAY,say:שעה 10"

BACK = {
    # ---- T-8 lesson 2 (file 5)
    "5:6.3": ("hold:SHIFT,tap:@inst:BASS,rel,say:כל כלי שמהבהב, אותו דבר",
              "לחיצה נוספת מבטלת השתקה. גם כיבוי מבטל את כל ההשתקות."),
    # ---- T-8 lesson 3 (file 6)
    "6:1.2": (R14, DRUMS),
    "6:1.3": ("hold:PATTERN,turn:TEMPO/VALUE,ear," + R14,
              "קודם הסיכוי הכללי בחזרה לאמצע, עד שההיי־האטים מנגנים כמו קודם. אחר כך שחזור התופים מחזיר את הצעדים."),
    "6:1.4": (R14, DRUMS),
    "6:2.1": (R14, DRUMS),
    "6:2.2": ("hold:ACCENT,turn:TEMPO/VALUE,ear," + R14,
              "עוצמת ההדגשה בחזרה לאיך שהייתה, ואז שחזור התופים מוריד את ההדגשות מהצעדים."),
    "6:2.3": ("hold:SHIFT,tap:3,rel,turn:TEMPO/VALUE," + REC + ",tap:1",
              "לא ידוע אם השחזור מחזיר את השאפל, לכן מחזירים ביד."),
    "6:3.1": (R14, DRUMS),
    "6:3.2": (R14, DRUMS),
    "6:3.3": (R14, DRUMS),
    "6:4.1": ("hold:SHIFT,tap:5,rel," + R16, "קודם חזרה לחצי הראשון, ואז " + ALLN),
    "6:4.2": (R15, "הבס חוזר לאורך ששמרת, ולתווים ששמרת."),
    "6:4.3": (MENU + ",look:r.SCL,tap:2,turn:TEMPO/VALUE,look:16," + EXIT, "המשולשים חוזרים לרגיל: 16."),
    "6:5.1": ("tap:PATTERN", "יוצאים מהגמגום. שום דבר לא נשמר בו."),
    "6:5.2": (R14, DRUMS),
    "6:5.3": (R14 + "," + R15, "התופים והבס שלך חוזרים, במקום האקראיים."),
    "6:6.1": ("tap:PATTERN,tap:16,tap:BASS DRUM", "חוזרים לתבנית 16. תבנית 15 נשארת מוכנה, בשביל המילוי."),
    "6:6.2": ("tap:PATTERN,tap:16,tap:BASS DRUM", "אם אחרי המילוי הנגינה נשארה על 15, זה מחזיר ל־16."),
    "6:6.3": (R14, DRUMS),
    "6:7.1": (R16 + ",say:כלי שמהבהב: SHIFT + הכלי", ALLN + " השתקות לא חוזרות בשחזור, אז מבטלים אותן ביד."),
    # ---- T-8 lesson 4 (file 7)
    "7:0.1": (MENU + ",look:GAIn,tap:BASS DRUM,turn:TEMPO/VALUE," + REC + "," + EXIT, MENUN),
    "7:1.1": (MENU + ",look:AtK,tap:BASS DRUM,turn:TEMPO/VALUE," + REC + "," + EXIT, MENUN),
    "7:1.2": (MENU + ",look:SnPy,tap:SNARE DRUM,turn:TEMPO/VALUE," + REC + "," + EXIT + "," + R14,
              MENUN + " אחר כך שחזור התופים, בשביל צעדים 5 ו־13."),
    "7:1.3": (MENU + ",look:CLAP,tap:2,turn:TEMPO/VALUE," + REC + ",tap:1,turn:TEMPO/VALUE,look:tON,tap:2,turn:TEMPO/VALUE," + REC
              + ",tap:1,turn:TEMPO/VALUE,look:CoIr,say:לערך שרשמת," + EXIT + "," + R14,
              "שלושה פריטים, כל אחד לערך שרשמת. בסוף שחזור התופים, בשביל צעד 11 של הטום."),
    "7:1.4": (MENU + ",look:GAIn,tap:OPEN HIHAT,turn:TEMPO/VALUE," + REC + ",tap:1,turn:TEMPO/VALUE,look:dECY,tap:OPEN HIHAT,turn:TEMPO/VALUE,"
              + REC + ",tap:1,turn:TEMPO/VALUE,look:tUnE,tap:TOM,turn:TEMPO/VALUE," + REC + "," + EXIT, MENUN),
    "7:1.5": (MENU + ",look:PAn,tap:CLOSED HIHAT,turn:TEMPO/VALUE,look:C0,tap:OPEN HIHAT,turn:TEMPO/VALUE,look:C0," + EXIT,
              "שני ההיי־האטים חוזרים למרכז."),
    "7:1.6": (MENU + ",say:עד הפריט שאחרי CLAP,tap:2,turn:TEMPO/VALUE," + REC + "," + EXIT + ",turn:TEMPO/VALUE,look:128",
              MENUN + " ובסוף הקצב חוזר ל־128."),
    "7:2.1": ("hold:PATTERN,tap:10,rel,look:Od.On,tap:BASS,turn:TEMPO/VALUE,look:OFF,tap:1,turn:VOLUME,say:לעוצמה שהייתה",
              "העיוות של הבס כבה, והעוצמה חוזרת."),
    "7:2.2": (MENU + ",look:Od.dr,tap:2,turn:TEMPO/VALUE," + REC + ",tap:1,turn:TEMPO/VALUE,look:Od.Lv,tap:BASS,turn:TEMPO/VALUE," + REC
              + ",tap:1,turn:TEMPO/VALUE,look:Od.On,tap:BASS DRUM,turn:TEMPO/VALUE,look:OFF," + EXIT, MENUN),
    "7:3.1": ("hold:BASS,hold:KYBD,turn:TEMPO/VALUE,say:חמישה קליקים שמאלה", "הקו חוזר לגובה המקורי."),
    "7:3.2": (R15, BASSN),
    "7:3.3": ("hold:PATTERN,tap:11,rel,turn:TEMPO/VALUE,look:SAw,tap:1," + BASE_KNOBS,
              "גל מסור, והכפתורים חוזרים לצליל משיעור 2. יש לך צילום של הלוח? לפיו."),
    "7:3.4": ("tap:BASS,hold:ACCENT,turn:TEMPO/VALUE,ear", "עד שההדגשות נשמעות כמו קודם. כדאי לרשום את הערך כבר בהתחלה."),
    "7:4.1": (MENU + ",look:d.Syn,tap:2,turn:TEMPO/VALUE," + REC + "," + EXIT + ",turn:DELAY,say:לאן שהיה", MENUN),
    "7:4.2": ("hold:SHIFT,tap:13,rel,look:d.Snd,tap:BASS,turn:TEMPO/VALUE," + REC + ",say:אותו דבר ב־HAND CLAP וב־BASS DRUM,tap:1,"
              "hold:SHIFT,tap:14,rel,look:r.Snd,say:אותו דבר בשלושתם,tap:1,turn:REVERB,say:לאן שהיה",
              "כל כלי חוזר לשליחה שרשמת, להד ולהדהוד."),
    "7:4.3": (MENU + ",look:d.rSE,tap:2,turn:TEMPO/VALUE," + REC + "," + EXIT, MENUN),
    "7:5.1": ("hold:PATTERN,tap:12,rel,turn:TEMPO/VALUE," + REC + ",tap:1", "השאיבה חוזרת לעומק שרשמת."),
    "7:5.2": (MENU + ",look:SC.ti,tap:2,turn:TEMPO/VALUE," + REC + "," + EXIT, MENUN),
    "7:5.3": (MENU + ",look:SC.dG,tap:2,tap:ACCENT,turn:TEMPO/VALUE," + REC + "," + EXIT + ",turn:REVERB,say:לאן שהיה", MENUN),
    "7:5.4": (MENU + ",look:SC.Sr,tap:2,turn:TEMPO/VALUE," + REC + ",tap:1,turn:TEMPO/VALUE,look:SC.dG,tap:2,tap:BASS,turn:TEMPO/VALUE,"
              + REC + "," + EXIT, "מי מפעיל, ועל מי זה פועל, חוזרים לערכים שרשמת. בשיעור 2 זה היה bd ושאיבה (dv.) לבס."),
}

START = {
    "5:6.3": "play||הג׳אם מנגן",
    **{f"7:{c}": "play||תבנית 16, הג׳אם שלך" for c in
       ("0.1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2", "3.1", "3.2", "3.3", "3.4",
        "4.1", "4.2", "4.3", "5.1", "5.2", "5.3", "5.4")},
}
