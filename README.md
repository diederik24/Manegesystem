# Manegeplan

Een moderne webapplicatie voor het beheren van een manege, inclusief planning, financiën, leskaarten, pensionstalling en meer.

## Functies

- 📊 **Dashboard** - Overzicht van belangrijke informatie en statistieken
- 📅 **Planning** - Lesplanning en roosters
- 👥 **Stamgegevens** - Beheer van klanten en paarden
- 💰 **Financieel** - Financiële overzichten en administratie
- 📝 **Leskaarten** - Beheer van leskaarten
- 🐴 **Pensionstalling** - Beheer van pensionstalling
- 📋 **Nieuwe Aanmeldingen** - Verwerking van nieuwe aanmeldingen
- 🍎 **Consumptie** - Beheer van consumpties
- ⚙️ **Instellingen** - Applicatie-instellingen

## Technologieën

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool en development server
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **Recharts** - Chart library voor data visualisatie

## Installatie

### Vereisten

- Node.js (versie 18 of hoger)
- npm of yarn

### Stappen

1. Clone de repository:
```bash
git clone <repository-url>
cd manegeplan
```

2. Installeer dependencies:
```bash
npm install
```

3. Start de development server:
```bash
npm run dev
```

4. Open je browser en ga naar `http://localhost:5173`

## Scripts

- `npm run dev` - Start de development server
- `npm run build` - Build de applicatie voor productie
- `npm run preview` - Preview de productie build

## Project Structuur

```
manegeplan/
├── components/          # React componenten
│   ├── Dashboard.tsx
│   ├── Planning.tsx
│   ├── Stamgegevens.tsx
│   ├── Finance.tsx
│   └── ...
├── App.tsx             # Hoofdapplicatie component
├── types.ts            # TypeScript type definities
├── constants.ts        # Applicatie constanten
└── index.tsx           # Entry point
```

## Licentie

Dit project is privé en niet bedoeld voor openbare distributie.
