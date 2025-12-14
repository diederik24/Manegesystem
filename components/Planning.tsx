import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  group: string;
  color: 'blue' | 'teal' | 'orange' | 'red' | 'green';
}

const Planning: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('month');

  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const daysOfWeek = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];

  // Mock events data
  const mockEvents: CalendarEvent[] = [
    { id: '1', date: '2025-12-02', time: '14:00', group: 'Groep1', color: 'blue' },
    { id: '2', date: '2025-12-02', time: '15:00', group: 'Groep2', color: 'blue' },
    { id: '3', date: '2025-12-02', time: '16:30', group: 'Groep3', color: 'blue' },
    { id: '4', date: '2025-12-03', time: '19:00', group: 'Groep4', color: 'blue' },
    { id: '5', date: '2025-12-04', time: '17:00', group: 'Groep5', color: 'blue' },
    { id: '6', date: '2025-12-04', time: '18:00', group: 'Groep6', color: 'blue' },
    { id: '7', date: '2025-12-05', time: '10:00', group: 'Groep7', color: 'blue' },
    { id: '8', date: '2025-12-05', time: '11:00', group: 'Groep8', color: 'blue' },
    { id: '9', date: '2025-12-09', time: '14:00', group: 'Groep1', color: 'teal' },
    { id: '10', date: '2025-12-09', time: '15:00', group: 'Groep2', color: 'orange' },
    { id: '11', date: '2025-12-09', time: '16:30', group: 'Groep3', color: 'teal' },
    { id: '12', date: '2025-12-10', time: '19:00', group: 'Groep4', color: 'red' },
    { id: '13', date: '2025-12-11', time: '17:00', group: 'Groep5', color: 'green' },
    { id: '14', date: '2025-12-11', time: '18:00', group: 'Groep6', color: 'green' },
    { id: '15', date: '2025-12-12', time: '10:00', group: 'Groep7', color: 'teal' },
    { id: '16', date: '2025-12-12', time: '11:00', group: 'Groep8', color: 'orange' },
    { id: '17', date: '2025-12-16', time: '14:00', group: 'Groep1', color: 'blue' },
    { id: '18', date: '2025-12-16', time: '15:00', group: 'Groep2', color: 'blue' },
    { id: '19', date: '2025-12-16', time: '16:30', group: 'Groep3', color: 'blue' },
    { id: '20', date: '2025-12-17', time: '19:00', group: 'Groep4', color: 'blue' },
    { id: '21', date: '2025-12-18', time: '17:00', group: 'Groep5', color: 'blue' },
    { id: '22', date: '2025-12-18', time: '18:00', group: 'Groep6', color: 'blue' },
    { id: '23', date: '2025-12-19', time: '10:00', group: 'Groep7', color: 'blue' },
    { id: '24', date: '2025-12-19', time: '11:00', group: 'Groep8', color: 'blue' },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500 text-white';
      case 'teal': return 'bg-teal-500 text-white';
      case 'orange': return 'bg-orange-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockEvents.filter(event => event.date === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    // Add days from previous month to fill the first week if needed
    if (firstDay > 0) {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
      for (let i = firstDay - 1; i >= 0; i--) {
        days[i] = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      }
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) return <div key={index} className="min-h-[100px]"></div>;
          
          const isCurrentMonth = date.getMonth() === currentMonth;
          const events = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-slate-200 rounded-lg ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50'
              } ${isToday ? 'ring-2 ring-brand-primary' : ''}`}
            >
              <div className={`text-sm font-medium mb-2 ${isCurrentMonth ? 'text-brand-dark' : 'text-slate-400'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1.5">
                {events.map(event => (
                  <div
                    key={event.id}
                    className={`${getColorClasses(event.color)} text-xs p-2 rounded font-medium shadow-sm`}
                  >
                    {event.time} {event.group}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-brand-primary pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🐴</span>
          </div>
          <h1 className="text-4xl font-bold text-brand-primary">Manege Kalender 2026</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="appearance-none px-4 py-2 pr-8 bg-white border border-brand-soft rounded-lg text-brand-dark font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-dark pointer-events-none" />
          </div>
          <button
            onClick={() => setViewMode('quarter')}
            className="px-4 py-2 bg-white border border-brand-soft rounded-lg text-brand-dark hover:bg-brand-bg transition-colors font-medium"
          >
            Kwartaaloverzicht
          </button>
          <button
            onClick={() => setViewMode('year')}
            className="px-4 py-2 bg-white border border-brand-soft rounded-lg text-brand-dark hover:bg-brand-bg transition-colors font-medium"
          >
            Jaaroverzicht
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="bg-brand-soft rounded-lg p-3 text-center font-bold text-brand-primary text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg p-4">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default Planning;
