// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const views = {
  login: document.getElementById('login-view'),
  onboarding: document.getElementById('onboarding-view'),
  dashboard: document.getElementById('dashboard-view')
};

// --- View Management ---
function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[viewName].classList.add('active');
}

// --- Authentication Flow ---

// 1. Handle Google Sign In
document.getElementById('google-signin').addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
});

// 2. Handle Sign Out
document.getElementById('signout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  showView('login');
});

// 3. Main initialization logic
async function init() {
  const { data: { session }, error } = await supabase.auth.getSession();

  // Not logged in
  if (!session) {
    showView('login');
    return;
  }

  // Logged in. Check if they have a member row.
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (memberError) {
    console.error('Error fetching member:', memberError);
    // If there's a database error, fall back to login for safety
    showView('login');
    return;
  }

  // No member row, or onboarding not complete
  if (!member || !member.onboarding_complete) {
    await loadPrograms();
    showView('onboarding');
    return;
  }

  // Fully onboarded
  showView('dashboard');
  renderDashboard(member, session.user);
}

// --- Onboarding Logic ---

async function loadPrograms() {
  const select = document.getElementById('program_id');
  const { data: programs, error } = await supabase
    .from('programs')
    .select('id, name, fee')
    .order('name');

  if (error || !programs) {
    select.innerHTML = '<option value="">Error loading programs</option>';
    return;
  }

  select.innerHTML = '<option value="">Select a program</option>';
  programs.forEach(prog => {
    const option = document.createElement('option');
    option.value = prog.id;
    option.textContent = `${prog.name} (Rs. ${prog.fee})`;
    select.appendChild(option);
  });
}

document.getElementById('onboarding-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const formData = new FormData(e.target);
  const { data: { session } } = await supabase.auth.getSession();

  const { error } = await supabase.from('members').insert({
    id: session.user.id,
    email: session.user.email,
    full_name: formData.get('full_name'),
    whatsapp_number: formData.get('whatsapp_number'),
    program_id: formData.get('program_id'),
    emergency_name: formData.get('emergency_name'),
    emergency_phone: formData.get('emergency_phone'),
    joining_date: new Date().toISOString().split('T')[0],
    onboarding_complete: true
  });

  if (error) {
    console.error('Onboarding error:', error);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Complete setup';
    return;
  }

  // Success, reload into dashboard
  init();
});

// --- Dashboard Logic ---

async function renderDashboard(member, user) {
  // Set greeting
  const name = member.full_name || user.email.split('@')[0];
  document.getElementById('greeting').textContent = `Welcome back, ${name}`;

  // Fetch program details
  if (member.program_id) {
    const { data: program } = await supabase
      .from('programs')
      .select('name')
      .eq('id', member.program_id)
      .single();
      
    document.getElementById('dash-program').textContent = program ? program.name : 'Not assigned';
  } else {
    document.getElementById('dash-program').textContent = 'Not assigned';
  }

  // Set other stats
  document.getElementById('dash-payment').textContent = member.payment_status || 'Due';
  document.getElementById('dash-streak').textContent = member.streak_count || 0;
  
  if (member.membership_expiry) {
    const date = new Date(member.membership_expiry);
    document.getElementById('dash-expiry').textContent = date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } else {
    document.getElementById('dash-expiry').textContent = 'Not set';
  }
}

// Listen for auth state changes (handles the redirect from Google)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    init();
  } else if (event === 'SIGNED_OUT') {
    showView('login');
  }
});

// Start the app
init();
