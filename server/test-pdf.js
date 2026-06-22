const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
let HummusRecipe = null;
try { HummusRecipe = require('hummus-recipe'); } catch (e) { /* optional */ }

(async () => {
  try {
    const tempDir = path.join(__dirname, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });

    const filePath = path.join(tempDir, 'test-payslip.pdf');
    const writeStream = fs.createWriteStream(filePath);
    const doc = new PDFDocument({ margin: 50 });

    writeStream.on('finish', async () => {
      console.log('Generated PDF at', filePath);
      if (process.env.PDF_PROTECT === 'true') {
        if (!HummusRecipe) {
          console.error('hummus-recipe is not installed; skipping protection');
          return;
        }
        const outPath = path.join(tempDir, 'test-payslip-protected.pdf');
        try {
          const userPwd = process.env.PDF_USER_PASSWORD || '';
          const ownerPwd = process.env.PDF_OWNER_PASSWORD || userPwd || 'owner';
          const pdfDoc = new HummusRecipe(filePath, outPath);
          pdfDoc.encrypt({ userPassword: userPwd, ownerPassword: ownerPwd, userProtectionFlag: 4 });
          pdfDoc.endPDF();
          console.log('Protected PDF at', outPath);
        } catch (err) {
          console.error('Failed to protect PDF:', err);
        }
      } else {
        console.log('PDF protection disabled (PDF_PROTECT != true)');
      }
    });

    doc.pipe(writeStream);
    doc.font('Helvetica-Bold').fontSize(20).text('GEONIXA - Test Payslip', { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(12).text('Employee: Test User');
    doc.text('Designation: Test Role');
    doc.text('Date of Joining: 01/01/2020');
    doc.text('No. of Working Days: 30');
    doc.text('No. of Absent Days: 2');
    doc.text('Salary: ₹100000.00');
    doc.end();
  } catch (err) {
    console.error('Test PDF script failed:', err);
  }
})();
