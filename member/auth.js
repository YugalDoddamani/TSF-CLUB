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

// --- Phone Number Formatting (Smarter, user-friendly approach) ---
function formatPhoneNumber(value) {
  let digits = value.replace(/\D/g, '');

  // If the number starts with 91 and is 12 digits long, strip the 91
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  }

  // Limit to 10 digits
  digits = digits.substring(0, 10);

  if (digits.length === 0) return '';
  if (digits.length <= 5) return `+91 ${digits}`;
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}

// Attach formatting to both phone inputs
['whatsapp_number', 'emergency_phone'].forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    // 1. Let the user type freely. Just stop them from typing letters.
    input.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^\d+]/g, ''); // Allow only digits and +
      val = val.replace(/(?!^)\+/g, ''); // Remove any + except at the very start
      if (val.length > 13) val = val.substring(0, 13); // Max length for +91 XXXXX XXXXX
      e.target.value = val;
    });

    // 2. When they click away (blur), format it beautifully
    input.addEventListener('blur', (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
    });

    // 3. Format immediately if they paste a number
    input.addEventListener('paste', (e) => {
      setTimeout(() => {
        e.target.value = formatPhoneNumber(e.target.value);
      }, 0);
    });
  }
});

// --- Preference Pills ---
const selectedPreferences = new Set();

document.querySelectorAll('#preference-pills .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const value = pill.dataset.value;
    if (selectedPreferences.has(value)) {
      selectedPreferences.delete(value);
      pill.classList.remove('active');
    } else {
      selectedPreferences.add(value);
      pill.classList.add('active');
    }
  });
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
  // Prevent users from picking a future joining date
  const joiningDateInput = document.getElementById('joining_date');
  if (joiningDateInput) {
    joiningDateInput.max = new Date().toISOString().split('T')[0];
  }

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

  const adults = programs.filter(p => p.category === 'adults');
  const kids = programs.filter(p => p.category === 'kids');

  const addOptions = (list, label) => {
    if (list.length === 0) return;
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;
    list.forEach(prog => {
      const option = document.createElement('option');
      option.value = prog.id;
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

  const programId = formData.get('program_id');
  const joiningDate = formData.get('joining_date');

  // Fetch the chosen program's duration so we can compute expiry
  const { data: program, error: programError } = await supabaseClient
    .from('programs')
    .select('duration_months')
    .eq('id', programId)
    .single();

  if (programError || !program) {
    console.error('Could not load program:', programError);
    alert('Could not load your program. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Complete setup';
    return;
  }

  const cycleMonths = program.duration_months || 1;

  /* Compute membership_expiry.

     Two options, pick one:

     OPTION A (default, honest):
       New member is treated as unpaid. Expiry = joining date.
       They show as "due" immediately until the receptionist
       marks them paid in the admin panel.

     OPTION B (optimistic):
       New member is treated as already paid for their first cycle.
       Expiry = joining date + cycle months. Use this only if your
       receptionist always collects payment before onboarding. */
  const joiningDateObj = new Date(joiningDate);

  // OPTION A (default)
  const expiry = new Date(joiningDateObj);

  // OPTION B: uncomment the line below and remove the OPTION A line
  // expiry.setMonth(expiry.getMonth() + cycleMonths);

  const expiryStr = expiry.toISOString().split('T')[0];

  const { error } = await supabaseClient.from('members').insert({
    id: session.user.id,
    email: session.user.email,
    full_name: formData.get('full_name'),
    whatsapp_number: formData.get('whatsapp_number'),
    program_id: programId,
    joining_date: joiningDate,
    membership_expiry: expiryStr,
    height: heightVal,
    weight: weightVal,
    blood_group: formData.get('blood_group'),
    preferences: Array.from(selectedPreferences),
    emergency_name: formData.get('emergency_name'),
    emergency_phone: formData.get('emergency_phone'),
    amount_due: 0,
    payment_status: 'due',
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
