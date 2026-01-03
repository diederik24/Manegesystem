import React, { useState, useEffect } from 'react';
import { UserX, Plus, Calendar, Clock, X, Search, User, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Member, FamilyMember, RecurringLesson, ViewState } from '../types';
import { supabase } from '../lib/supabase';

interface Afmelding {
  id: string;
  lesEventId: string;
  lesDatum: string;
  lesTijd: string;
  lesNaam: string;
  klantId: string;
  klantNaam: string;
  klantEmail: string;
  klantTelefoon?: string;
  isGezinslid: boolean;
  gezinslidNaam?: string;
  hoofdklantNaam?: string;
  afgemeldOp: string;
  opmerking?: string;
  status: 'afgezegd' | 'geannuleerd';
}

interface AfmeldingenProps {
  onNavigate?: (view: ViewState) => void;
}

const Afmeldingen: React.FC<AfmeldingenProps> = ({ onNavigate }) => {
  const [afmeldingen, setAfmeldingen] = useState<Afmelding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allFamilyMembers, setAllFamilyMembers] = useState<FamilyMember[]>([]);
  const [recurringLessons, setRecurringLessons] = useState<RecurringLesson[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Nieuwe afmelding form state
  const [newAfmelding, setNewAfmelding] = useState({
    klantId: '',
    isGezinslid: false,
    gezinslidId: '',
    lesId: '',
    lesDatum: '',
    opmerking: ''
  });

  useEffect(() => {
    fetchAfmeldingen();
    fetchMembers();
    fetchRecurringLessons();
  }, []);

  const fetchAfmeldingen = async () => {
    try {
      setLoading(true);
      
      // Haal alle afmeldingen op uit lesson_cancellations tabel
      const { data: cancellationsData, error: cancellationsError } = await supabase
        .from('lesson_cancellations')
        .select(`
          *,
          recurring_lessons:recurring_lesson_id (
            id,
            name,
            day_of_week,
            time,
            type
          ),
          members:member_id (
            id,
            name,
            email,
            phone
          ),
          family_members:family_member_id (
            id,
            name,
            member_id
          )
        `)
        .order('afgemeld_op', { ascending: false });

      if (cancellationsError) {
        console.error('Error fetching cancellations:', cancellationsError);
        // Als tabel niet bestaat, toon lege lijst
        setAfmeldingen([]);
        return;
      }

      // Haal alle members op voor hoofdklant namen (voor gezinsleden)
      const { data: allMembersData } = await supabase
        .from('members')
        .select('id, name');

      const membersMap = new Map((allMembersData || []).map(m => [m.id, m]));

      // Map naar Afmelding interface
      const mappedAfmeldingen: Afmelding[] = (cancellationsData || []).map((cancel: any) => {
        const isGezinslid = !!cancel.family_member_id;
        const member = cancel.members;
        const familyMember = cancel.family_members;
        const lesson = cancel.recurring_lessons;

        let klantNaam = '';
        let klantEmail = '';
        let klantTelefoon = '';
        let gezinslidNaam = '';
        let hoofdklantNaam = '';

        if (isGezinslid && familyMember) {
          gezinslidNaam = familyMember.name || '';
          const hoofdklant = membersMap.get(familyMember.member_id);
          hoofdklantNaam = hoofdklant?.name || '';
          klantNaam = hoofdklantNaam;
        } else if (member) {
          klantNaam = member.name || '';
          klantEmail = member.email || '';
          klantTelefoon = member.phone || '';
        }

        const lesTijd = cancel.les_tijd ? formatTime(cancel.les_tijd) : (lesson?.time ? formatTime(lesson.time) : '');

        return {
          id: cancel.id,
          lesEventId: `${cancel.recurring_lesson_id}-${cancel.les_datum}`,
          lesDatum: cancel.les_datum,
          lesTijd: lesTijd,
          lesNaam: lesson?.name || 'Onbekende les',
          klantId: cancel.member_id || '',
          klantNaam: klantNaam,
          klantEmail: klantEmail,
          klantTelefoon: klantTelefoon,
          isGezinslid: isGezinslid,
          gezinslidNaam: gezinslidNaam || undefined,
          hoofdklantNaam: hoofdklantNaam || undefined,
          afgemeldOp: cancel.afgemeld_op || cancel.created_at,
          opmerking: cancel.opmerking || undefined,
          status: 'afgezegd'
        };
      });

      setAfmeldingen(mappedAfmeldingen);
    } catch (error) {
      console.error('Error:', error);
      setAfmeldingen([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    // Remove seconds if present (format: HH:MM:SS -> HH:MM)
    return time.split(':').slice(0, 2).join(':');
  };

  const fetchMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'Actief')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
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

      if (!familyError && familyData) {
        const mappedFamily: FamilyMember[] = familyData.map((fm: any) => ({
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
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchRecurringLessons = async () => {
    try {
      const { data: lessonsData, error } = await supabase
        .from('recurring_lessons')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching lessons:', error);
        return;
      }

      const mappedLessons: RecurringLesson[] = (lessonsData || []).map((lesson: any) => {
        let timeStr = '14:00';
        if (lesson.time) {
          if (typeof lesson.time === 'string') {
            timeStr = lesson.time.substring(0, 5);
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
          participantIds: [],
          familyMemberIds: []
        };
      });

      setRecurringLessons(mappedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleAddAfmelding = async () => {
    if (!newAfmelding.lesId || !newAfmelding.lesDatum) {
      alert('Selecteer een les en datum');
      return;
    }

    if (!newAfmelding.klantId && !newAfmelding.isGezinslid) {
      alert('Selecteer een klant of gezinslid');
      return;
    }

    if (newAfmelding.isGezinslid && !newAfmelding.gezinslidId) {
      alert('Selecteer een gezinslid');
      return;
    }

    try {
      // Haal les informatie op voor tijd
      const { data: lessonData } = await supabase
        .from('recurring_lessons')
        .select('time')
        .eq('id', newAfmelding.lesId)
        .single();

      if (!lessonData) {
        alert('Les niet gevonden');
        return;
      }

      const lesTijd = lessonData.time ? formatTime(lessonData.time) : '14:00';

      // Voeg afmelding toe aan database
      const { error: insertError } = await supabase
        .from('lesson_cancellations')
        .insert({
          member_id: newAfmelding.isGezinslid ? null : newAfmelding.klantId,
          family_member_id: newAfmelding.isGezinslid ? newAfmelding.gezinslidId : null,
          recurring_lesson_id: newAfmelding.lesId,
          les_datum: newAfmelding.lesDatum,
          les_tijd: lesTijd,
          opmerking: newAfmelding.opmerking || null,
          afgemeld_op: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting cancellation:', insertError);
        throw new Error(insertError.message || 'Fout bij toevoegen van afmelding');
      }

      alert('Afmelding succesvol toegevoegd');
      
      // Reset form
      setNewAfmelding({
        klantId: '',
        isGezinslid: false,
        gezinslidId: '',
        lesId: '',
        lesDatum: '',
        opmerking: ''
      });
      setShowAddModal(false);
      
      // Refresh lijst
      fetchAfmeldingen();
    } catch (error: any) {
      console.error('Error adding cancellation:', error);
      alert(error.message || 'Fout bij toevoegen van afmelding');
    }
  };

  const filteredAfmeldingen = afmeldingen.filter(afmelding => {
    const matchesSearch = 
      afmelding.klantNaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afmelding.klantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afmelding.lesNaam.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;

    const afmeldingDate = new Date(afmelding.lesDatum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedFilter === 'today') {
      return afmeldingDate.toDateString() === today.toDateString();
    }

    if (selectedFilter === 'week') {
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      return afmeldingDate >= today && afmeldingDate <= weekFromNow;
    }

    if (selectedFilter === 'month') {
      const monthFromNow = new Date(today);
      monthFromNow.setMonth(today.getMonth() + 1);
      return afmeldingDate >= today && afmeldingDate <= monthFromNow;
    }

    return true;
  });

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

  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-brand-primary pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <UserX className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-brand-primary">Afmeldingen</h1>
        </div>
        <button
          onClick={() => onNavigate && onNavigate(ViewState.PLANNING)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium"
        >
          Terug naar Planning
        </button>
      </div>

      {/* Filters en Search */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-soft border border-brand-soft/30">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Zoek op naam, email of les..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-soft/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-700"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedFilter === 'all'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white border border-brand-soft/50 text-slate-600 hover:bg-brand-bg'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setSelectedFilter('today')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedFilter === 'today'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white border border-brand-soft/50 text-slate-600 hover:bg-brand-bg'
            }`}
          >
            Vandaag
          </button>
          <button
            onClick={() => setSelectedFilter('week')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedFilter === 'week'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white border border-brand-soft/50 text-slate-600 hover:bg-brand-bg'
            }`}
          >
            Deze week
          </button>
          <button
            onClick={() => setSelectedFilter('month')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedFilter === 'month'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white border border-brand-soft/50 text-slate-600 hover:bg-brand-bg'
            }`}
          >
            Deze maand
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Afmelding Toevoegen</span>
        </button>
      </div>

      {/* Afmeldingen Lijst */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-slate-500">Afmeldingen laden...</p>
          </div>
        </div>
      ) : filteredAfmeldingen.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 p-12 text-center">
          <UserX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Geen afmeldingen gevonden</h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? 'Geen afmeldingen gevonden voor je zoekopdracht.' : 'Er zijn nog geen afmeldingen geregistreerd.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Eerste afmelding toevoegen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-soft/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-dark uppercase tracking-wider">Klant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-dark uppercase tracking-wider">Les</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-dark uppercase tracking-wider">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-dark uppercase tracking-wider">Tijd</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-dark uppercase tracking-wider">Afgemeld op</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-dark uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-soft/20">
                {filteredAfmeldingen.map((afmelding, index) => {
                  const afgemeldDate = new Date(afmelding.afgemeldOp)
                  const formattedAfgemeld = afgemeldDate.toLocaleString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })

                  return (
                    <tr key={afmelding.id} className={index % 2 === 0 ? 'bg-white' : 'bg-brand-bg/30'}>
                      <td className="px-4 py-3 text-sm text-brand-dark">
                        {afmelding.isGezinslid ? (
                          <div>
                            <div className="font-medium">{afmelding.gezinslidNaam}</div>
                            {afmelding.hoofdklantNaam && (
                              <div className="text-xs text-slate-500">van {afmelding.hoofdklantNaam}</div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium">{afmelding.klantNaam}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{afmelding.lesNaam}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(afmelding.lesDatum)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{afmelding.lesTijd}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formattedAfgemeld}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          afmelding.status === 'afgezegd'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {afmelding.status === 'afgezegd' ? 'Afgemeld' : 'Geannuleerd'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Afmelding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-brand-dark">Nieuwe Afmelding</h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Klant of Gezinslid</label>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!newAfmelding.isGezinslid}
                      onChange={() => setNewAfmelding({ ...newAfmelding, isGezinslid: false, gezinslidId: '' })}
                      className="w-4 h-4"
                    />
                    <span>Klant</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={newAfmelding.isGezinslid}
                      onChange={() => setNewAfmelding({ ...newAfmelding, isGezinslid: true, klantId: '' })}
                      className="w-4 h-4"
                    />
                    <span>Gezinslid</span>
                  </label>
                </div>

                {!newAfmelding.isGezinslid ? (
                  <select
                    value={newAfmelding.klantId}
                    onChange={(e) => setNewAfmelding({ ...newAfmelding, klantId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Selecteer klant...</option>
                    {allMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={newAfmelding.gezinslidId}
                    onChange={(e) => setNewAfmelding({ ...newAfmelding, gezinslidId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Selecteer gezinslid...</option>
                    {allFamilyMembers.map(fm => {
                      const hoofdklant = allMembers.find(m => m.id === fm.member_id);
                      return (
                        <option key={fm.id} value={fm.id}>
                          {fm.name} (van {hoofdklant?.name || 'onbekend'})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Les</label>
                <select
                  value={newAfmelding.lesId}
                  onChange={(e) => setNewAfmelding({ ...newAfmelding, lesId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">Selecteer les...</option>
                  {recurringLessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>
                      {dayNames[lesson.dayOfWeek]} {lesson.time} - {lesson.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Datum</label>
                <input
                  type="date"
                  value={newAfmelding.lesDatum}
                  onChange={(e) => setNewAfmelding({ ...newAfmelding, lesDatum: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Opmerking (optioneel)</label>
                <textarea
                  value={newAfmelding.opmerking}
                  onChange={(e) => setNewAfmelding({ ...newAfmelding, opmerking: e.target.value })}
                  placeholder="Voeg een opmerking toe..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAfmelding({
                    klantId: '',
                    isGezinslid: false,
                    gezinslidId: '',
                    lesId: '',
                    lesDatum: '',
                    opmerking: ''
                  });
                }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddAfmelding}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Afmelding Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Afmeldingen;

