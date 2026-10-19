# T-8 beginner lesson

## 2026-10-19: approved expansion

Raz approved continuing the reviewed excerpt into a full Hebrew lesson at the same public Codex URL. Audience: first-time T-8 owner reading on an iPad. Every card explains the idea, shows the physical controls, then offers a small listening experiment and an observable result. Chapters allow stopping and resuming.

Reuse the existing practice mode, image enlargement, typography and schematic renderer. Keep Claude/Grok files unchanged. Do not add dependencies. The renderer's output is directed only to Codex via a temporary staging directory. Shared assets are referenced by relative links.

Content plan:
- [x] Preserve beginner orientation and clarify the sound replacement map.
- [x] Build a listening pattern in an explicitly empty slot; explain modes and 16-step timing before input.
- [x] Teach each drum's pitch, length and distinctive tone control; separate shared LEVEL from per-part GAIn.
- [x] Teach bass pitch/length, cutoff, resonance/envelope and saw/square selection.
- [x] Add delay/reverb, mute arrangement, rolls, probability and bass slide with restoration instructions.
- [x] Explain deliberate Ptn saving, stopping, unsaved changes and practical troubleshooting.
- [x] Verify chapter links, card/image pairing, expected output count and unchanged neighboring projects; browser-check landscape/portrait, navigation, enlargement and menu instructions.
- [x] Publish and verify the existing public URL.

Source of truth: Roland T-8 Owner's Manual v1.02, top panel, functions/menu, pattern, rhythm, bass and effects pages. Base-sound choices are cross-checked against Roland support article 6145882578715. Menu labels are case-sensitive examples of the segmented display, not browser controls. No factory reset or blanket pattern clear belongs in this course.

Editing: `src/t8-intro.html` is the shell and opening cards. Six chapter HTML fragments contain subsequent cards. `src/figures.json` names the reused schematic control IDs. `python codex/build.py` creates one HTML page and exactly the declared diagrams under an exclusive lock; the image and HTML replacements are atomic per file.

Verification completed: 32 authored/generated cards and 13 declared/generated diagrams; all public practice cards navigated in order. Landscape (1024x768) and portrait (768x1024) checks passed for image loading, caption containment, beat grids, menu reminders and image zoom. The public content commit 75b5706 is built. No real iPad/Safari or hardware audio testing was performed.
