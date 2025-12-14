import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { Users, Calendar, DollarSign, Activity, AlertCircle, Heart } from 'lucide-react';
import { CHART_DATA } from '../constants';

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ElementType }> = ({ 
  title, value, subtext, icon: Icon 
}) => (
  <div className="bg-white p-6 rounded-3xl shadow-soft border border-transparent hover:border-brand-soft/50 transition-all duration-300 flex items-start justify-between group">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-2">{title}</p>
      <h3 className="text-3xl font-bold text-brand-dark mb-2">{value}</h3>
      <p className="text-slate-400 text-xs">{subtext}</p>
    </div>
    <div className="p-4 rounded-2xl bg-brand-bg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300 shadow-sm">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-1">Welkom thuis, Esmée Versteeg</h1>
          <p className="text-slate-500 flex items-center">
            Manege Duiksehoef <span className="mx-2">•</span> <span className="text-brand-primary font-medium">Overzicht van vandaag</span>
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-brand-primary font-medium bg-white px-6 py-3 rounded-full shadow-soft border border-brand-soft/20">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Lessen Vandaag" 
          value="18" 
          subtext="2 lessen vereisen aandacht" 
          icon={Calendar} 
        />
        <StatCard 
          title="Actieve Ruiters" 
          value="452" 
          subtext="+12 nieuwe ruiters deze maand" 
          icon={Users} 
        />
        <StatCard 
          title="Omzet Vandaag" 
          value="€ 1.250" 
          subtext="Totaal deze week: € 8.400" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Zorg & Welzijn" 
          value="3" 
          subtext="Thunder, Zorro, Spirit" 
          icon={Heart} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-soft border border-transparent">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-brand-dark">Omzet & Lessen</h3>
            <div className="flex gap-2">
              <span className="flex items-center text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-brand-primary mr-1"></div> Lessen</span>
              <span className="flex items-center text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-brand-soft mr-1"></div> Omzet</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fff1f8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#fff6fb' }}
                />
                <Bar yAxisId="right" dataKey="omzet" name="Omzet (€)" fill="#ffb3d1" radius={[8, 8, 8, 8]} barSize={12} />
                <Bar yAxisId="left" dataKey="lessen" name="Aantal Lessen" fill="#f4428a" radius={[8, 8, 8, 8]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-soft border border-transparent">
          <h3 className="text-xl font-bold text-brand-dark mb-6">Attenties</h3>
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-red-50 rounded-2xl border border-red-100/50">
              <AlertCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-bold text-red-800">Incasso Batch</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">De batch van 24-10 bevat 3 fouten. Controleer de gegevens.</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
              <Activity className="w-6 h-6 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-bold text-orange-800">Vaccinaties</p>
                <p className="text-xs text-orange-600 mt-1 leading-relaxed">Black Beauty en Bella moeten deze week gevaccineerd worden.</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-brand-bg rounded-2xl border border-brand-soft/30">
              <Users className="w-6 h-6 text-brand-primary mt-0.5 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-bold text-brand-dark">Nieuwe Ruiters</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">Er staan 4 nieuwe aanmeldingen op de wachtlijst.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;