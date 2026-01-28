async function testLogin() {
  try {
    console.log('🔍 Probando login...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@futbolmarket.com',
        password: 'Admin123456'
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);

    const data = await response.json();
    console.log('📦 Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Login exitoso!');
      console.log('🔑 Token:', data.token);
      console.log('👤 Usuario:', data.user);
    } else {
      console.log('❌ Login falló:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
