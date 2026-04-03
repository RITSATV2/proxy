const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ ritsatv-proxy v2 (anti-403)');
});

app.use(async (req, res) => {
  const targetUrl = `https://liveovh010.cda.pl${req.originalUrl}`;

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
  ];

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': 'https://iptv-web.app/PL/DisneyChannel.pl/',
        'Origin': 'https://iptv-web.app',
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'application/vnd.apple.mpegurl, */*',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Dest': 'empty',
        'Connection': 'keep-alive'
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.path.endsWith('.m3u8')) {
      let text = await response.text();
      const base = `https://${req.get('host')}`;

      text = text.replace(/^(?!#)(?!\s*$)(?!https?:\/\/)(.+)$/gm, m => 
        base + (m.startsWith('/') ? '' : '/') + m
      );
      
      text = text.replace(/(URI\s*=\s*["'])([^"']+)(["'])/gi, (_, p1, p2, p3) => {
        return p2.startsWith('http') ? _ : `${p1}${base}/${p2}${p3}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(text);
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
    response.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(502).send('Proxy Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy v2 running`));
