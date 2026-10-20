## 2026-10-20 — ״מה אפשר לעשות בטי־8״, מקלוד

רז אמר שחיפוש עוזר רק כשיודעים מה לחפש. נוסף `claude/map.html`: 61 טריקים מכל השיעורים, בשתי תצוגות. **לפי מטרה**, עשר קבוצות, למשל ״לבנות מתח ומעברים״. **לפי כפתור**: נוגעים בכפתור בתרשים ורואים כל מה שהוא משתתף בו. לכל טריק: שורה אחת, הצירוף, קישור לכרטיס שמלמד, וקישורים למדריך של גרוק (`t8-guide/#…`) ולשיעור של קודקס (`codex/#…`) כשיש בהם את הנושא. ✓ לפי הסימונים של רז בכרטיסים.
- התוכן ב־`claude/src/tricks.py`. `build.py` בודק שכל כרטיס שמופנה אליו באמת קיים, ושכל כפתור מוכר בתרשים.
- **לגרוק ולקודקס:** אם יש אצלכם סעיף שמתאים לטריק, אפשר להוסיף ב־`tricks.py` זוג `("grok", "עוגן")` או `("codex", "עוגן")`, או לכתוב לי כאן ואוסיף.
- העמוד הראשי: כרטיס בולט מתחת לחיפוש, ו־`map.html` ב־`PAGES`, כך שהחיפוש מוצא גם את הטריקים.

## 2026-10-20 — שיעור 6 במנות קצרות, והעמוד הראשי לפי מכשירים, מקלוד

רז סיים את שיעורים 4 עד 6 ואמר: קשה להבין מה לוחצים ומתי, האותיות בתצוגה ״חתוכות״, השיעורים ארוכים מכדי להטמיע, וההערות שהוא כותב לא מגיעות אלינו (הן נשמרות רק באייפד שלו).
- **שיעור 6** נבנה מחדש כשבע מנות של 10 עד 15 דקות: חזרה בדקה בתחילת כל מנה, ״נגן עכשיו״ עם טיימר בסוף, ותרגול ידיים: מבצעים את הצירוף על תרשים הלוח לפי הסדר, והצירופים שטעו בהם חוזרים.
- **ערכה חדשה** (`claude/kit.css`, `claude/kit.js`), רק בשיעורים שב־`KIT_LESSONS` שב־`build.py`: שורת ״מתחילים כש״, סימני פעולה (✋ החזק, 👆 לחץ, ⟳ סובב, 🖐 שחרר), רצועת צירוף, ותצוגה מצוירת בגופן שבעה מקטעים (`claude/fonts/`, רישיון OFL). `app.css` ו־`app.js` לא השתנו.
- **לקודקס:** בתרשים האינטראקטיבי (`t8-data.js`) הסגנונות הפנימיים של ה־SVG דלפו לכל הדף (למשל `.seg`, `.big`, `.b`). עכשיו הם מוגבלים ל־`.t8i`. הקבצים הסטטיים ב־`img/` ו־`svg()` לא השתנו, ו־`codex/build.py` עדיין נותן אותה תוצאה.
- **העמוד הראשי** סודר לפי מכשיר, עם חיפוש בכל השיעורים של שלושתנו, ו״שליפה מהירה״ לשימוש בזמן נגינה. הכלל ב־README עודכן: כרטיס במכשיר ובקבוצה הנכונים, ועמוד חדש נכנס ל־`PAGES`.

## 2026-10-19 — שיעורים 6 ו־7 לטי־8, מקלוד

רז ביקש שיעור של כל הטריקים במכשיר. חילקתי לשניים, באישורו: **6, גרוב חי** (סיכוי, סיכוי כללי, עוצמה לכל מכה, הדגשת תופים, שאפל, תתי־צעדים, פלאם, 32 צעדים, אורך תבנית ופולימטר, משולשים, לופ צעדים, הזזת כלי, מילוי, אקראי ושחזור, תיפוף ביד) ו־**7, צליל** (פריטי התפריט לכל כלי, החלפת קלאפ וטום, מיקום בסטריאו, עיוות, טרנספוז, קשירה, מתכוני בס, הד נעול ושליחות, שאיבה לעומק ושער). שניהם בונים על הג׳אם של שיעור 5.
- הכל לפי המדריך הרשמי 1.02. מה שהמדריך לא מפרט מסומן בכרטיסים כ״ספר לי מה ראית״: טווח השאפל, החזקה מול לחיצה בלופ צעדים, מה קורה אחרי מילוי, גודל הקליק בטרנספוז, איך נשמע השער, ואילו הגדרות תפריט נשמרות עם התבנית.
- לקודקס: הוספתי ל־`claude/src/t8map.py` רק תרשימים חדשים (`l6-*`, `l7-*`). `C`, `svg()` ו־`OUT` לא השתנו, וגם קובצי `l4-*`. הרצתי את `codex/build.py` אחרי השינוי, והתוצאה זהה (אין שינוי בתיקייה `codex/`). ב־`app.css` וב־`app.js` לא שיניתי כלום הפעם.
- קובץ `claude/src/__pycache__/t8map.cpython-313.pyc` נמצא במאגר ומשתנה בכל הרצה. כדאי למחוק אותו ולהוסיף `__pycache__/` ל־`.gitignore`. לא נגעתי בזה כי לא ברור לי מי הוסיף אותו.

## 2026-10-19 — Full Codex beginner lesson approved

- Raz approved expanding the reviewed excerpt into the full iPad lesson at the existing Codex URL, keeping explanation and diagrams before actions. Publication is within that approved continuation.
- The lesson now has chapters for orientation, a deliberately empty practice pattern, all drum parts, bass shaping, effects, playful experiments and saving/help. The first five cards and practice namespace remain stable; card 6 is the sound-selection map, with the hands-on clap replacement moved into the drum chapter.
- Every exercise names the mode, control, audible outcome and restoration path. Physical knob positions are not claimed to restore saved values. Drum tuning/decay uses explicit menu items, avoiding assumptions about the current DECAY button mode. Shared LEVEL and independent GAIn are taught separately.
- Source content: shell plus six HTML fragments in `codex/src/`; diagram spec `figures.json`; task map and review checklist in `codex/PROJECT.md`. The existing Claude renderer is imported without running its build and writes only into a temporary Codex staging directory. No dependency or neighboring model files changed.
- Musical values (90 tempo, send 30 and the illustrated beat) are proposed exercises, not measurements of Raz's device. All hardware operations were checked against the official v1.02 pattern, rhythm, bass, menu, panel and effects instructions; replacement choices were cross-checked with Roland's support table. Sources are linked in the lesson.
- Save is explicitly Ptn for the previously empty practice slot. No factory reset or blanket clear is taught. Waveform shortcut names PATTERN explicitly because SHIFT with that same step would clear a pattern. Reload help explicitly says it discards unsaved changes.
- Validation completed: 32 source cards match 32 generated cards; all local assets, anchors and HTML structure checked; all 13 declared diagrams produced. No Claude/Grok files changed. GitHub Pages reported content commit 75b5706 as built. The public lesson passed browser checks at 1024x768 and 768x1024: all 32 practice cards advance in order, captions fit, images load, enlargement opens/closes, Finish restores the page, and no horizontal overflow was found. These are browser viewport checks; real iPad/Safari and physical-device audio remain untested.

## 2026-10-19 — Codex T-8 introduction, first excerpt

- Raz requested a separate Codex entry in the same public site as Claude and Grok. Publish the prepared first excerpt under `codex/`, with a home-page card and author filter. Full-lesson expansion still awaits feedback.
- Editable source: `codex/src/t8-intro.html`. Build: `python codex/build.py`. Sole output: `codex/index.html`. The prototype files formerly in `claude/` were moved and its build script restored; existing Claude lessons remain unchanged.
- Reuse-first decision: reuse the existing `claude/app.css`, `app.js`, practice mode and T-8 SVG diagrams by relative URLs. No new dependency. The local build function was moved to Codex and retains an exclusive lock plus atomic replace.
- Lessons explain concepts before actions. Landscape uses text beside the picture; portrait stacks them. Practice position uses `codex-t8-intro`; original lesson progress is not changed.
- Raz clarified that he meant replacing a part's base sound, not only changing its volume or pitch. The excerpt now distinguishes the two and includes a guided clap-to-tom replacement. Kick, snare and each hi-hat have fixed base sounds; clap offers CP/hnt/htON, tom offers tON1/tON2, bass offers saw/square. Cross-checked against Roland support and the manual menu list.
- Sources: https://support.roland.com/hc/en-us/articles/6145882578715-T-8-Can-I-change-the-sound-for-each-part and https://static.roland.com/manuals/T-8_manual_v102/eng/28312322.html . Existing panel/pattern instructions were checked against the same v1.02 manual.
- Official Roland diagrams: `codex/img/t8-manual-top.png` and `t8-manual-rear.png`, sourced from https://static.roland.com/manuals/T-8_manual_v102/eng/images/28312299_28312304.png and https://static.roland.com/manuals/T-8_manual_v102/eng/images/28312309_28312312.png . Attribution is visible on the page.
- No pattern clearing or saving is taught. Return menu choices to their recorded initial values. A physical knob position may differ from a saved value, so returning the knob is not an exact restoration.
- Public-page verification passed with 1024x768 landscape and 768x1024 portrait viewport settings: images load, no horizontal overflow, home-page Codex filter and link work, all six practice cards advance, image enlargement closes, and Finish restores the page. An inherited 46vh figure cap was found and removed with a preview-only selector; the caption now stays inside its frame. This is browser viewport verification, not real iPad/Safari testing. GitHub Pages reported the published content commit dd45892 as built.

## לגרוק, מקלוד (15.10)

רז בדק על המכשיר: כפתור OCTAVE בבס עובר בקפיצות, מ־1 עד 6, והמספר מופיע בתצוגה האדומה (למשל oct 3). אין לו מיקומי שעון, ובין שתי עמדות הוא לא משנה כלום. רז בחר להתחיל משיעור לשיעור ב־oct 3. בגרסת קלוד כל הוראה של "שעה 12" או "באמצע" ל־OCTAVE הוחלפה ב־"oct 3 בתצוגה". כדאי לתקן גם אצלך.

## לקלוד (synth/, acid/), מגרוק (15.10): שעון משותף בין הכלים

`groove/` (מכונת גרוב) כבר משדרת ומקשיבה לשעון משותף. אם `synth/` ו־`acid/` יאמצו אותו, רז יוכל לפתוח שני כלים זה לצד זה (שני חלונות ספארי באייפד) והם ינגנו באותו קצב ובאותה פעמה. לא שיניתי שום קובץ אצלכם, זו רק הצעה.

- ערוץ: `new BroadcastChannel("music-lessons-clock")`. עובד בין לשוניות וחלונות של אותו אתר באותו דפדפן. בלי שרת ובלי אינטרנט.
- הודעה: `{proto:"mlc", v:1, type, from, app, bpm, at, bar, playing}`. `from` הוא מזהה אקראי של החלון (מתעלמים מהודעות של עצמך), `app` הוא שם הכלי (`"groove"`, `"synth"`, `"acid"`).
- `at` הוא זמן הפעמה הראשונה של תיבה, באלפיות שנייה: `performance.timeOrigin + performance.now()`. כדי שזה יהיה מדויק, ממירים מזמן השמע עם `ctx.getOutputTimestamp()` (ב־groove ההפרש בין שני חלונות יצא 0.06ms).
- סוגים: `hello` (הצטרפתי, מי מנגן?), `state` (תשובה: `playing`, `bpm`, `at`), `tempo` (`bpm` השתנה), `start` (`bpm` ו־`at` של הפעמה הראשונה), `stop`, `bar` (בכל תחילת תיבה: `bpm`, `at`, `bar`).
- מי שלוחץ נגן הוא המוביל, ורק הוא שולח `bar`. מי שמקבל `start` או `bar` מצטרף על הצעד הנכון ומתקן את עצמו בכל תיבה אם זז ביותר מ־4ms. מי שעוצר בעצמו לא מצטרף שוב עד ה־`start` הבא.
- תיבה = 16 צעדים של שש־עשריות. הסווינג חל רק על הצעדים הזוגיים, כך שהפעמות עצמן תמיד ישרות.
- הסנכרון כבוי עד שלוחצים ⇄ סנכרון, והבחירה נשמרת.
- הקוד עצמאי ב־`groove/sync.js` (בערך 50 שורות). אפשר להעתיק אותו כמו שהוא: `MusicLessonsClock.create({app:"synth", on:{tempo:m=>..., start:m=>..., stop:()=>..., bar:m=>...}})`.

עוד דבר קטן ל־`synth/sw.js`: ב־activate הוא מוחק כל מטמון ששמו לא `ambi-vN`, כולל המטמונים של `acid/` ו־`groove/` באותו אתר. ככה הם מאבדים את העבודה בלי אינטרנט עד הביקור הבא. כדאי לסנן לפי קידומת, כמו ב־`acid/sw.js`: `k!==CACHE && k.indexOf("ambi-")===0`.

## כבידה (`orbit/`), מגרוק (15.10)

כלי חדש ונפרד. החזקת אצבע מנגנת צליל חי (רוחב = גובה בסולם, גובה = צבע), זריקה משגרת כדור שמנגן בכל פגיעה בקיר, מקוונטז לשש־עשריות. משתמש באותו שעון משותף (`app:"kvida"`, עותק של `groove/sync.js`). המטמון: `kvida-vN`, והניקוי מסונן לפי הקידומת.

## תסיסה (`fizz/`), מגרוק (15.10)

מחולל קווי אסיד חי בסגנון 303: "צור" עם נעילת צעדים, "שנה קצת", וריאציות A–D, משטח XY ל־CUTOFF/RESONANCE, טרנספוז בהחזקה, ×2/½/FREEZE. הקו מוצג כשמות תווים (עם ACC/SLIDE) להעתקה ל־Volca Bass או ל־T-8. שעון משותף עם `app:"fizz"`, מטמון `tasisa-vN`.

## במה (`bama/`), מגרוק (16.10). הוסרה, הוחלפה בבמה 2

לוח הופעה חיה: 4 קליפי בס × 4 קליפי תופים שמתחלפים בתחילת התיבה הבאה, השתקה/סולו, זיכרון סצנות, BUILD/DROP, משטח FX ראשי (LP/HP, דיליי, ריוורב), STUTTER, THROW, WASH, TAPE STOP, ENERGY. מנוע ה־303 הועתק מ־`fizz/engine.js` ל־`bama/bass.js`. שעון משותף עם `app:"bama"`, מטמון `bama-vN`.

## במה 2 (`bama2/`), מגרוק (16.10)

אותו ממשק כמו `bama/`, עם מנוע צליל משודרג בהשראת `pendulum/`:
- **פילטר:** הבס עובר בפילטר ladder ב־AudioWorklet. `bama2/ladder.js` מבוסס על `pendulum/ladder.js`, עם דגימת־יתר ×2 אמיתית ופרמטרים a-rate. אם אין worklet, נשארים שני ה־biquad.
- **צליל:** DRIVE עדין עם ×4, דיליי פינג־פונג קלטת, וריוורב קצר/ארוך עם החזרות מוקדמות.
- **יציאה:** low-cut נגד DC, לימיטר וקטימה רכה ×2.
- **אמינות:** תיקון מתג השקט ו־watchdog.
- **FAT:** מתג, כבוי כברירת מחדל.

מטמון `bama2-vN`, שעון משותף עם `app:"bama"` כמו קודם.

## במה 3 (`bama3/`), מגרוק (16.10)

גרסה חדשה על בסיס `bama2/`, עם אותו מנוע צליל (ladder, דיליי קלטת, לימיטר, watchdog). `bama2/` לא השתנתה. בעקבות המשוב של רז (לא הבין את הרעיון, לא הצליח לבחור, רצה לסדר את החלקים ולשנות קצבים בעצמו):
- **סידור שיר:** פס קטעים (פתיחה, בנייה, דרופ, שבירה, סיום). כל קטע = קליף בס + קליף תופים + השתקות + אנרגיה + אורך בתיבות. הוספה, שכפול, מחיקה, גרירה בידית ⠿ וגם כפתורי "מוקדם יותר / מאוחר יותר". מצב **שיר** מתקדם לפי הסדר, מצב **לולאה** נשאר על הקטע הנוכחי.
- **עריכה:** מתג ▶ נגינה / ✎ עריכה. בעריכה, לחיצה על קליף פותחת גיליון: תופים = רשת 16 צעדים ל־5 כלים (כבוי → דולק → מודגש), בס = 16 צעדים עם בחירת תו בסולם, אוקטבה, שקט, גלישה והדגשה. בנגינה, לחיצה ארוכה על קליף פותחת את אותו עורך. שומעים את השינויים מיד. בטלפון לאורך מוצגים 8 צעדים בכל פעם (1–8 / 9–16).
- **בהירות:** הדרכה של 4 כרטיסים בכניסה הראשונה (☰ ← "איך זה עובד" פותח אותה שוב), תוויות בעברית עם שמות הפרמטרים באנגלית בנפרד, ושורה "מנגן עכשיו / הבא".
- **שמירה:** ☰ ← שמירה וטעינה של סידורים במכשיר (`localStorage`, `bama3-saves`). שם גם הסנכרון וההקלטה.

מטמון `bama3-vN`, שעון משותף עם `app:"bama"`.

## מטוטלת מגע (`pendulum-touch/`), מגרוק (16.10)

עותק של `pendulum/` (מ־97f25fe, עם תיקון מאגר הקולות). `pendulum/` לא השתנתה. רז אוהב את מטוטלת אבל לא רוצה להטות את המכשיר כדי לשנות את הצליל, אז כאן הכול נשלט במגע:
- **משטח אפקטים XY:** למעלה = חלום (DELAY · PHASER · REVERB, מה שעשתה ההטיה קדימה), הצידה = רעד (TREMOLO · VIBRATO · DETUNE, מה שעשתה ההטיה הצידה).
- **מחוונים:** פילטר (CUTOFF), תהודה (RESONANCE), עיוות (DRIVE), ישירות על המסך.
- **חיתוך (CUT):** כל עוד מחזיקים, הצליל נעלם. זה מחליף את הניעור.
- **נשאר במקום / קופץ חזרה (LATCH / SPRING):** במצב קפיץ, כשעוזבים את המשטח האפקטים חוזרים לאפס, והפילטר חוזר למקום שבו היה לפני הנגיעה.
- **הטיה:** רשות, כבויה כברירת מחדל (⋯ עוד). כשהיא פעילה, היא מזיזה את הנקודה במשטח.
- כל אצבע נתפסת לבד, כך שאפשר לנגן ביד אחת ולשלוט ביד השנייה. העדכון למנוע נעשה פעם אחת בפריים, והתנועה לא יוצרת צמתי שמע חדשים.

מפתחות משלה: `pendulum-touch-v1`, `pendulum-touch-sync`, IndexedDB `pendulum-touch-rec`. מטמון `ptouch-vN`, שעון משותף עם `app:"pendulum-touch"`.

## סופת חומצה (`acid-storm/`), מגרוק (16.10)

כלי חדש ונפרד, שנבנה מעותק של `acid/`. את `acid/` לא שיניתי. הכל ב־`index.html` אחד, וגם `sync.js` (עותק של `groove/sync.js`, `app:"storm"`). המטמון: `storm-vN`, והניקוי מסונן לפי הקידומת `storm-`. מפתחות: `storm-ring-v1`, `storm-slots-v1`, `storm-sync`, `storm-tour-v1`, ו־IndexedDB בשם `storm-rec`.
- **עריכה (מ-16.10, לפי בקשת רז):** חזרה בדיוק למודל של `acid/`: כפתורי מצב תו/הדגשה/גלישה, נגיעה וגרירה כמו שם, אותן הודעות. נוספו שלושה מצבים שעובדים באותה דרך, וכל נגיעה עוברת לערך הבא: סיכוי (`p`), רטצ׳ט (`r`), אורך (`g`). כל המחוות הוסרו: החזקה, החלקה, הקפצה, שתי אצבעות, סיבוב במרכז וזריקה. הזזה, אורך לולאה וטרנספוז נמצאים עכשיו בלוח "⋯ עוד", וגם התפתחות וצנטריפוגה, שתיהן כבויות כברירת מחדל. כשהצנטריפוגה דולקת היא עובדת רק בשולי הטבעת, מחוץ לנקודות. בדיקה צד-לצד מול `acid/`: `/workspace/storm/cmp.py`.
- **ליבה (`storm-core`):** דגימת־יתר אמיתית עם halfband פוליפאזי של 31 טפים, למעלה ולמטה. פי 4 כשיש לפחות 4 ליבות (`?os=2` מכריח פי 2). המקדמים מתעדכנים כל 16 דגימות. אופי חמישי: `diode` (בהשראת 303, עם highpass במשוב). ההדגשה היא קבל RC שנערם בהדגשות צמודות. הגלישה בזמן קבוע של 60ms (exponentialRamp).
- **שרשרת:** סחף אנלוגי (LFO איטי לכל אוסילטור ופיזור קטן לכל תו). בלולאת ההד יש רוויה ומסנן עם קצת תהודה. "נשימה" היא `E.duck`: בעיטה שקופה בכל רבע.
- **תזמון:** Worker שולח tick כל 25ms, וגם כל פריים. אחרי הפרעה קופצים קדימה בלי לאבד את הפעמה. `gstep` הוא מונה גלובלי, והצעד בטבעת הוא `gstep%S.len`.
- **ציור:** השכבה הקבועה נשמרת בקנבס נסתר. הגרדיאנטים במטמון. כשאין נגינה ואין מגע לא מציירים.
- **עוד:** עולמות מוכנים (8), התפתחות (כל שתי תיבות), קישור לתבנית (`#p=`, בערך 110 תווים), רשימת צעדים ל־T-8/Volca, מדריך מחוות ב־5 כרטיסים, ו־`window.__storm` לבדיקות.
- **שלב היציאה (מ-bama2/pendulum):** ריוורב עם החזרות מוקדמות, low-cut של 22Hz לפני הלימיטר, וקטימה רכה ×4. ברוויה של לולאת ההד דגימת־יתר ×2. שומר בודק כל שנייה: NaN ביציאה או קשר תקוע בונים את הצליל מחדש, וגם `onprocessorerror`. יש תיקון למתג השקט (wav שקט בלולאה כשאין `audioSession`).
- **מדידות (Node, `/workspace/storm/measure.js` בארגז):** ההתפרקות (aliasing) בסינוס של 5.3kHz עם דרייב: acid -39dBc, bama2 -36, storm ×4 -48 (דיודה -50). בדרך כלל CPU של storm ×4 שווה בערך ל-acid ×2. הדיודה מתחילה להשמיע את עצמה סביב res≈0.9.
- **לא נכנס:** טבעת פנימית או טבעת מראה, טבעת תופים.

## מכונת גרוב 2 (`groove2/`), מגרוק (16.10)

עותק של `groove/`. את `groove/` לא שיניתי. בעקבות המשוב של רז:
- **כל הצעדים נגישים:** כל צעדי העמוד תמיד גלויים, וכל צעד לפחות 44px, צעד 1 משמאל.
  - טלפון לאורך: תוף אחד בריבוע 4×4.
  - טלפון לרוחב: תוף אחד, 2 שורות של 8, עם לשוניות תופים (כפתור 1–8/9–16 הוסר).
  - אייפד לאורך: 2 שורות של 8 לכל תוף.
  - אייפד לרוחב: 16 בשורה.
- **אורך תבנית:** 8/12/16/24/32/48/64. כל 16 צעדים הם עמוד.
  - לשוניות העמודים גדולות, ובכל אחת פס זעיר שמראה איפה יש מכות ואיפה סמן הנגינה.
  - "⇥ עקוב" מעביר את העמוד יחד עם הנגינה.
  - "העתק עמוד לעמוד הבא" מאריך את התבנית אם צריך.
- **ניקוי והתחלה מחדש** (🧹 נקה / תבנית):
  - נקה תוף, נקה עמוד, נקה הכול (עם אישור).
  - תבנית חדשה ריקה (עם אישור).
  - החזרת צלילים לברירת המחדל.
  - איפוס מלא (עם אישור, סופי).
- **ביטול/חזרה:** ↶/↷ לכל שינוי בתבנית, עד 200 צעדים אחורה.
- **צליל, בהשראת bama2:**
  - לכל תוף: פילטר (lowpass), שליחה לדיליי ושליחה לריוורב, בלוח הצליל.
  - דיליי קלטת פינג־פונג: שמינית מנוקדת לפי הקצב, משוב מסונן ורווי ורעד קל.
  - ריוורב קצר וארוך עם החזרות מוקדמות.
  - דרייב ראשי ×4, רוויה ×4 בבעיטה ובטום.
  - מחיאה מארבע התפרצויות לא סדירות וזנב מסונן.
  - היי־האט ממתנדים מוגבלי־פס (PeriodicWave).
- **מדידות:**
  - aliasing של מתנדי ההיי־האט: −43dB גם ב־groove וגם ב־groove2. ב־Chrome גל ריבועי רגיל כבר מוגבל־פס. לשם השוואה, ריבוע נאיבי נותן −19dB.
  - תיבה מרונדרת, שיא/RMS: groove 0.634/0.315, groove2 0.624/0.312. במילוי: 0.626/0.283 מול 0.625/0.276. אין NaN.

מפתחות: `groove2-v1`, `groove2-slots-v1`, `groove2-sync`, IndexedDB `groove2-rec`. מטמון `groove2-vN`, שעון משותף עם `app:"groove"`.

## שיעורים 4 ו־5 בגרסת קלוד (`claude/`), מקלוד (19.10)

רז לא נגע בטי־8 אף פעם, אז יש שני שיעורים:
- **שיעור 4, היכרות** (`src/l4.html`): הדלקה, מפה של הלוח, לשמוע כל תוף ואת הבס, ארבע הדרכים של הלחצנים (לחיצה, החזקה, SHIFT, PATTERN), תפריט ויציאה עם C (EXIT). לא שומרים כלום בכוונה.
- **שיעור 5, ג׳אם** (`src/l5.html`): אותו ג׳אם של שיעור 1 על הטי־8, עם הדגשות, שאיבה מהקיק ודיליי.
- **תרשים במקום צילום:** `src/t8map.py` מצייר את הלוח לפי סדר האזורים במדריך (לא צילום), גם כתמונות סטטיות לכרטיסים (`img/l4-*.svg`) וגם `t8-data.js` (תרשים אינטראקטיבי, הסבר לכל פקד, ומילון שמות). `build.py` מריץ אותו.
- **`t8.js`** (רק בשיעורים 4 ו־5): סיור בלוח (נוגעים בפקד או בשם שלו ברשימה), משחק ״מצא את הכפתור״, וכל `<kbd>` עם שם של פקד הופך ללחיץ ומראה איפה הוא על הלוח. הרעיון של התרשים הלחיץ לקוח מ־`t8-guide/` שלך, תודה. את `t8-guide/` לא שיניתי.
- לא מופיע במדריך הרשמי ומסומן בכרטיסים: האם הצעד מתקדם לבד במצב מקלדת (5: 4.2), ברירות המחדל של SC.Sr ו־SC.dG (5: 5.1), ומה עושה לחיצה שנייה על DECAY של הקיק (4: 3.2).
- `app.js`: למעקב הנגיעות (`.taps`) יש `data-end` להודעת הסיום.

## העמוד הראשי (`index.html`), מקלוד (19.10)

רז ביקש עמוד אחד שבו ימצא הכל, עם מי בנה כל דבר, ושיתעדכן לבד גם כששמור במסך הבית. בניתי מחדש את `index.html` בשורש, באישור שלו:
- שיעורי הוולקות: כרטיס לכל שיעור, עם כפתור לגרסת קלוד ולגרסת גרוק. העוגן `#grok` נשאר.
- הטי־8: שיעורים 4 ו־5 של קלוד, והמדריך שלך (`t8-guide/`), שלא היה מקושר מהעמוד הראשי.
- כל הכלים, לפי נושא, עם ״החדשה״ על `groove2/` ו־`bama3/`.
- סינון (הכל, שיעורים, כלים, של קלוד, של גרוק), כפתור רענון (במסך הבית של האייפון אין משיכה לרענון), ו־`manifest.webmanifest` בשורש.
- ב־README יש עכשיו כלל: כל דבר חדש מקבל כרטיס בעמוד הראשי באותו commit. אם יש לך תיקון לתיאור של כלי שלך, תקן ישירות בכרטיס.


## 2026-10-21 · קלוד: כפתור ״💬 שאל״ בכל כרטיס
- בשיעורים של קלוד (1 עד 7), בראש כל כרטיס: פותח את Claude, ChatGPT או Grok עם כל הטקסט של הכרטיס וההערה של רז. הקוד ב־`claude/extras.js` בלבד.
- ב־`claude/app.css` נוספו רק כללים חדשים: `.ask-*`, הסתרה נכונה של `[hidden]` בתיבות ההערה, ומספור נכון ל־`ol.steps[start]`. אצל קודקס לא השתנה דבר.
