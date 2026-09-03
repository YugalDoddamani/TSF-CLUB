/**
 * TSF FITNESS STUDIO — CORE ENGINE & INTERACTION CONTROLLER
 * Location: Caranzalem, Goa
 * Features: Orientation-Safe Image Loader, Dynamic Parallax, Theme Swapper, Mobile Navigation
 */

(function() {
    'use strict';

    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    function initPreloader() {
        const preloader = document.getElementById('tsfPreloader');
        const progressBar = document.getElementById('preloaderBar');
        const statusText = document.getElementById('preloaderStatus');

        if (!preloader || !progressBar) return;

        bodyEl.classList.add('preloader-active');

        let progress = 0;
        const loadingSteps = [
            { threshold: 35, text: 'LOADING ASSETS...' },
            { threshold: 70, text: 'PREPARING WORKOUT SPACE...' },
            { threshold: 90, text: 'CALIBRATING EQUIPMENT...' }
        ];

        const interval = setInterval(() => {
            const increment = Math.floor(Math.random() * 12) + 6;
            progress += increment;

            if (progress > 100) progress = 100;
            progressBar.style.width = progress + '%';

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
                setTimeout(dismissPreloader, 300);
            }
        }, 100);

        function dismissPreloader() {
            preloader.classList.add('fade-out');
            bodyEl.classList.remove('preloader-active');
            initScrollObserver();
            
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }

        window.addEventListener('load', function() {
            progress = 100;
            progressBar.style.width = '100%';
        });
    }

    function initHeroParallax() {
        const heroBg = document.getElementById('heroBg');
        const heroImg = document.querySelector('.hero-img');
        const target = heroImg || heroBg;
        if (!target) return;

        let ticking = false;

        function updateParallax() {
            // Disable parallax on screens under 768px or touch devices to prevent mobile dynamic viewport glitching
            if (window.innerWidth < 768) {
                target.style.transform = 'translate3d(0, 0, 0)';
                ticking = false;
                return;
            }

            const scrollY = window.pageYOffset;
            const translateY = scrollY * 0.25; // Subtle shift preventing boundary clipping
            target.style.transform = 'translate3d(0, ' + translateY + 'px, 0)';
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', updateParallax);
        updateParallax();
    }

    function initThemeToggle() {
        const themeCheckboxes = document.querySelectorAll('#themeCheckbox, #mobileThemeCheckbox');
        
        const savedTheme = localStorage.getItem('tsf-theme') || 'dark';
        htmlEl.setAttribute('data-theme', savedTheme);

        themeCheckboxes.forEach(cb => {
            if (cb) cb.checked = (savedTheme === 'light');
        });

        themeCheckboxes.forEach(cb => {
            if (!cb) return;
            cb.addEventListener('change', function() {
                const nextTheme = this.checked ? 'light' : 'dark';
                htmlEl.setAttribute('data-theme', nextTheme);
                localStorage.getItem('tsf-theme') !== nextTheme && localStorage.setItem('tsf-theme', nextTheme);
                
                themeCheckboxes.forEach(otherCb => {
                    if (otherCb !== this) otherCb.checked = this.checked;
                });
            });
        });
    }

    function initNavigation() {
        const hamburger = document.getElementById('hamburger');
        const mobileNav = document.getElementById('mobileNav');
        const header = document.getElementById('topBar');

        if (header) {
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 30) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }, { passive: true });
        }

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

            mobileNav.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeMobileNav);
            });

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

    function initScrollObserver() {
        const revealElements = document.querySelectorAll(
            '.service-card, .plan-card, .schedule-card, .gallery-item, .feature-item, .section-header, .about-grid'
        );

        if (!revealElements.length) return;

        const observerOptions = {
            threshold: 0.08,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
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
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            observer.observe(el);
        });
    }

    function initTouchFeedback() {
        const interactives = document.querySelectorAll('.btn, .service-card, .plan-card, .schedule-card, .gallery-item, .social-icon-btn');

        interactives.forEach(function(el) {
            el.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });

            el.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initPreloader();
        initHeroParallax();
        initThemeToggle();
        initNavigation();
        initTouchFeedback();

        console.log('TSF Engine Loaded & Image Orientations Calibrated — Goa 🥊');
    });

})();