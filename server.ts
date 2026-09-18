import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.js';
import { authMiddleware, rateLimitMiddleware } from './server/middleware.js';
import { getDatabase } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));
  app.use(cookieParser());

  // Dynamic SEO sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const db = getDatabase();
    const host = req.get('host') || 'mercadox.es';
    const proto = req.secure ? 'https' : 'http';
    const baseUrl = `${proto}://${host}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/comprar</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/regala</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/como-funciona</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/seguridad</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

    // Categories
    for (const cat of db.categories.filter(c => c.isActive)) {
      xml += `
  <url>
    <loc>${baseUrl}/categoria/${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Active products
    for (const prod of db.products.filter(p => p.status === 'active').slice(0, 500)) {
      xml += `
  <url>
    <loc>${baseUrl}/producto/${prod.id}</loc>
    <lastmod>${new Date(prod.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += `\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  // Dynamic SEO robots.txt
  app.get('/robots.txt', (req, res) => {
    const host = req.get('host') || 'mercadox.es';
    const proto = req.secure ? 'https' : 'http';
    const robots = `User-agent: *
Disallow: /admin
Disallow: /perfil
Disallow: /mensajes
Disallow: /favoritos
Disallow: /checkout
Disallow: /api/

Sitemap: ${proto}://${host}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(robots);
  });

  // Mount API router
  app.use('/api', rateLimitMiddleware, authMiddleware, apiRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MercadoX Server successfully listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start MercadoX server:', err);
});
