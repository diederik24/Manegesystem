import XLSX from 'xlsx';

const workbook = XLSX.readFile('Manege Paarden.xlsx');
console.log('Sheet names:', workbook.SheetNames);
console.log('Total sheets:', workbook.SheetNames.length);

workbook.SheetNames.forEach((sheetName, index) => {
  console.log(`\n=== Sheet ${index + 1}: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
  console.log('Headers:', data[0]);
  console.log('Total rows:', data.length);
  if (data.length > 1) {
    console.log('First data row:', JSON.stringify(data[1], null, 2));
  }
});

