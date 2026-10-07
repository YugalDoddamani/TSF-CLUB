const SUPABASE_URL = 'https://wmuttbriuhduzoaejxio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CVghIdN9OoY-HMDayZTzyw_1_9ORJPf';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentMember = null;
let currentProgram = null;
let currentDate = new Date();
let attendanceData = [];

// ---------- Auth Guard ----------
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = 'authentication.html';
    return;
  }

  const { data: member } = await supabaseClient
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!member || !member.onboarding_complete) {
    window.location.href = 'authentication.html';
    return;
  }

  currentMember = member;

  if (member.program_id) {
    const { data } = await supabaseClient
      .from('programs')
      .select('name')
      .eq('id', member.program_id)
      .single();
    currentProgram = data;
  }

  await fetchAttendance();
  renderHome(member, session.user);
  renderProfile(member, session.user);
  renderCalendar();
}

// ---------- Data Fetching ----------
async function fetchAttendance() {
  const { data, error } = await supabaseClient
    .from('attendance')
    .select('class_date')
    .eq('member_id', currentMember.id);

  if (error) {
    console.error('Error fetching attendance:', error);
    return;
  }
  attendanceData = data.map(a => a.class_date);
}

// ---------- Home Tab Rendering ----------
function renderHome(member, user) {
  const name = member.full_name || user.email.split('@')[0];
  document.getElementById('greeting').textContent = name;
  document.getElementById('home-program').textContent = currentProgram?.name || 'Not assigned';
  document.getElementById('home-streak').textContent = member.streak_count || 0;

  // Check if today is already marked
  const todayStr = new Date().toISOString().split('T')[0];
  const isMarkedToday = attendanceData.includes(todayStr);
  
  const markCard = document.getElementById('mark-attendance-card');
  const markBtn = document.getElementById('mark-today-btn');

  if (isMarkedToday) {
    markCard.innerHTML = `
      <h2>Session completed</h2>
      <p class="subtitle" style="margin-bottom:0;">You have already marked your attendance for today. Great work.</p>
    `;
  } else {
    markBtn.addEventListener('click', handleMarkAttendance);
  }
}

// ---------- Mark Attendance Logic ----------
async function handleMarkAttendance() {
  const btn = document.getElementById('mark-today-btn');
  btn.disabled = true;
  btn.textContent = 'Marking...';

  const todayStr = new Date().toISOString().split('T')[0];

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
    btn.disabled = false;
    btn.textContent = "Mark today's session";
    return;
  }

  // Update streak count in members table
  const newStreak = (currentMember.streak_count || 0) + 1;
  await supabaseClient
    .from('members')
    .update({ streak_count: newStreak })
    .eq('id', currentMember.id);

  // Update local state
  currentMember.streak_count = newStreak;
  attendanceData.push(todayStr);

  // Re-render
  renderHome(currentMember, { email: currentMember.email });
  renderCalendar();
}

// ---------- Calendar Tab Rendering ----------
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById('current-month-year').textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  // Add days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day';
    dayEl.textContent = d;

    if (dateStr === todayStr) {
      dayEl.classList.add('today');
    }

    if (attendanceData.includes(dateStr)) {
      dayEl.classList.add('attended');
    }

    if (new Date(dateStr) > today) {
      dayEl.classList.add('future');
    } else {
      dayEl.addEventListener('click', () => toggleAttendance(dateStr));
    }

    grid.appendChild(dayEl);
  }
}

async function toggleAttendance(dateStr) {
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateStr > todayStr) return; // Prevent future marking

  const isAttended = attendanceData.includes(dateStr);

  if (isAttended) {
    // Remove attendance
    const { error } = await supabaseClient
      .from('attendance')
      .delete()
      .eq('member_id', currentMember.id)
      .eq('class_date', dateStr);

    if (!error) {
      attendanceData = attendanceData.filter(d => d !== dateStr);
      currentMember.streak_count = Math.max(0, (currentMember.streak_count || 1) - 1);
      await supabaseClient.from('members').update({ streak_count: currentMember.streak_count }).eq('id', currentMember.id);
    }
  } else {
    // Add attendance
    const { error } = await supabaseClient
      .from('attendance')
      .insert({ member_id: currentMember.id, class_date: dateStr, attended: true });

    if (!error) {
      attendanceData.push(dateStr);
      currentMember.streak_count = (currentMember.streak_count || 0) + 1;
      await supabaseClient.from('members').update({ streak_count: currentMember.streak_count }).eq('id', currentMember.id);
    }
  }

  renderHome(currentMember, { email: currentMember.email });
  renderCalendar();
}

// Month navigation
document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// ---------- Profile Tab Rendering ----------
function renderProfile(member, user) {
  const name = member.full_name || user.email.split('@')[0];
  document.getElementById('profile-avatar').textContent = getInitials(name);
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-email').textContent = member.email || user.email;

  document.getElementById('pv-whatsapp').textContent = member.whatsapp_number || '-';
  document.getElementById('pv-emg-name').textContent = member.emergency_name || '-';
  document.getElementById('pv-emg-phone').textContent = member.emergency_phone || '-';

  document.getElementById('pv-height').textContent = member.height ? `${member.height} cm` : '-';
  document.getElementById('pv-weight').textContent = member.weight ? `${member.weight} kg` : '-';

    document.getElementById('pv-blood').textContent = member.blood_group || '-';

  // Render preferences as pills
  const prefContainer = document.getElementById('pv-preferences');
  if (member.preferences && member.preferences.length > 0) {
    prefContainer.innerHTML = member.preferences
      .map(p => `<span class="pref-pill">${p}</span>`)
      .join('');
  } else {
    prefContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.875rem;">None selected</span>';
  }

  document.getElementById('pv-payment').textContent = member.payment_status || 'Due';
  document.getElementById('pv-due').textContent = member.amount_due != null ? `Rs. ${member.amount_due}` : 'Rs. 0';
  document.getElementById('pv-expiry').textContent = member.membership_expiry ? formatDate(member.membership_expiry) : 'Not set';
}

// ---------- Tab Navigation ----------
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ---------- Sign Out ----------
document.getElementById('signout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'authentication.html';
});

// ---------- Utilities ----------
function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function getInitials(name) {
  if (!name) return '--';
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');
}

// ---------- Boot ----------
checkAuth();
