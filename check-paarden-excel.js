import XLSX from 'xlsx';

// Check alle Excel bestanden
const files = ['klanten (1).xlsx', 'Manegeklanten.xlsx', 'Pension Klanten bestand 2025.xlsx'];

for (const filename of files) {
  try {
    console.log(`\n=== Checking ${filename} ===`);
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    
    console.log('Headers:', data[0]);
    console.log('First row:', JSON.stringify(data[1], null, 2));
    console.log('Total rows:', data.length);
    
    // Check of er paarden kolommen zijn
    const headers = data[0] || [];
    const hasPaardenColumns = headers.some(h => 
      h && (h.toString().toLowerCase().includes('roepnaam') || 
           h.toString().toLowerCase().includes('paard') ||
           h.toString().toLowerCase().includes('naam'))
    );
    
    if (hasPaardenColumns) {
      console.log('✅ Dit lijkt een paarden bestand te zijn!');
    }
  } catch (e) {
    console.log(`❌ Kan ${filename} niet lezen:`, e.message);
  }
}

