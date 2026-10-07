/**
 * TSF MEMBER APP
 * Authentication, dashboard rendering, and actions.
 *
 * Uses Supabase for auth and data. Falls back to mock mode
 * when credentials are not configured.
 */

(function () {
    'use strict';

    /* ============================================================
       CONFIG
       ------------------------------------------------------------
       1. Create a free project at supabase.com
       2. Copy the project URL and anon key below
       3. Enable Google provider in Authentication → Providers
       4. Set the redirect URL to your members.tsfclub.com domain
       ============================================================ */
    const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

    /* Mock mode — dashboard renders with demo data when Supabase
       is not yet configured. Flip to false once credentials are set. */
    const USE_MOCK = SUPABASE_URL.includes('YOUR_SUPABASE');

    /* ============================================================
       DOM
       ============================================================ */
    const loginScreen     = document.getElementById('memberLoginScreen');
    const app             = document.getElementById('memberApp');
    const nav             = document.getElementById('memberNav');
    const actionsLoggedIn = document.getElementById('memberActionsLoggedIn');
    const actionsLoggedOut = document.getElementById('memberActionsLoggedOut');
    const googleBtn       = document.getElementById('memberGoogleBtn');

    const avatarBtn       = document.getElementById('memberAvatarBtn');
    const menu            = document.getElementById('memberMenu');
    const logoutBtn       = document.getElementById('memberLogoutBtn');
    const notifBtn        = document.getElementById('memberNotifBtn');

    const hamburger       = document.getElementById('memberHamburger');
    const mobileMenu      = document.getElementById('memberMobileMenu');
    const mobileLogout    = document.getElementById('memberMobileLogout');

    const heroFirstName   = document.getElementById('memberFirstName');
    const heroDate        = document.getElementById('memberHeroDate');
    const heroPhoto       = document.getElementById('memberHeroPhoto');
    const heroLede        = document.getElementById('memberHeroLede');

    const menuName        = document.getElementById('memberMenuName');
    const menuEmail       = document.getElementById('memberMenuEmail');
    const avatarImg       = document.getElementById('memberAvatarImg');

    const programName     = document.getElementById('memberProgramName');
    const programStatus   = document.getElementById('memberProgramStatus');
    const durationEl      = document.getElementById('memberDuration');
    const statStreak      = document.getElementById('memberStatStreak');
    const statSessions    = document.getElementById('memberStatSessions');
    const statDays        = document.getElementById('memberStatDays');

    /* ============================================================
       SUPABASE CLIENT
       ============================================================ */
    let supabase = null;

    if (!USE_MOCK && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    /* ============================================================
       MOCK MEMBER DATA
       ============================================================ */
    const MOCK_MEMBER = {
        full_name: 'Arjun Sharma',
        email: 'arjun.sharma@gmail.com',
        program: 'Kickboxing & MMA',
        status: 'Active',
        photo_url: '',
        streak: 18,
        sessions: 47,
        days_left: 82,
        total_days: 195,
        joined: '2026-06-15',
        fee_due: 3000,
        fee_due_date: '2026-10-11'
    };

    /* ============================================================
       HELPERS
       ============================================================ */
    function firstNameOf(fullName) {
        if (!fullName) return 'there';
        return fullName.split(' ')[0];
    }

    function formatToday() {
        const d = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return days[d.getDay()] + ' · ' + d.getDate() + ' ' + months[d.getMonth()];
    }

    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function durationBetween(joinedISO) {
        if (!joinedISO) return '—';
        const joined = new Date(joinedISO);
        const now = new Date();
        const days = Math.floor((now - joined) / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const remDays = days % 30;
        if (months === 0) return days + ' day' + (days !== 1 ? 's' : '');
        return months + ' month' + (months !== 1 ? 's' : '') + ', ' + remDays + ' days';
    }

    /* ============================================================
       RENDER — LOGGED OUT
       ============================================================ */
    function showLoggedOut() {
        loginScreen.hidden = false;
        app.hidden = true;
        nav.hidden = true;
        actionsLoggedIn.hidden = true;
        actionsLoggedOut.hidden = false;
    }

    /* ============================================================
       RENDER — LOGGED IN
       ============================================================ */
    function showLoggedIn(member) {
        loginScreen.hidden = true;
        app.hidden = false;
        nav.hidden = false;
        actionsLoggedIn.hidden = false;
        actionsLoggedOut.hidden = true;

        /* Name */
        heroFirstName.textContent = firstNameOf(member.full_name);
        menuName.textContent = member.full_name;
        menuEmail.textContent = member.email;

        /* Photo */
        if (member.photo_url) {
            heroPhoto.src = member.photo_url;
            avatarImg.src = member.photo_url;
        }

        /* Hero */
        heroDate.textContent = formatToday();
        heroLede.textContent = 'You have ' + (member.sessions || 0) +
            ' sessions logged and a ' + (member.streak || 0) + '-day streak. Keep it going.';

        /* Program */
        programName.textContent = member.program || '—';
        programStatus.textContent = member.status || 'Active';
        durationEl.textContent = durationBetween(member.joined);

        /* Stats */
        statStreak.textContent = member.streak || 0;
        statSessions.textContent = member.sessions || 0;
        statDays.textContent = member.days_left || 0;

        /* Progress bar width */
        const progressPct = member.days_left && member.total_days
            ? Math.round(((member.total_days - member.days_left) / member.total_days) * 100)
            : 42;
        const bar = document.querySelector('.member-progress-bar');
        const caption = document.querySelector('.member-progress-caption');
        if (bar) bar.style.width = progressPct + '%';
        if (caption && member.days_left) {
            caption.textContent = member.days_left + ' of ' + member.total_days +
                ' days remaining';
        }
    }

    /* ============================================================
       AUTH FLOW
       ============================================================ */
    async function handleGoogleSignIn() {
        if (USE_MOCK) {
            /* Preview mode — show dashboard with mock data */
            showLoggedIn(MOCK_MEMBER);
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/members.html'
            }
        });

        if (error) {
            console.error('Sign-in error:', error.message);
            alert('Could not sign in. Please try again.');
        }
    }

    async function handleSignOut() {
        if (USE_MOCK) {
            showLoggedOut();
            return;
        }
        await supabase.auth.signOut();
        showLoggedOut();
    }

    /* ============================================================
       SESSION BOOTSTRAP
       ============================================================ */
    async function bootstrap() {
        if (USE_MOCK) {
            /* Preview mode: default to logged-out view.
               To preview the dashboard, either:
               a) click the Google button (it just shows the dashboard), or
               b) uncomment the line below. */
            // showLoggedIn(MOCK_MEMBER);
            showLoggedOut();
            return;
        }

        /* Real mode: check existing session */
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.user) {
            /* Fetch member profile from database */
            const { data: member } = await supabase
                .from('members')
                .select('*')
                .eq('email', session.user.email)
                .single();

            if (member) {
                if (!member.photo_url && session.user.user_metadata && session.user.user_metadata.avatar_url) {
                    member.photo_url = session.user.user_metadata.avatar_url;
                }
                showLoggedIn(member);
            } else {
                /* Signed in with Google but no member record — prompt to register */
                showLoggedOut();
            }
        } else {
            showLoggedOut();
        }

        /* React to future auth changes */
        supabase.auth.onAuthStateChange(function (_event, _session) {
            window.location.reload();
        });
    }

    /* ============================================================
       UI EVENT WIRING
       ============================================================ */
    function initUI() {
        /* Google sign-in */
        if (googleBtn) {
            googleBtn.addEventListener('click', handleGoogleSignIn);
        }

        /* Avatar menu */
        if (avatarBtn && menu) {
            avatarBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const isOpen = !menu.hidden;
                menu.hidden = isOpen;
                avatarBtn.setAttribute('aria-expanded', String(!isOpen));
            });

            document.addEventListener('click', function (e) {
                if (!menu.hidden && !menu.contains(e.target) && e.target !== avatarBtn) {
                    menu.hidden = true;
                    avatarBtn.setAttribute('aria-expanded', 'false');
                }
            });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && !menu.hidden) {
                    menu.hidden = true;
                    avatarBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        /* Logout */
        if (logoutBtn) logoutBtn.addEventListener('click', handleSignOut);
        if (mobileLogout) mobileLogout.addEventListener('click', handleSignOut);

        /* Mobile menu */
        if (hamburger && mobileMenu) {
            hamburger.addEventListener('click', function () {
                const isOpen = !mobileMenu.hidden;
                mobileMenu.hidden = isOpen;
                hamburger.setAttribute('aria-expanded', String(!isOpen));
                document.body.style.overflow = isOpen ? '' : 'hidden';
            });

            mobileMenu.querySelectorAll('a').forEach(function (a) {
                a.addEventListener('click', function () {
                    mobileMenu.hidden = true;
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                });
            });
        }

        /* Notifications (placeholder for now) */
        if (notifBtn) {
            notifBtn.addEventListener('click', function () {
                console.log('Notifications panel — to be built');
            });
        }

        /* Pay button */
        const payBtn = document.getElementById('memberPayBtn');
        if (payBtn) {
            payBtn.addEventListener('click', function () {
                /* Will redirect to Razorpay checkout once configured */
                window.open('https://rzp.io/l/tsf-monthly-fee', '_blank', 'noopener');
            });
        }

        /* Event interest buttons */
        document.querySelectorAll('.member-event-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const wasActive = btn.classList.toggle('is-active');
                btn.textContent = wasActive ? 'Interested ✓' : 'Interested';
                btn.style.color = wasActive ? 'var(--red-core)' : '';
                btn.style.borderColor = wasActive ? 'var(--red-line)' : '';
                btn.style.background = wasActive ? 'var(--red-subtle)' : '';
            });
        });

        /* Theme toggle (mirrors main site) */
        const themeCheckboxes = document.querySelectorAll('#mobileThemeCheckbox');
        const htmlEl = document.documentElement;
        const savedTheme = localStorage.getItem('tsf-theme') || 'dark';
        htmlEl.setAttribute('data-theme', savedTheme);
        themeCheckboxes.forEach(function (cb) { cb.checked = savedTheme === 'light'; });
        themeCheckboxes.forEach(function (cb) {
            cb.addEventListener('change', function () {
                const next = this.checked ? 'light' : 'dark';
                htmlEl.setAttribute('data-theme', next);
                localStorage.setItem('tsf-theme', next);
            });
        });
    }

    /* ============================================================
       BOOT
       ============================================================ */
    document.addEventListener('DOMContentLoaded', function () {
        initUI();
        bootstrap();
        console.log('TSF Member app loaded. Mock mode:', USE_MOCK);
    });

})();
