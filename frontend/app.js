const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const saveUser = (firstName, lastName) => {
  localStorage.setItem('firstName', firstName);
  localStorage.setItem('lastName', lastName);
};

const loadUser = () => {
  return {
    firstName: localStorage.getItem('firstName') || '',
    lastName: localStorage.getItem('lastName') || '',
  };
};

const isValidName = (name) => /^[A-Za-z'-]{2,}$/.test(name.trim());

const getUserFullName = () => {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();

  if (!firstName || !lastName) {
    alert('Please enter both first and last name.');
    return null;
  }

  if (!isValidName(firstName) || !isValidName(lastName)) {
    alert('Name fields must be at least 2 letters and contain only A-Z, apostrophe, or hyphen.');
    return null;
  }

  return `${firstName} ${lastName}`;
};

const setUserFields = () => {
  const saved = loadUser();
  if (saved.firstName) document.getElementById('firstName').value = saved.firstName;
  if (saved.lastName) document.getElementById('lastName').value = saved.lastName;
};

const fetchSlots = async () => {
  const fullName = getUserFullName();
  if (!fullName) return;

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  saveUser(firstName, lastName);

  const duration = document.getElementById('duration').value;
  const response = await fetch(`/slots?user=${encodeURIComponent(fullName)}&duration=${duration}`);

  if (!response.ok) {
    const error = await response.json();
    alert(error.error || 'Failed to load slots');
    return;
  }

  const data = await response.json();

  // Update week info
  const weekInfo = WeekHelper.getWeekInfo();
  document.getElementById('weekInfo').textContent = WeekHelper.formatWeekDisplay(weekInfo);

  // Render day filters + slot buttons
  window.availableSlots = data.availableSlots;
  const today = DAYS_OF_WEEK[new Date().getDay()];
  window.selectedDay = window.selectedDay || today;
  renderDayFilterButtons();
  renderSlotButtons(fullName, data.duration);

  // Display user's appointments
  const appointmentsList = document.getElementById('appointmentsList');
  appointmentsList.innerHTML = '';
  data.weekAppointments.forEach((app) => {
    const appointment = document.createElement('div');
    appointment.className = 'appointment';
    appointment.textContent = `${app.time} (${app.duration} minutes)`;
    appointmentsList.appendChild(appointment);
  });
};

const renderDayFilterButtons = () => {
  const container = document.getElementById('dayFilterButtons');
  container.innerHTML = '';

  DAYS_OF_WEEK.forEach((day) => {
    const button = document.createElement('button');
    button.className = `day-button ${window.selectedDay === day ? 'active' : ''}`;
    button.textContent = day;
    button.onclick = () => {
      window.selectedDay = day;
      renderDayFilterButtons();
      renderSlotButtons(document.getElementById('firstName').value.trim() + ' ' + document.getElementById('lastName').value.trim(), document.getElementById('duration').value);
    };
    container.appendChild(button);
  });
};

const renderSlotButtons = (fullName, duration) => {
  const slotsList = document.getElementById('slotsList');
  slotsList.innerHTML = '';

  const filtered = (window.availableSlots || []).filter((slot) => slot.startsWith(`${window.selectedDay} `));

  if (filtered.length === 0) {
    slotsList.innerHTML = '<p>No available slots for this day.</p>';
    return;
  }

  filtered.forEach((slot) => {
    const button = document.createElement('button');
    button.className = 'slot-button';
    const timePart = slot.replace(`${window.selectedDay} `, '');
    button.textContent = `${timePart} (${duration} minutes)`;
    button.onclick = () => bookSlot(fullName, slot, duration);
    slotsList.appendChild(button);
  });
};

const bookSlot = async (username, time, duration) => {
  const response = await fetch('/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: username, time, duration }),
  });

  if (response.ok) {
    alert('Appointment booked successfully!');
    fetchSlots();
  } else {
    const error = await response.json();
    alert(error.error || 'Booking failed.');
  }
};

// Initialize week info and restore user on page load
window.addEventListener('DOMContentLoaded', () => {
  setUserFields();

  const weekInfo = WeekHelper.getWeekInfo();
  document.getElementById('weekInfo').textContent = WeekHelper.formatWeekDisplay(weekInfo);

  const durationSelect = document.getElementById('duration');
  durationSelect.addEventListener('change', fetchSlots);

  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  [firstNameInput, lastNameInput].forEach((input) => {
    input.addEventListener('change', () => {
      if (firstNameInput.value.trim() && lastNameInput.value.trim()) {
        fetchSlots();
      }
    });
  });

  const saved = loadUser();
  if (saved.firstName && saved.lastName) {
    fetchSlots();
  }
});
