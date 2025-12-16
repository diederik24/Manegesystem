import XLSX from 'xlsx';

const workbook = XLSX.readFile('Manege Paarden.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Lees ruwe data zonder header mapping
const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
console.log('Range:', worksheet['!ref']);
console.log('Max row:', range.e.r);
console.log('Max col:', range.e.c);

// Lees eerste paar rijen als array
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

console.log('\nFirst row (headers?):', data[0]);
console.log('\nFirst 5 rows:');
for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`Row ${i}:`, data[i]);
}

// Check of er meer kolommen zijn door alle cellen te bekijken
console.log('\nChecking cell references...');
const cellRefs = Object.keys(worksheet).filter(k => k.startsWith('A') || k.startsWith('B') || k.startsWith('C') || k.startsWith('D'));
console.log('Sample cell refs:', cellRefs.slice(0, 10));

