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

// --- Phone Number Auto-Formatting ---
function formatPhoneNumber(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.substring(2);
  }
  digits = digits.substring(0, 10);
  if (digits.length > 5) {
    return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  } else if (digits.length > 0) {
    return `+91 ${digits}`;
  }
  return '';
}

// Attach formatting to phone inputs
['whatsapp_number', 'emergency_phone'].forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('input', (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
    });
    input.addEventListener('paste', (e) => {
      setTimeout(() => {
        e.target.value = formatPhoneNumber(e.target.value);
      }, 0);
    });
  }
});

// --- Authentication Flow ---
document.getElementById('google-signin').addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://members.tsfclub.com/app.html'
    }
  });
});

async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    showView('login');
    return;
  }

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

  if (member && member.onboarding_complete) {
    window.location.href = 'app.html';
    return;
  }

  await loadPrograms();
  showView('onboarding');
}

async function loadPrograms() {
  const select = document.getElementById('program_id');
  const { data: programs, error } = await supabaseClient
    .from('programs')
    .select('id, name, fee, category')
    .order('category')
    .order('name');

  if (error || !programs) {
    select.innerHTML = '<option value="">Error loading programs</option>';
    return;
  }

  select.innerHTML = '<option value="">Select a program</option>';
  
  // Group by category
  const adults = programs.filter(p => p.category === 'adults');
  const kids = programs.filter(p => p.category === 'kids');

  const addOptions = (list, label) => {
    if (list.length === 0) return;
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;
    list.forEach(prog => {
      const option = document.createElement('option');
      option.value = prog.id;
      // Display 'On Request' if fee is 0
      const feeText = prog.fee > 0 ? `Rs. ${prog.fee}` : 'On Request';
      option.textContent = `${prog.name} (${feeText})`;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  };

  addOptions(adults, 'Adults');
  addOptions(kids, 'Kids');
}

document.getElementById('onboarding-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const formData = new FormData(e.target);
  const { data: { session } } = await supabaseClient.auth.getSession();

  const heightVal = formData.get('height') ? parseFloat(formData.get('height')) : null;
  const weightVal = formData.get('weight') ? parseFloat(formData.get('weight')) : null;

  const { error } = await supabaseClient.from('members').insert({
    id: session.user.id,
    email: session.user.email,
    full_name: formData.get('full_name'),
    whatsapp_number: formData.get('whatsapp_number'),
    program_id: formData.get('program_id'),
    joining_date: formData.get('joining_date'),
    height: heightVal,
    weight: weightVal,
    emergency_name: formData.get('emergency_name'),
    emergency_phone: formData.get('emergency_phone'),
    onboarding_complete: true
  });

  if (error) {
    console.error('Onboarding error:', error);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Complete setup';
    return;
  }

  window.location.href = 'app.html';
});

init();
