import { Request, Response, NextFunction } from 'express';
import { getDatabase, logAudit } from './db.js';
import { checkRateLimit, isAuthorizedAdmin, getAuthorizedAdminEmail } from './security.js';
import { User } from '../src/types.js';

export interface AuthenticatedRequest extends Request {
  user?: User & { passwordHash: string; salt: string };
  sessionToken?: string;
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { allowed, remaining } = checkRateLimit(ip, 120, 60000);
  res.setHeader('X-RateLimit-Limit', '120');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  if (!allowed) {
    res.status(429).json({ error: 'Demasiadas solicitudes. Por favor, espera un momento antes de continuar.' });
    return;
  }
  next();
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.mercadox_session || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    next();
    return;
  }

  const db = getDatabase();
  const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
  
  if (!session) {
    next();
    return;
  }

  const user = db.users.find(u => u.id === session.userId);
  if (user && !user.isBlocked) {
    req.user = user;
    req.sessionToken = token;
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción.' });
    return;
  }
  if (req.user.isSuspended) {
    res.status(403).json({ error: 'Tu cuenta se encuentra temporalmente suspendida por revisión de seguridad.' });
    return;
  }
  next();
}

/**
 * Strict server-side verification for the single authorized admin account.
 * Checks:
 * 1. User is authenticated with a valid active session.
 * 2. User email matches the exact configured ADMIN_EMAIL environment variable.
 * 3. User account is not blocked or suspended.
 * 4. Logs any unauthorized intrusion attempt to the immutable audit log.
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado. Inicia sesión con la cuenta de administrador.' });
    return;
  }

  const userEmail = (req.user.email || '').trim().toLowerCase();
  const authorizedEmail = getAuthorizedAdminEmail();

  if (!isAuthorizedAdmin(userEmail)) {
    logAudit(
      req.user.id,
      req.user.email,
      'UNAUTHORIZED_ADMIN_API_ACCESS_ATTEMPT',
      `Acceso no autorizado rechazado para la URL ${req.originalUrl} desde IP ${req.ip || '127.0.0.1'}. Email que intentó acceder: ${req.user.email}. Admin autorizado configurado: ${authorizedEmail}`,
      req.ip
    );
    res.status(403).json({ 
      error: 'Acceso no autorizado. Esta cuenta no coincide con el administrador autorizado configurado en el sistema.' 
    });
    return;
  }

  if (req.user.isSuspended || req.user.isBlocked) {
    res.status(403).json({ error: 'Cuenta administrativa suspendida o bloqueada por seguridad.' });
    return;
  }

  next();
}
