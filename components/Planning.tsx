import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Plus, Users, Calendar, CheckCircle, XCircle, AlertCircle, Trash2, UserCheck, Edit, FileText, Download, Settings } from 'lucide-react';
import { MOCK_MEMBERS } from '../constants';
import { RecurringLesson, LessonInstance, Member, Leskaart, LesRegistratie, ViewState } from '../types';

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  group: string;
  color: 'blue' | 'teal' | 'orange' | 'amber' | 'green' | 'purple' | 'pink' | 'indigo';
  type?: string;
  instructor?: string;
  description?: string;
  recurringLessonId: string;
  participantIds: string[];
}

interface PlanningProps {
  onNavigate?: (view: ViewState) => void;
}

const Planning: React.FC<PlanningProps> = ({ onNavigate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  // Mock leskaarten - later uit database halen
  const [leskaarten, setLeskaarten] = useState<Leskaart[]>([]);
  const [lesRegistraties, setLesRegistraties] = useState<LesRegistratie[]>([]);
  const [selectedLeskaartForParticipant, setSelectedLeskaartForParticipant] = useState<{ participantId: string; leskaartId: string | null } | null>(null);
  // Helper function to assign unique colors to groups
  const getGroupColor = (groupName: string): 'blue' | 'teal' | 'orange' | 'amber' | 'green' | 'purple' | 'pink' | 'indigo' => {
    const groupNumber = parseInt(groupName.replace('Groep', ''));
    // Assign unique colors to each group
    const colors: ('blue' | 'teal' | 'orange' | 'amber' | 'green' | 'purple' | 'pink' | 'indigo')[] = 
      ['blue', 'teal', 'orange', 'amber', 'green', 'purple', 'pink', 'indigo'];
    return colors[(groupNumber - 1) % colors.length];
  };

  const [recurringLessons, setRecurringLessons] = useState<RecurringLesson[]>([
    { id: '1', name: 'Groep1', dayOfWeek: 1, time: '14:00', type: 'Dressuurles', instructor: '', maxParticipants: 8, color: 'blue', participantIds: [] },
    { id: '2', name: 'Groep2', dayOfWeek: 1, time: '15:00', type: 'Springles', instructor: 'Marieke', maxParticipants: 8, color: 'teal', participantIds: [] },
    { id: '3', name: 'Groep3', dayOfWeek: 1, time: '16:30', type: 'Dressuurles', instructor: 'Tom', maxParticipants: 8, color: 'orange', participantIds: [] },
    { id: '4', name: 'Groep4', dayOfWeek: 2, time: '19:00', type: 'Groepsles', instructor: 'Sarah', maxParticipants: 10, color: 'amber', participantIds: [] },
    { id: '5', name: 'Groep5', dayOfWeek: 3, time: '17:00', type: 'Privéles', instructor: 'Marieke', maxParticipants: 1, color: 'green', participantIds: [] },
    { id: '6', name: 'Groep6', dayOfWeek: 3, time: '18:00', type: 'Dressuurles', instructor: 'Tom', maxParticipants: 8, color: 'purple', participantIds: [] },
    { id: '7', name: 'Groep7', dayOfWeek: 4, time: '10:00', type: 'Springles', instructor: 'Marieke', maxParticipants: 8, color: 'pink', participantIds: [] },
    { id: '8', name: 'Groep8', dayOfWeek: 4, time: '11:00', type: 'Groepsles', instructor: 'Sarah', maxParticipants: 10, color: 'indigo', participantIds: [] },
  ]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [newLesson, setNewLesson] = useState<Partial<RecurringLesson>>({
    name: '',
    dayOfWeek: 1,
    time: '14:00',
    type: 'Dressuurles',
    instructor: '',
    maxParticipants: 8,
    color: 'blue',
    participantIds: [],
  });

  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const daysOfWeek = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];
  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

  // Generate calendar events from recurring lessons
  useEffect(() => {
    const events: CalendarEvent[] = [];
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    recurringLessons.forEach(lesson => {
      const currentDate = new Date(startDate);
      
      // Find first occurrence of this day of week in the month
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1; // Convert to Monday=0
        
        if (dayOfWeek === lesson.dayOfWeek) {
          const eventId = `${lesson.id}-${currentDate.toISOString().split('T')[0]}`;
          
          // Check if there are existing registraties for this event
          const existingRegistraties = lesRegistraties.filter(r => r.lesEventId === eventId);
          const participantIds = existingRegistraties.length > 0 
            ? existingRegistraties.map(r => r.klantId)
            : lesson.participantIds;

          events.push({
            id: eventId,
            date: currentDate.toISOString().split('T')[0],
            time: lesson.time,
            group: lesson.name,
            color: lesson.color,
            type: lesson.type,
            instructor: lesson.instructor,
            description: `${lesson.name} - ${lesson.type}`,
            recurringLessonId: lesson.id,
            participantIds: participantIds,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    setCalendarEvents(events);
  }, [recurringLessons, currentMonth, currentYear, lesRegistraties]);

  // Automatische afschrijving check - elke minuut
  useEffect(() => {
    const checkEnSchrijfLessenAf = () => {
      const nu = new Date();
      const lesDuur = 60; // minuten

      calendarEvents.forEach(event => {
        const lesDatum = new Date(`${event.date}T${event.time}`);
        const lesEindTijd = new Date(lesDatum.getTime() + (lesDuur * 60 * 1000));
        
        // Is les voorbij EN status nog gepland?
        if (nu > lesEindTijd) {
          event.participantIds.forEach(klantId => {
            // Check of er al een registratie bestaat
            const bestaandeRegistratie = lesRegistraties.find(
              r => r.lesEventId === event.id && r.klantId === klantId
            );

            // Als er nog geen registratie is, maak nieuwe aan met status 'gepland'
            if (!bestaandeRegistratie) {
              const leskaart = leskaarten.find(
                l => l.klantId === klantId && l.status === 'actief' && l.resterendeLessen > 0
              );

              if (leskaart) {
                const nieuweRegistratie: LesRegistratie = {
                  id: `${event.id}-${klantId}-${Date.now()}`,
                  leskaartId: leskaart.id,
                  klantId: klantId,
                  lesEventId: event.id,
                  lesDatum: event.date,
                  lesTijd: event.time,
                  lesDuur: lesDuur,
                  status: 'gepland',
                  automatischAfgeschreven: false,
                };

                setLesRegistraties(prev => [...prev, nieuweRegistratie]);
              }
            }

            // Als status nog 'gepland' is, schrijf automatisch af
            if (bestaandeRegistratie && bestaandeRegistratie.status === 'gepland') {
              const leskaart = leskaarten.find(l => l.id === bestaandeRegistratie.leskaartId);
              
              if (leskaart && leskaart.resterendeLessen > 0) {
                // Update registratie naar 'gereden'
                setLesRegistraties(prev => prev.map(r => 
                  r.id === bestaandeRegistratie.id 
                    ? { ...r, status: 'gereden', automatischAfgeschreven: true, aangepastOp: new Date().toISOString() }
                    : r
                ));

                // Update leskaart
                setLeskaarten(prev => prev.map(l => 
                  l.id === leskaart.id
                    ? {
                        ...l,
                        gebruikteLessen: l.gebruikteLessen + 1,
                        resterendeLessen: l.resterendeLessen - 1,
                        status: l.resterendeLessen - 1 === 0 ? 'opgebruikt' : l.status,
                      }
                    : l
                ));
              }
            }
          });
        }
      });
    };

    // Check elke minuut
    const interval = setInterval(checkEnSchrijfLessenAf, 60000);
    
    // Direct checken bij mount
    checkEnSchrijfLessenAf();

    return () => clearInterval(interval);
  }, [calendarEvents, lesRegistraties, leskaarten]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500 text-white';
      case 'teal': return 'bg-teal-500 text-white';
      case 'orange': return 'bg-orange-500 text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'purple': return 'bg-purple-500 text-white';
      case 'pink': return 'bg-pink-500 text-white';
      case 'indigo': return 'bg-indigo-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateStr);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditedEvent({ ...event });
    setIsEditMode(false);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsEditMode(false);
    setEditedEvent(null);
  };

  const handleSaveEvent = () => {
    if (editedEvent) {
      setCalendarEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === editedEvent.id ? editedEvent : event
        )
      );
      
      // Update recurring lesson participants
      setRecurringLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === editedEvent.recurringLessonId
            ? { ...lesson, participantIds: editedEvent.participantIds }
            : lesson
        )
      );
      
      setSelectedEvent(editedEvent);
      setIsEditMode(false);
    }
  };

  const handleAddParticipant = (memberId: string) => {
    if (editedEvent && !editedEvent.participantIds.includes(memberId)) {
      // Check of klant een actieve leskaart heeft
      const actieveLeskaart = leskaarten.find(
        l => l.klantId === memberId && l.status === 'actief' && l.resterendeLessen > 0
      );

      if (actieveLeskaart) {
        // Maak les registratie aan
        const nieuweRegistratie: LesRegistratie = {
          id: `${editedEvent.id}-${memberId}-${Date.now()}`,
          leskaartId: actieveLeskaart.id,
          klantId: memberId,
          lesEventId: editedEvent.id,
          lesDatum: editedEvent.date,
          lesTijd: editedEvent.time,
          lesDuur: 60, // standaard 60 minuten
          status: 'gepland',
          automatischAfgeschreven: false,
        };

        setLesRegistraties(prev => [...prev, nieuweRegistratie]);
      }

      const updatedEvent = {
        ...editedEvent,
        participantIds: [...editedEvent.participantIds, memberId],
      };
      setEditedEvent(updatedEvent);
    }
  };

  const handleRemoveParticipant = (memberId: string) => {
    if (editedEvent) {
      // Verwijder les registratie als deze bestaat
      const registratie = lesRegistraties.find(
        r => r.lesEventId === editedEvent.id && r.klantId === memberId
      );

      if (registratie && registratie.status === 'gepland') {
        // Alleen verwijderen als status nog 'gepland' is (les nog niet geweest)
        setLesRegistraties(prev => prev.filter(r => r.id !== registratie.id));
      } else if (registratie) {
        // Als les al geweest is, markeer als 'afgezegd' en geef les terug
        if (registratie.status === 'gereden') {
          const leskaart = leskaarten.find(l => l.id === registratie.leskaartId);
          if (leskaart) {
            setLeskaarten(prev => prev.map(l => 
              l.id === leskaart.id
                ? {
                    ...l,
                    gebruikteLessen: Math.max(0, l.gebruikteLessen - 1),
                    resterendeLessen: l.resterendeLessen + 1,
                    status: 'actief',
                  }
                : l
            ));
          }
        }
        
        setLesRegistraties(prev => prev.map(r => 
          r.id === registratie.id
            ? { ...r, status: 'afgezegd', aangepastOp: new Date().toISOString() }
            : r
        ));
      }

      setEditedEvent({
        ...editedEvent,
        participantIds: editedEvent.participantIds.filter(id => id !== memberId),
      });
    }
  };

  const handleWijzigLesStatus = (registratieId: string, nieuweStatus: LesRegistratie['status']) => {
    const registratie = lesRegistraties.find(r => r.id === registratieId);
    if (!registratie) return;

    const leskaart = leskaarten.find(l => l.id === registratie.leskaartId);
    if (!leskaart) return;

    const oudeStatus = registratie.status;

    // Als van 'gereden' naar iets anders, geef les terug
    if (oudeStatus === 'gereden' && nieuweStatus !== 'gereden') {
      setLeskaarten(prev => prev.map(l => 
        l.id === leskaart.id
          ? {
              ...l,
              gebruikteLessen: Math.max(0, l.gebruikteLessen - 1),
              resterendeLessen: l.resterendeLessen + 1,
              status: 'actief',
            }
          : l
      ));
    }

    // Als naar 'gereden', schrijf af
    if (oudeStatus !== 'gereden' && nieuweStatus === 'gereden' && leskaart.resterendeLessen > 0) {
      setLeskaarten(prev => prev.map(l => 
        l.id === leskaart.id
          ? {
              ...l,
              gebruikteLessen: l.gebruikteLessen + 1,
              resterendeLessen: l.resterendeLessen - 1,
              status: l.resterendeLessen - 1 === 0 ? 'opgebruikt' : l.status,
            }
          : l
      ));
    }

    setLesRegistraties(prev => prev.map(r => 
      r.id === registratieId
        ? { ...r, status: nieuweStatus, aangepastOp: new Date().toISOString() }
        : r
    ));
  };

  const handleAddRecurringLesson = () => {
    if (newLesson.name && newLesson.time) {
      const lesson: RecurringLesson = {
        id: Date.now().toString(),
        name: newLesson.name,
        dayOfWeek: newLesson.dayOfWeek || 1,
        time: newLesson.time,
        type: newLesson.type || 'Dressuurles',
        instructor: newLesson.instructor,
        maxParticipants: newLesson.maxParticipants || 8,
        color: newLesson.color || 'blue',
        description: newLesson.description,
        participantIds: [],
      };
      
      setRecurringLessons([...recurringLessons, lesson]);
      setShowAddLessonModal(false);
      setNewLesson({
        name: '',
        dayOfWeek: 1,
        time: '14:00',
        type: 'Dressuurles',
        instructor: '',
        maxParticipants: 8,
        color: 'blue',
        participantIds: [],
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
      'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getParticipantNames = (participantIds: string[]) => {
    return participantIds
      .map(id => MOCK_MEMBERS.find(m => m.id === id))
      .filter(Boolean)
      .map(m => m!.name);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

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
                    onClick={() => handleEventClick(event)}
                    className={`${getColorClasses(event.color)} text-xs p-2 rounded font-medium shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    {event.time} {event.group}
                    {event.participantIds.length > 0 && (
                      <span className="ml-1 text-xs opacity-90">({event.participantIds.length})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleDeleteLesson = () => {
    if (selectedEvent && window.confirm(`Weet je zeker dat je deze les wilt verwijderen?`)) {
      // Verwijder alle lesregistraties voor dit event
      setLesRegistraties(prev => prev.filter(r => r.lesEventId !== selectedEvent.id));
      // Verwijder het event
      setCalendarEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      setSelectedEvent(null);
    }
  };

  const handleMarkAttendance = () => {
    if (selectedEvent) {
      // Open modal om aanwezigheid in te voeren
      setIsEditMode(true);
      setEditedEvent({ ...selectedEvent });
    }
  };

  const handleExportPlanning = () => {
    alert('Planning wordt geëxporteerd...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-brand-primary pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🐴</span>
            </div>
            <h1 className="text-4xl font-bold text-brand-primary">ManegePlanning</h1>
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

        {/* Actie Knoppen Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl shadow-soft border border-brand-soft/30">
          <button
            onClick={() => setShowAddLessonModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe Les</span>
          </button>
          
          {selectedEvent && (
            <>
              <button
                onClick={handleMarkAttendance}
                className="flex items-center space-x-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                <span>Aanwezigheid Invoeren</span>
              </button>
              
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
              >
                <Edit className="w-4 h-4" />
                <span>Les Bewerken</span>
              </button>
              
              <button
                onClick={handleDeleteLesson}
                className="flex items-center space-x-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Les Verwijderen</span>
              </button>
            </>
          )}
          
          <div className="flex-1"></div>
          
          <button
            onClick={() => onNavigate && onNavigate(ViewState.PLANNING_BEHEER)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Settings className="w-4 h-4" />
            <span>Beheer</span>
          </button>
          
          <div className="flex-1"></div>
          
          <button
            onClick={handleExportPlanning}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-brand-soft/50 text-slate-600 rounded-xl hover:bg-brand-bg transition-all font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Planning</span>
          </button>
          
          <button
            onClick={() => alert('Lesoverzicht wordt getoond...')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-brand-soft/50 text-slate-600 rounded-xl hover:bg-brand-bg transition-all font-medium shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Lesoverzicht</span>
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-2xl font-bold text-pink-500">{selectedEvent.group}</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-6 overflow-y-auto flex-1">
              {isEditMode && editedEvent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Type</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{editedEvent.type || 'Niet opgegeven'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Datum</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{formatDate(editedEvent.date)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Tijd</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{editedEvent.time}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Instructeur</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{editedEvent.instructor || 'Niet opgegeven'}</p>
                    </div>
                  </div>
                  
                  {/* Deelnemers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-pink-500">Deelnemers</label>
                      <button
                        onClick={() => setShowAddParticipantModal(true)}
                        className="text-sm text-brand-primary hover:text-brand-hover font-medium"
                      >
                        + Klant toevoegen
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editedEvent.participantIds.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">Geen deelnemers toegevoegd</p>
                      ) : (
                        editedEvent.participantIds.map(memberId => {
                          const member = MOCK_MEMBERS.find(m => m.id === memberId);
                          if (!member) return null;
                          
                          const registratie = lesRegistraties.find(
                            r => r.lesEventId === editedEvent.id && r.klantId === memberId
                          );
                          const leskaart = registratie ? leskaarten.find(l => l.id === registratie.leskaartId) : null;
                          const status = registratie?.status || 'gepland';

                          const getStatusBadge = (status: string) => {
                            switch (status) {
                              case 'gereden':
                                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Gereden</span>;
                              case 'afgezegd':
                                return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">Afgezegd</span>;
                              case 'niet_geteld':
                                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Niet geteld</span>;
                              default:
                                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Gepland</span>;
                            }
                          };

                          return (
                            <div key={memberId} className="p-3 bg-slate-100 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-slate-700">{member.name}</p>
                                  <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(status)}
                                  <button
                                    onClick={() => handleRemoveParticipant(memberId)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                  >
                                    Verwijderen
                                  </button>
                                </div>
                              </div>
                              {leskaart && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-xs text-slate-600">
                                    Leskaart: {leskaart.resterendeLessen} lessen over
                                  </p>
                                </div>
                              )}
                              {registratie && (
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'gereden')}
                                    disabled={status === 'gereden'}
                                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Gereden
                                  </button>
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'afgezegd')}
                                    disabled={status === 'afgezegd'}
                                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Afgezegd
                                  </button>
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'niet_geteld')}
                                    disabled={status === 'niet_geteld'}
                                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Niet geteld
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Type</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{selectedEvent.type || 'Niet opgegeven'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Datum</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{formatDate(selectedEvent.date)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Tijd</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{selectedEvent.time}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Instructeur</label>
                    <div className="px-4 py-3 bg-slate-100 rounded-lg">
                      <p className="text-slate-700 font-medium">{selectedEvent.instructor || 'Niet opgegeven'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-500 mb-2">Deelnemers</label>
                    <div className="space-y-2">
                      {selectedEvent.participantIds.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">Geen deelnemers</p>
                      ) : (
                        selectedEvent.participantIds.map(memberId => {
                          const member = MOCK_MEMBERS.find(m => m.id === memberId);
                          if (!member) return null;
                          
                          const registratie = lesRegistraties.find(
                            r => r.lesEventId === selectedEvent.id && r.klantId === memberId
                          );
                          const leskaart = registratie ? leskaarten.find(l => l.id === registratie.leskaartId) : null;
                          const status = registratie?.status || 'gepland';

                          const getStatusBadge = (status: string) => {
                            switch (status) {
                              case 'gereden':
                                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Gereden</span>;
                              case 'afgezegd':
                                return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">Afgezegd</span>;
                              case 'niet_geteld':
                                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Niet geteld</span>;
                              default:
                                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Gepland</span>;
                            }
                          };

                          return (
                            <div key={memberId} className="p-3 bg-slate-100 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-slate-700">{member.name}</p>
                                  <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                                {getStatusBadge(status)}
                              </div>
                              {leskaart && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-xs text-slate-600">
                                    Leskaart: {leskaart.resterendeLessen} lessen over
                                  </p>
                                </div>
                              )}
                              {registratie && (
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'gereden')}
                                    disabled={status === 'gereden'}
                                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Gereden
                                  </button>
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'afgezegd')}
                                    disabled={status === 'afgezegd'}
                                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Afgezegd
                                  </button>
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'niet_geteld')}
                                    disabled={status === 'niet_geteld'}
                                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Niet geteld
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-4 flex gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSaveEvent}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Opslaan
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditedEvent({ ...selectedEvent });
                    }}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Annuleren
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Sluiten
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddParticipantModal && editedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddParticipantModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-brand-dark">Klant toevoegen</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                {MOCK_MEMBERS.filter(m => !editedEvent.participantIds.includes(m.id)).map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      handleAddParticipant(member.id);
                      setShowAddParticipantModal(false);
                    }}
                    className="w-full text-left p-3 bg-brand-bg hover:bg-brand-soft rounded-lg transition-colors"
                  >
                    <p className="font-medium text-brand-dark">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </button>
                ))}
                {MOCK_MEMBERS.filter(m => !editedEvent.participantIds.includes(m.id)).length === 0 && (
                  <p className="text-slate-400 text-sm italic">Alle klanten zijn al toegevoegd</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowAddParticipantModal(false)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recurring Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddLessonModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-brand-dark">Nieuwe Wekelijkse Les</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Groep Naam</label>
                <input
                  type="text"
                  value={newLesson.name || ''}
                  onChange={(e) => setNewLesson({ ...newLesson, name: e.target.value })}
                  placeholder="Bijv. Groep1"
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dag van de week</label>
                <select
                  value={newLesson.dayOfWeek || 1}
                  onChange={(e) => setNewLesson({ ...newLesson, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tijd</label>
                <input
                  type="time"
                  value={newLesson.time || '14:00'}
                  onChange={(e) => setNewLesson({ ...newLesson, time: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type Les</label>
                <select
                  value={newLesson.type || 'Dressuurles'}
                  onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="Dressuurles">Dressuurles</option>
                  <option value="Springles">Springles</option>
                  <option value="Groepsles">Groepsles</option>
                  <option value="Privéles">Privéles</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Instructeur</label>
                <input
                  type="text"
                  value={newLesson.instructor || ''}
                  onChange={(e) => setNewLesson({ ...newLesson, instructor: e.target.value })}
                  placeholder="Niet opgegeven"
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Maximaal aantal deelnemers</label>
                <input
                  type="number"
                  value={newLesson.maxParticipants || 8}
                  onChange={(e) => setNewLesson({ ...newLesson, maxParticipants: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowAddLessonModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddRecurringLesson}
                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Les Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
