"""Build the standalone Codex T-8 introduction from its editable source.
Run from the repository root: python codex/build.py
"""
import os
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

def build():
    content = (HERE / "src/t8-intro.html").read_text(encoding="utf-8")
    count = len(re.findall(r'<article class="card intro-card"', content))
    if not count or content.count("{{INTRO_COUNT}}") != 1:
        raise ValueError("Expected lesson cards and one count placeholder")
    content = content.replace("{{INTRO_COUNT}}", str(count))
    target = HERE / "index.html"
    lock = HERE / ".build.lock"
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    temp = target.with_suffix(".html.tmp")
    try:
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
    print("Built one Codex introduction with", build(), "cards")
