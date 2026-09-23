# TSF Fitness Studio — Website

> Combat sports and fitness studio in Caranzalem, Goa.  
> Official website — programs, founder, schedule, studio gallery, and membership.

---

## About

TSF (Team Suresh Fitness) is a combat sports and fitness studio founded in 2018 in Caranzalem, Goa. This repository contains the source for the studio's public website — a lightweight, editorial, mobile-first site built without frameworks or build tooling.

The site is primarily a **showcase** — it tells the story of the studio, the founder, the disciplines taught, and the space itself. It's designed to look and feel like a martial arts institution, not a marketing landing page.

---

## Live Site

- **Production:** _[tsfitnessstudio.com](https://tsfitnessstudio.com)_ *(update when deployed)*
- **Preview:** _[Netlify preview URL]*

---

## Features

- **Editorial design system** — Instrument Serif display, Inter Tight body, JetBrains Mono labels
- **Dark / light theme** — persistent via `localStorage`, no flash on load
- **Full-bleed hero** — cinematic backdrop with subtle desktop-only parallax
- **Word-by-word reveal** — headers animate in word-by-word on scroll
- **Fade-up reveals** — supporting content fades in beneath headers
- **Floating pill navigation** — glass-blurred, centered, collapses to a hamburger on mobile
- **Mobile theme toggle inside the drawer** — no header clutter on small screens
- **Studio gallery** — horizontal scroll strip with snap points
- **Smooth anchor navigation** — no scroll-jacking, no libraries
- **Accessible** — focus states, ARIA labels, reduced-motion respected
- **Zero dependencies** — no jQuery, no React, no build step. Vanilla HTML, CSS, JS.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | Semantic HTML5 | Readable, accessible, crawlable |
| Styling | Vanilla CSS with custom properties | Theme switching without JS overhead |
| Behaviour | Vanilla ES6 modules-in-IIFE | No framework, no build, no bundle |
| Fonts | Google Fonts (3 families) | Preconnected, `display: swap` |
| Images | WebP | Smaller payloads, better quality |

**No build tools. No npm. No dependencies.** Edit, save, refresh.

---

## Project Structure
tsf-studio/
├── index.html — Homepage
├── style.css — All styles (tokens, components, responsive)
├── script.js — Preloader, theme, nav, reveals, parallax
├── assets/
│ ├── TSF®.png — Brand mark (header + footer)
│ ├── TSF STAMP R.png — Favicon
│ ├── Banner noBG.png — Preloader logo
│ ├── Owner img 1.png — Founder portrait
│ ├── Studio 1.webp — Hero image
│ ├── Studio 2.webp — Gallery
│ ├── Studio 3.webp — Gallery
│ ├── Studio 4.webp — Gallery
│ ├── Studio 5.webp — Gallery
│ └── Studio 6.webp — Gallery
└── README.md

text

Future pages (planned):
├── programs/
│ ├── index.html
│ ├── mma.html
│ ├── taekwondo.html
│ ├── crossfit.html
│ ├── calisthenics.html
│ ├── yoga.html
│ └── kids-taekwondo.html
├── about.html
├── schedule.html
├── contact.html
├── events.html
├── events/
│ └── [slug].html
└── data/
└── events.json

text

---

## Getting Started

### Local development

No installation required.

1. **Clone the repository**
   ```bash
   git clone https://github.com/[org]/tsf-studio.git
   cd tsf-studio
Serve it locally — pick one:

bash
# Python 3
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000

# Or just open index.html directly in your browser
Open http://localhost:8000

Editing
File	Purpose
index.html	Page markup
style.css	All styles — tokens live at the top in :root
script.js	All interactions
assets/	Images and brand assets
Changes to any file just require a browser refresh. No compilation.

Design System
All design tokens live at the top of style.css in the :root selector. If you want to tweak the site's look, that's the only place you need to touch.

Color
Token	Dark	Light	Use
--bg-page	#0E0E10	#F7F6F3	Page background
--bg-surface	#17171A	#FFFFFF	Cards, panels
--text-primary	#F5F4F1	#151515	Body text
--text-secondary	#A6A5A1	#5C5B58	Supporting text
--text-muted	#6B6A67	#9A9995	Labels, meta
--red-core	#C81E1E	#B01818	Signature accent
--red-hover	#A31515	#8C1010	Accent hover
Red is used sparingly — CTA buttons, active nav, one accent per section. Everything else is neutral.

Typography
Role	Font	Use
Display	Instrument Serif	Hero, section titles, pull quotes
Body	Inter Tight	All UI copy, paragraphs, labels
Mono	JetBrains Mono	Technical labels, timestamps
Uppercase is reserved for mono labels only (e.g., FOUNDER · HEAD COACH). Everything else is sentence case.

Motion
Every animation is intentional. Durations:

200ms — hover, focus

320ms — theme switch, nav toggle

500ms — image scale on hover

700–750ms — text reveal

All animation respects prefers-reduced-motion. Users with that setting on see no animation at all.

Browser Support
Browser	Support
Chrome / Edge	Latest 2 versions
Firefox	Latest 2 versions
Safari (macOS)	15+
Safari (iOS)	15+
Chrome Android	Latest
Uses color-mix() and backdrop-filter — both widely supported. Degrades gracefully where they aren't.

Deployment
The site is static — any static host works.

Netlify (recommended)
Connect the GitHub repo to Netlify

Build command: (none)

Publish directory: . (root)

Deploy

Netlify handles HTTPS, CDN, and deploys on every push to main.

Vercel
Same flow — import the repo, no build settings needed.

Manual
Upload the entire folder to any web host via FTP. Works out of the box.

Custom domain
Point the DNS A record (or CNAME) to your host. HTTPS is auto-provisioned on Netlify and Vercel.

Performance
Targets:

Metric	Goal
First Contentful Paint	< 1.2s
Largest Contentful Paint	< 2.0s
Total page weight	< 800KB
JS bundle	< 15KB (unminified)
Images should always be:

Served as WebP

Sized appropriately (max 1920px wide for hero)

Lazy-loaded below the fold

Given loading="eager" only for the hero

Accessibility
All interactive elements are keyboard reachable

Focus rings visible on all focusable elements

ARIA labels on icon-only buttons

Semantic landmarks (header, nav, main, footer)

prefers-reduced-motion fully respected

Color contrast meets WCAG AA on all text

If you spot an issue, please open an issue.

Roadmap
☑ Homepage rebuild with editorial design system
☑ Dark / light theme with persistent toggle
☑ Word-by-word reveal animations
☑ Floating pill navigation
□ Programs hub page
□ Individual program detail pages (MMA, Taekwondo, CrossFit, Calisthenics, Yoga, Kids)
□ About / Founder full page
□ Schedule page (all six days)
□ Contact page
□ Events module (listing + detail + countdown)
□ Event registration with payment (Razorpay / Stripe)
□ CMS integration when event volume grows
Contributing
This is a private business site. External contributions are not currently accepted.

For internal changes:

Create a branch: git checkout -b feature/[name]

Make changes

Test locally on both dark and light themes

Test on mobile (real device if possible)

Open a pull request against main

Credits
Studio & content — Team Suresh Fitness, Caranzalem, Goa

Founder — Master Suresh

Design & development — Aurquim

Photography — Studio TSF (internal)

License
All rights reserved.
© 2026 Team Suresh Fitness.

This repository is public for transparency and archival purposes. No part of the code, design, imagery, or copy may be reused, redistributed, or repurposed without written permission.

Contact
TSF Fitness Studio
Caranzalem, Goa 403002, India
📞 +91 95459 37344
✉️ tsflivestrong@gmail.com

For business inquiries: Aurquim — [contact method]

text

---

## Notes on the README

- **No badges** — adding "build: passing" badges for a static site with no CI looks silly. Skipped intentionally.
- **No screenshots placeholder** — if you want, add a `## Screenshots` section after `## About` with a hero image once it's deployed. I left it out so the file stays clean.
- **Roadmap checkboxes** — the `[x]` and `[ ]` items render as a real GitHub task list, so you can tick them off as you build.
- **Deployment section** covers the three most likely paths (Netlify / Vercel / FTP), so whoever inherits this repo knows where to start.
- **License is intentionally strict** — it's a real business site, not an open-source project. The wording makes that clear without being hostile.

Drop this at the root of the repo as `README.md`, and push. The GitHub landing page will now read as a professional, self-documenting project.
