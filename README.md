# TSF Fitness Studio

> Combat sports and fitness studio in Caranzalem, Goa.
> Official website covering programs, founder, studio space, and contact.

---

## About

TSF (Team Suresh Fitness) is a combat sports and fitness studio founded in 2018 in Caranzalem, Goa. This repository contains the source for the studio's public website, a lightweight, editorial, mobile-first site built without frameworks or build tooling.

The site is primarily a showcase. It tells the story of the studio, the founder, the disciplines taught, and the space itself. It is designed to feel like a martial arts institution, not a marketing landing page.

---

## Live Site

- Production: https://yugaldoddamani.github.io/TSF-CLUB/
- Repository: https://github.com/YugalDoddamani/TSF-CLUB

---

## Features

- Editorial design system with Instrument Serif display, Inter Tight body, and JetBrains Mono labels
- Dark and light theme, persisted via `localStorage` with no flash on load
- Full-bleed hero with a subtle desktop-only parallax backdrop
- Word-by-word reveal animation for headers on scroll
- Fade-up reveals for supporting content
- Floating pill navigation with glass blur, centered, collapsing to a hamburger on mobile
- Mobile theme toggle inside the drawer, keeping the header clean on small screens
- Horizontal studio gallery strip with snap points
- Wipe-up page transition between all pages
- Smooth anchor navigation with no libraries and no scroll-jacking
- Accessible focus states, ARIA labels, and reduced-motion support
- Zero dependencies. No jQuery, no React, no build step. Just HTML, CSS, and vanilla JS.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Markup | Semantic HTML5 | Readable, accessible, crawlable |
| Styling | Vanilla CSS with custom properties | Theme switching without JS overhead |
| Behaviour | Vanilla ES6 in an IIFE | No framework, no build, no bundle |
| Fonts | Google Fonts (3 families) | Preconnected with `display: swap` |
| Images | WebP | Smaller payloads, better quality |

No build tools. No npm. No dependencies. Edit, save, refresh.

---

## Project Structure
TSF-CLUB/
├── index.html Homepage
├── programs.html Programs page
├── founder.html Founder page
├── contact.html Contact page
├── style.css All styles (tokens, components, responsive)
├── script.js Preloader, theme, nav, reveals, parallax, transitions
├── README.md This file
├── MEMORY.md Internal working notes
└── assets/
├── TSF®.png Brand mark (header and footer)
├── TSF STAMP R.png Favicon
├── Owner img 1.webp Founder portrait
├── Studio 1.webp Hero backdrop
├── Studio 2.webp Gallery
├── Studio 3.webp Gallery
├── Studio 4.webp Gallery
├── Studio 5.webp Gallery
├── Studio 6.webp Gallery
└── programs/
└── (11 program images to be dropped in)

text

Planned additions:
├── events.html
└── events/
└── [slug].html

text

---

## Getting Started

### Local development

No installation required.

1. Clone the repository:

   ```bash
   git clone https://github.com/YugalDoddamani/TSF-CLUB.git
   cd TSF-CLUB
Serve it locally. Pick any one:

bash
# Python 3
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
Or just open index.html directly in your browser.

Open http://localhost:8000.

Editing
File	Purpose
index.html	Homepage markup
programs.html	Programs page markup
founder.html	Founder page markup
contact.html	Contact page markup
style.css	All styles. Design tokens live at the top in :root
script.js	All interactions
assets/	Images and brand assets
Changes to any file just require a browser refresh. No compilation step.

Design System
All design tokens live at the top of style.css inside the :root selector. To change the site's look, that is the only place you need to touch.

Color
Token	Dark	Light	Use
--bg-page	#0E0E10	#F7F6F3	Page background
--bg-surface	#17171A	#FFFFFF	Cards and panels
--text-primary	#F5F4F1	#151515	Body text
--text-secondary	#A6A5A1	#5C5B58	Supporting text
--text-muted	#6B6A67	#9A9995	Labels and metadata
--red-core	#C81E1E	#B01818	Signature accent
--red-hover	#A31515	#8C1010	Accent hover
Red is used sparingly: CTA buttons, active nav state, and one accent per section. Everything else stays neutral.

Typography
Role	Font	Use
Display	Instrument Serif	Hero, section titles, pull quotes
Body	Inter Tight	All UI copy, paragraphs, labels
Mono	JetBrains Mono	Technical labels and metadata
Uppercase is reserved for mono labels only, for example FOUNDER · HEAD COACH. Everything else is sentence case.

Motion
Every animation is intentional. Durations:

200ms for hover and focus

320ms for theme switch and nav toggle

500ms for image scale and page transition

700 to 750ms for text reveal

All animation respects prefers-reduced-motion. Users with that setting enabled see no animation at all.

Browser Support
Browser	Support
Chrome / Edge	Latest 2 versions
Firefox	Latest 2 versions
Safari (macOS)	15+
Safari (iOS)	15+
Chrome Android	Latest
The site uses color-mix() and backdrop-filter, both widely supported. Where they are not, the design degrades gracefully.

Deployment
The site is static, so any static host works.

GitHub Pages (current)
The repository is configured for GitHub Pages. Push to main and it deploys automatically.

Netlify
Connect the GitHub repo to Netlify

Build command: leave empty

Publish directory: . (root)

Deploy

Netlify handles HTTPS, CDN, and deploys on every push to main.

Vercel
Same flow as Netlify. Import the repo, no build settings needed.

Manual
Upload the entire folder to any web host via FTP. Works out of the box.

Custom domain
Point the DNS A record or CNAME to your host. HTTPS is auto-provisioned on Netlify and Vercel.

Performance
Targets:

Metric	Goal
First Contentful Paint	Under 1.2s
Largest Contentful Paint	Under 2.0s
Total page weight	Under 800KB
JS bundle	Under 15KB unminified
Images should always be:

Served as WebP

Sized appropriately, with the hero capped at 1920px wide

Lazy-loaded below the fold

Marked loading="eager" only for the hero

Accessibility
All interactive elements are keyboard reachable

Focus rings are visible on all focusable elements

Icon-only buttons have ARIA labels

Semantic landmarks are used throughout: header, nav, main, footer

prefers-reduced-motion is fully respected

Color contrast meets WCAG AA on all text

If you spot an issue, please open an issue.

Roadmap
☑ Homepage with editorial design system
☑ Dark and light theme with persistent toggle
☑ Word-by-word reveal animations
☑ Floating pill navigation
☑ Programs page with image placeholders
☑ Founder page with sticky portrait layout
☑ Contact page with map and FAQ
☑ Wipe-up page transition between pages
□ Program detail pages (MMA, Taekwondo, CrossFit, Calisthenics, Yoga, Kids)
□ Events module with listing and detail pages
□ Event registration with payment via Razorpay or Stripe
□ CMS integration when event volume grows
Contributing
This is a private business site. External contributions are not currently accepted.

For internal changes:

Create a branch: git checkout -b feature/[name]

Make changes

Test locally on both dark and light themes

Test on mobile if possible

Open a pull request against main

Credits
Studio and content: Team Suresh Fitness, Caranzalem, Goa

Founder: Master Suresh

Design and development: Yugal Doddamani

Photography: Studio TSF

License
All rights reserved.
© 2026 Team Suresh Fitness.

This repository is public for transparency and archival purposes. No part of the code, design, imagery, or copy may be reused, redistributed, or repurposed without written permission.

Contact
TSF Fitness Studio
Caranzalem, Goa 403002, India

Phone: +91 95459 37344

Email: tsflivestrong@gmail.com

For business inquiries, reach out to Yugal Doddamani via https://yugaldoddamani.pages.dev/.
