import XLSX from 'xlsx';

const workbook = XLSX.readFile('Manege Paarden.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('Headers:', data[0]);
console.log('\nFirst 3 rows:');
for (let i = 1; i <= 3 && i < data.length; i++) {
  console.log(`Row ${i}:`, JSON.stringify(data[i], null, 2));
}
console.log('\nTotal rows:', data.length);

