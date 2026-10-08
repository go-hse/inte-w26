async function kommuniziereMitAPI() {
  try {
    // 1. Client sendet einen Request mit spezifischen Headern an den Server
    const response = await fetch('https://api.ihre-domain.de/ressource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',          // Teilt dem Server das Format des Bodys mit
        'Accept': 'application/json',                // Sagt dem Server, welches Format der Client erwartet
        'Authorization': 'Bearer IHR_ZUGANGS_TOKEN', // Authentifizierung
        'X-Custom-Client': 'Frontend-App-v1.0'       // Proprietärer Header
      },
      body: JSON.stringify({ suchbegriff: 'Beispiel' })
    });

    // 2. Client liest die Response-Header des Servers aus
    const contentType = response.headers.get('Content-Type');
    const apiVersion = response.headers.get('X-Custom-API-Version');

    console.log(`Empfangener Datentyp: ${contentType}`);
    console.log(`Server API-Version: ${apiVersion}`);

    // Alternativ: Alle empfangenen Header in einer Schleife auslesen
    for (const [name, wert] of response.headers.entries()) {
      console.log(`${name}: ${wert}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    const daten = await response.json();
    return daten;

  } catch (error) {
    console.error('Fehler bei der API-Anfrage:', error);
  }
}