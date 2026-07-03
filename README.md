# samer.ai — my personal portfolio

My hand-built portfolio as an **AI / Machine Learning Engineer** — LLM applications, RAG systems, agentic workflows and production ML.

**Live:** https://samer-br.github.io/mywebsite/

## Why it looks the way it does

I wanted the site itself to feel like the systems I build, so everything is written from scratch — **no frameworks, no libraries, zero dependencies**. Just HTML, CSS and vanilla JavaScript:

- **Particle portrait** — my avatar is sampled pixel-by-pixel into ~12,000 canvas particles that assemble on load, shimmer with a scan wave, dodge your cursor, and disintegrate as you scroll.
- **Neural background** — a living network of nodes and synapses with data pulses traveling between them, drifting with scroll parallax.
- **Scroll-driven RAG pipeline** — a sticky section where scrolling literally runs the pipeline: Docs → Embed → Retrieve → Reason → Answer, with packets riding the wire.
- **Skill constellation** — an interactive canvas graph of my stack that reacts to the cursor.
- Terminal boot loader, magnetic buttons, 3D-tilt cards, custom cursor, scroll choreography — all hand-rolled.

Accessibility is not an afterthought: semantic headings, focus states, skip link, keyboard-friendly nav, and full `prefers-reduced-motion` support.

## Structure

```
index.html          # single page, semantic sections
css/style.css       # design system + layout + motion
js/main.js          # interaction engine (scroll, canvases, nav)
js/particles.js     # particle portrait engine
assets/             # images + favicon
```

## Run locally

Any static server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages — free)

Pushes to `main` auto-deploy via the workflow in `.github/workflows/deploy.yml`.
One-time setup: **Settings → Pages → Source → GitHub Actions**.

---

© Samer Albardan · [LinkedIn](https://www.linkedin.com/in/samer-albardan) · albardansamer@gmail.com
