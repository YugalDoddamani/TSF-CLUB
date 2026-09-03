/**
 * TSF FITNESS STUDIO — CORE ENGINE & INTERACTION CONTROLLER
 * Features: Gradient Preloader, Hero Parallax Engine, Theme Swapper, Mobile Navigation, Scroll Observer
 */

(function() {
    'use strict';

    // Global DOM Selectors
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    /* ============================================================
       1. CUSTOM GRADIENT PRELOADER & FADE CONTROLLER
       ============================================================ */
    function initPreloader() {
        const preloader = document.getElementById('tsfPreloader');
        const progressBar = document.getElementById('preloaderBar');
        const statusText = document.getElementById('preloaderStatus');

        if (!preloader || !progressBar) return;

        // Prevent body scrolling during preloader phase
        bodyEl.classList.add('preloader-active');

        let progress = 0;
        const loadingSteps = [
            { threshold: 30, text: 'LOADING ASSETS...' },
            { threshold: 60, text: 'PREPARING WORKOUT SPACE...' },
            { threshold: 85, text: 'CALIBRATING EQUIPMENT...' },
            
        ];

        // Simulate asset loading progression
        const interval = setInterval(() => {
            const increment = Math.floor(Math.random() * 12) + 5;
            progress += increment;

            if (progress > 100) progress = 100;

            // Update UI
            progressBar.style.width = progress + '%';

            // Update status text based on step thresholds
            for (let step of loadingSteps) {
                if (progress <= step.threshold) {
                    if (statusText && statusText.textContent !== step.text) {
                        statusText.textContent = step.text;
                    }
                    break;
                }
            }

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(dismissPreloader, 400);
            }
        }, 120);

        function dismissPreloader() {
            preloader.classList.add('fade-out');
            bodyEl.classList.remove('preloader-active');
            
            // Trigger entry animations for main elements
            initScrollObserver();
            
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }

        // Fallback safety timeout
        window.addEventListener('load', function() {
            progress = 100;
            progressBar.style.width = '100%';
        });
    }

    /* ============================================================
       2. OPTIMIZED PARALLAX ENGINE FOR HERO SECTIONS
       ============================================================ */
    function initHeroParallax() {
        const heroBg = document.getElementById('heroBg');
        if (!heroBg) return;

        let ticking = false;

        function updateParallax() {
            const scrollY = window.pageYOffset;
            const translateY = scrollY * 0.35;
            heroBg.style.transform = 'translate3d(0, ' + translateY + 'px, 0)';
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        // Initial position
        updateParallax();
    }

       /* ============================================================
       THEME MANAGER (LocalStorage Sync) - Updated for Slide Switch
    ============================================================ */
    function initThemeToggle() {
        const themeCheckbox = document.getElementById('themeCheckbox');
        if (!themeCheckbox) return;

        // Retrieve initial theme preference or default to dark
        const savedTheme = localStorage.getItem('tsf-theme') || 'dark';
        htmlEl.setAttribute('data-theme', savedTheme);
        
        // Set checkbox state based on theme
        themeCheckbox.checked = savedTheme === 'light';

        themeCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            const nextTheme = isChecked ? 'light' : 'dark';

            htmlEl.setAttribute('data-theme', nextTheme);
            localStorage.setItem('tsf-theme', nextTheme);
        });
    }

    /* ============================================================
       4. NAVIGATION & MOBILE DRAWER CONTROLLER
       ============================================================ */
    function initNavigation() {
        const hamburger = document.getElementById('hamburger');
        const mobileNav = document.getElementById('mobileNav');
        const header = document.getElementById('topBar');

        // Sticky header background transition on scroll
        if (header) {
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 40) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }, { passive: true });
        }

        // Hamburger drawer toggle
        if (hamburger && mobileNav) {
            hamburger.addEventListener('click', function(e) {
                e.stopPropagation();
                const isOpen = mobileNav.classList.contains('open');

                if (isOpen) {
                    closeMobileNav();
                } else {
                    openMobileNav();
                }
            });

            // Close mobile menu on link click
            mobileNav.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeMobileNav);
            });

            // Close on press ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
                    closeMobileNav();
                }
            });
        }

        function openMobileNav() {
            hamburger.classList.add('active');
            mobileNav.classList.add('open');
            bodyEl.style.overflow = 'hidden';
        }

        function closeMobileNav() {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('open');
            bodyEl.style.overflow = '';
        }
    }

    /* ============================================================
       5. INTERSECTION OBSERVER FOR FADE-IN REVEALS
       ============================================================ */
    function initScrollObserver() {
        const revealElements = document.querySelectorAll(
            '.service-card, .plan-card, .schedule-card, .gallery-item, .feature-item, .section-header'
        );

        if (!revealElements.length) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        };

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(function(el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            observer.observe(el);
        });
    }

    /* ============================================================
       6. TOUCH & TACTILE FEEDBACK FOR MOBILE
       ============================================================ */
    function initTouchFeedback() {
        var interactives = document.querySelectorAll('.btn, .service-card, .plan-card, .schedule-card, .gallery-item, .social-icon-btn, .theme-toggle');

        interactives.forEach(function(el) {
            el.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.97)';
            }, { passive: true });

            el.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }

    /* ============================================================
       7. INITIALIZATION ON DOM READY
       ============================================================ */
    document.addEventListener('DOMContentLoaded', function() {
        initPreloader();
        initHeroParallax();
        initThemeToggle();
        initNavigation();
        initTouchFeedback();

        console.log('TSF Engine Loaded — Caranzalem, Goa 🥊');
    });

})();