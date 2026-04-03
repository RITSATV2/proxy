const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ ritsatv-proxy работает!');
});

// Прокси без /proxy в URL
app.use(async (req, res) => {
  if (req.path === '/') return;

  const targetUrl = `https://liveovh010.cda.pl${req.originalUrl}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://iptv-web.app/PL/DisneyChannel.pl/',
        'Origin': 'https://iptv-web.app',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.path.endsWith('.m3u8')) {
      let text = await response.text();
      const base = `https://${req.get('host')}`;

      text = text.replace(/^(?!#)(?!\s*$)(?!https?:\/\/)(.+)$/gm, m => base + (m.startsWith('/') ? '' : '/') + m);
      
      text = text.replace(/(URI\s*=\s*["'])([^"']+)(["'])/gi, (_, p1, p2, p3) => {
        return p2.startsWith('http') ? _ : `${p1}${base}/${p2}${p3}`;
      });

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(text);
    }

    // Для сегментов mp4
    res.set('Content-Type', response.headers.get('content-type') || 'video/mp4');
    response.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(502).send('Proxy Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy on port ${PORT}`));
