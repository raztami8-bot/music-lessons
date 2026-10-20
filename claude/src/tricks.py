"""Everything you can do on the T-8, grouped by what you want to achieve.
Used by build.py to make map.html (the "what can I do" page).

Each trick: (id, title, one line, seq, cards, extra_controls, also)
  seq    = combination in kit syntax ("hold:SHIFT,tap:3,turn:TEMPO/VALUE"), or "" when it is just a knob
  cards  = where it is taught, Claude lessons: "6:1.2" -> lesson-6.html#l6-1-2 and done-key l6:1.2
  extra_controls = panel ids for tricks without a seq, or to add to it (see t8map.C)
  also   = other pages on the site that cover it: ("grok", "drums") -> t8-guide/#drums, ("codex", "tricks") -> codex/#tricks
"""

GOALS = [
    ("start", "להתמצא", "הדברים הבסיסיים: לנגן, קצב, תבניות, תפריט.", [
        ("play", "נגינה ועצירה", "מתחיל ועוצר את התבנית.", "tap:▶", ["4:1.3"], [], [("codex", "intro-4")]),
        ("tempo", "קצב", "מסובבים, והקצב מופיע בתצוגה. עם SHIFT: עשיריות.", "turn:TEMPO/VALUE", ["4:1.4"], ["display"], [("grok", "tempo")]),
        ("pattern", "לבחור תבנית", "64 תבניות. הבאה בתור נכנסת בסוף הלולאה.", "tap:PATTERN,tap:16", ["4:5.1"], [], [("grok", "patterns")]),
        ("bank", "לבחור בנק", "ארבעה בנקים של 16 תבניות.", "hold:PATTERN,tap:2", ["4:5.1"], [], [("grok", "patterns")]),
        ("hold", "לראות מה יש בצעד", "מחזיקים צעד: בתופים מופיע הסיכוי, בבס התו.", "hold:5", ["4:5.2"], ["display"], []),
        ("menu", "להיכנס לתפריט ולצאת", "בתפריט נמצאות ההגדרות שאין להן כפתור.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2,tap:1", ["4:5.3", "7:0.1"], [], []),
        ("kybd", "לנגן בס ביד", "לחצני הצעדים הופכים למקלדת.", "tap:KYBD,tap:1,tap:3,tap:5", ["4:4.1"], [], [("codex", "bass")]),
    ]),
    ("beat", "לבנות ביט", "לכתוב תופים ולבנות תבנית.", [
        ("steps", "לכתוב תופים בצעדים", "בוחרים כלי ומדליקים צעדים.", "tap:BASS DRUM,tap:1,tap:5,tap:9,tap:13", ["5:2.1", "4:3.2"], [], [("codex", "drums"), ("grok", "drums")]),
        ("clear", "למחוק תבנית או כלי", "כל התבנית, או רק הכלי שנבחר.", "hold:SHIFT,tap:11", ["4:3.1", "4:3.5"], ["s12"], []),
        ("taprec", "לתופף ביד", "מקליטים בזמן נגינה, וזה נכנס לצעדים.", "tap:●,tap:OPEN HIHAT,tap:OPEN HIHAT,tap:●", ["6:6.3"], [], [("grok", "drums")]),
        ("page2", "תיבה שנייה שונה", "32 צעדים: החצי השני מועתק, ומשנים בו.", "hold:SHIFT,tap:6", ["6:4.1"], ["s5"], [("grok", "drums")]),
        ("copy", "להעתיק תבנית", "כדי לבנות וריאציה בלי לקלקל את המקור.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2,turn:TEMPO/VALUE,tap:2", ["6:6.1"], [], [("grok", "patterns")]),
    ]),
    ("bassline", "לכתוב קו בס", "תווים, גלישות, הדגשות וקווים ארוכים.", [
        ("notes", "לכתוב תווים במקלדת", "בכל צעד בוחרים תו ואוקטבה.", "tap:KYBD,tap:●,tap:A,tap:OCT+", ["5:4.2"], [], [("codex", "bass"), ("grok", "bass")]),
        ("fixnote", "לתקן תו אחד", "מחזיקים את הצעד ומסובבים.", "tap:BASS,hold:3,turn:TEMPO/VALUE", ["5:4.3"], ["display"], [("grok", "bass")]),
        ("accslide", "הדגשה וגלישה לתו", "מחזיקים צעד, ACCENT מחליף בין תו, הדגשה וגלישה.", "hold:4,tap:ACCENT,turn:TEMPO/VALUE", ["5:4.4"], [], [("grok", "bass")]),
        ("tie", "תו ארוך", "קשירה: התו ממשיך לצעד הבא.", "hold:2,turn:TEMPO/VALUE", ["7:3.2"], [], [("grok", "bass")]),
        ("rndbass", "בס אקראי", "מחולל רעיונות. שחזור מחזיר.", "hold:SHIFT,tap:10", ["6:5.3"], [], []),
        ("basslen", "בס באורך אחר", "בס של 12 מול תופים של 16: הוא נודד מעל הקיק.", "tap:BASS,hold:SHIFT,tap:4,rel,turn:TEMPO/VALUE,tap:1", ["6:4.2"], [], []),
    ]),
    ("alive", "שהגרוב ישתנה לבד", "לופ שלא חוזר בדיוק אותו דבר.", [
        ("prob", "מכה שמופיעה לפעמים", "סיכוי לכל צעד, מ־P.100 עד P.0.", "hold:4,turn:TEMPO/VALUE", ["6:1.2"], [], [("codex", "tricks"), ("grok", "drums")]),
        ("mprob", "כפתור אחד לכל הסיכויים", "מגביר או מחליש את כל הסיכויים יחד.", "hold:PATTERN,turn:TEMPO/VALUE", ["6:1.3"], [], [("grok", "drums")]),
        ("ghost", "קיק רפאים", "קיק בצעד 16 בסיכוי נמוך, ״דוחף״ מדי פעם.", "tap:BASS DRUM,tap:16,hold:16,turn:TEMPO/VALUE", ["6:1.4"], [], []),
        ("subprob", "גלגול שמופיע לפעמים", "לחלוקה של צעד יש סיכוי משלה.", "hold:SNARE DRUM,tap:16,tap:ACCENT,turn:TEMPO/VALUE", ["6:3.3"], [], []),
    ]),
    ("groove", "להחיות את הקצב", "שהקצב ירגיש מנוגן ולא מתוכנת.", [
        ("vel", "חזק וחלש באותו כלי", "עוצמה לכל מכה, מ־v.0 עד v.10.", "hold:2,tap:ACCENT,turn:TEMPO/VALUE", ["6:2.1"], [], [("grok", "drums")]),
        ("drumacc", "הדגשה לכל התופים", "כל התופים באותו צעד חזקים יותר.", "tap:ACCENT,tap:1,tap:9", ["6:2.2"], [], [("grok", "drums")]),
        ("shuffle", "שאפל", "כל צעד שני מתאחר מעט. בלעדיו טכנו, איתו האוס.", "hold:SHIFT,tap:3,rel,turn:TEMPO/VALUE,tap:1", ["6:2.3"], [], [("grok", "tempo")]),
        ("shift", "להזיז כלי בזמן", "כל המכות של כלי זזות יחד, צעד קדימה או אחורה.", "hold:OPEN HIHAT,turn:TEMPO/VALUE", ["6:5.2"], [], [("grok", "drums")]),
        ("flam", "מכה כפולה", "שתי מכות צמודות, כמעט אחת.", "hold:HAND CLAP,tap:13", ["6:3.2"], [], []),
        ("triplet", "משולשים", "הפעמה מתחלקת לשלוש. התחושה ״מתגלגלת״.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2", ["6:4.3"], [], [("grok", "tempo")]),
    ]),
    ("tension", "לבנות מתח ומעברים", "מה שקורה לפני שהשיר משתנה.", [
        ("roll", "גלגול", "כמה מכות מהירות בצעד אחד.", "hold:SNARE DRUM,tap:16,tap:16,tap:16", ["6:3.1"], [], [("codex", "tricks"), ("grok", "drums")]),
        ("stutter", "גמגום", "התופים נתקעים על צעד, והבס ממשיך.", "hold:SHIFT,tap:PATTERN,rel,tap:13", ["6:5.1"], [], [("grok", "drums")]),
        ("fill", "מילוי", "תבנית שמנגנת פעם אחת, כמעבר.", "hold:SHIFT,tap:7", ["6:6.2"], ["s8"], [("grok", "patterns")]),
        ("mute", "לבנות ולפרק בהשתקות", "מוציאים כלים ומחזירים אותם, אחד אחרי השני.", "hold:SHIFT,tap:CLOSED HIHAT", ["5:6.3"], [], [("codex", "tricks")]),
        ("throw", "זריקת הד", "מגבירים את ההד לרגע, וחלק מהצליל ממשיך.", "turn:DELAY", ["7:4.4"], [], []),
        ("rndrhythm", "תופים אקראיים", "תופים חדשים בלחיצה. שחזור מחזיר.", "hold:SHIFT,tap:9", ["6:5.3"], [], []),
    ]),
    ("basssound", "לעצב את הבס", "איך הבס נשמע.", [
        ("filter", "בהירות, צפצוף ו״וואו״", "CUTOFF, RESO ו־ENV MOD: הלב של האסיד.", "", ["4:4.2", "5:3.2", "5:3.3", "5:3.4"], ["cutoff", "reso", "envmod"], [("codex", "bass"), ("grok", "bass")]),
        ("decay", "אורך כל תו", "קצר: קופצני. ארוך: רך.", "", ["5:3.1"], ["bdec"], [("grok", "bass")]),
        ("wave", "מסור או מרובע", "שתי צורות גל לבס.", "hold:PATTERN,tap:11", ["4:4.3"], [], [("codex", "bass"), ("grok", "bass")]),
        ("recipes", "מתכונים לבס", "ארבע נקודות התחלה מוכנות.", "", ["7:3.3"], ["cutoff", "reso", "envmod", "bdec"], [("grok", "recipes")]),
        ("od", "עיוות", "בס רועש ואגרסיבי, לכל כלי בנפרד.", "hold:PATTERN,tap:10,rel,tap:BASS", ["7:2.1", "7:2.2"], [], [("grok", "fx")]),
        ("transpose", "להזיז את כל הקו בגובה", "אותו קו, במקום אחר.", "hold:BASS,hold:KYBD,turn:TEMPO/VALUE", ["7:3.1"], [], [("grok", "bass")]),
        ("accstr", "כמה חזקה ההדגשה", "ההבדל בין תו רגיל לתו מודגש.", "tap:BASS,hold:ACCENT,turn:TEMPO/VALUE", ["7:3.4"], [], []),
    ]),
    ("drumsound", "לעצב תופים", "איך התופים נשמעים.", [
        ("tune", "גובה ואורך של תוף", "TUNE, ו־DECAY מעביר אותו לאורך.", "", ["4:3.2", "4:3.3"], ["bdtune", "bddec", "sdtune", "sddec", "tctune", "hhdec"], [("codex", "drums"), ("grok", "drums")]),
        ("level", "עוצמה של כל כלי", "כפתור LEVEL לכל אזור.", "", ["5:2.5"], ["bdlvl", "sdlvl", "tclvl", "hhlvl", "blvl"], [("codex", "drums")]),
        ("atk", "קליק בקיק", "כמה ״נוקש״ הקיק בהתחלה.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:BASS DRUM", ["7:1.1"], [], [("grok", "drums")]),
        ("snappy", "קפיצים בסנר", "כמה רעש יש בסנר.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:SNARE DRUM", ["7:1.2"], [], [("grok", "drums")]),
        ("swap", "להחליף את צליל הקלאפ או הטום", "קלאפ, טום רעש או טום גבוה. ושני טומים.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2", ["7:1.3"], ["clap", "tom"], [("codex", "drums"), ("grok", "drums")]),
        ("gain", "לשנות כלי אחד מתוך שניים", "GAIn, tUnE ו־dECY בתפריט, לכל כלי בנפרד.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:OPEN HIHAT", ["7:1.4"], [], [("codex", "drums")]),
        ("pan", "ימין ושמאל", "מיקום כל כלי בסטריאו.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:CLOSED HIHAT", ["7:1.5"], [], [("grok", "drums")]),
        ("ohsync", "היי־האט פתוח לפי הקצב", "האורך נמתח עם הקצב.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2", ["7:1.6"], ["oh"], [("grok", "drums")]),
    ]),
    ("space", "מרחב, הד ושאיבה", "אפקטים.", [
        ("fx", "הד והדהוד", "שני כפתורים, ועם SHIFT: זמן ואורך.", "turn:DELAY,turn:REVERB", ["4:6.1", "5:5.2"], [], [("codex", "effects"), ("grok", "fx")]),
        ("dsync", "הד שננעל לקצב", "הזמן בערכים מוזיקליים: שמינית, שמינית מנוקדת.", "hold:SHIFT,turn:DELAY", ["7:4.1"], [], [("grok", "fx")]),
        ("sends", "מי נכנס להד, ומי להדהוד", "קיק יבש, בס עם הד, קלאפ בחדר.", "hold:SHIFT,tap:13,rel,tap:BASS,turn:TEMPO/VALUE,tap:1", ["7:4.2"], ["s14"], [("codex", "effects"), ("grok", "fx")]),
        ("drse", "הד שנעלם בהדהוד", "ההד ״מתמוסס״ בחלל.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2", ["7:4.3"], [], []),
        ("sc", "שאיבה מהקיק", "הבס נחלש בכל קיק, ו״נושם״.", "hold:PATTERN,tap:12,rel,turn:TEMPO/VALUE,tap:1", ["5:5.1", "7:5.1", "7:5.2"], [], [("grok", "fx")]),
        ("scfx", "שאיבה גם להדהוד", "הרבה הדהוד, והקיק נשאר נקי.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2,tap:ACCENT", ["7:5.3"], [], []),
        ("gate", "שער", "ניסוי: הבס נחתך בקצב של ההיי־האט.", "hold:SHIFT,tap:15,rel,turn:TEMPO/VALUE,tap:2,tap:BASS", ["7:5.4"], [], []),
    ]),
    ("safe", "לשמור ולצאת מבלגן", "רשת הביטחון.", [
        ("reload", "לחזור למצב השמור", "תופים, בס או הכל, בלחיצה.", "hold:PATTERN,tap:16", ["6:1.1"], ["s14", "s15"], [("grok", "patterns")]),
        ("save", "לשמור", "Ptn לתבנית אחת, ALL לכולן.", "hold:SHIFT,tap:16,rel,turn:TEMPO/VALUE,tap:2", ["6:7.2", "5:8.1"], [], [("codex", "finish"), ("grok", "patterns")]),
        ("exit", "לצאת מכל תפריט", "הלכת לאיבוד? לחצן 1.", "tap:1", ["4:5.3"], [], []),
        ("restart", "כיבוי והדלקה", "כל מה שלא נשמר חוזר למצב השמור.", "", ["4:7.1"], ["display"], []),
        ("trouble", "כשמשהו לא עובד", "טבלאות תקלות בכל שיעור.", "", ["6:ref"], [], [("grok", "trouble")]),
    ]),
]
