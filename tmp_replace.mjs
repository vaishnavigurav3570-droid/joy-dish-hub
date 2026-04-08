import fs from 'fs';
const lines = fs.readFileSync('src/components/OwnerSection.tsx', 'utf8').split('\n');

const newLines = lines.filter(l => !l.includes('import html2canvas') && !l.includes('import jsPDF from \'jspdf\''));
const idx = newLines.findIndex(l => l.includes('import { startOfDay, isToday, format, startOfMonth, endOfMonth, subMonths } from \'date-fns\';'));
if (idx !== -1) {
  newLines.splice(idx, 0, 'import { exportPDFReport, exportCSV, exportArchivePDF } from "@/lib/exportUtils";');
}

for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('const canvas = await html2canvas(reportRef.current')) {
    newLines.splice(i, 8, '      await exportPDFReport(reportRef);', '      toast.success(\'PDF report downloaded!\');');
    break;
  }
}

for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('const headers = [\'Name\', \'Phone Number\', \'Order ID\', \'Amount\', \'Date\'];')) {
    let j = i;
    while (!newLines[j].includes('URL.revokeObjectURL(url);')) j++;
    newLines.splice(i, j - i + 1, '      exportCSV(archiveOrders, archiveLabel);');
    break;
  }
}

for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('const totalRev = archiveOrders.filter')) {
    let j = i;
    while (!newLines[j].includes('pdf.save(`CurryCorner_Summary_${archiveLabel.replace(\' \', \'_\')}.pdf`);')) j++;
    newLines.splice(i, j - i + 1, '      exportArchivePDF(archiveOrders, archiveLabel);');
    break;
  }
}

fs.writeFileSync('src/components/OwnerSection.tsx', newLines.join('\n'));
console.log('Success');
