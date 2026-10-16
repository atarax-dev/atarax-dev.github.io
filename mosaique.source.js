/* Coin mosaïque de la photo : au survol (ou au tap), le vide en escalier du coin bas droit
   se remplit de tuiles acides avec une onde de profondeur qui suit le pointeur.
   Une tuile secrète déclenche l'easter egg (bonhomme.js). Canvas 2D, aucune dépendance. */
(() => {
  const wrap = document.querySelector('.avatar-wrapper');
  if (!wrap) return;
  const img = document.getElementById('avatar-static');
  const vid = document.getElementById('avatar-video');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ACID = [198, 255, 26];
  const COLS = 25;                       // grille : 25 colonnes, cellules carrées
  const Z0C = 12, Z0R = 16;              // zone animée : coin bas droit

  let W, H, T, ROWS, dpr, tiles = [], raf = 0, active = false, t0 = 0;
  const pointer = { x: 0, y: 0, in: false };
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;pointer-events:none;z-index:3;';
  const ctx = cv.getContext('2d');
  const src = document.createElement('canvas'), sctx = src.getContext('2d', { willReadFrequently: true });
  const host = wrap.parentElement;           // .header-content (grid)
  host.style.position = 'relative';
  host.appendChild(cv);
  // zone de survol = cadre complet (le vide des marches inclus, que le clip-path exclut du hit-test)
  const hitbox = document.createElement('div');
  hitbox.setAttribute('aria-hidden', 'true');
  hitbox.style.cssText = 'position:absolute;z-index:4;touch-action:manipulation;';
  host.appendChild(hitbox);

  // vide d'origine (clip-path 92/82/70/56 % × 62/74/84/93 %)
  const SX = [.92, .82, .70, .56], SY = [.62, .74, .84, .93];
  const inVoid = (x, y) => SX.some((sx, i) => x > sx * W && y > SY[i] * H);
  const voidHit = (c, r) => { // la case touche le vide (au moins un quart)
    let n = 0; for (const fx of [.25, .75]) for (const fy of [.25, .75]) if (inVoid((c + fx) * T, (r + fy) * T)) n++; return n >= 1; };
  const voidPath = () => { const P = new Path2D(); P.moveTo(W, SY[0] * H);
    SX.forEach((sx, i) => { P.lineTo(sx * W, SY[i] * H); P.lineTo(sx * W, (SY[i + 1] || 1) * H); }); P.lineTo(W, H); P.closePath(); return P; };

  function layout() {
    const rw = wrap.getBoundingClientRect(), rh = host.getBoundingClientRect();
    W = rw.width; H = rw.height; T = W / COLS; ROWS = Math.round(H / T);
    dpr = Math.min(2, devicePixelRatio || 1);
    // canvas déborde un peu pour laisser glisser les tuiles
    const pad = T * 4;
    cv.style.left = (rw.left - rh.left) + 'px'; cv.style.top = (rw.top - rh.top) + 'px';
    Object.assign(hitbox.style, { left: cv.style.left, top: cv.style.top, width: W + 'px', height: H + 'px' });
    cv.style.width = (W + pad) + 'px'; cv.style.height = (H + pad) + 'px';
    cv.width = Math.round((W + pad) * dpr); cv.height = Math.round((H + pad) * dpr);
    src.width = Math.round(W * dpr); src.height = Math.round(H * dpr);
    // tuiles de la zone
    tiles = [];
    for (let r = Z0R; r < ROWS; r++) for (let c = Z0C; c < COLS; c++) {
      const cut = voidHit(c, r);
      // distance (en cases) à la frontière des marches
      let d = 99, ec = c, er = r;
      for (let rr = Z0R; rr < ROWS; rr++) for (let cc = Z0C; cc < COLS; cc++)
        if (voidHit(cc, rr) !== cut) { const h = Math.hypot(cc - c, rr - r); if (h < d) { d = h; ec = cc; er = rr; } }
      // case de photo visible la plus proche (entièrement hors du vide)
      if (cut) { let b = 99;
        for (let rr = Z0R - 3; rr < ROWS; rr++) for (let cc = Z0C - 3; cc < COLS; cc++)
          if (!voidHit(cc, rr)) { const h = Math.hypot(cc - c, rr - r); if (h < b) { b = h; ec = cc; er = rr; } } }
      tiles.push({ c, r, cut, d, ec, er, p: 0, v: 0, tg: 0, want: 0, z: 0, zv: 0, delay: 0, seed: Math.random() });
    }
  }

  // source courante (photo ou vidéo de bascule), rendue en object-fit: cover
  function drawSource() {
    const el = vid && vid.classList.contains('playing') && vid.readyState >= 2 ? vid : img;
    const iw = el.videoWidth || el.naturalWidth, ih = el.videoHeight || el.naturalHeight;
    if (!iw) return false;
    const s = Math.max(src.width / iw, src.height / ih);
    sctx.drawImage(el, (src.width - iw * s) / 2, (src.height - ih * s) / 2, iw * s, ih * s);
    return true;
  }
  // moyenne par case sans lecture de pixels (pas de canvas « tainted » en file://)
  const mini = document.createElement('canvas'), mctx = mini.getContext('2d');
  const buildMini = () => { mini.width = COLS; mini.height = ROWS; mctx.imageSmoothingQuality = 'high'; mctx.drawImage(src, 0, 0, COLS, ROWS); };
  const avgTile = (c, r, x, y, w, h, a) => { ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.drawImage(mini, c, r, 1, 1, x, y, w, h); ctx.imageSmoothingEnabled = true; };

  // cibles + délais : arrivée en cascade depuis le bord de la photo, retrait plus rapide
  function setTargets(on) {
    active = on; t0 = performance.now();
    tiles.forEach(t => {
      t.delay = on ? (t.d - .5) * 70 + t.seed * 60 : (5 - t.d) * 35 + t.seed * 20;
      t.want = on && t.cut ? 1 : 0;
    });
    if (reduce.matches) { tiles.forEach(t => { t.p = t.want; t.v = 0; }); render(); return; }
    kick();
  }

  // tuile secrète : colonne 21, rangée 26 (grille 25 × 30), dans le vide des marches
  const SC = 21, SR = 26;
  const secret = () => tiles.find(t => t.c === SC && t.r === SR && t.cut);
  const onSecret = e => { const t = secret(); if (!t || !active || t.p < .9) return false;
    const r = hitbox.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    // au doigt : zone de tap invisible de 44 px centrée sur la tuile (la tuile visible reste petite)
    const half = e.pointerType === 'mouse' ? T / 2 : Math.max(T / 2, 22);
    const cx = (t.c + .5) * T, cy = (t.r + .5) * T;
    return Math.abs(x - cx) <= half && Math.abs(y - cy) <= half; };
  const touchUI = matchMedia('(hover: none)');
  // seul point d'entrée de la boucle : jamais d'animation sous prefers-reduced-motion
  const kick = () => { if (reduce.matches) return; if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  let last = 0;
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    const K = 170, D = 2 * Math.sqrt(K) * 0.78;
    let moving = false;
    tiles.forEach(t => {
      let tg;
      if (now - t0 < t.delay) { tg = t.tg; if (t.tg !== t.want) moving = true; } else t.tg = tg = t.want;
      {                        // profondeur : bosse gaussienne centrée sur le pointeur
        const cx = (t.c + .5) * T, cy = (t.r + .5) * T;
        const dd = pointer.in ? Math.hypot(cx - pointer.x, cy - pointer.y) / (T * 3.2) : 9;
        const zt = active && t.cut ? Math.exp(-dd * dd) : 0;
        t.z = t.z || 0; t.zv = t.zv || 0;
        t.zv += (-260 * (t.z - zt) - 2 * Math.sqrt(260) * .7 * t.zv) * dt; t.z += t.zv * dt;
        if (Math.abs(t.z - zt) > .001 || Math.abs(t.zv) > .001) moving = true; else { t.z = zt; t.zv = 0; }
      }
      if (!Number.isFinite(t.p) || !Number.isFinite(t.v)) { t.p = tg || 0; t.v = 0; }   // garde-fou
      if (!Number.isFinite(t.z) || !Number.isFinite(t.zv)) { t.z = 0; t.zv = 0; }
      const a = -K * (t.p - tg) - D * t.v;
      t.v += a * dt; t.p += t.v * dt;
      if (Math.abs(t.p - tg) > 0.001 || Math.abs(t.v) > 0.001) moving = true; else { t.p = tg; t.v = 0; }
    });
    render();
    raf = !reduce.matches && (moving || (active && pointer.in)) ? requestAnimationFrame(frame) : 0;
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (tiles.every(t => t.p === 0)) { ctx.globalAlpha = 1; return; }  // repos : rien, la photo d'origine reste seule
    if (!drawSource()) return;
    buildMini();
    {                          // escalier rempli de tuiles acides, onde de profondeur vers le pointeur
      const dark = document.documentElement.getAttribute('data-theme') !== 'light';
      ctx.save(); ctx.clip(voidPath());
      tiles.filter(t => t.cut && t.p > 0.002).sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(t => {
        const p = t.p, z = Math.max(0, t.z || 0);
        const o = (1 - Math.min(1, p)) * T * 1.4;            // arrive depuis le bord de la photo (haut-gauche)
        const s = (0.3 + 0.7 * p) * (1 + 0.1 * z), w = (T - 1.2) * s;
        const x = t.c * T + (T - w) / 2 - o - z * 1.2, y = t.r * T + (T - w) / 2 - o - z * 1.8;
        // fondu à la jointure : f = 0 au contact de la photo, 1 à ~3 cases du bord
        const f = Math.min(1, Math.max(0, (t.d - 1) / 2.6)), ff = f * f * (3 - 2 * f);
        const appear = Math.min(1, p * 1.2);
        const base = appear * (dark ? 0.32 + 0.38 * t.seed : 0.55 + 0.35 * t.seed) * (0.3 + 0.7 * ff);
        if (z > .05) { ctx.globalAlpha = z * (dark ? .55 : .22); ctx.fillStyle = '#000'; ctx.fillRect(x + 1 + z, y + 1.5 + z * 1.5, w, w); }
        // filigrane : couleur moyenne du bord de photo le plus proche
        // couleur du bord de photo : pleine au contact, puis s'efface au profit de l'acide
        avgTile(t.ec, t.er, x, y, w, w, appear * (0.92 * (1 - ff) + 0.25 * ff) * (dark ? 1 : .9));
        ctx.globalAlpha = Math.min(1, base * (1 + z * .6));
        ctx.fillStyle = dark ? `rgb(${ACID})` : `rgb(${Math.round(198 - 40 * t.seed)},${Math.round(240 - 30 * t.seed)},${26})`;
        ctx.fillRect(x, y, w, w);
        if (t === secret() && p > .9) {          // scintillement rare (~1 fois / 6 s, 140 ms ; au doigt 1 fois / 3 s, plus marqué)
          const tu = touchUI.matches, P = tu ? 3000 : 6000, D = tu ? 260 : 140;
          const ph = performance.now() % P; if (ph < D) { ctx.globalAlpha = (tu ? .6 : .35) * Math.sin(ph / D * Math.PI); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, w); }
        } });
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // interactions : survol souris, tap au doigt, clavier via le bouton thème inchangé
  const hit = e => { const r = hitbox.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
  hitbox.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { pointer.in = true; hit(e); setTargets(true); } });
  hitbox.addEventListener('pointermove', e => { hit(e); pointer.in = true; kick(); });
  hitbox.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { pointer.in = false; setTargets(false); } });
  hitbox.addEventListener('pointerup', e => {
    if (onSecret(e)) { document.dispatchEvent(new CustomEvent('av:easter-egg')); return; }  // bonhomme.js
    if (e.pointerType !== 'mouse') { hit(e); pointer.in = !active; setTargets(!active); } });
  document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && active && !hitbox.contains(e.target)) setTargets(false); });
  wrap.style.pointerEvents = 'auto'; wrap.style.touchAction = 'manipulation';
  // pendant la vidéo de bascule, la source est la vidéo : on redessine si un état est affiché
  vid && vid.addEventListener('timeupdate', () => { if (!raf && tiles.some(t => t.p)) render(); });
  // redimensionnement / rotation : la grille est reconstruite ; si le coin est affiché, il reste affiché (sans rejouer la cascade)
  addEventListener('resize', () => {
    if (!W) return;                          // pas encore initialisé
    layout();
    if (active) tiles.forEach(t => { t.want = t.tg = t.p = t.cut ? 1 : 0; });
    render(); if (active) kick();            // kick() ne fait rien en mouvement réduit : état figé redessiné une fois
  });
  const init = () => { layout(); if (active) setTargets(true); };
  img.complete ? init() : img.addEventListener('load', init, { once: true });
})();
