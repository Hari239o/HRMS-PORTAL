const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'test' }),
  puppeteer: {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', 
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('QR received!');
  process.exit(0);
});

client.on('ready', () => {
  console.log('Client is ready!');
  process.exit(0);
});

client.initialize().catch(err => {
  console.error('INIT ERROR:', err);
  process.exit(1);
});
