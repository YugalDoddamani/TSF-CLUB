const SUPABASE_URL = 'https://wmuttbriuhduzoaejxio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CVghIdN9OoY-HMDayZTzyw_1_9ORJPf';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentMember = null;
let currentProgram = null;

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

  // Fetch program details once
  if (member.program_id) {
    const { data } = await supabaseClient
      .from('programs')
      .select('name, fee')
      .eq('id', member.program_id)
      .single();
    currentProgram = data;
  }

  renderDashboard(member, session.user);
  renderProfile(member, session.user);
}

// ---------- Dashboard ----------
function renderDashboard(member, user) {
  const name = member.full_name || user.email.split('@')[0];
  document.getElementById('greeting').textContent = `Welcome back, ${name}`;

  document.getElementById('dash-program').textContent = currentProgram?.name || 'Not assigned';
  document.getElementById('dash-payment').textContent = member.payment_status || 'Due';
  document.getElementById('dash-streak').textContent = member.streak_count || 0;

  document.getElementById('dash-expiry').textContent = member.membership_expiry
    ? formatDate(member.membership_expiry)
    : 'Not set';
}

// ---------- Profile ----------
function renderProfile(member, user) {
  const name = member.full_name || user.email.split('@')[0];

  // Header
  document.getElementById('profile-avatar').textContent = getInitials(name);
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-email').textContent = member.email || user.email;
  document.getElementById('profile-role').textContent = member.role || 'member';

  // Contact details
  document.getElementById('pv-full-name').textContent = member.full_name || '-';
  document.getElementById('pv-whatsapp').textContent = member.whatsapp_number || '-';
  document.getElementById('pv-email').textContent = member.email || user.email;

  // Membership
  document.getElementById('pv-program').textContent = currentProgram?.name || 'Not assigned';
  document.getElementById('pv-joining').textContent = member.joining_date ? formatDate(member.joining_date) : '-';
  document.getElementById('pv-expiry').textContent = member.membership_expiry ? formatDate(member.membership_expiry) : '-';
  document.getElementById('pv-payment').textContent = member.payment_status || 'Due';
  document.getElementById('pv-due').textContent = member.amount_due != null ? `Rs. ${member.amount_due}` : 'Rs. 0';
  document.getElementById('pv-streak').textContent = member.streak_count ?? 0;

  // Physical metrics
  document.getElementById('pv-height').textContent = member.height ? `${member.height} cm` : '-';
  document.getElementById('pv-weight').textContent = member.weight ? `${member.weight} kg` : '-';

  // Emergency contact
  document.getElementById('pv-emg-name').textContent = member.emergency_name || '-';
  document.getElementById('pv-emg-phone').textContent = member.emergency_phone || '-';
}

// ---------- Tab Navigation ----------
document.querySelectorAll('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ---------- Profile Editing ----------
document.getElementById('edit-profile-btn').addEventListener('click', () => {
  if (!currentMember) return;
  document.getElementById('edit-full-name').value = currentMember.full_name || '';
  document.getElementById('edit-whatsapp').value = currentMember.whatsapp_number || '';
  document.getElementById('edit-emg-name').value = currentMember.emergency_name || '';
  document.getElementById('edit-emg-phone').value = currentMember.emergency_phone || '';
  document.getElementById('edit-medical').value = currentMember.medical_notes || '';

  document.getElementById('profile-view-mode').style.display = 'none';
  document.getElementById('profile-edit-mode').style.display = 'block';
});

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
  document.getElementById('profile-edit-mode').style.display = 'none';
  document.getElementById('profile-view-mode').style.display = 'block';
});

document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-profile-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const fd = new FormData(e.target);
  const updates = {
    full_name: fd.get('full_name'),
    whatsapp_number: fd.get('whatsapp_number'),
    emergency_name: fd.get('emergency_name'),
    emergency_phone: fd.get('emergency_phone'),
    medical_notes: fd.get('medical_notes') || null,
    updated_at: new Date().toISOString()
  };

  const { data: updated, error } = await supabaseClient
    .from('members')
    .update(updates)
    .eq('id', currentMember.id)
    .select()
    .single();

  btn.disabled = false;
  btn.textContent = 'Save changes';

  if (error) {
    console.error(error);
    alert('Could not save. Please try again.');
    return;
  }

  currentMember = updated;
  const { data: { user } } = await supabaseClient.auth.getUser();
  renderProfile(currentMember, user);

  document.getElementById('profile-edit-mode').style.display = 'none';
  document.getElementById('profile-view-mode').style.display = 'block';
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
