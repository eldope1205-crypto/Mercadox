import fs from 'fs';
import path from 'path';
import { 
  User, Category, Product, GiftRequest, Order, 
  Conversation, ChatMessage, Rating, Dispute, Report, 
  AuditLog, AdminSettings, PayoutRequest, AdminAlert, ProApplication 
} from '../src/types.js';
import { hashPassword, getAuthorizedAdminEmail, isAuthorizedAdmin } from './security.js';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  sessions: { token: string; userId: string; createdAt: string; expiresAt: string; ip: string; userAgent: string }[];
  categories: Category[];
  products: Product[];
  giftRequests: GiftRequest[];
  orders: Order[];
  payouts: PayoutRequest[];
  conversations: Conversation[];
  messages: ChatMessage[];
  ratings: Rating[];
  disputes: Dispute[];
  reports: Report[];
  favorites: { userId: string; productId: string; createdAt: string }[];
  auditLogs: AuditLog[];
  alerts: AdminAlert[];
  proApplications: ProApplication[];
  settings: AdminSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mercadox-db.json');

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', slug: 'electronica', name: 'Electrónica', iconName: 'Tv', description: 'Televisores, audio, gadgets y tecnología doméstica', orderIndex: 1, isActive: true, seoMetaTitle: 'Comprar Electrónica de Segunda Mano - MercadoX', seoMetaDescription: 'Encuentra electrónica verificada y garantizada entre particulares en España.' },
  { id: 'cat-2', slug: 'moviles', name: 'Móviles', iconName: 'Smartphone', description: 'Smartphones, accesorios y telefonía libre', orderIndex: 2, isActive: true, seoMetaTitle: 'Móviles Libres y Accesorios de Ocasión - MercadoX', seoMetaDescription: 'Smartphones verificados con protección al comprador.' },
  { id: 'cat-3', slug: 'informatica', name: 'Informática', iconName: 'Laptop', description: 'Portátiles, ordenadores de sobremesa y componentes', orderIndex: 3, isActive: true, seoMetaTitle: 'Portátiles y Componentes Informáticos - MercadoX', seoMetaDescription: 'Ordenadores y tecnología de ocasión segura en España.' },
  { id: 'cat-4', slug: 'videojuegos', name: 'Videojuegos', iconName: 'Gamepad2', description: 'Juegos físicos, retro y ediciones coleccionista', orderIndex: 4, isActive: true },
  { id: 'cat-5', slug: 'consolas', name: 'Consolas', iconName: 'Cpu', description: 'PlayStation, Xbox, Nintendo y plataformas retro', orderIndex: 5, isActive: true },
  { id: 'cat-6', slug: 'ropa', name: 'Ropa', iconName: 'Shirt', description: 'Moda mujer, hombre y prendas de temporada', orderIndex: 6, isActive: true },
  { id: 'cat-7', slug: 'calzado', name: 'Calzado', iconName: 'Footprints', description: 'Zapatillas, zapatos y botas', orderIndex: 7, isActive: true },
  { id: 'cat-8', slug: 'hogar', name: 'Hogar', iconName: 'Home', description: 'Decoración, menaje, iluminación y climatización', orderIndex: 8, isActive: true },
  { id: 'cat-9', slug: 'muebles', name: 'Muebles', iconName: 'Armchair', description: 'Mesas, sofás, armarios y estanterías', orderIndex: 9, isActive: true },
  { id: 'cat-10', slug: 'deportes', name: 'Deportes', iconName: 'Activity', description: 'Material de fitness, montaña, fútbol, pádel y running', orderIndex: 10, isActive: true },
  { id: 'cat-11', slug: 'bicicletas', name: 'Bicicletas', iconName: 'Bike', description: 'Carretera, MTB, urbanas, eléctricas y accesorios', orderIndex: 11, isActive: true },
  { id: 'cat-12', slug: 'motor', name: 'Motor', iconName: 'Car', description: 'Accesorios para coches, motos y recambios homologados', orderIndex: 12, isActive: true },
  { id: 'cat-13', slug: 'fotografia', name: 'Fotografía', iconName: 'Camera', description: 'Cámaras réflex, mirrorless, objetivos y flashes', orderIndex: 13, isActive: true },
  { id: 'cat-14', slug: 'musica', name: 'Música', iconName: 'Music', description: 'Instrumentos, amplificadores, vinilos y audio pro', orderIndex: 14, isActive: true },
  { id: 'cat-15', slug: 'libros', name: 'Libros', iconName: 'BookOpen', description: 'Novelas, cómics, libros de texto y divulgación', orderIndex: 15, isActive: true },
  { id: 'cat-16', slug: 'coleccionismo', name: 'Coleccionismo', iconName: 'Sparkles', description: 'Monedas, sellos, figuras, trading cards y antigüedades', orderIndex: 16, isActive: true },
  { id: 'cat-17', slug: 'bebes-y-ninos', name: 'Bebés y niños', iconName: 'Baby', description: 'Carritos, cunas, juguetes educativos y ropa infantil', orderIndex: 17, isActive: true },
  { id: 'cat-18', slug: 'otros', name: 'Otros', iconName: 'Package', description: 'Artículos diversos y productos no categorizados', orderIndex: 18, isActive: true },
];

const DEFAULT_SETTINGS: AdminSettings = {
  platformName: 'MercadoX',
  logoText: 'MercadoX',
  primaryColor: '#4f46e5',
  commissionPercent: 8, // 8% commission standard
  featuredPrice7Days: 4.99,
  featuredPrice30Days: 14.99,
  allowRegistrations: true,
  bannerNotice: '',
  adminNotificationEmail: 'admin@mercadox.es',
  stripeConfigured: false,
  smtpConfigured: false,
  seo: {
    metaTitle: 'MercadoX - Compra, Venta y Regalos Seguros entre Particulares en España',
    metaDescription: 'MercadoX es la plataforma marketplace moderna y segura para comprar, vender y regalar productos entre particulares en España con protección y pagos verificados.',
    openGraphTitle: 'MercadoX - Marketplace Seguro en España',
    openGraphDescription: 'Compraventa protegida con fondos en custodia y regalos 100% solidarios.',
    socialImageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e55722c6?w=1200&auto=format&fit=crop&q=80',
    sitemapEnabled: true,
    robotsTxtCustom: 'User-agent: *\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/admin\nDisallow: /api/admin/\nAllow: /',
    organizationName: 'MercadoX Marketplace S.L.',
    organizationLogo: 'https://images.unsplash.com/photo-1556742049-0a67e55722c6?w=200&auto=format&fit=crop&q=80'
  },
  security: {
    twoFactorEnabled: false,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
    requireEmailVerification: true,
    requirePhoneForSelling: false,
    antiScamStrictness: 'high'
  },
  termsText: 'Términos y condiciones de uso de la plataforma MercadoX...',
  privacyText: 'Política de privacidad y protección de datos según RGPD...'
};

let dbCache: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      // Ensure any newly added keys or default categories exist
      if (!dbCache!.categories || dbCache!.categories.length === 0) {
        dbCache!.categories = INITIAL_CATEGORIES;
      }
      if (!dbCache!.settings) {
        dbCache!.settings = DEFAULT_SETTINGS;
      }
      if (!dbCache!.settings.seo) {
        dbCache!.settings.seo = DEFAULT_SETTINGS.seo;
      }
      if (!dbCache!.settings.security) {
        dbCache!.settings.security = DEFAULT_SETTINGS.security;
      }
      if (!dbCache!.alerts) {
        dbCache!.alerts = [];
      }
      if (!dbCache!.proApplications) {
        dbCache!.proApplications = [];
      }
      if (!dbCache!.payouts) {
        dbCache!.payouts = [];
      }

      // Check live env for configuration status
      dbCache!.settings.stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0);
      dbCache!.settings.smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim().length > 0);

      // ENFORCE SINGLE AUTHORIZED ADMIN ACCOUNT
      const authorizedAdminEmail = getAuthorizedAdminEmail();
      let adminAccountFound = false;
      for (const u of dbCache!.users) {
        if (u.email.toLowerCase() === authorizedAdminEmail) {
          u.role = 'admin';
          adminAccountFound = true;
        } else if (u.role === 'admin') {
          // Demote any other user that might have been given admin role
          u.role = 'user';
        }
      }

      if (!adminAccountFound) {
        const adminSaltHash = hashPassword('MercadoX2026!Admin');
        dbCache!.users.unshift({
          id: 'usr-admin-01',
          email: authorizedAdminEmail,
          name: 'Administración MercadoX',
          role: 'admin',
          verificationLevel: 'identity_verified',
          riskScore: 'low',
          isBlocked: false,
          isSuspended: false,
          city: 'Madrid',
          province: 'Madrid',
          bio: 'Cuenta oficial de administración y soporte de MercadoX España.',
          createdAt: new Date().toISOString(),
          verifiedEmail: true,
          verifiedPhone: true,
          verifiedIdentity: true,
          passwordHash: adminSaltHash.hash,
          salt: adminSaltHash.salt,
        });
      }

      return dbCache!;
    } catch (err) {
      console.error('Error reading db file, re-initializing safe schema:', err);
    }
  }

  // Create clean initial database with official setup
  const authorizedAdminEmail = getAuthorizedAdminEmail();
  const adminSaltHash = hashPassword('MercadoX2026!Admin');
  
  const initialDb: DatabaseSchema = {
    users: [
      {
        id: 'usr-admin-01',
        email: authorizedAdminEmail,
        name: 'Administración MercadoX',
        role: 'admin',
        verificationLevel: 'identity_verified',
        riskScore: 'low',
        isBlocked: false,
        isSuspended: false,
        city: 'Madrid',
        province: 'Madrid',
        bio: 'Cuenta oficial de administración y soporte de MercadoX España.',
        createdAt: new Date().toISOString(),
        verifiedEmail: true,
        verifiedPhone: true,
        verifiedIdentity: true,
        passwordHash: adminSaltHash.hash,
        salt: adminSaltHash.salt,
      }
    ],
    sessions: [],
    categories: INITIAL_CATEGORIES,
    products: [], // Strictly no fake products!
    giftRequests: [],
    orders: [], // Strictly no fake orders!
    payouts: [],
    conversations: [],
    messages: [],
    ratings: [], // Strictly no fake ratings!
    disputes: [],
    reports: [],
    favorites: [],
    alerts: [],
    proApplications: [],
    auditLogs: [
      {
        id: 'log-1',
        actorId: 'system',
        actorEmail: authorizedAdminEmail,
        action: 'PLATFORM_INITIALIZED',
        details: `Plataforma MercadoX iniciada con cuenta de administración única autorizada (${authorizedAdminEmail}), 18 categorías oficiales y comisión al 8%.`,
        timestamp: new Date().toISOString()
      }
    ],
    settings: {
      ...DEFAULT_SETTINGS,
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0),
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim().length > 0)
    }
  };

  dbCache = initialDb;
  saveDatabase(initialDb);
  return initialDb;
}

export function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    dbCache = data;
  } catch (err) {
    console.error('Critical: Failed to save database to disk', err);
  }
}

export function logAudit(actorId: string, actorEmail: string, action: string, details: string, ip?: string): void {
  const db = getDatabase();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actorId,
    actorEmail,
    action,
    details,
    ip,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  // Keep last 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  saveDatabase(db);
}
