/* FC Tô Dế — portrait HTML5 football. No dependencies. */
'use strict';
(function () {
  // ------------------------------------------------------------------ utils
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
  const hypot = Math.hypot;
  const sign = (v) => (v < 0 ? -1 : 1);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('fctode:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fctode:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  // ------------------------------------------------------------------ pitch constants (metres)
  const HL = 52.5, HW = 34, GW = 3.66, GH = 2.44, BOX_W = 20.16, BOX_L = 16.5, SIX_W = 9.16, SIX_L = 5.5;
  const G = 9.81 * 1.25;
  const DECEL_A = 3.0, DECEL_K = 0.12;
  const EXAG = 1.5;
  const CAM_H = 45, CAM_BACK = 40;
  const TILT = Math.atan2(CAM_H, CAM_BACK), COS_T = Math.cos(TILT), SIN_T = Math.sin(TILT);

  // ------------------------------------------------------------------ data
  const SKIN = ['#F1C9A5', '#E2B48C', '#C68E63', '#A86F45', '#7A4E32', '#5A3825'];
  const HAIR = ['#1B1410', '#3A2614', '#6B4A2A', '#A0743D', '#D9B36A', '#0E0906'];
  const POS_ORDER = ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'];
  const SLOTS = [[0, 49.5], [-23, 30], [-8.5, 35], [8.5, 35], [23, 30], [-14, 14], [0, 19], [14, 14], [-22, -6], [0, -10], [22, -6]];
  const ROLE_OF = { GK: 'GK', LB: 'DEF', CB: 'DEF', RB: 'DEF', CM: 'MID', LW: 'FWD', ST: 'FWD', RW: 'FWD' };
  const PROF = {
    GK: { pac: -22, sho: -45, pas: -14, dri: -28, def: -30, phy: -4 },
    DEF: { pac: -5, sho: -24, pas: -7, dri: -12, def: 3, phy: 2 },
    MID: { pac: -3, sho: -5, pas: 3, dri: 1, def: -10, phy: -4 },
    FWD: { pac: 3, sho: 2, pas: -6, dri: 2, def: -36, phy: -6 }
  };

  // [name, short, pos, ovr, number, skin, hair, star]
  const TEAMS = [
    { id: 'por', name: 'Portugal', code: 'POR', crest: ['#C8102E', '#0B6B3A', '#FFFFFF'],
      home: { shirt: '#C8102E', shirt2: null, shorts: '#0B6B3A', socks: '#C8102E', num: '#FFD166' },
      away: { shirt: '#F2EEE4', shirt2: null, shorts: '#F2EEE4', socks: '#C8102E', num: '#C8102E' }, gk: '#FF8A3D',
      squad: [
        ['Rui Paço', 'R. PAÇO', 'GK', 88, 1, 1, 1], ['Tiago Mendes', 'MENDES', 'LB', 85, 19, 3, 0], ['Rúben Vaz', 'R. VAZ', 'CB', 91, 4, 1, 1],
        ['Pepe Lobo', 'LOBO', 'CB', 87, 3, 4, 5], ['Nuno Dantas', 'DANTAS', 'RB', 84, 2, 2, 3], ['Hugo Brás', 'BRÁS', 'CM', 86, 6, 2, 1],
        ['Bruno Faria', 'FARIA', 'CM', 92, 8, 1, 2], ['Vitinho Sá', 'V. SÁ', 'CM', 89, 23, 2, 0], ['Rafa Leitão', 'LEITÃO', 'LW', 90, 17, 4, 5],
        ['Tô Dế', 'TÔ DẾ', 'ST', 120, 10, 2, 0, true], ['Bernardo Sol', 'B. SOL', 'RW', 91, 11, 1, 2],
        ['Diogo Lima', 'D. LIMA', 'CB', 82, 13, 2, 1], ['André Couto', 'COUTO', 'CM', 80, 16, 1, 0], ['Gonçalo Reis', 'G. REIS', 'ST', 83, 9, 1, 3],
        ['Félix Matos', 'MATOS', 'RW', 81, 7, 0, 2], ['Zé Pinto', 'Z. PINTO', 'GK', 78, 12, 2, 0]] },
    { id: 'arg', name: 'Arghentina', code: 'ARG', crest: ['#75AADB', '#FFFFFF', '#0B2A4A'],
      home: { shirt: '#75AADB', shirt2: '#FFFFFF', shorts: '#10223F', socks: '#FFFFFF', num: '#10223F' },
      away: { shirt: '#2B2D72', shirt2: null, shorts: '#2B2D72', socks: '#2B2D72', num: '#75AADB' }, gk: '#C7F23A',
      squad: [
        ['Emi Duarte', 'DUARTE', 'GK', 90, 23, 1, 1], ['Tomás Rivero', 'RIVERO', 'LB', 84, 3, 1, 0], ['Cristian Romay', 'ROMAY', 'CB', 89, 13, 2, 0],
        ['Nico Ferreyra', 'FERREYRA', 'CB', 88, 19, 1, 1], ['Nahuel Ortiz', 'ORTIZ', 'RB', 85, 26, 2, 0], ['Rodrigo Paz', 'R. PAZ', 'CM', 87, 7, 1, 2],
        ['Enzo Ferraro', 'FERRARO', 'CM', 88, 24, 1, 3], ['Alexis Molina', 'MOLINA', 'CM', 89, 20, 1, 4], ['Ángel Soria', 'SORIA', 'LW', 90, 11, 1, 1],
        ['Lautaro Vega', 'L. VEGA', 'ST', 92, 22, 2, 0], ['Leo Mansilla', 'MANSILLA', 'RW', 99, 10, 1, 2],
        ['Julián Ávila', 'ÁVILA', 'ST', 88, 9, 1, 0], ['Gio Lorenzo', 'LORENZO', 'CM', 84, 5, 1, 1], ['Lisandro Peña', 'PEÑA', 'CB', 86, 25, 2, 0],
        ['Thiago Alcaraz', 'ALCARAZ', 'CM', 82, 16, 1, 2], ['Gero Ruiz', 'G. RUIZ', 'GK', 82, 12, 1, 3]] },
    { id: 'rma', name: 'Real Maldrid', code: 'RMA', crest: ['#FFFFFF', '#D4AF37', '#1B2A5E'],
      home: { shirt: '#F4F4F4', shirt2: null, shorts: '#F4F4F4', socks: '#F4F4F4', num: '#1B2A5E' },
      away: { shirt: '#1B2A5E', shirt2: null, shorts: '#1B2A5E', socks: '#1B2A5E', num: '#D4AF37' }, gk: '#3EC1A0',
      squad: [
        ['Tibo Kurtov', 'KURTOV', 'GK', 90, 1, 0, 2], ['Ferland Mendes', 'F. MENDES', 'LB', 84, 23, 4, 0], ['Toni Rudi', 'RUDI', 'CB', 88, 22, 4, 0],
        ['Éder Milan', 'E. MILAN', 'CB', 87, 3, 3, 0], ['Dani Carvalho', 'CARVALHO', 'RB', 85, 2, 1, 2], ['Fede Valverdi', 'VALVERDI', 'CM', 90, 8, 1, 1],
        ['Aurélien Tchou', 'TCHOU', 'CM', 87, 14, 5, 0], ['Jude Bellamy', 'BELLAMY', 'CM', 95, 5, 4, 0], ['Vini Santos', 'V. SANTOS', 'LW', 94, 7, 4, 0],
        ['Kilian Bappé', 'BAPPÉ', 'ST', 96, 9, 4, 0], ['Rodrigo Goes', 'R. GOES', 'RW', 89, 11, 2, 0],
        ['Luka Modrik', 'MODRIK', 'CM', 87, 10, 0, 4], ['Arda Güven', 'GÜVEN', 'RW', 84, 15, 1, 1], ['David Alavez', 'ALAVEZ', 'CB', 85, 4, 3, 0],
        ['Brahim Díez', 'B. DÍEZ', 'RW', 82, 21, 2, 0], ['Andriy Lunov', 'LUNOV', 'GK', 80, 13, 0, 3]] },
    { id: 'bar', name: 'Barcelona', code: 'BAR', crest: ['#A50044', '#004D98', '#FFD166'],
      home: { shirt: '#A50044', shirt2: '#004D98', shorts: '#004D98', socks: '#A50044', num: '#FFD166' },
      away: { shirt: '#F2C230', shirt2: null, shorts: '#F2C230', socks: '#F2C230', num: '#A50044' }, gk: '#9BE15D',
      squad: [
        ['Marc Ter Stein', 'TER STEIN', 'GK', 89, 1, 0, 4], ['Alex Baldé', 'BALDÉ', 'LB', 86, 3, 4, 0], ['Ron Arauz', 'ARAUZ', 'CB', 87, 4, 2, 0],
        ['Pau Cubar', 'CUBAR', 'CB', 85, 2, 1, 2], ['Jules Kondé', 'KONDÉ', 'RB', 86, 23, 4, 0], ['Frenkie de Jonk', 'DE JONK', 'CM', 88, 21, 0, 3],
        ['Pedrito', 'PEDRITO', 'CM', 92, 8, 1, 0], ['Gavi Páez', 'G. PÁEZ', 'CM', 87, 6, 1, 0], ['Raphinho', 'RAPHINHO', 'LW', 90, 11, 2, 0],
        ['Robert Lewan', 'LEWAN', 'ST', 91, 9, 0, 3], ['Lamine Yamar', 'YAMAR', 'RW', 93, 19, 3, 0],
        ['Dani Olmedo', 'OLMEDO', 'CM', 87, 20, 1, 2], ['Ferran Torrez', 'TORREZ', 'ST', 84, 7, 1, 1], ['Íñigo Martín', 'Í. MARTÍN', 'CB', 83, 5, 1, 0],
        ['Fermín Lozano', 'LOZANO', 'CM', 82, 16, 1, 1], ['Iñaki Peral', 'PERAL', 'GK', 80, 13, 1, 0]] },
    { id: 'bra', name: 'Brazil', code: 'BRA', crest: ['#FEDD00', '#009C3B', '#0B3D91'],
      home: { shirt: '#FEDD00', shirt2: null, shorts: '#1C4FB8', socks: '#FFFFFF', num: '#0B6B3A' },
      away: { shirt: '#1C4FB8', shirt2: null, shorts: '#FFFFFF', socks: '#1C4FB8', num: '#FEDD00' }, gk: '#E5243B',
      squad: [
        ['Alisson Becka', 'BECKA', 'GK', 90, 1, 1, 0], ['Wendel Alves', 'W. ALVES', 'LB', 83, 6, 3, 0], ['Marquinho Silva', 'M. SILVA', 'CB', 88, 4, 3, 0],
        ['Gabriel Matos', 'G. MATOS', 'CB', 86, 3, 2, 0], ['Danilo Souza', 'SOUZA', 'RB', 82, 2, 3, 0], ['Bruno Guima', 'GUIMA', 'CM', 88, 5, 2, 0],
        ['Casemir', 'CASEMIR', 'CM', 85, 18, 3, 0], ['Lucas Paquê', 'PAQUÊ', 'CM', 86, 8, 2, 1], ['Vini Rocha', 'V. ROCHA', 'LW', 92, 20, 4, 0],
        ['Neymário', 'NEYMÁRIO', 'ST', 93, 10, 2, 4], ['Raphael Lima', 'R. LIMA', 'RW', 89, 11, 3, 0],
        ['Endrick Sousa', 'ENDRICK', 'ST', 82, 9, 4, 0], ['Bremer Costa', 'BREMER', 'CB', 85, 14, 3, 0], ['João Gaspar', 'GASPAR', 'CM', 82, 15, 3, 0],
        ['Savinho Reis', 'SAVINHO', 'RW', 83, 19, 3, 0], ['Ederson Moura', 'EDERSON', 'GK', 87, 23, 2, 0]] },
    { id: 'mun', name: 'Manchester United', code: 'MUN', crest: ['#DA291C', '#111111', '#FFD166'],
      home: { shirt: '#DA291C', shirt2: null, shorts: '#FFFFFF', socks: '#111111', num: '#FFFFFF' },
      away: { shirt: '#1A1A1A', shirt2: null, shorts: '#1A1A1A', socks: '#1A1A1A', num: '#E8C547' }, gk: '#7FD3FF',
      squad: [
        ['André Onanu', 'ONANU', 'GK', 84, 24, 5, 0], ['Luke Shore', 'SHORE', 'LB', 80, 23, 0, 2], ['Lisandro Martí', 'MARTÍ', 'CB', 85, 6, 1, 1],
        ['Harry Maguer', 'MAGUER', 'CB', 81, 5, 0, 3], ['Diogo Dalô', 'DALÔ', 'RB', 83, 20, 1, 1], ['Kobbie Mainu', 'MAINU', 'CM', 84, 37, 4, 0],
        ['Casimir Ugar', 'UGAR', 'CM', 82, 25, 1, 0], ['Bruno Fernão', 'FERNÃO', 'CM', 88, 8, 1, 2], ['Marcus Rashfield', 'RASHFIELD', 'LW', 85, 10, 4, 0],
        ['Rasmus Højlo', 'HØJLO', 'ST', 82, 11, 0, 4], ['Amad Diallô', 'DIALLÔ', 'RW', 86, 16, 5, 0],
        ['Leny Yorro', 'YORRO', 'CB', 83, 15, 4, 0], ['Mason Mond', 'M. MOND', 'CM', 80, 7, 0, 2], ['Alejandro Garnaço', 'GARNAÇO', 'LW', 83, 17, 1, 1],
        ['Joshua Zirk', 'ZIRK', 'ST', 81, 9, 0, 2], ['Altay Bayin', 'BAYIN', 'GK', 76, 1, 1, 0]] }
  ];
  const DIFFS = {
    amateur: { label: 'AMATEUR', react: 0.42, tackle: 0.55, shotErr: 1.5, speed: 0.92, gkBonus: -0.12, userGk: 0.08 },
    pro: { label: 'PRO', react: 0.28, tackle: 0.85, shotErr: 1.0, speed: 0.98, gkBonus: 0, userGk: 0 },
    legend: { label: 'LEGEND', react: 0.17, tackle: 1.08, shotErr: 0.72, speed: 1.03, gkBonus: 0.07, userGk: -0.04 }
  };
  const LENGTHS = [{ id: 2, label: '2 MIN' }, { id: 4, label: '4 MIN' }, { id: 6, label: '6 MIN' }];

  function makePlayerDef(arr, team) {
    const [name, short, pos, ovr, num, skin, hair, star] = arr;
    const role = ROLE_OF[pos];
    const pr = PROF[role];
    const h = hashStr(name);
    const j = (k) => ((h >>> (k * 3)) & 7) - 3;
    const st = star ? { pac: 120, sho: 120, pas: 118, dri: 120, def: 86, phy: 116 } : {
      pac: clamp(ovr + pr.pac + j(1), 25, 99), sho: clamp(ovr + pr.sho + j(2), 25, 99), pas: clamp(ovr + pr.pas + j(3), 25, 99),
      dri: clamp(ovr + pr.dri + j(4), 25, 99), def: clamp(ovr + pr.def + j(5), 25, 99), phy: clamp(ovr + pr.phy + j(6), 25, 99)
    };
    return { name, short, pos, role, ovr, num, skin: SKIN[skin], hair: HAIR[hair], star: !!star, st, team };
  }
  TEAMS.forEach((t) => {
    t.players = t.squad.map((a) => makePlayerDef(a, t));
    t.lineup = store.get('lineup:' + t.id, null);
    if (!Array.isArray(t.lineup) || t.lineup.length !== 16) t.lineup = t.players.map((_, i) => i);
  });
  const teamById = (id) => TEAMS.find((t) => t.id === id) || TEAMS[0];
  const teamOvr = (t) => Math.round(t.lineup.slice(0, 11).reduce((s, i) => s + t.players[i].ovr, 0) / 11);

  // ------------------------------------------------------------------ audio (synthesised)
  const Snd = {
    ctx: null, master: null, crowd: null, on: store.get('sound', true), noise: null,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        const c = this.ctx = new AC();
        this.master = c.createGain(); this.master.gain.value = this.on ? 0.9 : 0; this.master.connect(c.destination);
        const len = c.sampleRate * 2; const buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
        let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 + w * 0.15; }
        this.noise = buf;
        const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5;
        this.crowd = c.createGain(); this.crowd.gain.value = 0;
        src.connect(bp); bp.connect(this.crowd); this.crowd.connect(this.master); src.start();
      } catch (e) { this.ctx = null; }
    },
    setOn(v) { this.on = v; store.set('sound', v); if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.05); },
    crowdLevel(v) { if (this.crowd) this.crowd.gain.setTargetAtTime(v, this.ctx.currentTime, 0.4); },
    burst(dur, freq, q, gain, type = 'bandpass') {
      if (!this.ctx || !this.noise) return; const c = this.ctx, t = c.currentTime;
      const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    },
    tone(type, f0, f1, dur, gain, delay = 0) {
      if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay;
      const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    },
    kick(p) { this.tone('sine', 160, 55, 0.12, 0.35 + p * 0.4); this.burst(0.05, 2400, 0.8, 0.12 + p * 0.2, 'highpass'); },
    whistle(n = 1) {
      if (!this.ctx) return;
      for (let i = 0; i < n; i++) {
        const d = i * 0.42, long = (i === n - 1) ? 0.55 : 0.28;
        this.tone('sine', 2350, 2300, long, 0.18, d); this.tone('sine', 2780, 2720, long, 0.1, d);
      }
    },
    goal() { this.burst(3.2, 900, 0.4, 0.9); this.burst(2.4, 1800, 0.6, 0.35); if (this.crowd) { this.crowd.gain.setValueAtTime(0.5, this.ctx.currentTime); this.crowd.gain.setTargetAtTime(0.1, this.ctx.currentTime + 1.2, 1.2); } },
    post() { this.tone('triangle', 1250, 1180, 0.45, 0.35); this.tone('triangle', 1870, 1800, 0.35, 0.18); this.burst(0.8, 600, 0.6, 0.35); },
    click() { this.tone('square', 900, 700, 0.05, 0.06); },
    ooh() { this.burst(1.2, 520, 1.2, 0.45); }
  };

  // ------------------------------------------------------------------ stage / scaling
  const stage = $('#stage'), app = $('#app'), cv = $('#game'), ctx = cv.getContext('2d');
  let W = 390, H = 844, SCALE = 1, DPR = 1, F = 780, H0 = 388;
  function layout() {
    const sw = stage.clientWidth || window.innerWidth, sh = stage.clientHeight || window.innerHeight;
    SCALE = Math.min(sw / 390, sh / 680);
    W = 390; H = Math.max(680, Math.round(sh / SCALE));
    if (W * SCALE > sw + 1) SCALE = sw / 390;
    H = Math.min(H, Math.round(sh / SCALE));
    app.style.width = W + 'px'; app.style.height = H + 'px';
    app.style.left = Math.round((sw - W * SCALE) / 2) + 'px'; app.style.top = Math.round((sh - H * SCALE) / 2) + 'px';
    app.style.transform = 'scale(' + SCALE + ')';
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(W * SCALE * DPR); cv.height = Math.round(H * SCALE * DPR);
    F = W * 2.0; H0 = H * 0.47;
    app.classList.toggle('short', H < 790);
    const bottomBtn = { bShoot: 162, bThrough: 126, bPass: 18, bSprint: 32 };
    for (const id in bottomBtn) $('#' + id).style.bottom = bottomBtn[id] + 'px';
    Ctl.home();
    $('#meter').style.top = (H - 280) + 'px';
  }

  // ------------------------------------------------------------------ match state
  const M = {
    on: false, demo: false, state: 'idle', stateT: 0, t: 0, clock: 0, half: 1, halfLen: 120,
    teams: [], all: [], ball: null, ctrl: null, score: [0, 0], diff: DIFFS.pro, diffId: 'pro',
    stats: null, events: [], popups: [], replayBuf: [], replay: null, recT: 0,
    meter: [0, 0], starSide: -1, slow: 0, shake: 0, toastT: 0, kickoffSide: 0, firstKick: 0, autoplay: false, sp: null, cornerT: 0, idleT: 0,
    timeScale: 1
  };
  const cam = { x: 0, y: 0 };

  function kitsFor(homeT, awayT) {
    const dist = (a, b) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; const x = p(a), y = p(b); return hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
    const k0 = homeT.home; let k1 = awayT.home;
    if (dist(k0.shirt, k1.shirt) < 120 || (k1.shirt2 && dist(k0.shirt, k1.shirt2) < 90)) k1 = awayT.away;
    return [k0, k1];
  }

  function makeRuntime(def, side, slot, kit, gkKit) {
    return {
      def, st: def.st, side, slot, role: def.role, isGK: def.role === 'GK', star: def.star,
      x: 0, y: 0, vx: 0, vy: 0, face: 0, anim: Math.random() * 6, stun: 0, kickCd: 0, tackleCd: 0, decideT: Math.random() * 0.3,
      skillT: 0, skillDir: 1, slideT: 0, sdx: 0, sdy: 0, dive: 0, diveDir: 0, celebrate: 0, jump: 0, lunge: 0,
      runT: 0, rx: 0, ry: 0, holdT: 0, wx: 0, wy: 0, sprint: false, kit, gkKit, wantSpd: 0
    };
  }
  const dirOf = (side) => (side === 0 ? -1 : 1); // side 0 (user) attacks toward y = -HL (up the screen)
  const oppGoalY = (side) => dirOf(side) * HL;
  const ownGoalY = (side) => -dirOf(side) * HL;
  const keeper = (side) => M.teams[side].players[0];

  function startMatch(opts) {
    const tA = teamById(opts.you), tB = teamById(opts.opp);
    const kits = kitsFor(tA, tB);
    M.demo = !!opts.demo; M.autoplay = !!opts.demo || !!opts.autoplay;
    M.diffId = opts.diff || 'pro'; M.diff = DIFFS[M.diffId] || DIFFS.pro;
    M.halfLen = (opts.len || 4) * 60 / 2;
    M.teams = [tA, tB].map((t, side) => {
      const kit = kits[side];
      const players = t.lineup.slice(0, 11).map((pi, slot) => makeRuntime(t.players[pi], side, slot, kit, { shirt: t.gk, shirt2: null, shorts: '#1E1E1E', socks: t.gk, num: '#111111' }));
      return { t, side, players, kit };
    });
    M.all = M.teams[0].players.concat(M.teams[1].players);
    M.ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, owner: null, lastTouch: null, lastSide: 0, shot: null, pass: null, curl: 0, spin: 0, script: null, trail: [], superT: 0 };
    M.score = [0, 0]; M.half = 1; M.clock = 0; M.events = []; M.popups = []; M.replayBuf = []; M.replay = null; M.slow = 0; M.shake = 0;
    M.stats = { shots: [0, 0], onT: [0, 0], poss: [0.001, 0.001], passes: [0, 0], passOk: [0, 0], saves: [0, 0], tackles: [0, 0] };
    M.starSide = M.all.find((p) => p.star) ? M.all.find((p) => p.star).side : -1;
    M.meter = [0, 0];
    M.firstKick = Math.random() < 0.5 ? 0 : 1;
    M.on = true; M.ctrl = null;
    setupKickoff(M.firstKick);
    if (!M.demo) { Hud.setup(); Snd.crowdLevel(0.09); }
  }

  function kickoffSpot(slot, kicking) {
    const [sx, sy] = SLOTS[slot];
    if (slot === 0) return [0, 49.5];
    const role = ROLE_OF[POS_ORDER[slot]];
    if (kicking) {
      if (slot === 9) return [0, 0.7];
      if (slot === 6) return [-2.5, 6];
      if (role === 'FWD') return [sx * 0.95, 1.5];
    } else if (role === 'FWD') {
      return [sx * 0.8, slot === 9 ? 11 : 10];
    }
    return [sx * 0.85, Math.max(6, sy * 0.6 + 16)];
  }

  function setupKickoff(side) {
    M.kickoffSide = side;
    for (const p of M.all) {
      const [fx, fy] = kickoffSpot(p.slot, p.side === side);
      const d = dirOf(p.side);
      p.x = fx * -d; p.y = fy * -d; p.vx = p.vy = 0; p.face = d < 0 ? -Math.PI / 2 : Math.PI / 2;
      p.stun = p.kickCd = p.tackleCd = p.skillT = p.slideT = p.dive = p.celebrate = p.jump = p.runT = p.holdT = 0;
    }
    const b = M.ball; b.x = 0; b.y = 0; b.z = 0; b.vx = b.vy = b.vz = 0; b.shot = b.pass = b.script = null; b.curl = 0; b.trail.length = 0;
    const taker = M.teams[side].players[9];
    b.owner = taker; b.lastTouch = taker; b.lastSide = side;
    if (!M.autoplay) M.ctrl = side === 0 ? taker : nearestTo(M.teams[0].players, 0, 0, true);
    cam.x = 0; cam.y = 4 * (side === 0 ? 1 : 1);
    M.state = 'kickoff'; M.stateT = M.demo ? 0.4 : 1.3;
    M.sp = null; M.cornerT = 0;
  }

  // ------------------------------------------------------------------ helpers
  function nearestTo(list, x, y, outfieldOnly, except) {
    let best = null, bd = 1e9;
    for (const p of list) { if (outfieldOnly && p.isGK) continue; if (p === except) continue; const d = hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  const opps = (side) => M.teams[1 - side].players;
  const mates = (side) => M.teams[side].players;
  function nearestOppDist(p) { let bd = 1e9; for (const o of opps(p.side)) { const d = hypot(o.x - p.x, o.y - p.y); if (d < bd) bd = d; } return bd; }
  function laneSafety(ax, ay, bx, by, side) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1; let m = 9;
    for (const o of opps(side)) {
      let t = ((o.x - ax) * dx + (o.y - ay) * dy) / L2; if (t < 0.05 || t > 1.05) continue; t = clamp(t, 0, 1);
      const d = hypot(ax + dx * t - o.x, ay + dy * t - o.y) - (o.isGK ? 0.6 : 0); if (d < m) m = d;
    }
    return clamp(m / 3, 0, 1);
  }
  function inBox(side, x, y) { const gy = ownGoalY(side); return Math.abs(x) < BOX_W && Math.abs(y - gy) < BOX_L; }
  function maxSpeed(p, sprint) {
    let s = (5.4 + p.st.pac * 0.03);
    s *= sprint ? 1 : 0.76;
    if (M.ball.owner === p) s *= 0.88 + p.st.dri * 0.001;
    if (!M.autoplay && p.side === 1) s *= M.diff.speed;
    if (p.isGK) s *= 0.92;
    return s;
  }
  function passSpeedFor(d, vEnd) {
    const a = DECEL_A, k = DECEL_K;
    const D = (v0) => (v0 - vEnd) / k - (a / (k * k)) * Math.log((a + k * v0) / (a + k * vEnd));
    let lo = vEnd, hi = 45; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (D(m) < d) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function popup(text, x, y, color = '#FFFFFF', size = 15) { M.popups.push({ text, x, y, z: 2.6, t: 0, color, size }); }
  function toast(text, dur = 1.6) { if (M.demo) return; const el = $('#toast'); el.textContent = text; el.hidden = false; M.toastT = dur; }
  const gameMinute = () => Math.min(90, Math.floor((M.half - 1) * 45 + (M.clock / M.halfLen) * 45) + 1);

  // ------------------------------------------------------------------ ball actions
  function gainBall(p) {
    const b = M.ball;
    const fromPass = b.pass && b.pass.from && b.pass.from.side === p.side && b.pass.from !== p;
    if (fromPass) { M.stats.passOk[p.side]++; }
    if (b.lastSide !== p.side && b.lastTouch && b.lastTouch.side !== p.side && b.owner && b.owner.side !== p.side) M.stats.tackles[p.side]++;
    b.owner = p; b.shot = null; b.pass = null; b.curl = 0; b.script = null; b.lastTouch = p; b.lastSide = p.side; b.z = 0; b.vz = 0;
    p.holdT = 0; p.runT = 0; p.decideT = M.diff.react * rnd(0.6, 1.2);
    if (p.star) addMeter(p.side, 3);
    if (!M.autoplay && p.side === 0 && !p.isGK) M.ctrl = p;
    if (!M.autoplay && p.side === 0 && IN.queue && M.t - IN.queueT < 0.7 && M.ctrl === p) { const q = IN.queue; IN.queue = null; userAction(q, true); }
  }
  function release(p, vx, vy, vz, opts = {}) {
    const b = M.ball;
    b.owner = null; b.vx = vx; b.vy = vy; b.vz = vz; b.z = Math.max(b.z, 0.02);
    b.lastTouch = p; b.lastSide = p.side; b.pass = opts.pass || null; b.shot = opts.shot || null; b.curl = opts.curl || 0; b.script = opts.script || null;
    p.kickCd = opts.cd || 0.3; p.holdT = 0;
    const pw = clamp(hypot(vx, vy) / 32, 0.15, 1);
    if (!M.demo) Snd.kick(pw);
  }
  function addMeter(side, v) { if (side === M.starSide) M.meter[side] = clamp(M.meter[side] + v, 0, 100); }
  const superReady = (p) => p && p.star && M.meter[p.side] >= 100 && Math.abs(oppGoalY(p.side) - p.y) < 38;

  function doPass(p, t, kind) {
    const b = M.ball; if (b.owner !== p) return;
    const gy = oppGoalY(p.side), fwd = sign(gy);
    let tx, ty;
    if (kind === 'through') {
      const lead = clamp(9 - Math.abs(gy - t.y) * 0.05, 5, 9);
      tx = t.x * 0.85 + (t.x > 0 ? -1 : 1) * 1.5; ty = t.y + fwd * lead;
      ty = clamp(ty, -HL + 3, HL - 3); tx = clamp(tx, -HW + 2, HW - 2);
      t.runT = 1.8; t.rx = tx; t.ry = ty;
    } else {
      tx = t.x + t.vx * 0.45; ty = t.y + t.vy * 0.45;
    }
    const dx = tx - b.x, dy = ty - b.y, d = hypot(dx, dy) || 1;
    const errS = Math.max(0.004, (106 - p.st.pas) * 0.0017) * (p.side === 1 && !M.autoplay ? M.diff.shotErr : 1);
    const ang = Math.atan2(dy, dx) + gauss() * errS;
    const lane = laneSafety(b.x, b.y, tx, ty, p.side);
    let vx, vy, vz;
    if (d > 30 || (lane < 0.35 && d > 14)) {
      const T = 0.75 + d * 0.022; vz = 0.5 * G * T; const hs = d / T * 0.97;
      vx = Math.cos(ang) * hs; vy = Math.sin(ang) * hs;
    } else {
      const v0 = clamp(passSpeedFor(d, kind === 'through' ? 3.5 : 6), 7, 27);
      vx = Math.cos(ang) * v0; vy = Math.sin(ang) * v0; vz = 0;
    }
    release(p, vx, vy, vz, { pass: { to: t, from: p, kind } });
    M.stats.passes[p.side]++;
    if (p.star) addMeter(p.side, 2);
    if (!M.autoplay && p.side === 0 && !t.isGK) M.ctrl = t;
  }

  function passIntoSpace(p, dx, dy) {
    const b = M.ball; const d = 14; const n = hypot(dx, dy) || 1;
    const v0 = passSpeedFor(d, 3);
    release(p, dx / n * v0, dy / n * v0, 0, { pass: { to: null, from: p, kind: 'space' } });
  }

  function doShoot(p, power, aimX) {
    const b = M.ball; if (b.owner !== p) return;
    if (superReady(p)) return doSuper(p);
    const gy = oppGoalY(p.side);
    const gk = keeper(1 - p.side);
    let tx = aimX == null ? (gk.x > b.x * 0.15 ? -1 : 1) * rnd(1.9, 3.1) : clamp(aimX * 3.2, -3.25, 3.25);
    let tz = lerp(0.2, 1.85, power) + rnd(-0.15, 0.25);
    if (power > 0.94) tz += (power - 0.94) * 28;
    const dist = hypot(tx - b.x, gy - b.y);
    const speed = clamp(16 + power * 15 + (p.st.sho - 80) * 0.07, 11, 36);
    const errM = (p.side === 1 && !M.autoplay) ? M.diff.shotErr : 1;
    const err = Math.max(0.005, (119 - p.st.sho) * 0.0021) * (0.55 + power * 0.6) * errM * (1 + Math.max(0, dist - 18) * 0.02);
    const ang = Math.atan2(gy - b.y, tx - b.x) + gauss() * err;
    tz = Math.max(0.05, tz + gauss() * 0.28 * errM);
    const T = dist / speed; const vz = (tz + 0.5 * G * T * T) / T;
    release(p, Math.cos(ang) * speed, Math.sin(ang) * speed, vz, { shot: { side: p.side, by: p }, cd: 0.45 });
    M.stats.shots[p.side]++;
    if (p.star) addMeter(p.side, 4);
    decideSave();
  }

  function doSuper(p) {
    const b = M.ball; const gy = oppGoalY(p.side); const s = Math.random() < 0.5 ? -1 : 1;
    const tx = s * 2.95, tz = 2.05;
    const p0 = { x: b.x, y: b.y }, p2 = { x: tx, y: gy + sign(gy) * 0.6 };
    const mx = (p0.x + p2.x) / 2, my = (p0.y + p2.y) / 2;
    const p1 = { x: mx + s * (6 + Math.abs(p2.y - p0.y) * 0.18), y: my };
    const dist = hypot(p2.x - p0.x, p2.y - p0.y);
    const dur = clamp(dist / 34, 0.38, 1.3);
    release(p, 0, 0, 0, { shot: { side: p.side, by: p, super: true, onTarget: true, willSave: false }, cd: 0.6, script: { t: 0, dur, p0, p1, p2, z0: 0.2, zt: tz } });
    M.stats.shots[p.side]++; M.stats.onT[p.side]++;
    M.meter[p.side] = 0; M.slow = 0.75; b.superT = 2.5;
    popup('DẾ MÈN SHOT!', p.x, p.y, '#FFD166', 20);
    if (!M.demo) { Snd.burst(0.9, 3200, 0.7, 0.3, 'highpass'); try { navigator.vibrate && navigator.vibrate(40); } catch (e) { /* no vibration */ } }
    const gk = keeper(1 - p.side); gk.dive = 0.8; gk.diveDir = sign(-s * dirOf(p.side) * -1);
  }

  function decideSave() {
    const b = M.ball, sh = b.shot; if (!sh) return;
    const def = 1 - sh.side, gk = keeper(def), gy = ownGoalY(def);
    const t = (gy - b.y) / (b.vy || 1e-6);
    if (!(t > 0)) { sh.onTarget = false; return; }
    const xc = b.x + b.vx * t; let zc = b.z + b.vz * t - 0.5 * G * t * t; if (zc < 0) zc = 0.15;
    sh.onTarget = Math.abs(xc) < GW - 0.08 && zc < GH - 0.05;
    sh.xc = xc; sh.zc = zc; sh.t = t;
    if (!sh.onTarget) { sh.willSave = false; return; }
    M.stats.onT[sh.side]++;
    const speed = hypot(b.vx, b.vy); const reach = Math.abs(xc - gk.x);
    let pr = 0.93 - speed * 0.012 - reach * 0.075 + (gk.def.ovr - 85) * 0.012 + (t > 0.85 ? 0.14 : 0) + (t > 1.25 ? 0.16 : 0);
    if (zc > 1.7 && reach > 2.1) pr -= 0.12;
    if (!M.autoplay) pr += def === 1 ? M.diff.gkBonus : M.diff.userGk;
    if (sh.by && sh.by.star) pr -= 0.08;
    sh.willSave = Math.random() < clamp(pr, 0.04, 0.95);
  }

  function doSkill(p) {
    if (p.skillT > 0 || M.ball.owner !== p) return;
    p.skillT = 0.5;
    let nearest = null, nd = 1e9; for (const o of opps(p.side)) { const d = hypot(o.x - p.x, o.y - p.y); if (d < nd) { nd = d; nearest = o; } }
    const px = -Math.sin(p.face), py = Math.cos(p.face);
    p.skillDir = nearest ? ((nearest.x - p.x) * px + (nearest.y - p.y) * py > 0 ? -1 : 1) : 1;
    for (const o of opps(p.side)) {
      const d = hypot(o.x - p.x, o.y - p.y);
      if (d < 2.8 && Math.random() < clamp(0.42 + (p.st.dri - o.st.def) * 0.012, 0.15, 0.95)) { o.stun = 0.7; }
    }
    popup(p.star ? 'TÔ DẾ SKILL!' : 'SKILL!', p.x, p.y, '#C6F432', 13);
    if (p.star) addMeter(p.side, 6);
  }

  function tryTackle(p, o, bonus = 0) {
    p.tackleCd = 1.0; p.lunge = 0.3;
    if (!o || M.ball.owner !== o) return false;
    if (o.isGK && inBox(o.side, o.x, o.y)) return false;
    let pr = clamp(0.5 + (p.st.def - o.st.dri) * 0.012 + bonus, 0.1, 0.88);
    if (!M.autoplay && p.side === 1) pr *= M.diff.tackle;
    if (o.skillT > 0) pr *= 0.2;
    if (Math.random() < pr) {
      const b = M.ball; o.stun = 0.55;
      M.stats.tackles[p.side]++;
      if (Math.random() < 0.55) { gainBall(p); }
      else { const ang = Math.atan2(b.y - p.y, b.x - p.x) + rnd(-0.6, 0.6); release(p, Math.cos(ang) * 6, Math.sin(ang) * 6, 0, { cd: 0.25 }); }
      popup('TACKLE!', p.x, p.y, '#FFFFFF', 13);
      if (!M.demo) Snd.burst(0.12, 900, 1, 0.25);
      return true;
    }
    p.stun = 0.4;
    return false;
  }

  function startSlide(p, dx, dy) {
    if (p.slideT > 0 || p.stun > 0) return;
    const n = hypot(dx, dy) || 1; p.slideT = 0.55; p.sdx = dx / n; p.sdy = dy / n; p.tackleCd = 1.1; p.slid = false;
  }

  // ------------------------------------------------------------------ AI
  let chaser = [null, null], cover = [null, null];
  function teamPlanning() {
    const b = M.ball;
    for (let s = 0; s < 2; s++) {
      const list = mates(s).filter((p) => !p.isGK && p.stun <= 0);
      const tx = b.owner ? b.owner.x + b.owner.vx * 0.3 : b.x + b.vx * 0.35;
      const ty = b.owner ? b.owner.y + b.owner.vy * 0.3 : b.y + b.vy * 0.35;
      list.sort((p, q) => hypot(p.x - tx, p.y - ty) / maxSpeed(p, true) - hypot(q.x - tx, q.y - ty) / maxSpeed(q, true));
      const userSide = s === 0 && !M.autoplay;
      let i = 0;
      if (userSide && list[0] === M.ctrl) i = 1;
      chaser[s] = list[i] || null; cover[s] = list[i + 1] || null;
    }
  }

  function setWant(p, tx, ty, sprintDist = 6, slowR = 1.5) {
    const dx = tx - p.x, dy = ty - p.y, d = hypot(dx, dy);
    if (d < 0.25) { p.wx = 0; p.wy = 0; p.sprint = false; return; }
    p.sprint = d > sprintDist;
    const ms = maxSpeed(p, p.sprint) * (d > slowR ? 1 : d / slowR * 0.8 + 0.2);
    p.wx = dx / d * ms; p.wy = dy / d * ms;
  }

  function formationTarget(p, attacking) {
    const b = M.ball, d = dirOf(p.side);
    const [sx, sy] = SLOTS[p.slot];
    const bx = b.x * -d, by = b.y * -d;
    let tx, ty;
    if (attacking) {
      ty = sy * 0.62 + by * 0.55 - (p.role === 'FWD' ? 7 : p.role === 'MID' ? 3 : -2);
      if (p.role === 'DEF') ty = Math.max(ty, by + 6);
      if (p.role === 'FWD') { ty = Math.min(ty, by + 3); ty = Math.max(ty, -HL + 12); }
      if (p.role === 'MID') ty = Math.max(ty, -HL + 16);
      tx = sx * 0.9 + bx * 0.22;
    } else {
      ty = sy * 0.55 + by * 0.45 + 7;
      if (p.role === 'DEF') ty = Math.max(ty, by + 3);
      tx = sx * 0.72 + bx * 0.3;
    }
    if (M.cornerT > 0 && M.sp && M.sp.kind === 'corner') {
      const att = M.sp.side === p.side;
      if (att && (p.role === 'FWD' || (p.role === 'MID' && p.slot !== 6))) { tx = (p.slot - 8) * 3.2 + (p.slot === 5 ? -6 : p.slot === 7 ? 6 : 0); ty = -HL + 9 + (p.slot % 3) * 2.2; }
      if (!att && p.role !== 'GK' && p.slot !== 9) { tx = sx * 0.4; ty = HL - 8 - (p.role === 'DEF' ? 0 : 5); }
    }
    tx += Math.sin(M.t * 0.6 + p.slot * 1.7) * 1.2;
    tx = clamp(tx, -HW + 1.5, HW - 1.5); ty = clamp(ty, -HL + 2, HL - 2);
    return [tx * -d, ty * -d];
  }

  function bestPassOption(p, forThrough) {
    const gy = oppGoalY(p.side), fwd = sign(gy);
    let best = null, bs = -1e9;
    for (const t of mates(p.side)) {
      if (t === p || t.stun > 0) continue;
      if (t.isGK && !(p.holdT > 2.5 && p.role === 'DEF')) continue;
      const d = hypot(t.x - p.x, t.y - p.y); if (d < 4 || d > 40) continue;
      const prog = (t.y - p.y) * fwd;
      const lane = laneSafety(p.x, p.y, t.x, t.y, p.side);
      const open = Math.min(nearestOppDist(t), 6) / 6;
      let s = lane * 1.3 + open + clamp(prog / 22, -0.7, 1) * (forThrough ? 1.6 : 0.9) - (d > 28 ? 0.45 : 0);
      if (forThrough && (t.role !== 'FWD' && t.role !== 'MID')) s -= 0.6;
      if (s > bs) { bs = s; best = t; }
    }
    return best ? { t: best, score: bs } : null;
  }

  function dribbleDir(p) {
    const gy = oppGoalY(p.side);
    let dx = (0 - p.x) * 0.25, dy = gy - p.y; let n = hypot(dx, dy) || 1; dx /= n; dy /= n;
    for (const o of opps(p.side)) {
      const rx = o.x - p.x, ry = o.y - p.y, d = hypot(rx, ry);
      if (d < 7 && d > 0.01) {
        const ahead = (rx * dx + ry * dy) / d;
        if (ahead > -0.2) { const px = -dy, py = dx; const side = (rx * px + ry * py) > 0 ? -1 : 1; const w = (7 - d) / 7 * 1.5; dx += px * side * w; dy += py * side * w; }
      }
    }
    if (Math.abs(p.x) > 28) dx -= sign(p.x) * 0.9;
    n = hypot(dx, dy) || 1; return [dx / n, dy / n];
  }

  function aiOwner(p, dt) {
    const b = M.ball;
    p.holdT += dt;
    if (p.isGK) { p.wx = p.wy = 0; if (p.holdT > 1.1) keeperDistribute(p); return; }
    p.decideT -= dt;
    const gy = oppGoalY(p.side);
    const dg = hypot(p.x, gy - p.y);
    if (p.decideT > 0 && !(M.state === 'kickoff')) { const [dx, dy] = p.dd || dribbleDir(p); const ms = maxSpeed(p, p.sprint); p.wx = dx * ms; p.wy = dy * ms; return; }
    const react = M.autoplay ? 0.28 : (p.side === 1 ? M.diff.react : 0.28);
    p.decideT = react * rnd(0.7, 1.3);
    if (M.state === 'kickoff') return;
    const press = nearestOppDist(p);
    if (superReady(p) && dg < 33) { doSuper(p); return; }
    const lane = laneSafety(p.x, p.y, 0, gy, p.side);
    let shootP = 0;
    if (dg < 11) shootP = 0.9; else if (dg < 17) shootP = 0.5 * (0.4 + lane); else if (dg < 25) shootP = (0.08 + (p.st.sho > 88 ? 0.06 : 0)) * lane;
    if (Math.abs(p.x) > 20) shootP *= 0.3;
    if (Math.random() < shootP) { doShoot(p, clamp(0.42 + dg / 45, 0.4, 0.9), null); return; }
    const opt = bestPassOption(p, false);
    const thr = bestPassOption(p, true);
    if (p.holdT < 0.35 && press > 2) { /* settle the ball first */ }
    else if (thr && thr.score > 2.0 && Math.random() < 0.3) { doPass(p, thr.t, 'through'); return; }
    else if (opt && press < 2.6 && Math.random() < 0.72) { doPass(p, opt.t, 'ground'); return; }
    else if (opt && opt.score > 1.75 && Math.random() < 0.22) { doPass(p, opt.t, 'ground'); return; }
    else if (opt && p.holdT > 3.2 && Math.random() < 0.55) { doPass(p, opt.t, 'ground'); return; }
    if (press < 2.1 && p.st.dri > 83 && Math.random() < 0.22) doSkill(p);
    p.dd = dribbleDir(p);
    p.sprint = press > 3.5 && dg > 14;
    const ms = maxSpeed(p, p.sprint); p.wx = p.dd[0] * ms; p.wy = p.dd[1] * ms;
  }

  function keeperDistribute(p) {
    const opt = bestPassOption(p, false);
    const fwds = mates(p.side).filter((t) => t.role === 'FWD' || t.role === 'MID');
    if (opt && opt.score > 1.2 && hypot(opt.t.x - p.x, opt.t.y - p.y) < 30) doPass(p, opt.t, 'ground');
    else { const t = fwds[Math.floor(Math.random() * fwds.length)]; if (t) doPass(p, t, 'long'); }
  }

  function aiKeeper(p, dt) {
    const b = M.ball, gy = ownGoalY(p.side), s = sign(gy);
    if (b.owner === p) return aiOwner(p, dt);
    const sh = b.shot;
    if (sh && sh.side !== p.side && (sh.onTarget || sh.super)) {
      const tx = sh.super ? -sh.xc || 0 : clamp(sh.willSave ? sh.xc : sh.xc - sign(sh.xc - p.x) * 1.3, -GW, GW);
      const ty = gy - s * 0.5;
      const dx = tx - p.x;
      const ballT = Math.abs((gy - b.y) / (b.vy || 1e-6));
      if (!p.dive && Math.abs(dx) > 0.9 && ballT < 0.42) { p.dive = 0.9; p.diveDir = sign(dx); }
      const spd = p.dive ? 8 : 6;
      const d = hypot(dx, ty - p.y) || 1; p.wx = dx / d * spd; p.wy = (ty - p.y) / d * spd; p.sprint = true;
      return;
    }
    if (!b.owner && inBox(p.side, b.x, b.y) && b.z < 2.5) {
      const myT = hypot(b.x - p.x, b.y - p.y) / 6.5;
      let oppT = 1e9; for (const o of opps(p.side)) oppT = Math.min(oppT, hypot(b.x - o.x, b.y - o.y) / 7.5);
      if (myT < oppT * 1.1 || hypot(b.vx, b.vy) < 4) { setWant(p, b.x + b.vx * 0.2, b.y + b.vy * 0.2, 0, 0.5); return; }
    }
    const vx = b.x, vy = b.y - gy; const dist = hypot(vx, vy) || 1; const out = clamp(dist * 0.09, 0.8, 5.5);
    let tx = vx / dist * out, ty = gy + vy / dist * out;
    tx = clamp(tx, -GW + 0.6, GW - 0.6);
    setWant(p, tx, ty, 4, 1.2);
  }

  function aiPlayer(p, dt) {
    const b = M.ball;
    if (p.stun > 0 || p.slideT > 0) { p.wx = p.wy = 0; return; }
    if (p.isGK) return aiKeeper(p, dt);
    if (b.owner === p) return aiOwner(p, dt);
    const s = p.side;
    if (M.state === 'kickoff' || M.state === 'setpiece') { const [tx, ty] = M.state === 'kickoff' ? [p.x, p.y] : formationTarget(p, M.sp && M.sp.side === s); setWant(p, tx, ty, 10, 2); return; }
    const owner = b.owner;
    const attacking = owner ? owner.side === s : b.lastSide === s;
    if (!owner) {
      const passToMe = b.pass && b.pass.to === p;
      if (passToMe || p === chaser[s] || (p === cover[s] && hypot(b.x - p.x, b.y - p.y) < 6)) {
        const [ix, iy] = interceptPoint(p);
        setWant(p, ix, iy, 1.5, 0.4); return;
      }
      if (p.runT > 0) { setWant(p, p.rx, p.ry, 2, 1); return; }
      const [tx, ty] = formationTarget(p, attacking); setWant(p, tx, ty, 8, 2); return;
    }
    if (owner.side !== s) {
      const userSide = s === 0 && !M.autoplay;
      if (p === chaser[s]) {
        const gy = ownGoalY(s);
        const tx = owner.x + owner.vx * 0.3, ty = owner.y + owner.vy * 0.3 + sign(gy) * 0.7;
        if (userSide && !IN.pressHeld) {
          const dx = tx - p.x, dy = ty - p.y, d = hypot(dx, dy);
          const hold = 2.4; if (d > hold) setWant(p, tx - dx / d * hold, ty - dy / d * hold, 7, 2); else { p.wx = owner.vx * 0.8; p.wy = owner.vy * 0.8; }
          p.decideT -= dt;
          if (hypot(owner.x - p.x, owner.y - p.y) < 1.6 && p.tackleCd <= 0 && p.decideT <= 0) { p.decideT = 0.4; if (Math.random() < 0.2) tryTackle(p, owner); }
          return;
        }
        setWant(p, tx, ty, 2, 0.3);
        const d = hypot(owner.x - p.x, owner.y - p.y);
        p.decideT -= dt;
        if (d < 1.6 && p.tackleCd <= 0 && p.decideT <= 0) {
          p.decideT = (userSide || M.autoplay ? 0.3 : M.diff.react) * rnd(0.8, 1.3);
          const chance = (userSide ? 0.35 : 0.5) * (M.autoplay ? 1 : (s === 1 ? M.diff.tackle : 1));
          if (Math.random() < chance) tryTackle(p, owner);
        }
        return;
      }
      if (p === cover[s]) {
        const gy = ownGoalY(s); const vx = 0 - owner.x, vy = gy - owner.y, dd = hypot(vx, vy) || 1;
        setWant(p, owner.x + vx / dd * 6, owner.y + vy / dd * 6, 6, 1.5); return;
      }
      const [tx, ty] = formationTarget(p, false); setWant(p, tx, ty, 7, 2); return;
    }
    if (p.runT > 0) { setWant(p, p.rx, p.ry, 1, 0.5); return; }
    const [tx, ty] = formationTarget(p, true);
    setWant(p, tx, ty, 8, 2);
  }

  function interceptPoint(p) {
    const b = M.ball; let x = b.x, y = b.y, vx = b.vx, vy = b.vy, z = b.z, vz = b.vz;
    const ms = maxSpeed(p, true); const step = 0.08;
    for (let t = 0; t < 2.4; t += step) {
      const reachable = hypot(x - p.x, y - p.y) / ms <= t + 0.05;
      if (reachable && z < 1.6) return [x, y];
      const sp = hypot(vx, vy);
      if (z <= 0.01) { const ns = Math.max(0, sp - (DECEL_A + DECEL_K * sp) * step); if (sp > 0) { vx *= ns / sp; vy *= ns / sp; } }
      vz -= G * step; z = Math.max(0, z + vz * step); x += vx * step; y += vy * step;
      if (Math.abs(x) > HW || Math.abs(y) > HL) break;
    }
    return [clamp(x, -HW, HW), clamp(y, -HL, HL)];
  }

  // ------------------------------------------------------------------ input
  const IN = { jx: 0, jy: 0, jOn: false, keys: {}, sprint: false, sprintDownT: 0, shootHeld: false, shootT: 0, pressHeld: false, queue: null, queueT: 0, lastInputT: 0 };
  function inputVec() {
    let x = IN.jx, y = IN.jy;
    const k = IN.keys;
    const kx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
    const ky = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0);
    if (kx || ky) { const n = hypot(kx, ky); x = kx / n; y = ky / n; }
    return [x, y];
  }
  function mode() {
    const b = M.ball;
    if (b.owner) return b.owner.side === 0 ? 'attack' : 'defend';
    return b.lastSide === 0 && (b.pass || b.shot || hypot(b.vx, b.vy) > 1) ? 'attack' : (nearestTo(M.all, b.x, b.y, false).side === 0 ? 'attack' : 'defend');
  }

  function pickPassTarget(c, dx, dy, through) {
    const n = hypot(dx, dy) || 1; dx /= n; dy /= n;
    let best = null, bs = -1e9;
    for (const t of mates(0)) {
      if (t === c) continue;
      const rx = t.x - c.x, ry = t.y - c.y, d = hypot(rx, ry); if (d < 3 || d > 45) continue;
      if (t.isGK && (through || ry * dy < 0 && d > 30)) continue;
      const cos = (rx * dx + ry * dy) / d; if (cos < 0.25) continue;
      const lane = laneSafety(c.x, c.y, t.x, t.y, 0);
      const open = Math.min(nearestOppDist(t), 6) / 6;
      let s = cos * 2.2 + lane * 0.8 + open * 0.4 - (d > 32 ? 0.5 : 0) - (t.isGK ? 1 : 0);
      if (through) s += clamp(-ry / 25, -0.5, 0.8);
      if (s > bs) { bs = s; best = t; }
    }
    return best;
  }
  function userDir(c) { const [x, y] = inputVec(); if (hypot(x, y) > 0.2) return [x, y]; return [Math.cos(c.face), Math.sin(c.face)]; }

  function userAction(a, fromQueue) {
    if (M.autoplay || !M.on || (M.state !== 'play' && M.state !== 'kickoff')) return;
    const c = M.ctrl; if (!c) return;
    const b = M.ball;
    if (M.state === 'kickoff') { if (b.owner !== c) return; M.state = 'play'; Snd.whistle(1); }
    const md = mode();
    if (a === 'pass') {
      if (md === 'attack') {
        if (b.owner === c) { const [dx, dy] = userDir(c); const t = pickPassTarget(c, dx, dy, false); if (t) doPass(c, t, 'ground'); else passIntoSpace(c, dx, dy); }
        else if (!fromQueue) { IN.queue = 'pass'; IN.queueT = M.t; }
      } else switchPlayer();
    } else if (a === 'through') {
      if (md === 'attack') {
        if (b.owner === c) { const [dx, dy] = userDir(c); const t = pickPassTarget(c, dx, dy, true); if (t) doPass(c, t, 'through'); else passIntoSpace(c, dx, dy); }
        else if (!fromQueue) { IN.queue = 'through'; IN.queueT = M.t; }
      }
    } else if (a === 'shoot') {
      if (b.owner === c) { if (superReady(c)) doSuper(c); else doShoot(c, fromQueue ? 0.75 : clamp(0.28 + IN.shootT / 0.95, 0.28, 1), aimFromInput()); }
      else if (!fromQueue && md === 'attack') { IN.queue = 'shoot'; IN.queueT = M.t; }
    } else if (a === 'tackle') {
      const o = b.owner;
      if (o && o.side === 1 && hypot(o.x - c.x, o.y - c.y) < 1.9 && c.tackleCd <= 0) tryTackle(c, o, 0.05);
      else { const [dx, dy] = inputVec(); const tx = (o ? o.x : b.x) - c.x, ty = (o ? o.y : b.y) - c.y; if (hypot(dx, dy) > 0.2) startSlide(c, dx, dy); else startSlide(c, tx, ty); }
    } else if (a === 'skill') {
      if (b.owner === c) doSkill(c);
    }
  }
  function aimFromInput() { const [x] = inputVec(); return Math.abs(x) > 0.25 ? x : null; }

  function switchPlayer() {
    const b = M.ball; const c = M.ctrl;
    const tx = b.owner ? b.owner.x : b.x, ty = b.owner ? b.owner.y : b.y;
    const gy = ownGoalY(0);
    let best = null, bs = 1e9;
    for (const p of mates(0)) {
      if (p.isGK || p === c) continue;
      const d = hypot(p.x - tx, p.y - ty) - ((p.y - ty) * sign(gy) > 0 ? 3 : 0);
      if (d < bs) { bs = d; best = p; }
    }
    if (best) { M.ctrl = best; Snd.click(); }
  }

  function userStep(dt) {
    const c = M.ctrl; if (!c) return;
    const b = M.ball;
    const [jx, jy] = inputVec(); const jm = hypot(jx, jy);
    if (jm > 0.15) IN.lastInputT = M.t;
    if (c.stun > 0 || c.slideT > 0) { c.wx = c.wy = 0; return; }
    if (M.state === 'kickoff') { c.wx = c.wy = 0; if (b.owner === c && jm > 0.3) { M.state = 'play'; Snd.whistle(1); } else return; }
    if (c.isGK) return;
    const md = mode();
    c.sprint = IN.sprint;
    if (md === 'defend' && IN.pressHeld) {
      const tx = b.owner ? b.owner.x + b.owner.vx * 0.25 : b.x + b.vx * 0.3, ty = b.owner ? b.owner.y + b.owner.vy * 0.25 : b.y + b.vy * 0.3;
      setWant(c, tx, ty, 0, 0.3); c.sprint = true; const ms = maxSpeed(c, true); const n = hypot(c.wx, c.wy) || 1; c.wx = c.wx / n * ms; c.wy = c.wy / n * ms;
      if (hypot(tx - c.x, ty - c.y) < 0.3) { c.wx = c.wy = 0; }
    } else if (jm > 0.15) {
      const ms = maxSpeed(c, IN.sprint) * Math.min(1, jm * 1.15);
      c.wx = jx / jm * ms; c.wy = jy / jm * ms;
    } else if (b.pass && b.pass.to === c && !b.owner) {
      const [ix, iy] = interceptPoint(c); setWant(c, ix, iy, 3, 0.4);
    } else if (!b.owner && md === 'attack' && hypot(b.x - c.x, b.y - c.y) < 4 && b.lastTouch !== c) {
      const [ix, iy] = interceptPoint(c); setWant(c, ix, iy, 3, 0.3);
    } else if (md === 'defend' && M.t - IN.lastInputT > 0.8) {
      const o = b.owner; const gy = ownGoalY(0);
      const tx = (o ? o.x : b.x), ty = (o ? o.y : b.y);
      const vx = 0 - tx, vy = gy - ty, d = hypot(vx, vy) || 1;
      setWant(c, tx + vx / d * 4, ty + vy / d * 4, 9, 2); c.wx *= 0.7; c.wy *= 0.7;
    } else { c.wx = 0; c.wy = 0; }
    if (IN.shootHeld && b.owner === c) {
      IN.shootT += dt;
      if (IN.shootT > 1.05) { IN.shootHeld = false; userAction('shoot'); IN.shootT = 0; }
    }
    // auto switch when defending
    if (md === 'defend' && M.t - IN.lastInputT > 0.35 && !IN.pressHeld) {
      M.switchT = (M.switchT || 0) - dt;
      if (M.switchT <= 0) {
        M.switchT = 0.4;
        const tx = b.owner ? b.owner.x : b.x, ty = b.owner ? b.owner.y : b.y;
        const n = nearestTo(mates(0), tx, ty, true);
        if (n && n !== c && hypot(n.x - tx, n.y - ty) + 6 < hypot(c.x - tx, c.y - ty)) M.ctrl = n;
      }
    }
  }

  // ------------------------------------------------------------------ simulation
  function stepPlayers(dt) {
    const b = M.ball;
    for (const p of M.all) {
      p.stun = Math.max(0, p.stun - dt); p.kickCd = Math.max(0, p.kickCd - dt); p.tackleCd = Math.max(0, p.tackleCd - dt);
      p.lunge = Math.max(0, p.lunge - dt); p.runT = Math.max(0, p.runT - dt); p.celebrate = Math.max(0, p.celebrate - dt); p.jump = Math.max(0, p.jump - dt * 2.2);
      if (p.dive > 0) { p.dive = Math.max(0, p.dive - dt); }
      if (p.skillT > 0) {
        p.skillT -= dt;
        const px = -Math.sin(p.face) * p.skillDir, py = Math.cos(p.face) * p.skillDir;
        p.x += px * 3.2 * dt; p.y += py * 3.2 * dt;
      }
      if (p.slideT > 0) {
        p.slideT -= dt; const sp = 9.5 * Math.max(0.15, p.slideT / 0.55);
        p.vx = p.sdx * sp; p.vy = p.sdy * sp; p.x += p.vx * dt; p.y += p.vy * dt;
        if (!p.slid && p.slideT > 0.12) {
          const o = b.owner;
          if (o && o.side !== p.side && hypot(b.x - p.x, b.y - p.y) < 1.4) { p.slid = true; if (!tryTackle(p, o, 0.12)) { p.stun = 0.5; } }
          else if (!o && b.z < 0.8 && hypot(b.x - p.x, b.y - p.y) < 1.3) { p.slid = true; release(p, p.sdx * 14, p.sdy * 14, 1.5, { cd: 0.35 }); }
        }
        if (p.slideT <= 0) p.stun = Math.max(p.stun, 0.35);
        continue;
      }
      // steer toward desired velocity
      const acc = (10 + p.st.phy * 0.05) * (p.isGK && p.dive ? 1.8 : 1);
      let dvx = p.wx - p.vx, dvy = p.wy - p.vy; const dv = hypot(dvx, dvy); const maxDv = acc * dt;
      if (dv > maxDv) { dvx *= maxDv / dv; dvy *= maxDv / dv; }
      p.vx += dvx; p.vy += dvy;
      if (p.stun > 0) { p.vx *= 0.9; p.vy *= 0.9; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const sp = hypot(p.vx, p.vy);
      if (sp > 0.4) {
        const target = Math.atan2(p.vy, p.vx);
        const rate = (b.owner === p ? 6 + p.st.dri * 0.05 : 10) * dt;
        const d = angDiff(p.face, target); p.face += clamp(d, -rate, rate);
      } else if (b.owner !== p && !p.isGK) {
        const target = Math.atan2(b.y - p.y, b.x - p.x); const d = angDiff(p.face, target); p.face += clamp(d, -4 * dt, 4 * dt);
      }
      p.anim += sp * dt * 2.3;
      p.x = clamp(p.x, -HW - 3, HW + 3); p.y = clamp(p.y, -HL - 3, HL + 3);
    }
    // separation
    const A = M.all;
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
      const p = A[i], q = A[j]; const dx = q.x - p.x, dy = q.y - p.y; const d2 = dx * dx + dy * dy;
      if (d2 < 0.72 && d2 > 1e-6) { const d = Math.sqrt(d2); const push = (0.85 - d) * 0.5; const nx = dx / d, ny = dy / d; p.x -= nx * push; p.y -= ny * push; q.x += nx * push; q.y += ny * push; }
    }
  }

  function stepBall(dt) {
    const b = M.ball;
    b.superT = Math.max(0, b.superT - dt);
    if (b.owner) {
      const o = b.owner; const reach = 0.55 + (o.sprint ? 0.25 : 0) + Math.sin(o.anim * 0.5) * 0.08;
      const tx = o.x + Math.cos(o.face) * reach, ty = o.y + Math.sin(o.face) * reach;
      const k = Math.min(1, dt * 18); b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.z = 0; b.vz = 0; b.vx = o.vx; b.vy = o.vy;
      b.spin += hypot(o.vx, o.vy) * dt * 3;
      return;
    }
    const px = b.x, py = b.y, pz = b.z;
    if (b.script) {
      const s = b.script; s.t += dt; const u = Math.min(1, s.t / s.dur), iu = 1 - u;
      const nx = iu * iu * s.p0.x + 2 * iu * u * s.p1.x + u * u * s.p2.x;
      const ny = iu * iu * s.p0.y + 2 * iu * u * s.p1.y + u * u * s.p2.y;
      const nz = lerp(s.z0, s.zt, u) + Math.sin(u * Math.PI) * 1.4;
      b.vx = (nx - b.x) / dt; b.vy = (ny - b.y) / dt; b.vz = (nz - b.z) / dt;
      b.x = nx; b.y = ny; b.z = nz;
      if (u >= 1) { b.script = null; b.vz = 0; }
    } else {
      b.vz -= G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      if (b.curl) { const sp = hypot(b.vx, b.vy); if (sp > 1) { b.vx += -b.vy / sp * b.curl * dt; b.vy += b.vx / sp * b.curl * dt; } }
      if (b.z <= 0) { b.z = 0; if (b.vz < -2.2) { b.vz = -b.vz * 0.45; b.vx *= 0.82; b.vy *= 0.82; } else b.vz = 0; }
      const sp = hypot(b.vx, b.vy);
      if (b.z <= 0.001 && b.vz === 0) { if (sp > 0) { const ns = Math.max(0, sp - (DECEL_A + DECEL_K * sp) * dt); b.vx *= ns / sp; b.vy *= ns / sp; } }
      else { b.vx *= 1 - 0.06 * dt; b.vy *= 1 - 0.06 * dt; }
    }
    b.spin += hypot(b.vx, b.vy) * dt * 3;
    if (b.superT > 0 || (b.shot && hypot(b.vx, b.vy) > 20)) { b.trail.push([b.x, b.y, b.z]); if (b.trail.length > 16) b.trail.shift(); } else if (b.trail.length) b.trail.shift();
    if (M.state === 'goal') { netConstrain(b); return; }
    if (M.state !== 'play') return;
    if (checkGoalLine(px, py, pz)) return;
    if (Math.abs(b.x) > HW + 0.12) { outOfPlay('throw', 1 - b.lastSide, sign(b.x) * HW, clamp(b.y, -HL + 1, HL - 1)); return; }
    keeperSaveCheck();
    if (!b.owner && !b.script) possessionCheck();
  }

  function netConstrain(b) {
    const s = sign(b.y);
    if (Math.abs(b.y) > HL) {
      if (Math.abs(b.y) > HL + 1.9) { b.y = s * (HL + 1.9); b.vy *= -0.15; b.vx *= 0.5; }
      if (Math.abs(b.x) > GW - 0.12) { b.x = sign(b.x) * (GW - 0.12); b.vx *= -0.2; }
      if (b.z > GH - 0.12) { b.z = GH - 0.12; b.vz = Math.min(0, b.vz); }
      b.vx *= 0.96; b.vy *= 0.96;
    }
  }

  function checkGoalLine(px, py, pz) {
    const b = M.ball;
    if (Math.abs(b.y) <= HL) return false;
    const s = sign(b.y); const ly = s * HL;
    const t = (ly - py) / ((b.y - py) || 1e-6);
    const xc = px + (b.x - px) * t, zc = pz + (b.z - pz) * t;
    const goalOwner = s < 0 ? 1 : 0;
    if (Math.abs(xc) < GW - 0.11 && zc < GH - 0.11) { scoreGoal(1 - goalOwner); return true; }
    const nearPost = Math.abs(Math.abs(xc) - GW) < 0.22 && zc < GH + 0.1;
    const nearBar = Math.abs(xc) < GW + 0.1 && Math.abs(zc - GH) < 0.2;
    if (nearPost || nearBar) {
      b.y = ly - s * 0.15; b.vy = -b.vy * 0.55; if (nearPost) b.vx += -sign(xc) * rnd(1, 3); if (nearBar) b.vz = -Math.abs(b.vz) * 0.5 - 1;
      b.shot = null; popup(nearBar ? 'CROSSBAR!' : 'POST!', b.x, b.y, '#FFD166', 16); if (!M.demo) { Snd.post(); Snd.ooh(); }
      return false;
    }
    if (b.shot && !M.demo) Snd.ooh();
    if (b.lastSide === goalOwner) outOfPlay('corner', 1 - goalOwner, sign(xc || 1) * (HW - 0.6), s * (HL - 0.6));
    else outOfPlay('goalkick', goalOwner, 0, s * (HL - 5.5));
    return true;
  }

  function keeperSaveCheck() {
    const b = M.ball, sh = b.shot; if (!sh) return;
    const def = 1 - sh.side; const gk = keeper(def);
    if (gk.stun > 0) return;
    const dy = Math.abs(b.y - gk.y), dx = Math.abs(b.x - gk.x);
    const reachX = gk.dive ? 2.3 : 1.1;
    if (dy < 1.1 && dx < reachX && b.z < 2.7) {
      if (sh.willSave && !sh.super) {
        const speed = hypot(b.vx, b.vy);
        M.stats.saves[def]++;
        if (speed < 22 && b.z < 1.9 && Math.random() < 0.65) { gainBall(gk); popup('SAVED!', gk.x, gk.y, '#2FD3E6', 16); }
        else {
          b.vy = -b.vy * 0.32; b.vx = rnd(-7, 7) + sign(b.x) * 3; b.vz = rnd(1.5, 4.5); b.shot = null; b.lastTouch = gk; b.lastSide = def;
          popup('SAVE!', gk.x, gk.y, '#2FD3E6', 16); gk.kickCd = 0.4;
        }
        if (!M.demo) Snd.ooh();
        sh.willSave = false;
      }
    }
  }

  function possessionCheck() {
    const b = M.ball; let best = null, bd = 1e9;
    const speed = hypot(b.vx, b.vy);
    for (const p of M.all) {
      if (p.stun > 0 || p.kickCd > 0 || p.slideT > 0) continue;
      const d = hypot(b.x - p.x, b.y - p.y);
      const gkBox = p.isGK && inBox(p.side, b.x, b.y);
      if (b.shot && p.isGK && p.side !== b.shot.side) continue;
      const mine = b.pass && b.pass.to === p;
      const r = gkBox ? 1.35 : mine ? 1.1 : 0.95; const zr = gkBox ? 2.7 : mine ? 1.9 : 1.05;
      if (d < r && b.z < zr && d < bd) { bd = d; best = p; }
      // headers
      if (!gkBox && !mine && b.z >= 1.05 && b.z < 2.75 && d < 0.85 && !best) { header(p); return; }
    }
    if (!best) return;
    if (b.pass && b.pass.to === best) { gainBall(best); return; }
    if (speed > 15 && b.lastSide !== best.side) {
      const pc = 0.42 + best.st.def * 0.0042;
      if (Math.random() > pc) { b.vx = b.vx * 0.35 + rnd(-3, 3); b.vy = b.vy * 0.35 + rnd(-3, 3); b.vz = rnd(0, 2.5); best.kickCd = 0.35; b.lastTouch = best; b.lastSide = best.side; b.shot = null; b.pass = null; return; }
    }
    gainBall(best);
  }

  function header(p) {
    const b = M.ball; p.jump = 1; p.kickCd = 0.4;
    const gy = oppGoalY(p.side); const dg = hypot(b.x, gy - b.y);
    b.lastTouch = p; b.lastSide = p.side; b.pass = null; b.script = null;
    if (dg < 20) {
      const tx = rnd(-3, 3), tz = rnd(0.3, 2.2); const speed = 13 + p.st.sho * 0.06;
      const ang = Math.atan2(gy - b.y, tx - b.x) + gauss() * 0.09; const T = dg / speed;
      b.vx = Math.cos(ang) * speed; b.vy = Math.sin(ang) * speed; b.vz = (tz - b.z + 0.5 * G * T * T) / T;
      b.shot = { side: p.side, by: p }; M.stats.shots[p.side]++; decideSave(); popup('HEADER!', p.x, p.y, '#FFFFFF', 13);
    } else {
      const ang = Math.atan2(gy - b.y, -b.x * 0.3) + rnd(-0.5, 0.5);
      b.vx = Math.cos(ang) * 13; b.vy = Math.sin(ang) * 13; b.vz = 4; b.shot = null;
    }
    if (!M.demo) Snd.kick(0.4);
  }

  function scoreGoal(side) {
    const b = M.ball; const lt = b.lastTouch;
    const og = lt && lt.side !== side;
    const scorer = og ? lt : (lt || mates(side)[9]);
    const isSuper = !!(b.shot && b.shot.super);
    M.score[side]++;
    M.events.push({ side, name: scorer.def.short, full: scorer.def.name, min: gameMinute(), og, super: isSuper, star: scorer.star });
    M.state = 'goal'; M.stateT = 2.6; M.goalSide = side;
    if (!og) scorer.celebrate = 3;
    for (const p of mates(side)) if (!p.isGK && p !== scorer) p.celebrate = 2.2;
    M.shake = 0.5;
    if (!M.demo) {
      Snd.goal(); try { navigator.vibrate && navigator.vibrate([60, 40, 120]); } catch (e) { /* no vibration */ }
      Hud.banner(side === 0 ? 'GOAL!' : 'GOAL!', (isSuper ? 'DẾ MÈN SHOT · ' : '') + (og ? 'OWN GOAL · ' : '') + scorer.def.short + ' ' + gameMinute() + "'", isSuper || scorer.star);
      M.replay = { frames: M.replayBuf.slice(-110), i: 0, acc: 0 };
    }
    if (side === M.starSide) addMeter(side, 10);
  }

  function outOfPlay(kind, side, x, y) {
    const b = M.ball;
    b.owner = null; b.vx = b.vy = b.vz = 0; b.z = 0; b.shot = null; b.pass = null; b.script = null; b.curl = 0;
    b.x = kind === 'throw' ? sign(x) * (HW - 0.3) : x; b.y = y;
    let taker;
    if (kind === 'goalkick') taker = keeper(side);
    else taker = nearestTo(mates(side), b.x, b.y, true);
    taker.x = b.x - Math.cos(Math.atan2(-b.y, -b.x)) * 0.6; taker.y = b.y - Math.sin(Math.atan2(-b.y, -b.x)) * 0.6;
    if (kind === 'throw') { taker.x = sign(x) * (HW + 0.4); taker.y = b.y; }
    taker.vx = taker.vy = 0; taker.face = Math.atan2(-taker.y * 0.5, -taker.x);
    b.owner = taker; b.lastTouch = taker; b.lastSide = side;
    M.state = 'setpiece'; M.stateT = M.demo ? 0.5 : 1.1; M.sp = { kind, side, taker };
    if (kind === 'corner') M.cornerT = 5;
    if (!M.autoplay && side === 0 && !taker.isGK) M.ctrl = taker;
    toast(kind === 'throw' ? 'THROW-IN' : kind === 'corner' ? 'CORNER' : 'GOAL KICK', 1.1);
  }

  function executeSetPiece() {
    const sp = M.sp; const p = sp.taker; const b = M.ball;
    M.state = 'play';
    if (b.owner !== p) return;
    if (sp.kind === 'goalkick') { keeperDistribute(p); return; }
    if (sp.kind === 'corner') {
      const gy = oppGoalY(p.side); const tx = rnd(-6, 6), ty = gy - sign(gy) * rnd(6, 11);
      const d = hypot(tx - b.x, ty - b.y); const T = 1.25; const vz = (1.8 + 0.5 * G * T * T) / T;
      const ang = Math.atan2(ty - b.y, tx - b.x); release(p, Math.cos(ang) * d / T, Math.sin(ang) * d / T, vz, { cd: 0.6 });
      return;
    }
    const opt = bestPassOption(p, false);
    let t = opt ? opt.t : nearestTo(mates(p.side), p.x, p.y, true, p);
    if (t && hypot(t.x - p.x, t.y - p.y) > 22) t = nearestTo(mates(p.side), p.x, p.y, true, p);
    if (t) { const d = hypot(t.x - b.x, t.y - b.y); const T = 0.45 + d * 0.035; const ang = Math.atan2(t.y - b.y, t.x - b.x); release(p, Math.cos(ang) * d / T, Math.sin(ang) * d / T, 0.5 * G * T, { pass: { to: t, from: p, kind: 'throw' }, cd: 0.6 }); if (!M.autoplay && p.side === 0 && !t.isGK) M.ctrl = t; }
  }

  function recordFrame() {
    const f = new Float32Array(3 + M.all.length * 7);
    const b = M.ball; f[0] = b.x; f[1] = b.y; f[2] = b.z;
    M.all.forEach((p, i) => { const o = 3 + i * 7; f[o] = p.x; f[o + 1] = p.y; f[o + 2] = p.face; f[o + 3] = p.anim; f[o + 4] = hypot(p.vx, p.vy); f[o + 5] = p.dive ? p.diveDir * (0.5 + p.dive) : 0; f[o + 6] = p.slideT > 0 ? 1 : p.jump > 0 ? 2 : 0; });
    M.replayBuf.push(f); if (M.replayBuf.length > 165) M.replayBuf.shift();
  }
  function applyFrame(f) {
    const b = M.ball; b.x = f[0]; b.y = f[1]; b.z = f[2]; b.owner = null;
    M.all.forEach((p, i) => { const o = 3 + i * 7; p.x = f[o]; p.y = f[o + 1]; p.face = f[o + 2]; p.anim = f[o + 3]; const s = f[o + 4]; p.vx = Math.cos(p.face) * s; p.vy = Math.sin(p.face) * s; p.dive = f[o + 5] ? 0.5 : 0; p.diveDir = sign(f[o + 5]); p.slideT = f[o + 6] === 1 ? 0.3 : 0; p.jump = f[o + 6] === 2 ? 0.5 : 0; p.celebrate = 0; });
  }

  function step(dt) {
    if (!M.on) return;
    M.t += dt;
    M.shake = Math.max(0, M.shake - dt);
    M.cornerT = Math.max(0, M.cornerT - dt);
    for (const pp of M.popups) pp.t += dt;
    M.popups = M.popups.filter((pp) => pp.t < 1.2);
    if (M.toastT > 0) { M.toastT -= dt; if (M.toastT <= 0) $('#toast').hidden = true; }
    switch (M.state) {
      case 'replay': {
        const R = M.replay; R.acc += dt * 0.6;
        while (R.acc >= 1 / 30 && R.i < R.frames.length) { R.acc -= 1 / 30; applyFrame(R.frames[R.i++]); }
        if (R.i >= R.frames.length) endReplay();
        return;
      }
      case 'goal': {
        M.stateT -= dt;
        for (const p of M.all) { if (p.celebrate > 0) { const a = p.slot * 1.3 + M.t; setWant(p, p.x + Math.cos(a) * 3, p.y + Math.sin(a) * 3, 99, 1); } else { p.wx *= 0.9; p.wy *= 0.9; } }
        stepPlayers(dt); stepBall(dt);
        if (M.stateT <= 0) {
          if (M.replay && M.replay.frames.length > 30 && !M.demo) { M.state = 'replay'; Hud.banner(null); $('#replayTag').hidden = false; }
          else afterGoal();
        }
        return;
      }
      case 'setpiece': {
        M.stateT -= dt;
        teamPlanning();
        for (const p of M.all) { if (p === M.sp.taker) { p.wx = p.wy = 0; p.vx = p.vy = 0; continue; } if (!M.autoplay && p === M.ctrl) { userStep(dt); continue; } aiPlayer(p, dt); }
        stepPlayers(dt); stepBall(dt);
        if (M.stateT <= 0) executeSetPiece();
        break;
      }
      case 'kickoff': {
        M.stateT -= dt;
        for (const p of M.all) { p.wx = p.wy = 0; }
        if (!M.autoplay && M.ctrl) userStep(dt);
        stepPlayers(dt); stepBall(dt);
        if (M.stateT <= 0 && (M.autoplay || M.kickoffSide === 1)) {
          M.state = 'play'; if (!M.demo) Snd.whistle(1);
          const tk = M.ball.owner; if (tk) { const t = mates(tk.side)[6]; doPass(tk, t, 'ground'); }
        }
        return;
      }
      case 'play': {
        teamPlanning();
        for (const p of M.all) { if (!M.autoplay && p === M.ctrl) userStep(dt); else aiPlayer(p, dt); }
        stepPlayers(dt); stepBall(dt);
        if (M.state !== 'play') break;
        const b = M.ball; if (b.owner) M.stats.poss[b.owner.side] += dt; else M.stats.poss[b.lastSide] += dt * 0.5;
        if (M.starSide >= 0) addMeter(M.starSide, dt * 1.5);
        if (!M.demo) {
          M.clock += dt;
          const danger = Math.max(0, 1 - Math.min(hypot(b.x, b.y - HL), hypot(b.x, b.y + HL)) / 35);
          Snd.crowdLevel(0.07 + danger * 0.12);
          if (M.clock >= M.halfLen) endHalf();
        }
        break;
      }
      default: return;
    }
    M.recT += dt; if (M.recT >= 1 / 30) { M.recT -= 1 / 30; if (M.state === 'play' || M.state === 'goal') recordFrame(); }
  }

  function endReplay() { $('#replayTag').hidden = true; M.replay = null; afterGoal(); }
  function afterGoal() { M.replayBuf.length = 0; setupKickoff(1 - M.goalSide); Hud.banner(null); }
  function endHalf() {
    Snd.whistle(M.half === 1 ? 2 : 3);
    if (M.half === 1) { M.state = 'halftime'; Hud.result('HALF TIME'); }
    else { M.state = 'fulltime'; Hud.result('FULL TIME'); Snd.crowdLevel(0.04); }
  }
  function secondHalf() { M.half = 2; M.clock = 0; M.replayBuf.length = 0; setupKickoff(1 - M.firstKick); }

  // ------------------------------------------------------------------ rendering
  let crowdPat = null;
  function buildCrowd() {
    const c = document.createElement('canvas'); c.width = 96; c.height = 48; const g = c.getContext('2d');
    g.fillStyle = '#0C1A2B'; g.fillRect(0, 0, 96, 48);
    const cols = ['#5D6F8A', '#8E3A44', '#2E5D8A', '#B9A27A', '#D8D2C4', '#3C4C63'];
    if (M.teams.length) { cols.push(M.teams[0].kit.shirt, M.teams[0].kit.shirt, M.teams[1].kit.shirt); }
    for (let y = 3; y < 48; y += 5) for (let x = (y % 10) ? 2 : 4.5; x < 96; x += 5) { g.fillStyle = cols[Math.floor(Math.random() * cols.length)]; g.beginPath(); g.arc(x + rnd(-0.6, 0.6), y, rnd(1.3, 1.9), 0, 7); g.fill(); }
    crowdPat = ctx.createPattern(c, 'repeat');
  }
  function toCam(x, y, z) { const rx = x - cam.x, ry = y - (cam.y + CAM_BACK), rz = z - CAM_H; return [rx, -ry * SIN_T + rz * COS_T, -ry * COS_T - rz * SIN_T]; }
  const NEAR = 2;
  function projC(c) { return [W / 2 + F * c[0] / c[2], H0 - F * c[1] / c[2]]; }
  function proj(x, y, z) { const c = toCam(x, y, z); if (c[2] < NEAR) return null; const s = projC(c); s.push(c[2]); return s; }
  function clipPoly(pts) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ain = a[2] >= NEAR, bin = b[2] >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
    }
    return out;
  }
  function fillPoly(world, style) {
    const pts = clipPoly(world.map((w) => toCam(w[0], w[1], w[2] || 0))); if (pts.length < 3) return false;
    ctx.beginPath(); pts.forEach((c, i) => { const s = projC(c); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath();
    ctx.fillStyle = style; ctx.fill(); return true;
  }
  function strokeLine(world, closed) {
    const cs = world.map((w) => toCam(w[0], w[1], w[2] || 0));
    const n = closed ? cs.length : cs.length - 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      let a = cs[i], b = cs[(i + 1) % cs.length];
      if (a[2] < NEAR && b[2] < NEAR) continue;
      if (a[2] < NEAR) { const t = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]; }
      else if (b[2] < NEAR) { const t = (NEAR - a[2]) / (b[2] - a[2]); b = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]; }
      const sa = projC(a), sb = projC(b);
      ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]);
    }
    ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
  }

  const LINES = (() => {
    const L = []; const arc = (cx, cy, r, a0, a1, n = 28) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
    L.push({ pts: [[-HW, -HL], [HW, -HL], [HW, HL], [-HW, HL]], closed: true });
    L.push({ pts: [[-HW, 0], [HW, 0]] });
    L.push({ pts: arc(0, 0, 9.15, 0, Math.PI * 2, 48), closed: true });
    for (const s of [-1, 1]) {
      const gy = s * HL;
      L.push({ pts: [[-BOX_W, gy], [-BOX_W, gy - s * BOX_L], [BOX_W, gy - s * BOX_L], [BOX_W, gy]] });
      L.push({ pts: [[-SIX_W, gy], [-SIX_W, gy - s * SIX_L], [SIX_W, gy - s * SIX_L], [SIX_W, gy]] });
      const py = gy - s * 11; const da = Math.acos(5.5 / 9.15);
      const base = s < 0 ? Math.PI / 2 : -Math.PI / 2;
      L.push({ pts: arc(0, py, 9.15, base - da, base + da, 16) });
      for (const cx of [-1, 1]) L.push({ pts: arc(cx * HW, gy, 1, s < 0 ? (cx < 0 ? 0 : Math.PI / 2) : (cx < 0 ? -Math.PI / 2 : Math.PI), s < 0 ? (cx < 0 ? Math.PI / 2 : Math.PI) : (cx < 0 ? 0 : Math.PI * 1.5), 6) });
    }
    return L;
  })();

  function drawBackdrop() {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.5); g.addColorStop(0, '#040C16'); g.addColorStop(1, '#0B2034'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const gx = 0.5 * W - cam.x * 2;
    for (const lx of [gx - 260, gx + 260]) { const rg = ctx.createRadialGradient(lx, 10, 4, lx, 10, 160); rg.addColorStop(0, 'rgba(255,255,240,0.35)'); rg.addColorStop(1, 'rgba(255,255,240,0)'); ctx.fillStyle = rg; ctx.fillRect(lx - 160, -150, 320, 320); }
    // stands
    if (!crowdPat) buildCrowd();
    const sh = (M.state === 'goal' ? Math.sin(M.t * 40) * 1.5 : 0);
    ctx.save(); ctx.translate(0, sh);
    const stands = [
      [[-HW - 12, -HL - 7, 1.2], [HW + 12, -HL - 7, 1.2], [HW + 34, -HL - 42, 26], [-HW - 34, -HL - 42, 26]],
      [[-HW - 7, -HL - 7, 1.2], [-HW - 7, HL + 7, 1.2], [-HW - 42, HL + 34, 26], [-HW - 42, -HL - 34, 26]],
      [[HW + 7, -HL - 7, 1.2], [HW + 7, HL + 7, 1.2], [HW + 42, HL + 34, 26], [HW + 42, -HL - 34, 26]]
    ];
    for (const s of stands) { fillPoly(s, crowdPat); fillPoly(s, 'rgba(4,12,22,0.32)'); }
    ctx.restore();
    // surround + pitch
    fillPoly([[-HW - 8, -HL - 8], [HW + 8, -HL - 8], [HW + 8, HL + 8], [-HW - 8, HL + 8]], '#256F2F');
    const n = 18, L = (2 * HL) / n;
    for (let i = 0; i < n; i++) { const y0 = -HL + i * L; fillPoly([[-HW, y0], [HW, y0], [HW, y0 + L], [-HW, y0 + L]], i % 2 ? '#2F8F3A' : '#37A043'); }
    // lines
    ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.lineJoin = 'round';
    const dC = toCam(cam.x, cam.y, 0)[2];
    ctx.lineWidth = clamp(0.14 * F / dC, 1, 3);
    for (const l of LINES) strokeLine(l.pts, l.closed);
    for (const s of [-1, 1]) { const p = proj(0, s * (HL - 11), 0); if (p) { ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, 7); ctx.fill(); } }
    const c0 = proj(0, 0, 0); if (c0) { ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(c0[0], c0[1], 1.8, 0, 7); ctx.fill(); }
    drawBoards();
  }

  const BOARD_TXT = ['TÔ DẾ FC', 'SUPERSTAR', 'DẾ MÈN', 'FC TÔ DẾ'];
  function drawBoard(x0, y0, x1, y1, i) {
    const h = 0.95;
    const a = toCam(x0, y0, 0), b = toCam(x1, y1, 0), c = toCam(x0, y0, h), d = toCam(x1, y1, h);
    if (a[2] < NEAR || b[2] < NEAR) return;
    const pa = projC(a), pb = projC(b), pc = projC(c), pd = projC(d);
    const lime = i % 2 === 0;
    ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.lineTo(pd[0], pd[1]); ctx.lineTo(pc[0], pc[1]); ctx.closePath();
    ctx.fillStyle = lime ? '#0A1B33' : '#C6F432'; ctx.fill();
    const len = hypot(x1 - x0, y1 - y0);
    if (Math.abs(pb[0] - pa[0]) < 18) return;
    ctx.save();
    ctx.transform((pb[0] - pa[0]) / len, (pb[1] - pa[1]) / len, (pc[0] - pa[0]) / h, (pc[1] - pa[1]) / h, pa[0], pa[1]);
    ctx.scale(0.01, -0.01);
    ctx.fillStyle = lime ? '#C6F432' : '#0A1B33'; ctx.font = '900 62px "Saira Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(BOARD_TXT[i % BOARD_TXT.length], len * 50, -h * 50);
    ctx.restore();
  }
  function drawBoards() {
    const segN = 10, yb = -HL - 4.2;
    for (let i = 0; i < segN; i++) { const x0 = -HW - 6 + i * (2 * HW + 12) / segN; drawBoard(x0, yb, x0 + (2 * HW + 12) / segN, yb, i); }
    for (const s of [-1, 1]) {
      const xb = s * (HW + 3.6); const n = 14;
      for (let i = 0; i < n; i++) { const y0 = -HL - 4 + i * (2 * HL + 8) / n, y1 = y0 + (2 * HL + 8) / n; if (s < 0) drawBoard(xb, y1, xb, y0, i + 1); else drawBoard(xb, y0, xb, y1, i); }
    }
  }

  function drawGoal(s) {
    const gy = s * HL, by = gy + s * 2.0;
    const lw = (d) => clamp(0.13 * F / d * 1.3, 1.2, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8;
    for (let i = 0; i <= 12; i++) { const x = -GW + i * GW * 2 / 12; strokeLine([[x, by, 0], [x, by, 2.0], [x, gy, GH]]); }
    for (let j = 0; j <= 5; j++) { const z = j * 2.0 / 5; strokeLine([[-GW, by, z], [GW, by, z]]); strokeLine([[-GW, gy, z * GH / 2], [-GW, by, z]]); strokeLine([[GW, gy, z * GH / 2], [GW, by, z]]); }
    for (let i = 0; i <= 4; i++) { const t = i / 4; strokeLine([[-GW, lerp(gy, by, t), lerp(GH, 2.0, t)], [-GW, lerp(gy, by, t), 0]]); strokeLine([[GW, lerp(gy, by, t), lerp(GH, 2.0, t)], [GW, lerp(gy, by, t), 0]]); }
    const c = toCam(0, gy, 1); if (c[2] < NEAR) return;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = lw(c[2]); ctx.lineCap = 'round';
    strokeLine([[-GW, gy, 0], [-GW, gy, GH], [GW, gy, GH], [GW, gy, 0]]);
    ctx.lineCap = 'butt';
  }

  function ellipseAt(x, y, rx, ry, style) { ctx.fillStyle = style; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 7); ctx.fill(); }
  function groundRing(x, y, r, stroke, fill, lw = 2) {
    const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r, 0]); }
    const cs = pts.map((w) => toCam(w[0], w[1], 0)); if (cs.some((c) => c[2] < NEAR)) return;
    ctx.beginPath(); cs.forEach((c, i) => { const s = projC(c); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function limb(x0, y0, x1, y1, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  function drawPlayer(p, X, Y, s) {
    const h = 1.8 * s;
    const kit = p.isGK ? p.gkKit : p.kit;
    const sp = hypot(p.vx, p.vy); const run = Math.min(1, sp / 6.5);
    const fy = Math.sin(p.face), fx = Math.cos(p.face);
    const away = fy < -0.15;
    ctx.save();
    ctx.translate(X, Y);
    ellipseAt(0, 0, 0.3 * h, 0.085 * h, 'rgba(0,0,0,0.33)');
    let lift = 0;
    if (p.jump > 0) lift = Math.sin(p.jump * Math.PI) * 0.35 * h;
    if (p.celebrate > 0) lift = Math.abs(Math.sin(M.t * 7 + p.slot)) * 0.12 * h;
    ctx.translate(0, -lift);
    if (p.dive > 0 && p.isGK) { const k = clamp((0.9 - p.dive) / 0.25, 0, 1); ctx.translate(p.diveDir * 0.25 * h * k, -0.18 * h * k); ctx.rotate(p.diveDir * 1.25 * k); }
    else if (p.slideT > 0) { ctx.rotate(sign(fx || 1) * 1.1); ctx.translate(0, 0.1 * h); }
    else if (p.stun > 0.25 && !p.celebrate) ctx.rotate(0.25 * Math.sin(p.slot));
    else if (p.skillT > 0) ctx.rotate(Math.sin(p.skillT * 12) * 0.25);
    const sw = Math.sin(p.anim) * 0.17 * h * run;
    const hipY = -0.46 * h, hipX = 0.07 * h;
    const legW = 0.095 * h;
    const fdx = fx * sw, fdy = fy * sw * 0.45;
    // legs
    limb(-hipX, hipY, -hipX + fdx, -0.02 * h + fdy, legW, kit.socks);
    limb(hipX, hipY, hipX - fdx, -0.02 * h - fdy, legW, kit.socks);
    limb(-hipX, hipY, -hipX + fdx * 0.55, hipY * 0.45 + fdy * 0.5, legW * 1.02, p.def.skin);
    limb(hipX, hipY, hipX - fdx * 0.55, hipY * 0.45 - fdy * 0.5, legW * 1.02, p.def.skin);
    ellipseAt(-hipX + fdx, -0.02 * h + fdy, legW * 0.75, legW * 0.5, '#111');
    ellipseAt(hipX - fdx, -0.02 * h - fdy, legW * 0.75, legW * 0.5, '#111');
    if (p.lunge > 0) limb(hipX, hipY, hipX + fx * 0.35 * h, -0.05 * h + fy * 0.1 * h, legW, kit.socks);
    // shorts
    ctx.fillStyle = kit.shorts; roundRect(-0.16 * h, -0.57 * h, 0.32 * h, 0.14 * h, 0.03 * h); ctx.fill();
    // arms
    const armUp = p.celebrate > 0 || (p.isGK && p.dive > 0);
    const aw = 0.075 * h;
    if (armUp) {
      limb(-0.17 * h, -0.8 * h, -0.27 * h, -1.07 * h, aw, kit.shirt); limb(0.17 * h, -0.8 * h, 0.27 * h, -1.07 * h, aw, kit.shirt);
      ellipseAt(-0.28 * h, -1.09 * h, aw * 0.6, aw * 0.6, p.isGK ? '#F2F2F2' : p.def.skin); ellipseAt(0.28 * h, -1.09 * h, aw * 0.6, aw * 0.6, p.isGK ? '#F2F2F2' : p.def.skin);
    } else {
      limb(-0.18 * h, -0.8 * h, -0.22 * h - fdx * 0.5, -0.58 * h - fdy * 0.6, aw, kit.shirt);
      limb(0.18 * h, -0.8 * h, 0.22 * h + fdx * 0.5, -0.58 * h + fdy * 0.6, aw, kit.shirt);
      ellipseAt(-0.22 * h - fdx * 0.5, -0.56 * h - fdy * 0.6, aw * 0.55, aw * 0.55, p.isGK ? '#F2F2F2' : p.def.skin);
      ellipseAt(0.22 * h + fdx * 0.5, -0.56 * h + fdy * 0.6, aw * 0.55, aw * 0.55, p.isGK ? '#F2F2F2' : p.def.skin);
    }
    // torso
    const tw = 0.38 * h, tx0 = -tw / 2, ty0 = -0.87 * h, th = 0.33 * h;
    ctx.fillStyle = kit.shirt; roundRect(tx0, ty0, tw, th, 0.08 * h); ctx.fill();
    if (kit.shirt2) {
      ctx.save(); roundRect(tx0, ty0, tw, th, 0.08 * h); ctx.clip(); ctx.fillStyle = kit.shirt2;
      const n = 5; for (let i = 0; i < n; i += 2) ctx.fillRect(tx0 + (i + 0.5) * tw / n, ty0, tw / n, th);
      ctx.restore();
    }
    if (p.star) { ctx.strokeStyle = '#FFD166'; ctx.lineWidth = Math.max(1, 0.025 * h); roundRect(tx0, ty0, tw, th, 0.08 * h); ctx.stroke(); }
    if (away && h > 22) { ctx.fillStyle = kit.num; ctx.font = '900 ' + Math.round(0.17 * h) + 'px "Saira Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(p.def.num), 0, ty0 + th * 0.5); }
    // head
    const hr = 0.088 * h, hy = -0.96 * h;
    ctx.fillStyle = p.def.skin; ctx.beginPath(); ctx.arc(0, hy, hr, 0, 7); ctx.fill();
    ctx.fillStyle = p.def.hair; ctx.beginPath();
    if (away) { ctx.arc(0, hy, hr * 1.02, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(hr, hy + hr * 0.5); ctx.arc(0, hy + hr * 0.2, hr, 0, Math.PI); }
    else ctx.arc(0, hy - hr * 0.1, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function drawBall(b) {
    const g = proj(b.x, b.y, 0); if (!g) return;
    const s = F / g[2] * EXAG; const r = Math.max(2.2, 0.13 * s * 1.6);
    ellipseAt(g[0], g[1], r * 1.1, r * 0.45, 'rgba(0,0,0,0.35)');
    if (b.trail.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < b.trail.length; i++) {
        const a = proj(...b.trail[i - 1]), c = proj(...b.trail[i]); if (!a || !c) continue;
        ctx.strokeStyle = b.superT > 0 ? 'rgba(255,209,102,' + (i / b.trail.length * 0.9) + ')' : 'rgba(255,255,255,' + (i / b.trail.length * 0.45) + ')';
        ctx.lineWidth = r * (b.superT > 0 ? 1.6 : 1) * i / b.trail.length; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
      }
    }
    const p = proj(b.x, b.y, b.z * 1.0 + 0.11); if (!p) return;
    if (b.superT > 0) { const rg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 4); rg.addColorStop(0, 'rgba(255,209,102,0.8)'); rg.addColorStop(1, 'rgba(122,43,255,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(p[0], p[1], r * 4, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#1B1410'; const a = b.spin; ctx.beginPath(); ctx.arc(p[0] + Math.cos(a) * r * 0.35, p[1] + Math.sin(a) * r * 0.35, r * 0.38, 0, 7); ctx.fill();
  }

  function label(text, x, y, color, size = 12, bg) {
    ctx.font = '800 ' + size + 'px "Saira Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (bg) { const w = ctx.measureText(text).width + 10; ctx.fillStyle = bg; roundRect(x - w / 2, y - size * 0.62, w, size * 1.25, 4); ctx.fill(); }
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; if (!bg) ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  function applyBaseTransform() { const k = SCALE * DPR; let sx = 0, sy = 0; if (M.shake > 0) { sx = rnd(-1, 1) * M.shake * 8; sy = rnd(-1, 1) * M.shake * 8; } ctx.setTransform(k, 0, 0, k, sx * k, sy * k); }

  let passHint = null, passHintT = 0;
  function render(dt) {
    applyBaseTransform();
    if (!M.on) { ctx.fillStyle = '#06182A'; ctx.fillRect(0, 0, W, H); return; }
    const b = M.ball;
    // camera
    const atk = b.owner ? b.owner.side : b.lastSide;
    cam.bias = lerp(cam.bias || -4, atk === 1 && !M.demo ? 2 : -4, Math.min(1, dt * 1.5));
    let fx = b.x * 0.72, fy = b.y + cam.bias;
    if (M.state === 'kickoff') fy = 2;
    fx = clamp(fx, -HW + 12, HW - 12); fy = clamp(fy, -HL + 6, HL - 9);
    const k = Math.min(1, dt * 3.2); cam.x += (fx - cam.x) * k; cam.y += (fy - cam.y) * k;
    drawBackdrop();
    // ground markers
    const c = M.ctrl;
    if (c && !M.autoplay && M.state !== 'replay') {
      groundRing(c.x, c.y, 1.15, '#C6F432', 'rgba(198,244,50,0.18)', 2.2);
      passHintT -= dt;
      if (passHintT <= 0) { passHintT = 0.1; passHint = (b.owner === c && mode() === 'attack') ? (() => { const [dx, dy] = userDir(c); return pickPassTarget(c, dx, dy, false); })() : null; }
      if (passHint && b.owner === c) groundRing(passHint.x, passHint.y, 1.0, 'rgba(57,184,255,0.95)', null, 1.6);
    }
    if (b.pass && b.pass.to && !b.owner && M.state === 'play') groundRing(b.pass.to.x, b.pass.to.y, 0.9, 'rgba(255,255,255,0.6)', null, 1.2);
    // depth sorted objects
    const objs = [];
    for (const p of M.all) { const cc = toCam(p.x, p.y, 0); if (cc[2] >= NEAR) objs.push({ d: cc[2], p }); }
    for (const s of [-1, 1]) { const cc = toCam(0, s * HL, 1); if (cc[2] >= NEAR) objs.push({ d: cc[2] - (s > 0 ? 0 : 0), goal: s }); }
    const bc = toCam(b.x, b.y, 0); if (bc[2] >= NEAR) objs.push({ d: bc[2] - 0.05, ball: true });
    objs.sort((a, z) => z.d - a.d);
    for (const o of objs) {
      if (o.p) { const sp = projC(toCam(o.p.x, o.p.y, 0)); drawPlayer(o.p, sp[0], sp[1], F / o.d * EXAG); }
      else if (o.goal) drawGoal(o.goal);
      else drawBall(b);
    }
    // overlay labels
    if (c && !M.autoplay && M.state !== 'replay') {
      const sp = proj(c.x, c.y, 0);
      if (sp) {
        const s = F / sp[2] * EXAG; const top = sp[1] - 1.8 * s * 1.08 - 10;
        ctx.fillStyle = '#C6F432'; ctx.beginPath(); ctx.moveTo(sp[0] - 6, top - 6); ctx.lineTo(sp[0] + 6, top - 6); ctx.lineTo(sp[0], top + 3); ctx.closePath(); ctx.fill();
        label(c.star ? '★ ' + c.def.short : c.def.short, sp[0], sp[1] + 14, c.star ? '#FFD166' : '#FFFFFF', 12);
        if (IN.shootHeld && b.owner === c) {
          const pw = clamp(0.28 + IN.shootT / 0.95, 0.28, 1); const bw = 44;
          ctx.fillStyle = 'rgba(6,24,42,0.85)'; roundRect(sp[0] - bw / 2 - 2, top - 20, bw + 4, 9, 4); ctx.fill();
          ctx.fillStyle = pw > 0.94 ? '#E5243B' : '#FF7A1A'; roundRect(sp[0] - bw / 2, top - 18, bw * pw, 5, 2.5); ctx.fill();
        }
      } else {
        // off-screen arrow
        ctx.fillStyle = '#C6F432'; ctx.beginPath(); ctx.moveTo(W / 2 - 10, H - 12); ctx.lineTo(W / 2 + 10, H - 12); ctx.lineTo(W / 2, H - 2); ctx.closePath(); ctx.fill();
      }
    }
    if (b.owner && b.owner !== c && M.state !== 'replay' && !M.demo) {
      const sp = proj(b.owner.x, b.owner.y, 0); if (sp) label(b.owner.def.short, sp[0], sp[1] + 13, b.owner.side === 0 ? '#FFFFFF' : '#D6EEFF', 11);
    }
    for (const pp of M.popups) {
      const sp = proj(pp.x, pp.y, pp.z + pp.t * 2.2); if (!sp) continue;
      ctx.globalAlpha = clamp(1.4 - pp.t, 0, 1);
      label(pp.text, sp[0], sp[1] - 18, pp.color, pp.size);
      ctx.globalAlpha = 1;
    }
    if (M.state === 'replay') { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H); }
    if (!M.demo) { const g = ctx.createLinearGradient(0, H - 330, 0, H); g.addColorStop(0, 'rgba(4,14,10,0)'); g.addColorStop(0.35, 'rgba(4,14,10,0.42)'); g.addColorStop(1, 'rgba(4,14,10,0.72)'); ctx.fillStyle = g; ctx.fillRect(0, H - 330, W, 330); }
  }

  // ------------------------------------------------------------------ HUD
  const mm = $('#minimap'), mctx = mm.getContext('2d');
  const Hud = {
    last: {},
    setup() {
      const [A, B] = M.teams;
      $('#codeA').textContent = A.t.code; $('#codeB').textContent = B.t.code;
      $('#crestA').innerHTML = crestSVG(A.t, 20); $('#crestB').innerHTML = crestSVG(B.t, 20);
      this.last = {};
      const mt = $('#meter');
      mt.hidden = M.starSide < 0; mt.classList.toggle('cpu', M.starSide === 1);
      $('#meterLbl').textContent = M.starSide === 1 ? 'TÔ DẾ (CPU)' : 'SUPERSTAR';
      this.banner(null); $('#replayTag').hidden = true; $('#toast').hidden = true;
    },
    update() {
      if (!M.on || M.demo) return;
      const set = (id, v) => { if (this.last[id] !== v) { this.last[id] = v; $('#' + id).textContent = v; } };
      set('goalsA', String(M.score[0])); set('goalsB', String(M.score[1]));
      const total = (M.half - 1) * 45 * 60 + (M.clock / M.halfLen) * 45 * 60;
      const mins = Math.floor(total / 60), secs = Math.floor(total % 60);
      set('clock', String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'));
      if (M.starSide >= 0) {
        const v = Math.floor(M.meter[M.starSide]);
        if (this.last.meter !== v) { this.last.meter = v; $('#meterFill').style.width = v + '%'; $('#meterPct').textContent = v + '%'; $('#meter').classList.toggle('full', v >= 100); }
      }
      // buttons
      const md = M.autoplay ? 'attack' : mode();
      const c = M.ctrl;
      const sup = c && M.ball.owner === c && superReady(c);
      const key = md + (sup ? 's' : '');
      if (this.last.btn !== key) {
        this.last.btn = key;
        const L = md === 'attack' ? { bPass: ['PASS'], bThrough: ['THROUGH'], bShoot: sup ? ['DẾ MÈN', 'SHOT'] : ['SHOOT'], bSprint: ['SPRINT', '& SKILL'] } : { bPass: ['SWITCH'], bThrough: ['PRESS'], bShoot: ['TACKLE'], bSprint: ['SPRINT'] };
        for (const id in L) $('#' + id).innerHTML = L[id].map((t, i) => '<span class="' + (i ? 'alt' : '') + '">' + t + '</span>').join('');
        $('#bShoot').classList.toggle('super', !!sup);
      }
      this.minimap();
    },
    minimap() {
      const w = 66, h = 96, k = 2; mctx.setTransform(k, 0, 0, k, 0, 0); mctx.clearRect(0, 0, w, h);
      mctx.strokeStyle = 'rgba(255,255,255,0.5)'; mctx.lineWidth = 0.8;
      mctx.strokeRect(2, 2, 62, 92); mctx.beginPath(); mctx.moveTo(2, 48); mctx.lineTo(64, 48); mctx.stroke();
      mctx.beginPath(); mctx.arc(33, 48, 8, 0, 7); mctx.stroke(); mctx.strokeRect(18, 2, 30, 14); mctx.strokeRect(18, 80, 30, 14);
      const mx = (x) => 2 + (x + HW) / (2 * HW) * 62, my = (y) => 2 + (y + HL) / (2 * HL) * 92;
      for (const p of M.all) { mctx.fillStyle = p === M.ctrl ? '#C6F432' : p.side === 0 ? '#FF5A5A' : '#75AADB'; mctx.beginPath(); mctx.arc(mx(p.x), my(p.y), p === M.ctrl ? 2.8 : 1.9, 0, 7); mctx.fill(); }
      mctx.fillStyle = '#FFF'; mctx.beginPath(); mctx.arc(mx(M.ball.x), my(M.ball.y), 1.5, 0, 7); mctx.fill();
    },
    banner(big, sub, gold) {
      const el = $('#banner'); if (!big) { el.hidden = true; return; }
      $('#bannerBig').textContent = big; $('#bannerBig').classList.toggle('sm', big.length > 6);
      const s = $('#bannerSub'); s.textContent = sub || ''; s.hidden = !sub; s.classList.toggle('gold', !!gold);
      el.hidden = false; const bb = $('#bannerBig'); bb.style.animation = 'none'; void bb.offsetWidth; bb.style.animation = '';
    },
    result(title) {
      const [A, B] = M.teams; const S = M.stats;
      $('#rEyebrow').textContent = title;
      $('#rScore').innerHTML = '<div class="tm">' + crestSVG(A.t, 40) + A.t.name + '</div><div class="num">' + M.score[0] + '<i>–</i>' + M.score[1] + '</div><div class="tm">' + crestSVG(B.t, 40) + B.t.name + '</div>';
      const evs = (s) => M.events.filter((e) => e.side === s).map((e) => e.name + ' ' + e.min + "'" + (e.og ? ' (OG)' : '') + (e.super ? ' ★' : '')).join('<br>') || '—';
      $('#rScorers').innerHTML = '<div>' + evs(0) + '</div><div class="r">' + evs(1) + '</div>';
      const pt = S.poss[0] + S.poss[1]; const pa = Math.round(S.poss[0] / pt * 100);
      const row = (lbl, a, b, pct) => { const tot = (a + b) || 1; const wa = pct != null ? pct : a / tot * 100; return '<div class="stat"><span>' + (pct != null ? a + '%' : a) + '</span><div class="mid"><span>' + lbl + '</span><div class="bars"><div class="a" style="width:' + wa + '%"></div><div class="b" style="width:' + (100 - wa) + '%"></div></div></div><span class="r">' + (pct != null ? b + '%' : b) + '</span></div>'; };
      $('#rStats').innerHTML = row('POSSESSION', pa, 100 - pa, pa) + row('SHOTS', S.shots[0], S.shots[1]) + row('ON TARGET', S.onT[0], S.onT[1]) + row('PASSES', S.passOk[0], S.passOk[1]) + row('TACKLES', S.tackles[0], S.tackles[1]);
      const final = title === 'FULL TIME';
      const rb = $('#rBtns');
      if (final) {
        const goals = {}; M.events.forEach((e) => { if (!e.og) { const k = e.side + ':' + e.full; goals[k] = (goals[k] || 0) + 1; } });
        let motm = null, mg = 0; for (const k in goals) if (goals[k] > mg) { mg = goals[k]; motm = k; }
        let name, side;
        if (motm) { side = +motm[0]; name = motm.slice(2); } else { const st = M.all.find((p) => p.star); side = st ? st.side : 0; name = st ? st.def.name : M.teams[0].players[9].def.name; }
        const res = M.score[0] > M.score[1] ? 'YOU WIN' : M.score[0] < M.score[1] ? 'YOU LOSE' : 'DRAW';
        $('#rEyebrow').textContent = 'FULL TIME · ' + res;
        $('#rMotm').innerHTML = '<div class="motm"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z" fill="#FFD166"></path></svg><div><div class="t">PLAYER OF THE MATCH</div><div class="n">' + name + '</div></div></div>';
        rb.innerHTML = '<button type="button" class="btn btn-primary" id="rRematch">REMATCH</button><div class="row2"><button type="button" class="btn btn-ghost" id="rTeams">CHANGE TEAMS</button><button type="button" class="btn btn-ghost" id="rMenu">MENU</button></div>';
        $('#rRematch').onclick = () => { $('#mResult').hidden = true; beginMatch(); };
        $('#rTeams').onclick = () => { $('#mResult').hidden = true; quitToMenu('scrTeams'); };
        $('#rMenu').onclick = () => { $('#mResult').hidden = true; quitToMenu('scrTitle'); };
        if (!M.demo) store.set('record', (() => { const r = store.get('record', { w: 0, d: 0, l: 0 }); if (res === 'YOU WIN') r.w++; else if (res === 'DRAW') r.d++; else r.l++; return r; })());
      } else {
        $('#rMotm').innerHTML = '';
        rb.innerHTML = '<button type="button" class="btn btn-primary" id="rSecond">START 2ND HALF</button>';
        $('#rSecond').onclick = () => { $('#mResult').hidden = true; secondHalf(); };
      }
      $('#mResult').hidden = false;
    }
  };

  // ------------------------------------------------------------------ menus
  function crestSVG(t, size) {
    const [c1, c2, tc] = t.crest;
    return '<svg width="' + size + '" height="' + Math.round(size * 1.05) + '" viewBox="0 0 40 42" aria-hidden="true"><path d="M20 1.5 L37 6.5 V20 C37 30.5 29 37.5 20 40.5 C11 37.5 3 30.5 3 20 V6.5 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2.5"></path><rect x="4.5" y="21" width="31" height="4" fill="' + c2 + '"></rect>' + (size >= 28 ? '<text x="20" y="17" text-anchor="middle" font-family="Saira Condensed, sans-serif" font-weight="900" font-size="10" fill="' + tc + '">' + t.code + '</text>' : '') + '</svg>';
  }
  function portraitSVG(pl, w, h) {
    const shirt = pl.role === 'GK' ? pl.team.gk : pl.team.home.shirt;
    const trim = pl.team.home.shirt2 || pl.team.home.shorts;
    return '<svg class="por" width="' + w + '" height="' + h + '" viewBox="0 0 60 56" aria-hidden="true"><path d="M4 56 C6 40 16 34 30 33 C44 34 54 40 56 56 Z" fill="' + shirt + '"></path><rect x="26" y="25" width="8" height="10" rx="3" fill="' + pl.skin + '"></rect><path d="M24 34 L30 41 L36 34" fill="none" stroke="' + trim + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path><ellipse cx="30" cy="20" rx="10" ry="12" fill="' + pl.skin + '"></ellipse><path d="M20 19 C19 9 25 6 30 6 C36 6 41 10 40 19 C38 14 34 12 30 12 C26 12 22 14 20 19 Z" fill="' + pl.hair + '"></path></svg>';
  }
  function cardHTML(pl, size) {
    const tier = pl.star ? 'star' : pl.ovr >= 90 ? 'elite' : 'gold';
    const dims = size === 'sub' ? [58, 74, 18, 18, 10] : pl.star ? [92, 128, 29, 26, 16] : [72, 100, 22, 22, 12];
    if (app.classList.contains('short') && size !== 'sub') { dims[0] = Math.round(dims[0] * 0.8); dims[1] = Math.round(dims[1] * 0.8); dims[2] = Math.round(dims[2] * 0.85); dims[3] = Math.round(dims[3] * 0.85); dims[4] = Math.round(dims[4] * 0.9); }
    const [w, h, of, nh, nf] = dims;
    const pw = Math.round(w * 0.8), ph = Math.round(pw * 56 / 60);
    return '<div class="card ' + tier + '" style="width:' + w + 'px;height:' + h + 'px"><div class="ovr" style="font-size:' + of + 'px">' + pl.ovr + '</div>' +
      (pl.star ? '<svg class="ss" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z" fill="#FFD166"></path></svg>' : '') +
      '<div style="position:absolute;left:0;right:0;top:' + Math.round(h - nh - ph) + 'px;display:flex;justify-content:center">' + portraitSVG(pl, pw, ph).replace('class="por" ', '') + '</div>' +
      '<div class="nm" style="height:' + nh + 'px;font-size:' + nf + 'px">' + pl.short + '</div></div>';
  }

  const sel = Object.assign({ tab: 'you', you: 'por', opp: 'arg', diff: 'pro', len: 4 }, store.get('sel', {}));
  sel.tab = 'you';
  function saveSel() { store.set('sel', { you: sel.you, opp: sel.opp, diff: sel.diff, len: sel.len }); }

  function show(id) {
    for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
    if (id === 'scrTeams') renderTeams();
    if (id === 'scrSquad') renderSquad();
    if (id === 'scrTitle') renderTitle();
  }
  function renderTitle() {
    const st = TEAMS[0].players[9];
    $('#heroCard').innerHTML = '<div class="big-card"><div class="l"><div class="o">120</div><div class="p">ST</div><svg width="26" height="17" viewBox="0 0 26 17" style="margin-top:4px;border-radius:2px" role="img" aria-label="Portugal"><rect width="10" height="17" fill="#0B6B3A"></rect><rect x="10" width="16" height="17" fill="#C8102E"></rect><circle cx="10" cy="8.5" r="4" fill="#FFD166"></circle></svg></div><div class="badge">SUPERSTAR</div>' +
      '<svg width="170" height="178" viewBox="0 0 160 170" style="position:absolute;left:31px;top:34px" aria-hidden="true"><path d="M8 170 C12 128 40 112 80 110 C120 112 148 128 152 170 Z" fill="#C8102E"></path><path d="M22 170 C24 150 30 140 40 132 M138 170 C136 150 130 140 120 132" fill="none" stroke="#0B6B3A" stroke-width="5"></path><rect x="68" y="86" width="24" height="28" rx="9" fill="#B9805A"></rect><path d="M62 112 L80 134 L98 112" fill="none" stroke="#0B6B3A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path><ellipse cx="52" cy="68" rx="5" ry="8" fill="#B9805A"></ellipse><ellipse cx="108" cy="68" rx="5" ry="8" fill="#B9805A"></ellipse><ellipse cx="80" cy="64" rx="28" ry="33" fill="#C68E63"></ellipse><path d="M51 62 C48 34 64 24 82 25 C102 25 114 38 110 62 C106 48 96 41 82 41 C67 41 57 49 51 62 Z" fill="#1B1410"></path><text x="80" y="160" text-anchor="middle" font-family="Saira Condensed, sans-serif" font-weight="900" font-size="26" fill="#FFFFFF">10</text></svg>' +
      '<div class="n">TÔ DẾ</div><div class="stats">' + [['PAC', st.st.pac], ['SHO', st.st.sho], ['PAS', st.st.pas], ['DRI', st.st.dri], ['DEF', st.st.def], ['PHY', st.st.phy]].map(([k, v]) => '<div><b>' + v + '</b><span>' + k + '</span></div>').join('') + '</div></div>';
  }
  function renderTeams() {
    $('#tabYou').className = 'tab' + (sel.tab === 'you' ? ' on-you' : '');
    $('#tabOpp').className = 'tab' + (sel.tab === 'opp' ? ' on-opp' : '');
    $('#tabYou').setAttribute('aria-selected', sel.tab === 'you'); $('#tabOpp').setAttribute('aria-selected', sel.tab === 'opp');
    $('#teamGrid').innerHTML = TEAMS.map((t) => {
      const you = t.id === sel.you, opp = t.id === sel.opp;
      return '<button type="button" class="team' + (you ? ' you' : opp ? ' opp' : '') + '" data-team="' + t.id + '" aria-pressed="' + (you || opp) + '"><div class="tr">' + crestSVG(t, 44) + '<div class="ov"><b>' + teamOvr(t) + '</b><span>OVR</span></div></div><div><div class="nm">' + t.name + '</div><div class="chips"><span class="chip" style="background:' + t.home.shirt + '"></span><span class="chip" style="background:' + (t.home.shirt2 || t.home.shorts) + '"></span>' + (t.players.some((p) => p.star) ? '<span class="star-pill">TÔ DẾ 120</span>' : '') + '</div></div>' + (you ? '<span class="tag you">YOU</span>' : opp ? '<span class="tag opp">CPU</span>' : '') + '</button>';
    }).join('');
    const A = teamById(sel.you), B = teamById(sel.opp);
    $('#matchup').innerHTML = '<div class="side">' + crestSVG(A, 30) + A.name + '</div><div class="vs">VS</div><div class="side r">' + B.name + crestSVG(B, 30) + '</div>';
    $('#diffPills').innerHTML = Object.keys(DIFFS).map((k) => '<button type="button" class="pill' + (sel.diff === k ? ' on' : '') + '" data-diff="' + k + '" aria-pressed="' + (sel.diff === k) + '">' + DIFFS[k].label + '</button>').join('');
    $('#lenPills').innerHTML = LENGTHS.map((l) => '<button type="button" class="pill' + (sel.len === l.id ? ' on' : '') + '" data-len="' + l.id + '" aria-pressed="' + (sel.len === l.id) + '">' + l.label + '</button>').join('');
  }
  let swapSel = null;
  function renderSquad() {
    const t = teamById(sel.you);
    $('#sqName').textContent = t.name.toUpperCase();
    $('#sqOvr').textContent = teamOvr(t);
    const rows = [[8, 9, 10], [5, 6, 7], [1, 2, 3, 4], [0]];
    $('#sqRows').innerHTML = rows.map((r) => '<div class="frow">' + r.map((slot) => {
      const pl = t.players[t.lineup[slot]];
      return '<button type="button" class="slot" data-slot="' + slot + '" aria-label="' + pl.name + ', ' + POS_ORDER[slot] + ', rated ' + pl.ovr + '">' + cardHTML(pl).replace('class="card ', 'class="card ' + (swapSel === slot ? 'sel ' : '')) + '<span class="pos-pill">' + POS_ORDER[slot] + '</span></button>';
    }).join('') + '</div>').join('');
    $('#sqSubs').innerHTML = t.lineup.slice(11).map((pi, i) => { const pl = t.players[pi]; return '<button type="button" class="slot" data-sub="' + (11 + i) + '" aria-label="Substitute ' + pl.name + ', ' + pl.pos + ', rated ' + pl.ovr + '">' + cardHTML(pl, 'sub') + '<span class="pos-pill">' + pl.pos + '</span></button>'; }).join('');
    $('#sqHint').textContent = swapSel == null ? 'Tap a player, then a sub to swap' : 'Now tap a sub or another player';
  }
  function squadTap(idx) {
    const t = teamById(sel.you);
    if (swapSel == null) { if (idx < 11) swapSel = idx; renderSquad(); return; }
    if (idx === swapSel) { swapSel = null; renderSquad(); return; }
    const a = t.lineup[swapSel]; t.lineup[swapSel] = t.lineup[idx]; t.lineup[idx] = a; swapSel = null;
    store.set('lineup:' + t.id, t.lineup); Snd.click(); renderSquad();
  }

  function beginMatch() {
    for (const s of document.querySelectorAll('.screen')) s.hidden = true;
    $('#mPause').hidden = true; $('#mResult').hidden = true;
    crowdPat = null;
    startMatch({ you: sel.you, opp: sel.opp, diff: sel.diff, len: sel.len });
    buildCrowd();
    $('#hud').hidden = false; $('#controls').hidden = false;
    Ctl.reset(); Hud.update();
    Snd.init(); Snd.whistle(1);
    try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* wake lock unavailable */ }
  }
  function quitToMenu(screen) {
    $('#hud').hidden = true; $('#controls').hidden = true; $('#mPause').hidden = true;
    Snd.crowdLevel(0); startDemo(); show(screen);
  }
  function startDemo() { crowdPat = null; startMatch({ you: 'por', opp: 'arg', demo: true, diff: 'pro', len: 99 }); buildCrowd(); }
  function pause(on) {
    if (!M.on || M.demo) return;
    if (on && (M.state === 'halftime' || M.state === 'fulltime')) return;
    if (on) { M.prevState = M.state; M.state = 'paused'; $('#mPause').hidden = false; Snd.crowdLevel(0.02); }
    else if (M.state === 'paused') { M.state = M.prevState; $('#mPause').hidden = true; Snd.crowdLevel(0.08); }
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    Snd.init();
    if (t.dataset.nav) { Snd.click(); show(t.dataset.nav); return; }
    if (t.dataset.team) {
      const id = t.dataset.team;
      if (sel.tab === 'you') { if (id === sel.opp) sel.opp = sel.you; sel.you = id; } else { if (id === sel.you) sel.you = sel.opp; sel.opp = id; }
      saveSel(); Snd.click(); renderTeams(); return;
    }
    if (t.dataset.diff) { sel.diff = t.dataset.diff; saveSel(); Snd.click(); renderTeams(); return; }
    if (t.dataset.len) { sel.len = +t.dataset.len; saveSel(); Snd.click(); renderTeams(); return; }
    if (t.dataset.slot != null) { squadTap(+t.dataset.slot); return; }
    if (t.dataset.sub != null) { squadTap(+t.dataset.sub); return; }
    if (t.hasAttribute('data-sound')) { Snd.setOn(!Snd.on); renderSound(); return; }
    switch (t.id) {
      case 'goPlay': Snd.click(); show('scrTeams'); break;
      case 'goSquad': Snd.click(); show('scrSquad'); break;
      case 'goQuick': Snd.click(); beginMatch(); break;
      case 'tabYou': sel.tab = 'you'; renderTeams(); break;
      case 'tabOpp': sel.tab = 'opp'; renderTeams(); break;
      case 'goToSquad': Snd.click(); swapSel = null; show('scrSquad'); break;
      case 'goKick': Snd.click(); beginMatch(); break;
      case 'btnPause': pause(true); break;
      case 'pResume': pause(false); break;
      case 'pRestart': $('#mPause').hidden = true; beginMatch(); break;
      case 'pQuit': quitToMenu('scrTitle'); break;
    }
  });
  function renderSound() {
    const on = Snd.on;
    for (const b of document.querySelectorAll('[data-sound]')) {
      b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
      if (b.classList.contains('icon-btn')) b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="stroke" d="M4 9 H8 L13 5 V19 L8 15 H4 Z"></path>' + (on ? '<path class="stroke" d="M16.5 8.5 C18 10 18 14 16.5 15.5 M19 6 C22 9 22 15 19 18"></path>' : '<path class="stroke" d="M17 9 L22 14 M22 9 L17 14"></path>') + '</svg>';
      else b.textContent = on ? 'SOUND: ON' : 'SOUND: OFF';
    }
  }

  // ------------------------------------------------------------------ touch controls
  const Ctl = {
    joyId: null, cx: 0, cy: 0, homeX: 94, homeY: 0,
    home() { this.homeY = H - 128; if (this.joyId == null) this.placeBase(this.homeX, this.homeY); },
    placeBase(x, y) { this.cx = x; this.cy = y; const base = $('#joyBase'), knob = $('#joyKnob'); const z = $('#joyZone').getBoundingClientRect(); const a = app.getBoundingClientRect(); const ox = (z.left - a.left) / SCALE, oy = (z.top - a.top) / SCALE; base.style.left = (x - ox) + 'px'; base.style.top = (y - oy) + 'px'; knob.style.left = (x - ox) + 'px'; knob.style.top = (y - oy) + 'px'; this.ox = ox; this.oy = oy; },
    knob(dx, dy) { const k = $('#joyKnob'); k.style.left = (this.cx - this.ox + dx) + 'px'; k.style.top = (this.cy - this.oy + dy) + 'px'; const arc = $('#joyArc'); if (dx || dy) { arc.style.opacity = 1; arc.style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI + 45) + 'deg)'; } else arc.style.opacity = 0.35; },
    reset() { this.joyId = null; IN.jx = IN.jy = 0; IN.sprint = false; IN.shootHeld = false; IN.pressHeld = false; this.home(); this.knob(0, 0); for (const b of document.querySelectorAll('.cbtn')) b.classList.remove('down'); }
  };
  function toLocal(e) { const a = app.getBoundingClientRect(); return [(e.clientX - a.left) / SCALE, (e.clientY - a.top) / SCALE]; }
  const zone = $('#joyZone');
  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault(); Snd.init(); if (Ctl.joyId != null) return;
    Ctl.joyId = e.pointerId; try { zone.setPointerCapture(e.pointerId); } catch (er) { /* capture unsupported */ }
    const [x, y] = toLocal(e); Ctl.placeBase(x, y); Ctl.knob(0, 0);
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== Ctl.joyId) return; e.preventDefault();
    const [x, y] = toLocal(e); let dx = x - Ctl.cx, dy = y - Ctl.cy; const d = hypot(dx, dy), R = 52;
    if (d > R) { dx *= R / d; dy *= R / d; }
    Ctl.knob(dx, dy); const m = Math.min(1, d / R);
    if (d > 6) { IN.jx = dx / Math.max(1, hypot(dx, dy)) * m; IN.jy = dy / Math.max(1, hypot(dx, dy)) * m; } else { IN.jx = IN.jy = 0; }
  });
  const joyEnd = (e) => { if (e.pointerId !== Ctl.joyId) return; Ctl.joyId = null; IN.jx = IN.jy = 0; Ctl.placeBase(Ctl.homeX, Ctl.homeY); Ctl.knob(0, 0); };
  zone.addEventListener('pointerup', joyEnd); zone.addEventListener('pointercancel', joyEnd);

  function btnDown(id) {
    if (M.state === 'replay') { endReplay(); return; }
    const md = mode();
    if (id === 'bShoot') { if (md === 'attack') { if (M.ball.owner === M.ctrl && !superReady(M.ctrl)) { IN.shootHeld = true; IN.shootT = 0; } else userAction('shoot'); } else userAction('tackle'); }
    else if (id === 'bPass') userAction('pass');
    else if (id === 'bThrough') { if (md === 'attack') userAction('through'); else IN.pressHeld = true; }
    else if (id === 'bSprint') { IN.sprint = true; IN.sprintDownT = performance.now(); }
  }
  function btnUp(id) {
    if (id === 'bShoot' && IN.shootHeld) { IN.shootHeld = false; userAction('shoot'); IN.shootT = 0; }
    else if (id === 'bThrough') IN.pressHeld = false;
    else if (id === 'bSprint') { IN.sprint = false; if (performance.now() - IN.sprintDownT < 220 && M.ball.owner === M.ctrl) userAction('skill'); }
  }
  for (const b of document.querySelectorAll('.cbtn')) {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); Snd.init(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* capture unsupported */ } b.classList.add('down'); btnDown(b.id); });
    const up = (e) => { e.preventDefault(); if (!b.classList.contains('down')) return; b.classList.remove('down'); btnUp(b.id); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  $('#controls').addEventListener('pointerdown', (e) => { if (M.state === 'replay') endReplay(); });
  const KEYMAP = { KeyJ: 'bPass', KeyK: 'bThrough', KeyL: 'bShoot', ShiftLeft: 'bSprint', ShiftRight: 'bSprint' };
  window.addEventListener('keydown', (e) => {
    if (!M.on || M.demo) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { pause(M.state !== 'paused'); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    IN.keys[e.code] = true; IN.lastInputT = M.t;
    if (KEYMAP[e.code]) btnDown(KEYMAP[e.code]);
    if (e.code === 'KeyE') userAction('skill');
    if (e.code === 'Space' && M.state === 'replay') endReplay();
  });
  window.addEventListener('keyup', (e) => { IN.keys[e.code] = false; if (KEYMAP[e.code]) btnUp(KEYMAP[e.code]); });
  window.addEventListener('blur', () => { IN.keys = {}; Ctl.reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  window.addEventListener('resize', layout);

  // ------------------------------------------------------------------ loop
  let lastT = performance.now(), acc = 0, hudT = 0;
  const STEP = 1 / 60;
  function frame(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    const slowK = M.slow > 0 ? 0.35 : 1; if (M.slow > 0) M.slow -= dt;
    acc += dt * slowK * M.timeScale;
    let n = 0; const maxN = 8 * Math.max(1, M.timeScale);
    while (acc >= STEP && n < maxN) { step(STEP); acc -= STEP; n++; }
    if (n >= maxN) acc = 0;
    render(dt);
    hudT -= dt; if (hudT <= 0) { hudT = 1 / 20; Hud.update(); }
    requestAnimationFrame(frame);
  }

  // debug / test hook
  window.__fc = { M, IN, start: (o) => { for (const s of document.querySelectorAll('.screen')) s.hidden = true; $('#hud').hidden = false; $('#controls').hidden = false; startMatch(o); buildCrowd(); Ctl.reset(); }, speed: (v) => { M.timeScale = v; }, show, step };

  layout(); renderSound(); startDemo(); show('scrTitle');
  requestAnimationFrame(frame);
})();
