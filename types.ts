export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  PLANNING = 'PLANNING',
  STAMGEGEVENS = 'STAMGEGEVENS',
  FINANCIEEL = 'FINANCIEEL',
  RAPPORTAGES = 'RAPPORTAGES',
  LESKAARTEN = 'LESKAARTEN',
  PENSIONSTALLING = 'PENSIONSTALLING',
  NIEUWE_AANMELDINGEN = 'NIEUWE_AANMELDINGEN',
  CONSUMPTIE = 'CONSUMPTIE',
  INSTELLINGEN = 'INSTELLINGEN',
  HELP_INFO = 'HELP_INFO',
  ZORG_WELZIJN = 'ZORG_WELZIJN',
  PLANNING_BEHEER = 'PLANNING_BEHEER',
  FACTURATIE_BEKIJKEN = 'FACTURATIE_BEKIJKEN'
}

export interface Horse {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  available: boolean;
  type: 'Manege' | 'Pension';
  owner?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Actief' | 'Wachtlijst' | 'Inactief';
  balance: number;
  klantType?: 'Pension' | 'Manege';
  adres?: string;
  postcode?: string;
  plaats?: string;
  factuurAdres?: string;
  factuurPostcode?: string;
  factuurPlaats?: string;
  factuurOntvangen?: boolean;
  factuurEmail?: string;
}

export interface FamilyMember {
  id: string;
  member_id: string; // Hoofdklant die betaalt
  name: string;
  geboortedatum?: string;
  email?: string;
  telefoon?: string;
  opmerking?: string;
  status: 'Actief' | 'Inactief';
  created_at?: string;
  updated_at?: string;
}

export interface Lesson {
  id: string;
  time: string; // "09:00"
  duration: number; // minutes
  instructor: string;
  arena: string; // "Binnenbak 1"
  maxRiders: number;
  currentRiders: number;
  type: 'Groepsles' | 'Privéles' | 'Springles';
  day: string; // "Maandag"
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Factuur' | 'Betaling' | 'Incasso';
  status: 'Open' | 'Betaald' | 'Verwerkt';
  memberId: string;
  memberName: string;
}

export interface Factuur {
  id: string;
  factuurnummer: string;
  klantId: string;
  klantNaam: string;
  klantEmail: string;
  klantType: 'Pension' | 'Manege';
  datum: string;
  vervaldatum: string;
  bedrag: number;
  omschrijving: string;
  status: 'Open' | 'Betaald' | 'Verwerkt' | 'Achterstallig';
  betaaldOp?: string;
  eersteHerinneringVerstuurd?: string;
  tweedeHerinneringVerstuurd?: string;
  aantalHerinneringen: number;
}

export interface ConsumptieItem {
  id: string;
  naam: string;
  prijs: number;
  aantal: number;
  totaal: number;
}

export interface ConsumptieKaart {
  id: string;
  klantId: string;
  klantNaam: string;
  klantEmail: string;
  datum: string;
  items: ConsumptieItem[];
  totaalBedrag: number;
  status: 'open' | 'klaar_voor_facturatie' | 'betaalverzoek_verstuurd' | 'betaald';
  molliePaymentId?: string;
}

export interface RecurringLesson {
  id: string;
  name: string; // Groep naam (bijv. "Groep1")
  dayOfWeek: number; // 0 = Maandag, 6 = Zondag
  time: string; // HH:MM
  type: string; // Type les
  instructor?: string;
  maxParticipants: number;
  color: 'blue' | 'teal' | 'orange' | 'amber' | 'green' | 'purple' | 'pink' | 'indigo';
  description?: string;
  participantIds: string[]; // IDs van klanten die deelnemen
  familyMemberIds?: string[]; // IDs van gezinsleden die deelnemen
}

export interface LessonInstance {
  id: string;
  recurringLessonId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  participantIds: string[]; // IDs van klanten die deze specifieke les volgen
}

export interface Leskaart {
  id: string;
  klantId: string;
  klantNaam: string;
  totaalLessen: number;
  gebruikteLessen: number;
  resterendeLessen: number;
  startDatum: string;
  eindDatum: string;
  status: 'actief' | 'opgebruikt' | 'verlopen';
  created_at?: string;
  updated_at?: string;
}

export interface LesRegistratie {
  id: string;
  leskaartId: string;
  klantId: string;
  lesEventId: string; // ID van de CalendarEvent
  lesDatum: string; // YYYY-MM-DD
  lesTijd: string; // HH:MM
  lesDuur: number; // minuten (standaard 60)
  status: 'gepland' | 'gereden' | 'afgezegd' | 'niet_geteld';
  automatischAfgeschreven: boolean;
  afgemeldOp?: string; // timestamp wanneer afgemeld
  aangepastOp?: string; // timestamp laatste aanpassing
  created_at?: string;
}
