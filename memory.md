# TSF Fitness Studio — Project Memory

> Working document. Captures the current state of the build, design decisions,
> conventions, and what comes next. Update this as the project evolves.

---

## Current Deployment

| Environment | URL |
|-------------|-----|
| **Production** | https://yugaldoddamani.github.io/TSF-CLUB/ |
| **Repo** | https://github.com/YugalDoddamani/TSF-CLUB |
| **Branch** | `main` (auto-deploys on push) |

---

## Repository Structure (Current)
TSF-CLUB/
├── index.html — Single-page site: hero, founder, programs, studio, contact, footer
├── style.css — All styles (design tokens + components + responsive)
├── script.js — Preloader, theme, nav, word-split reveal, accordion, parallax
├── README.md — Public repo readme
├── MEMORY.md — This file (internal working doc)
└── assets/
├── TSF®.png — Brand mark (header + footer)
├── TSF STAMP R.png — Favicon
├── Banner noBG.png — (Legacy, may be unused after preloader swap)
├── Owner img 1.webp — Founder portrait
├── Studio 1.webp — Hero backdrop + gallery
├── Studio 2.webp — Gallery
├── Studio 3.webp — Gallery
├── Studio 4.webp — Gallery
├── Studio 5.webp — Gallery
└── Studio 6.webp — Gallery

text

---

## Tech Stack

- **Pure vanilla HTML / CSS / JS** — no build step, no frameworks, no npm
- **Fonts (Google Fonts):** Inter Tight (body), Instrument Serif (display), JetBrains Mono (labels), Bodoni Moda (preloader counter — currently unused, may be removed)
- **Images:** WebP, lazy-loaded below the fold
- **Theme:** Dark default, Light optional, persisted in `localStorage` key: `tsf-theme`

---

## Design System

### Colors (CSS custom properties in `:root`)

| Token | Dark | Light |
|-------|------|-------|
| `--bg-page` | `#0E0E10` | `#F7F6F3` |
| `--bg-surface` | `#17171A` | `#FFFFFF` |
| `--bg-surface-2` | `#1E1E22` | `#F0EFEB` |
| `--text-primary` | `#F5F4F1` | `#151515` |
| `--text-secondary` | `#A6A5A1` | `#5C5B58` |
| `--text-muted` | `#6B6A67` | `#9A9995` |
| `--line-subtle` | `rgba(245,244,241,0.06)` | `rgba(21,21,21,0.06)` |
| `--line-default` | `rgba(245,244,241,0.10)` | `rgba(21,21,21,0.10)` |
| `--line-strong` | `rgba(245,244,241,0.20)` | `rgba(21,21,21,0.20)` |
| `--red-core` | `#C81E1E` | `#B01818` |
| `--red-hover` | `#A31515` | `#8C1010` |

**Red is used sparingly** — CTA buttons, active nav underline, one accent per section, hover on scrollbars, em-dash in pull quote. Everything else is neutral.

### Spacing Scale

`--space-1` (4px) through `--space-10` (120px), in increments of 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 120.

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display | Instrument Serif | Hero headline, section titles, pull quote |
| Body | Inter Tight | All UI copy, paragraphs, buttons |
| Mono | JetBrains Mono | Uppercase labels, metadata, tags |

**Sentence case** everywhere except mono labels. No emoji in UI. No uppercase shouting.

### Motion

- `--dur-fast: 200ms` — hover, focus
- `--dur-base: 320ms` — theme switch, nav toggle
- `--dur-slow: 500ms` — image scale, accordion
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`

**`prefers-reduced-motion: reduce`** — fully respected. No splits, no reveals, instant render.

---

## Page Structure (index.html)

Sections in order:

1. **Preloader** — Numeric counter 0→100, progress bar below, dismisses on complete
2. **Header** — Floating pill navigation (fixed, glass-blurred), theme switch + "Book a trial" CTA
3. **Mobile menu** — Full-screen drawer, theme switch inside, contact snippet
4. **Hero** — Full-bleed backdrop image + overlay, headline, lede, CTAs, stats bar at bottom
5. **Founder** — Two-column (portrait + bio), credentials grid, meta blocks (certifications, JuicyBites)
6. **Programs** — Expandable accordion list (adults + kids), hover-expand on desktop, tap-expand on mobile
7. **Studio** — Section header + horizontal scroll strip of 6 images with captions
8. **Contact** — Two-column (info list + map iframe), full address encoded in map URLs only
9. **Footer** — Brand + 3 columns (Navigate, Disciplines, Reach us) + socials + credit line

---

## Key Interactions (script.js)

| Function | Behavior |
|----------|----------|
| `initPreloader()` | Counter 0→100, dispatches `tsf:ready` event when done |
| `initHeroParallax()` | Desktop only (≥768px), translates hero image at 0.28× scroll |
| `initThemeToggle()` | Syncs `#themeCheckbox` + `#mobileThemeCheckbox`, saves to `localStorage` |
| `initNavigation()` | Sticky pill scroll state, mobile menu open/close, ESC to dismiss |
| `initProgramAccordion()` | Touch devices only — click to open a row, one at a time |
| `initTextReveal()` | Splits headers into words, fades paragraphs, uses IntersectionObserver |
| `initTouchFeedback()` | Scale-down on `touchstart` for buttons/cards |

### Event Contract

- `tsf:ready` — fired after preloader dismisses. Hero animations listen for this.
- `DOMContentLoaded` — all init functions called here.

---

## Naming Conventions

| Prefix / Class | Meaning |
|----------------|---------|
| `.site-header`, `.site-footer` | Top-level landmarks |
| `.hero-*`, `.founder-*`, `.program-*` | Section-scoped classes |
| `.mono` | JetBrains Mono uppercase micro-label |
| `.eyebrow` | Small section intro text (mono, uppercase, muted) |
| `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost` | Button variants |
| `.is-open`, `.is-scrolled`, `.is-hidden`, `.is-active` | State classes |
| `.split-text`, `.word`, `.word-inner`, `.is-revealed` | Word-split animation classes |
| `.fade-up`, `.is-revealed` | Fade-up animation classes |

---

## Content Facts (Keep in Sync)

| Field | Value |
|-------|-------|
| **Studio name** | TSF Fitness Studio (Team Suresh Fitness) |
| **Location** | Caranzalem, Goa 403002 |
| **Full address (map only)** | TSF Fitness Studio, House No 92, Borchem Bhatt, near Martins Landscape, Caranzalem, Taleigao, Panaji, Goa 403002 |
| **Phone** | +91 95459 37344 |
| **Email** | tsflivestrong@gmail.com |
| **Founded** | 2018 |
| **Experience** | 10+ years (founder), 8+ years (studio) |
| **Founder** | Master Suresh — 2nd degree black belt in Taekwondo |
| **Founder roles** | President of STAG, Head Coach of Goa under IITF |
| **Certifications** | Certified Personal Trainer · Certified Martial Arts Trainer |
| **Other venture** | JuicyBites Healthy Cafe (@juicy_bites_by_tsf on Instagram) |
| **Hours** | Mon–Sat · 8:00 AM – 9:00 PM · Sun closed |
| **Studio size** | 500 m² |

### Programs (Canonical List)

**Adults:**
- Personal Training — On request, one-on-one
- Kickboxing & MMA Training — ₹3,000/mo — Morning 7–8 AM · Evening 7–8:30 PM
- CrossFit Training — ₹3,000/mo — Tue/Thu/Sat — Morning 8–9 AM · 9–10 AM
- Calisthenics — ₹3,000/mo — Tue/Thu/Sat — Evening 6–7 PM
- Yoga — ₹3,000/mo — Mon/Wed/Fri — Morning 8–9 AM · 9–10 AM

**Kids:**
- Kickboxing — ₹3,000/mo — Mon/Wed/Fri — Evening 5–6 PM
- Taekwondo — ₹2,500/mo — Mon/Wed/Fri — Evening 6–7 PM
- Yoga — ₹3,000/mo — Mon/Wed/Fri — Evening 5–6 PM
- Gymnastics — ₹3,000/mo — Tue/Thu/Sat — Evening 6–7 PM
- Calisthenics — ₹3,000/mo — Tue/Thu/Sat — Evening 5–6 PM
- Dance — On request — Tue/Thu — Evening 4–5 PM

**Rule for program-detail labels:**
- If slots are AM only → `Morning` label
- If slots are PM only → `Evening` label
- If both → two `Morning` + `Evening` blocks
- If days are known → `Days` block first
- If not time-based → `Format` label

---

## Social / Contact Links

| Platform | URL |
|----------|-----|
| Instagram | (not yet set — placeholder `#`) |
| YouTube | (not yet set — placeholder `#`) |
| Facebook | (not yet set — placeholder `#`) |
| WhatsApp | `https://wa.me/919545937344` |
| Maps (link) | `https://www.google.com/maps/search/?api=1&query=TSF...` (full address encoded) |
| Maps (iframe) | `https://www.google.com/maps?q=TSF...&output=embed` (full address encoded) |

---

## Known Issues / Notes

- **Instagram, YouTube, Facebook URLs in footer are placeholders** — need real links when available
- **OG image uses WebP** — WhatsApp won't render preview. Recommend adding `assets/og-cover.jpg` (1200×630) as the OG image source
- **`Banner noBG.png`** — legacy preloader logo, no longer referenced. Can be removed from `assets/`
- **Bodoni Moda font is loaded** but no longer used in the preloader (swapped to system sans). Font link can be trimmed
- **Duplicate OG meta tags in `<head>`** — some appear twice. Cleanup needed
- **`--red-subtle`, `--red-line`** defined but lightly used. Fine to keep for future
- **Hero parallax** disabled on mobile — intentional, prevents iOS dynamic viewport glitches

---

## What's Done

- [x] Editorial design system (dark + light theme)
- [x] Floating pill navigation with mobile menu
- [x] Numeric preloader (0→100)
- [x] Hero with backdrop, overlay, stats bar
- [x] Founder section with credentials, certifications, JuicyBites
- [x] Programs accordion (adults + kids), systematic morning/evening labels
- [x] Studio strip (horizontal scroll)
- [x] Contact section with full-address map
- [x] Footer with credit line
- [x] Word-by-word reveal animations
- [x] Fade-up animations
- [x] Custom scrollbar
- [x] Logo inversion on light theme
- [x] OpenGraph + Twitter card metadata

---

## What's Next — Multi-Page Expansion

The user wants to break the single-page site into multiple pages:

### 1. `about.html` — About / Founder deep-dive
- Extended founder bio (timeline, achievements, philosophy)
- Team section (other coaches)
- Studio history
- STAG + IITF association details
- Gallery of the founder + studio

### 2. `programs.html` — Programs hub
- All disciplines listed as cards or expandable rows
- Each discipline links to its own detail page
- Filters: Adults / Kids / Combat / Fitness
- Possibly:
  - `programs/mma.html`
  - `programs/taekwondo.html`
  - `programs/crossfit.html`
  - `programs/calisthenics.html`
  - `programs/yoga.html`
  - `programs/kids.html`

### 3. `founder.html` — Founder page
- Full bio of Master Suresh
- Career timeline
- Certifications and credentials
- Media (photos/videos)
- JuicyBites crossover

### 4. `contact.html` — Contact page
- Full contact form (or WhatsApp CTA)
- Large embedded map
- Directions / how to reach
- FAQ section

### 5. `schedule.html` — Weekly schedule (full 6-day grid)

### 6. `events.html` — Events module (future)
- Event listing with countdowns
- Individual event pages
- Registration / payment integration (Razorpay)

---

## Conventions to Keep When Building New Pages

1. **Same `<head>` structure** — meta description, OG tags, font links, favicon
2. **Same preloader** — copy the `#tsfPreloader` block verbatim
3. **Same header** — the floating pill navigation, updating `is-active` on current page's link
4. **Same mobile menu** — full-screen drawer
5. **Same footer** — identical across all pages
6. **Same `style.css`** — do NOT fork. Add page-specific classes to the same file
7. **Same `script.js`** — do NOT fork. Add page-specific init functions to the same file
8. **Every new page shares** the design tokens in `:root`
9. **Section rhythm** — `padding: var(--space-10) 0`, `border-top: 1px solid var(--line-subtle)` unless hero
10. **Every section header** follows the pattern:
    ```html
    <p class="eyebrow">Label</p>
    <h2 class="section-title">Title</h2>
    <p class="section-lede">One sentence.</p>
Standing Rules (From User)
No emoji in UI — use SVG or nothing

Sentence case for all text except mono labels

Red is the signature accent — use sparingly, never for body text

Photography forward — real studio images, no stock

Mobile-first — test every change on a phone

One-open-at-a-time for program accordion on mobile

Preserve word-split + fade-up reveals on all new sections

Do not use pure black or pure white — always the tokenized off-black/off-white

Contact for the Project
Studio — Team Suresh Fitness, Caranzalem, Goa

Developer / Designer — Yugal Doddamani (https://yugaldoddamani.pages.dev/)

Repo — https://github.com/YugalDoddamani/TSF-CLUB

Last updated: [current date]

text

---

## What I Noticed Reviewing Your Files

While reading through the summary, I spotted a few things worth fixing before we build the new pages:

### Small issues in current code

1. **Duplicate `<meta property="og:title">` and `og:description` tags** in `index.html` — two sets exist. The second set overrides the first. Should keep one clean set.

2. **`Bodoni Moda` is loaded but not used** — the font link in `<head>` includes it, but the preloader now uses the system sans stack. Either drop it from the font link or drop the font link entirely.

3. **`Banner noBG.png` is orphaned** — still in `assets/` but no longer referenced. Safe to delete.

4. **Description says "eight years of experience" but hero says "eight years of teaching"** while founder section says "ten years." This is intentional (studio = 8, founder = 10), but worth double-checking that's what you want.

5. **`initProgramAccordion()` uses `pointer: fine`** — this means on hybrid devices (touchscreen laptops), it falls back to hover behavior. Correct choice, just flagging.

### Ready to proceed

The single-page site is in solid shape. When you're ready to build `about.html`, `programs.html`, `founder.html`, and `contact.html`, we have everything we need:

- Design tokens are stable
- Component patterns are established (section-head, card, accordion, footer)
- Nav + mobile menu structure is reusable
- All shared code lives in `style.css` and `script.js`

Just say which page to build first, and I'll produce the full HTML + any new CSS/JS additions needed.
