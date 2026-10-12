const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate payment receipt PDF
const generateReceipt = (payments, tenant, unit, infrastructure, allLedgers, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const firstPayment = payments[0];
      const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalOutstanding = allLedgers.reduce((sum, l) => sum + parseFloat(l.balance), 0);

      // ============ HEADER ============
      // Draw blue rectangle
      doc.rect(0, 0, 612, 100).fill('#1e40af');

      // Draw white text (no align option — manual positioning)
      doc.fillColor('#ffffff');
      doc.fontSize(28).font('Helvetica-Bold');
      doc.text('RENT MANAGER', 50, 30);

      doc.fontSize(11).font('Helvetica');
      doc.text('Property Management System', 50, 65);

      doc.fontSize(18).font('Helvetica-Bold');
      doc.text('PAYMENT RECEIPT', 320, 40);

      // ============ RECEIPT INFO ============
      doc.fillColor('#000000').fontSize(11).font('Helvetica');

      const receiptNumber = firstPayment.id.slice(0, 8).toUpperCase();
      const receiptDate = new Date(firstPayment.created_at || Date.now()).toLocaleDateString('en-GB');

      doc.text(`Receipt No: ${receiptNumber}`, 50, 130);
      doc.text(`Date: ${receiptDate}`, 400, 130);

      doc.moveTo(50, 155).lineTo(562, 155).strokeColor('#e5e7eb').stroke();

      // ============ TENANT INFO ============
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('BILL TO:', 50, 175);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');
      doc.text(`${tenant.first_name} ${tenant.last_name}`, 50, 195);
      doc.text(`Email: ${tenant.email}`, 50, 212);
      doc.text(`Phone: ${tenant.phone}`, 50, 229);
      doc.text(`National ID: ${tenant.national_id}`, 50, 246);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af').text('PROPERTY:', 320, 175);
      doc.fontSize(11).font('Helvetica').fillColor('#000000');
      doc.text(`${infrastructure?.name || 'N/A'}`, 320, 195);
      doc.text(`${infrastructure?.address || ''}`, 320, 212, { width: 240 });
      doc.text(`${infrastructure?.city || ''}, ${infrastructure?.district || ''}`, 320, 246);
      doc.text(`Unit: ${unit?.unit_number || 'N/A'} (Floor ${unit?.floor || '-'})`, 320, 263);

      doc.moveTo(50, 290).lineTo(562, 290).strokeColor('#e5e7eb').stroke();

      // ============ PAYMENT BREAKDOWN (FIFO) ============
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
        .text('PAYMENT APPLIED (FIFO — oldest balance first)', 50, 305);

      const tableTop = 330;
      doc.rect(50, tableTop, 512, 25).fill('#f3f4f6');

      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
      doc.text('Month / Period', 60, tableTop + 8);
      doc.text('Rent Due (RWF)', 230, tableTop + 8);
      doc.text('Paid (RWF)', 340, tableTop + 8);
      doc.text('Balance (RWF)', 440, tableTop + 8);

      doc.font('Helvetica').fontSize(10);
      let rowTop = tableTop + 35;

      payments.forEach((p) => {
        const monthName = new Date(p.ledger.period_start).toLocaleDateString('en-GB', {
          month: 'long', year: 'numeric'
        });
        const amountDue = parseFloat(p.ledger.amount_due).toLocaleString();
        const amountPaid = parseFloat(p.amount).toLocaleString();
        const balance = parseFloat(p.ledger.balance).toLocaleString();

        doc.fillColor('#000000');
        doc.text(monthName, 60, rowTop);
        doc.text(amountDue, 230, rowTop);
        doc.fillColor('#16a34a').text(amountPaid, 340, rowTop);
        doc.fillColor('#000000').text(balance, 440, rowTop);

        rowTop += 22;
      });

      // ============ OUTSTANDING DUES ============
      const outstanding = allLedgers.filter(l => parseFloat(l.balance) > 0);

      if (outstanding.length > 0) {
        rowTop += 15;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626')
          .text('OUTSTANDING DUES (Still Unpaid)', 50, rowTop);
        rowTop += 20;

        doc.rect(50, rowTop, 512, 25).fill('#fef2f2');
        doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
        doc.text('Month / Period', 60, rowTop + 8);
        doc.text('Rent Due (RWF)', 230, rowTop + 8);
        doc.text('Balance Due (RWF)', 340, rowTop + 8);
        rowTop += 30;

        doc.font('Helvetica').fontSize(10);
        outstanding.forEach((l) => {
          const monthName = new Date(l.period_start).toLocaleDateString('en-GB', {
            month: 'long', year: 'numeric'
          });
          doc.fillColor('#000000').text(monthName, 60, rowTop);
          doc.text(parseFloat(l.amount_due).toLocaleString(), 230, rowTop);
          doc.fillColor('#dc2626').text(parseFloat(l.balance).toLocaleString(), 340, rowTop);
          doc.fillColor('#000000');
          rowTop += 20;
        });
      }

      doc.moveTo(50, rowTop + 5).lineTo(562, rowTop + 5).strokeColor('#e5e7eb').stroke();

      // ============ SUMMARY ============
      const summaryTop = rowTop + 25;

      doc.rect(340, summaryTop, 222, 80).fill('#f0fdf4');
      doc.rect(340, summaryTop, 222, 80).stroke('#16a34a');

      doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL PAID:', 355, summaryTop + 12);

      doc.fontSize(16).fillColor('#16a34a');
      doc.text(`${totalAmount.toLocaleString()} RWF`, 355, summaryTop + 32);

      doc.fontSize(9).fillColor('#000000').font('Helvetica');
      doc.text(`Total Outstanding: ${totalOutstanding.toLocaleString()} RWF`, 355, summaryTop + 58);

      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text('Payment Method:', 60, summaryTop + 10);
      doc.font('Helvetica-Bold').text(
        firstPayment.payment_method.replace('_', ' ').toUpperCase(), 160, summaryTop + 10
      );

      doc.font('Helvetica').text('Reference:', 60, summaryTop + 30);
      doc.font('Helvetica-Bold').text(firstPayment.reference || 'N/A', 160, summaryTop + 30);

      doc.font('Helvetica').text('Status:', 60, summaryTop + 50);
      doc.font('Helvetica-Bold').fillColor('#16a34a').text(
        firstPayment.status.toUpperCase(), 160, summaryTop + 50
      );
      doc.fillColor('#000000');

      // ============ FOOTER (Page 1) ============
      const footerY = 780;
      doc.moveTo(50, footerY).lineTo(562, footerY).strokeColor('#e5e7eb').stroke();

      doc.fontSize(9).fillColor('#6b7280').font('Helvetica');
      doc.text('Thank you for your payment!', 50, footerY + 10, { align: 'center', width: 512 });
      doc.text('This is a computer-generated receipt. No signature required.', 50, footerY + 25, { align: 'center', width: 512 });
      doc.text('Rent Manager | Rwanda | support@rentmanager.rw', 50, footerY + 40, { align: 'center', width: 512 });

      // ============ PAGE 2: PAYMENT PROOF ============
      const allProofs = payments.filter(p => p.proof_file && fs.existsSync(p.proof_file));

      if (allProofs.length > 0) {
        doc.addPage();

        // Header on proof page
        doc.rect(0, 0, 612, 60).fill('#1e40af');
        doc.fillColor('#ffffff');
        doc.fontSize(18).font('Helvetica-Bold');
        doc.text('PAYMENT PROOF', 50, 20);

        doc.fillColor('#000000').fontSize(10).font('Helvetica');
        doc.text(`Receipt: ${receiptNumber}`, 50, 80);

        let proofTop = 110;

        for (let i = 0; i < allProofs.length; i++) {
          const p = allProofs[i];

          // Page break if not enough space
          if (proofTop > 550) {
            doc.addPage();
            proofTop = 50;
          }

          const monthLabel = p.ledger
            ? new Date(p.ledger.period_start).toLocaleDateString('en-GB', {
                month: 'long', year: 'numeric'
              })
            : `Proof ${i + 1}`;

          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
          doc.text(`${monthLabel} — ${parseFloat(p.amount).toLocaleString()} RWF`, 50, proofTop);

          proofTop += 25;

          if (p.proof_type && p.proof_type.startsWith('image/')) {
            try {
              doc.image(p.proof_file, 50, proofTop, {
                fit: [450, 400],
                align: 'left'
              });
              proofTop += 420;
            } catch (e) {
              doc.fontSize(9).fillColor('#dc2626');
              doc.text('(Image could not be embedded)', 50, proofTop);
              proofTop += 25;
            }
          } else {
            doc.fontSize(10).font('Helvetica').fillColor('#000000');
            doc.text(`Attached: ${path.basename(p.proof_file)}`, 50, proofTop);
            proofTop += 25;
          }

          proofTop += 20;
        }

        // Footer on proof page
        doc.moveTo(50, footerY).lineTo(562, footerY).strokeColor('#e5e7eb').stroke();
        doc.fontSize(9).fillColor('#6b7280').font('Helvetica');
        doc.text('Rent Manager | Rwanda | support@rentmanager.rw', 50, footerY + 10, {
          align: 'center',
          width: 512
        });
      }

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceipt };