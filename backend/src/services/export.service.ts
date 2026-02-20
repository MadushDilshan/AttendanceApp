import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { IPaySheet } from '../models/PaySheet';

/**
 * Generate a PDF buffer for the given paysheet.
 */
export function generatePDF(paysheet: IPaySheet): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).text('Pay Sheet', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(
      `Period: ${paysheet.periodStart} — ${paysheet.periodEnd}`,
      { align: 'center' }
    );
    doc.moveDown(0.5);
    doc.fontSize(10).text(
      `Generated: ${paysheet.generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
      { align: 'center' }
    );
    doc.moveDown(1);

    // Table header
    const colX = [40, 120, 195, 250, 305, 360, 415, 470, 530];
    const headers = ['Employee', 'Date', 'In', 'Out', 'Reg Hrs', 'OT Hrs', 'Reg Pay', 'OT Pay', 'Total'];
    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 70, continued: i < headers.length - 1 }));
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    // Rows
    doc.font('Helvetica').fontSize(7);
    for (const entry of paysheet.entries) {
      if (entry.recordStatus === 'skipped_incomplete') continue;
      const row = [
        entry.employeeName.slice(0, 14),
        entry.date,
        entry.checkInAt.toISOString().slice(11, 16),
        entry.checkOutAt.toISOString().slice(11, 16),
        entry.regularHours.toFixed(1),
        (entry.overtimeHoursMorning + entry.overtimeHoursEvening).toFixed(1),
        `Rs ${entry.regularPay}`,
        `Rs ${entry.overtimePay.toFixed(0)}`,
        `Rs ${entry.totalPay.toFixed(0)}`,
      ];
      const y = doc.y;
      row.forEach((cell, i) => doc.text(cell, colX[i], y, { width: 65, continued: i < row.length - 1 }));
      doc.moveDown(0.3);
    }

    // Totals
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(
      `TOTAL PAYABLE: Rs ${paysheet.totals.totalPayable.toFixed(0)}` +
      `   (Regular: Rs ${paysheet.totals.totalRegularPay}   Overtime: Rs ${paysheet.totals.totalOvertimePay.toFixed(0)})` +
      `   Skipped days: ${paysheet.totals.skippedDays}`,
      40
    );

    doc.end();
  });
}

/**
 * Generate a CSV string for the given paysheet.
 */
export function generateCSV(paysheet: IPaySheet): string {
  const rows = paysheet.entries.map(e => ({
    Employee: e.employeeName,
    Date: e.date,
    CheckIn: e.checkInAt.toISOString(),
    CheckOut: e.checkOutAt.toISOString(),
    RegularHours: e.regularHours,
    OTMorningHours: e.overtimeHoursMorning,
    OTEveningHours: e.overtimeHoursEvening,
    RegularPay: e.regularPay,
    OTPay: e.overtimePay,
    TotalPay: e.totalPay,
    Status: e.recordStatus,
    ManuallyAdjusted: e.isManuallyAdjusted,
  }));

  const parser = new Parser();
  return parser.parse(rows);
}
