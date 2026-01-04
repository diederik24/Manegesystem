import React, { useState, useEffect } from 'react';
import { Search, Plus, CreditCard, Calendar, User, Filter, X, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Leskaart, RecurringLesson, Member } from '../types';
import { supabase } from '../lib/supabase';

interface LesRegistratie {
  id: string;
  leskaart_id: string;
  klant_id: string;
  les_datum: string;
  les_tijd: string;
  status: 'gepland' | 'gereden' | 'afgezegd' | 'niet_geteld';
  les_type?: string;
}

const Leskaarten: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewKaartModal, setShowNewKaartModal] = useState(false);
  const [selectedLeskaart, setSelectedLeskaart] = useState<Leskaart | null>(null);
  const [lesRegistraties, setLesRegistraties] = useState<LesRegistratie[]>([]);
  const [loadingRegistraties, setLoadingRegistraties] = useState(false);
  const [selectedKlant, setSelectedKlant] = useState<Member | null>(null);
  const [totaalLessen, setTotaalLessen] = useState(10);
  const [eindDatum, setEindDatum] = useState('');
  const [leskaarten, setLeskaarten] = useState<Leskaart[]>([]);
  const [recurringLessons, setRecurringLessons] = useState<RecurringLesson[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Haal leskaarten op uit Supabase
  useEffect(() => {
    const fetchLeskaarten = async () => {
      try {
        setLoading(true);
        
        // Haal leskaarten op met klant informatie
        const { data: leskaartenData, error: leskaartenError } = await supabase
          .from('leskaarten')
          .select(`
            id,
            klant_id,
            totaal_lessen,
            gebruikte_lessen,
            resterende_lessen,
            start_datum,
            eind_datum,
            status,
            created_at,
            updated_at,
            members:klant_id (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (leskaartenError) {
          console.error('Error fetching leskaarten:', leskaartenError);
          setLeskaarten([]);
          return;
        }

        // Map naar Leskaart interface
        const mappedLeskaarten: Leskaart[] = (leskaartenData || []).map((lk: any) => ({
          id: lk.id,
          klantId: lk.klant_id,
          klantNaam: lk.members?.name || 'Onbekend',
          totaalLessen: lk.totaal_lessen || 0,
          gebruikteLessen: lk.gebruikte_lessen || 0,
          resterendeLessen: lk.resterende_lessen || 0,
          startDatum: lk.start_datum,
          eindDatum: lk.eind_datum,
          status: lk.status || 'actief',
          created_at: lk.created_at,
          updated_at: lk.updated_at
        }));

        setLeskaarten(mappedLeskaarten);
      } catch (error) {
        console.error('Unexpected error fetching leskaarten:', error);
        setLeskaarten([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeskaarten();
  }, []);

  // Haal recurring lessons op
  useEffect(() => {
    const fetchRecurringLessons = async () => {
      try {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('recurring_lessons')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('time', { ascending: true });

        if (lessonsError) {
          console.error('Error fetching recurring lessons:', lessonsError);
          return;
        }

        // Haal deelnemers op
        const lessonIds = (lessonsData || []).map(l => l.id);
        let participantsMap: Record<string, string[]> = {};

        if (lessonIds.length > 0) {
          const { data: participantsData } = await supabase
            .from('lesson_participants')
            .select('recurring_lesson_id, member_id')
            .in('recurring_lesson_id', lessonIds)
            .is('family_member_id', null);

          if (participantsData) {
            participantsMap = participantsData.reduce((acc: Record<string, string[]>, p: any) => {
              if (!acc[p.recurring_lesson_id]) {
                acc[p.recurring_lesson_id] = [];
              }
              acc[p.recurring_lesson_id].push(p.member_id);
              return acc;
            }, {});
          }
        }

        const mappedLessons: RecurringLesson[] = (lessonsData || []).map((lesson: any) => ({
          id: lesson.id,
          name: lesson.name || 'Onbenoemde les',
          dayOfWeek: lesson.day_of_week ?? 0,
          time: lesson.time ? lesson.time.substring(0, 5) : '14:00',
          type: lesson.type || 'Groepsles',
          instructor: lesson.instructor || undefined,
          maxParticipants: lesson.max_participants || 10,
          color: (lesson.color || 'blue') as RecurringLesson['color'],
          description: lesson.description || undefined,
          participantIds: participantsMap[lesson.id] || []
        }));

        setRecurringLessons(mappedLessons);
      } catch (error) {
        console.error('Error fetching recurring lessons:', error);
      }
    };

    fetchRecurringLessons();
  }, []);

  // Haal alle klanten op voor dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .in('klant_type', ['Manege', 'Pension'])
          .eq('status', 'Actief')
          .order('name', { ascending: true });

        if (membersError) {
          console.error('Error fetching members:', membersError);
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
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, []);

  const getLessenVoorKlant = (klantId: string): RecurringLesson[] => {
    return recurringLessons.filter(lesson => lesson.participantIds.includes(klantId));
  };

  const formatDagVanWeek = (dayOfWeek: number): string => {
    const dagen = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
    return dagen[dayOfWeek];
  };

  // Helper functie om les datums te genereren
  // Supabase gebruikt: 0 = maandag, 1 = dinsdag, ..., 6 = zondag
  // JavaScript gebruikt: 0 = zondag, 1 = maandag, ..., 6 = zaterdag
  const generateLessonDates = (dayOfWeek: number, startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(startDate);
    
    // Converteer Supabase day_of_week naar JavaScript day
    // Supabase: 0=ma, 1=di, 2=wo, 3=do, 4=vr, 5=za, 6=zo
    // JS: 0=zo, 1=ma, 2=di, 3=wo, 4=do, 5=vr, 6=za
    const jsDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    
    // Ga naar de eerste dag van de week
    while (current.getDay() !== jsDay && current <= endDate) {
      current.setDate(current.getDate() + 1);
    }

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }

    return dates;
  };

  // Automatisch lessen markeren als gereden wanneer datum voorbij is
  useEffect(() => {
    const updateAutomaticLessonStatus = async () => {
      try {
        const vandaag = new Date();
        vandaag.setHours(0, 0, 0, 0);
        const vandaagStr = vandaag.toISOString().split('T')[0];
        
        // Haal alle leskaarten op die actief zijn
        const { data: alleLeskaarten } = await supabase
          .from('leskaarten')
          .select('id, klant_id, start_datum, eind_datum')
          .eq('status', 'actief');

        if (!alleLeskaarten || alleLeskaarten.length === 0) return;

        let hasUpdates = false;

        for (const leskaart of alleLeskaarten) {
          // Haal deelnemers op voor deze klant
          const { data: participants } = await supabase
            .from('lesson_participants')
            .select('recurring_lesson_id')
            .eq('member_id', leskaart.klant_id)
            .is('family_member_id', null);

          if (!participants || participants.length === 0) continue;

          const lessonIds = participants.map(p => p.recurring_lesson_id);

          // Haal recurring lessons op
          const { data: lessons } = await supabase
            .from('recurring_lessons')
            .select('id, day_of_week, time, type')
            .in('id', lessonIds);

          if (!lessons || lessons.length === 0) continue;

          // Genereer datums vanaf start_datum tot vandaag
          const startDate = new Date(leskaart.start_datum);
          const endDate = new Date(leskaart.eind_datum);
          const today = new Date();
          const maxDate = today < endDate ? today : endDate;

          for (const lesson of lessons) {
            // Genereer datums voor deze les
            const datums = generateLessonDates(lesson.day_of_week, startDate, maxDate);

            for (const datum of datums) {
              if (datum > vandaagStr) continue; // Alleen verleden

              // Check of er al een registratie is
              const { data: existing } = await supabase
                .from('les_registraties')
                .select('id, status')
                .eq('leskaart_id', leskaart.id)
                .eq('les_datum', datum)
                .eq('les_tijd', lesson.time.substring(0, 5))
                .maybeSingle();

              if (existing) continue; // Al bestaat

              // Check of er een afmelding is
              const { data: afmelding } = await supabase
                .from('lesson_cancellations')
                .select('id')
                .eq('member_id', leskaart.klant_id)
                .eq('les_datum', datum)
                .eq('les_tijd', lesson.time.substring(0, 5))
                .maybeSingle();

              if (afmelding) continue; // Is afgemeld

              // Maak registratie aan als "gereden"
              const { data: newReg, error: insertError } = await supabase
                .from('les_registraties')
                .insert({
                  leskaart_id: leskaart.id,
                  klant_id: leskaart.klant_id,
                  les_datum: datum,
                  les_tijd: lesson.time.substring(0, 5),
                  status: 'gereden',
                  automatisch_afgeschreven: true,
                  les_type: lesson.type
                })
                .select()
                .single();

              if (newReg && !insertError) {
                hasUpdates = true;
                
                // Update leskaart
                const { data: kaart } = await supabase
                  .from('leskaarten')
                  .select('gebruikte_lessen, resterende_lessen')
                  .eq('id', leskaart.id)
                  .single();

                if (kaart) {
                  const nieuweGebruikte = (kaart.gebruikte_lessen || 0) + 1;
                  const nieuweResterende = Math.max(0, (kaart.resterende_lessen || 0) - 1);
                  
                  await supabase
                    .from('leskaarten')
                    .update({
                      gebruikte_lessen: nieuweGebruikte,
                      resterende_lessen: nieuweResterende,
                      status: nieuweResterende === 0 ? 'opgebruikt' : 'actief',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', leskaart.id);
                }
              }
            }
          }
        }

        // Refresh leskaarten alleen als er updates zijn geweest
        if (hasUpdates) {
          const { data: refreshed } = await supabase
            .from('leskaarten')
            .select(`
              id,
              klant_id,
              totaal_lessen,
              gebruikte_lessen,
              resterende_lessen,
              start_datum,
              eind_datum,
              status,
              created_at,
              updated_at,
              members:klant_id (
                id,
                name
              )
            `)
            .order('created_at', { ascending: false });

          if (refreshed) {
            const mapped = refreshed.map((lk: any) => ({
              id: lk.id,
              klantId: lk.klant_id,
              klantNaam: lk.members?.name || 'Onbekend',
              totaalLessen: lk.totaal_lessen || 0,
              gebruikteLessen: lk.gebruikte_lessen || 0,
              resterendeLessen: lk.resterende_lessen || 0,
              startDatum: lk.start_datum,
              eindDatum: lk.eind_datum,
              status: lk.status || 'actief',
              created_at: lk.created_at,
              updated_at: lk.updated_at
            }));
            setLeskaarten(mapped);
          }
        }
      } catch (error) {
        console.error('Error updating lesson status:', error);
      }
    };

    // Voer uit bij mount en elke 10 minuten
    updateAutomaticLessonStatus();
    const interval = setInterval(updateAutomaticLessonStatus, 600000);

    return () => clearInterval(interval);
  }, []);

  // Haal lesregistraties op voor geselecteerde leskaart
  useEffect(() => {
    if (!selectedLeskaart) {
      setLesRegistraties([]);
      return;
    }

    const fetchLesRegistraties = async () => {
      setLoadingRegistraties(true);
      try {
        const { data, error } = await supabase
          .from('les_registraties')
          .select('*')
          .eq('leskaart_id', selectedLeskaart.id)
          .order('les_datum', { ascending: true });

        if (error) {
          console.error('Error fetching les registraties:', error);
          setLesRegistraties([]);
          return;
        }

        setLesRegistraties(data || []);
      } catch (error) {
        console.error('Error:', error);
        setLesRegistraties([]);
      } finally {
        setLoadingRegistraties(false);
      }
    };

    fetchLesRegistraties();
  }, [selectedLeskaart]);

  const filteredCards = leskaarten.filter(card => 
    card.klantNaam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (card: Leskaart) => {
    setSelectedLeskaart(card);
  };

  const handleCreateLeskaart = async () => {
    if (!selectedKlant || !eindDatum) {
      alert('Selecteer een klant en einddatum');
      return;
    }

    try {
      const startDatum = new Date().toISOString().split('T')[0];
      
      const { data: newKaartData, error: insertError } = await supabase
        .from('leskaarten')
        .insert([{
          klant_id: selectedKlant.id,
          totaal_lessen: totaalLessen,
          gebruikte_lessen: 0,
          resterende_lessen: totaalLessen,
          start_datum: startDatum,
          eind_datum: eindDatum,
          status: 'actief'
        }])
        .select(`
          id,
          klant_id,
          totaal_lessen,
          gebruikte_lessen,
          resterende_lessen,
          start_datum,
          eind_datum,
          status,
          created_at,
          updated_at
        `)
        .single();

      if (insertError) {
        console.error('Error creating leskaart:', insertError);
        alert('Fout bij aanmaken leskaart: ' + insertError.message);
        return;
      }

      // Voeg toe aan local state
      const newKaart: Leskaart = {
        id: newKaartData.id,
        klantId: newKaartData.klant_id,
        klantNaam: selectedKlant.name,
        totaalLessen: newKaartData.totaal_lessen,
        gebruikteLessen: newKaartData.gebruikte_lessen,
        resterendeLessen: newKaartData.resterende_lessen,
        startDatum: newKaartData.start_datum,
        eindDatum: newKaartData.eind_datum,
        status: newKaartData.status as 'actief' | 'opgebruikt' | 'verlopen',
        created_at: newKaartData.created_at,
        updated_at: newKaartData.updated_at
      };

      setLeskaarten([newKaart, ...leskaarten]);
      setShowNewKaartModal(false);
      setSelectedKlant(null);
      setTotaalLessen(10);
      setEindDatum('');
      alert('Leskaart succesvol aangemaakt!');
    } catch (error: any) {
      console.error('Error:', error);
      alert('Fout bij aanmaken leskaart: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Leskaarten</h1>
          <p className="text-slate-500 mt-1">Beheer leskaarten en abonnementen.</p>
        </div>
        <button 
          onClick={() => setShowNewKaartModal(true)}
          className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe Leskaart</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek op naam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>
          <button className="flex items-center space-x-2 px-5 py-3 bg-white border border-brand-soft/50 text-slate-600 rounded-2xl hover:bg-brand-bg shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-slate-500">Leskaarten laden...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Geen leskaarten gevonden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
            const percentage = (card.gebruikteLessen / card.totaalLessen) * 100;
            const lessenVoorKlant = getLessenVoorKlant(card.klantId);
            
            return (
              <div 
                key={card.id} 
                onClick={() => handleCardClick(card)}
                className="bg-gradient-to-br from-white to-brand-bg rounded-3xl p-6 shadow-soft border border-brand-soft/30 hover:border-brand-primary/30 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                      <CreditCard className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-dark">{card.klantNaam}</h3>
                      <p className="text-xs text-slate-500 capitalize">{card.status}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Les informatie */}
                  {lessenVoorKlant.length > 0 && (
                    <div className="pb-3 border-b border-brand-soft/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <span className="text-xs font-medium text-slate-700">Rijdt bij:</span>
                      </div>
                      <div className="space-y-1">
                        {lessenVoorKlant.map((les) => (
                          <div key={les.id} className="text-xs text-slate-600">
                            <span className="font-medium">{les.name}</span>
                            {' - '}
                            <span>{formatDagVanWeek(les.dayOfWeek)} {les.time}</span>
                            {les.instructor && (
                              <span className="text-slate-500"> ({les.instructor})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Lessen gebruikt</span>
                      <span className="font-bold text-brand-dark">{card.gebruikteLessen} / {card.totaalLessen} lessen</span>
                    </div>
                    <div className="w-full bg-brand-soft rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-primary to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-brand-soft/50">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Verloopt: {new Date(card.eindDatum).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <span className="text-sm font-bold text-brand-primary">{card.resterendeLessen} over</span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Nieuwe Leskaart Modal */}
      {showNewKaartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowNewKaartModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-dark">Nieuwe Leskaart</h2>
                <button onClick={() => setShowNewKaartModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Klant:</label>
                <select
                  value={selectedKlant?.id || ''}
                  onChange={(e) => {
                    const klant = allMembers.find(m => m.id === e.target.value);
                    setSelectedKlant(klant || null);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">Selecteer klant...</option>
                  {allMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aantal lessen:</label>
                <input
                  type="number"
                  min="1"
                  value={totaalLessen}
                  onChange={(e) => setTotaalLessen(parseInt(e.target.value) || 10)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Einddatum:</label>
                <input
                  type="date"
                  value={eindDatum}
                  onChange={(e) => setEindDatum(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowNewKaartModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateLeskaart}
                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Leskaart Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leskaart Detail Modal */}
      {selectedLeskaart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLeskaart(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">{selectedLeskaart.klantNaam}</h2>
                <p className="text-sm text-slate-500 mt-1">Leskaart #{selectedLeskaart.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedLeskaart(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Leskaart Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-sm text-slate-600">Type</p>
                  <p className="font-semibold text-brand-dark">{selectedLeskaart.totaalLessen}x Groepsles Jeugd</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Aangemaakt</p>
                  <p className="font-semibold text-brand-dark">
                    {new Date(selectedLeskaart.startDatum).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Geldig t/m</p>
                  <p className="font-semibold text-brand-dark">
                    {new Date(selectedLeskaart.eindDatum).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="font-semibold capitalize text-brand-dark">{selectedLeskaart.status}</p>
                </div>
              </div>

              {/* Statistieken */}
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Totaal</p>
                  <p className="text-2xl font-bold text-brand-dark">{selectedLeskaart.totaalLessen}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Geboekt</p>
                  <p className="text-2xl font-bold text-brand-dark">{lesRegistraties.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Afgeboekt</p>
                  <p className="text-2xl font-bold text-brand-dark">
                    {lesRegistraties.filter(r => r.status === 'gereden').length}
                  </p>
                </div>
              </div>

              {/* Lessen Grid */}
              <div>
                <h3 className="text-lg font-bold text-brand-dark mb-4">Groepsles</h3>
                {loadingRegistraties ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
                    <p className="text-slate-500">Lessen laden...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {Array.from({ length: selectedLeskaart.totaalLessen }, (_, i) => {
                        const lesIndex = i + 1;
                        const registratie = lesRegistraties
                          .filter(r => r.status !== 'afgezegd')
                          .sort((a, b) => new Date(a.les_datum).getTime() - new Date(b.les_datum).getTime())[i];
                        
                        return (
                          <div
                            key={lesIndex}
                            className={`p-4 rounded-lg border-2 text-center ${
                              registratie?.status === 'gereden'
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : registratie?.status === 'afgezegd'
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="text-2xl font-bold mb-1">{lesIndex}</div>
                            {registratie ? (
                              <>
                                <div className="text-xs font-medium mb-1">
                                  {registratie.status === 'gereden' ? 'Gereden' : 
                                   registratie.status === 'afgezegd' ? 'Afgezegd' : 'Gepland'}
                                </div>
                                <div className="text-[10px] opacity-75">
                                  {new Date(registratie.les_datum).toLocaleDateString('nl-NL', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit'
                                  })}
                                </div>
                                <div className="text-[10px] opacity-75 mt-1">
                                  {registratie.les_tijd}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs opacity-50">Nog niet gepland</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Afgezegde lessen */}
                    {lesRegistraties.filter(r => r.status === 'afgezegd').length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Afgezegde lessen</h4>
                        <div className="space-y-1">
                          {lesRegistraties
                            .filter(r => r.status === 'afgezegd')
                            .map((reg) => (
                              <div key={reg.id} className="text-sm text-red-600 flex items-center space-x-2">
                                <XCircle className="w-4 h-4" />
                                <span>
                                  {new Date(reg.les_datum).toLocaleDateString('nl-NL', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })} {reg.les_tijd} - Afgezegd
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leskaarten;

