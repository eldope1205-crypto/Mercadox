import crypto from 'crypto';

// Single source of truth for the ONLY authorized administrator account
export function getAuthorizedAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || 'eldope1205@gmail.com').trim().toLowerCase();
}

export function isAuthorizedAdmin(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getAuthorizedAdminEmail();
}

// Partial email masking for privacy in admin views (e.g. j***n@domain.com)
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0] || '*'}***@${domain}`;
  }
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
}

// Secure password hashing with PBKDF2 (OWASP recommended parameters)
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// XSS and HTML sanitization
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Anti-fraud and scam pattern detection for chat & listings
const OFF_PLATFORM_PATTERNS = [
  /\bbizum\b/i,
  /\btransferencia\b/i,
  /\bwhatsapp\b/i,
  /\bwhats\b/i,
  /\bwpp\b/i,
  /\btelegram\b/i,
  /\bp[aá]game por fuera\b/i,
  /\benlace de pago\b/i,
  /\bp[aá]same tu tarjeta\b/i,
  /\bwestern union\b/i,
  /\bmoneygram\b/i,
  /\bpaypal amigos\b/i,
  /\b6[0-9]{8}\b/, // Spanish mobile numbers sent in chat
  /\+?34[0-9]{9}/,
  /https?:\/\/[^\s]+/i // Suspicious external links in chat
];

export interface ScamCheckResult {
  isSuspicious: boolean;
  alertMessage: string | null;
  detectedPatterns: string[];
}

export function analyzeMessageForScams(text: string): ScamCheckResult {
  const detected: string[] = [];
  for (const pattern of OFF_PLATFORM_PATTERNS) {
    if (pattern.test(text)) {
      detected.push(pattern.source);
    }
  }

  if (detected.length > 0) {
    return {
      isSuspicious: true,
      alertMessage: '⚠️ Atención de seguridad MercadoX: Recuerda nunca realizar pagos por Bizum, transferencia o enlaces externos. Las compras fuera de la plataforma carecen de cobertura y protección al comprador.',
      detectedPatterns: detected
    };
  }

  return {
    isSuspicious: false,
    alertMessage: null,
    detectedPatterns: []
  };
}

// Rate limiter helper in memory with IP sliding window
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitEntry>();
const loginFailures = new Map<string, { attempts: number; lockUntil: number }>();

export function checkRateLimit(ip: string, limit = 60, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  if (!entry || now > entry.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

export function recordLoginFailure(emailOrIp: string): { locked: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = loginFailures.get(emailOrIp) || { attempts: 0, lockUntil: 0 };

  if (now < record.lockUntil) {
    const remainingMs = record.lockUntil - now;
    return { locked: true, waitMinutes: Math.ceil(remainingMs / 60000) };
  }

  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // 15 min lockout
    loginFailures.set(emailOrIp, record);
    return { locked: true, waitMinutes: 15 };
  }

  loginFailures.set(emailOrIp, record);
  return { locked: false };
}

export function clearLoginFailures(emailOrIp: string) {
  loginFailures.delete(emailOrIp);
}

export function isLoginLocked(emailOrIp: string): { locked: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = loginFailures.get(emailOrIp);
  if (record && now < record.lockUntil) {
    return { locked: true, waitMinutes: Math.ceil((record.lockUntil - now) / 60000) };
  }
  return { locked: false };
}
