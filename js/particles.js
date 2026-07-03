/* ═══════════════════════════════════════════════════════════
   samer.ai — particle portrait engine
   samples my avatar into ~12k particles that assemble on load,
   breathe with a scanning wave, dodge the cursor, and
   disintegrate as you scroll. pure canvas 2D — no libraries.
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  const ctx = canvas.getContext("2d");
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const GAP = isTouch ? 5 : 4;          // sampling step → particle density
  const MOUSE_R = 85;                    // cursor repulsion radius
  const SCATTER = 420;                   // how far particles fly on scroll

  let W, H, dpr;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let assembleT0 = null;
  let ready = false;

  const img = new Image();
  img.src = "assets/avatar.jpg";

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (img.complete && img.naturalWidth) build();
  }

  function build() {
    // fit image into canvas (contain)
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = W / H;
    let dw, dh;
    if (ir > cr) { dw = W; dh = W / ir; } else { dh = H; dw = H * ir; }
    const ox = (W - dw) / 2, oy = (H - dh) / 2;

    // sample downscaled pixels
    const cols = Math.floor(dw / GAP), rows = Math.floor(dh / GAP);
    const off = document.createElement("canvas");
    off.width = cols; off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0, cols, rows);
    const data = octx.getImageData(0, 0, cols, rows).data;

    particles = [];
    const pcx = ox + dw / 2, pcy = oy + dh * 0.44;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 16) continue; // skip near-black — lets the portrait float
        const hx = ox + x * GAP + GAP / 2;
        const hy = oy + y * GAP + GAP / 2;
        // dissolve into the page: drop particles ever more often near the edges
        const nd = Math.hypot((hx - pcx) / (dw * 0.55), (hy - pcy) / (dh * 0.58));
        const edge = clamp((nd - 0.62) / 0.38, 0, 1);
        if (Math.random() < edge * edge) continue;
        const ang = Math.random() * Math.PI * 2;
        particles.push({
          fade: 1 - edge * 0.75,
          hx, hy,                                    // home
          sx: W / 2 + Math.cos(ang) * W * 1.1,       // spawn (off-canvas ring)
          sy: H / 2 + Math.sin(ang) * H * 1.1,
          dx: Math.cos(ang), dy: Math.sin(ang),      // scatter direction
          spin: (Math.random() - 0.5) * 2,
          delay: (hy / (H || 1)) * 0.45 + Math.random() * 0.25, // top-down build
          size: lum > 190 ? 2.2 : 1.7,
          bright: lum > 165,
          color: `rgb(${r},${g},${b})`,
        });
      }
    }
    ready = true;
    assembleT0 = null;
  }

  img.onload = resize;

  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

  // scroll-driven disintegration: 0 at top, 1 once hero is scrolled past
  function scatterProgress() {
    const heroH = canvas.closest(".hero")?.offsetHeight || innerHeight;
    return clamp(scrollY / (heroH * 0.85), 0, 1);
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!ready) return;
    // skip work when hero fully off-screen
    if (scrollY > innerHeight * 1.4) return;

    if (assembleT0 === null) assembleT0 = t;
    const elapsed = (t - assembleT0) / 1000;
    const scatter = reduceMotion ? 0 : scatterProgress();
    const time = t * 0.001;

    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // assembly: fly from spawn ring to home
      const ap = reduceMotion ? 1 : clamp((elapsed - p.delay) / 1.1, 0, 1);
      const a = easeOutCubic(ap);
      let x = p.sx + (p.hx - p.sx) * a;
      let y = p.sy + (p.hy - p.sy) * a;

      // scroll disintegration: fly outward + swirl + gravity
      if (scatter > 0) {
        const s = easeOutCubic(scatter);
        x += (p.dx * SCATTER + p.spin * 140 * Math.sin(scatter * 4 + p.hy * 0.02)) * s;
        y += (p.dy * SCATTER * 0.7 + 260 * s * s) * s;
      }

      // cursor repulsion
      const mdx = x - mouse.x, mdy = y - mouse.y;
      const md2 = mdx * mdx + mdy * mdy;
      if (md2 < MOUSE_R * MOUSE_R && md2 > 0.01) {
        const md = Math.sqrt(md2);
        const f = (1 - md / MOUSE_R) * 26;
        x += (mdx / md) * f;
        y += (mdy / md) * f;
      }

      // scanning shimmer wave
      const wave = 1 + 0.5 * Math.max(0, Math.sin(time * 1.6 - y * 0.018));
      const alpha = (1 - scatter * 0.95) * (0.35 + 0.65 * a) * p.fade;
      if (alpha <= 0.02) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sz = p.size * wave;
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);

      // glow pass for bright pixels
      if (p.bright && wave > 1.32) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillRect(x - sz, y - sz, sz * 2, sz * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
