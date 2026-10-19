"""Build the standalone Codex T-8 introduction from its editable source.
Run from the repository root: python codex/build.py
"""
import os
import re
import sys
import json
import tempfile
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent

def build():
    content = (HERE / "src/t8-intro.html").read_text(encoding="utf-8")
    chapters = ["practice", "drums", "bass", "effects", "tricks", "finish"]
    for chapter in chapters:
        marker = "{{CHAPTER_" + chapter.upper() + "}}"
        if content.count(marker) != 1:
            raise ValueError("Expected one chapter marker: " + chapter)
        content = content.replace(marker, (HERE / "src" / (chapter + ".html")).read_text(encoding="utf-8"))
    count = len(re.findall(r'<article class="card intro-card"', content))
    if not count or content.count("{{INTRO_COUNT}}") != 1:
        raise ValueError("Expected lesson cards and one count placeholder")
    content = content.replace("{{INTRO_COUNT}}", str(count))
    target = HERE / "index.html"
    lock = HERE / ".build.lock"
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    temp = target.with_suffix(".html.tmp")
    try:
        # Reuse the existing panel renderer without writing in Claude's folder.
        sys.dont_write_bytecode = True
        spec = importlib.util.spec_from_file_location("t8map", HERE.parent / "claude/src/t8map.py")
        panel = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(panel)
        figures = json.loads((HERE / "src/figures.json").read_text(encoding="utf-8"))
        for name, controls in figures.items():
            if not re.fullmatch(r"[a-z][a-z0-9-]*", name) or not controls or any(c not in panel.C for c in controls):
                raise ValueError("Invalid diagram: " + name)
        with tempfile.TemporaryDirectory(dir=HERE, prefix=".figures-") as staging:
            panel.OUT = Path(staging)
            for name, controls in figures.items():
                panel.svg(name, on=controls, marks=controls)
            produced = list(panel.OUT.glob("*.svg"))
            if len(produced) != len(figures):
                raise ValueError("Diagram count mismatch")
            for diagram in produced:
                with diagram.open("rb+") as stream:
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(diagram, HERE / "img" / diagram.name)
        with temp.open("w", encoding="utf-8", newline="\n") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, target)
    finally:
        os.close(fd)
        lock.unlink()
        if temp.exists():
            temp.unlink()
    return count

if __name__ == "__main__":
    print("Built one Codex lesson with", build(), "cards")
