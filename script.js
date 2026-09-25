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
       1. PRELOADER — Numeric counter (fixed 2s duration)
       ============================================================ */
    function initPreloader() {
        const preloader = document.getElementById('tsfPreloader');
        const progressBar = document.getElementById('preloaderBar');
        const counterEl = document.getElementById('preloaderCounter');

        if (!preloader || !progressBar || !counterEl) {
            requestAnimationFrame(() => {
                document.dispatchEvent(new CustomEvent('tsf:ready'));
            });
            return;
        }

        bodyEl.classList.add('preloader-locked');

        // Total counter duration in milliseconds
        const DURATION = 2000;

        let startTime = null;
        let frameId = null;
        let dismissed = false;

        function tick(now) {
            if (startTime === null) startTime = now;

            const elapsed = now - startTime;
            const progress = Math.min(100, (elapsed / DURATION) * 100);

            counterEl.textContent = Math.floor(progress);
            progressBar.style.width = progress + '%';

            if (progress < 100) {
                frameId = requestAnimationFrame(tick);
            } else {
                counterEl.textContent = '100';
                progressBar.style.width = '100%';
                setTimeout(dismissPreloader, 350);
            }
        }

        function dismissPreloader() {
            if (dismissed) return;
            dismissed = true;

            preloader.classList.add('is-hidden');
            bodyEl.classList.remove('preloader-locked');

            setTimeout(() => {
                preloader.style.display = 'none';
                document.dispatchEvent(new CustomEvent('tsf:ready'));
            }, 700);
        }

        frameId = requestAnimationFrame(tick);
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
       8. PROGRAM ACCORDION — click-to-expand on touch devices
       ============================================================ */
    function initProgramAccordion() {
        // On devices with hover + fine pointer (desktop/laptop), CSS handles
        // hover-expand. On touch devices, we attach click listeners.
        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (canHover) return;

        const rows = document.querySelectorAll('.program-row');
        if (!rows.length) return;

        rows.forEach(row => {
            const head = row.querySelector('.program-row-head');
            if (!head) return;

            head.addEventListener('click', function (e) {
                e.preventDefault();

                const isOpen = row.classList.contains('is-open');

                // Close all others first (one-open-at-a-time accordion)
                rows.forEach(other => {
                    if (other !== row) {
                        other.classList.remove('is-open');
                        const otherHead = other.querySelector('.program-row-head');
                        if (otherHead) otherHead.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle this one
                row.classList.toggle('is-open', !isOpen);
                head.setAttribute('aria-expanded', String(!isOpen));
            });
        });
    }



    /* ============================================================
       5. WORD-BY-WORD TEXT REVEAL
       ============================================================ */

    // Headers that will split into words and slide up
    const WORD_SPLIT_SELECTORS = [
        '.hero-headline',
        '.profile-hero-name',
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
        const hero = document.querySelector('.hero, .profile');
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
       9. PAGE TRANSITION — exit animation
       (Enter animation is handled by inline script in each page)
       ============================================================ */
    function initPageTransition() {
        const panel = document.getElementById('pageTransition');
        if (!panel) return;

        const DURATION = 500;

        const links = document.querySelectorAll('a[href]');

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (link.target === '_blank') return;
            if (href.startsWith('http://')) return;
            if (href.startsWith('https://')) return;
            if (href.startsWith('mailto:')) return;
            if (href.startsWith('tel:')) return;
            if (href.startsWith('#')) return;
            if (href.endsWith('.pdf')) return;

            link.addEventListener('click', function (e) {
                // Don't hijack Cmd/Ctrl/middle-click — let the browser handle it
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

                e.preventDefault();

                // Kill the entry transition still queued on the panel
                panel.style.transition = 'none';

                // Snap the panel below the viewport
                panel.style.transform = 'translateY(100%)';

                // Force reflow so the browser commits the "below" position
                void panel.offsetWidth;

                // Now animate it up to cover the screen
                panel.style.transition = 'transform ' + DURATION + 'ms cubic-bezier(0.76, 0, 0.24, 1)';
                panel.style.transform = 'translateY(0)';

                // Navigate once the panel is covering everything
                setTimeout(function () {
                    window.location.href = href;
                }, DURATION);
            });
        });
    }




    /* ============================================================
       11. MACRO CALCULATOR
       ============================================================ */
    function initMacroCalculator() {
        const form = document.getElementById('macroForm');
        if (!form) return;

        const placeholder = document.getElementById('macroPlaceholder');
        const output = document.getElementById('macroOutput');
        const resetBtn = document.getElementById('macroReset');
        const backBtn = document.getElementById('macroBack');
        const resultPanel = document.getElementById('macroResult');

        const weightUnitLabel = document.getElementById('weightUnitLabel');
        const heightUnitLabel = document.getElementById('heightUnitLabel');

        const outCalories = document.getElementById('outCalories');
        const outCaloriesLabel = document.getElementById('outCaloriesLabel');
        const outProtein = document.getElementById('outProtein');
        const outCarbs = document.getElementById('outCarbs');
        const outFat = document.getElementById('outFat');
        const outBmr = document.getElementById('outBmr');
        const outTdee = document.getElementById('outTdee');
        const outAdjust = document.getElementById('outAdjust');
        const outSummary = document.getElementById('outSummary');

        let hasCalculated = false;
        let activeUnits = { weight: 'kg', height: 'cm' };

        /* ---------- Unit toggles ---------- */
        document.querySelectorAll('.macro-unit-toggle').forEach(group => {
            const groupName = group.dataset.unitGroup;
            const buttons = group.querySelectorAll('button');

            buttons.forEach(btn => {
                btn.addEventListener('click', function () {
                    const newUnit = this.dataset.unit;
                    if (activeUnits[groupName] === newUnit) return;

                    activeUnits[groupName] = newUnit;
                    buttons.forEach(b => b.classList.toggle('is-active', b === this));

                    if (groupName === 'weight') {
                        weightUnitLabel.textContent = newUnit === 'kg' ? 'kg' : 'lbs';
                        form.querySelector('#macroWeight').value = '';
                    }

                    if (groupName === 'height') {
                        heightUnitLabel.textContent = newUnit === 'cm' ? 'cm' : 'in';
                        form.querySelector('#macroHeight').value = '';
                    }

                    hasCalculated = false;
                    placeholder.hidden = false;
                    output.hidden = true;
                });
            });
        });

        /* ---------- Helpers ---------- */
        function isMobile() {
            return window.matchMedia('(max-width: 899px)').matches;
        }

        function scrollToResults() {
            if (!isMobile() || !resultPanel) return;
            setTimeout(() => {
                resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                resultPanel.classList.add('is-flashing');
                setTimeout(() => resultPanel.classList.remove('is-flashing'), 700);
            }, 80);
        }

        function getValues() {
            const gender = form.querySelector('input[name="gender"]:checked');
            const age = parseFloat(form.querySelector('#macroAge').value);
            const weightInput = parseFloat(form.querySelector('#macroWeight').value);
            const heightInput = parseFloat(form.querySelector('#macroHeight').value);
            const activity = parseFloat(form.querySelector('#macroActivity').value);
            const goal = form.querySelector('input[name="goal"]:checked');

            if (!gender || !goal) return null;
            if (!age || !weightInput || !heightInput || !activity) return null;
            if (age < 14 || age > 90) return null;

            const weightKg = activeUnits.weight === 'kg'
                ? weightInput
                : weightInput * 0.453592;

            const heightCm = activeUnits.height === 'cm'
                ? heightInput
                : heightInput * 2.54;

            if (weightKg < 30 || weightKg > 250) return null;
            if (heightCm < 120 || heightCm > 230) return null;

            return {
                gender: gender.value,
                age: age,
                weightKg: weightKg,
                heightCm: heightCm,
                weightDisplay: weightInput,
                heightDisplay: heightInput,
                weightUnit: activeUnits.weight,
                heightUnit: activeUnits.height,
                activity: activity,
                goal: goal.value
            };
        }

        function calculate(v) {
            let bmr;
            if (v.gender === 'male') {
                bmr = (10 * v.weightKg) + (6.25 * v.heightCm) - (5 * v.age) + 5;
            } else {
                bmr = (10 * v.weightKg) + (6.25 * v.heightCm) - (5 * v.age) - 161;
            }

            const tdee = bmr * v.activity;
            let targetCalories;
            let adjustLabel;

            if (v.goal === 'lose') {
                targetCalories = tdee - 500;
                adjustLabel = '−500 kcal (fat loss)';
            } else if (v.goal === 'gain') {
                targetCalories = tdee + 300;
                adjustLabel = '+300 kcal (muscle gain)';
            } else {
                targetCalories = tdee;
                adjustLabel = 'Maintenance';
            }

            const proteinG = Math.round(v.weightKg * 2);
            const proteinCal = proteinG * 4;
            const fatCal = targetCalories * 0.25;
            const fatG = Math.round(fatCal / 9);
            const carbCal = Math.max(0, targetCalories - proteinCal - fatCal);
            const carbG = Math.round(carbCal / 4);

            return {
                bmr: Math.round(bmr),
                tdee: Math.round(tdee),
                targetCalories: Math.round(targetCalories),
                proteinG: proteinG,
                carbsG: carbG,
                fatG: fatG,
                adjustLabel: adjustLabel,
                goal: v.goal,
                gender: v.gender,
                age: v.age,
                weightDisplay: v.weightDisplay,
                heightDisplay: v.heightDisplay,
                weightUnit: v.weightUnit,
                heightUnit: v.heightUnit,
                activity: v.activity
            };
        }

        function render(r) {
            outCalories.textContent = r.targetCalories.toLocaleString('en-IN');
            outCaloriesLabel.textContent = r.goal === 'lose'
                ? 'calories / day · fat loss'
                : r.goal === 'gain'
                    ? 'calories / day · muscle gain'
                    : 'calories / day · maintenance';

            outProtein.textContent = r.proteinG;
            outCarbs.textContent = r.carbsG;
            outFat.textContent = r.fatG;

            outBmr.textContent = r.bmr.toLocaleString('en-IN') + ' kcal';
            outTdee.textContent = r.tdee.toLocaleString('en-IN') + ' kcal';
            outAdjust.textContent = r.adjustLabel;

            const genderLabel = r.gender === 'male' ? 'Male' : 'Female';
            outSummary.textContent =
                `Based on ${r.age} yrs · ${r.weightDisplay} ${r.weightUnit} · ` +
                `${r.heightDisplay} ${r.heightUnit} · ${genderLabel} · activity ×${r.activity}.`;

            placeholder.hidden = true;
            output.hidden = false;
            hasCalculated = true;

            output.style.animation = 'none';
            void output.offsetWidth;
            output.style.animation = '';
        }

        /* ---------- Submit ---------- */
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const v = getValues();
            if (!v) {
                // Highlight the first invalid field
                const firstInvalid = form.querySelector('input:invalid, select:invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            render(calculate(v));
            scrollToResults();
        });

        /* ---------- Live update after first calculation ---------- */
        form.addEventListener('input', function () {
            if (!hasCalculated) return;
            const v = getValues();
            if (!v) return;
            render(calculate(v));
        });

        form.addEventListener('change', function () {
            if (!hasCalculated) return;
            const v = getValues();
            if (!v) return;
            render(calculate(v));
        });

        /* ---------- Back to calculator (mobile) ---------- */
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        /* ---------- Reset ---------- */
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                form.reset();
                hasCalculated = false;
                placeholder.hidden = false;
                output.hidden = true;

                form.querySelector('#macroActivity').value = '1.55';
                form.querySelector('input[name="gender"][value="male"]').checked = true;
                form.querySelector('input[name="goal"][value="maintain"]').checked = true;

                activeUnits = { weight: 'kg', height: 'cm' };
                weightUnitLabel.textContent = 'kg';
                heightUnitLabel.textContent = 'cm';

                document.querySelectorAll('.macro-unit-toggle').forEach(group => {
                    const buttons = group.querySelectorAll('button');
                    buttons.forEach((b, i) => b.classList.toggle('is-active', i === 0));
                });
            });
        }
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
         initProgramAccordion();
        initTouchFeedback();
        initPageTransition(); 
        initMacroCalculator();   

        console.log('TSF Engine loaded — Caranzalem, Goa.');
    });

})();