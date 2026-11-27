import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('./dist', import.meta.url));
const port = Number(process.env.CAMPUSSHARE_PORT ?? 4173);
const mimetypes = { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(directory, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(directory + sep)) {
      response.writeHead(404).end('File unavailable');
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': mimetypes[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(contents);
  } catch {
    response.writeHead(404).end('File unavailable');
  }
}).listen(port, '127.0.0.1', function () {
  console.log(`CampusShare is available at http://127.0.0.1:${this.address().port}`);
});
