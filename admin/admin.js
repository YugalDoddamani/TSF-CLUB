/* ============================================================
   TSF Admin — admin.js
   ============================================================ */

const SUPABASE_URL = 'https://wmuttbriuhduzoaejxio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CVghIdN9OoY-HMDayZTzyw_1_9ORJPf';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);

/* ---------- State ---------- */
let currentAdmin = null;
let allMembers = [];
let allPrograms = [];
let allPayments = [];
let filter = { search: '', status: 'all' };
let selectedMemberId = null;

/* ============================================================
   BOOT
   ============================================================ */

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { showLogin(); return; }

  const { data: member } = await sb
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!member || member.role !== 'admin') {
    await sb.auth.signOut();
    showLogin('This account does not have admin access.');
    return;
  }

  currentAdmin = member;
  showApp();
  await loadAll();
  renderAll();
}

function showLogin(msg) {
  $('login-view').classList.add('active');
  $('app-view').classList.remove('active');
  if (msg) showLoginMessage(msg, 'error');
}

function showApp() {
  $('login-view').classList.remove('active');
  $('app-view').classList.add('active');

  const name = currentAdmin.full_name || currentAdmin.email || 'Admin';
  $('admin-name').textContent = name;
  $('admin-email').textContent = currentAdmin.email || '-';
  $('admin-avatar').textContent = initials(name);
}

/* ============================================================
   LOGIN
   ============================================================ */

const loginForm = $('login-form');
const loginMessage = $('login-message');

function showLoginMessage(text, type = '') {
  loginMessage.textContent = text;
  loginMessage.className = 'form-message' + (type ? ' ' + type : '');
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoginMessage('');

  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const btn = $('login-submit');

  if (!email || !password) {
    showLoginMessage('Enter your email and password.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Sign in';
    showLoginMessage(error.message, 'error');
    return;
  }

  const { data: member } = await sb
    .from('members')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!member || member.role !== 'admin') {
    await sb.auth.signOut();
    btn.disabled = false;
    btn.textContent = 'Sign in';
    showLoginMessage('This account does not have admin access.', 'error');
    return;
  }

  currentAdmin = member;
  showApp();
  await loadAll();
  renderAll();
});

$('signout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

/* ============================================================
   DATA LOADING
   ============================================================ */

async function loadAll() {
  const [programsRes, membersRes, paymentsRes] = await Promise.all([
    sb.from('programs').select('*').order('name'),
    sb.from('members').select('*').order('full_name'),
    sb.from('payments')
      .select('id, member_id, amount, method, notes, paid_at, period_start, period_end')
      .order('paid_at', { ascending: false })
      .limit(500)
  ]);

  allPrograms = programsRes.data || [];
  allMembers = (membersRes.data || []).filter(m => m.role !== 'admin');
  allPayments = paymentsRes.data || [];
}

/* ============================================================
   HELPERS
   ============================================================ */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatDateTime(str) {
  if (!str) return '-';
  return new Date(str).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function formatRs(n) {
  const num = Number(n) || 0;
  return `Rs. ${num.toLocaleString('en-IN')}`;
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function initials(name) {
  if (!name) return 'A';
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');
}

function getProgram(id) {
  return allPrograms.find(p => p.id === id) || null;
}

function getMember(id) {
  return allMembers.find(m => m.id === id) || null;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Compute payment status from expiry + amount due.
   Priority:
     1. If amount_due > 0 -> due (with that amount)
     2. If no expiry -> due (with program fee)
     3. If expiry in future -> paid
     4. If expiry past -> due/overdue (overdue if >5 days) */
function computeStatus(member) {
  const today = startOfToday();
  const expiry = member.membership_expiry ? new Date(member.membership_expiry) : null;
  const amountDue = Number(member.amount_due) || 0;
  const program = getProgram(member.program_id);
  const programFee = program ? Number(program.fee) || 0 : 0;

  if (!expiry) {
    return { status: 'due', days: null, amount: amountDue || programFee };
  }

  if (expiry >= today) {
    if (amountDue > 0) return { status: 'due', days: 0, amount: amountDue };
    return { status: 'paid', days: daysBetween(today, expiry), amount: 0 };
  }

  const daysPast = daysBetween(expiry, today);
  const status = daysPast > 5 ? 'overdue' : 'due';
  return { status, days: -daysPast, amount: amountDue > 0 ? amountDue : programFee };
}

/* ============================================================
   TAB NAVIGATION
   ============================================================ */

document.querySelectorAll('.sidebar-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ============================================================
   RENDER ALL
   ============================================================ */

function renderAll() {
  renderOverview();
  renderMembersTable();
  renderPaymentsTable();
}

/* ============================================================
   OVERVIEW
   ============================================================ */

function renderOverview() {
  let paid = 0, due = 0, overdue = 0;
  const attention = [];

  allMembers.forEach(m => {
    const s = computeStatus(m);
    if (s.status === 'paid') paid++;
    else if (s.status === 'due') due++;
    else overdue++;

    if (s.status !== 'paid') {
      attention.push({ member: m, status: s.status, days: s.days, amount: s.amount });
    }
  });

  // Sort attention: overdue first, then most days overdue, then by amount
  attention.sort((a, b) => {
    const order = { overdue: 0, due: 1 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    const aDays = a.days ?? 0;
    const bDays = b.days ?? 0;
    return aDays - bDays;
  });

  $('stats-row').innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Total members</span>
      <span class="stat-value">${allMembers.length}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Paid</span>
      <span class="stat-value">${paid}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Due</span>
      <span class="stat-value is-due">${due}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Overdue</span>
      <span class="stat-value is-overdue">${overdue}</span>
    </div>
  `;

  const listEl = $('attention-list');
  if (attention.length === 0) {
    listEl.innerHTML = '<div class="empty-state">All members are paid up. Nothing needs attention.</div>';
    return;
  }

  listEl.innerHTML = attention.slice(0, 12).map(({ member, status, days, amount }) => {
    const program = getProgram(member.program_id);
    const name = escapeHtml(member.full_name || member.email || 'Member');
    const programName = escapeHtml(program?.name || 'No program');
    let daysLabel = '';
    if (status === 'overdue') daysLabel = `${Math.abs(days)} days overdue`;
    else if (days === 0) daysLabel = 'due now';
    else if (days === null) daysLabel = 'not set';

    return `
      <div class="attention-item" data-member-id="${member.id}">
        <div>
          <div class="attention-name">${name}</div>
          <div class="attention-meta">${programName}</div>
        </div>
        <div class="attention-right">
          <div class="attention-amount">${formatRs(amount)}</div>
          <div class="attention-days">${daysLabel}</div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.attention-item').forEach(el => {
    el.addEventListener('click', () => openDrawer(el.dataset.memberId));
  });
}

/* ============================================================
   MEMBERS TABLE
   ============================================================ */

$('member-search').addEventListener('input', (e) => {
  filter.search = e.target.value.toLowerCase().trim();
  renderMembersTable();
});

$('member-filter').addEventListener('change', (e) => {
  filter.status = e.target.value;
  renderMembersTable();
});

function renderMembersTable() {
  const body = $('members-body');

  let list = allMembers.map(m => ({ member: m, s: computeStatus(m) }));

  if (filter.search) {
    list = list.filter(({ member }) => {
      const haystack = [
        member.full_name,
        member.email,
        member.whatsapp_number
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(filter.search);
    });
  }

  if (filter.status !== 'all') {
    list = list.filter(({ s }) => s.status === filter.status);
  }

  // Sort: overdue first, then due, then paid
  const order = { overdue: 0, due: 1, paid: 2 };
  list.sort((a, b) => {
    if (order[a.s.status] !== order[b.s.status]) return order[a.s.status] - order[b.s.status];
    const aName = (a.member.full_name || '').toLowerCase();
    const bName = (b.member.full_name || '').toLowerCase();
    return aName.localeCompare(bName);
  });

  $('member-count').textContent = `${list.length} ${list.length === 1 ? 'member' : 'members'}`;

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="6"><div class="empty-state">No members match this filter.</div></td></tr>';
    return;
  }

  body.innerHTML = list.map(({ member, s }) => {
    const program = getProgram(member.program_id);
    const name = escapeHtml(member.full_name || 'Unnamed');
    const email = escapeHtml(member.email || '');
    const programName = escapeHtml(program?.name || 'Not assigned');
    const expiry = member.membership_expiry ? formatDate(member.membership_expiry) : 'Not set';

    let statusLabel = s.status;
    if (s.status === 'due' && s.days === 0) statusLabel = 'due';
    else if (s.status === 'overdue') statusLabel = 'overdue';

    const amountDisplay = s.status === 'paid' ? '—' : formatRs(s.amount);

    return `
      <tr class="is-clickable" data-member-id="${member.id}">
        <td>
          <div class="cell-name">${name}</div>
          <div class="cell-sub">${email}</div>
        </td>
        <td>${programName}</td>
        <td>${expiry}</td>
        <td><span class="status-pill status-${s.status}">${statusLabel}</span></td>
        <td class="col-amount"><span class="cell-amount">${amountDisplay}</span></td>
        <td class="col-action">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </td>
      </tr>
    `;
  }).join('');

  body.querySelectorAll('tr[data-member-id]').forEach(row => {
    row.addEventListener('click', () => openDrawer(row.dataset.memberId));
  });
}

/* ============================================================
   PAYMENTS TABLE
   ============================================================ */

function renderPaymentsTable() {
  const body = $('payments-body');

  if (allPayments.length === 0) {
    body.innerHTML = '<tr><td colspan="5"><div class="empty-state">No payments recorded yet.</div></td></tr>';
    return;
  }

  body.innerHTML = allPayments.slice(0, 200).map(p => {
    const member = getMember(p.member_id);
    const memberName = member ? escapeHtml(member.full_name || member.email || 'Member') : 'Unknown';
    const date = formatDateTime(p.paid_at);
    const amount = formatRs(p.amount);
    const method = escapeHtml(p.method || '—');
    const notes = escapeHtml(p.notes || '');

    return `
      <tr>
        <td><span class="cell-sub" style="font-size:0.8125rem;color:var(--text-primary);">${date}</span></td>
        <td>${memberName}</td>
        <td class="col-amount"><span class="cell-amount">${amount}</span></td>
        <td>${method}</td>
        <td><span style="color: var(--text-secondary); font-size: 0.8125rem;">${notes}</span></td>
      </tr>
    `;
  }).join('');
}

/* ============================================================
   DRAWER — MEMBER DETAIL
   ============================================================ */

function openDrawer(memberId) {
  const member = getMember(memberId);
  if (!member) return;

  selectedMemberId = memberId;

  const program = getProgram(member.program_id);
  const status = computeStatus(member);

  $('drawer-name').textContent = member.full_name || 'Unnamed member';
  $('drawer-sub').textContent = `${program?.name || 'No program'} · ${status.status}`;

  const programFee = program ? Number(program.fee) || 0 : 0;
  const amountDue = Number(member.amount_due) || 0;
  const currentDueValue = amountDue > 0 ? amountDue : (status.status === 'paid' ? 0 : programFee);

  const myPayments = allPayments
    .filter(p => p.member_id === memberId)
    .slice(0, 8);

  $('drawer-body').innerHTML = `
    <div class="drawer-section">
      <h3>Payment cycle</h3>
      <div class="drawer-edit-grid">
        <div class="form-group">
          <label for="edit-expiry">Membership expires</label>
          <input type="date" id="edit-expiry" value="${member.membership_expiry || ''}">
        </div>
        <div class="form-group">
          <label for="edit-amount">Amount due (Rs.)</label>
          <input type="number" id="edit-amount" value="${currentDueValue}" min="0" step="50">
        </div>
      </div>
      <div class="drawer-actions">
        <button class="btn btn-ghost btn-sm" id="save-changes-btn">Save changes</button>
        <button class="btn btn-primary btn-sm" id="mark-paid-btn">Mark paid</button>
      </div>
      <p style="font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-muted); margin-top: 12px; letter-spacing: 0.05em;">
        Mark paid advances expiry by one cycle (${program?.duration_months || 1} ${(program?.duration_months || 1) === 1 ? 'month' : 'months'}) and records a payment of ${formatRs(programFee)}.
      </p>
    </div>

    <div class="drawer-section">
      <h3>Log a custom payment</h3>
      <div class="drawer-edit-grid">
        <div class="form-group">
          <label for="custom-amount">Amount (Rs.)</label>
          <input type="number" id="custom-amount" placeholder="0" min="0">
        </div>
        <div class="form-group">
          <label for="custom-method">Method</label>
          <select id="custom-method">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="razorpay">Razorpay</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="custom-notes">Notes</label>
        <input type="text" id="custom-notes" placeholder="e.g. PT session, event fee">
      </div>
      <div class="drawer-actions">
        <button class="btn btn-ghost btn-sm" id="log-payment-btn">Record payment</button>
      </div>
    </div>

    <div class="drawer-section">
      <h3>Contact</h3>
      <dl class="detail-list">
        <div class="detail-row"><dt>Email</dt><dd>${escapeHtml(member.email || '-')}</dd></div>
        <div class="detail-row"><dt>WhatsApp</dt><dd>${escapeHtml(member.whatsapp_number || '-')}</dd></div>
        <div class="detail-row"><dt>Emergency</dt><dd>${escapeHtml(member.emergency_name || '-')}</dd></div>
        <div class="detail-row"><dt>Emergency phone</dt><dd>${escapeHtml(member.emergency_phone || '-')}</dd></div>
      </dl>
    </div>

    <div class="drawer-section">
      <h3>Membership</h3>
      <dl class="detail-list">
        <div class="detail-row"><dt>Program</dt><dd>${escapeHtml(program?.name || 'Not assigned')}</dd></div>
        <div class="detail-row"><dt>Joined</dt><dd>${formatDate(member.joining_date)}</dd></div>
        <div class="detail-row"><dt>Cycle fee</dt><dd>${formatRs(programFee)}</dd></div>
        <div class="detail-row"><dt>Total sessions</dt><dd>${member.streak_count ?? 0}</dd></div>
      </dl>
    </div>

    <div class="drawer-section">
      <h3>Metrics</h3>
      <dl class="detail-list">
        <div class="detail-row"><dt>Height</dt><dd>${member.height ? member.height + ' cm' : '-'}</dd></div>
        <div class="detail-row"><dt>Weight</dt><dd>${member.weight ? member.weight + ' kg' : '-'}</dd></div>
        <div class="detail-row"><dt>Blood group</dt><dd>${escapeHtml(member.blood_group || '-')}</dd></div>
      </dl>
    </div>

    <div class="drawer-section">
      <h3>Recent payments</h3>
      <div class="payment-history">
        ${myPayments.length === 0
          ? '<div class="empty-state" style="padding: 12px 0;">No payments recorded yet.</div>'
          : myPayments.map(p => `
            <div class="payment-item">
              <div>
                <div class="payment-amount">${formatRs(p.amount)}</div>
                <div class="payment-date">${formatDateTime(p.paid_at)} · ${escapeHtml(p.method || '')}</div>
              </div>
              <div class="payment-date">${escapeHtml(p.notes || '')}</div>
            </div>
          `).join('')}
      </div>
    </div>

    <div class="drawer-section">
      <h3>Danger zone</h3>
      <button class="btn-sm-danger" id="reset-onboarding-btn">Reset onboarding</button>
      <p style="font-family: var(--font-mono); font-size: 0.625rem; color: var(--text-muted); margin-top: 8px; letter-spacing: 0.05em;">
        Removes the member row. They will be able to onboard again from scratch.
      </p>
    </div>
  `;

  // Bind drawer actions
  $('save-changes-btn').addEventListener('click', saveMemberChanges);
  $('mark-paid-btn').addEventListener('click', markPaid);
  $('log-payment-btn').addEventListener('click', logCustomPayment);
  $('reset-onboarding-btn').addEventListener('click', resetOnboarding);

  $('member-drawer').classList.add('open');
  $('member-drawer').setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  $('member-drawer').classList.remove('open');
  $('member-drawer').setAttribute('aria-hidden', 'true');
  selectedMemberId = null;
}

$('drawer-close').addEventListener('click', closeDrawer);
$('drawer-backdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

/* ============================================================
   DRAWER ACTIONS
   ============================================================ */

async function saveMemberChanges() {
  const member = getMember(selectedMemberId);
  if (!member) return;

  const expiry = $('edit-expiry').value || null;
  const amount = Number($('edit-amount').value) || 0;

  const { error } = await sb
    .from('members')
    .update({
      membership_expiry: expiry,
      amount_due: amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', member.id);

  if (error) {
    showToast('Could not save changes: ' + error.message, 'error');
    return;
  }

  showToast('Changes saved.', 'success');
  await loadAll();
  renderAll();
  openDrawer(member.id);
}

async function markPaid() {
  const member = getMember(selectedMemberId);
  if (!member) return;

  const program = getProgram(member.program_id);
  const cycleMonths = program?.duration_months || 1;
  const fee = Number(program?.fee) || 0;

  // Compute new expiry: from today (if expired) or from current expiry
  const today = startOfToday();
  const currentExpiry = member.membership_expiry ? new Date(member.membership_expiry) : today;
  const base = currentExpiry > today ? currentExpiry : today;
  const newExpiry = new Date(base);
  newExpiry.setMonth(newExpiry.getMonth() + cycleMonths);
  const newExpiryStr = toDateStr(newExpiry);

  const periodStart = toDateStr(base);
  const periodEnd = newExpiryStr;

  // 1. Log the payment
  const { error: payErr } = await sb.from('payments').insert({
    member_id: member.id,
    amount: fee,
    method: 'cash',
    notes: `Membership renewed to ${newExpiryStr}`,
    recorded_by: currentAdmin.id,
    period_start: periodStart,
    period_end: periodEnd
  });

  if (payErr) {
    showToast('Payment log failed: ' + payErr.message, 'error');
    return;
  }

  // 2. Update member
  const { error: memErr } = await sb
    .from('members')
    .update({
      membership_expiry: newExpiryStr,
      amount_due: 0,
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', member.id);

  if (memErr) {
    showToast('Member update failed: ' + memErr.message, 'error');
    return;
  }

  showToast(`Marked paid. Expiry extended to ${formatDate(newExpiryStr)}.`, 'success');
  await loadAll();
  renderAll();
  openDrawer(member.id);
}

async function logCustomPayment() {
  const member = getMember(selectedMemberId);
  if (!member) return;

  const amount = Number($('custom-amount').value) || 0;
  const method = $('custom-method').value;
  const notes = $('custom-notes').value.trim();

  if (amount <= 0) {
    showToast('Enter an amount greater than 0.', 'error');
    return;
  }

  const { error } = await sb.from('payments').insert({
    member_id: member.id,
    amount,
    method,
    notes: notes || 'Custom payment',
    recorded_by: currentAdmin.id
  });

  if (error) {
    showToast('Could not record payment: ' + error.message, 'error');
    return;
  }

  showToast(`Payment of ${formatRs(amount)} recorded.`, 'success');
  await loadAll();
  renderAll();
  openDrawer(member.id);
}

async function resetOnboarding() {
  const member = getMember(selectedMemberId);
  if (!member) return;

  const confirmed = confirm(
    `Reset onboarding for ${member.full_name || member.email}?\n\n` +
    `This will delete their member row. Their login account will remain, but they will ` +
    `be sent through onboarding again the next time they sign in.\n\n` +
    `This cannot be undone.`
  );
  if (!confirmed) return;

  const { error } = await sb.from('members').delete().eq('id', member.id);

  if (error) {
    showToast('Could not reset: ' + error.message, 'error');
    return;
  }

  showToast('Onboarding reset.', 'success');
  closeDrawer();
  await loadAll();
  renderAll();
}

/* ============================================================
   TOAST
   ============================================================ */

let toastTimer = null;
function showToast(message, type = '') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ============================================================
   BOOT
   ============================================================ */

boot();
