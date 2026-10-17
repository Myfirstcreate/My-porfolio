// Tiny zero-dependency static server for the AK Garage site.
// Serves the project root with correct MIME types so <script src> files load.
// Run: node server.js [port]   (default 8000)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8000;

// Mirrors the "redirects" rules in vercel.json so local dev behaves the same
// as production: renamed pages keep working through a real 301.
const REDIRECTS = {
	'/bosscarsuaq.html': '/vvipboss.html',
	'/bosscarsuaq': '/vvipboss.html'
};

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain; charset=utf-8',
	'.md': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
	try {
		const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
		// The query string is part of req.url and browsers carry the fragment over
		// themselves, so only the path needs to be rewritten here.
		const redirectPath = REDIRECTS[urlPath] || REDIRECTS[urlPath.replace(/\/+$/, '')];
		if (redirectPath) {
			const queryIndex = req.url.indexOf('?');
			const query = queryIndex === -1 ? '' : req.url.slice(queryIndex);
			res.writeHead(301, { 'Location': redirectPath + query, 'Content-Type': 'text/plain' }).end(`Moved Permanently: ${redirectPath}${query}`);
			return;
		}
		let filePath = path.normalize(path.join(ROOT, urlPath));
		const relativePath = path.relative(ROOT, filePath);
		if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
			res.writeHead(403).end('Forbidden');
			return;
		}
		let stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
		if (stat && stat.isDirectory()) {
			filePath = path.join(filePath, 'index.html');
			stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
		}
		if (!stat || !stat.isFile()) {
			res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
			return;
		}
		res.writeHead(200, {
			'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
			'Cache-Control': 'no-store'
		});
		fs.createReadStream(filePath).pipe(res);
	} catch (error) {
		res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Server error');
	}
});

server.listen(PORT, '127.0.0.1', () => {
	console.log(`AK Garage static server running at http://127.0.0.1:${PORT}/`);
});
