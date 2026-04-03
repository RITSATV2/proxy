const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ ritsatv-proxy работает!');
});

// Прокси для всего
app.use(async (req, res) => {
  const targetUrl = `https://liveovh010.cda.pl${req.originalUrl}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://iptv-web.app/PL/DisneyChannel.pl/',
        'Origin': 'https://iptv-web.app',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
      }
    });

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.path.endsWith('.m3u8')) {
      let text = await response.text();
      const baseUrl = `https://${req.get('host')}`;

      // Переписываем все относительные ссылки
      text = text.replace(/^(?!#)(?!\s*$)(?!https?:\/\/)(.+)$/gm, (match) => {
        return baseUrl + (match.startsWith('/') ? '' : '/') + match;
      });

      // Переписываем URI= в #EXT-X-MEDIA
      text = text.replace(/(URI\s*=\s*["'])([^"']+)(["'])/gi, (_, p1, p2, p3) => {
        if (!p2.startsWith('http')) {
          return `${p1}${baseUrl}/${p2}${p3}`;
        }
        return _;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(text);
    }

    // Для .mp4 сегментов
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    return response.body.pipe(res);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).send('Proxy Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
