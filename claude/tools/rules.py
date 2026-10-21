"""Check the T-8 pages against the house rules (claude/HANDOFF.md, "החלטות"). Prints what breaks a rule.
Usage: python3 claude/tools/rules.py

1. Every turn of TEMPO/VALUE says what to stop on: a display (look:), or "listen" (ear), or a note (say:).
   In lesson text: the same line has "עד", a drawn display, a value, or "הקשב".
2. Whatever opens a menu or a settings screen ends with an exit (or ENTER, for WRITE).
3. A trick that works on any step or instrument uses an @ token and has a line in tricks.ANY (build.py checks this too).
"""
import re, sys, pathlib, html
HERE = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE / "src"))
import tricks

OPENERS = {  # (held, tapped) -> how this screen is left
    ("SHIFT", "15"): "menu", ("SHIFT", "13"): "one", ("SHIFT", "14"): "one", ("SHIFT", "3"): "one", ("SHIFT", "4"): "one",
    ("SHIFT", "8"): "menu", ("PATTERN", "10"): "one", ("PATTERN", "11"): "one", ("PATTERN", "12"): "one",
}
problems = []


def check_seq(where, seq):
    acts = [a.strip() for a in seq.split(",")]
    for i, a in enumerate(acts):
        if a == "turn:TEMPO/VALUE":
            nxt = acts[i + 1] if i + 1 < len(acts) else ""
            if not re.match(r"(look:|ear|say:)", nxt):
                problems.append((where, "סיבוב בלי יעד", seq))
    held, opened = None, []
    for i, a in enumerate(acts):
        v, _, k = a.partition(":")
        if v == "hold":
            held = k
        elif v == "rel":
            held = None
        elif v == "tap" and (held, k) in OPENERS:
            opened.append(i)
    if opened:
        tail = acts[opened[-1] + 1:]
        ok = ("tap:1" in tail) or ("tap:2" in tail and "tap:16" in acts) or ("tap:PATTERN" in tail)
        if not ok:
            problems.append((where, "תפריט בלי יציאה", seq))


# the map page
for gid, gname, _, items in tricks.GOALS:
    for tid, title, line, seq, *_ in items:
        if seq:
            check_seq(f"מה אפשר לעשות · {title}", seq)
            if "@" in seq and tid not in tricks.ANY:
                problems.append((f"מה אפשר לעשות · {title}", "דוגמה בלי ״עובד על״", seq))

# the lessons
for n in (4, 5, 6, 7):
    src = (HERE / "src" / f"l{n}.html").read_text(encoding="utf8")
    for m in re.finditer(r'<article class="card[^"]*"[^>]*>(.*?)</article>', src, re.S):
        card = m.group(1)
        num = re.search(r'class="num">([^<]+)', card)
        where = f"שיעור {n - 3} · {num.group(1) if num else '?'}"
        for seq in re.findall(r"\[\[combo-?:[^|\]]*\|([^|\]]*)", card):
            check_seq(where, seq)
        body = re.sub(r'<div class="learn">.*?</div>', "", card, flags=re.S)
        lis = re.findall(r"<li>(.*?)</li>", body, re.S)
        for i, li in enumerate(lis):
            text = html.unescape(re.sub(r"<[^>]+>", "", li))
            nxt = html.unescape(re.sub(r"<[^>]+>", "", lis[i + 1])) if i + 1 < len(lis) else ""
            if "TEMPO/VALUE" in li and re.search(r"סובב|\[\[turn:TEMPO", li):
                target = r"עד|\[\[seg|\bP\.\d|\bv\.\d|הקשב|קליק|כמה|בין|מצא|לאט|למעלה|למטה|לערך| או "
                if not re.search(target, text) and not re.search(r"^\s*(עצור על|סובב .*עד)", nxt):
                    problems.append((where, "סיבוב בלי יעד", re.sub(r"\s+", " ", text).strip()[:120]))
        if num and re.search(r"\(MENU\)|\[\[tap:15\]\] \(MENU\)|בתפריט,|d\.Snd|r\.Snd", body):
            if not re.search(r"EXIT|\[\[tap:1\]\]|לחצן 1|SHIFT\]\] ו־\[\[tap:1", body):
                problems.append((where, "תפריט בלי יציאה", ""))

for p in problems:
    print(" · ".join(x for x in p if x))
print(f"done, {len(problems)} problems")
