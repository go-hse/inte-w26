app.get('/api/ressource', (req, res) => {
  // 1. Auslesen von Request-Headern (die der Client gesendet hat)
  const authHeader = req.get('Authorization');
  const userAgent = req.get('User-Agent');

  // 2. Setzen von Response-Headern (die an den Client zurückgehen)
  res.set({
    'Content-Type': 'application/json',
    'X-Custom-API-Version': 'v2.4.1',          // Proprietäre Metadaten (starten historisch oft mit X-)
    'Access-Control-Allow-Origin': 'https://ihre-domain.de', // Steuert Cross-Origin Requests (CORS)
    'Cache-Control': 'no-store'                // Verhindert jegliches Caching
  });

  res.json({ status: 'Daten erfolgreich bereitgestellt' });
});