// netlify/functions/upload.js
// POST /api/upload — simpan data saham ke Firestore (butuh UPLOAD_SECRET)

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-upload-secret',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const secret = event.headers['x-upload-secret'] || '';
  if (!secret || secret !== process.env.UPLOAD_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized: secret key salah' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body bukan JSON valid' }) };
  }

  const { stocks, statTV, statHalal, statXTB } = body;
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Field stocks kosong atau bukan array' }) };
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const apiKey    = process.env.FIREBASE_API_KEY;

    const firestoreStocks = {
      arrayValue: {
        values: stocks.map(s => ({
          mapValue: {
            fields: {
              ticker: { stringValue: String(s.ticker || '') },
              name:   { stringValue: String(s.name   || '') },
              rating: { stringValue: String(s.rating || '') },
              score:  { integerValue: String(Number(s.score) || 0) },
              price:  { doubleValue:  Number(s.price)  || 0 },
              signal: { stringValue: String(s.signal || '') },
              sector: { stringValue: String(s.sector || '') },
            }
          }
        }))
      }
    };

    const doc = {
      fields: {
        stocks:    firestoreStocks,
        updatedAt: { stringValue: new Date().toISOString() },
        count:     { integerValue: String(stocks.length) },
        statTV:    { integerValue: String(statTV    || 0) },
        statHalal: { integerValue: String(statHalal || 0) },
        statXTB:   { integerValue: String(statXTB   || 0) },
      }
    };

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/stocks/latest?key=${apiKey}`;
    const res = await fetch(url, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(doc),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore error ${res.status}: ${err}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, count: stocks.length, updatedAt: new Date().toISOString() }),
    };

  } catch (err) {
    console.error('POST /api/upload error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
