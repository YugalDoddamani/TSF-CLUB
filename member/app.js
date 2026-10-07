/* ============================================================
   TSF Members — app.js
   Handles auth guard, data loading, and rendering for the
   dashboard, attendance calendar, and profile tabs.
   ============================================================ */

const SUPABASE_URL = 'https://wmuttbriuhduzoaejxio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CVghIdN9OoY-HMDayZTzyw_1_9ORJPf';

/* Monthly attendance benchmark.
   Change this single value to update every progress label,
   aria value, and caption in the app. */
const MONTHLY_SESSION_GOAL = 12;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- State ---------- */
let currentMember = null;
let currentProgram = null;
let currentDate = new Date();
let attendanceData = []; // array of 'YYYY-MM-DD' strings

/* ---------- DOM helper ---------- */
const $ = (id) => document.getElementById(id);

/* ============================================================
   THEME
   ============================================================ */

function initTheme() {
  // Apply the stored (or system) theme immediately, regardless of
  // whether the toggle exists on this page. Prevents a flash of
  // the wrong theme on every load.
  const savedTheme = localStorage.getItem('tsf-theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', initialTheme);

  const toggle = $('theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tsf-theme', next);
  });
}

/* ============================================================
   BOOT
   ============================================================ */

async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = '/';
    return;
  }

  const { data: member, error: memberError } = await supabaseClient
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (memberError || !member || !member.onboarding_complete) {
    window.location.href = '/';
    return;
  }

  currentMember = member;

  if (member.program_id) {
    const { data: program } = await supabaseClient
      .from('programs')
      .select('name')
      .eq('id', member.program_id)
      .single();
    currentProgram = program;
  }

  await fetchAttendance();

  renderHome(member, session.user);
  renderProfile(member, session.user);
  renderCalendar();

  initTabNav();
  initSignOut();
  initMonthNav();
}

/* ============================================================
   DATA
   ============================================================ */

async function fetchAttendance() {
  const { data, error } = await supabaseClient
    .from('attendance')
    .select('class_date')
    .eq('member_id', currentMember.id)
    .order('class_date', { ascending: true });

  if (error) {
    console.error('Error fetching attendance:', error);
    attendanceData = [];
    return;
  }

  attendanceData = (data || []).map((row) => row.class_date);
}

/* ============================================================
   RENDER: HOME
   ============================================================ */

function renderHome(member, user) {
  const displayName = member.full_name || (user.email || '').split('@')[0] || 'Member';
  $('greeting').textContent = displayName;

  $('home-streak').textContent = member.streak_count ?? 0;
  $('home-program').textContent = currentProgram?.name || 'Not assigned';

  renderProgress();
  renderActionCard();
}

/* ---------- Monthly progress ---------- */

function renderProgress() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const attendedThisMonth = attendanceData.filter((d) => d.startsWith(monthKey)).length;
  const goal = MONTHLY_SESSION_GOAL;
  const percent = Math.min(100, Math.round((attendedThisMonth / goal) * 100));

  $('progress-attended').textContent = attendedThisMonth;
  $('progress-goal').textContent = goal;

  const track = $('progress-track');
  track.setAttribute('aria-valuemax', String(goal));
  track.setAttribute('aria-valuenow', String(attendedThisMonth));

  $('progress-fill').style.width = `${percent}%`;
  $('progress-caption').textContent = progressCaption(attendedThisMonth, goal);
}

function progressCaption(attended, goal) {
  if (attended === 0) return 'Start your first session of the month.';
  if (attended >= goal) return 'Monthly goal reached. Well done.';
  if (attended >= Math.ceil(goal / 2)) {
    const left = goal - attended;
    return `${left} more ${left === 1 ? 'session' : 'sessions'} to hit your monthly goal.`;
  }
  return 'You are getting started. Keep showing up.';
}

/* ---------- Today's action card ---------- */

function renderActionCard() {
  const card = $('mark-attendance-card');
  const todayStr = getLocalDateStr();
  const isMarked = attendanceData.includes(todayStr);

  if (isMarked) {
    card.classList.add('is-complete');
    card.innerHTML = `
      <span class="stat-label">Today</span>
      <h2>Session completed</h2>
      <div class="action-complete">
        <div class="action-complete-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
               stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p class="action-complete-text">You have already marked today. Great work.</p>
      </div>
    `;
  } else {
    card.classList.remove('is-complete');
    card.innerHTML = `
      <span class="stat-label">Today</span>
      <h2>Mark your session</h2>
      <p class="action-sub">Tap below once you have completed today's training.</p>
      <button type="button" id="mark-today-btn" class="btn btn-primary btn-block">
        Mark today's session
      </button>
    `;
    $('mark-today-btn').addEventListener('click', markToday);
  }
}

/* ============================================================
   RENDER: CALENDAR
   ============================================================ */

function renderCalendar() {
  const grid = $('calendar-grid');
  grid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  $('current-month-year').textContent = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getLocalDateStr();

  // Leading empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    empty.setAttribute('aria-hidden', 'true');
    grid.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isAttended = attendanceData.includes(dateStr);
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal-day';
    btn.textContent = d;

    if (isAttended) btn.classList.add('attended');
    if (isToday) btn.classList.add('today');
    if (isFuture) btn.disabled = true;

    const labelParts = [formatAriaDate(dateStr)];
    if (isAttended) labelParts.push('attended');
    if (isToday) labelParts.push('today');
    if (isFuture) labelParts.push('future');
    btn.setAttribute('aria-label', labelParts.join(', '));
    btn.setAttribute('aria-pressed', isAttended ? 'true' : 'false');

    if (!isFuture) {
      btn.addEventListener('click', () => toggleAttendance(dateStr));
    }

    grid.appendChild(btn);
  }
}

/* ============================================================
   ACTIONS
   ============================================================ */

async function markToday() {
  const btn = $('mark-today-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Marking...';
  }

  const todayStr = getLocalDateStr();

  const { error } = await supabaseClient
    .from('attendance')
    .insert({
      member_id: currentMember.id,
      class_date: todayStr,
      attended: true
    });

  if (error) {
    console.error('Error marking attendance:', error);
    alert('Could not mark attendance. Please try again.');
    renderActionCard();
    return;
  }

  attendanceData.push(todayStr);
  await recalculateStreak();

  renderHome(currentMember, { email: currentMember.email });
  renderCalendar();
}

async function toggleAttendance(dateStr) {
  const todayStr = getLocalDateStr();
  if (dateStr > todayStr) return;

  const isAttended = attendanceData.includes(dateStr);

  if (isAttended) {
    const { error } = await supabaseClient
      .from('attendance')
      .delete()
      .eq('member_id', currentMember.id)
      .eq('class_date', dateStr);

    if (error) {
      console.error('Error removing attendance:', error);
      return;
    }
    attendanceData = attendanceData.filter((d) => d !== dateStr);
  } else {
    const { error } = await supabaseClient
      .from('attendance')
      .insert({
        member_id: currentMember.id,
        class_date: dateStr,
        attended: true
      });

    if (error) {
      console.error('Error adding attendance:', error);
      return;
    }
    attendanceData.push(dateStr);
  }

  await recalculateStreak();

  renderHome(currentMember, { email: currentMember.email });
  renderCalendar();
}

async function recalculateStreak() {
  // Streak here = total sessions attended.
  const newStreak = attendanceData.length;
  if (currentMember.streak_count === newStreak) return;

  currentMember.streak_count = newStreak;

  const { error } = await supabaseClient
    .from('members')
    .update({ streak_count: newStreak })
    .eq('id', currentMember.id);

  if (error) {
    console.error('Error updating streak:', error);
  }
}

/* ============================================================
   RENDER: PROFILE
   ============================================================ */

function renderProfile(member, user) {
  const displayName = member.full_name || (user.email || '').split('@')[0] || 'Member';

  $('profile-avatar').textContent = getInitials(displayName);
  $('profile-name').textContent = displayName;
  $('profile-email').textContent = member.email || user.email || '-';

  $('pv-full-name').textContent = member.full_name || '-';
  $('pv-email').textContent = member.email || user.email || '-';
  $('pv-whatsapp').textContent = member.whatsapp_number || '-';
  $('pv-emg-name').textContent = member.emergency_name || '-';
  $('pv-emg-phone').textContent = member.emergency_phone || '-';

  $('pv-height').textContent = member.height ? `${member.height} cm` : '-';
  $('pv-weight').textContent = member.weight ? `${member.weight} kg` : '-';
  $('pv-blood').textContent = member.blood_group || '-';

  renderPreferences(member.preferences);

  $('pv-program').textContent = currentProgram?.name || 'Not assigned';
  $('pv-joining').textContent = member.joining_date ? formatDate(member.joining_date) : '-';
  $('pv-expiry').textContent = member.membership_expiry ? formatDate(member.membership_expiry) : 'Not set';
  $('pv-payment').textContent = capitalize(member.payment_status || 'due');

  const due = Number(member.amount_due) || 0;
  $('pv-due').textContent = `Rs. ${due.toLocaleString('en-IN')}`;

  const dueBlock = $('due-block');
  const paymentStatus = (member.payment_status || '').toLowerCase();
  const isDue = due > 0 || paymentStatus === 'due' || paymentStatus === 'overdue';
  dueBlock.classList.toggle('is-due', isDue);
}

function renderPreferences(prefs) {
  const container = $('pv-preferences');
  if (Array.isArray(prefs) && prefs.length > 0) {
    container.innerHTML = prefs
      .map((p) => `<span class="pref-pill">${escapeHtml(p)}</span>`)
      .join('');
  } else {
    container.innerHTML = '<span class="pref-empty">None selected</span>';
  }
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function initTabNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      navItems.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((p) => {
        p.classList.toggle('active', p.id === `tab-${target}`);
      });

      // Re-render calendar when returning to attendance tab
      if (target === 'streak') {
        renderCalendar();
      }
    });
  });
}

function initMonthNav() {
  $('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  $('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

function initSignOut() {
  $('signout-btn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  });
}

/* ============================================================
   UTILITIES
   ============================================================ */

function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatAriaDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getInitials(name) {
  if (!name) return '--';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   BOOT SEQUENCE
   ============================================================ */

// Apply theme first so there is no flash of the wrong colors.
initTheme();

// Then check auth and load the app.
checkAuth();
