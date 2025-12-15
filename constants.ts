import { Horse, Lesson, Member, Transaction, Factuur } from './types';

export const MOCK_HORSES: Horse[] = [
  { id: '1', name: 'Bartje', breed: 'Onbekend', birthDate: '2007-01-03', available: true, type: 'Manege' },
  { id: '2', name: 'Boy', breed: 'Onbekend', birthDate: '2012-06-12', available: true, type: 'Manege' },
  { id: '3', name: 'Cookie Dough', breed: 'Onbekend', birthDate: '', available: true, type: 'Manege' },
  { id: '4', name: 'EP', breed: 'Eigen Paard', birthDate: '', available: true, type: 'Manege' },
  { id: '5', name: 'Fonix', breed: 'Onbekend', birthDate: '', available: true, type: 'Manege' },
  { id: '6', name: 'Ginger', breed: 'Risico', birthDate: '1997-06-10', available: true, type: 'Manege' },
  { id: '7', name: 'Hugo', breed: 'Onbekend', birthDate: '1992-01-01', available: true, type: 'Manege' },
  { id: '8', name: 'Iske', breed: 'Onbekend', birthDate: '', available: true, type: 'Manege' },
  { id: '9', name: 'Jelle', breed: 'Onbekend', birthDate: '1992-01-01', available: true, type: 'Manege' },
  { id: '10', name: 'Lilly', breed: 'Onbekend', birthDate: '', available: true, type: 'Manege' },
  { id: '11', name: 'Linde', breed: 'Kings Lindy', birthDate: '2002-05-18', available: true, type: 'Manege' },
  { id: '12', name: 'Lotje', breed: 'Onbekend', birthDate: '', available: true, type: 'Manege' },
  { id: '13', name: 'Pietertje', breed: 'Excelent', birthDate: '2009-07-18', available: true, type: 'Manege' },
  { id: '14', name: 'Platini', breed: 'Onbekend', birthDate: '1997-04-26', available: true, type: 'Manege' },
  { id: '15', name: 'Skittle', breed: 'Onbekend', birthDate: '', available: true, type: 'Manege' },
  { id: '16', name: 'Uquabelle', breed: 'Onbekend', birthDate: '2006-03-01', available: true, type: 'Manege' },
  { id: '17', name: 'Vatino', breed: 'Onbekend', birthDate: '2001-05-15', available: true, type: 'Manege' },
  { id: '18', name: 'Vina', breed: 'Fra Liberte', birthDate: '', available: true, type: 'Manege' },
];

export const MOCK_MEMBERS: Member[] = [];

export const MOCK_LESSONS: Lesson[] = [
  { id: '1', day: 'Vandaag', time: '09:00', duration: 60, instructor: 'Marieke', arena: 'Binnenbak 1', maxRiders: 8, currentRiders: 6, type: 'Groepsles' },
  { id: '2', day: 'Vandaag', time: '10:00', duration: 60, instructor: 'Marieke', arena: 'Binnenbak 1', maxRiders: 8, currentRiders: 8, type: 'Groepsles' },
  { id: '3', day: 'Vandaag', time: '11:00', duration: 45, instructor: 'Tom', arena: 'Buitenbak', maxRiders: 1, currentRiders: 1, type: 'Privéles' },
  { id: '4', day: 'Vandaag', time: '16:00', duration: 60, instructor: 'Tom', arena: 'Binnenbak 2', maxRiders: 6, currentRiders: 4, type: 'Springles' },
  { id: '5', day: 'Vandaag', time: '19:00', duration: 60, instructor: 'Sarah', arena: 'Binnenbak 1', maxRiders: 10, currentRiders: 9, type: 'Groepsles' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const CHART_DATA = [
  { name: 'Ma', lessen: 12, omzet: 800 },
  { name: 'Di', lessen: 15, omzet: 1200 },
  { name: 'Wo', lessen: 18, omzet: 1500 },
  { name: 'Do', lessen: 14, omzet: 1100 },
  { name: 'Vr', lessen: 16, omzet: 1300 },
  { name: 'Za', lessen: 22, omzet: 2100 },
  { name: 'Zo', lessen: 10, omzet: 900 },
];

export const MOCK_FACTUREN: Factuur[] = [];
