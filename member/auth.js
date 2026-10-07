const SUPABASE_URL = 'https://wmuttbriuhduzoaejxio.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CVghIdN9OoY-HMDayZTzyw_1_9ORJPf';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const views = {
  login: document.getElementById('login-view'),
  onboarding: document.getElementById('onboarding-view')
};

function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[viewName].classList.add('active');
}

// 1. Handle Google Sign In
document.getElementById('google-signin').addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // This is the crucial fix. Redirect to app.html, not the origin.
      redirectTo: 'https://members.tsfclub.com/app.html'
    }
  });
});

// 2. Main initialization logic
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  // Not logged in -> Show login
  if (!session) {
    showView('login');
    return;
  }

  // Logged in. Check if they have a member row.
  const { data: member, error } = await supabaseClient
    .from('members')
    .select('onboarding_complete')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching member:', error);
    showView('login');
    return;
  }

  // If onboarding is complete, send them straight to the app
  if (member && member.onboarding_complete) {
    window.location.href = 'app.html';
    return;
  }

  // Otherwise, show onboarding
  await loadPrograms();
  showView('onboarding');
}

// 3. Onboarding Logic
async function loadPrograms() {
  const select = document.getElementById('program_id');
  const { data: programs, error } = await supabaseClient
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
  const { data: { session } } = await supabaseClient.auth.getSession();

  const { error } = await supabaseClient.from('members').insert({
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

  // Success! Send them to the app.
  window.location.href = 'app.html';
});

// Start the app
init();
