exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const apiKey    = process.env.FIREBASE_API_KEY;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/stocks/latest?key=${apiKey}`;
    const res  = await fetch(url);

    if (res.status === 404)
      return { statusCode: 200, headers, body: JSON.stringify({ stocks:[], updatedAt:null, statTV:0, statHalal:0, statXTB:0 }) };
    if (!res.ok) { const err = await res.text(); throw new Error(`Firestore error ${res.status}: ${err}`); }

    const doc = await res.json();
    const raw = doc.fields;

    const stocks = (raw.stocks?.arrayValue?.values || []).map(v => {
      const f = v.mapValue.fields;
      // chg: bisa doubleValue atau nullValue
      let chg = null;
      if (f.chg?.doubleValue !== undefined) chg = Number(f.chg.doubleValue);
      else if (f.chg?.integerValue !== undefined) chg = Number(f.chg.integerValue);

      return {
        ticker: f.ticker?.stringValue || '',
        name:   f.name?.stringValue   || '',
        rating: f.rating?.stringValue || '',
        score:  Number(f.score?.integerValue || f.score?.doubleValue || 0),
        price:  Number(f.price?.doubleValue  || f.price?.integerValue || 0),
        mcap:   Number(f.mcap?.doubleValue   || f.mcap?.integerValue  || 0),
        signal: f.signal?.stringValue || '',
        sector: f.sector?.stringValue || '',
        chg,
        tvUrl:  f.tvUrl?.stringValue  || '',
        muUrl:  f.muUrl?.stringValue  || '',
        inXTB:  f.inXTB?.booleanValue !== false,
      };
    });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        stocks,
        updatedAt:  raw.updatedAt?.stringValue  || null,
        statTV:     Number(raw.statTV?.integerValue    || 0),
        statHalal:  Number(raw.statHalal?.integerValue || 0),
        statXTB:    Number(raw.statXTB?.integerValue   || 0),
      }),
    };
  } catch (err) {
    console.error('GET /api/data error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
