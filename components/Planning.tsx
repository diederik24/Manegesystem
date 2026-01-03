import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Plus, Users, Calendar, CheckCircle, XCircle, AlertCircle, Trash2, UserCheck, Edit, FileText, Download, Settings, Search, UserX, Clock } from 'lucide-react';
import { RecurringLesson, LessonInstance, Member, Leskaart, LesRegistratie, ViewState, FamilyMember } from '../types';
import { supabase } from '../lib/supabase';

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
  participantIds: string[]; // Member IDs
  familyMemberIds?: string[]; // Family member IDs
}

interface PlanningProps {
  onNavigate?: (view: ViewState) => void;
}

const Planning: React.FC<PlanningProps> = ({ onNavigate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter' | 'year'>('day');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showDeleteLessonModal, setShowDeleteLessonModal] = useState(false);
  const [selectedLessonsToDelete, setSelectedLessonsToDelete] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelEntireLessonMode, setCancelEntireLessonMode] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allFamilyMembers, setAllFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
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

  const [recurringLessons, setRecurringLessons] = useState<RecurringLesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [cancellations, setCancellations] = useState<Record<string, any>>({});

  // Haal recurring lessons op uit Supabase
  useEffect(() => {
    const fetchRecurringLessons = async () => {
      try {
        setLoadingLessons(true);
        
        // Haal lessen op
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('recurring_lessons')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('time', { ascending: true });

        if (lessonsError) {
          console.error('Error fetching recurring lessons:', lessonsError);
          // Zet lege array zodat app niet crasht
          setRecurringLessons([]);
          setLoadingLessons(false);
          return;
        }

        // Haal deelnemers op voor alle lessen (inclusief gezinsleden)
        const lessonIds = (lessonsData || []).map(l => l.id);
        let participantsMap: Record<string, { memberIds: string[], familyMemberIds: string[] }> = {};

        if (lessonIds.length > 0) {
          const { data: participantsData, error: participantsError } = await supabase
            .from('lesson_participants')
            .select('recurring_lesson_id, member_id, family_member_id')
            .in('recurring_lesson_id', lessonIds);

          if (!participantsError && participantsData) {
            participantsMap = participantsData.reduce((acc: Record<string, { memberIds: string[], familyMemberIds: string[] }>, p: any) => {
              if (!acc[p.recurring_lesson_id]) {
                acc[p.recurring_lesson_id] = { memberIds: [], familyMemberIds: [] };
              }
              if (p.family_member_id) {
                // Gezinslid
                acc[p.recurring_lesson_id].familyMemberIds.push(p.family_member_id);
              } else if (p.member_id) {
                // Normale klant
                acc[p.recurring_lesson_id].memberIds.push(p.member_id);
              }
              return acc;
            }, {});
          }
        }

        // Map naar RecurringLesson interface
        const mappedLessons: RecurringLesson[] = (lessonsData || []).map((lesson: any) => {
          // Parse tijd veilig
          let timeStr = '14:00'; // Default
          if (lesson.time) {
            if (typeof lesson.time === 'string') {
              timeStr = lesson.time.substring(0, 5); // HH:MM format
            } else if (lesson.time instanceof Date) {
              const hours = String(lesson.time.getHours()).padStart(2, '0');
              const minutes = String(lesson.time.getMinutes()).padStart(2, '0');
              timeStr = `${hours}:${minutes}`;
            }
          }
          
          return {
            id: lesson.id,
            name: lesson.name || 'Onbenoemde les',
            dayOfWeek: lesson.day_of_week ?? 0,
            time: timeStr,
            type: lesson.type || 'Groepsles',
            instructor: lesson.instructor || undefined,
            maxParticipants: lesson.max_participants || 10,
            color: (lesson.color || 'blue') as RecurringLesson['color'],
            description: lesson.description || undefined,
            participantIds: participantsMap[lesson.id]?.memberIds || [],
            familyMemberIds: participantsMap[lesson.id]?.familyMemberIds || []
          };
        });

        setRecurringLessons(mappedLessons);
      } catch (error) {
        console.error('Unexpected error fetching lessons:', error);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchRecurringLessons();
  }, []);

  // Functie om cancellations op te halen
  const fetchCancellations = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_cancellations')
        .select('*');

      if (error) {
        console.error('Error fetching cancellations:', error);
        return;
      }

      // Maak een map van cancellations: key = `${recurring_lesson_id}-${les_datum}`
      const cancellationsMap: Record<string, any> = {};
      (data || []).forEach((cancellation: any) => {
        const key = `${cancellation.recurring_lesson_id}-${cancellation.les_datum}`;
        if (!cancellationsMap[key]) {
          cancellationsMap[key] = cancellation;
        }
      });

      setCancellations(cancellationsMap);
    } catch (error) {
      console.error('Error fetching cancellations:', error);
    }
  };

  // Haal cancellations op
  useEffect(() => {
    fetchCancellations();
    
    // Refresh cancellations elke 5 seconden
    const interval = setInterval(fetchCancellations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Haal alle klanten en gezinsleden op uit Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        
        // Haal klanten op
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .in('klant_type', ['Manege', 'Pension'])
          .eq('status', 'Actief')
          .order('name', { ascending: true });

        if (membersError) {
          console.error('Error fetching members:', membersError);
          setAllMembers([]);
          return;
        }

        const mappedMembers: Member[] = (membersData || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email || '',
          phone: m.phone || '',
          status: m.status || 'Actief',
          balance: parseFloat(m.balance) || 0,
          klantType: m.klant_type || undefined,
          adres: m.adres || '',
          postcode: m.postcode || '',
          plaats: m.plaats || ''
        }));

        setAllMembers(mappedMembers);

        // Haal gezinsleden op
        const { data: familyData, error: familyError } = await supabase
          .from('family_members')
          .select('*')
          .eq('status', 'Actief')
          .order('name', { ascending: true });

        if (familyError) {
          console.error('Error fetching family members:', familyError);
          setAllFamilyMembers([]);
          return;
        }

        const mappedFamily: FamilyMember[] = (familyData || []).map((fm: any) => ({
          id: fm.id,
          member_id: fm.member_id,
          name: fm.name,
          geboortedatum: fm.geboortedatum || undefined,
          email: fm.email || undefined,
          telefoon: fm.telefoon || undefined,
          opmerking: fm.opmerking || undefined,
          status: fm.status || 'Actief',
          created_at: fm.created_at,
          updated_at: fm.updated_at
        }));

        setAllFamilyMembers(mappedFamily);
      } catch (error) {
        console.error('Unexpected error fetching members:', error);
        setAllMembers([]);
        setAllFamilyMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, []);

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
            : lesson.participantIds || [];
          const familyMemberIds = lesson.familyMemberIds || [];

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
            familyMemberIds: familyMemberIds,
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

  const handleSaveEvent = async () => {
    if (editedEvent) {
      try {
        // Update deelnemers in Supabase
        const { error: deleteError } = await supabase
          .from('lesson_participants')
          .delete()
          .eq('recurring_lesson_id', editedEvent.recurringLessonId);

        if (deleteError) throw deleteError;

        if (editedEvent.participantIds.length > 0) {
          const participantsToInsert = editedEvent.participantIds.map(memberId => ({
            recurring_lesson_id: editedEvent.recurringLessonId,
            member_id: memberId
          }));

          const { error: insertError } = await supabase
            .from('lesson_participants')
            .insert(participantsToInsert);

          if (insertError) throw insertError;
        }

        // Update local state
        setCalendarEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === editedEvent.id ? editedEvent : event
          )
        );
        
        setRecurringLessons(prevLessons =>
          prevLessons.map(lesson =>
            lesson.id === editedEvent.recurringLessonId
              ? { ...lesson, participantIds: editedEvent.participantIds }
              : lesson
          )
        );
        
        setSelectedEvent(editedEvent);
        setIsEditMode(false);
      } catch (error) {
        console.error('Error saving event:', error);
        alert('Fout bij opslaan van wijzigingen. Probeer het opnieuw.');
      }
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

  const handleAddRecurringLesson = async () => {
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
      
      // Voeg les toe aan Supabase
      try {
        const { data: newLessonData, error } = await supabase
          .from('recurring_lessons')
          .insert([{
            name: lesson.name,
            day_of_week: lesson.dayOfWeek,
            time: lesson.time + ':00', // Add seconds
            duration: 60, // Default duration
            type: lesson.type,
            instructor: lesson.instructor || null,
            max_participants: lesson.maxParticipants,
            color: lesson.color
          }])
          .select()
          .single();

        if (error) throw error;

        // Voeg deelnemers toe
        if (lesson.participantIds.length > 0) {
          const participantsToInsert = lesson.participantIds.map(memberId => ({
            recurring_lesson_id: newLessonData.id,
            member_id: memberId
          }));

          await supabase
            .from('lesson_participants')
            .insert(participantsToInsert);
        }

        // Update local state
        setRecurringLessons([...recurringLessons, {
          ...lesson,
          id: newLessonData.id
        }]);
        setShowAddLessonModal(false);
      } catch (error) {
        console.error('Error adding lesson:', error);
        alert('Fout bij toevoegen van les. Probeer het opnieuw.');
      }
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
      .map(id => allMembers.find(m => m.id === id))
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
                    {(event.participantIds.length > 0 || (event.familyMemberIds && event.familyMemberIds.length > 0)) && (
                      <span className="ml-1 text-xs opacity-90">
                        ({event.participantIds.length + (event.familyMemberIds?.length || 0)})
                      </span>
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

  const handleToggleLessonSelection = (lessonId: string) => {
    setSelectedLessonsToDelete(prev => 
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleSelectAllLessons = () => {
    if (selectedLessonsToDelete.length === recurringLessons.length) {
      setSelectedLessonsToDelete([]);
    } else {
      setSelectedLessonsToDelete(recurringLessons.map(l => l.id));
    }
  };

  const handleDeleteRecurringLessons = async () => {
    if (selectedLessonsToDelete.length === 0) return;

    try {
      // Verwijder alle deelnemers van de geselecteerde lessen
      const { error: participantsError } = await supabase
        .from('lesson_participants')
        .delete()
        .in('recurring_lesson_id', selectedLessonsToDelete);

      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
        alert('Fout bij verwijderen van deelnemers. Probeer het opnieuw.');
        return;
      }

      // Verwijder de lessen zelf
      const { error: lessonError } = await supabase
        .from('recurring_lessons')
        .delete()
        .in('id', selectedLessonsToDelete);

      if (lessonError) {
        console.error('Error deleting lessons:', lessonError);
        alert('Fout bij verwijderen van lessen. Probeer het opnieuw.');
        return;
      }

      // Update local state
      setRecurringLessons(prev => prev.filter(l => !selectedLessonsToDelete.includes(l.id)));
      setShowDeleteLessonModal(false);
      setSelectedLessonsToDelete([]);
      
      alert(`${selectedLessonsToDelete.length} ${selectedLessonsToDelete.length === 1 ? 'les' : 'lessen'} succesvol verwijderd uit de planning`);
    } catch (error) {
      console.error('Error deleting lessons:', error);
      alert('Fout bij verwijderen van lessen. Probeer het opnieuw.');
    }
  };

  const handleCancelLesson = () => {
    if (!selectedEvent) return;
    setCancelEntireLessonMode(false);
    setShowCancelModal(true);
  };

  // Functie om emails te versturen naar deelnemers bij afmelding
  const sendCancellationEmails = async (
    participants: Array<{ memberId?: string; familyMemberId?: string }>,
    lessonName: string,
    lessonDate: string,
    lessonTime: string,
    isAllDay: boolean = false
  ) => {
    try {
      // Haal email adressen op voor alle deelnemers
      const emailAddresses: string[] = [];
      const participantNames: string[] = [];

      for (const participant of participants) {
        if (participant.memberId) {
          // Normale klant
          const { data: member } = await supabase
            .from('members')
            .select('email, name')
            .eq('id', participant.memberId)
            .single();

          if (member && member.email) {
            emailAddresses.push(member.email);
            participantNames.push(member.name || 'Klant');
          }
        } else if (participant.familyMemberId) {
          // Gezinslid - haal email van gezinslid of hoofdklant op
          const { data: familyMember } = await supabase
            .from('family_members')
            .select('email, name, member_id')
            .eq('id', participant.familyMemberId)
            .single();

          if (familyMember) {
            // Gebruik email van gezinslid als beschikbaar, anders van hoofdklant
            if (familyMember.email) {
              emailAddresses.push(familyMember.email);
              participantNames.push(familyMember.name || 'Gezinslid');
            } else if (familyMember.member_id) {
              const { data: hoofdklant } = await supabase
                .from('members')
                .select('email, name')
                .eq('id', familyMember.member_id)
                .single();

              if (hoofdklant && hoofdklant.email) {
                emailAddresses.push(hoofdklant.email);
                participantNames.push(familyMember.name || 'Gezinslid');
              }
            }
          }
        }
      }

      if (emailAddresses.length === 0) {
        console.log('Geen email adressen gevonden voor deelnemers');
        return;
      }

      // Format datum
      const dateObj = new Date(lessonDate);
      const formattedDate = dateObj.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Maak email content
      const subject = isAllDay 
        ? `Les afgemeld - Alle lessen van ${formattedDate}`
        : `Les afgemeld - ${lessonName} op ${formattedDate}`;

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #e63946 0%, #f77f7f 100%); padding: 40px 30px; text-align: center;">
                      <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <img src="https://manege-klantenwebapp.vercel.app/Logo.png" alt="Manege Duikse Hoef Logo" style="width: 100%; height: 100%; object-fit: contain; padding: 10px;" />
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Les Afgemeld</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">Beste ruiter,</p>
                      
                      <p style="margin: 0 0 25px; color: #555555; font-size: 16px; line-height: 1.6;">
                        Helaas moeten wij u informeren dat ${isAllDay ? 'alle lessen van' : 'de les'} <strong style="color: #e63946;">${lessonName}</strong> ${isAllDay ? `op ${formattedDate}` : `op ${formattedDate} om ${lessonTime}`} is afgemeld.
                      </p>
                      
                      ${isAllDay ? `<p style="margin: 0 0 25px; color: #555555; font-size: 16px; line-height: 1.6;">Alle lessen die gepland stonden voor <strong>${formattedDate}</strong> zijn geannuleerd.</p>` : ''}
                      
                      <!-- Les Details Box -->
                      <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%); border-left: 4px solid #e63946; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          ${!isAllDay ? `
                          <tr>
                            <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                              <strong style="color: #e63946;">Les:</strong> ${lessonName}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                              <strong style="color: #e63946;">Datum:</strong> ${formattedDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                              <strong style="color: #e63946;">Tijd:</strong> ${lessonTime}
                            </td>
                          </tr>
                          ` : `
                          <tr>
                            <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                              <strong style="color: #e63946;">Datum:</strong> ${formattedDate}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                              <strong style="color: #e63946;">Status:</strong> Alle lessen geannuleerd
                            </td>
                          </tr>
                          `}
                        </table>
                      </div>
                      
                      <p style="margin: 25px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
                        Wij hopen u binnenkort weer te zien op de manege.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; line-height: 1.6;">
                        <strong style="color: #e63946;">Manege Duikse Hoef</strong>
                      </p>
                      <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.6;">
                        Met vriendelijke groet,<br>
                        Het team van Manege Duikse Hoef
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textBody = `
Les Afgemeld

Beste ruiter,

Helaas moeten wij u informeren dat ${isAllDay ? 'alle lessen van' : 'de les'} ${lessonName} ${isAllDay ? `op ${formattedDate}` : `op ${formattedDate} om ${lessonTime}`} is afgemeld.

${isAllDay ? `Alle lessen die gepland stonden voor ${formattedDate} zijn geannuleerd.` : ''}

Les Details:
${!isAllDay ? `Les: ${lessonName}\nDatum: ${formattedDate}\nTijd: ${lessonTime}` : `Datum: ${formattedDate}\nStatus: Alle lessen geannuleerd`}

Wij hopen u binnenkort weer te zien op de manege.

Met vriendelijke groet,
Manege Duikse Hoef
      `;

      // Verstuur email via Supabase Edge Function
      // Haal Supabase URL op uit de client
      const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        console.error('Supabase URL niet gevonden');
        return;
      }
      
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      // Verstuur naar alle email adressen
      const emailPromises = emailAddresses.map(async (email) => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              to: email,
              subject: subject,
              htmlBody: htmlBody,
              textBody: textBody,
            }),
          });

          if (!response.ok) {
            console.error(`Fout bij versturen email naar ${email}:`, await response.text());
          } else {
            console.log(`Email succesvol verstuurd naar ${email}`);
          }
        } catch (error) {
          console.error(`Error versturen email naar ${email}:`, error);
        }
      });

      await Promise.all(emailPromises);
    } catch (error) {
      console.error('Error sending cancellation emails:', error);
      // Fail silently - we willen niet dat email fouten de afmelding blokkeren
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedEvent) return;

    try {
      const lesDatum = selectedEvent.date;

      if (cancelEntireLessonMode) {
        // Haal alle lessen van deze dag op
        const dayEvents = getEventsForDate(new Date(lesDatum));
        
        // Verzamel alle cancellations voor alle lessen van deze dag
        const allCancellations: any[] = [];
        const allParticipantsForEmails: Array<{ memberId?: string; familyMemberId?: string; lessonName: string; lessonTime: string }> = [];
        
        dayEvents.forEach(event => {
          // Haal alle deelnemers op voor deze les
          const allParticipants: Array<{ memberId?: string; familyMemberId?: string }> = [];
          
          event.participantIds.forEach(memberId => {
            allParticipants.push({ memberId });
          });
          
          if (event.familyMemberIds) {
            event.familyMemberIds.forEach(familyMemberId => {
              allParticipants.push({ familyMemberId });
            });
          }

          // Voeg toe voor email verzending
          allParticipants.forEach(p => {
            allParticipantsForEmails.push({
              ...p,
              lessonName: event.group,
              lessonTime: event.time
            });
          });

          // Voeg afmeldingen toe voor alle deelnemers van deze les
          allParticipants.forEach(p => {
            allCancellations.push({
              member_id: p.memberId || null,
              family_member_id: p.familyMemberId || null,
              recurring_lesson_id: event.recurringLessonId,
              les_datum: lesDatum,
              les_tijd: event.time,
              opmerking: 'Alle lessen van deze dag afgemeld via planning',
              afgemeld_op: new Date().toISOString()
            });
          });
        });

        if (allCancellations.length === 0) {
          alert('Geen lessen gevonden voor deze dag.');
          return;
        }

        const { error } = await supabase
          .from('lesson_cancellations')
          .insert(allCancellations);

        if (error) {
          console.error('Error cancelling all lessons of day:', error);
          alert('Fout bij afmelden van lessen. Probeer het opnieuw.');
          return;
        }

        // Verstuur emails naar alle deelnemers
        await sendCancellationEmails(
          allParticipantsForEmails.map(p => ({ memberId: p.memberId, familyMemberId: p.familyMemberId })),
          'Alle lessen',
          lesDatum,
          '',
          true
        );

        setShowCancelModal(false);
        setCancelEntireLessonMode(false);
        handleCloseModal();
        // Refresh cancellations
        fetchCancellations();
      } else {
        // Normale afmelding: alleen deze specifieke les
        const lesTijd = selectedEvent.time;

        // Haal alle deelnemers op (zowel normale klanten als gezinsleden)
        const allParticipants: Array<{ memberId?: string; familyMemberId?: string }> = [];
        
        selectedEvent.participantIds.forEach(memberId => {
          allParticipants.push({ memberId });
        });
        
        if (selectedEvent.familyMemberIds) {
          selectedEvent.familyMemberIds.forEach(familyMemberId => {
            allParticipants.push({ familyMemberId });
          });
        }

        // Voeg afmeldingen toe voor alle deelnemers
        const cancellations = allParticipants.map(p => ({
          member_id: p.memberId || null,
          family_member_id: p.familyMemberId || null,
          recurring_lesson_id: selectedEvent.recurringLessonId,
          les_datum: lesDatum,
          les_tijd: lesTijd,
          opmerking: 'Afgemeld via planning',
          afgemeld_op: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('lesson_cancellations')
          .insert(cancellations);

        if (error) {
          console.error('Error cancelling lesson:', error);
          alert('Fout bij afmelden van les. Probeer het opnieuw.');
          return;
        }

        // Verstuur emails naar alle deelnemers
        await sendCancellationEmails(
          allParticipants,
          selectedEvent.group,
          lesDatum,
          lesTijd,
          false
        );

        setShowCancelModal(false);
        setCancelEntireLessonMode(false);
        handleCloseModal();
        // Refresh cancellations
        fetchCancellations();
      }
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      alert('Fout bij afmelden van les. Probeer het opnieuw.');
    }
  };

  const handleCancelAllLessons = async () => {
    if (!selectedEvent) return;

    try {
      // Haal alle toekomstige datums op voor deze les
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lesson = recurringLessons.find(l => l.id === selectedEvent.recurringLessonId);
      if (!lesson) {
        alert('Les niet gevonden');
        return;
      }

      // Genereer alle toekomstige datums voor deze les (volgende 3 maanden)
      const futureDates: string[] = [];
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3);

      let currentDate = new Date(today);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
        if (dayOfWeek === lesson.dayOfWeek) {
          futureDates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Haal alle deelnemers op
      const allParticipants: Array<{ memberId?: string; familyMemberId?: string }> = [];
      
      selectedEvent.participantIds.forEach(memberId => {
        allParticipants.push({ memberId });
      });
      
      if (selectedEvent.familyMemberIds) {
        selectedEvent.familyMemberIds.forEach(familyMemberId => {
          allParticipants.push({ familyMemberId });
        });
      }

      // Voeg afmeldingen toe voor alle deelnemers op alle toekomstige datums
      const cancellations: any[] = [];
      futureDates.forEach(lesDatum => {
        allParticipants.forEach(p => {
          cancellations.push({
            member_id: p.memberId || null,
            family_member_id: p.familyMemberId || null,
            recurring_lesson_id: selectedEvent.recurringLessonId,
            les_datum: lesDatum,
            les_tijd: selectedEvent.time,
            opmerking: 'Alle lessen afgemeld via planning',
            afgemeld_op: new Date().toISOString()
          });
        });
      });

      const { error } = await supabase
        .from('lesson_cancellations')
        .insert(cancellations);

      if (error) {
        console.error('Error cancelling all lessons:', error);
        alert('Fout bij afmelden van lessen. Probeer het opnieuw.');
        return;
      }

      setShowCancelModal(false);
      handleCloseModal();
    } catch (error) {
      console.error('Error cancelling all lessons:', error);
      alert('Fout bij afmelden van lessen. Probeer het opnieuw.');
    }
  };

  if (loadingLessons) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-slate-500">Lessen laden...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => {
                setViewMode('day');
                setSelectedDay(new Date());
              }}
              className={`px-4 py-2 border border-brand-soft rounded-lg transition-colors font-medium ${
                viewMode === 'day'
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-dark hover:bg-brand-bg'
              }`}
            >
              Dagoverzicht
            </button>
            <button
              onClick={() => setViewMode('quarter')}
              className={`px-4 py-2 border border-brand-soft rounded-lg transition-colors font-medium ${
                viewMode === 'quarter'
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-dark hover:bg-brand-bg'
              }`}
            >
              Kwartaaloverzicht
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-4 py-2 border border-brand-soft rounded-lg transition-colors font-medium ${
                viewMode === 'year'
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-dark hover:bg-brand-bg'
              }`}
            >
              Jaaroverzicht
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 border border-brand-soft rounded-lg transition-colors font-medium ${
                viewMode === 'month'
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-dark hover:bg-brand-bg'
              }`}
            >
              Maandoverzicht
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
          
          <button
            onClick={() => setShowDeleteLessonModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            <span>Les Verwijderen</span>
          </button>
          
          <button
            onClick={() => onNavigate && onNavigate(ViewState.AFMELDINGEN)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
          >
            <UserX className="w-4 h-4" />
            <span>Afmeldingen</span>
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

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Date Selector */}
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-soft border border-brand-soft/30 p-4">
            <button
              onClick={() => {
                const prevDay = new Date(selectedDay);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDay(prevDay);
              }}
              className="px-4 py-2 bg-brand-soft hover:bg-brand-primary hover:text-white rounded-lg transition-colors"
            >
              ← Vorige dag
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-brand-primary">
                {dayNames[selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1]} {selectedDay.getDate()} {months[selectedDay.getMonth()]} {selectedDay.getFullYear()}
              </h2>
            </div>
            <button
              onClick={() => {
                const nextDay = new Date(selectedDay);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDay(nextDay);
              }}
              className="px-4 py-2 bg-brand-soft hover:bg-brand-primary hover:text-white rounded-lg transition-colors"
            >
              Volgende dag →
            </button>
          </div>

          {/* Day Events */}
          <div className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 p-6">
            {(() => {
              // Bereken de dag van de week voor de geselecteerde dag (Monday = 0)
              const selectedDayOfWeek = selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1;
              const selectedDateStr = selectedDay.toISOString().split('T')[0];
              
              // Filter lessen die op deze dag van de week vallen
              const dayLessons = recurringLessons.filter(lesson => lesson.dayOfWeek === selectedDayOfWeek);
              
              // Genereer events voor deze dag
              const dayEvents: CalendarEvent[] = dayLessons.map(lesson => {
                const eventId = `${lesson.id}-${selectedDateStr}`;
                
                // Check of er bestaande registraties zijn
                const existingRegistraties = lesRegistraties.filter(r => r.lesEventId === eventId);
                const participantIds = existingRegistraties.length > 0 
                  ? existingRegistraties.map(r => r.klantId)
                  : lesson.participantIds || [];
                const familyMemberIds = lesson.familyMemberIds || [];

                return {
                  id: eventId,
                  date: selectedDateStr,
                  time: lesson.time,
                  group: lesson.name,
                  color: lesson.color,
                  type: lesson.type,
                  instructor: lesson.instructor,
                  description: `${lesson.name} - ${lesson.type}`,
                  recurringLessonId: lesson.id,
                  participantIds: participantIds,
                  familyMemberIds: familyMemberIds,
                };
              });

              // Sorteer op tijd
              const sortedEvents = dayEvents.sort((a, b) => {
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
              });

              if (sortedEvents.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">Geen lessen gepland voor deze dag</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {sortedEvents.map(event => {
                    const totalParticipants = event.participantIds.length + (event.familyMemberIds?.length || 0);
                    const cancellationKey = `${event.recurringLessonId}-${selectedDateStr}`;
                    const isCancelled = !!cancellations[cancellationKey];
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`${getColorClasses(event.color)} p-4 rounded-xl shadow-sm cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] relative ${isCancelled ? 'opacity-75' : ''}`}
                      >
                        {isCancelled && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                              Afgemeld
                            </span>
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-2xl font-bold">{event.time}</div>
                              <div>
                                <h3 className="text-xl font-bold">{event.group}</h3>
                                {event.type && (
                                  <p className="text-sm opacity-90">{event.type}</p>
                                )}
                              </div>
                            </div>
                            {event.instructor && (
                              <p className="text-sm opacity-90 mb-2">
                                Instructeur: {event.instructor}
                              </p>
                            )}
                            {totalParticipants > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Users className="w-4 h-4 opacity-90" />
                                <span className="text-sm opacity-90">
                                  {totalParticipants} {totalParticipants === 1 ? 'deelnemer' : 'deelnemers'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Month/Quarter/Year View */}
      {viewMode !== 'day' && (
        <>
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
        </>
      )}

      {/* Cancel Lesson Confirmation Modal */}
      {showCancelModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <UserX className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-brand-dark">Les afmelden</h2>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-4 border border-orange-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-slate-700">{formatDate(selectedEvent.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-slate-700">{selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{selectedEvent.group}</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 mb-4">
                {cancelEntireLessonMode
                  ? `Wil je alle lessen van ${formatDate(selectedEvent.date)} afmelden? Dit zal alle deelnemers (normale klanten en gezinsleden) afmelden voor alle lessen op deze dag.`
                  : `Weet je zeker dat je deze les wilt afmelden voor alle deelnemers?`}
              </p>

              {!cancelEntireLessonMode && (
                <button
                  onClick={() => setCancelEntireLessonMode(true)}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium mb-4"
                >
                  Alle lessen van deze dag afmelden
                </button>
              )}

              {cancelEntireLessonMode && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>Let op:</strong> Dit zal alle lessen van {formatDate(selectedEvent.date)} afmelden voor alle deelnemers.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelEntireLessonMode(false);
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
              >
                {cancelEntireLessonMode 
                  ? 'Alle lessen van deze dag afmelden' 
                  : 'Bevestig afmelding'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Modal */}
      {showDeleteLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] px-4" onClick={() => {
          setShowDeleteLessonModal(false);
          setSelectedLessonsToDelete([]);
        }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-brand-dark">Lessen Verwijderen</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteLessonModal(false);
                  setSelectedLessonsToDelete([]);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 flex-1 overflow-y-auto">
              <p className="text-slate-600 mb-4">
                Selecteer de lessen die je permanent wilt verwijderen uit de planning. Deze actie kan niet ongedaan worden gemaakt.
              </p>

              {recurringLessons.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Geen lessen beschikbaar</p>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      {selectedLessonsToDelete.length} van {recurringLessons.length} lessen geselecteerd
                    </span>
                    <button
                      onClick={handleSelectAllLessons}
                      className="text-sm text-brand-primary hover:text-brand-hover font-medium"
                    >
                      {selectedLessonsToDelete.length === recurringLessons.length ? 'Alles deselecteren' : 'Alles selecteren'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {recurringLessons.map(lesson => {
                      const isSelected = selectedLessonsToDelete.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleToggleLessonSelection(lesson.id)}
                          className={`w-full p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-red-500 border-red-500'
                                : 'border-slate-300'
                            }`}>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-brand-dark">{lesson.name}</h3>
                              <p className="text-sm text-slate-600">
                                {dayNames[lesson.dayOfWeek]} om {lesson.time} • {lesson.type}
                                {lesson.instructor && ` • ${lesson.instructor}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedLessonsToDelete.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Let op:</strong> Je staat op het punt om <strong>{selectedLessonsToDelete.length} {selectedLessonsToDelete.length === 1 ? 'les' : 'lessen'}</strong> permanent te verwijderen. 
                    Alle deelnemers en historie van deze lessen zullen ook worden verwijderd.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowDeleteLessonModal(false);
                  setSelectedLessonsToDelete([]);
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleDeleteRecurringLessons}
                disabled={selectedLessonsToDelete.length === 0}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verwijder {selectedLessonsToDelete.length > 0 ? `(${selectedLessonsToDelete.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-pink-500">{selectedEvent.group}</h2>
              <div className="flex items-center gap-3">
                {(() => {
                  const cancellationKey = `${selectedEvent.recurringLessonId}-${selectedEvent.date}`;
                  const isCancelled = !!cancellations[cancellationKey];
                  
                  if (isCancelled) {
                    return (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border-2 border-red-300 rounded-lg">
                        <UserX className="w-4 h-4 text-red-600" />
                        <span className="text-red-700 font-semibold">Les is afgemeld</span>
                      </div>
                    );
                  }
                  
                  return (
                    <button
                      onClick={handleCancelLesson}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Les afmelden</span>
                    </button>
                  );
                })()}
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
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
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-pink-500">Deelnemers</label>
                      <button
                        onClick={() => setShowAddParticipantModal(true)}
                        className="text-sm text-brand-primary hover:text-brand-hover font-medium"
                      >
                        + Klant toevoegen
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                      <div className="space-y-3">
                        {editedEvent.participantIds.length === 0 && (!editedEvent.familyMemberIds || editedEvent.familyMemberIds.length === 0) ? (
                          <p className="text-slate-400 text-sm italic py-4 text-center">Geen deelnemers toegevoegd</p>
                        ) : (
                          <>
                          {/* Normale klanten */}
                          {editedEvent.participantIds.map(memberId => {
                          const member = allMembers.find(m => m.id === memberId);
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
                            <div key={memberId} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800 text-base mb-1">{member.name}</p>
                                  <p className="text-sm text-slate-500">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {getStatusBadge(status)}
                                  <button
                                    onClick={() => handleRemoveParticipant(memberId)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    Verwijderen
                                  </button>
                                </div>
                              </div>
                              {leskaart && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-sm text-slate-600">
                                    Leskaart: {leskaart.resterendeLessen} lessen over
                                  </p>
                                </div>
                              )}
                              {registratie && (
                                <div className="mt-3 flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'gereden')}
                                    disabled={status === 'gereden'}
                                    className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                  >
                                    Gereden
                                  </button>
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'afgezegd')}
                                    disabled={status === 'afgezegd'}
                                    className="text-sm px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                  >
                                    Afgezegd
                                  </button>
                                  <button
                                    onClick={() => handleWijzigLesStatus(registratie.id, 'niet_geteld')}
                                    disabled={status === 'niet_geteld'}
                                    className="text-sm px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                  >
                                    Niet geteld
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Gezinsleden */}
                        {editedEvent.familyMemberIds && editedEvent.familyMemberIds.map(familyMemberId => {
                          const familyMember = allFamilyMembers.find(fm => fm.id === familyMemberId);
                          if (!familyMember) return null;
                          
                          const hoofdklant = allMembers.find(m => m.id === familyMember.member_id);
                          
                          return (
                            <div key={`family-${familyMemberId}`} className="p-4 bg-white border border-purple-200 rounded-lg shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800 text-base mb-1">
                                    {familyMember.name}
                                    <span className="ml-2 text-xs text-purple-600 font-normal">
                                      (gezinslid van {hoofdklant?.name || 'onbekend'})
                                    </span>
                                  </p>
                                  {familyMember.email && (
                                    <p className="text-sm text-slate-500">{familyMember.email}</p>
                                  )}
                                  {hoofdklant && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      Hoofdklant: {hoofdklant.name} ({hoofdklant.klantType || 'Onbekend'})
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Gezinslid</span>
                                  <button
                                    onClick={() => {
                                      if (editedEvent.familyMemberIds) {
                                        setEditedEvent({
                                          ...editedEvent,
                                          familyMemberIds: editedEvent.familyMemberIds.filter(id => id !== familyMemberId)
                                        });
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    Verwijderen
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </>
                        )}
                      </div>
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
                    <label className="block text-sm font-medium text-pink-500 mb-3">Deelnemers</label>
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                      <div className="space-y-3">
                        {selectedEvent.participantIds.length === 0 && (!selectedEvent.familyMemberIds || selectedEvent.familyMemberIds.length === 0) ? (
                          <p className="text-slate-400 text-sm italic py-4 text-center">Geen deelnemers</p>
                        ) : (
                          <>
                          {/* Normale klanten */}
                          {selectedEvent.participantIds.map(memberId => {
                          const member = allMembers.find(m => m.id === memberId);
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
                            <div key={memberId} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800 text-base mb-1">{member.name}</p>
                                  <p className="text-sm text-slate-500">{member.email}</p>
                                </div>
                                <div className="ml-4">
                                  {getStatusBadge(status)}
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
                        })}
                        {/* Gezinsleden */}
                        {selectedEvent.familyMemberIds && selectedEvent.familyMemberIds.map(familyMemberId => {
                          const familyMember = allFamilyMembers.find(fm => fm.id === familyMemberId);
                          if (!familyMember) return null;
                          
                          const hoofdklant = allMembers.find(m => m.id === familyMember.member_id);
                          
                          return (
                            <div key={`family-${familyMemberId}`} className="p-4 bg-white border border-purple-200 rounded-lg shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800 text-base mb-1">
                                    {familyMember.name}
                                    <span className="ml-2 text-xs text-purple-600 font-normal">
                                      (gezinslid van {hoofdklant?.name || 'onbekend'})
                                    </span>
                                  </p>
                                  {familyMember.email && (
                                    <p className="text-sm text-slate-500">{familyMember.email}</p>
                                  )}
                                  {hoofdklant && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      Hoofdklant: {hoofdklant.name} ({hoofdklant.klantType || 'Onbekend'})
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Gezinslid</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </>
                        )}
                      </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => { setShowAddParticipantModal(false); setParticipantSearchTerm(''); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-brand-dark mb-4">Klant toevoegen</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Zoek op naam of e-mail..."
                  value={participantSearchTerm}
                  onChange={(e) => setParticipantSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-soft/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-700"
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {allMembers
                    .filter(m => 
                      !editedEvent.participantIds.includes(m.id) &&
                      (participantSearchTerm === '' || 
                       m.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                       m.email.toLowerCase().includes(participantSearchTerm.toLowerCase()))
                    )
                    .map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          handleAddParticipant(member.id);
                          setShowAddParticipantModal(false);
                          setParticipantSearchTerm('');
                        }}
                        className="w-full text-left p-4 bg-brand-bg hover:bg-brand-soft rounded-lg transition-colors border border-transparent hover:border-brand-primary/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-brand-dark text-base mb-1">{member.name}</p>
                            <p className="text-sm text-slate-500 mb-1">{member.email}</p>
                            {member.phone && (
                              <p className="text-xs text-slate-400">{member.phone}</p>
                            )}
                          </div>
                          {member.klantType && (
                            <span className={`ml-3 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              member.klantType === 'Pension' 
                                ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                : 'bg-brand-bg text-brand-primary border border-brand-soft'
                            }`}>
                              {member.klantType}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  {allMembers.filter(m => 
                    !editedEvent.participantIds.includes(m.id) &&
                    (participantSearchTerm === '' || 
                     m.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
                     m.email.toLowerCase().includes(participantSearchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm italic">
                        {participantSearchTerm ? 'Geen klanten gevonden' : 'Alle klanten zijn al toegevoegd'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => { setShowAddParticipantModal(false); setParticipantSearchTerm(''); }}
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
