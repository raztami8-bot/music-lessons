# Edit content.html / shell.html, then run: python3 t8-guide/src/build.py  (writes t8-guide/index.html)
import re, json, html
from pathlib import Path
import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
C = Path('content.html').read_text()

def chip(piece):
    return '<span class="k">%s</span>' % html.escape(piece.strip(), quote=False)
def combo(m):
    inner = m.group(1)
    parts = inner.split(' + ')
    if len(parts) == 1:
        return '<bdi class="kc" dir="ltr">%s</bdi>' % chip(parts[0])
    return '<bdi class="kc" dir="ltr">%s</bdi>' % '<span class="plus">+</span>'.join(chip(p) for p in parts)
C = re.sub(r'\{\{(.+?)\}\}', combo, C)

def grid(m):
    a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
    on = {int(x) for x in a.get('on','').split(',') if x}
    sub = {}
    for kv in a.get('sub','').split(','):
        if ':' in kv:
            k,v = kv.split(':'); sub[int(k)] = int(v)
    cells = []
    for i in range(1,17):
        cls = 'on' if i in on else ''
        if i in (1,5,9,13): cls += ' beat'
        dots = ''
        if i in sub: dots = '<span class="sub">' + '<i></i>'*sub[i] + '</span>'
        cells.append('<span class="c %s"><em>%d</em>%s</span>' % (cls.strip(), i, dots))
    return '<div class="grid g-%s" dir="ltr"><span class="gl">%s</span><div class="cells">%s</div></div>' % (a.get('c','pink'), a.get('label',''), ''.join(cells))
C = re.sub(r'<grid([^>]*)></grid>', grid, C)

# ---------- panel ----------
P = []  # (id, svg)
info = {}
def add(id, key, desc, svg):
    info[id] = {'k': key, 'd': desc}
    P.append('<g class="ctl" data-id="%s" tabindex="0" role="button" aria-label="%s">%s</g>' % (id, html.escape(key), svg))
def knob(cx, cy, r, ring=None, label=None, ly=None):
    s = ''
    if ring: s += '<circle cx="%d" cy="%d" r="%d" class="ring" style="stroke:%s"/>' % (cx, cy, r+5, ring)
    s += '<circle cx="%d" cy="%d" r="%d" class="knob"/><line x1="%d" y1="%d" x2="%d" y2="%d" class="tick"/>' % (cx, cy, r, cx, cy-r+4, cx, cy-r*0.35)
    if label: s += '<text x="%d" y="%d" class="lbl">%s</text>' % (cx, ly or cy+r+20, label)
    s += '<rect x="%d" y="%d" width="%d" height="%d" class="hit"/>' % (cx-45, cy-r-8, 90, 2*r+34)
    return s
def btn(x, y, w, h, lines, cls='btn', label_below=None):
    s = '<rect x="%d" y="%d" width="%d" height="%d" rx="7" class="%s"/>' % (x, y, w, h, cls)
    n = len(lines)
    for i, t in enumerate(lines):
        ty = y + h/2 + 5 + (i - (n-1)/2) * 14
        s += '<text x="%d" y="%.0f" class="bt">%s</text>' % (x + w/2, ty, html.escape(t))
    if label_below: s += '<text x="%d" y="%d" class="lbl sm">%s</text>' % (x + w/2, y + h + 16, label_below)
    s += '<rect x="%d" y="%d" width="%d" height="%d" class="hit"/>' % (x-6, y-6, w+12, h+12 + (16 if label_below else 0))
    return s

# jacks row
add('charge','CHARGE','נורית טעינה. כתום = נטען, ירוק = מלא. אדום כשלא מחובר USB = סוללה חלשה (המכשיר ייכבה תוך 30 דקות). ירוק־כתום מהבהב = תקלה.',
    '<circle cx="440" cy="52" r="6" class="led-g"/><text x="490" y="57" class="lbl">CHARGE</text><rect x="420" y="30" width="110" height="44" class="hit"/>')
def jack(cx, label): return '<circle cx="%d" cy="52" r="17" class="jack"/><circle cx="%d" cy="52" r="8" class="jack-in"/><rect x="%d" y="25" width="56" height="60" class="hit"/>' % (cx, cx, cx-28)
add('syncin','SYNC IN','כניסת סנכרון (מיני־ג׳ק מונו). כשמחובר כאן משהו, ה־T-8 תמיד עוקב אחרי הפולסים שנכנסים, בלי קשר להגדרת MIDI Clock Sync.', jack(575,''))
add('syncout','SYNC OUT','יציאת סנכרון (מיני־ג׳ק מונו). מכאן ל־SYNC IN של Volca. לא לחבר לכאן ציוד אודיו.', jack(640,''))
add('mixin','MIX IN','כניסת אודיו (מיני־ג׳ק סטריאו). מה שנכנס כאן יוצא מ־MIX OUT. מקום טוב ל־Volca Bass.', jack(725,''))
add('mixout','MIX OUT','יציאת אודיו (מיני־ג׳ק סטריאו). גם לאוזניות.', jack(790,''))
P.append('<text x="607" y="96" class="lbl sm">IN — SYNC — OUT</text><text x="757" y="96" class="lbl sm">IN — MIX — OUT</text>')
add('volume','[VOLUME]','עוצמת היציאה מ־MIX OUT (ובברירת מחדל גם ל־USB; ראה USB Direct Out).', knob(905, 50, 15, None, 'VOLUME', 96))
P.append('<text x="40" y="62" class="brand">T-8</text><text x="40" y="84" class="lbl sm" style="text-anchor:start">AIRA COMPACT</text>')

# section frames
for x,w in [(30,195),(235,100),(345,100),(455,100),(565,100),(675,200),(885,90)]:
    P.append('<rect x="%d" y="112" width="%d" height="310" rx="10" class="frame"/>' % (x, w))
# common
add('display','Display','תצוגת LED של 4 תווים. מראה קצב, ערכים וקודים כמו P.100, n.C2, b.ACC.',
    '<rect x="50" y="128" width="155" height="56" rx="6" class="disp"/><text x="128" y="168" class="seg">130.0</text><rect x="45" y="122" width="165" height="68" class="hit"/>')
add('tempo','[TEMPO/VALUE]','מסובבים = קצב (או ערך, כשמחזיקים משהו או בתפריט). עם [SHIFT] = עשיריות של קצב. עם [PATTERN] = הסתברות ראשית.', knob(128, 238, 30, None, 'TEMPO/VALUE'))
add('shift','[SHIFT]','מחזיקים יחד עם פקד אחר. הפונקציות מודפסות מתחת לכפתורי הצעד. [SHIFT] + כפתור כלי = השתקה.', btn(48, 300, 70, 34, ['SHIFT']))
add('pattern','[PATTERN]','מצב בחירת פטרן: כפתורי הצעד = פטרנים 1–16. מחזיקים ולוחצים צעד 1–4 = בנק. [SHIFT] + [PATTERN] = לולאת צעדים (STEP LOOP).', btn(138, 300, 70, 34, ['PATTERN'], label_below='STEP LOOP'))
add('play','[▶] (PLAY)','מנגן את הפטרן. לחיצה נוספת עוצרת. מחזיקים בהדלקה = מצב גיבוי (מחשב).', btn(48, 365, 70, 36, ['▶'], 'btn play'))
add('rec','[●] (REC)','מצב הקלטה. אחרי [▶], לחיצה על כפתור כלי מקליטה בזמן אמת. עם [KYBD] = עריכת בס במקלדת.', btn(138, 365, 70, 36, ['●'], 'btn rec'))
# drums
def drumcol(x0, ring, nm, idp, name):
    cx = x0 + 50
    add(idp+'lvl','[LEVEL]','עוצמת ה־%s.' % name, knob(cx, 150, 17, ring, 'LEVEL'))
    add(idp+'tune','[TUNE]','גובה הצליל. אחרי לחיצה על [DECAY], הכפתור הזה שולט באורך הצליל.', knob(cx, 225, 13, None, 'TUNE'))
    add(idp+'dec','[DECAY]','כפתור לחיצה: מעביר את [TUNE] לשלוט באורך (decay) של ה־%s.' % name,
        '<circle cx="%d" cy="298" r="24" class="btn round"/><text x="%d" y="303" class="bt">DECAY</text><rect x="%d" y="268" width="80" height="60" class="hit"/>' % (cx, cx, cx-40))
    add(idp+'btn','[%s]' % nm[0]+' '+nm[1] if False else '[%s]' % ' '.join(nm),'כפתור כלי: בוחר את ה־%s. אחר כך הצעדים מראים ועורכים אותו. החזקה + צעד = סאב־סטפ. החזקה + [TEMPO/VALUE] = הזזת התבנית.' % name, btn(x0+12, 365, 76, 38, list(nm)))
drumcol(235, '#ff4f5e', ('BASS','DRUM'), 'bd', 'תוף הבס')
drumcol(345, '#ff9a3c', ('SNARE','DRUM'), 'sd', 'סנר')
add('tclvl','[LEVEL]','עוצמה משותפת לטום ולקלאפ.', knob(505, 150, 17, '#ffd84f', 'LEVEL'))
add('tctune','[TUNE]','גובה הצליל של הכלי הנבחר: [HAND CLAP] או [TOM].', knob(505, 225, 13, None, 'TUNE'))
add('clap','[HAND CLAP]','בוחר קלאפ. בתפריט (CLAP) אפשר להחליף לטום רעש או טום גבוה.', btn(467, 282, 76, 38, ['HAND','CLAP']))
add('tom','[TOM]','בוחר טום. בתפריט (tON) שני צלילי טום.', btn(467, 365, 76, 38, ['TOM']))
add('hhlvl','[LEVEL]','עוצמה משותפת להיי־האט סגור ופתוח.', knob(615, 150, 17, '#f1ebff', 'LEVEL'))
add('hhdec','[DECAY]','אורך צליל ההיי־האט.', knob(615, 225, 13, None, 'DECAY'))
add('ch','[CLOSED HIHAT]','בוחר היי־האט סגור.', btn(577, 282, 76, 38, ['CLOSED','HIHAT']))
add('oh','[OPEN HIHAT]','בוחר היי־האט פתוח.', btn(577, 365, 76, 38, ['OPEN','HIHAT']))
# bass
add('blvl','[LEVEL]','עוצמת הבס.', knob(725, 150, 17, '#b8b0cc', 'LEVEL'))
add('bpitch','[PITCH]','גובה הבס.', knob(725, 225, 15, None, 'PITCH'))
add('bdec','[DECAY]','אורך כל תו בבס.', knob(725, 300, 15, None, 'DECAY'))
add('cutoff','[CUTOFF]','כמה הצליל בהיר. הכפתור הכי חשוב באסיד.', knob(825, 150, 15, None, 'CUTOFF'))
add('reso','[RESO]','הדגשה סביב ה־CUTOFF. גבוה = צווחה.', knob(825, 225, 15, None, 'RESO'))
add('envmod','[ENV MOD]','כמה ה־CUTOFF זז עם כל תו.', knob(825, 300, 15, None, 'ENV MOD'))
add('bass','[BASS]','בוחר את הבס. הצעדים מראים תווים (טיי = דולק חלש). לחיצה על צעד ריק = C2.', btn(690, 370, 70, 34, ['BASS']))
add('kybd','[KYBD]','כפתורי הצעד הופכים למקלדת. עם [●] (REC) = כתיבת תווים. אם נבחר תוף, עובר לבס.', btn(790, 370, 70, 34, ['KYBD'], 'btn kb'))
P.append('<line x1="760" y1="387" x2="790" y2="387" class="conn"/>')
# fx
add('delay','[DELAY]','עוצמת הדיליי וה־feedback. עם [SHIFT] = זמן הדיליי.', knob(930, 150, 15, None, 'DELAY'))
add('reverb','[REVERB]','עוצמת הריוורב. עם [SHIFT] = זמן הריוורב.', knob(930, 225, 15, None, 'REVERB'))
add('accent','[ACCENT]','כשתוף נבחר: כתיבת אקסנט לתופים. כשהבס נבחר: b.ACC ואז b.SLd. החזקה + [TEMPO/VALUE] = עוצמת אקסנט.', btn(895, 370, 70, 34, ['ACCENT']))
# steps
notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C','OCT-','OCT+','SLIDE']
funcs = ['EXIT','ENTER','SHUFFLE','LAST','1-16','17-32','TRG','PTN','RHYTHM','BASS','ALL','INST','DELAY','REVERB','MENU','WRITE']
full = ['C (EXIT)','C# (ENTER)','D (SHUFFLE)','D# (LAST)','E (STEP 1-16)','F (STEP 17-32)','F# (FILL TRG)','G (FILL PTN)','G# (RANDOM RHYTHM)','A (RANDOM BASS)','A# (PTN CLEAR ALL)','B (PTN CLEAR INST)','C (DELAY)','OCT- (REVERB)','OCT+ (MENU)','SLIDE (WRITE)']
fd = ['יציאה מתפריט. בהדלקה = מצב סוללה בלבד (לאייפון Lightning).','אישור בתפריט ובשמירה.','שאפל לפטרן.','אורך הפטרן (הצעד האחרון).','עמוד צעדים 1–16.','עמוד צעדים 17–32 (אם האורך 16 ומטה, הופך ל־32 ומעתיק).','מפעיל פיל בסוף הפטרן.','בוחר פטרן פיל (לכל בנק).','תופים אקראיים.','בס אקראי. [PATTERN] + הכפתור = אוברדרייב.','מוחק את כל הפטרן. [PATTERN] + הכפתור = צורת גל בס.','מוחק את הכלי הנבחר. [PATTERN] + הכפתור = סייד־צ׳יין.','שליחה לדיליי לכל כלי (d.Snd).','שליחה לריוורב לכל כלי (r.Snd). [PATTERN] + הכפתור = החזרת תופים לשמור.','התפריט. [PATTERN] + הכפתור = החזרת בס לשמור.','שמירה. [PATTERN] + הכפתור = החזרת הפטרן לשמור. בהדלקה = איפוס מפעל.']
P.append('<rect x="20" y="432" width="960" height="118" rx="10" class="frame"/>')
for i in range(16):
    x = 34 + i*58.5
    lab = 'צעד %d. במקלדת: %s. עם [SHIFT]: %s' % (i+1, notes[i], fd[i])
    s = '<rect x="%.1f" y="446" width="44" height="46" rx="5" class="step"/><rect x="%.1f" y="452" width="30" height="13" rx="2" class="stepled"/><text x="%.1f" y="485" class="st">%s</text><text x="%.1f" y="512" class="lbl xs">%s</text><text x="%.1f" y="547" class="num">%d</text><rect x="%.1f" y="440" width="56" height="108" class="hit"/>' % (x, x+7, x+22, html.escape(notes[i]), x+22, funcs[i], x+22, i+1, x-6)
    info['s%d'%(i+1)] = {'k':'[%s]' % full[i], 'd': lab}
    P.append('<g class="ctl" data-id="s%d" tabindex="0" role="button" aria-label="step %d">%s</g>' % (i+1, i+1, s))
for x1,x2,t in [(268,373,'STEP'),(385,490,'FILL'),(502,607,'RANDOM'),(619,724,'PTN CLEAR')]:
    P.append('<line x1="%d" y1="519" x2="%d" y2="519" class="conn"/><text x="%d" y="532" class="lbl xs grpl">%s</text>' % (x1, x2, (x1+x2)//2, t))
svg = '<svg id="t8svg" viewBox="0 0 1000 560" dir="ltr" xmlns="http://www.w3.org/2000/svg" aria-label="T-8 panel diagram"><rect x="4" y="4" width="992" height="552" rx="28" class="body"/>%s</svg>' % ''.join(P)
C = C.replace('PANEL_SVG', svg)

toc = re.findall(r'<section id="(\w+)" class="card[^"]*">\s*<h2>(?:<span class="sn">(\d+)</span>)?\s*([^<]+)</h2>', C)
short = {'start':'התחלה מהירה','panel':'הפאנל','drums':'תופים','bass':'בס 303','patterns':'פטרנים','tempo':'קצב ושאפל','fx':'אפקטים','sync':'סנכרון וולקה','usb':'USB ואייפד','recipes':'מתכונים','cheat':'קיצורים','trouble':'בעיות','src':'מקורות'}
nav = ''.join('<a href="#%s" data-t="%s">%s</a>' % (i, i, short.get(i, t)) for i, n, t in toc)
T = Path('shell.html').read_text()
out = T.replace('%%NAV%%', nav).replace('%%CONTENT%%', C).replace('%%INFO%%', json.dumps(info, ensure_ascii=False))
Path('../index.html').write_text(out)
print(len(out), len(info), [t[0] for t in toc])
