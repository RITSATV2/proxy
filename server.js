const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ ritsatv-proxy на Render работает!');
});

// Главный прокси
app.use('/proxy', async (req, res) => {
  const originalUrl = req.url.replace('/proxy', ''); // убираем /proxy
  
  try {
    const targetUrl = `https://liveovh010.cda.pl${originalUrl}`;
    
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://iptv-web.app/PL/DisneyChannel.pl/',
        'Origin': 'https://iptv-web.app',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Копируем заголовки
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (originalUrl.endsWith('.m3u8')) {
      let text = await response.text();
      const myDomain = `https://${req.get('host')}/proxy`;

      // Переписываем ссылки
      text = text.replace(/^(?!#)(?!\s*$)(?!https?:\/\/)(.+)$/gm, m => {
        return myDomain + (m.startsWith('/') ? '' : '/') + m;
      });
      
      text = text.replace(/(URI\s*=\s*["'])([^"']+)(["'])/gi, (_, p1, p2, p3) => {
        return p2.startsWith('http') ? _ : `${p1}${myDomain}/${p2}${p3}`;
      });

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(text);
    }

    // Для .mp4 сегментов просто проксируем
    res.set('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
