'use strict';

const http = require('node:http');

const server = http.createServer((request, response) => {
  let requestUrl;
  try {
    requestUrl = new URL(request.url || '/', 'http://localhost');
  } catch {
    response.writeHead(400, { 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  if (requestUrl.pathname !== '/lamp') {
    response.writeHead(404, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Not found');
    return;
  }

  response.writeHead(308, {
    'Cache-Control': 'no-store',
    Location: `/lamp/${requestUrl.search}`,
    'Content-Length': '0',
  });
  response.end();
});

server.listen(Number(process.env.PORT) || 9000, '0.0.0.0', () => {
  console.log('lampSlashRedirect listening on port 9000');
});
