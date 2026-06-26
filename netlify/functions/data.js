// netlify/functions/data.js
// GET /api/data — ambil data saham dari Firestore

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const apiKey    = process.env.FIREBASE_API_KEY;

    // Ambil dokumen "stocks/latest" dari Firestore REST API
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/stocks/latest?key=${apiKey}`;
    const res  = await fetch(url);

    if (res.status === 404) {
      return { statusCode: 200, headers, body: JSON.stringify({ stocks: [], updatedAt: null }) };
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore error ${res.status}: ${err}`);
    }

    const doc  = await res.json();
    const raw  = doc.fields;

    // Firestore menyimpan array sebagai arrayValue
    const stocks    = (raw.stocks?.arrayValue?.values || []).map(v => {
      const f = v.mapValue.fields;
      return {
        ticker: f.ticker?.stringValue || '',
        name:   f.name?.stringValue   || '',
        rating: f.rating?.stringValue || '',
        score:  Number(f.score?.integerValue || f.score?.doubleValue || 0),
        price:  Number(f.price?.doubleValue  || f.price?.integerValue || 0),
        signal: f.signal?.stringValue || '',
        sector: f.sector?.stringValue || '',
      };
    });
    const updatedAt = raw.updatedAt?.stringValue || null;

    return { statusCode: 200, headers, body: JSON.stringify({ stocks, updatedAt }) };

  } catch (err) {
    console.error('GET /api/data error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
