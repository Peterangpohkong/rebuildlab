// Minimal static server for local preview: node serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = Number(process.argv[2] || 4321);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.json':'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, () => console.log('rebuildlab → http://localhost:' + port));
