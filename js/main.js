/* ═══════════════════════════════════════════════════════════
   samer.ai — interaction engine
   scroll choreography, neural background, skill constellation
   vanilla JS only — every line hand-rolled
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ── boot loader ─────────────────────────────────────── */
  const loader = document.getElementById("loader");
  const loaderBody = document.getElementById("loaderBody");
  const bootLines = [
    ["$ ./samer --init", ""],
    ["loading neural core", " <span class='ok'>[ok]</span>"],
    ["mounting rag_pipeline.py", " <span class='ok'>[ok]</span>"],
    ["spawning agents (4/4)", " <span class='ok'>[ok]</span>"],
    ["<span class='dim'>inference ready — welcome.</span>", ""],
  ];

  function runBoot() {
    if (reduceMotion) { loader.classList.add("done"); document.body.classList.add("booted"); return; }
    let i = 0;
    const step = () => {
      if (i < bootLines.length) {
        loaderBody.innerHTML += bootLines[i][0] + bootLines[i][1] + "\n";
        i++;
        setTimeout(step, i === 1 ? 340 : 210);
      } else {
        setTimeout(() => {
          loader.classList.add("done");
          document.body.classList.add("booted");
        }, 380);
      }
    };
    step();
  }
  runBoot();

  /* ── custom cursor ───────────────────────────────────── */
  const cursor = document.getElementById("cursor");
  if (!isTouch && !reduceMotion) {
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a, button, [data-tilt]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    });
  } else {
    cursor.style.display = "none";
  }

  /* ── nav: scrolled state, burger, active link ────────── */
  const nav = document.getElementById("nav");
  const navLinks = document.getElementById("navLinks");
  const burger = document.getElementById("burger");
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    })
  );

  const sections = [...document.querySelectorAll("section[id]")];
  const linkFor = {};
  document.querySelectorAll("[data-nav]").forEach((a) => (linkFor[a.getAttribute("href").slice(1)] = a));

  /* ── scroll progress + rAF-driven bits ───────────────── */
  const scrollBar = document.getElementById("scrollBar");
  const timelineEl = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timelineProgress");

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollBar.style.width = `${(scrollY / max) * 100}%`;
    nav.classList.toggle("scrolled", scrollY > 30);

    // active nav link
    let current = null;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= innerHeight * 0.4) current = s.id;
    }
    Object.entries(linkFor).forEach(([id, a]) => a.classList.toggle("active", id === current));

    // timeline draw-in
    if (timelineEl) {
      const r = timelineEl.getBoundingClientRect();
      const p = clamp((innerHeight * 0.75 - r.top) / r.height, 0, 1);
      timelineProgress.style.height = `${p * 100}%`;
    }

    pipelineUpdate();
  }
  addEventListener("scroll", onScroll, { passive: true });

  /* ── reveal on scroll ────────────────────────────────── */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ── counters ────────────────────────────────────────── */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count;
      cio.unobserve(el);
      const t0 = performance.now(), dur = 1400;
      (function tick(t) {
        const p = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));

  /* ── hero typing ─────────────────────────────────────── */
  const typedEl = document.getElementById("typed");
  const phrases = [
    "building RAG pipelines that answer with receipts",
    "orchestrating multi-agent workflows",
    "shipping ML from notebook to production",
    "leading AI teams @ Ericsson",
    'model.eval()  # always',
  ];
  if (typedEl && !reduceMotion) {
    let pi = 0, ci = 0, deleting = false;
    (function type() {
      const cur = phrases[pi];
      typedEl.textContent = cur.slice(0, ci);
      let delay = deleting ? 22 : 46;
      if (!deleting && ci === cur.length) { delay = 2100; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
      else ci += deleting ? -1 : 1;
      setTimeout(type, delay);
    })();
  } else if (typedEl) {
    typedEl.textContent = phrases[0];
  }

  /* ── magnetic buttons ────────────────────────────────── */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ── 3D tilt cards + pointer glow ────────────────────── */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-2px)`;
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ── pipeline: scroll-driven story ───────────────────── */
  const pipeSection = document.getElementById("pipeline");
  const stageNum = document.getElementById("stageNum");
  const stageTitle = document.getElementById("stageTitle");
  const stageDesc = document.getElementById("stageDesc");
  const wireGlow = document.getElementById("wireGlow");
  const wirePath = document.getElementById("wirePath");
  const pnodes = [...document.querySelectorAll(".pnode")];
  const packets = [1, 2, 3].map((n) => document.getElementById("packet" + n));
  const stages = [
    ["Ingest", "Documents, wikis, tickets — raw organizational knowledge flows in."],
    ["Embed", "Chunking and embedding models turn language into vectors that machines can compare."],
    ["Retrieve", "Vector search plus graph-based retrieval pull exactly the right context — nothing more."],
    ["Reason", "The LLM and agent orchestration ground every answer in the retrieved facts."],
    ["Answer", "A grounded, cited answer ships to real users. This is the system I lead at Ericsson."],
  ];
  let wireLen = 1000;
  if (wirePath) { try { wireLen = wirePath.getTotalLength(); wireGlow.style.strokeDasharray = wireLen; wireGlow.style.strokeDashoffset = wireLen; } catch (_) {} }
  let lastStage = -1;

  function pipelineUpdate() {
    if (!pipeSection) return;
    const r = pipeSection.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp(-r.top / total, 0, 1);

    // wire draws with progress
    wireGlow.style.strokeDashoffset = wireLen * (1 - p);

    // packets ride the wire
    packets.forEach((pk, i) => {
      const pp = clamp(p * 1.15 - i * 0.07, 0, 1);
      if (pp <= 0 || pp >= 1) { pk.style.opacity = 0; return; }
      const pt = wirePath.getPointAtLength(pp * wireLen);
      pk.setAttribute("cx", pt.x);
      pk.setAttribute("cy", pt.y);
      pk.style.opacity = 1;
    });

    // stage activation
    const idx = clamp(Math.floor(p * stages.length), 0, stages.length - 1);
    pnodes.forEach((n, i) => {
      n.classList.toggle("active", i === idx);
      n.classList.toggle("passed", i < idx);
    });
    if (idx !== lastStage) {
      lastStage = idx;
      stageNum.textContent = `0${idx + 1} / 05`;
      stageTitle.textContent = stages[idx][0];
      stageDesc.textContent = stages[idx][1];
      if (!reduceMotion) {
        stageTitle.animate(
          [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" }
        );
      }
    }
  }

  /* ── neural network background ───────────────────────── */
  const bg = document.getElementById("neuralCanvas");
  const bgCtx = bg.getContext("2d");
  let bw, bh, nodes = [], mouse = { x: -9999, y: -9999 };
  const NODE_COUNT = isTouch ? 42 : 78;
  const LINK_DIST = 170;

  function bgResize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    bw = innerWidth; bh = innerHeight;
    bg.width = bw * dpr; bg.height = bh * dpr;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function bgInit() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * bw,
      y: Math.random() * bh,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 1 + Math.random() * 1.6,
      hue: Math.random() < 0.7 ? 196 : 255, // cyan / violet
    }));
  }
  addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

  let pulses = [];
  function bgFrame(t) {
    bgCtx.clearRect(0, 0, bw, bh);
    const drift = scrollY * 0.03;

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = bw + 20; if (n.x > bw + 20) n.x = -20;
      if (n.y < -20) n.y = bh + 20; if (n.y > bh + 20) n.y = -20;
    }

    // links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const ay = (a.y - drift + bh * 4) % bh;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const by = (b.y - drift + bh * 4) % bh;
        const dx = a.x - b.x, dy = ay - by;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.14;
          bgCtx.strokeStyle = `hsla(210, 80%, 70%, ${alpha})`;
          bgCtx.lineWidth = 1;
          bgCtx.beginPath();
          bgCtx.moveTo(a.x, ay); bgCtx.lineTo(b.x, by);
          bgCtx.stroke();

          // occasionally spawn a pulse traveling this link
          if (!reduceMotion && Math.random() < 0.0007 && pulses.length < 14) {
            pulses.push({ ax: a.x, ay, bx: b.x, by, p: 0, speed: 0.008 + Math.random() * 0.012 });
          }
        }
      }
    }

    // nodes
    for (const n of nodes) {
      const ny = (n.y - drift + bh * 4) % bh;
      const dx = n.x - mouse.x, dy = ny - mouse.y;
      const near = dx * dx + dy * dy < 160 * 160;
      bgCtx.beginPath();
      bgCtx.arc(n.x, ny, near ? n.r * 1.8 : n.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `hsla(${n.hue}, 90%, ${near ? 78 : 65}%, ${near ? 0.9 : 0.45})`;
      bgCtx.fill();
    }

    // pulses (data packets on synapses)
    pulses = pulses.filter((pl) => pl.p < 1);
    for (const pl of pulses) {
      pl.p += pl.speed;
      const x = lerp(pl.ax, pl.bx, pl.p);
      const y = lerp(pl.ay, pl.by, pl.p);
      bgCtx.beginPath();
      bgCtx.arc(x, y, 2, 0, Math.PI * 2);
      bgCtx.fillStyle = "rgba(90,255,195,0.9)";
      bgCtx.shadowColor = "rgba(90,255,195,0.9)";
      bgCtx.shadowBlur = 8;
      bgCtx.fill();
      bgCtx.shadowBlur = 0;
    }

    requestAnimationFrame(bgFrame);
  }
  bgResize(); bgInit();
  addEventListener("resize", () => { bgResize(); bgInit(); });
  if (!reduceMotion) requestAnimationFrame(bgFrame);
  else { bgFrame(0); }

  /* ── skill constellation ─────────────────────────────── */
  const sc = document.getElementById("skillsCanvas");
  const scWrap = document.getElementById("skillsWrap");
  if (sc && scWrap) {
    const ctx = sc.getContext("2d");
    const SKILLS = [
      { l: "RAG", w: 3, c: "#55d7ff" }, { l: "LLM apps", w: 3, c: "#55d7ff" },
      { l: "Prompt eng.", w: 2, c: "#55d7ff" }, { l: "Vector search", w: 2, c: "#55d7ff" },
      { l: "Graph retrieval", w: 2, c: "#55d7ff" }, { l: "Embeddings", w: 2, c: "#55d7ff" },
      { l: "Agents", w: 3, c: "#8b7bff" }, { l: "Orchestration", w: 2, c: "#8b7bff" },
      { l: "Tool use", w: 2, c: "#8b7bff" }, { l: "Claude Code", w: 2, c: "#8b7bff" },
      { l: "PyTorch", w: 3, c: "#5affc3" }, { l: "TensorFlow", w: 2, c: "#5affc3" },
      { l: "Scikit-learn", w: 2, c: "#5affc3" }, { l: "Deep learning", w: 2, c: "#5affc3" },
      { l: "Anomaly detection", w: 2, c: "#5affc3" },
      { l: "Python", w: 3, c: "#eaf0ff" }, { l: "TypeScript", w: 2, c: "#eaf0ff" },
      { l: "Angular", w: 1, c: "#eaf0ff" }, { l: "Java", w: 1, c: "#eaf0ff" },
      { l: "AWS", w: 2, c: "#eaf0ff" }, { l: "REST APIs", w: 1, c: "#eaf0ff" },
    ];
    let sw, sh, snodes = [], smouse = { x: -9999, y: -9999 };

    function scResize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = scWrap.getBoundingClientRect();
      sw = r.width; sh = r.height;
      sc.width = sw * dpr; sc.height = sh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      snodes = SKILLS.map((s, i) => {
        const col = i % 5, row = Math.floor(i / 5);
        return {
          ...s,
          x: sw * (0.12 + col * 0.19) + (Math.random() - 0.5) * sw * 0.07,
          y: sh * (0.16 + row * 0.17) + (Math.random() - 0.5) * sh * 0.06,
          ph: Math.random() * Math.PI * 2,
          amp: 4 + Math.random() * 7,
        };
      });
    }
    sc.addEventListener("mousemove", (e) => {
      const r = sc.getBoundingClientRect();
      smouse.x = e.clientX - r.left; smouse.y = e.clientY - r.top;
    });
    sc.addEventListener("mouseleave", () => { smouse.x = -9999; smouse.y = -9999; });

    let scVisible = false;
    new IntersectionObserver((es) => es.forEach((e) => (scVisible = e.isIntersecting)), { threshold: 0.05 }).observe(scWrap);

    function scFrame(t) {
      requestAnimationFrame(scFrame);
      if (!scVisible) return;
      ctx.clearRect(0, 0, sw, sh);
      const time = t * 0.001;

      const pos = snodes.map((n) => ({
        x: n.x + Math.cos(time * 0.5 + n.ph) * n.amp,
        y: n.y + Math.sin(time * 0.6 + n.ph) * n.amp,
      }));

      // links between nearby nodes
      for (let i = 0; i < snodes.length; i++) {
        for (let j = i + 1; j < snodes.length; j++) {
          const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
          const d = Math.hypot(dx, dy);
          const maxD = sw * 0.17;
          if (d < maxD) {
            ctx.strokeStyle = `rgba(120,180,255,${(1 - d / maxD) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pos[i].x, pos[i].y);
            ctx.lineTo(pos[j].x, pos[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.textAlign = "center";
      snodes.forEach((n, i) => {
        const { x, y } = pos[i];
        const d = Math.hypot(x - smouse.x, y - smouse.y);
        const hot = d < 90;
        const r = n.w * 2.4 + (hot ? 3.5 : 0);
        // glow
        if (hot) {
          ctx.beginPath();
          ctx.arc(x, y, r + 9, 0, Math.PI * 2);
          ctx.fillStyle = n.c + "22";
          ctx.fill();
          // link to cursor
          ctx.strokeStyle = n.c + "55";
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(smouse.x, smouse.y); ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.globalAlpha = hot ? 1 : 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = `${hot ? 600 : 400} ${hot ? 13 : 11.5}px "JetBrains Mono", monospace`;
        ctx.fillStyle = hot ? "#ffffff" : "rgba(200,215,240,.72)";
        ctx.fillText(n.l, x, y - r - 8);
      });
    }
    scResize();
    addEventListener("resize", scResize);
    if (!reduceMotion) requestAnimationFrame(scFrame);
    else { scVisible = true; scFrame(0); }
  }

  /* ── misc ────────────────────────────────────────────── */
  document.getElementById("year").textContent = new Date().getFullYear();
  onScroll();
})();
