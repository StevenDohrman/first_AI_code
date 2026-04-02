const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = './backend/db.json';
const HOURS = { start: 8, end: 18 }; // 8am to 6pm
const MAX_APPOINTMENTS = 3;

// Load or initialize database
let db = { appointments: [] };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Helper: Save database
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// Helper: Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay / 7);
};

// Helper: Generate time slots (30-min and 1-hour)
const generateTimeSlots = (duration = 30) => {
  const slots = [];
  for (let hour = HOURS.start; hour < HOURS.end; hour++) {
    if (duration === 30) {
      slots.push(`${hour}:00`, `${hour}:30`);
    } else if (duration === 60 && hour < HOURS.end - 1) {
      slots.push(`${hour}:00`);
    }
  }
  return slots;
};

// Helper: Clean old week appointments
const cleanOldAppointments = () => {
  const currentWeek = getCurrentWeek();
  db.appointments = db.appointments.filter(a => a.week === currentWeek);
  saveDB();
};

// Endpoint: Get current week info
app.get('/week', (req, res) => {
  const currentWeek = getCurrentWeek();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  res.json({
    currentWeek,
    weekStart: weekStart.toDateString(),
    weekEnd: weekEnd.toDateString()
  });
});

// Endpoint: Get available time slots
app.get('/slots', (req, res) => {
  cleanOldAppointments();
  
  const { user, duration = 30 } = req.query;
  const currentWeek = getCurrentWeek();
  
  const weekAppointments = db.appointments.filter(
    a => a.user === user && a.week === currentWeek
  );
  
  const bookedSlots = db.appointments
    .filter(a => a.week === currentWeek)
    .map(a => a.time);
  
  const availableSlots = generateTimeSlots(parseInt(duration)).filter(
    slot => !bookedSlots.includes(slot)
  );
  
  res.json({ 
    availableSlots, 
    weekAppointments,
    currentWeek,
    duration
  });
});

// Endpoint: Book an appointment
app.post('/book', (req, res) => {
  cleanOldAppointments();
  
  const { user, time, duration = 30 } = req.body;
  const currentWeek = getCurrentWeek();

  // Check if user has reached max appointments
  const userAppointments = db.appointments.filter(
    a => a.user === user && a.week === currentWeek
  );
  if (userAppointments.length >= MAX_APPOINTMENTS) {
    return res.status(400).json({ error: 'Max appointments reached for this week.' });
  }

  // Check if time slot is available
  if (db.appointments.find(a => a.time === time && a.week === currentWeek)) {
    return res.status(400).json({ error: 'Time slot already booked.' });
  }

  // Book the appointment
  db.appointments.push({ user, time, duration, week: currentWeek });
  saveDB();
  res.json({ message: 'Appointment booked successfully.' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
