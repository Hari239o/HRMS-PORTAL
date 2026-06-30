const fs = require('fs');
const logoPath = 'e:\\PROJECTS\\Attendance Geonixa\\client\\backend\\routes\\company-logo.jpeg';
const fontPath = 'e:\\PROJECTS\\Attendance Geonixa\\client\\backend\\routes\\fonts\\Roboto-Regular.ttf';
const fontBoldPath = 'e:\\PROJECTS\\Attendance Geonixa\\client\\backend\\routes\\fonts\\Roboto-Bold.ttf';
const logoB64 = fs.readFileSync(logoPath, 'base64');
const fontB64 = fs.readFileSync(fontPath, 'base64');
const fontBoldB64 = fs.readFileSync(fontBoldPath, 'base64');
const content = `module.exports = {
  companyLogo: '${logoB64}',
  robotoRegular: '${fontB64}',
  robotoBold: '${fontBoldB64}'
};`;
fs.writeFileSync('e:\\PROJECTS\\Attendance Geonixa\\client\\backend\\assets.js', content);
