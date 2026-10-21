"""The settings table: what the T-8 keeps with a pattern, what clearing wipes, what stays. build.py makes settings.html
from this, and adds a one-line note (colored dot + link to the row) to every card listed in a row's `cards`.

Source of truth: the official manual v1.02 (MAN below). A row with a `src` key cites the page that says it.
A row with src=None is NOT in the manual. In the "unknown" group that means: we don't know yet, check on the device.
When Raz reports what he saw, move the row to the right group and say where the answer came from.

Row: (id, name, how, note, cards, src)
  how   short HTML: which buttons
  note  one or two short sentences
  cards "6:1.2" = lesson-6.html card 1.2 (file numbers, not the per-device numbers on the site)
"""

MAN = "https://static.roland.com/manuals/T-8_manual_v102/eng/"
SRC = {
    "rhythm": (MAN + "28312384.html", "הסקוונסר של התופים"),
    "bass": (MAN + "28312362.html", "הסקוונסר של הבס"),
    "save": (MAN + "28312254.html", "בחירת תבנית, קצב ושמירה"),
    "menu": (MAN + "28312322.html", "פונקציות, תפריט וקיצורים"),
    "fx": (MAN + "28312336.html", "הד והדהוד"),
}


def k(*keys):
    return " + ".join(f"<kbd>{x}</kbd>" for x in keys)


# The five actions that decide what survives. (name, how, what happens, card, src)
ACTIONS = [
    ("שמירה", k("SHIFT", "16") + " (WRITE), סובב עד [[seg:Ptn]], ואז " + k("2") + " (ENTER)",
     "התבנית שנבחרה נשמרת. [[seg:ALL]] במקום [[seg:Ptn]] שומר את כל התבניות.", "5:8.1", "save"),
    ("מחיקת תבנית", k("SHIFT", "11") + " (PTN CLEAR ALL)",
     "מוחק את התבנית שנבחרה. רק אותה, למרות השם ALL.", "4:3.1", "menu"),
    ("מחיקת כלי", "בוחרים כלי, ואז " + k("SHIFT", "12") + " (PTN CLEAR INST)",
     "מוחק רק את הכלי שנבחר, בתבנית שנבחרה.", "5:4.1", "menu"),
    ("שחזור", k("PATTERN", "14") + " / " + k("15") + " / " + k("16"),
     "מחזיר את התופים / הבס / הכל למה ששמרת בפעם האחרונה.", "6:1.1", "menu"),
    ("כיבוי", "מתג POWER",
     "כל תבנית שלא נשמרה חוזרת למה ששמרת. השתקות מתבטלות.", "4:7.1", "save"),
]

# Groups: (id, title, one line, three answers: saved with pattern / clearing wipes it / stays always)
# answer = (mark, short text); mark is "yes", "no", "dash" or "q"
GROUPS = [
    ("pattern", "חלק מהתבנית", "נכתב לתוך התבנית, כמו המכות עצמן.",
     (("yes", "כן, ב־WRITE"), ("yes", "כן"), ("no", "לא: שחזור וכיבוי מחזירים למה ששמרת")), [
        ("steps", "מכות התופים", "בוחרים כלי ולוחצים על צעדים, או מתופפים עם <kbd>●</kbd>",
         "PTN CLEAR INST מוחק רק את הכלי שנבחר.",
         ["4:3.2", "5:2.1", "5:2.2", "5:2.3", "5:2.4", "6:6.3"], "rhythm"),
        ("racc", "הדגשות בתופים", "<kbd>ACCENT</kbd>, ואז הצעדים",
         "לפי המדריך, הדגשה חלה על כל התופים יחד, לא על כלי אחד.", ["6:2.2"], "rhythm"),
        ("prob", "סיכוי לכל מכה", "מחזיקים צעד, ומסובבים <kbd>TEMPO/VALUE</kbd>. בתצוגה P.0 עד P.100",
         "", ["6:1.2", "6:1.4"], "rhythm"),
        ("vel", "עוצמה לכל מכה", "מחזיקים צעד, " + k("ACCENT") + ", ומסובבים. בתצוגה v.0 עד v.10",
         "", ["6:2.1"], "rhythm"),
        ("sub", "גלגולים וקלאפ כפול", "מחזיקים כלי ולוחצים על צעד: 1_2, 1_3, 1_4, FLAN",
         "גם הסיכוי של הגלגול.", ["6:3.1", "6:3.2", "6:3.3"], "rhythm"),
        ("nudge", "הזזת כלי בזמן", "מחזיקים כלי, ומסובבים <kbd>TEMPO/VALUE</kbd>",
         "המכות עצמן זזות בתוך התבנית.", ["6:5.2"], "menu"),
        ("random", "תופים או בס אקראיים", k("SHIFT", "9") + " לתופים, " + k("SHIFT", "10") + " לבס",
         "כותב תבנית חדשה במקום הקיימת. שחזור מחזיר את שלך.", ["6:5.3"], "menu"),
        ("bass", "תווים, הדגשות וגלישות בבס", "<kbd>BASS</kbd>, ואז צעדים או <kbd>KYBD</kbd>",
         "כולל תווים ארוכים (n.tie).", ["5:4.2", "5:4.3", "5:4.4", "7:3.2"], "bass"),
        ("last", "אורך התבנית", k("SHIFT", "4") + " (LAST). לתופים ולבס בנפרד",
         "כשהאורך 16 או פחות, " + k("SHIFT", "6") + " (STEP 17-32) הופך אותו ל־32. מה המחיקה עושה לאורך: המדריך לא אומר.",
         ["6:4.1", "6:4.2"], "menu"),
    ]),
    ("unit", "של כל המכשיר", "לא שייך לתבנית. החלפת תבנית לא משנה אותו.",
     (("no", "לא, הוא לא בתבנית"), ("no", "לא"), ("yes", "כן")), [
        ("tempo", "הקצב", "<kbd>TEMPO/VALUE</kbd>. עם " + k("SHIFT") + " בעשיריות",
         "משותף לכל התבניות, ונשמר במכשיר.", ["4:1.4", "5:1.2"], "save"),
        ("knobs", "הכפתורים שמסתובבים",
         "<kbd>LEVEL</kbd> <kbd>TUNE</kbd> <kbd>DECAY</kbd> <kbd>CUTOFF</kbd> <kbd>RESO</kbd> <kbd>ENV MOD</kbd> <kbd>PITCH</kbd> <kbd>DELAY</kbd> <kbd>REVERB</kbd>",
         "כפתור לא זוכר ערך: הצליל הוא תמיד איפה שהכפתור עומד עכשיו. לכן מצלמים את הלוח. חוץ מזה: "
         + k("SHIFT", "DELAY") + " ו־" + k("SHIFT", "REVERB") + " הם זמנים, והם בקבוצה הצהובה.",
         ["4:4.2", "5:3.1", "5:8.1"], None),
    ]),
    ("temp", "זמני", "נעלם כשמכבים.",
     (("no", "לא"), ("dash", "לא כתוב"), ("no", "לא: נעלם בכיבוי")), [
        ("mute", "השתקה", k("SHIFT") + " + לחצן הכלי",
         "חוזרת לכבויה בכל כיבוי. השתקה לא מוחקת מכות.", ["5:6.3"], "menu"),
        ("unsaved", "כל שינוי שלא שמרת", "",
         "בכיבוי, כל תבנית שלא נשמרה חוזרת למה ששמרת.", ["4:7.1"], "save"),
    ]),
    ("unknown", "המדריך לא אומר", "לא כתוב אם זה נשמר עם התבנית, אם המחיקה מוחקת, או אם השחזור מחזיר. עד שנבדוק: רושמים את הערך לפני שמשנים, ומחזירים ביד.",
     (("q", "לא ידוע"), ("q", "לא ידוע"), ("q", "לא ידוע")), [
        ("shuffle", "שאפל", k("SHIFT", "3") + " (SHUFFLE)",
         "המדריך קורא לזה ״השאפל של התבנית״. זה רמז שהוא שייך לתבנית, לא הוכחה. נבדק בבדיקה למטה.", ["6:2.3"], None),
        ("mprob", "סיכוי כללי", "מחזיקים <kbd>PATTERN</kbd>, ומסובבים <kbd>TEMPO/VALUE</kbd>",
         "לפי המדריך, פועל רק על מכות שיש להן סיכוי משלהן.", ["6:1.3"], None),
        ("accstr", "עוצמת ההדגשה", "מחזיקים <kbd>ACCENT</kbd>, ומסובבים. בתפריט: r.ACC לתופים, b.ACC לבס",
         "", ["5:4.4", "6:2.2", "7:3.4"], None),
        ("scale", "משולשים", "בתפריט: r.SCL לתופים, b.TRi לבס", "", ["6:4.3"], None),
        ("drums", "צלילי התופים בתפריט", "GAIn, tUnE, dECY, PAn, AtK, SnPy, CoIr, tON, CLAP, וסנכרון ההיי־האט הפתוח",
         "את PAn נבדוק בבדיקה למטה.", ["7:0.1", "7:1.1", "7:1.2", "7:1.3", "7:1.4", "7:1.5", "7:1.6"], None),
        ("wave", "צורת הגל של הבס", k("PATTERN", "11") + " (b.WAv)", "", ["4:4.3"], None),
        ("od", "עיוות", k("PATTERN", "10") + " (Od.On). בתפריט: Od.dr, Od.Lv", "", ["7:2.1", "7:2.2"], None),
        ("transp", "טרנספוז לבס", "מחזיקים <kbd>BASS</kbd> ו־<kbd>KYBD</kbd>, ומסובבים <kbd>TEMPO/VALUE</kbd>",
         "לא כתוב אם זה משנה את התווים עצמם, או רק מזיז אותם בזמן הנגינה.", ["7:3.1"], None),
        ("fxtime", "זמן ההד וההדהוד", k("SHIFT", "DELAY") + ", " + k("SHIFT", "REVERB") + ". בתפריט: d.Syn, d.rSE",
         "", ["5:5.2", "7:4.1", "7:4.3"], None),
        ("sends", "כמה כל כלי שולח להד ולהדהוד", k("SHIFT", "13") + " (d.Snd), " + k("SHIFT", "14") + " (r.Snd)",
         "", ["4:6.1", "7:4.2"], None),
        ("sc", "שאיבה", k("PATTERN", "12") + " (SC). בתפריט: SC.Sr, SC.dG, SC.ti",
         "", ["5:5.1", "7:5.1", "7:5.2", "7:5.3", "7:5.4"], None),
        ("fill", "תבנית המילוי", k("SHIFT", "8") + " (FILL PTN)",
         "לפי המדריך נקבעת לכל בנק בנפרד. אם היא נשמרת: לא כתוב.", ["6:6.2"], None),
    ]),
]

# One check on the device that settles two yellow rows (shuffle, and PAn for the drum sounds). Uses the kit shorthand.
TEST = """<article class="card set-test" id="set-test">
  <div class="card-head"><h3>בדיקה אחת, חמש דקות</h3><span class="label">ספר לי מה שמעת</span></div>
  <p>שתי הגדרות מהקבוצה הצהובה, ושתי שאלות: האם השחזור מחזיר אותן, והאם הן נשארות אחרי כיבוי.</p>
  [[state:play||תבנית 16, הג׳אם ששמרת|באוזניות]]
  <ol class="steps">
    <li><div>[[hold:SHIFT]] ו־[[tap:3]] (SHUFFLE). [[rel]]. רשום את המספר בתצוגה.</div></li>
    <li><div>[[turn:TEMPO/VALUE]] ימינה, עד שהגרוב מתנדנד ברור. [[hold:SHIFT]] ו־[[tap:1]]. [[rel]].</div></li>
    <li><div>[[hold:SHIFT]] ו־[[tap:15]] (MENU). [[rel]]. [[turn:TEMPO/VALUE]] עד [[seg:PAn]], ואז [[tap:CLOSED HIHAT]]. רשום את הערך.</div></li>
    <li><div>[[turn:TEMPO/VALUE]] עד [[seg:L20]]. [[hold:SHIFT]] ו־[[tap:1]]. [[rel]]. ההיי־האט הסגור עכשיו משמאל.</div></li>
    <li><div>שחזור: [[hold:PATTERN]] ו־[[tap:16]]. [[rel]]. הקשב: מה נשאר?</div></li>
    <li><div>כבה במתג POWER, חכה שתי שניות, והדלק. [[tap:PATTERN]], [[tap:16]], [[tap:BASS DRUM]], [[tap:▶]]. הקשב שוב.</div></li>
    <li><div>החזר את שניהם לערכים שרשמת.</div></li>
  </ol>
  <div class="tbl-box"><table class="set-ask">
    <thead><tr><th></th><th>אחרי שחזור (5)</th><th>אחרי כיבוי (6)</th></tr></thead>
    <tbody><tr><th>השאפל</th><td>נשאר / חזר?</td><td>נשאר / חזר?</td></tr>
    <tr><th>ההיי־האט משמאל</th><td>נשאר / חזר?</td><td>נשאר / חזר?</td></tr></tbody>
  </table></div>
  <p class="info">ספר לי מה שמעת בארבע המשבצות, ואעביר את השורות למקום הנכון בטבלה.</p>
  <p class="warn">השחזור בצעד 5 מוחק כל שינוי בתבנית 16 שלא שמרת.</p>
</article>"""

# What the manual says, in Hebrew. Shown when Raz taps the badge (the English pages stay in SRC, for checking only).
# Key: row id, or action name. A row with src=None outside the "unknown" group explains here why it is not in the manual.
SAYS = {
    "שמירה": "שומרים עם SHIFT ו־WRITE. בתצוגה בוחרים Ptn כדי לשמור את התבנית שנבחרה, או ALL כדי לשמור את כל התבניות, ומאשרים ב־ENTER.",
    "מחיקת תבנית": "על PTN CLEAR ALL כתוב: ״מוחק את התבנית שנבחרה״. כלומר תבנית אחת.",
    "מחיקת כלי": "על PTN CLEAR INST כתוב: ״מוחק את התבנית של הכלי שנבחר״.",
    "שחזור": "PATTERN + 14 טוען מחדש את התופים, 15 את הבס, ו־16 את כל התבנית. ובתפריט: ״התבנית חוזרת למצב השמור האחרון״.",
    "כיבוי": "״כשמכבים, כל תבנית שלא נשמרה חוזרת למצב השמור האחרון.״ ועל ההשתקה: ״חוזרת לכבויה כשמכבים את המכשיר.״",
    "steps": "בוחרים כלי ולוחצים על צעדים: הצעדים נדלקים והמכות נכנסות. לחיצה על צעד דולק מוחקת את המכה.",
    "racc": "בוחרים כלי, לוחצים ACCENT, ואז את הצעדים. ״ההדגשה חלה על כל כלי התופים.״",
    "prob": "מחזיקים לחצן צעד ומסובבים TEMPO/VALUE: P.0 עד P.100, הסיכוי שהמכה בצעד הזה תנגן.",
    "vel": "בצעד, לוחצים ACCENT ובוחרים ב־TEMPO/VALUE בין v.0 ל־v.10: העוצמה של המכה הזו.",
    "sub": "מחזיקים לחצן כלי ולוחצים על צעד. כל לחיצה מחליפה: OFF, 1_2, 1_3, 1_4, FLAN. עם ACCENT באותו מסך קובעים את הסיכוי, P.0 עד P.100.",
    "nudge": "בטבלת הקיצורים: לחצן כלי ו־TEMPO/VALUE ״מזיזים את התבנית של הכלי קדימה או אחורה״.",
    "random": "SHIFT + 9: ״יוצר תבנית תופים אקראית״. SHIFT + 10: ״יוצר תבנית בס אקראית״.",
    "bass": "בכל צעד של הבס יש תו (או n.tie לתו ארוך, או n.oFF לשקט), הדגשה (A.On או A.OFF) וגלישה (S.On או S.OFF).",
    "last": "LAST ״קובע את האורך של התבנית שנבחרה״. אפשר לקבוע אותו לתופים ולבס בנפרד, ואז הם עלולים לא להיפגש. ועל STEP 17-32: אם האורך 16 או פחות, הוא הופך ל־32.",
    "tempo": "״הקצב משותף לכל התבניות, ונשמר במכשיר.״",
    "mute": "״משתיק זמנית את הכלי שנבחר.״ SHIFT ולחצן הכלי מדליקים ומכבים השתקה, גם מחוץ לתפריט. ״ההשתקה חוזרת לכבויה כשמכבים את המכשיר.״",
    "unsaved": "״כשמכבים, כל תבנית שלא נשמרה חוזרת למצב השמור האחרון.״",
    "knobs": "המדריך מסביר מה כל כפתור עושה, אבל לא כתוב בו אם המיקום שלו נשמר. מה שכתוב בשורה הוא ההיגיון: לכפתור יש רק מיקום אחד, מה שרואים על הלוח.",
}

# The line a card gets, per group
NOTE = {
    "pattern": "נשמר עם התבנית, ונמחק במחיקה",
    "unit": "לא שייך לתבנית: מחיקה ושחזור לא נוגעים בו",
    "temp": "זמני: נעלם בכיבוי",
    "unknown": "המדריך לא אומר אם זה נשמר. רשום את הערך לפני שמשנים",
}
