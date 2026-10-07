const SUPABASE_URL = 'https://wmuttbriuhduzoaejxio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CVghIdN9OoY-HMDayZTzyw_1_9ORJPf';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Auth Guard: Check if user is logged in
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    // Not logged in, kick back to login page
    window.location.href = 'authentication.html';
    return;
  }

  // Check if they have completed onboarding
  const { data: member } = await supabaseClient
    .from('members')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!member || !member.onboarding_complete) {
    // Not onboarded, send back to auth page
    window.location.href = 'authentication.html';
    return;
  }

  // User is fully authenticated and onboarded. Render dashboard.
  renderDashboard(member, session.user);
}

// 2. Render Dashboard
async function renderDashboard(member, user) {
  const name = member.full_name || user.email.split('@')[0];
  document.getElementById('greeting').textContent = `Welcome back, ${name}`;

  // Fetch program details
  if (member.program_id) {
    const { data: program } = await supabaseClient
      .from('programs')
      .select('name')
      .eq('id', member.program_id)
      .single();
      
    document.getElementById('dash-program').textContent = program ? program.name : 'Not assigned';
  } else {
    document.getElementById('dash-program').textContent = 'Not assigned';
  }

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

// 3. Handle Sign Out
document.getElementById('signout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'authentication.html';
});

// Start the app
checkAuth();
