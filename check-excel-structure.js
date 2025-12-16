import XLSX from 'xlsx';

const workbook = XLSX.readFile('Manegeklanten.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('Headers:', data[0]);
console.log('\nFirst row data:');
console.log(JSON.stringify(data[1], null, 2));
console.log('\nSecond row data:');
console.log(JSON.stringify(data[2], null, 2));
console.log('\nTotal columns:', data[0]?.length);
console.log('Total rows:', data.length);

