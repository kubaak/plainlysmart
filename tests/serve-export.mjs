import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

// Test the exported files, without a Next.js server or an SPA fallback.
const root = resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
};
createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const path = resolve(root, "." + pathname);
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  for (const candidate of [path, path + ".html", resolve(path, "index.html")]) {
    try {
      if (!(await stat(candidate)).isFile()) continue;
      response.writeHead(200, { "Content-Type": types[extname(candidate)] ?? "application/octet-stream" });
      response.end(await readFile(candidate));
      return;
    } catch {
      /* Try the next static file form. */
    }
  }
  response.writeHead(404, { "Content-Type": "text/html" });
  response.end(await readFile(resolve(root, "404.html")));
}).listen(4173, "127.0.0.1");
