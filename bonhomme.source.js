/* Easter egg : bonhomme bâton façon dessin d'enfant (traits « boiling »), rig procédural.
   Canvas fixe, pointer-events: none, aucune dépendance. Ignoré tant qu'une animation est en cours. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:9998';
  const ctx = cv.getContext('2d');
  let dpr = 1, raf = 0, S = null;
  // taille = viewport visuel exact (100vh ≠ innerHeight sur mobile : barre d'adresse) → coordonnées getBoundingClientRect justes
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; };
  addEventListener('resize', size);

  // ── squelette (unités ; 1 u ≈ 1,3 px → ~42 px de haut) ──
  const K = 1.3, TH = 7.6, SN = 7.6, TORSO = 10, UA = 5.6, FA = 5.4, HEADR = 4.3, STAND = 14.6;
  const sin = Math.sin, cos = Math.cos, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k * k * (3 - 2 * k), eOut = k => 1 - (1 - k) * (1 - k);
  // IK 2 segments ; side = +1 genou vers l'avant, −1 coude vers l'arrière
  function ik(a, t, l1, l2, side) {
    let dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy);
    const m = l1 + l2 - .01; if (d > m) { dx *= m / d; dy *= m / d; d = m; }
    const base = Math.atan2(dy, dx), ang = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d || 1), -1, 1));
    const q = base - side * ang;
    return [[a[0] + l1 * cos(q), a[1] + l1 * sin(q)], [a[0] + dx, a[1] + dy]];
  }
  const armA = (s, a, b) => { const e = [s[0] + UA * sin(a), s[1] + UA * cos(a)]; return [e, [e[0] + FA * sin(a + b), e[1] + FA * cos(a + b)]]; };

  // pose = { lean, tilt, fl, fr (pieds rel. à la hanche), kl?, kr?, al:[a,b] | hl:[x,y], ar | hr }
  function rig(p) {
    const H = [0, 0], N = [TORSO * sin(p.lean), -TORSO * cos(p.lean)], Sh = [N[0] * .86, N[1] * .86];
    const hd = [N[0] + 5.4 * sin(p.lean + (p.tilt || 0)), N[1] - 5.4 * cos(p.lean + (p.tilt || 0))];
    const L = p.kl ? [p.kl, p.fl] : ik(H, p.fl, TH, SN, 1), R = p.kr ? [p.kr, p.fr] : ik(H, p.fr, TH, SN, 1);
    const AL = p.hl ? ik(Sh, p.hl, UA, FA, -1) : armA(Sh, p.al[0], p.al[1]);
    const AR = p.hr ? ik(Sh, p.hr, UA, FA, -1) : armA(Sh, p.ar[0], p.ar[1]);
    return { H, N, Sh, hd, L, R, AL, AR };
  }

  // traits tremblants : 3 jeux de bruit, changés toutes les 90 ms
  const noise = Array.from({ length: 3 }, () => Array.from({ length: 48 }, () => (Math.random() - .5) * 1.3));
  const ink = () => document.documentElement.getAttribute('data-theme') !== 'light' ? '#f2f5e8' : '#0f100c';
  // dessine ; (x, y) = hanche en px écran ; rot autour de la hanche
  function draw(p, x, y, o = {}) {
    const r = rig(p), N = noise[Math.floor(performance.now() / 90) % 3]; let k = 0; const j = () => N[k++ % N.length];
    ctx.save(); ctx.translate(x * dpr, y * dpr); ctx.rotate(o.rot || 0);
    ctx.scale(K * (o.sx || 1) * (o.flip || 1) * dpr, K * (o.sy || 1) * dpr);
    ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = 1.55; ctx.strokeStyle = ink();
    const seg = (a, b) => { ctx.beginPath(); ctx.moveTo(a[0] + j() * .35, a[1] + j() * .35);
      ctx.quadraticCurveTo((a[0] + b[0]) / 2 + j() * .8, (a[1] + b[1]) / 2 + j() * .8, b[0] + j() * .35, b[1] + j() * .35); ctx.stroke(); };
    seg(r.H, r.N);
    seg(r.H, r.L[0]); seg(r.L[0], r.L[1]); seg(r.H, r.R[0]); seg(r.R[0], r.R[1]);
    seg(r.Sh, r.AL[0]); seg(r.AL[0], r.AL[1]); seg(r.Sh, r.AR[0]); seg(r.AR[0], r.AR[1]);
    ctx.beginPath(); ctx.ellipse(r.hd[0] + j() * .25, r.hd[1] + j() * .25, HEADR + j() * .15, HEADR * .94 + j() * .15, j() * .2, 0, 7); ctx.stroke();
    ctx.restore();
    // cou en coordonnées écran (ancrage de l'écharpe)
    const c = cos(o.rot || 0), s = sin(o.rot || 0), nx = r.N[0] * K * (o.sx || 1) * (o.flip || 1), ny = r.N[1] * K * (o.sy || 1);
    return [x + nx * c - ny * s, y + nx * s + ny * c];
  }

  // ── écharpe : chaîne de 5 points (Verlet) accrochée au cou ──
  const scarf = { p: [], init(a) { this.p = Array.from({ length: 5 }, (_, i) => ({ x: a[0] - i * 2.6, y: a[1], px: a[0] - i * 2.6, py: a[1] })); },
    step(a, dt) { if (!this.p.length) this.init(a); const P = this.p; P[0].x = a[0]; P[0].y = a[1];
      for (let i = 1; i < P.length; i++) { const q = P[i], vx = (q.x - q.px) * .9, vy = (q.y - q.py) * .9; q.px = q.x; q.py = q.y;
        q.x += vx + Math.sin(performance.now() / 160 + i) * .06; q.y += vy + 1100 * dt * dt; }
      for (let n = 0; n < 4; n++) for (let i = 1; i < P.length; i++) { const a2 = P[i - 1], b = P[i], dx = b.x - a2.x, dy = b.y - a2.y, d = Math.hypot(dx, dy) || 1, f = (d - 2.9) / d;
        if (i > 1) { a2.x += dx * f * .5; a2.y += dy * f * .5; b.x -= dx * f * .5; b.y -= dy * f * .5; } else { b.x -= dx * f; b.y -= dy * f; } } },
    draw() { const P = this.p; if (P.length < 2) return; ctx.save(); ctx.strokeStyle = '#c6ff1a'; ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(P[0].x * dpr, P[0].y * dpr);
      for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i].x * dpr, P[i].y * dpr, (P[i].x + P[i + 1].x) / 2 * dpr, (P[i].y + P[i + 1].y) / 2 * dpr);
      const L = P[P.length - 1]; ctx.lineTo(L.x * dpr, L.y * dpr); ctx.stroke(); ctx.restore(); } };

  // ── poussière / onde de choc / traînées ──
  let fx = [];
  const dust = (x, y, n, sp = 60) => { for (let i = 0; i < n; i++) fx.push({ t: 'd', x: x + (Math.random() - .5) * 4, y, vx: (Math.random() - .5) * sp * 2, vy: -(10 + Math.random() * sp * .7), a: .9 }); };
  function drawFx(dt) {
    const dark = ink() === '#f2f5e8';
    fx = fx.filter(f => {
      if (f.t === 'd') { f.vy += 160 * dt; f.x += f.vx * dt; f.y = Math.min(f.g ?? f.y + 99, f.y + f.vy * dt); f.vx *= .95; f.a -= dt * 1.7;
        ctx.globalAlpha = Math.max(0, f.a) * .7; ctx.fillStyle = dark ? '#a9ad9f' : '#4a4d42'; ctx.fillRect(f.x * dpr, (f.y - 1) * dpr, 1.6 * dpr, 1.6 * dpr); return f.a > 0; }
      if (f.t === 'w') { f.k += dt / .38; ctx.globalAlpha = (1 - f.k) * .8; ctx.strokeStyle = '#c6ff1a'; ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath(); ctx.ellipse(f.x * dpr, f.y * dpr, (4 + 36 * f.k) * dpr, (1.5 + 5 * f.k) * dpr, 0, Math.PI, 2 * Math.PI); ctx.stroke(); return f.k < 1; }
      if (f.t === 's') { f.a -= dt * 4; ctx.globalAlpha = Math.max(0, f.a) * .55; ctx.strokeStyle = ink(); ctx.lineWidth = 1 * dpr;
        ctx.beginPath(); ctx.moveTo(f.x * dpr, f.y * dpr); ctx.lineTo((f.x - f.vx * .045) * dpr, (f.y - f.vy * .045) * dpr); ctx.stroke(); return f.a > 0; }
    }); ctx.globalAlpha = 1;
  }
  function shake(el) { if (!el) return; const t0 = performance.now(), tr = el.style.transition; el.style.transition = 'none';
    (function f(n) { const k = (n - t0) / 140; if (k >= 1) { el.style.transform = ''; el.style.transition = tr; return; }
      el.style.transform = `translate(${(Math.random() - .5) * 2 * (1 - k)}px,${(1 - k) * 1.5 * Math.sin(k * 20)}px)`; requestAnimationFrame(f); })(t0); }

  // ── poses de référence ──
  const standP = (h = 0) => ({ lean: .05, tilt: h, fl: [-2.5, STAND], fr: [2.5, STAND], al: [-.15, .35], ar: [.15, .45] });
  const heroP = up => ({ lean: .72, tilt: lerp(.75, .1, up), kl: [-2, 7.6], fl: [-10, 8.6], fr: [7, 8.6], hr: [10.5, 8.6], al: [-2.3, .25] });
  function runP(ph, accel) { // cinématique de course, phase ph (rad)
    const leg = q => { const sw = sin(q); return [6.6 * cos(q), STAND - .6 - (sw > 0 ? sw * 5.4 : 0)]; };
    return { lean: .28 + accel * .22, tilt: -.1, fl: leg(ph), fr: leg(ph + Math.PI),
      al: [-1.0 * cos(ph + Math.PI) + .15, 1.55], ar: [-1.0 * cos(ph) + .15, 1.55] };
  }
  const rect = sel => { const e = document.querySelector(sel); return e && e.getBoundingClientRect(); };
  const top = r => r.top + 1;

  function play() {
    if (raf) return;            // animation en cours : on ignore le clic, rejouable seulement une fois finie
    if (!cv.isConnected) { document.body.appendChild(cv); size(); }
    fx = []; scarf.p = [];
    const t0 = performance.now();
    size();
    // boutons hors écran : on les amène au centre d'abord (défilement doux, instantané en mouvement réduit)
    const em = rect('.email'), li = rect('.linkedin');
    const vis = r => r && r.top >= 40 && r.bottom <= innerHeight - 8;
    let phase = reduce.matches ? 'still' : 'fall';
    if (em && li && !(vis(em) && vis(li))) {
      document.querySelector('.email').scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
      if (!reduce.matches) phase = 'wait';
    }
    // la chute part juste au-dessus du haut de l'écran visible
    S = { phase, next: reduce.matches ? 'still' : 'fall', t: t0, last: t0, x: 0, y: -40, vx: 0, vy: 0, rot: 0, ph: 0, v: 0, py: null, calm: 0 };
    raf = requestAnimationFrame(step);
  }
  function step(now) {
    const s = S, dt = Math.min(1 / 30, (now - s.last) / 1000); s.last = now;
    const em = rect('.email'), li = rect('.linkedin');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    if (!em || !li) { raf = 0; return; }
    const pt = (now - s.t) / 1000, go = p => { s.phase = p; s.t = now; };
    const G = 2300, gy = top(em), ly = top(li), stacked = Math.abs(li.top - em.top) > 10;
    let neck = null;
    switch (s.phase) {
      case 'wait': { // attend la fin du défilement (position stable 6 images, ou 1,2 s max)
        s.calm = s.py !== null && Math.abs(em.top - s.py) < .5 ? s.calm + 1 : 0; s.py = em.top;
        if (s.calm >= 6 || pt > 1.2) go(s.next); break; }
      case 'still': { ctx.globalAlpha = clamp(Math.min(pt / .2, (1.4 - pt) / .3), 0, 1);
        neck = draw(standP(pt % .6 < .3 ? 0 : -.3), em.left + 30, gy - STAND * K); ctx.globalAlpha = 1;
        if (pt > 1.4) { ctx.clearRect(0, 0, cv.width, cv.height); raf = 0; return; } break; }
      case 'fall': { s.x = em.left + 28; s.vy += G * dt; s.y += s.vy * dt;
        const hipY = gy - 9 * K;
        if (s.y >= hipY) { s.y = hipY; go('hero'); shake(document.querySelector('.email'));
          fx.push({ t: 'w', x: s.x + 10.5 * K, y: gy, k: 0 }); dust(s.x + 10.5 * K, gy, 10, 70); fx.forEach(f => f.g = gy); }
        neck = draw({ lean: -.05, tilt: -.2, fl: [-3, 14], fr: [3, 12.5], al: [2.6, .4], ar: [2.9, .3] }, s.x, s.y); break; }
      case 'hero': { // réception légendaire : tenue 360 ms tête baissée, tête relevée, redressement
        const imp = Math.min(1, pt / .09), sq = sin(imp * Math.PI) * .12;
        if (pt < .52) neck = draw(heroP(pt < .36 ? 0 : ease((pt - .36) / .16)), s.x, gy - 9 * K, { sy: 1 - sq, sx: 1 + sq * .6 });
        else { const k = ease(Math.min(1, (pt - .52) / .22)), a = heroP(1), b = runP(0, 1);
          const hipH = lerp(9, STAND - .6, k);
          neck = draw({ lean: lerp(a.lean, b.lean, k), tilt: lerp(.1, -.1, k), fl: [lerp(-10, b.fl[0], k), hipH], fr: [lerp(7, b.fr[0], k), hipH],
            al: [lerp(-2.3, b.al[0], k), lerp(.25, 1.55, k)], ar: [lerp(.6, b.ar[0], k), 1.55] }, s.x, gy - hipH * K);
          if (k >= 1) { s.v = 0; s.ph = 0; go('run'); } }
        break; }
      case 'run': { // sprint : grande foulée, phase de vol, pieds fixes au sol pendant l'appui
        const R = s.R || (s.R = { P: 0, foot: [null, null], prevU: [0, .5], hipX: s.x });
        const end = stacked ? Math.min(em.right - 16, em.left + Math.max(120, em.width * .5)) : em.right - 16, a = 1 - Math.exp(-pt / .32);          // montée en régime
        const STEP = 56 * lerp(.55, 1, a), CAD = lerp(2.1, 2.8, a);      // px par pas, pas par seconde (≈1,3 × la taille)
        const v = STEP * CAD * clamp((end - s.x) / 25 + .25, 0, 1);      // freine juste avant le bord
        R.P += CAD * dt; s.x = Math.min(end, s.x + v * dt);
        const SF = .17, REACH = 4;                                     // part d'appui dans le cycle d'une jambe (2 pas)
        const sp = R.P % 1, flight = sp > 2 * SF;
        const h = 13.2 + (flight ? 2.6 * sin(Math.PI * (sp - 2 * SF) / (1 - 2 * SF)) : -.7 * sin(Math.PI * sp / (2 * SF)));
        const KEYS = [[.42, -8.8, 8.2], [.62, 1.2, 9.6], [.82, 7.6, 4.6], [1, REACH, 0]]; // talon-fesse, genou haut, attaque
        const feet = [0, 1].map(i => {
          const u = ((R.P + i) / 2) % 1;
          if (u < R.prevU[i]) { R.foot[i] = s.x + REACH * K; dust(R.foot[i], gy, 3, 40); fx.forEach(f => f.g ??= gy); }  // pose du pied
          R.prevU[i] = u;
          if (u < SF && R.foot[i] != null) return [(R.foot[i] - s.x) / K, h];               // appui : le pied ne glisse pas
          if (R.foot[i] == null) R.foot[i] = s.x - 6 * K * (i ? -1 : 1);
          const toe = [(R.foot[i] - s.x) / K, 0];
          if (u < SF) return [toe[0], h];
          let k0 = [SF, toe[0], 0];
          for (const kk of KEYS) { if (u <= kk[0]) { const q = ease((u - k0[0]) / (kk[0] - k0[0])); return [lerp(k0[1], kk[1], q), h - lerp(k0[2], kk[2], q)]; } k0 = kk; }
          return [REACH, h]; });
        const uL = (R.P / 2) % 1, uR = ((R.P + 1) / 2) % 1;
        const arm = u => [.15 + 1.45 * cos(2 * Math.PI * (u - .9)), 1.75 - .35 * cos(2 * Math.PI * (u - .9))];
        neck = draw({ lean: .3 + .2 * (1 - a), tilt: -.12, fl: feet[0], fr: feet[1], al: arm(uR), ar: arm(uL) }, s.x, gy - h * K);
        if (end - s.x < .5) { s.R = null; s.from = [s.x, gy]; go('antic'); } break; }
      case 'antic': { // anticipation : on s'accroupit, bras en arrière
        const k = ease(Math.min(1, pt / .14)), hipH = lerp(STAND - .6, 9.5, k);
        neck = draw({ lean: lerp(.3, .55, k), tilt: -.15, fl: [-2.5, hipH], fr: [3.5, hipH], al: [lerp(.2, -1.9, k), .3], ar: [lerp(-.2, -1.7, k), .4] }, s.x, gy - hipH * K);
        if (k >= 1) {
          // côte à côte : saut vers la gauche du second bouton ; empilés : petit bond en avant vers le bas (ou plus haut si LinkedIn est au-dessus)
          const tx = stacked ? Math.min(li.right - 70, Math.max(li.left + 22, s.x + 64)) : li.left + 22;
          const up = Math.max(0, gy - ly);
          s.jump = { x0: s.x, y0: gy, x1: tx, y1: ly, T: stacked ? .46 + up / 900 : .56, h: stacked ? 22 + up * .6 : 50 }; go('air'); } break; }
      case 'air': { // impulsion étirée → parabole jambes repliées → descente
        const J = s.jump, k = Math.min(1, pt / J.T), x = lerp(J.x0, J.x1, k);
        const yFeet = lerp(J.y0, J.y1, k) - 4 * J.h * k * (1 - k);
        const st = clamp(1 - k / .16, 0, 1);              // étirement à l'impulsion
        const tuck = sin(clamp((k - .1) / .75, 0, 1) * Math.PI);
        const hipH = lerp(STAND + 1, 8.5, tuck);
        s.y = yFeet - hipH * K; s.xa = x;
        neck = draw({ lean: lerp(.55, .2, clamp(k / .5, 0, 1)) - .1 * tuck, tilt: k > .6 ? .3 : -.25, fl: [lerp(-3, 1, tuck), hipH], fr: [lerp(2, 5, tuck), hipH - tuck * 1.5],
          al: [lerp(2.6, 1.2, k), .5], ar: [lerp(2.9, -.6, k), .6] }, x, yFeet - hipH * K, { sy: 1 + st * .14, sx: 1 - st * .07, flip: J.x1 < J.x0 ? -1 : 1 });
        if (k >= 1) { s.x = J.x1; dust(s.x, ly, 6, 45); fx.forEach(f => f.g ??= ly); go('absorb'); } break; }
      case 'absorb': { // réception amortie
        const k = Math.min(1, pt / .24), d = sin(k * Math.PI) * (1 - k * .3), hipH = STAND - .6 - d * 5;
        neck = draw({ lean: .25 + d * .4, tilt: -.1, fl: [-2.5, hipH], fr: [3, hipH], al: [.6 - d, 1], ar: [-.4 + d * .5, 1] }, s.x, ly - hipH * K);
        if (k >= 1) go('edge'); break; }
      case 'edge': { // avance jusqu'au bord, freine
        const end = li.right - 14; const v = clamp((end - s.x) * 5, 0, 150); s.x += v * dt;
        const prev = s.ph; s.ph += v / 25 * dt * 3;
        neck = draw(runP(s.ph, .4), s.x, ly - (STAND - .6) * K);
        if (end - s.x < 1.5) go('hesit'); break; }
      case 'hesit': { // hésitation : regard vers le bas, petit déséquilibre
        const w = sin(pt * 14) * .06 * (pt < .3 ? 1 : 0);
        neck = draw({ lean: .12 + w, tilt: 1.25, fl: [-2.5, STAND], fr: [2.5, STAND], al: [.4 + w * 4, .5], ar: [-.3 - w * 4, .5] }, s.x, ly - STAND * K);
        if (pt > .55) go('antic2'); break; }
      case 'antic2': { const k = ease(Math.min(1, pt / .2)), hipH = lerp(STAND, 9, k);
        neck = draw({ lean: lerp(.22, .6, k), tilt: lerp(.6, -.2, k), fl: [-2.5, hipH], fr: [3, hipH], al: [lerp(.4, -2.2, k), .2], ar: [lerp(-.3, -2.1, k), .2] }, s.x, ly - hipH * K);
        if (k >= 1) { s.y = ly - 9 * K; s.vx = 165; s.vy = -560; s.rot = .25; s.t0 = now; go('dive'); } break; }
      case 'dive': { // saut de l'ange : bras en croix au sommet → bras joints, rotation en arc, chute qui accélère
        s.vy += G * .8 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        const want = Math.atan2(s.vx, -s.vy); s.rot += (want - s.rot) * Math.min(1, dt * 7);
        const apex = clamp(-s.vy / 560, 0, 1);           // 1 au départ, 0 au sommet
        const join = clamp(s.vy / 650, 0, 1);            // 0 au sommet, 1 en plongeon
        const spread = 1.7 * (1 - join);
        const aF = lerp(lerp(2.6, Math.PI / 2 + .1, 1 - apex), Math.PI - .05, join), aB = lerp(lerp(2.4, -Math.PI / 2 - .1, 1 - apex), Math.PI + .05, join);
        neck = draw({ lean: 0, tilt: lerp(-.25, .1, join), fl: [-.8, STAND + .6], fr: [.8, STAND + .2], al: [aB, .1 * spread], ar: [aF, .05] }, s.x, s.y, { rot: s.rot });
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > 700 && Math.random() < .7) fx.push({ t: 's', x: s.x + (Math.random() - .5) * 18, y: s.y - (Math.random()) * 20, vx: s.vx, vy: s.vy, a: .8 });
        if (s.y > innerHeight + 120) { ctx.clearRect(0, 0, cv.width, cv.height); raf = 0; return; } break; }
    }
    if (neck) { scarf.step(neck, dt); scarf.draw(); }
    drawFx(dt);
    raf = requestAnimationFrame(step);
  }
  document.addEventListener('av:easter-egg', play);   // tuile secrète de mosaique.js
})();
