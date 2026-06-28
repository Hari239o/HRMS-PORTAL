fetch('https://hrms-portal-one.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({email: 'harikishorereddy9908@gmail.com', password: 'Hari@9908'})
}).then(r => r.text()).then(console.log).catch(console.error);
