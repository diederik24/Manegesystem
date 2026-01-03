import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Database, 
  Euro, 
  BarChart3, 
  Settings, 
  LogOut,
  HelpCircle,
  Menu,
  X,
  Heart,
  CreditCard,
  UserPlus,
  Coffee
} from 'lucide-react';
import { ViewState } from '../types';
import PensionstalIcon from './PensionstalIcon';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

const NavItem: React.FC<{ 
  icon: React.ElementType; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-4 rounded-3xl transition-all duration-300 mb-2 font-medium group ${
      isActive 
        ? 'bg-brand-primary text-white shadow-soft shadow-brand-primary/30' 
        : 'text-slate-500 hover:bg-brand-soft/20 hover:text-brand-primary'
    }`}
  >
    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'}`} />
    <span>{label}</span>
  </button>
);

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-brand-dark/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-brand-soft/30 transform transition-transform duration-300 ease-in-out rounded-r-3xl lg:rounded-none shadow-soft
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8 pb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-brand-dark leading-tight">Manege</h1>
                <p className="text-sm font-medium text-brand-primary">Duiksehoef</p>
              </div>
            </div>
            <button 
              className="lg:hidden text-slate-400 hover:text-brand-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mb-4 text-xs font-bold text-brand-primary/60 uppercase tracking-widest px-4">Overzicht</div>
            <NavItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              isActive={currentView === ViewState.DASHBOARD} 
              onClick={() => { onNavigate(ViewState.DASHBOARD); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={CalendarDays} 
              label="Planning" 
              isActive={currentView === ViewState.PLANNING} 
              onClick={() => { onNavigate(ViewState.PLANNING); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={Database} 
              label="Stamgegevens" 
              isActive={currentView === ViewState.STAMGEGEVENS} 
              onClick={() => { onNavigate(ViewState.STAMGEGEVENS); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={Euro} 
              label="Financieel" 
              isActive={currentView === ViewState.FINANCIEEL} 
              onClick={() => { onNavigate(ViewState.FINANCIEEL); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={BarChart3} 
              label="Rapportages" 
              isActive={currentView === ViewState.RAPPORTAGES} 
              onClick={() => { onNavigate(ViewState.RAPPORTAGES); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={CreditCard} 
              label="Leskaarten" 
              isActive={currentView === ViewState.LESKAARTEN} 
              onClick={() => { onNavigate(ViewState.LESKAARTEN); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={PensionstalIcon} 
              label="Pensionstalling" 
              isActive={currentView === ViewState.PENSIONSTALLING} 
              onClick={() => { onNavigate(ViewState.PENSIONSTALLING); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={UserPlus} 
              label="Nieuwe Aanmeldingen" 
              isActive={currentView === ViewState.NIEUWE_AANMELDINGEN} 
              onClick={() => { onNavigate(ViewState.NIEUWE_AANMELDINGEN); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={Coffee} 
              label="Consumptie" 
              isActive={currentView === ViewState.CONSUMPTIE} 
              onClick={() => { onNavigate(ViewState.CONSUMPTIE); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={Heart} 
              label="Zorg & Welzijn" 
              isActive={currentView === ViewState.ZORG_WELZIJN} 
              onClick={() => { onNavigate(ViewState.ZORG_WELZIJN); setIsMobileMenuOpen(false); }}
            />
            
            <div className="mt-8 mb-4 text-xs font-bold text-brand-primary/60 uppercase tracking-widest px-4">Systeem</div>
            <NavItem 
              icon={Settings} 
              label="Instellingen" 
              isActive={currentView === ViewState.INSTELLINGEN} 
              onClick={() => { onNavigate(ViewState.INSTELLINGEN); setIsMobileMenuOpen(false); }}
            />
            <NavItem 
              icon={HelpCircle} 
              label="Help & Info"
              isActive={currentView === ViewState.HELP_INFO}
              onClick={() => { onNavigate(ViewState.HELP_INFO); setIsMobileMenuOpen(false); }}
            />
            
            <div className="mt-8 mb-4">
              <NavItem 
                icon={LogOut} 
                label="Uitloggen"
                isActive={false}
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              />
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-6">
             <div className="flex items-center p-3 rounded-3xl bg-brand-bg border border-brand-soft/50">
               <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-brand-primary font-bold mr-3 shadow-sm">
                 EV
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-brand-dark truncate">Esmée Versteeg</p>
                 <p className="text-xs text-slate-500 truncate">Beheerder</p>
               </div>
               <button 
                 onClick={handleLogout}
                 className="text-slate-400 hover:text-brand-primary transition-colors"
                 title="Uitloggen"
               >
                 <LogOut className="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Decorative background orb */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-brand-soft/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Mobile Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-brand-soft/30 p-4 lg:hidden flex items-center justify-between sticky top-0 z-30">
           <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                <img 
                  src="/Logo.png" 
                  alt="Manege Duikse Hoef Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <span className="text-lg font-bold text-brand-dark">Duiksehoef</span>
            </div>
            <button 
              className="p-2 text-brand-primary bg-brand-soft/20 rounded-xl hover:bg-brand-soft/40"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-10 relative z-10">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;