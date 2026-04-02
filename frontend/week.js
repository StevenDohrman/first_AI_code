// Helper functions for week calculations
const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay / 7);
};

const getWeekInfo = () => {
  const currentWeek = getCurrentWeek();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return {
    currentWeek,
    weekStart: weekStart.toDateString(),
    weekEnd: weekEnd.toDateString()
  };
};

const formatWeekDisplay = (weekInfo) => {
  return `Week ${weekInfo.currentWeek}: ${weekInfo.weekStart} - ${weekInfo.weekEnd}`;
};

// Export functions
window.WeekHelper = {
  getCurrentWeek,
  getWeekInfo,
  formatWeekDisplay
};