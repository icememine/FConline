# FC Tô Dế

A portrait (phone-upright) HTML5 football game inspired by FC Mobile. No build step, no dependencies.

**Play:** open `index.html` in a browser (or serve the folder, e.g. `python3 -m http.server`) and hold your phone upright.

## Features
- Six teams: Portugal (with superstar **Tô Dế**, rated 120), Arghentina, Real Maldrid, Barcelona, Brazil, Manchester United. Every other player is rated 76–99.
- Team select (your team + opponent), difficulty (Amateur / Pro / Legend), match length (2 / 4 / 6 min).
- Squad screen with FC-style cards; tap a player then a sub to swap (saved per team).
- 11v11 match on a perspective 3D-style pitch: AI positioning, pressing, passing, through balls, shots, goalkeeper saves/parries, headers, throw-ins, corners, goal kicks, posts and crossbar.
- FC Mobile controls: joystick + PASS / THROUGH / SHOOT (hold for power) / SPRINT & SKILL (tap for a skill move). When defending they become SWITCH / PRESS / TACKLE / SPRINT.
- **Superstar meter:** when it is full, Tô Dế's shot turns into the gold **Dế Mèn Shot**, an unstoppable curler.
- Goal replays, half-time and full-time stats, player of the match, synthesised sound (crowd, whistle, kicks).
- Keyboard for desktop: arrows/WASD move · J pass · K through · L shoot · Shift sprint · E skill · Esc pause.

Files: `index.html` (screens, HUD, styles) and `game.js` (engine, AI, renderer, input).
