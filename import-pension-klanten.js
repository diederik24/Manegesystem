import XLSX from 'xlsx';
import fs from 'fs';

// Lees Excel bestand
const workbook = XLSX.readFile('Pension Klanten bestand 2025.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converteer naar JSON (eerste rij is header, maar we gebruiken indexen)
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// Parse de data (skip eerste 2 rijen: titel en header)
const klanten = [];
for (let i = 2; i < data.length; i++) {
  const row = data[i];
  
  // Skip lege rijen
  if (!row || !row[0]) continue;
  
  const voornaam = row[0]?.toString().trim() || '';
  const achternaam = row[2]?.toString().trim() || '';
  const adres = row[4]?.toString().trim() || '';
  const postcode = row[7]?.toString().trim() || '';
  const plaats = row[9]?.toString().trim() || '';
  let telefoon = row[11];
  const email = row[13]?.toString().trim() || '';
  const paard = row[17]?.toString().trim() || '';
  
  // Normaliseer telefoonnummer
  if (telefoon) {
    telefoon = telefoon.toString().replace(/\s+/g, '').replace(/-/g, '');
    if (!telefoon.startsWith('0') && !telefoon.startsWith('+')) {
      telefoon = '0' + telefoon;
    }
  }
  
  // Alleen toevoegen als er minimaal een naam is
  if (voornaam || achternaam) {
    klanten.push({
      voornaam,
      achternaam,
      naam: `${voornaam} ${achternaam}`.trim(),
      adres,
      postcode,
      plaats,
      telefoon: telefoon || null,
      email: email || null,
      paard: paard || null,
      klantType: 'Pension',
      status: 'Actief',
      balance: 0
    });
  }
}

// Export naar JSON voor verificatie
fs.writeFileSync('pension-klanten-parsed.json', JSON.stringify(klanten, null, 2));

console.log(`✅ ${klanten.length} pension klanten gevonden en geparsed`);
console.log('\nEerste 5 klanten:');
console.log(JSON.stringify(klanten.slice(0, 5), null, 2));

// Genereer SQL insert statements
const sqlStatements = [];
klanten.forEach((klant, index) => {
  const id = `pension-${index + 1}`;
  sqlStatements.push(
    `INSERT INTO members (id, name, email, phone, status, balance, klant_type, adres, postcode, plaats, created_at) VALUES ` +
    `('${id}', '${klant.naam.replace(/'/g, "''")}', ${klant.email ? `'${klant.email.replace(/'/g, "''")}'` : 'NULL'}, ${klant.telefoon ? `'${klant.telefoon}'` : 'NULL'}, 'Actief', 0, 'Pension', ${klant.adres ? `'${klant.adres.replace(/'/g, "''")}'` : 'NULL'}, ${klant.postcode ? `'${klant.postcode}'` : 'NULL'}, ${klant.plaats ? `'${klant.plaats.replace(/'/g, "''")}'` : 'NULL'}, NOW());`
  );
});

// Genereer SQL voor paarden (als die gekoppeld moeten worden)
const paardenSQL = [];
klanten.forEach((klant, index) => {
  if (klant.paard) {
    const paardNamen = klant.paard.split('/').map(p => p.trim()).filter(p => p);
    paardNamen.forEach((paardNaam, pIndex) => {
      const paardId = `pension-paard-${index + 1}-${pIndex + 1}`;
      paardenSQL.push(
        `INSERT INTO horses (id, name, breed, birth_date, available, type, owner_id, created_at) VALUES ` +
        `('${paardId}', '${paardNaam.replace(/'/g, "''")}', 'Onbekend', NULL, true, 'Pension', 'pension-${index + 1}', NOW());`
      );
    });
  }
});

fs.writeFileSync('import-pension-klanten.sql', sqlStatements.join('\n') + '\n\n-- Paarden\n' + paardenSQL.join('\n'));

console.log(`\n✅ SQL bestand gegenereerd: import-pension-klanten.sql`);
console.log(`   - ${sqlStatements.length} INSERT statements voor klanten`);
console.log(`   - ${paardenSQL.length} INSERT statements voor paarden`);

