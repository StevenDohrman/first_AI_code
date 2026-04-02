# Scheduling App

A web-based appointment scheduling application that allows users to book 30-minute or 1-hour appointments during business hours (8am-6pm) for the current week, with a maximum of 3 appointments per user.

## Features

- **Week-based scheduling**: Appointments only available for the current week
- **Dual duration options**: 30-minute and 1-hour appointment slots
- **Real-time availability**: Slots update immediately when booked
- **User limits**: Maximum 3 appointments per user per week
- **Modern UI**: Responsive design with gradient background
- **Cross-browser compatible**: Works on all modern browsers

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: JSON file storage
- **CORS**: Cross-origin resource sharing enabled

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd firstCode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the backend server:
   ```bash
   npm start
   ```
   The server will start on http://localhost:3000 and serve the frontend automatically.

2. Open the app in your browser:
   ```bash
   open http://localhost:3000
   ```

3. Use the application:
   - Enter your name
   - Select appointment duration (30 minutes or 1 hour)
   - Click "Check Availability" to see available slots
   - Book appointments (maximum 3 per week)
   - View your current appointments

## API Endpoints

- `GET /slots?user={username}&duration={30|60}` - Get available time slots
- `POST /book` - Book an appointment (requires JSON body with user, time, duration)
- `GET /week` - Get current week information

## File Structure

```
firstCode/
├── backend/
│   └── server.js          # Express server with API endpoints
├── frontend/
│   ├── index.html         # Main HTML file
│   ├── app.js            # Frontend JavaScript logic
│   ├── style.css         # Styling and responsive design
│   └── week.js           # Week calculation utilities
├── package.json          # Node.js dependencies
├── README.md            # This file
└── db.json              # Database file (auto-generated)
```

## Development

The application uses a simple JSON file for data persistence. The database is automatically cleaned up at week boundaries to remove old appointments.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is open source and available under the MIT License.