/**
 * TSF FITNESS STUDIO — ENGINE
 * Caranzalem, Goa
 *
 * - Preloader with progress simulation
 * - Word-by-word reveal for headers
 * - Fade-up reveal for paragraphs, actions, list items
 * - Desktop-only parallax (disabled on mobile)
 * - Theme toggle (dark / light)
 * - Mobile navigation drawer
 * - Touch feedback on interactive elements
 */

(function () {
    'use strict';

    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============================================================
       1. PRELOADER
       ============================================================ */
    function initPreloader() {
        const preloader = document.getElementById('tsfPreloader');
        const progressBar = document.getElementById('preloaderBar');
        const statusText = document.getElementById('preloaderStatus');

        if (!preloader || !progressBar) {
            // No preloader present — fire ready on next frame
            requestAnimationFrame(() => {
                document.dispatchEvent(new CustomEvent('tsf:ready'));
            });
            return;
        }

        bodyEl.classList.add('preloader-locked');

        let progress = 0;
        const loadingSteps = [
            { threshold: 35, text: 'Loading assets' },
            { threshold: 70, text: 'Preparing studio' },
            { threshold: 90, text: 'Calibrating equipment' }
        ];

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 12) + 6;
            if (progress > 100) progress = 100;
            progressBar.style.width = progress + '%';

            for (const step of loadingSteps) {
                if (progress <= step.threshold) {
                    if (statusText && statusText.textContent !== step.text) {
                        statusText.textContent = step.text;
                    }
                    break;
                }
            }

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(dismissPreloader, 300);
            }
        }, 100);

        function dismissPreloader() {
            preloader.classList.add('is-hidden');
            bodyEl.classList.remove('preloader-locked');

            setTimeout(() => {
                preloader.style.display = 'none';
                document.dispatchEvent(new CustomEvent('tsf:ready'));
            }, 700);
        }

        // Safety net: if loading gets stuck, force-finish
        window.addEventListener('load', () => {
            if (progress < 100) {
                progress = 100;
                progressBar.style.width = '100%';
            }
        });
    }

        /* ============================================================
       2. HERO PARALLAX (backdrop)
       ============================================================ */
    function initHeroParallax() {
        const heroBg = document.getElementById('heroBg');
        if (!heroBg) return;

        const heroImg = heroBg.querySelector('.hero-img');
        if (!heroImg) return;

        let ticking = false;

        function update() {
            // Disable on mobile — prevents iOS/Android dynamic viewport glitches
            if (window.innerWidth < 768) {
                heroImg.style.transform = 'translate3d(0,0,0)';
                ticking = false;
                return;
            }

            // Only run while hero is roughly in view
            const hero = heroImg.closest('.hero');
            const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
            const scrollY = window.pageYOffset;

            if (scrollY > heroBottom) {
                ticking = false;
                return;
            }

            // 0.28 gives a strong, cinematic backdrop shift
            const translateY = scrollY * 0.28;
            heroImg.style.transform = 'translate3d(0,' + translateY + 'px,0)';
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', update);
        update();
    }

    /* ============================================================
       3. THEME TOGGLE
       ============================================================ */
    function initThemeToggle() {
        const checkboxes = document.querySelectorAll('#themeCheckbox, #mobileThemeCheckbox');
        if (!checkboxes.length) return;

        const saved = localStorage.getItem('tsf-theme') || 'dark';
        htmlEl.setAttribute('data-theme', saved);

        checkboxes.forEach(cb => { cb.checked = (saved === 'light'); });

        checkboxes.forEach(cb => {
            cb.addEventListener('change', function () {
                const next = this.checked ? 'light' : 'dark';
                htmlEl.setAttribute('data-theme', next);
                localStorage.setItem('tsf-theme', next);

                // Keep both toggles in sync
                checkboxes.forEach(other => {
                    if (other !== this) other.checked = this.checked;
                });
            });
        });
    }

    /* ============================================================
       4. NAVIGATION
       ============================================================ */
    function initNavigation() {
        const header = document.getElementById('siteHeader');
        const menuToggle = document.getElementById('menuToggle');
        const mobileMenu = document.getElementById('mobileMenu');

        if (header) {
            const onScroll = () => {
                header.classList.toggle('is-scrolled', window.pageYOffset > 20);
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        if (menuToggle && mobileMenu) {
            const openMenu = () => {
                menuToggle.setAttribute('aria-expanded', 'true');
                mobileMenu.classList.add('is-open');
                mobileMenu.setAttribute('aria-hidden', 'false');
                bodyEl.style.overflow = 'hidden';
            };

            const closeMenu = () => {
                menuToggle.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('is-open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                bodyEl.style.overflow = '';
            };

            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
            });

            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMenu);
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
                    closeMenu();
                }
            });
        }
    }

    /* ============================================================
       5. WORD-BY-WORD TEXT REVEAL
       ============================================================ */

    // Headers that will split into words and slide up
    const WORD_SPLIT_SELECTORS = [
        '.hero-headline',
        '.section-title',
        '.pull-quote',
        '.program-body h3',
        '.day-head h3',
        '.plan-head h3'
    ];

    // Elements that will fade up (in place)
    const FADE_SELECTORS = [
        '.hero-lede',
        '.hero-actions',
        '.hero-stats .stat',
        '.hero-caption',
        '.section-lede',
        '.section-foot',
        '.founder-lede',
        '.founder-note',
        '.founder-credentials',
        '.program-media',
        '.program-body p',
        '.program-cta',
        '.day-slots li',
        '.plan-features li',
        '.plan-head .mono',
        '.plans-note',
        '.schedule-note',
        '.contact-lede',
        '.contact-list > div',
        '.contact-actions',
        '.contact-map'
    ];

    /**
     * Split text nodes inside an element into individual word spans.
     * Preserves <br>, <em>, <strong>, and other inline elements untouched.
     */
    function splitIntoWords(element) {
        if (element.dataset.splitDone === 'true') return;
        element.dataset.splitDone = 'true';
        element.classList.add('split-text');

        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    const parent = node.parentNode;
                    if (!parent) return NodeFilter.FILTER_REJECT;

                    const tag = parent.tagName;
                    if (tag === 'SCRIPT' || tag === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (parent.classList && parent.classList.contains('word-inner')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (!node.textContent || !node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        // Collect first, then modify — never mutate during traversal
        const textNodes = [];
        let n;
        while ((n = walker.nextNode())) textNodes.push(n);

        textNodes.forEach(node => {
            const text = node.textContent;
            const parts = text.split(/(\s+)/);
            const frag = document.createDocumentFragment();

            parts.forEach(part => {
                if (!part) return;

                if (/^\s+$/.test(part)) {
                    // Preserve whitespace between words
                    frag.appendChild(document.createTextNode(part));
                } else {
                    const outer = document.createElement('span');
                    outer.className = 'word';

                    const inner = document.createElement('span');
                    inner.className = 'word-inner';
                    inner.textContent = part;

                    outer.appendChild(inner);
                    frag.appendChild(outer);
                }
            });

            if (node.parentNode) {
                node.parentNode.replaceChild(frag, node);
            }
        });
    }

    /**
     * Reveal a split-text element with a per-word stagger.
     */
    function revealSplitText(el, baseDelay) {
        const words = el.querySelectorAll('.word-inner');
        const delay = baseDelay || 0;
        const step = 55; // ms between each word

        words.forEach((word, i) => {
            word.style.transitionDelay = (delay + i * step) + 'ms';
        });

        el.classList.add('is-revealed');
    }

    /**
     * Reveal a fade-up element after a delay.
     */
    function revealFade(el, baseDelay) {
        el.style.transitionDelay = (baseDelay || 0) + 'ms';
        el.classList.add('is-revealed');
    }

    function initTextReveal() {
        // Respect reduced motion — skip everything, show content as-is
        if (prefersReducedMotion) return;

        // ---- Collect targets ----
        const wordTargets = [];
        WORD_SPLIT_SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (el.closest('.mobile-menu')) return; // skip nav links
                wordTargets.push(el);
            });
        });

        const fadeTargets = [];
        FADE_SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (el.closest('.mobile-menu')) return;
                fadeTargets.push(el);
            });
        });

        // ---- Split every header into words ----
        wordTargets.forEach(splitIntoWords);

        // ---- Mark fade targets so CSS takes over initial state ----
        fadeTargets.forEach(el => el.classList.add('fade-up'));

        // ---- HERO: plays immediately after preloader finishes ----
        const hero = document.querySelector('.hero');
        if (hero) {
            document.addEventListener('tsf:ready', () => {
                const heroHeaders = hero.querySelectorAll('.split-text');
                const heroFades = hero.querySelectorAll('.fade-up');

                // Headline words slide up first
                heroHeaders.forEach((el, i) => {
                    revealSplitText(el, 120 + i * 180);
                });

                // Supporting elements fade in slightly after
                heroFades.forEach((el, i) => {
                    revealFade(el, 420 + i * 90);
                });
            }, { once: true });
        }

        // ---- EVERYTHING ELSE: plays on scroll ----
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el = entry.target;

                // Hero elements handled separately via tsf:ready
                if (el.closest('.hero')) {
                    observer.unobserve(el);
                    return;
                }

                if (el.classList.contains('split-text')) {
                    revealSplitText(el, 0);
                } else {
                    revealFade(el, 0);
                }

                observer.unobserve(el);
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -60px 0px'
        });

        wordTargets.forEach(el => {
            if (!el.closest('.hero')) observer.observe(el);
        });

        fadeTargets.forEach(el => {
            if (!el.closest('.hero')) observer.observe(el);
        });
    }

    /* ============================================================
       6. TOUCH FEEDBACK
       ============================================================ */
    function initTouchFeedback() {
        const interactives = document.querySelectorAll(
            '.btn, .program-card, .plan, .day, .strip-item, .footer-social a'
        );

        interactives.forEach(el => {
            el.addEventListener('touchstart', () => {
                el.style.transform = 'scale(0.985)';
            }, { passive: true });

            el.addEventListener('touchend', () => {
                el.style.transform = '';
            }, { passive: true });

            el.addEventListener('touchcancel', () => {
                el.style.transform = '';
            }, { passive: true });
        });
    }

    /* ============================================================
       7. BOOT
       ============================================================ */
    document.addEventListener('DOMContentLoaded', () => {
        initTextReveal();   // set up split + observers first
        initPreloader();    // then fire preloader (which dispatches tsf:ready)
        initHeroParallax();
        initThemeToggle();
        initNavigation();
        initTouchFeedback();

        console.log('TSF Engine loaded — Caranzalem, Goa.');
    });

})();