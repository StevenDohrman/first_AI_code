const fetchSlots = async () => {
  const username = document.getElementById('username').value;
  if (!username) {
    alert('Please enter your name.');
    return;
  }

  const duration = document.getElementById('duration').value;
  const response = await fetch(`/slots?user=${username}&duration=${duration}`);
  const data = await response.json();

  // Update week info
  const weekInfo = WeekHelper.getWeekInfo();
  document.getElementById('weekInfo').textContent = WeekHelper.formatWeekDisplay(weekInfo);

  // Display available slots
  const slotsList = document.getElementById('slotsList');
  slotsList.innerHTML = '';
  data.availableSlots.forEach(slot => {
    const button = document.createElement('button');
    button.className = 'slot-button';
    button.textContent = `${slot} (${data.duration} minutes)`;
    button.onclick = () => bookSlot(username, slot, data.duration);
    slotsList.appendChild(button);
  });

  // Display user's appointments
  const appointmentsList = document.getElementById('appointmentsList');
  appointmentsList.innerHTML = '';
  data.weekAppointments.forEach(app => {
    const appointment = document.createElement('div');
    appointment.className = 'appointment';
    appointment.textContent = `${app.time} (${app.duration} minutes)`;
    appointmentsList.appendChild(appointment);
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
    alert(error.error);
  }
};

// Initialize week info on page load
document.addEventListener('DOMContentLoaded', () => {
  const weekInfo = WeekHelper.getWeekInfo();
  document.getElementById('weekInfo').textContent = WeekHelper.formatWeekDisplay(weekInfo);
});
