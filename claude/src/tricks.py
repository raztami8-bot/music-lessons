"""Everything you can do on the T-8, grouped by what you want to achieve.
Used by build.py to make map.html (the "what can I do" page).

Each trick: (id, title, one line, seq, cards, extra_controls, also)
  seq    = combination in kit syntax ("hold:SHIFT,tap:3,turn:TEMPO/VALUE"), or "" when it is just a knob.
           Works on any step / instrument? Write the example as a token, and give the trick a line in ANY:
             @step:16  any step (s1-16, and 17-32 on page 2)     @num:16  any pattern number    @bank:2  banks 1-4
             @drum:SNARE DRUM  any drum instrument               @inst:BASS  any instrument, the bass too
           The strip then shows "לחצן צעד" / "לחצן כלי", and the button view lists the trick under every button it fits.
  cards  = where it is taught, Claude lessons: "6:1.2" -> lesson-6.html#l6-1-2 and done-key l6:1.2
  extra_controls = panel ids for tricks without a seq, or to add to it (see t8map.C)
  also   = other pages on the site that cover it: ("grok", "drums") -> t8-guide/#drums, ("codex", "tricks") -> codex/#tricks
"""

GOALS = [
    ("start", "להתמצא", "הדברים הבסיסיים: לנגן, קצב, תבניות, תפריט.", [
        ("play", "נגינה ועצירה", "מתחיל ועוצר את התבנית.", "tap:▶", ["4:1.3"], [], [("codex", "intro-4")]),
        ("tempo", "קצב", "מסובבים, והקצב מופיע בתצוגה. עם SHIFT: עשיריות.", "turn:TEMPO/VALUE,look:128", ["4:1.4"], ["display"], [("grok", "tempo")]),
        ("pattern", "לבחור תבנית", "64 תבניות. הבאה בתור נכנסת בסוף הלולאה.", "tap:PATTERN,tap:@num:16", ["4:5.1"], [], [("grok", "patterns")]),
        ("bank", "לבחור בנק", "ארבעה בנקים של 16 תבניות.", "hold:PATTERN,tap:@bank:2", ["4:5.1"], [], [("grok", "patterns")]),
        ("hold", "לראות מה יש בצעד", "מחזיקים צעד: בתופים מופיע הסיכוי, בבס התו.", "hold:@step:5,look:P.100", ["4:5.2"], ["display"], []),
        ("menu", "להיכנס לתפריט ולצאת", "בתפריט נמצאות ההגדרות שאין להן כפתור.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:GAIn,hold:SHIFT,tap:1,rel", ["4:5.3", "7:0.1"], [], []),
        ("kybd", "לנגן בס ביד", "לחצני הצעדים הופכים למקלדת.", "tap:KYBD,tap:1,tap:3,tap:5", ["4:4.1"], [], [("codex", "bass")]),
    ]),
    ("beat", "לבנות ביט", "לכתוב תופים ולבנות תבנית.", [
        ("steps", "לכתוב תופים בצעדים", "בוחרים כלי, ומדליקים כמה צעדים שרוצים. לחיצה על צעד דולק מכבה אותו.", "tap:@drum:BASS DRUM,tap:@step:1", ["5:2.1", "4:3.2"], [], [("codex", "drums"), ("grok", "drums")]),
        ("clear", "למחוק תבנית או כלי", "כל התבנית, או רק הכלי שנבחר.", "hold:SHIFT,tap:11", ["4:3.1", "4:3.5"], ["s12"], []),
        ("taprec", "לתופף ביד", "מקליטים בזמן נגינה, וזה נכנס לצעדים.", "tap:●,tap:@drum:OPEN HIHAT,tap:@drum:OPEN HIHAT,tap:●", ["6:6.3"], [], [("grok", "drums")]),
        ("page2", "תיבה שנייה שונה", "32 צעדים: החצי השני מועתק, ומשנים בו.", "hold:SHIFT,tap:6", ["6:4.1"], ["s5"], [("grok", "drums")]),
        ("copy", "להעתיק תבנית", "כדי לבנות וריאציה בלי לקלקל את המקור. המספר שבוחרים הוא תבנית היעד, למשל 15.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:COPY,tap:2,turn:TEMPO/VALUE,look:15,tap:2,hold:SHIFT,tap:1,rel", ["6:6.1"], [], [("grok", "patterns")]),
    ]),
    ("bassline", "לכתוב קו בס", "תווים, גלישות, הדגשות וקווים ארוכים.", [
        ("notes", "לכתוב תווים במקלדת", "עורכים צעד אחרי צעד: בכל צעד לוחצים תו, ואם צריך OCT+ או SLIDE. TEMPO/VALUE עובר לצעד הבא, ו־● יוצא.", "tap:KYBD,tap:●,look:St. 1,tap:A,tap:OCT+,turn:TEMPO/VALUE,look:St. 2,tap:●", ["5:4.2"], [], [("codex", "bass"), ("grok", "bass")]),
        ("fixnote", "לתקן תו אחד", "מחזיקים את הצעד ומסובבים.", "tap:BASS,hold:@step:3,turn:TEMPO/VALUE,look:n.A1", ["5:4.3"], ["display"], [("grok", "bass")]),
        ("accslide", "הדגשה וגלישה לתו", "מחזיקים צעד, ACCENT מחליף בין תו, הדגשה וגלישה.", "tap:BASS,hold:@step:4,tap:ACCENT,look:A.OFF,turn:TEMPO/VALUE,look:A.On", ["5:4.4"], [], [("grok", "bass")]),
        ("tie", "תו ארוך", "קשירה: התו ממשיך לצעד הבא.", "tap:BASS,hold:@step:2,turn:TEMPO/VALUE,look:n.tie", ["7:3.2"], [], [("grok", "bass")]),
        ("rndbass", "בס אקראי", "מחולל רעיונות. שחזור הבס (PATTERN + 15) מחזיר את שלך.", "hold:SHIFT,tap:10", ["6:5.3"], [], []),
        ("basslen", "בס באורך אחר", "בס של 12 מול תופים של 16: הוא נודד מעל הקיק.", "tap:BASS,hold:SHIFT,tap:4,rel,turn:TEMPO/VALUE,look:12,tap:1", ["6:4.2"], [], []),
    ]),
    ("alive", "שהגרוב ישתנה לבד", "לופ שלא חוזר בדיוק אותו דבר.", [
        ("prob", "מכה שמופיעה לפעמים", "סיכוי לכל צעד, מ־P.100 עד P.0. ״קיק רפאים״ הוא אותו דבר: קיק בצעד עם סיכוי נמוך.", "hold:@step:4,look:P.100,turn:TEMPO/VALUE,look:P.50", ["6:1.2", "6:1.4"], [], [("codex", "tricks"), ("grok", "drums")]),
        ("mprob", "כפתור אחד לכל הסיכויים", "מגביר או מחליש את כל הסיכויים יחד. מסובבים ומקשיבים: אין ערך אחד נכון.", "hold:PATTERN,turn:TEMPO/VALUE,ear", ["6:1.3"], [], [("grok", "drums")]),
    ]),
    ("groove", "להחיות את הקצב", "שהקצב ירגיש מנוגן ולא מתוכנת.", [
        ("vel", "חזק וחלש באותו כלי", "עוצמה לכל מכה, מ־v.0 עד v.10. אותו מסך כמו הסיכוי: ACCENT עובר מ־P ל־v.", "hold:@step:2,look:P.100,tap:ACCENT,look:v.10,turn:TEMPO/VALUE,look:v.4", ["6:2.1"], [], [("grok", "drums")]),
        ("drumacc", "הדגשה לכל התופים", "כל התופים באותו צעד חזקים יותר.", "tap:ACCENT,tap:@step:1", ["6:2.2"], [], [("grok", "drums")]),
        ("shuffle", "שאפל", "כל צעד שני מתאחר מעט. בלעדיו טכנו, איתו האוס.", "hold:SHIFT,tap:3,rel,turn:TEMPO/VALUE,ear,tap:1", ["6:2.3"], [], [("grok", "tempo")]),
        ("shift", "להזיז כלי בזמן", "כל המכות של כלי זזות יחד, צעד קדימה או אחורה.", "hold:@drum:OPEN HIHAT,turn:TEMPO/VALUE,ear", ["6:5.2"], [], [("grok", "drums")]),
        ("triplet", "משולשים", "הפעמה מתחלקת לשלוש. התחושה ״מתגלגלת״.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:r.SCL,tap:2,turn:TEMPO/VALUE,look:16-3,hold:SHIFT,tap:1,rel", ["6:4.3"], [], [("grok", "tempo")]),
    ]),
    ("tension", "לבנות מתח ומעברים", "מה שקורה לפני שהשיר משתנה.", [
        ("roll", "לחלק מכה: גלגול או מכה כפולה", "מחזיקים כלי ולוחצים על הצעד. הלחיצה הראשונה רק מראה, וכל לחיצה נוספת מחליפה: <span class='seqv' dir='ltr'>OFF, 1_2, 1_3, 1_4, FLAN</span>. עם ACCENT באותו מסך: הסיכוי של החלוקה.", "hold:@drum:SNARE DRUM,tap:@step:16,tap:@step:16,look:1_2", ["6:3.1", "6:3.2", "6:3.3"], [], [("codex", "tricks"), ("grok", "drums")]),
        ("stutter", "גמגום", "התופים נתקעים על צעד, והבס ממשיך.", "hold:SHIFT,tap:PATTERN,rel,tap:@step:13,ear,tap:PATTERN", ["6:5.1"], [], [("grok", "drums")]),
        ("fill", "מילוי", "תבנית שמנגנת פעם אחת, כמעבר. קודם בוחרים איזו תבנית היא המילוי, פעם אחת לבנק, ואז מפעילים. את המילוי עצמו מכינים בתבנית אחרת, למשל עם <a class='xref' href='#t-copy'>העתקת תבנית</a>.", "hold:SHIFT,tap:8,rel,tap:15,hold:SHIFT,tap:1,rel,hold:SHIFT,tap:7", ["6:6.2"], ["s8"], [("grok", "patterns")]),
        ("mute", "לבנות ולפרק בהשתקות", "מוציאים כלים ומחזירים אותם, אחד אחרי השני.", "hold:SHIFT,tap:@inst:CLOSED HIHAT", ["5:6.3"], [], [("codex", "tricks")]),
        ("throw", "זריקת הד", "מגבירים את ההד לרגע, וחלק מהצליל ממשיך.", "turn:DELAY", ["7:4.4"], [], []),
        ("rndrhythm", "תופים אקראיים", "תופים חדשים בלחיצה. שחזור התופים (PATTERN + 14) מחזיר את שלך.", "hold:SHIFT,tap:9", ["6:5.3"], [], []),
    ]),
    ("basssound", "לעצב את הבס", "איך הבס נשמע.", [
        ("filter", "בהירות, צפצוף ו״וואו״", "CUTOFF, RESO ו־ENV MOD: הלב של האסיד.", "", ["4:4.2", "5:3.2", "5:3.3", "5:3.4"], ["cutoff", "reso", "envmod"], [("codex", "bass"), ("grok", "bass")]),
        ("decay", "אורך כל תו", "קצר: קופצני. ארוך: רך.", "", ["5:3.1"], ["bdec"], [("grok", "bass")]),
        ("wave", "מסור או מרובע", "שתי צורות גל לבס.", "hold:PATTERN,tap:11,rel,turn:TEMPO/VALUE,look:Sqr,tap:1", ["4:4.3"], [], [("codex", "bass"), ("grok", "bass")]),
        ("recipes", "מתכונים לבס", "ארבע נקודות התחלה מוכנות.", "", ["7:3.3"], ["cutoff", "reso", "envmod", "bdec"], [("grok", "recipes")]),
        ("od", "עיוות", "בס רועש ואגרסיבי, לכל כלי בנפרד.", "hold:PATTERN,tap:10,rel,look:Od.On,tap:@inst:BASS,turn:TEMPO/VALUE,look:On,tap:1", ["7:2.1", "7:2.2"], [], [("grok", "fx")]),
        ("transpose", "להזיז את כל הקו בגובה", "אותו קו, במקום אחר.", "hold:BASS,hold:KYBD,turn:TEMPO/VALUE,ear", ["7:3.1"], [], [("grok", "bass")]),
        ("accstr", "כמה חזקה ההדגשה", "ההבדל בין תו רגיל לתו מודגש.", "tap:BASS,hold:ACCENT,turn:TEMPO/VALUE,ear", ["7:3.4"], [], []),
    ]),
    ("drumsound", "לעצב תופים", "איך התופים נשמעים.", [
        ("tune", "גובה ואורך של תוף", "TUNE, ו־DECAY מעביר אותו לאורך.", "", ["4:3.2", "4:3.3"], ["bdtune", "bddec", "sdtune", "sddec", "tctune", "hhdec"], [("codex", "drums"), ("grok", "drums")]),
        ("level", "עוצמה של כל כלי", "כפתור LEVEL לכל אזור.", "", ["5:2.5"], ["bdlvl", "sdlvl", "tclvl", "hhlvl", "blvl"], [("codex", "drums")]),
        ("atk", "קליק בקיק", "כמה ״נוקש״ הקיק בהתחלה.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:AtK,tap:BASS DRUM,turn:TEMPO/VALUE,ear,hold:SHIFT,tap:1,rel", ["7:1.1"], [], [("grok", "drums")]),
        ("snappy", "קפיצים בסנר", "כמה רעש יש בסנר.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:SnPy,tap:SNARE DRUM,turn:TEMPO/VALUE,ear,hold:SHIFT,tap:1,rel", ["7:1.2"], [], [("grok", "drums")]),
        ("swap", "להחליף את צליל הקלאפ או הטום", "לחצן HAND CLAP: קלאפ (CP), טום רעש (hnt) או טום גבוה (htON). לחצן TOM: שני טומים, בפריט tON.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:CLAP,tap:2,turn:TEMPO/VALUE,look:hnt,hold:SHIFT,tap:1,rel", ["7:1.3"], ["clap", "tom"], [("codex", "drums"), ("grok", "drums")]),
        ("gain", "לשנות כלי אחד מתוך שניים", "GAIn, tUnE ו־dECY בתפריט, לכל כלי בנפרד.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:GAIn,tap:@drum:OPEN HIHAT,turn:TEMPO/VALUE,ear,hold:SHIFT,tap:1,rel", ["7:1.4"], [], [("codex", "drums")]),
        ("pan", "ימין ושמאל", "מיקום כל כלי בסטריאו.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:PAn,tap:@drum:CLOSED HIHAT,turn:TEMPO/VALUE,look:L20,hold:SHIFT,tap:1,rel", ["7:1.5"], [], [("grok", "drums")]),
        ("ohsync", "היי־האט פתוח לפי הקצב", "האורך נמתח עם הקצב.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,say:עד הפריט שאחרי CLAP,tap:2,turn:TEMPO/VALUE,look:On,hold:SHIFT,tap:1,rel", ["7:1.6"], ["oh"], [("grok", "drums")]),
    ]),
    ("space", "מרחב, הד ושאיבה", "אפקטים.", [
        ("fx", "הד והדהוד", "שני כפתורים, ועם SHIFT: זמן ואורך. מסובבים ומקשיבים.", "turn:DELAY,turn:REVERB", ["4:6.1", "5:5.2"], [], [("codex", "effects"), ("grok", "fx")]),
        ("dsync", "הד שננעל לקצב", "הזמן בערכים מוזיקליים, למשל 8d, שמינית מנוקדת. קודם מדליקים את d.Syn בתפריט.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:d.Syn,tap:2,turn:TEMPO/VALUE,look:On,hold:SHIFT,tap:1,rel,hold:SHIFT,turn:DELAY,look:8d", ["7:4.1"], [], [("grok", "fx")]),
        ("sends", "מי נכנס להד, ומי להדהוד", "קיק יבש, בס עם הד, קלאפ בחדר.", "hold:SHIFT,tap:13,rel,look:d.Snd,tap:@inst:BASS,turn:TEMPO/VALUE,look:100,tap:1", ["7:4.2"], ["s14"], [("codex", "effects"), ("grok", "fx")]),
        ("drse", "הד שנעלם בהדהוד", "ההד ״מתמוסס״ בחלל.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:d.rSE,tap:2,turn:TEMPO/VALUE,look:80,hold:SHIFT,tap:1,rel", ["7:4.3"], [], []),
        ("sc", "שאיבה מהקיק", "הבס נחלש בכל קיק, ו״נושם״. שלושה חלקים: מי מפעיל (הקיק), על מי זה פועל (הבס), וכמה עמוק.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:SC.Sr,tap:2,turn:TEMPO/VALUE,look:bd,tap:1,turn:TEMPO/VALUE,look:SC.dG,tap:2,tap:BASS,turn:TEMPO/VALUE,look:dv.25,hold:SHIFT,tap:1,rel,hold:PATTERN,tap:12,rel,turn:TEMPO/VALUE,look:25,tap:1", ["5:5.1", "7:5.1", "7:5.2"], [], [("grok", "fx")]),
        ("scfx", "שאיבה גם להדהוד", "הרבה הדהוד, והקיק נשאר נקי. עובד אחרי <a class='xref' href='#t-sc'>שאיבה מהקיק</a>.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:SC.dG,tap:2,tap:ACCENT,turn:TEMPO/VALUE,look:dv.25,hold:SHIFT,tap:1,rel", ["7:5.3"], [], []),
        ("gate", "שער", "ניסוי: הבס נחתך בקצב של ההיי־האט. אחר כך החזר את SC.Sr ל־bd.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,look:SC.Sr,tap:2,turn:TEMPO/VALUE,look:CH,tap:1,turn:TEMPO/VALUE,look:SC.dG,tap:2,tap:BASS,turn:TEMPO/VALUE,look:Gt.25,hold:SHIFT,tap:1,rel", ["7:5.4"], [], []),
    ]),
    ("safe", "לשמור ולצאת מבלגן", "רשת הביטחון.", [
        ("reload", "לחזור למצב השמור", "תופים, בס או הכל, בלחיצה.", "hold:PATTERN,tap:16", ["6:1.1"], ["s14", "s15"], [("grok", "patterns")]),
        ("save", "לשמור", "Ptn לתבנית אחת, ALL לכולן.", "hold:SHIFT,tap:16,rel,turn:TEMPO/VALUE,look:Ptn,tap:2", ["6:7.2", "5:8.1"], [], [("codex", "finish"), ("grok", "patterns")]),
        ("exit", "לצאת מכל תפריט", "הלכת לאיבוד? SHIFT + לחצן 1 יוצא מהתפריט כולו. לחצן 1 לבד חוזר שלב אחד.", "hold:SHIFT,tap:1,rel", ["4:5.3"], [], []),
        ("restart", "כיבוי והדלקה", "כל מה שלא נשמר חוזר למצב השמור.", "", ["4:7.1"], ["display"], []),
        ("trouble", "כשמשהו לא עובד", "טבלאות תקלות בכל שיעור.", "", ["6:ref"], [], [("grok", "trouble")]),
    ]),
]

# Tricks that work on any step or instrument: what it works on, and the example the strip shows. Required for every @ token.
ANY = {
    "pattern": "כל תבנית, 1 עד 16 בכל בנק. לדוגמה: תבנית 16.",
    "bank": "בנקים 1 עד 4, בלחצנים 1 עד 4. לדוגמה: בנק 2.",
    "hold": "כל צעד. לדוגמה: צעד 5.",
    "steps": "כל כלי תופים, כל צעד. לדוגמה: קיק בצעדים 1, 5, 9 ו־13.",
    "taprec": "כל כלי תופים. לדוגמה: OPEN HIHAT.",
    "fixnote": "כל צעד של הבס. לדוגמה: צעד 3.",
    "accslide": "כל צעד של הבס. לדוגמה: צעד 4.",
    "tie": "כל צעד של הבס. לדוגמה: צעד 2.",
    "prob": "כל צעד, בכל כלי תופים. לדוגמה: היי־האט בצעד 4, או קיק רפאים בצעד 16.",
    "vel": "כל צעד, בכל כלי תופים. לדוגמה: צעד 2.",
    "drumacc": "כל צעד. ההדגשה חלה על כל התופים שמנגנים בו. לדוגמה: צעדים 1 ו־9.",
    "shift": "כל כלי תופים. לדוגמה: OPEN HIHAT.",
    "roll": "כל צעד, בכל כלי תופים. לדוגמה: גלגול סנר בצעד 16, או קלאפ כפול בצעד 13.",
    "stutter": "כל צעד, או כמה צעדים יחד. לדוגמה: צעד 13.",
    "mute": "כל כלי, גם הבס. לדוגמה: CLOSED HIHAT.",
    "od": "כל כלי, כל אחד בנפרד. לדוגמה: הבס.",
    "gain": "כל כלי תופים, כל אחד בנפרד. לדוגמה: OPEN HIHAT.",
    "pan": "כל כלי תופים. לדוגמה: CLOSED HIHAT.",
    "sends": "כל כלי, גם הבס. לדוגמה: הבס.",
}

# The same line inside the lesson cards that practice on one example. Key: "lesson:card" (file numbers).
CARD_ANY = {
    "5:4.3": "כל צעד של הבס. כאן בודקים את צעדים 1 ו־4.",
    "5:4.4": "כל צעד של הבס. כאן: צעדים 4 ו־12.",
    "6:1.2": "כל צעד, בכל כלי תופים. כאן: היי־האט בצעדים 4, 8, 12 ו־16.",
    "6:1.4": "זה הסיכוי מ־[[go:6:1.2|1.2]], על קיק. עובד בכל צעד. כאן: צעד 16.",
    "6:2.1": "כל צעד, בכל כלי תופים. כאן: היי־האט בצעדים הזוגיים.",
    "6:2.2": "כל צעד. ההדגשה חלה על כל התופים שמנגנים בו. כאן: צעדים 1 ו־9, תחילת הפעמה הראשונה והשלישית.",
    "6:3.1": "כל צעד, בכל כלי תופים. כאן: סנר בצעד 16.",
    "6:3.2": "אותו מסך כמו הגלגול: כל צעד, בכל כלי תופים. כאן: קלאפ בצעד 13.",
    "6:3.3": "כל צעד שיש בו חלוקה. כאן: הגלגול בצעד 16.",
    "6:5.1": "כל צעד, או כמה צעדים יחד. כאן: 13, ואחר כך 13 ו־15.",
    "6:5.2": "כל כלי תופים. כאן: OPEN HIHAT, ואחר כך HAND CLAP.",
    "6:6.3": "כל כלי תופים. כאן: OPEN HIHAT.",
    "7:1.4": "כל כלי תופים, כל אחד בנפרד. כאן: OPEN HIHAT ו־TOM.",
    "7:1.5": "כל כלי תופים. כאן: ההיי־האטים.",
    "7:2.1": "כל כלי, כל אחד בנפרד. כאן: הבס, וב־[[go:7:2.2|2.2]] גם הקיק.",
    "7:3.2": "כל צעד של הבס. כאן: צעדים 2 ו־3.",
    "7:4.2": "כל כלי, גם הבס. כאן: הבס, הקלאפ והקיק.",
}
