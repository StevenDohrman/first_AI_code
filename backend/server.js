const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, '../frontend');
const DB_FILE = path.join(__dirname, 'db.json');
const HOURS = { start: 8, end: 18 }; // 8am to 6pm
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MAX_APPOINTMENTS = 3;

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

// Load or initialize database
let db = { appointments: [] };
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) || { appointments: [] };
  } catch (err) {
    console.error('Failed to parse DB_FILE, resetting', err);
    db = { appointments: [] };
    saveDB();
  }
}

// Helper: Save database
const saveDB = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// Helper: Get current week number (ISO week parity is not required for MVP)
const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now - start + 86400000) / 86400000);
  return Math.floor((dayOfYear - 1) / 7) + 1;
};

// Helper: Generate time slots (30-min and 1-hour) for whole week with day prefix
const generateTimeSlots = (duration = 30) => {
  const slots = [];
  const d = parseInt(duration, 10);

  DAYS.forEach((day) => {
    for (let hour = HOURS.start; hour < HOURS.end; hour++) {
      if (d === 30) {
        slots.push(`${day} ${hour}:00`);
        slots.push(`${day} ${hour}:30`);
      } else if (d === 60 && hour < HOURS.end - 1) {
        slots.push(`${day} ${hour}:00`);
      }
    }
  });
  return slots;
};

// Helper: Convert value HH:MM to minutes since start of day
const parseSlotMinutes = (slot) => {
  const time = slot.includes(' ') ? slot.split(' ')[1] : slot;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const getSlotDay = (slot) => (slot.includes(' ') ? slot.split(' ')[0] : null);

// Helper: Normalize user name for matching
const normalizeUser = (user) =>
  user
    .trim()
    .split(/\s+/)
    .join(' ')
    .toLowerCase();

// Helper: Validate that user has first and last name
const isValidFullName = (user) => {
  const parts = user.trim().split(/\s+/);
  if (parts.length < 2) return false;
  return parts.every((part) => /^[A-Za-z'-]+$/.test(part));
};

// Helper: detect overlapping appointment within same day and same week
const hasOverlappingAppointment = (candidateTime, candidateDur, week) => {
  const candidateDay = getSlotDay(candidateTime);
  const start = parseSlotMinutes(candidateTime);
  const end = start + candidateDur;

  return db.appointments.some((appointment) => {
    if (appointment.week !== week) return false;
    if (getSlotDay(appointment.time) !== candidateDay) return false;

    const appointmentStart = parseSlotMinutes(appointment.time);
    const appointmentEnd = appointmentStart + Number(appointment.duration);

    return start < appointmentEnd && appointmentStart < end;
  });
};

// Helper: Clean old week appointments
const cleanOldAppointments = () => {
  const currentWeek = getCurrentWeek();
  db.appointments = db.appointments.filter((a) => a.week === currentWeek);
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
    weekEnd: weekEnd.toDateString(),
  });
});

// Endpoint: Get available time slots
app.get('/slots', (req, res) => {
  cleanOldAppointments();

  const { user = '', duration = 30 } = req.query;
  const currentWeek = getCurrentWeek();
  const dur = parseInt(duration, 10);

  if (!user || !isValidFullName(user)) {
    return res.status(400).json({ error: 'Please provide a valid first and last name to view slots.' });
  }

  const normalizedUser = normalizeUser(user);
  const weekAppointments = db.appointments.filter(
    (a) => normalizeUser(a.user) === normalizedUser && a.week === currentWeek
  );

  const bookedSlots = db.appointments
    .filter((a) => a.week === currentWeek)
    .reduce((acc, appointment) => {
      acc.add(appointment.time);
      return acc;
    }, new Set());

  const availableSlots = generateTimeSlots(dur).filter((slot) => {
    // Slot is already day + time; no additional day pre-check required, we check overlaps by day in helper
    if (dur === 60) {
      return !hasOverlappingAppointment(slot, dur, currentWeek);
    }

    return !hasOverlappingAppointment(slot, 30, currentWeek);
  });

  res.json({
    availableSlots,
    weekAppointments,
    currentWeek,
    duration: dur,
  });
});

// Endpoint: Book an appointment
app.post('/book', (req, res) => {
  cleanOldAppointments();

  const { user, time, duration = 30 } = req.body;
  const currentWeek = getCurrentWeek();
  const dur = Number(duration);

  if (!user || !time) {
    return res.status(400).json({ error: 'User and time are required.' });
  }

  if (!isValidFullName(user)) {
    return res.status(400).json({ error: 'Please enter a valid first and last name (letters only).' });
  }

  if (![30, 60].includes(dur)) {
    return res.status(400).json({ error: 'Duration must be 30 or 60 minutes.' });
  }

  const normalizedUser = normalizeUser(user);

  // Check if user has reached max appointments
  const userAppointments = db.appointments.filter(
    (a) => normalizeUser(a.user) === normalizedUser && a.week === currentWeek
  );
  if (userAppointments.length >= MAX_APPOINTMENTS) {
    return res.status(400).json({ error: 'Max appointments reached for this week.' });
  }

  // Check if time slot is available and doesn't overlap existing appointment
  if (hasOverlappingAppointment(time, dur, currentWeek)) {
    return res.status(400).json({ error: 'Time slot not available due to overlap.' });
  }

  // Book the appointment
  db.appointments.push({ user, time, duration: dur, week: currentWeek });
  saveDB();
  res.json({ message: 'Appointment booked successfully.' });
});

// Redirect / to frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
