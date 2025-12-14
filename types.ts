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
  INSTELLINGEN = 'INSTELLINGEN'
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
