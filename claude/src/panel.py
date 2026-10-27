"""Shared drawing for the Behringer panels (Crave, Edge). Same data shape as t8map.py and vbmap.py
(svg, info, names, areas, alias), so t8.js, kit.js and map.js work with them unchanged.

A panel module (cravemap.py, edgemap.py) makes a Panel, adds controls left to right as on the photo,
fills INFO / NAMES / AREAS / extra aliases, and lists FIGS (one figure per lesson card) and PLACE (card -> figure).
build() writes the figures to img/<name>.svg and the tour data to <key>-data.js."""
import html, json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BADGE = "#f2c94c"
INK = "#1a1a1a"


def _lines(label):
    return label.split("\n")


def flat(label):
    """The label as one line, the way it is written in the lessons: "PLAY/\nSTOP" -> "PLAY/STOP", "OSC\nCV" -> "OSC CV"."""
    out = ""
    for t in _lines(label):
        out += t if (not out or out.endswith("/")) else " " + t
    return out


class Panel:
    def __init__(self, key, var, name, W, H, frame, edge, title):
        self.slug, self.var, self.name, self.W, self.H = key, var, name, W, H
        self.frame, self.edge, self.title = frame, edge, title
        self.C = {}        # id -> (kind, x, y, w, h, label, extra)
        self.deco = []     # svg drawn under the controls: section bars, logos, step numbers
        self.INFO, self.NAMES, self.AREAS, self.POOL = {}, {}, [], []
        self.EXTRA = {}    # alias -> [ids], added after the panel labels
        self.FIGS, self.PLACE = {}, {}
        self.step_word = "לחצן"

    # ---------- controls ----------
    def knob(self, id, x, y, r, label, bip=False, show=True):
        self.C[id] = ("knob", x, y, r, r, label, {"bip": bip, "show": show})

    def sw(self, id, x, y, label, pos):
        """pos: {"l": .., "r": ..} for a 2-way switch, {"t": .., "r": .., "b": ..} for a 3-way one"""
        self.C[id] = ("sw", x, y, 10, 10, label, {"pos": pos})

    def btn(self, id, x, y, w, h, label, where="under", tone="#3b3b3b"):
        self.C[id] = ("btn", x, y, w, h, label, {"where": where, "tone": tone})

    def key(self, id, x, y, w, h, label, black=False, num=""):
        self.C[id] = ("key", x, y, w, h, label, {"black": black, "num": num})

    def jack(self, id, x, y, label, out=False):
        self.C[id] = ("jack", x, y, 11, 11, label, {"out": out})

    def din(self, id, x, y, label):
        self.C[id] = ("din", x, y, 23, 23, label, None)

    def led(self, id, x, y, label, color="#ffb020"):
        self.C[id] = ("led", x, y, 7, 7, label, {"color": color})

    def leds(self, id, x, y, n, step, label):
        self.C[id] = ("leds", x, y, n, step, label, None)

    # ---------- decoration ----------
    def bar(self, x1, x2, y, label):
        self.deco.append(f'<rect x="{x1}" y="{y}" width="{x2 - x1}" height="18" fill="#2e2e2e"/>'
                         f'<text x="{x1 + 8}" y="{y + 13.5}" class="hd">{html.escape(label)}</text>')

    def text(self, x, y, s, cls="l", style=""):
        st = f' style="{style}"' if style else ""
        self.deco.append(f'<text x="{x}" y="{y}" class="{cls}"{st}>{html.escape(s)}</text>')

    def raw(self, s):
        self.deco.append(s)

    # ---------- geometry ----------
    def center(self, id):
        k, x, y, w, h, _, _ = self.C[id]
        if k in ("knob", "jack", "din", "led", "sw"):
            return x, y, max(w, 12)
        if k == "leds":
            return x + (w - 1) * h / 2, y, 22
        return x + w / 2, y + h / 2, max(w, h) / 2

    def hitbox(self, id):
        k, x, y, w, h, label, extra = self.C[id]
        if k == "knob":
            r = max(w, 18)
            top = 22 if extra["show"] else 6
            return x - r - 8, y - r - top, 2 * r + 16, 2 * r + top + 8
        if k == "sw":
            return x - 30, y - 30, 60, 58
        if k == "jack":
            return x - 24, y - 36, 48, 50
        if k in ("din", "led"):
            r = max(w, 14)
            return x - r - 10, y - r - 24, 2 * r + 20, 2 * r + 32
        if k == "leds":
            return x - 10, y - 26, (w - 1) * h + 20, 46
        if k == "key":
            return x - 2, y - 2, w + 4, h + 4
        if k == "btn":
            n = len(_lines(label))
            return (x - 4, y - 4, w + 8, h + 10 + 12 * n) if extra["where"] == "under" else (x - 4, y - 8 - 12 * n, w + 8, h + 12 + 12 * n)
        return x - 6, y - 6, w + 12, h + 12

    # ---------- drawing ----------
    def draw(self, id, on):
        k, x, y, w, h, label, extra = self.C[id]
        s = f'<g opacity="{"1" if on else "0.22"}">'
        if k == "knob":
            r = w
            for t in range(11):  # ticks from 7 o'clock to 5 o'clock
                a = math.radians(-150 + t * 30)
                x1, y1 = x + (r + 3) * math.sin(a), y - (r + 3) * math.cos(a)
                x2, y2 = x + (r + 7) * math.sin(a), y - (r + 7) * math.cos(a)
                s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#bfbfbf" stroke-width="1.6"/>'
            s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="#262626" stroke="#5a5a5a" stroke-width="2"/>'
            s += f'<line x1="{x}" y1="{y - r + 3}" x2="{x}" y2="{y - r * 0.35:.0f}" stroke="#f4f4f4" stroke-width="3" stroke-linecap="round"/>'
            if extra["bip"]:
                s += f'<circle cx="{x}" cy="{y - r - 11}" r="2.5" fill="#f2c94c"/>'
            if extra["show"]:
                ls = _lines(label)
                y0 = y - r - 12 - (len(ls) - 1) * 12
                for i, t in enumerate(ls):
                    s += f'<text x="{x}" y="{y0 + i * 12}" class="l">{html.escape(t)}</text>'
        elif k == "sw":
            pos = extra["pos"]
            s += f'<circle cx="{x}" cy="{y}" r="9" fill="#9a9a9a" stroke="#dcdcdc" stroke-width="2"/><circle cx="{x}" cy="{y}" r="3.5" fill="#3a3a3a"/>'
            top = y - 30 if "t" in pos else y - 18
            s += f'<text x="{x}" y="{top}" class="l">{html.escape(label)}</text>'
            if "l" in pos:
                s += f'<text x="{x - 15}" y="{y + 4}" class="p" style="text-anchor:end">{html.escape(pos["l"])}</text>'
            if "r" in pos:
                s += f'<text x="{x + 15}" y="{y + 4}" class="p" style="text-anchor:start">{html.escape(pos["r"])}</text>'
            if "t" in pos:
                s += f'<text x="{x}" y="{y - 15}" class="p">{html.escape(pos["t"])}</text>'
            if "b" in pos:
                s += f'<text x="{x}" y="{y + 22}" class="p">{html.escape(pos["b"])}</text>'
        elif k == "btn":
            lit = ' stroke="#ff5040"' if label == "PLAY/STOP" else ' stroke="#6a6a6a"'
            s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{extra["tone"]}"{lit} stroke-width="1.5"/>'
            ls = _lines(label)
            ty = y + h + 13 if extra["where"] == "under" else y - 7 - (len(ls) - 1) * 12
            for i, t in enumerate(ls):
                s += f'<text x="{x + w / 2}" y="{ty + i * 12}" class="l s">{html.escape(t)}</text>'
        elif k == "key":
            black = extra["black"]
            s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{"#262626" if black else "#ececec"}" stroke="{"#6a6a6a" if black else "#9a9a9a"}" stroke-width="1.5"/>'
            s += f'<text x="{x + w / 2}" y="{y + 15}" class="p" style="fill:{"#bdbdbd" if black else "#555"}">{html.escape(label)}</text>'
            if extra["num"]:
                s += f'<text x="{x + w / 2}" y="{y + h - 10}" class="b">{extra["num"]}</text>'
        elif k == "jack":
            out = extra["out"]
            ls = _lines(label)
            bw, lh = 46, 10
            by = y - 16 - len(ls) * lh
            s += (f'<rect x="{x - bw / 2}" y="{by}" width="{bw}" height="{len(ls) * lh + 3}" rx="2" '
                  f'fill="{INK if out else "none"}" stroke="{INK}" stroke-width="1.2"/>')
            for i, t in enumerate(ls):
                s += f'<text x="{x}" y="{by + 9 + i * lh}" class="j" style="fill:{"#ffffff" if out else INK}">{html.escape(t)}</text>'
            s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#2a2a2a" stroke="#0d0d0d" stroke-width="2"/><circle cx="{x}" cy="{y}" r="5" fill="#050505"/>'
        elif k == "din":
            s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="#202020" stroke="#0d0d0d" stroke-width="2"/>'
            for dx, dy in ((-11, 2), (-8, -7), (0, -11), (8, -7), (11, 2)):
                s += f'<circle cx="{x + dx}" cy="{y + dy}" r="2" fill="#777"/>'
            s += f'<text x="{x}" y="{y - w - 8}" class="j" style="fill:{INK}">{html.escape(label)}</text>'
        elif k == "led":
            s += f'<circle cx="{x}" cy="{y}" r="{w}" fill="{extra["color"]}" stroke="#000" stroke-width="1"/>'
            if label:
                s += f'<text x="{x}" y="{y - w - 7}" class="l s">{html.escape(label)}</text>'
        elif k == "leds":
            n, step = w, h
            s += f'<text x="{x + (n - 1) * step / 2}" y="{y - 14}" class="l s">{html.escape(label)}</text>'
            for i in range(n):
                cx = x + i * step
                s += f'<circle cx="{cx}" cy="{y}" r="5.5" fill="#3a3a3a" stroke="#000"/>'
                s += f'<text x="{cx}" y="{y + 18}" class="p">{i + 1}</text>'
        return s + "</g>"

    def style(self, scope):
        rules = ['text{font-family:Assistant,Arial,sans-serif;text-anchor:middle;pointer-events:none}',
                 '.l{font-size:12px;font-weight:700;fill:#ececec}', '.s{font-size:11px}',
                 '.p{font-size:9.5px;font-weight:700;fill:#bdbdbd}', '.b{font-size:13px;font-weight:800;fill:#1d1d1d}',
                 '.j{font-size:8.6px;font-weight:800;letter-spacing:-.1px}',
                 '.hd{font-size:12px;font-weight:800;fill:#f0f0f0;text-anchor:start;letter-spacing:.5px}',
                 '.k{font-size:17px;font-weight:800;fill:#1d2433}']
        return "<style>" + "".join(f".{scope} {r}" for r in rules) + "</style>"

    def body(self, scope):
        W, H = self.W, self.H
        s = [self.style(scope),
             f'<rect x="2" y="2" width="{W - 4}" height="{H - 4}" rx="18" fill="{self.frame}" stroke="{self.edge}" stroke-width="3"/>']
        s += self.deco
        return s

    def svg(self, name, on=(), marks=()):
        on = set(on) | set(marks)
        if not on:
            on = set(self.C)
        scope = f"{self.slug}f"
        s = [f'<svg xmlns="http://www.w3.org/2000/svg" class="{scope}" viewBox="0 0 {self.W} {self.H}" width="{self.W}" height="{self.H}" direction="ltr">']
        s += self.body(scope)
        for id in self.C:
            s.append(self.draw(id, id in on))
        for n, id in enumerate(marks, 1):
            cx, cy, r = self.center(id)
            bx, by = cx + r * 0.75 + 7, cy - r * 0.75 - 7
            k, _x, _y, _w, _h, label, extra = self.C[id]
            if k == "sw":  # beside the switch name, so the position words stay readable
                top = cy - 30 if "t" in extra["pos"] else cy - 18
                bx, by = cx - len(label) * 3.7 - 15, top - 4
            bx = min(bx, self.W - 16)
            by = max(by, 16)
            s.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="13" fill="{BADGE}" stroke="#1d2433" stroke-width="2"/>'
                     f'<text x="{bx:.0f}" y="{by + 6:.0f}" class="k">{n}</text>')
        s.append("</svg>")
        (ROOT / "img" / f"{name}.svg").write_text("\n".join(s), encoding="utf8")

    def interactive(self):
        scope = f"{self.slug}i"
        s = [f'<svg class="{scope}" viewBox="0 0 {self.W} {self.H}" direction="ltr" role="img" aria-label="תרשים הלוח של {self.name}">']
        s += self.body(scope)
        for id in self.C:
            hx, hy, hw, hh = self.hitbox(id)
            g = self.draw(id, True).replace('<g opacity="1">', "", 1)[:-4]
            s.append(f'<g class="ctl" data-id="{id}"><rect class="hl" x="{hx:.0f}" y="{hy:.0f}" width="{hw:.0f}" height="{hh:.0f}" rx="10"/>'
                     f'{g}<rect class="hit" x="{hx:.0f}" y="{hy:.0f}" width="{hw:.0f}" height="{hh:.0f}"/></g>')
        s.append("</svg>")
        return "".join(s)

    # ---------- data ----------
    def alias(self):
        A = {}

        def add(key, id):
            A.setdefault(key, [])
            if id not in A[key]:
                A[key].append(id)
        for id, v in self.C.items():
            if v[5]:
                add(flat(v[5]), id)
            if id in self.NAMES:
                add(self.NAMES[id], id)
        for key, ids in self.EXTRA.items():
            for id in ids:
                add(key, id)
        return A

    def names(self):
        out = {}
        for id, v in self.C.items():
            out[id] = self.NAMES.get(id, flat(v[5]))
        return out

    def check(self):
        for id in self.C:
            assert id in self.INFO, ("no info for", self.slug, id)
        for a in self.AREAS:
            for id in a[1]:
                assert id in self.C, ("area has unknown id", self.slug, id)
        for id in self.POOL:
            assert id in self.C, ("pool has unknown id", self.slug, id)
        A = self.alias()
        for name, (on, marks) in self.FIGS.items():
            for id in list(on) + [m[0] for m in marks]:
                assert id in self.C, ("figure has unknown id", name, id)
        for key, name in self.PLACE.items():
            assert name in self.FIGS, ("place points to a missing figure", key, name)
        return A

    def write_data(self):
        A = self.check()
        data = {"svg": self.interactive(), "info": self.INFO, "names": self.names(), "areas": self.AREAS, "alias": A,
                "stepWord": self.step_word, "name": self.name, "pool": self.POOL}
        (ROOT / f"{self.slug}-data.js").write_text(
            f"window.{self.var}=" + json.dumps(data, ensure_ascii=False) + f";window.PANEL=window.{self.var};\n", encoding="utf8")

    def build(self):
        (ROOT / "img").mkdir(exist_ok=True)
        self.write_data()
        for name, (on, marks) in self.FIGS.items():
            self.svg(name, on=on, marks=[m[0] for m in marks])
        return list(self.FIGS)

    def photos(self, cap):
        """Entries for build.PHOTOS: (lesson, "card", num, [figure], legend, caption)."""
        out = []
        for key, name in self.PLACE.items():
            ln, _, num = key.partition(":")
            _on, marks = self.FIGS[name]
            names = self.names()
            legend = [f"{names[id]}|{note}" for id, note in marks]
            out.append((int(ln), "card", num, [name], legend, cap))
        return out
