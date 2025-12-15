import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle, 
  ChevronRight,
  Calendar,
  Users,
  Euro,
  BarChart3,
  CreditCard,
  Home,
  UserPlus,
  Coffee,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { ViewState } from '../types';

interface HelpInfoProps {
  onNavigate?: (view: ViewState) => void;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  steps: string[];
  viewState?: ViewState;
}

const HelpInfo: React.FC<HelpInfoProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('alle');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const tutorials: Tutorial[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Overzicht',
      description: 'Leer hoe je het dashboard gebruikt om een overzicht te krijgen van je manege',
      icon: LayoutDashboard,
      category: 'basis',
      steps: [
        'Het dashboard toont belangrijke statistieken zoals lessen vandaag, actieve ruiters en omzet',
        'Bekijk de "Let op" meldingen bovenaan voor belangrijke taken (zoals ontworming)',
        'Klik op "Bekijken" bij aandachtspunten om direct naar de betreffende pagina te gaan',
        'De grafiek toont omzet en lessen over tijd',
        'Attenties sectie geeft belangrijke meldingen weer'
      ],
      viewState: ViewState.DASHBOARD
    },
    {
      id: 'planning',
      title: 'Planning & Lessen Beheren',
      description: 'Hoe je lessen plant, deelnemers toevoegt en automatische leskaart afschrijving werkt',
      icon: Calendar,
      category: 'planning',
      steps: [
        'Klik op "Nieuwe Les" om een terugkerende les aan te maken',
        'Selecteer dag van de week, tijd en type les',
        'Voeg deelnemers toe door op een les te klikken en "Klant toevoegen" te selecteren',
        'Lessen worden automatisch afgeschreven van leskaarten na de les tijd',
        'Je kunt handmatig de status wijzigen: Gereden, Afgezegd, of Niet geteld',
        'Bij afzeggen wordt de les niet afgeschreven van de leskaart',
        'Met terugwerkende kracht kun je lessen aanpassen en leskaarten teruggeven'
      ],
      viewState: ViewState.PLANNING
    },
    {
      id: 'leskaarten',
      title: 'Leskaarten Beheren',
      description: 'Leskaarten aanmaken en bijhouden hoeveel lessen er gebruikt zijn',
      icon: CreditCard,
      category: 'planning',
      steps: [
        'Klik op "Nieuwe Leskaart" om een leskaart aan te maken',
        'Selecteer een klant en aantal lessen (standaard 10 lessen)',
        'Stel een einddatum in voor de leskaart',
        'Leskaarten worden automatisch afgeschreven wanneer een les voorbij is',
        'Bekijk bij elke leskaart bij welke groep de klant rijdt',
        'Het systeem toont hoeveel lessen gebruikt zijn en hoeveel er nog over zijn',
        'Leskaarten met 0 lessen over krijgen status "opgebruikt"'
      ],
      viewState: ViewState.LESKAARTEN
    },
    {
      id: 'consumptie',
      title: 'Consumptiekaarten & Betaalverzoeken',
      description: 'Consumptiekaarten aanmaken en automatisch betaalverzoeken versturen',
      icon: Coffee,
      category: 'financieel',
      steps: [
        'Ga naar Consumptie en klik op "Nieuwe Kaart"',
        'Selecteer eerst een klant uit de lijst',
        'Vul de datum in en voer consumptie items in (aantal en bedrag)',
        'Het totaalbedrag wordt automatisch berekend',
        'Kies "Kaart Opslaan" om alleen op te slaan, of "Klaar zetten voor betaalverzoek" om direct klaar te zetten',
        'In Batch Facturatie kun je meerdere kaarten selecteren en in één keer betaalverzoeken versturen',
        'De status van kaarten: Open → Klaar voor facturatie → Betaalverzoek verstuurd → Betaald'
      ],
      viewState: ViewState.CONSUMPTIE
    },
    {
      id: 'stamgegevens',
      title: 'Klanten & Paarden Beheren',
      description: 'Stamgegevens van klanten en paarden beheren',
      icon: Users,
      category: 'beheer',
      steps: [
        'Wissel tussen "Klanten" en "Paarden" tabs',
        'Gebruik de zoekbalk om snel klanten of paarden te vinden',
        'Klik op "Toevoegen" om nieuwe klanten of paarden toe te voegen',
        'Bekijk contactgegevens, status en saldo van klanten',
        'Voor paarden zie je ras, geboortedatum en beschikbaarheid'
      ],
      viewState: ViewState.STAMGEGEVENS
    },
    {
      id: 'financieel',
      title: 'Financieel Overzicht',
      description: 'Facturen, betalingen en transacties beheren',
      icon: Euro,
      category: 'financieel',
      steps: [
        'Bekijk alle transacties in het financiële overzicht',
        'Filter op type: Factuur, Betaling of Incasso',
        'Klik op "Nieuwe Factuur" om een factuur aan te maken',
        'Exporteer SEPA bestanden voor automatische incasso',
        'Bekijk openstaande bedragen en betaalstatus'
      ],
      viewState: ViewState.FINANCIEEL
    },
    {
      id: 'rapportages',
      title: 'Rapportages Genereren',
      description: 'Facturen, omzetrapportages en andere rapporten genereren',
      icon: BarChart3,
      category: 'rapportages',
      steps: [
        'Selecteer een rapportage type (Facturen, Omzet, Werkstaat Paarden, etc.)',
        'Kies een periode: Deze week, maand, kwartaal of jaar',
        'Of gebruik aangepaste datum range',
        'Klik op "Genereer Rapportage" om het rapport te maken',
        'Download als PDF of druk direct af',
        'Rapportages bevatten alle relevante data voor de geselecteerde periode'
      ],
      viewState: ViewState.RAPPORTAGES
    },
    {
      id: 'pensionstalling',
      title: 'Pensionstalling Beheren',
      description: 'Pensionpaarden en stallingen beheren',
      icon: Home,
      category: 'beheer',
      steps: [
        'Zoek pensionklanten in de zoekbalk',
        'Bekijk hoeveel pensionpaarden er zijn en hoeveel plaatsen beschikbaar',
        'Zie verwachte omzet voor deze maand',
        'Bekijk per paard de eigenaar en beschikbaarheid',
        'Klik op "Nieuw Pension" om een nieuwe pensionklant toe te voegen'
      ],
      viewState: ViewState.PENSIONSTALLING
    },
    {
      id: 'nieuwe-aanmeldingen',
      title: 'Nieuwe Aanmeldingen',
      description: 'Nieuwe aanmeldingen beheren en goedkeuren',
      icon: UserPlus,
      category: 'beheer',
      steps: [
        'Bekijk alle nieuwe aanmeldingen op de wachtlijst',
        'Controleer de gegevens van nieuwe aanmeldingen',
        'Goedkeur of wijs af nieuwe aanmeldingen',
        'Verplaats goedgekeurde aanmeldingen naar actieve klanten'
      ],
      viewState: ViewState.NIEUWE_AANMELDINGEN
    },
    {
      id: 'instellingen',
      title: 'Instellingen & Configuratie',
      description: 'Systeeminstellingen en configuratie aanpassen',
      icon: Settings,
      category: 'beheer',
      steps: [
        'Pas algemene instellingen aan zoals manege naam, email en adres',
        'Beheer gebruikers en rechten',
        'Configureer notificaties (email, push, SMS)',
        'Bekijk database status en connectie',
        'Pas beveiligingsinstellingen aan'
      ],
      viewState: ViewState.INSTELLINGEN
    }
  ];

  const categories = ['alle', 'basis', 'planning', 'financieel', 'beheer', 'rapportages'];
  const filteredTutorials = selectedCategory === 'alle' 
    ? tutorials 
    : tutorials.filter(t => t.category === selectedCategory);

  const getCategoryName = (cat: string) => {
    const names: { [key: string]: string } = {
      'alle': 'Alle Tutorials',
      'basis': 'Basis',
      'planning': 'Planning',
      'financieel': 'Financieel',
      'beheer': 'Beheer',
      'rapportages': 'Rapportages'
    };
    return names[cat] || cat;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Help & Info</h1>
          <p className="text-slate-600">Leer hoe je het systeem gebruikt met stap-voor-stap tutorials</p>
        </div>
      </div>

      {selectedTutorial ? (
        /* Tutorial Detail */
        <div className="bg-white rounded-3xl shadow-soft border border-transparent p-8">
          <button
            onClick={() => setSelectedTutorial(null)}
            className="mb-6 text-brand-primary hover:text-brand-hover font-medium flex items-center"
          >
            ← Terug naar overzicht
          </button>
          
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
              {React.createElement(selectedTutorial.icon, { className: "w-8 h-8 text-brand-primary" })}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-dark mb-2">{selectedTutorial.title}</h2>
              <p className="text-slate-600">{selectedTutorial.description}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {selectedTutorial.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-brand-bg rounded-2xl">
                <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-slate-700 pt-1">{step}</p>
              </div>
            ))}
          </div>

          {selectedTutorial.viewState && onNavigate && (
            <button
              onClick={() => {
                onNavigate(selectedTutorial.viewState!);
                setSelectedTutorial(null);
              }}
              className="w-full px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <span>Ga naar {selectedTutorial.title}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-brand-primary text-white shadow-soft'
                    : 'bg-white text-slate-600 hover:bg-brand-bg border border-brand-soft/50'
                }`}
              >
                {getCategoryName(category)}
              </button>
            ))}
          </div>

          {/* Tutorials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map(tutorial => {
              const Icon = tutorial.icon;
              return (
                <button
                  key={tutorial.id}
                  onClick={() => setSelectedTutorial(tutorial)}
                  className="bg-white rounded-3xl shadow-soft border border-transparent hover:border-brand-soft/50 p-6 text-left transition-all group"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                      <Icon className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-brand-dark mb-1">{tutorial.title}</h3>
                      <p className="text-sm text-slate-500">{tutorial.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-brand-primary text-sm font-medium">
                    <span>Lees tutorial</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default HelpInfo;

