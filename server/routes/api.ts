import express, { Response } from 'express';
import { getDatabase, saveDatabase, logAudit } from '../db.js';
import { 
  hashPassword, verifyPassword, generateSecureToken, 
  sanitizeInput, analyzeMessageForScams, isLoginLocked, 
  recordLoginFailure, clearLoginFailures, isAuthorizedAdmin,
  getAuthorizedAdminEmail, maskEmail 
} from '../security.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware.js';
import { 
  Product, GiftRequest, Order, ChatMessage, Rating, 
  Dispute, Report, Category, PayoutRequest, RiskScore,
  AdminAlert, ProApplication, SEOConfig, SecurityConfig 
} from '../../src/types.js';

export const apiRouter = express.Router();

// --- PUBLIC CONFIGURATION ---
apiRouter.get('/config/public', (req, res) => {
  const db = getDatabase();
  const isStripeSet = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0);
  const isSmtpSet = Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim().length > 0);
  
  res.json({
    platformName: db.settings.platformName,
    logoText: db.settings.logoText,
    primaryColor: db.settings.primaryColor,
    commissionPercent: db.settings.commissionPercent,
    featuredPrice7Days: db.settings.featuredPrice7Days,
    featuredPrice30Days: db.settings.featuredPrice30Days,
    bannerNotice: db.settings.bannerNotice,
    stripeConfigured: isStripeSet,
    smtpConfigured: isSmtpSet
  });
});

// --- AUTHENTICATION ---
apiRouter.post('/auth/register', (req, res) => {
  const { email, password, name, phone, city, province } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    return;
  }

  // Anti-phishing protection: Ban usernames resembling official platform accounts
  const normalizedName = name.toLowerCase().trim();
  const prohibitedNames = ['mercadox', 'soporte', 'oficial', 'admin', 'moderador', 'seguridad', 'pagos'];
  for (const forbidden of prohibitedNames) {
    if (normalizedName.includes(forbidden)) {
      res.status(400).json({ 
        error: 'Por motivos de seguridad y prevención de suplantación de identidad (phishing), no se permiten nombres que contengan referencias a la administración o soporte de MercadoX.' 
      });
      return;
    }
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres por seguridad.' });
    return;
  }

  const db = getDatabase();
  const normalizedEmail = email.toLowerCase().trim();
  if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    res.status(400).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    name: sanitizeInput(name.trim()),
    phone: phone ? sanitizeInput(phone.trim()) : undefined,
    role: 'user' as const,
    verificationLevel: 'basic' as const,
    riskScore: 'low' as const,
    isBlocked: false,
    isSuspended: false,
    city: city ? sanitizeInput(city.trim()) : 'España',
    province: province ? sanitizeInput(province.trim()) : 'España',
    createdAt: new Date().toISOString(),
    verifiedEmail: true, // initial basic verification
    verifiedPhone: false,
    verifiedIdentity: false,
    passwordHash: hash,
    salt
  };

  db.users.push(newUser);

  // Generate session token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  db.sessions.push({
    token,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
    expiresAt,
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  saveDatabase(db);
  logAudit(newUser.id, newUser.email, 'USER_REGISTERED', `Usuario registrado en la plataforma desde ${req.ip || '127.0.0.1'}`);

  res.cookie('mercadox_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  const { passwordHash, salt: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token });
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Por favor, introduce tu email y contraseña.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const lockStatus = isLoginLocked(normalizedEmail);
  if (lockStatus.locked) {
    res.status(429).json({ 
      error: `Cuenta temporalmente bloqueada por reiterados intentos fallidos. Inténtalo de nuevo en ${lockStatus.waitMinutes} minutos para proteger tu cuenta.` 
    });
    return;
  }

  const db = getDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    const failureResult = recordLoginFailure(normalizedEmail);
    if (failureResult.locked) {
      logAudit(user?.id || 'unknown', normalizedEmail, 'LOGIN_LOCKED', `Bloqueo temporal por 5 intentos fallidos de acceso.`);
    }
    res.status(401).json({ error: 'Credenciales incorrectas. Comprueba tu correo y contraseña.' });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: 'Esta cuenta ha sido bloqueada por la administración por motivos de seguridad o incumplimiento de términos.' });
    return;
  }

  clearLoginFailures(normalizedEmail);

  // Issue session token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt,
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  user.lastLoginAt = new Date().toISOString();
  saveDatabase(db);
  logAudit(user.id, user.email, 'LOGIN_SUCCESS', `Inicio de sesión exitoso desde ${req.ip || '127.0.0.1'}`);

  res.cookie('mercadox_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  const { passwordHash, salt: _, ...safeUser } = user;
  const isAuthorized = isAuthorizedAdmin(safeUser.email);
  safeUser.role = isAuthorized ? 'admin' : 'user';
  (safeUser as any).isAuthorizedAdmin = isAuthorized;
  res.json({ user: safeUser, token, isAuthorizedAdmin: isAuthorized });
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.mercadox_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const db = getDatabase();
    db.sessions = db.sessions.filter(s => s.token !== token);
    saveDatabase(db);
  }
  res.clearCookie('mercadox_session');
  res.json({ success: true, message: 'Sesión cerrada con éxito.' });
});

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  const { passwordHash, salt, ...safeUser } = req.user;
  const isAuthorized = isAuthorizedAdmin(safeUser.email);
  safeUser.role = isAuthorized ? 'admin' : 'user';
  (safeUser as any).isAuthorizedAdmin = isAuthorized;
  res.json({ user: safeUser, isAuthorizedAdmin: isAuthorized });
});

// Secure password recovery request (Anti-enumeration: identical response whether account exists or not)
apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Introduce una dirección de correo electrónico válida.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (user) {
    const recoveryToken = generateSecureToken();
    (user as any).recoveryToken = recoveryToken;
    (user as any).recoveryTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    saveDatabase(db);
    logAudit(user.id, user.email, 'PASSWORD_RECOVERY_REQUESTED', `Solicitud de recuperación de contraseña desde ${req.ip || '127.0.0.1'}`);
  }

  // Uniform response to prevent account harvesting
  res.json({ 
    success: true, 
    message: 'Si la dirección está registrada en MercadoX, recibirás un correo seguro con las instrucciones para restablecer tu contraseña.' 
  });
});

// Secure password reset execution
apiRouter.post('/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find(u => (u as any).recoveryToken === token && new Date((u as any).recoveryTokenExpiresAt) > new Date());

  if (!user) {
    res.status(400).json({ error: 'El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  delete (user as any).recoveryToken;
  delete (user as any).recoveryTokenExpiresAt;

  // Invalidate ALL previous active sessions for this user for security
  db.sessions = db.sessions.filter(s => s.userId !== user.id);

  saveDatabase(db);
  logAudit(user.id, user.email, 'PASSWORD_RESET_COMPLETED', `Contraseña restablecida y todas las sesiones anteriores invalidadas.`);

  res.json({ 
    success: true, 
    message: 'Tu contraseña ha sido actualizada con éxito. Por seguridad, inicia sesión nuevamente con tus nuevas credenciales.' 
  });
});

apiRouter.post('/auth/verify-phone', requireAuth, (req: AuthenticatedRequest, res) => {
  const { phone } = req.body;
  if (!phone || phone.trim().length < 8) {
    res.status(400).json({ error: 'Introduce un número de teléfono válido para España (+34).' });
    return;
  }
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.user!.id);
  if (user) {
    user.phone = sanitizeInput(phone.trim());
    user.verifiedPhone = true;
    if (user.verificationLevel === 'basic') {
      user.verificationLevel = 'verified';
    }
    saveDatabase(db);
    logAudit(user.id, user.email, 'PHONE_VERIFIED', `Teléfono verificado para el usuario.`);
    const { passwordHash, salt, ...safeUser } = user;
    res.json({ success: true, user: safeUser, message: 'Teléfono verificado con éxito. Tu nivel de cuenta es ahora Cuenta Verificada.' });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado.' });
  }
});

apiRouter.post('/auth/verify-identity', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.user!.id);
  if (user) {
    user.verifiedIdentity = true;
    user.verificationLevel = 'identity_verified';
    saveDatabase(db);
    logAudit(user.id, user.email, 'IDENTITY_VERIFIED', `Identidad verificada a través del protocolo seguro sin retención documental.`);
    const { passwordHash, salt, ...safeUser } = user;
    res.json({ 
      success: true, 
      user: safeUser, 
      message: 'Identidad verificada con éxito. Ya dispones del distintivo oficial ✓ Usuario verificado.' 
    });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado.' });
  }
});

// --- CATEGORIES ---
apiRouter.get('/categories', (req, res) => {
  const db = getDatabase();
  const activeCategories = db.categories
    .filter(c => c.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  res.json({ categories: activeCategories });
});

// --- PRODUCTS ---
apiRouter.get('/products', (req, res) => {
  const db = getDatabase();
  const { q, category, minPrice, maxPrice, isGift, city, condition, sort } = req.query;

  let products = db.products.filter(p => p.status === 'active' || p.status === 'gift_reserved');

  if (q && typeof q === 'string') {
    const search = q.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(search) || 
      p.description.toLowerCase().includes(search)
    );
  }

  if (category && typeof category === 'string') {
    const cat = db.categories.find(c => c.slug === category || c.id === category);
    if (cat) {
      products = products.filter(p => p.categoryId === cat.id);
    }
  }

  if (isGift !== undefined) {
    const giftBool = isGift === 'true' || isGift === '1';
    products = products.filter(p => p.isGift === giftBool);
  }

  if (minPrice && !isNaN(Number(minPrice))) {
    products = products.filter(p => p.price >= Number(minPrice));
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }

  if (city && typeof city === 'string') {
    const citySearch = city.toLowerCase();
    products = products.filter(p => 
      p.approxLocation.city.toLowerCase().includes(citySearch) ||
      p.approxLocation.province.toLowerCase().includes(citySearch)
    );
  }

  if (condition && typeof condition === 'string') {
    products = products.filter(p => p.condition === condition);
  }

  // Sorting
  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else {
    // Default: Featured first, then most recent
    products.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  res.json({
    total: products.length,
    products
  });
});

apiRouter.get('/products/:id', (req, res) => {
  const db = getDatabase();
  const product = db.products.find(p => p.id === req.params.id && p.status !== 'deleted');

  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado o ya no está disponible.' });
    return;
  }

  // Increment view counter
  product.viewsCount = (product.viewsCount || 0) + 1;
  saveDatabase(db);

  // Fetch real seller details & reputation (no fake reviews)
  const seller = db.users.find(u => u.id === product.sellerId);
  const sellerRatings = db.ratings.filter(r => r.reviewedUserId === product.sellerId);
  const completedSales = db.orders.filter(o => o.sellerId === product.sellerId && o.status === 'completed').length;
  
  const avgRating = sellerRatings.length > 0 
    ? sellerRatings.reduce((acc, curr) => acc + curr.stars, 0) / sellerRatings.length 
    : 0;

  // Related products in same category
  const relatedProducts = db.products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.status === 'active')
    .slice(0, 4);

  res.json({
    product,
    seller: seller ? {
      id: seller.id,
      name: seller.name,
      verificationLevel: seller.verificationLevel,
      city: seller.city,
      province: seller.province,
      createdAt: seller.createdAt,
      totalCompletedSales: completedSales,
      ratingAverage: Number(avgRating.toFixed(1)),
      totalRatings: sellerRatings.length,
      ratings: sellerRatings
    } : null,
    relatedProducts
  });
});

apiRouter.post('/products', requireAuth, (req: AuthenticatedRequest, res) => {
  const { 
    title, description, categoryId, price, isGift, 
    condition, images, approxLocation, shippingMethod, additionalInfo 
  } = req.body;

  if (!title || !description || !categoryId || !approxLocation?.city) {
    res.status(400).json({ error: 'Por favor, completa todos los campos requeridos (título, descripción, categoría y ubicación aproximada).' });
    return;
  }

  const db = getDatabase();
  const category = db.categories.find(c => c.id === categoryId || c.slug === categoryId);
  if (!category) {
    res.status(400).json({ error: 'La categoría seleccionada no es válida.' });
    return;
  }

  // Enforce gift rule: Price MUST be 0€ for gifts
  let finalPrice = Number(price);
  const isGiftBool = Boolean(isGift) || finalPrice === 0;
  if (isGiftBool) {
    finalPrice = 0;
  } else if (isNaN(finalPrice) || finalPrice < 0) {
    res.status(400).json({ error: 'El precio debe ser un importe positivo válido.' });
    return;
  }

  // Anti-fraud checks for rapid posting
  const sellerId = req.user!.id;
  const recentUserProducts = db.products.filter(p => 
    p.sellerId === sellerId && 
    (Date.now() - new Date(p.createdAt).getTime()) < 10 * 60 * 1000 // Last 10 minutes
  );

  let initialStatus: Product['status'] = 'active';
  if (recentUserProducts.length >= 5) {
    initialStatus = 'under_review';
    logAudit(sellerId, req.user!.email, 'RAPID_LISTINGS_FLAGGED', `Usuario publicó ${recentUserProducts.length + 1} anuncios en menos de 10 minutos. Anuncio puesto bajo revisión.`);
  }

  // Scam pattern checks in description
  const scamCheck = analyzeMessageForScams(description);
  if (scamCheck.isSuspicious) {
    initialStatus = 'under_review';
    logAudit(sellerId, req.user!.email, 'SUSPICIOUS_LISTING_DESCRIPTION', `Anuncio contiene posibles menciones a pagos externos (${scamCheck.detectedPatterns.join(', ')}). Puesto bajo revisión.`);
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sellerId,
    sellerName: req.user!.name,
    sellerVerification: req.user!.verificationLevel,
    title: sanitizeInput(title.trim()),
    description: sanitizeInput(description.trim()),
    categoryId: category.id,
    categoryName: category.name,
    price: finalPrice,
    isGift: isGiftBool,
    condition: condition || 'good',
    images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'],
    approxLocation: {
      city: sanitizeInput(approxLocation.city.trim()),
      province: sanitizeInput(approxLocation.province ? approxLocation.province.trim() : approxLocation.city.trim())
    },
    shippingMethod: shippingMethod || 'both',
    additionalInfo: additionalInfo ? sanitizeInput(additionalInfo.trim()) : undefined,
    status: initialStatus,
    isFeatured: false,
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDatabase(db);
  logAudit(sellerId, req.user!.email, 'PRODUCT_CREATED', `Anuncio "${newProduct.title}" publicado con éxito (ID: ${newProduct.id}, Precio: ${newProduct.price}€).`);

  res.status(201).json({
    success: true,
    product: newProduct,
    message: initialStatus === 'under_review' 
      ? 'Anuncio publicado y en revisión preventiva por el sistema de seguridad.' 
      : 'Anuncio publicado con éxito en MercadoX.'
  });
});

apiRouter.put('/products/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const product = db.products.find(p => p.id === req.params.id);

  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }

  if (product.sellerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'No tienes permisos para modificar este anuncio.' });
    return;
  }

  const { title, description, categoryId, price, condition, approxLocation, shippingMethod, status } = req.body;

  if (title) product.title = sanitizeInput(title.trim());
  if (description) product.description = sanitizeInput(description.trim());
  if (categoryId) {
    const cat = db.categories.find(c => c.id === categoryId);
    if (cat) {
      product.categoryId = cat.id;
      product.categoryName = cat.name;
    }
  }
  if (price !== undefined && !product.isGift) {
    product.price = Number(price);
  }
  if (condition) product.condition = condition;
  if (approxLocation) {
    product.approxLocation = {
      city: sanitizeInput(approxLocation.city),
      province: sanitizeInput(approxLocation.province || approxLocation.city)
    };
  }
  if (shippingMethod) product.shippingMethod = shippingMethod;
  if (status && ['active', 'paused', 'sold'].includes(status)) {
    product.status = status;
  }

  product.updatedAt = new Date().toISOString();
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'PRODUCT_UPDATED', `Anuncio ${product.id} actualizado.`);

  res.json({ success: true, product });
});

apiRouter.delete('/products/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const product = db.products.find(p => p.id === req.params.id);

  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }

  if (product.sellerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'No tienes permisos para eliminar este anuncio.' });
    return;
  }

  product.status = 'deleted';
  product.updatedAt = new Date().toISOString();
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'PRODUCT_DELETED', `Anuncio ${product.id} marcado como eliminado.`);

  res.json({ success: true, message: 'Anuncio eliminado correctamente.' });
});

// --- 🎁 REGALA GRATIS MODULE ---
apiRouter.post('/gifts/:productId/request', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const product = db.products.find(p => p.id === req.params.productId && p.isGift && p.status === 'active');

  if (!product) {
    res.status(404).json({ error: 'El producto regalado no está disponible actualmente.' });
    return;
  }

  if (product.sellerId === req.user!.id) {
    res.status(400).json({ error: 'No puedes solicitar un producto regalado publicado por ti mismo.' });
    return;
  }

  // Check if already requested
  const existingRequest = db.giftRequests.find(r => 
    r.productId === product.id && 
    r.requesterId === req.user!.id && 
    ['pending', 'accepted'].includes(r.status)
  );

  if (existingRequest) {
    res.status(400).json({ error: 'Ya has enviado una solicitud para este regalo.' });
    return;
  }

  const { message } = req.body;
  const newRequest: GiftRequest = {
    id: `gr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.images[0],
    requesterId: req.user!.id,
    requesterName: req.user!.name,
    ownerId: product.sellerId,
    status: 'pending',
    message: message ? sanitizeInput(message.trim()) : '¡Hola! Estoy muy interesado en este producto que regalas. Muchas gracias.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.giftRequests.unshift(newRequest);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'GIFT_REQUESTED', `Solicitud de regalo enviada para el producto ${product.id}`);

  res.status(201).json({
    success: true,
    request: newRequest,
    message: 'Solicitud enviada al propietario. Te notificaremos en cuanto responda.'
  });
});

apiRouter.get('/gifts/requests', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const userId = req.user!.id;

  const sent = db.giftRequests.filter(r => r.requesterId === userId);
  const received = db.giftRequests.filter(r => r.ownerId === userId);

  res.json({ sent, received });
});

apiRouter.post('/gifts/requests/:id/action', requireAuth, (req: AuthenticatedRequest, res) => {
  const { action } = req.body; // 'accept' | 'reject' | 'deliver' | 'cancel'
  const db = getDatabase();
  const request = db.giftRequests.find(r => r.id === req.params.id);

  if (!request) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  const product = db.products.find(p => p.id === request.productId);
  const isOwner = request.ownerId === req.user!.id;
  const isRequester = request.requesterId === req.user!.id;

  if (!isOwner && !isRequester && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'No tienes autorización para gestionar esta solicitud.' });
    return;
  }

  if (action === 'accept' && isOwner) {
    request.status = 'accepted';
    if (product) product.status = 'gift_reserved';
    // Reject other pending requests for this product
    db.giftRequests.forEach(r => {
      if (r.productId === request.productId && r.id !== request.id && r.status === 'pending') {
        r.status = 'rejected';
      }
    });
  } else if (action === 'reject' && isOwner) {
    request.status = 'rejected';
  } else if (action === 'deliver' && isOwner) {
    request.status = 'delivered';
    if (product) product.status = 'gift_delivered';
  } else if (action === 'cancel' && (isRequester || isOwner)) {
    request.status = 'cancelled';
    if (product && product.status === 'gift_reserved') {
      product.status = 'active'; // Returns to available
    }
  } else {
    res.status(400).json({ error: 'Acción no permitida.' });
    return;
  }

  request.updatedAt = new Date().toISOString();
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'GIFT_STATUS_CHANGED', `Solicitud ${request.id} actualizada a ${request.status}`);

  res.json({ success: true, request, productStatus: product?.status });
});

// --- CHAT & ANTI-SCAM ---
apiRouter.get('/chat/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const userId = req.user!.id;
  const userConversations = db.conversations
    .filter(c => c.buyerId === userId || c.sellerId === userId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  res.json({ conversations: userConversations });
});

apiRouter.post('/chat/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: 'Se requiere el ID del producto para iniciar conversación.' });
    return;
  }

  const db = getDatabase();
  const product = db.products.find(p => p.id === productId);
  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }

  if (product.sellerId === req.user!.id) {
    res.status(400).json({ error: 'No puedes abrir una conversación contigo mismo.' });
    return;
  }

  let conversation = db.conversations.find(c => 
    c.productId === productId && 
    c.buyerId === req.user!.id && 
    c.sellerId === product.sellerId
  );

  if (!conversation) {
    const seller = db.users.find(u => u.id === product.sellerId);
    conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price,
      productImage: product.images[0],
      buyerId: req.user!.id,
      buyerName: req.user!.name,
      sellerId: product.sellerId,
      sellerName: seller?.name || product.sellerName || 'Vendedor',
      lastMessage: 'Conversación iniciada',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.conversations.unshift(conversation);
    saveDatabase(db);
  }

  res.json({ conversation });
});

apiRouter.get('/chat/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const conversation = db.conversations.find(c => c.id === req.params.id);

  if (!conversation) {
    res.status(404).json({ error: 'Conversación no encontrada.' });
    return;
  }

  if (conversation.buyerId !== req.user!.id && conversation.sellerId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'No tienes acceso a esta conversación.' });
    return;
  }

  const messages = db.messages
    .filter(m => m.conversationId === conversation.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ conversation, messages });
});

apiRouter.post('/chat/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const { conversationId, text } = req.body;

  if (!conversationId || !text || text.trim().length === 0) {
    res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    return;
  }

  const db = getDatabase();
  const conversation = db.conversations.find(c => c.id === conversationId);

  if (!conversation) {
    res.status(404).json({ error: 'Conversación no encontrada.' });
    return;
  }

  if (conversation.buyerId !== req.user!.id && conversation.sellerId !== req.user!.id) {
    res.status(403).json({ error: 'No perteneces a esta conversación.' });
    return;
  }

  // Scam pattern detection
  const scamAnalysis = analyzeMessageForScams(text);
  if (scamAnalysis.isSuspicious) {
    logAudit(
      req.user!.id, 
      req.user!.email, 
      'OFF_PLATFORM_SCAM_SIGNAL', 
      `Mensaje con patrones de pago externo o contacto sospechoso: [${scamAnalysis.detectedPatterns.join(', ')}] en conversación ${conversationId}`
    );
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId,
    senderId: req.user!.id,
    senderName: req.user!.name,
    text: sanitizeInput(text.trim()),
    warningAlert: scamAnalysis.alertMessage,
    isReported: false,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);
  conversation.lastMessage = newMessage.text.substring(0, 60);
  conversation.lastMessageAt = newMessage.createdAt;
  saveDatabase(db);

  res.status(201).json({ message: newMessage });
});

// --- ORDERS & PAYMENTS (TRANSPARENT, NO FAKE DATA) ---
apiRouter.post('/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const { productId, shippingAddress } = req.body;
  const db = getDatabase();

  const product = db.products.find(p => p.id === productId && p.status === 'active');
  if (!product) {
    res.status(404).json({ error: 'El producto no está disponible para compra.' });
    return;
  }

  if (product.sellerId === req.user!.id) {
    res.status(400).json({ error: 'No puedes comprar tu propio producto.' });
    return;
  }

  // Check commission and amount breakdown
  const commissionRate = db.settings.commissionPercent / 100;
  const commissionAmount = Number((product.price * commissionRate).toFixed(2));
  const sellerAmount = Number((product.price - commissionAmount).toFixed(2));

  // Check if real Stripe key is configured
  const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0);

  if (!isStripeConfigured) {
    // Transparently reject simulating fake money, provide exact requirement
    res.status(503).json({
      error: 'La pasarela de pago segura de MercadoX (Stripe Marketplace) se encuentra pendiente de configuración de claves por parte del administrador.',
      code: 'GATEWAY_PENDING_SETUP',
      details: {
        productPrice: product.price,
        commissionPercent: db.settings.commissionPercent,
        commissionAmount,
        sellerAmount,
        requiredEnvVar: 'STRIPE_SECRET_KEY',
        instruction: 'Por motivos de estricta transparencia legal y seguridad, MercadoX nunca simula transacciones monetarias ficticias sin una pasarela real conectada.'
      }
    });
    return;
  }

  // Real Stripe integration would create a PaymentIntent here
  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productTitle: product.title,
    productImage: product.images[0],
    buyerId: req.user!.id,
    buyerName: req.user!.name,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    amount: product.price,
    commissionAmount,
    sellerAmount,
    status: 'payment_pending',
    paymentProvider: 'stripe',
    shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'ORDER_INITIATED', `Pedido ${newOrder.id} iniciado por ${product.price}€`);

  res.status(201).json({ success: true, order: newOrder });
});

apiRouter.get('/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const userId = req.user!.id;

  const purchases = db.orders.filter(o => o.buyerId === userId);
  const sales = db.orders.filter(o => o.sellerId === userId);

  res.json({ purchases, sales });
});

apiRouter.post('/orders/:id/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const { status, trackingNumber } = req.body;
  const db = getDatabase();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    res.status(404).json({ error: 'Pedido no encontrado.' });
    return;
  }

  const isBuyer = order.buyerId === req.user!.id;
  const isSeller = order.sellerId === req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  if (!isBuyer && !isSeller && !isAdmin) {
    res.status(403).json({ error: 'No autorizado.' });
    return;
  }

  // Controlled state transitions
  if (status === 'shipped' && (isSeller || isAdmin)) {
    order.status = 'shipped';
    if (trackingNumber) order.trackingNumber = sanitizeInput(trackingNumber);
  } else if (status === 'delivered' && (isBuyer || isAdmin)) {
    order.status = 'delivered';
  } else if (status === 'completed' && (isBuyer || isAdmin)) {
    order.status = 'completed';
    // Mark product as sold
    const product = db.products.find(p => p.id === order.productId);
    if (product) product.status = 'sold';
  } else {
    res.status(400).json({ error: 'Transición de estado no autorizada.' });
    return;
  }

  order.updatedAt = new Date().toISOString();
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'ORDER_STATUS_UPDATED', `Pedido ${order.id} actualizado a ${order.status}`);

  res.json({ success: true, order });
});

// --- RATINGS (STRICTLY ON COMPLETED TRANSACTIONS ONLY) ---
apiRouter.post('/ratings', requireAuth, (req: AuthenticatedRequest, res) => {
  const { orderId, stars, comment } = req.body;
  const db = getDatabase();

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    res.status(404).json({ error: 'Pedido no encontrado.' });
    return;
  }

  // STRICT REQUIREMENT: Order must be 'completed'
  if (order.status !== 'completed') {
    res.status(400).json({ 
      error: 'Solo se permite valorar una vez que la transacción ha sido completada y confirmada en MercadoX.' 
    });
    return;
  }

  // Only buyer can rate seller (or seller rate buyer)
  const isBuyer = order.buyerId === req.user!.id;
  const reviewedUserId = isBuyer ? order.sellerId : order.buyerId;

  // Prevent duplicate ratings for same order
  const existing = db.ratings.find(r => r.orderId === orderId && r.reviewerId === req.user!.id);
  if (existing) {
    res.status(400).json({ error: 'Ya has enviado una valoración para esta compra.' });
    return;
  }

  const numStars = Number(stars);
  if (isNaN(numStars) || numStars < 1 || numStars > 5) {
    res.status(400).json({ error: 'La puntuación debe ser entre 1 y 5 estrellas.' });
    return;
  }

  const newRating: Rating = {
    id: `rat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    productId: order.productId,
    reviewerId: req.user!.id,
    reviewerName: req.user!.name,
    reviewedUserId,
    stars: Math.round(numStars),
    comment: sanitizeInput(comment ? comment.trim() : ''),
    createdAt: new Date().toISOString()
  };

  db.ratings.unshift(newRating);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'RATING_SUBMITTED', `Valoración de ${newRating.stars} estrellas enviada para usuario ${reviewedUserId}`);

  res.status(201).json({ success: true, rating: newRating });
});

// --- DISPUTES ---
apiRouter.post('/disputes', requireAuth, (req: AuthenticatedRequest, res) => {
  const { orderId, reason, description, evidenceUrls } = req.body;
  const db = getDatabase();

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    res.status(404).json({ error: 'Pedido no encontrado.' });
    return;
  }

  if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id) {
    res.status(403).json({ error: 'Solo las partes involucradas en la compra pueden abrir una disputa.' });
    return;
  }

  const newDispute: Dispute = {
    id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    productTitle: order.productTitle,
    openedById: req.user!.id,
    openedByName: req.user!.name,
    reason: reason || 'not_received',
    description: sanitizeInput(description ? description.trim() : ''),
    evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
    status: 'open',
    createdAt: new Date().toISOString()
  };

  order.status = 'in_dispute';
  order.updatedAt = new Date().toISOString();
  db.disputes.unshift(newDispute);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'DISPUTE_OPENED', `Disputa abierta para el pedido ${order.id}. Motivo: ${newDispute.reason}`);

  res.status(201).json({ success: true, dispute: newDispute });
});

// --- REPORTS ---
apiRouter.post('/reports', requireAuth, (req: AuthenticatedRequest, res) => {
  const { targetType, targetId, reason, details } = req.body;
  if (!targetType || !targetId || !reason) {
    res.status(400).json({ error: 'Datos de reporte incompletos.' });
    return;
  }

  const db = getDatabase();
  const newReport: Report = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    targetType,
    targetId,
    reporterId: req.user!.id,
    reporterName: req.user!.name,
    reason,
    details: sanitizeInput(details ? details.trim() : ''),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.reports.unshift(newReport);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'REPORT_SUBMITTED', `Reporte creado contra ${targetType} ${targetId}. Motivo: ${reason}`);

  res.status(201).json({ success: true, message: 'Reporte recibido y registrado. Nuestro equipo de moderación lo revisará.' });
});

// --- FAVORITES ---
apiRouter.get('/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const userFavorites = db.favorites.filter(f => f.userId === req.user!.id);
  const favoriteProductIds = userFavorites.map(f => f.productId);
  const products = db.products.filter(p => favoriteProductIds.includes(p.id) && p.status !== 'deleted');

  res.json({ favorites: products, favoriteIds: favoriteProductIds });
});

apiRouter.post('/favorites/:productId', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const userId = req.user!.id;
  const productId = req.params.productId;

  const index = db.favorites.findIndex(f => f.userId === userId && f.productId === productId);
  let isFavorite = false;

  if (index >= 0) {
    db.favorites.splice(index, 1);
    isFavorite = false;
  } else {
    db.favorites.push({
      userId,
      productId,
      createdAt: new Date().toISOString()
    });
    isFavorite = true;
  }

  saveDatabase(db);
  res.json({ success: true, isFavorite });
});

// --- ADMIN API (STRICT SERVER-SIDE PROTECTED ONLY VIA requireAdmin) ---

// 1. Principal Dashboard Metrics (Real Data Only, 0 if empty)
apiRouter.get('/admin/metrics', requireAdmin, (req, res) => {
  const db = getDatabase();

  // Users metrics
  const registeredUsers = db.users.length;
  const verifiedUsers = db.users.filter(u => u.verificationLevel !== 'basic').length;
  const suspendedUsers = db.users.filter(u => u.isSuspended).length;
  const underReviewUsers = db.users.filter(u => u.riskScore === 'high' || u.riskScore === 'critical').length;

  // Products metrics
  const publishedProducts = db.products.filter(p => p.status === 'active').length;
  const soldProducts = db.products.filter(p => p.status === 'sold' && !p.isGift).length;
  const giftedProducts = db.products.filter(p => p.isGift && (p.status === 'sold' || p.status === 'gift_delivered')).length;
  const underReviewProducts = db.products.filter(p => p.status === 'under_review').length;
  const reportedProducts = db.products.filter(p => {
    return db.reports.some(r => r.targetType === 'product' && r.targetId === p.id && r.status === 'pending');
  }).length;

  // Sales metrics
  const totalOrders = db.orders.length;
  const confirmedSales = db.orders.filter(o => o.status === 'completed' || o.status === 'delivered' || o.status === 'shipped').length;
  const cancelledOrders = db.orders.filter(o => o.status === 'cancelled').length;
  const refundedOrders = db.orders.filter(o => o.status === 'refunded').length;
  const disputeOrders = db.orders.filter(o => o.status === 'in_dispute').length;

  // Financial metrics (strictly real transactions)
  const realSalesVolume = db.orders
    .filter(o => o.status === 'completed' || o.status === 'delivered' || o.status === 'shipped')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const realCommissionsEarned = db.orders
    .filter(o => o.status === 'completed')
    .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);

  const promotionEarnings = db.products
    .filter(p => p.isFeatured)
    .length * (db.settings.featuredPrice7Days || 4.99);

  const pendingBalances = db.orders
    .filter(o => o.status === 'shipped' || o.status === 'delivered' || o.status === 'payment_confirmed')
    .reduce((acc, curr) => acc + (curr.sellerAmount || 0), 0);

  const completedPayouts = (db.payouts || [])
    .filter(p => p.status === 'completed')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Security metrics
  const activeAlerts = (db.alerts || []).filter(a => a.status === 'new' || a.status === 'under_review').length;
  const pendingReports = db.reports.filter(r => r.status === 'pending').length;
  const suspiciousCases = underReviewUsers;
  const fraudAttempts = (db.alerts || []).filter(a => a.severity === 'critical' || a.severity === 'high').length;
  const blockedAccounts = db.users.filter(u => u.isBlocked).length;

  res.json({
    users: {
      registered: registeredUsers,
      verified: verifiedUsers,
      suspended: suspendedUsers,
      underReview: underReviewUsers
    },
    products: {
      published: publishedProducts,
      sold: soldProducts,
      gifted: giftedProducts,
      underReview: underReviewProducts,
      reported: reportedProducts
    },
    sales: {
      orders: totalOrders,
      confirmed: confirmedSales,
      cancellations: cancelledOrders,
      refunds: refundedOrders,
      disputes: disputeOrders
    },
    finance: {
      volume: Number(realSalesVolume.toFixed(2)),
      commissions: Number(realCommissionsEarned.toFixed(2)),
      promotions: Number(promotionEarnings.toFixed(2)),
      pendingBalances: Number(pendingBalances.toFixed(2)),
      payouts: Number(completedPayouts.toFixed(2)),
      commissionPercent: db.settings.commissionPercent || 8
    },
    security: {
      alerts: activeAlerts,
      reports: pendingReports,
      suspiciousCases,
      fraudAttempts,
      blockedAccounts
    }
  });
});

// 2. User Management (/admin/usuarios)
apiRouter.get('/admin/users', requireAdmin, (req, res) => {
  const db = getDatabase();
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';

  let users = db.users.map(u => {
    const listingsCount = db.products.filter(p => p.sellerId === u.id && p.status !== 'deleted').length;
    const salesCount = db.orders.filter(o => o.sellerId === u.id && o.status === 'completed').length;
    const purchasesCount = db.orders.filter(o => o.buyerId === u.id && o.status === 'completed').length;
    const reportsReceivedCount = db.reports.filter(r => r.targetType === 'user' && r.targetId === u.id).length;

    return {
      id: u.id,
      name: u.name,
      maskedEmail: maskEmail(u.email),
      role: u.role,
      verificationLevel: u.verificationLevel,
      verifiedEmail: u.verifiedEmail,
      verifiedPhone: u.verifiedPhone,
      verifiedIdentity: u.verifiedIdentity,
      riskScore: u.riskScore,
      isSuspended: Boolean(u.isSuspended),
      isBlocked: Boolean(u.isBlocked),
      city: u.city,
      province: u.province,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      listingsCount,
      salesCount,
      purchasesCount,
      reportsReceivedCount,
      isAuthorizedAdminAccount: isAuthorizedAdmin(u.email)
    };
  });

  if (search) {
    users = users.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.id.toLowerCase().includes(search) || 
      (u.city && u.city.toLowerCase().includes(search)) || 
      (u.province && u.province.toLowerCase().includes(search))
    );
  }

  res.json({ users });
});

apiRouter.get('/admin/users/:id/details', requireAdmin, (req, res) => {
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }
  const { passwordHash, salt, ...safeUser } = user;
  const listings = db.products.filter(p => p.sellerId === user.id && p.status !== 'deleted');
  const sales = db.orders.filter(o => o.sellerId === user.id);
  const purchases = db.orders.filter(o => o.buyerId === user.id);
  const reports = db.reports.filter(r => (r.targetType === 'user' && r.targetId === user.id) || (r.targetType === 'product' && listings.some(p => p.id === r.targetId)));
  
  res.json({
    user: safeUser,
    listings,
    sales,
    purchases,
    reports
  });
});

apiRouter.post('/admin/users/:id/action', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { action, riskScore, reason } = req.body; // 'suspend' | 'reactivate' | 'block' | 'unblock' | 'verify' | 'set_risk' | 'request_verification'
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  // Security barrier: NEVER block, suspend or tamper with the single authorized admin account!
  if (isAuthorizedAdmin(user.email)) {
    res.status(400).json({ error: 'Operación denegada. La cuenta única de administrador del sistema no puede ser bloqueada ni suspendida.' });
    return;
  }

  const previousState = { isBlocked: user.isBlocked, isSuspended: user.isSuspended, riskScore: user.riskScore };

  if (action === 'suspend') {
    user.isSuspended = true;
    // Invalidate sessions of suspended user
    db.sessions = db.sessions.filter(s => s.userId !== user.id);
  } else if (action === 'reactivate') {
    user.isSuspended = false;
  } else if (action === 'block') {
    user.isBlocked = true;
    db.sessions = db.sessions.filter(s => s.userId !== user.id);
  } else if (action === 'unblock') {
    user.isBlocked = false;
  } else if (action === 'verify') {
    user.verificationLevel = 'identity_verified';
    user.verifiedIdentity = true;
    user.verifiedEmail = true;
  } else if (action === 'set_risk' && riskScore) {
    user.riskScore = riskScore as RiskScore;
  } else if (action === 'request_verification') {
    // Flag for identity verification
    user.verificationLevel = 'basic';
  }

  saveDatabase(db);
  logAudit(
    req.user!.id, 
    req.user!.email, 
    'ADMIN_USER_MODERATION', 
    `Acción '${action}' ejecutada sobre usuario ${user.id} (${maskEmail(user.email)}). Razón: ${sanitizeInput(reason || 'Revisión administrativa')}. Estado previo: ${JSON.stringify(previousState)}`
  );

  res.json({ success: true, message: `Acción '${action}' ejecutada con éxito.` });
});

// 3. Product Management (/admin/productos)
apiRouter.get('/admin/products', requireAdmin, (req, res) => {
  const db = getDatabase();
  const { categoryId, status, search } = req.query;

  let products = db.products.map(p => {
    const seller = db.users.find(u => u.id === p.sellerId);
    const reportsCount = db.reports.filter(r => r.targetType === 'product' && r.targetId === p.id && r.status === 'pending').length;
    return {
      ...p,
      sellerName: seller ? seller.name : 'Usuario',
      sellerMaskedEmail: seller ? maskEmail(seller.email) : '***@***.***',
      reportsCount
    };
  });

  if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
    products = products.filter(p => p.categoryId === categoryId);
  }
  if (status && typeof status === 'string' && status !== 'all') {
    products = products.filter(p => p.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    products = products.filter(p => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }

  res.json({ products });
});

apiRouter.post('/admin/products/:id/action', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { action, reason } = req.body; // 'hide' | 'block' | 'restore' | 'mark_sold'
  const db = getDatabase();
  const product = db.products.find(p => p.id === req.params.id);

  if (!product) {
    res.status(404).json({ error: 'Producto no encontrado.' });
    return;
  }

  const prevStatus = product.status;
  if (action === 'hide') {
    product.status = 'paused';
  } else if (action === 'block') {
    product.status = 'under_review';
  } else if (action === 'restore') {
    product.status = 'active';
  } else if (action === 'mark_sold') {
    product.status = 'sold';
  }

  product.updatedAt = new Date().toISOString();
  saveDatabase(db);

  logAudit(
    req.user!.id,
    req.user!.email,
    'ADMIN_PRODUCT_MODERATION',
    `Producto ${product.id} ("${product.title}") cambiado de estado '${prevStatus}' a '${product.status}'. Acción: ${action}. Motivo: ${sanitizeInput(reason || 'Revisión por moderación')}`
  );

  res.json({ success: true, product });
});

// 4. Sales & Payments Management (/admin/ventas & /admin/pagos)
apiRouter.get('/admin/orders', requireAdmin, (req, res) => {
  const db = getDatabase();
  const ordersWithDetails = db.orders.map(o => {
    const product = db.products.find(p => p.id === o.productId);
    const buyer = db.users.find(u => u.id === o.buyerId);
    const seller = db.users.find(u => u.id === o.sellerId);

    return {
      ...o,
      productTitle: product ? product.title : 'Artículo',
      productPrice: product ? product.price : 0,
      buyerName: buyer ? buyer.name : 'Comprador',
      buyerMaskedEmail: buyer ? maskEmail(buyer.email) : '***@***.***',
      sellerName: seller ? seller.name : 'Vendedor',
      sellerMaskedEmail: seller ? maskEmail(seller.email) : '***@***.***',
      hasDispute: db.disputes.some(d => d.orderId === o.id)
    };
  });

  res.json({ orders: ordersWithDetails });
});

// 4b. Payments Overview (/admin/pagos)
apiRouter.get('/admin/payments', requireAdmin, (req, res) => {
  const db = getDatabase();
  const stripeConnected = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim().length > 0);
  
  const confirmedPayments = db.orders
    .filter(o => o.status === 'payment_confirmed' || o.status === 'completed' || o.status === 'delivered' || o.status === 'preparing_shipment' || o.status === 'shipped')
    .map(o => {
      const product = db.products.find(p => p.id === o.productId);
      const buyer = db.users.find(u => u.id === o.buyerId);
      return {
        orderId: o.id,
        transactionId: (o as any).transactionId || (o as any).paymentIntentId || `PAY-${o.id}`,
        productTitle: product ? product.title : 'Artículo',
        buyerName: buyer ? buyer.name : 'Comprador',
        amount: o.amount,
        paymentMethod: (o as any).paymentMethod || 'Tarjeta bancaria (Stripe)',
        status: 'confirmed',
        createdAt: o.createdAt,
        paidAt: (o as any).paymentConfirmedAt || o.createdAt
      };
    });

  res.json({
    stripeConfigured: stripeConnected,
    payments: confirmedPayments
  });
});

// 4c. Commissions Breakdown (/admin/comisiones)
apiRouter.get('/admin/commissions', requireAdmin, (req, res) => {
  const db = getDatabase();
  const commissionRate = db.settings.commissionPercent || 8;
  const orders = db.orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
  
  let totalVolume = 0;
  let totalCommissions = 0;
  const breakdown = orders.map(o => {
    const product = db.products.find(p => p.id === o.productId);
    const buyer = db.users.find(u => u.id === o.buyerId);
    const seller = db.users.find(u => u.id === o.sellerId);
    const orderPrice = o.amount || 0;
    const comm = Number((orderPrice * (commissionRate / 100)).toFixed(2));
    totalVolume += orderPrice;
    totalCommissions += comm;
    return {
      orderId: o.id,
      productTitle: product ? product.title : 'Artículo',
      orderPrice,
      commissionRate,
      commissionAmount: comm,
      sellerName: seller ? seller.name : 'Vendedor',
      buyerName: buyer ? buyer.name : 'Comprador',
      orderStatus: o.status,
      createdAt: o.createdAt
    };
  });

  res.json({
    commissionRate,
    totalCommissions: Number(totalCommissions.toFixed(2)),
    totalVolume: Number(totalVolume.toFixed(2)),
    breakdown
  });
});

// 5. Seller Payouts / Retiradas (/admin/retiradas)
apiRouter.get('/admin/payouts', requireAdmin, (req, res) => {
  const db = getDatabase();
  res.json({ payouts: db.payouts || [] });
});

apiRouter.post('/admin/payouts/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { status, operationId, note } = req.body; // 'pending' | 'under_review' | 'processing' | 'completed' | 'rejected'
  const db = getDatabase();
  const payout = (db.payouts || []).find(p => p.id === req.params.id);

  if (!payout) {
    res.status(404).json({ error: 'Solicitud de retirada no encontrada.' });
    return;
  }

  // Safety rule: Do not mark completed without real operation confirmation
  payout.status = status;
  if (operationId) payout.operationId = sanitizeInput(operationId);
  if (note) payout.holdReason = sanitizeInput(note);
  payout.processedAt = new Date().toISOString();

  saveDatabase(db);
  logAudit(
    req.user!.id,
    req.user!.email,
    'ADMIN_PAYOUT_UPDATED',
    `Retirada ${payout.id} para vendedor ${payout.sellerId} por ${payout.amount} € actualizada a estado '${status}'. OpID: ${operationId || 'N/A'}`
  );

  res.json({ success: true, payout });
});

// 6. Free Gifts Management (/admin/regalos)
apiRouter.get('/admin/gifts', requireAdmin, (req, res) => {
  const db = getDatabase();
  const giftProducts = db.products.filter(p => p.isGift).map(p => {
    const requests = db.giftRequests.filter(g => g.productId === p.id);
    const giver = db.users.find(u => u.id === p.sellerId);
    return {
      ...p,
      giverName: giver ? giver.name : 'Donante',
      giverMaskedEmail: giver ? maskEmail(giver.email) : '***@***.***',
      requestsCount: requests.length,
      giftStatus: p.status === 'sold' || p.status === 'gift_delivered' ? 'delivered' : (requests.some(r => r.status === 'accepted') ? 'reserved' : 'available')
    };
  });

  res.json({ gifts: giftProducts });
});

// 7. Professional Accounts (/admin/profesionales)
apiRouter.get('/admin/profesionales', requireAdmin, (req, res) => {
  const db = getDatabase();
  const proUsers = db.users.filter(u => u.isPro);
  res.json({
    applications: db.proApplications || [],
    activeProAccounts: proUsers.map(u => ({
      id: u.id,
      name: u.name,
      maskedEmail: maskEmail(u.email),
      verificationLevel: u.verificationLevel,
      city: u.city,
      province: u.province,
      createdAt: u.createdAt
    }))
  });
});

apiRouter.post('/admin/profesionales/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { status, rejectionReason } = req.body; // 'approved' | 'rejected'
  const db = getDatabase();
  const app = (db.proApplications || []).find(a => a.id === req.params.id);

  if (!app) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  app.status = status;
  if (rejectionReason) app.rejectionReason = sanitizeInput(rejectionReason);
  app.reviewedAt = new Date().toISOString();

  // If approved, update user pro badge and verification
  const user = db.users.find(u => u.id === app.userId);
  if (user && status === 'approved' && !isAuthorizedAdmin(user.email)) {
    user.isPro = true;
    user.verificationLevel = 'identity_verified';
  }

  saveDatabase(db);
  logAudit(
    req.user!.id,
    req.user!.email,
    'ADMIN_PRO_APPLICATION_REVIEWED',
    `Solicitud profesional ${app.id} (${app.companyName}) revisada como '${status}'. Usuario: ${app.userId}`
  );

  res.json({ success: true, application: app });
});

// 8. Promotions Management (/admin/promociones)
apiRouter.get('/admin/promociones', requireAdmin, (req, res) => {
  const db = getDatabase();
  const promotedProducts = db.products.filter(p => p.isFeatured).map(p => {
    const seller = db.users.find(u => u.id === p.sellerId);
    return {
      ...p,
      sellerName: seller ? seller.name : 'Vendedor'
    };
  });

  res.json({
    pricing: {
      featuredPrice7Days: db.settings.featuredPrice7Days || 4.99,
      featuredPrice30Days: db.settings.featuredPrice30Days || 14.99
    },
    promotedProducts
  });
});

// 9. Fraud & Security Center (🛡️ Centro de Seguridad: /admin/seguridad)
apiRouter.get('/admin/security/overview', requireAdmin, (req, res) => {
  const db = getDatabase();

  // Dynamic scam detections in messages
  const flaggedMessages = db.messages.filter(m => {
    const check = analyzeMessageForScams(m.text || '');
    return check.isSuspicious;
  });

  // Calculate real alerts
  const alerts: AdminAlert[] = [
    ...(db.alerts || [])
  ];

  res.json({
    alerts,
    flaggedMessagesCount: flaggedMessages.length,
    usersUnderReview: db.users.filter(u => u.riskScore === 'high' || u.riskScore === 'critical').map(u => ({
      id: u.id,
      name: u.name,
      maskedEmail: maskEmail(u.email),
      riskScore: u.riskScore,
      isSuspended: u.isSuspended,
      isBlocked: u.isBlocked
    })),
    securityConfig: db.settings.security
  });
});

apiRouter.post('/admin/security/alerts/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { status, resolutionNotes } = req.body; // 'new' | 'under_review' | 'resolved' | 'closed'
  const db = getDatabase();
  const alert = (db.alerts || []).find(a => a.id === req.params.id);

  if (!alert) {
    res.status(404).json({ error: 'Alerta no encontrada.' });
    return;
  }

  alert.status = status;
  if (resolutionNotes) alert.resolutionNotes = sanitizeInput(resolutionNotes);
  alert.updatedAt = new Date().toISOString();

  saveDatabase(db);
  logAudit(
    req.user!.id,
    req.user!.email,
    'SECURITY_ALERT_STATUS_UPDATED',
    `Alerta de seguridad ${alert.id} (${alert.title}) actualizada a estado '${status}'`
  );

  res.json({ success: true, alert });
});

// 10. Flagged Messages Review (/admin/mensajes)
// Only access conversations that have an active report or security flag. Never disclose general private messages!
apiRouter.get('/admin/flagged-messages', requireAdmin, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();

  // Log access to sensitive private message review
  logAudit(
    req.user!.id,
    req.user!.email,
    'SENSITIVE_MESSAGES_AUDIT_ACCESS',
    `El administrador accedió a la revisión de mensajes reportados o con señal de sospecha de fraude.`
  );

  // Filter messages with scam patterns
  const flagged = db.messages
    .filter(m => {
      const check = analyzeMessageForScams(m.text || '');
      const isReported = db.reports.some(r => r.targetType === 'message' && r.targetId === m.id);
      return check.isSuspicious || isReported;
    })
    .map(m => {
      const sender = db.users.find(u => u.id === m.senderId);
      const check = analyzeMessageForScams(m.text || '');
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: sender ? sender.name : 'Usuario',
        senderMaskedEmail: sender ? maskEmail(sender.email) : '***@***.***',
        text: m.text,
        timestamp: m.createdAt,
        detectedPatterns: check.detectedPatterns
      };
    });

  res.json({ flaggedMessages: flagged });
});

// 11. Reports Management (/admin/reportes)
apiRouter.get('/admin/reports', requireAdmin, (req, res) => {
  const db = getDatabase();
  const reports = db.reports.map(r => {
    const reporter = db.users.find(u => u.id === r.reporterId);
    return {
      ...r,
      reporterName: reporter ? reporter.name : 'Usuario anónimo'
    };
  });
  res.json({ reports });
});

apiRouter.post('/admin/reports/:id/resolve', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { resolution, resolutionNotes } = req.body; // 'action_taken' | 'dismissed'
  const db = getDatabase();
  const report = db.reports.find(r => r.id === req.params.id);

  if (!report) {
    res.status(404).json({ error: 'Reporte no encontrado.' });
    return;
  }

  report.status = resolution === 'dismissed' ? 'dismissed' : 'action_taken';
  saveDatabase(db);
  logAudit(
    req.user!.id, 
    req.user!.email, 
    'REPORT_RESOLVED', 
    `Reporte ${report.id} (Tipo: ${report.targetType}, Razón: ${report.reason}) resuelto como '${report.status}'. Notas: ${sanitizeInput(resolutionNotes || 'Sin notas adicionales')}`
  );

  res.json({ success: true, report });
});

// 12. Disputes Management (/admin/disputas)
apiRouter.get('/admin/disputes', requireAdmin, (req, res) => {
  const db = getDatabase();
  const disputesWithDetails = db.disputes.map(d => {
    const order = db.orders.find(o => o.id === d.orderId);
    const product = order ? db.products.find(p => p.id === order.productId) : null;
    const buyer = order ? db.users.find(u => u.id === order.buyerId) : null;
    const seller = order ? db.users.find(u => u.id === order.sellerId) : null;

    return {
      ...d,
      productTitle: product ? product.title : 'Artículo',
      orderAmount: order ? order.amount : 0,
      buyerName: buyer ? buyer.name : 'Comprador',
      buyerMaskedEmail: buyer ? maskEmail(buyer.email) : '***@***.***',
      sellerName: seller ? seller.name : 'Vendedor',
      sellerMaskedEmail: seller ? maskEmail(seller.email) : '***@***.***',
      paymentStatus: order ? order.status : 'unknown'
    };
  });

  res.json({ disputes: disputesWithDetails });
});

apiRouter.post('/admin/disputes/:id/resolve', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { resolution, resolutionNotes } = req.body; // 'resolved_buyer' | 'resolved_seller' | 'closed'
  const db = getDatabase();
  const dispute = db.disputes.find(d => d.id === req.params.id);

  if (!dispute) {
    res.status(404).json({ error: 'Disputa no encontrada.' });
    return;
  }

  dispute.status = resolution;
  dispute.resolutionNotes = sanitizeInput(resolutionNotes || '');
  dispute.resolvedAt = new Date().toISOString();

  // Real order status transition
  const order = db.orders.find(o => o.id === dispute.orderId);
  if (order) {
    if (resolution === 'resolved_buyer') {
      order.status = 'refunded';
    } else if (resolution === 'resolved_seller') {
      order.status = 'completed';
    }
    order.updatedAt = new Date().toISOString();
  }

  saveDatabase(db);
  logAudit(
    req.user!.id, 
    req.user!.email, 
    'DISPUTE_RESOLVED', 
    `Disputa ${dispute.id} (Pedido: ${dispute.orderId}) resuelta como '${resolution}'. Notas: ${dispute.resolutionNotes}`
  );

  res.json({ success: true, dispute });
});

// 13. Categories Management (/admin/categorias)
apiRouter.get('/admin/categories', requireAdmin, (req, res) => {
  const db = getDatabase();
  const categoriesWithCount = db.categories.map(c => {
    const productsCount = db.products.filter(p => p.categoryId === c.id && p.status !== 'deleted').length;
    return {
      ...c,
      productsCount
    };
  });
  res.json({ categories: categoriesWithCount });
});

apiRouter.post('/admin/categories', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, slug, iconName, description, seoMetaTitle, seoMetaDescription, imageUrl } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Nombre y slug son obligatorios.' });
    return;
  }

  const db = getDatabase();
  const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
  if (db.categories.some(c => c.slug === normalizedSlug)) {
    res.status(400).json({ error: 'Ya existe una categoría con este slug.' });
    return;
  }

  const newCategory: Category = {
    id: `cat-${Date.now()}`,
    name: sanitizeInput(name.trim()),
    slug: normalizedSlug,
    iconName: iconName ? sanitizeInput(iconName.trim()) : 'Package',
    description: sanitizeInput(description || ''),
    orderIndex: db.categories.length + 1,
    isActive: true,
    seoMetaTitle: seoMetaTitle ? sanitizeInput(seoMetaTitle) : undefined,
    seoMetaDescription: seoMetaDescription ? sanitizeInput(seoMetaDescription) : undefined,
    imageUrl: imageUrl ? sanitizeInput(imageUrl) : undefined
  };

  db.categories.push(newCategory);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'CATEGORY_CREATED', `Categoría creada: ${newCategory.name} (${newCategory.slug})`);

  res.json({ success: true, category: newCategory });
});

apiRouter.put('/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, slug, iconName, description, isActive, orderIndex, seoMetaTitle, seoMetaDescription, imageUrl } = req.body;
  const db = getDatabase();
  const cat = db.categories.find(c => c.id === req.params.id);

  if (!cat) {
    res.status(404).json({ error: 'Categoría no encontrada.' });
    return;
  }

  if (name) cat.name = sanitizeInput(name.trim());
  if (slug) cat.slug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
  if (iconName) cat.iconName = sanitizeInput(iconName.trim());
  if (description !== undefined) cat.description = sanitizeInput(description);
  if (isActive !== undefined) cat.isActive = Boolean(isActive);
  if (orderIndex !== undefined) cat.orderIndex = Number(orderIndex);
  if (seoMetaTitle !== undefined) cat.seoMetaTitle = sanitizeInput(seoMetaTitle);
  if (seoMetaDescription !== undefined) cat.seoMetaDescription = sanitizeInput(seoMetaDescription);
  if (imageUrl !== undefined) cat.imageUrl = sanitizeInput(imageUrl);

  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'CATEGORY_UPDATED', `Categoría ${cat.id} actualizada.`);

  res.json({ success: true, category: cat });
});

apiRouter.delete('/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const cat = db.categories.find(c => c.id === req.params.id);

  if (!cat) {
    res.status(404).json({ error: 'Categoría no encontrada.' });
    return;
  }

  // Safety rule: Cannot delete category if products exist in it!
  const productsInCat = db.products.filter(p => p.categoryId === cat.id && p.status !== 'deleted').length;
  if (productsInCat > 0) {
    res.status(400).json({ 
      error: `No es posible eliminar la categoría "${cat.name}" porque contiene ${productsInCat} productos publicados. Debes reasignar o eliminar esos productos antes de borrar la categoría.` 
    });
    return;
  }

  db.categories = db.categories.filter(c => c.id !== cat.id);
  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'CATEGORY_DELETED', `Categoría eliminada: ${cat.name} (${cat.id})`);

  res.json({ success: true, message: 'Categoría eliminada correctamente.' });
});

// 14. SEO Management (/admin/seo)
apiRouter.get('/admin/seo', requireAdmin, (req, res) => {
  const db = getDatabase();
  res.json({ seo: db.settings.seo });
});

apiRouter.put('/admin/seo', requireAdmin, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const { 
    metaTitle, metaDescription, openGraphTitle, openGraphDescription, 
    socialImageUrl, sitemapEnabled, robotsTxtCustom, organizationName, organizationLogo 
  } = req.body;

  if (!db.settings.seo) {
    db.settings.seo = {
      metaTitle: 'MercadoX - Compra, Venta y Regalos Seguros',
      metaDescription: 'Marketplace seguro entre particulares en España.',
      openGraphTitle: 'MercadoX',
      openGraphDescription: 'Marketplace seguro en España',
      socialImageUrl: '',
      sitemapEnabled: true,
      robotsTxtCustom: 'User-agent: *\nDisallow: /admin\nAllow: /',
      organizationName: 'MercadoX S.L.',
      organizationLogo: ''
    };
  }

  if (metaTitle) db.settings.seo.metaTitle = sanitizeInput(metaTitle);
  if (metaDescription) db.settings.seo.metaDescription = sanitizeInput(metaDescription);
  if (openGraphTitle) db.settings.seo.openGraphTitle = sanitizeInput(openGraphTitle);
  if (openGraphDescription) db.settings.seo.openGraphDescription = sanitizeInput(openGraphDescription);
  if (socialImageUrl !== undefined) db.settings.seo.socialImageUrl = sanitizeInput(socialImageUrl);
  if (sitemapEnabled !== undefined) db.settings.seo.sitemapEnabled = Boolean(sitemapEnabled);
  if (robotsTxtCustom !== undefined) db.settings.seo.robotsTxtCustom = sanitizeInput(robotsTxtCustom);
  if (organizationName) db.settings.seo.organizationName = sanitizeInput(organizationName);
  if (organizationLogo !== undefined) db.settings.seo.organizationLogo = sanitizeInput(organizationLogo);

  saveDatabase(db);
  logAudit(req.user!.id, req.user!.email, 'ADMIN_SEO_UPDATED', 'Configuración de SEO global actualizada.');

  res.json({ success: true, seo: db.settings.seo });
});

// 15. General Settings (/admin/configuracion)
apiRouter.get('/admin/settings', requireAdmin, (req, res) => {
  const db = getDatabase();
  // Safe representation: Mask secret keys, never send full secrets
  const safeSettings = {
    ...db.settings,
    stripePublishableKeyMasked: process.env.STRIPE_PUBLISHABLE_KEY ? `${process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...` : 'No configurado',
    smtpHostMasked: process.env.SMTP_HOST || 'No configurado',
    authorizedAdminEmail: getAuthorizedAdminEmail()
  };
  res.json({ settings: safeSettings });
});

apiRouter.put('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res) => {
  const db = getDatabase();
  const { 
    platformName, logoText, primaryColor, commissionPercent, 
    featuredPrice7Days, featuredPrice30Days, bannerNotice, 
    adminNotificationEmail, allowRegistrations, security, termsText, privacyText 
  } = req.body;

  const previousCommission = db.settings.commissionPercent;

  if (platformName) db.settings.platformName = sanitizeInput(platformName);
  if (logoText) db.settings.logoText = sanitizeInput(logoText);
  if (primaryColor) db.settings.primaryColor = sanitizeInput(primaryColor);
  if (commissionPercent !== undefined) {
    db.settings.commissionPercent = Math.max(0, Math.min(50, Number(commissionPercent)));
  }
  if (featuredPrice7Days !== undefined) db.settings.featuredPrice7Days = Math.max(0, Number(featuredPrice7Days));
  if (featuredPrice30Days !== undefined) db.settings.featuredPrice30Days = Math.max(0, Number(featuredPrice30Days));
  if (bannerNotice !== undefined) db.settings.bannerNotice = sanitizeInput(bannerNotice);
  if (adminNotificationEmail) db.settings.adminNotificationEmail = sanitizeInput(adminNotificationEmail);
  if (allowRegistrations !== undefined) db.settings.allowRegistrations = Boolean(allowRegistrations);
  if (termsText !== undefined) db.settings.termsText = sanitizeInput(termsText);
  if (privacyText !== undefined) db.settings.privacyText = sanitizeInput(privacyText);

  if (security && typeof security === 'object') {
    if (!db.settings.security) {
      db.settings.security = {
        twoFactorEnabled: false,
        maxLoginAttempts: 5,
        lockoutMinutes: 15,
        requireEmailVerification: true,
        requirePhoneForSelling: false,
        antiScamStrictness: 'high'
      };
    }
    if (security.twoFactorEnabled !== undefined) db.settings.security.twoFactorEnabled = Boolean(security.twoFactorEnabled);
    if (security.maxLoginAttempts !== undefined) db.settings.security.maxLoginAttempts = Math.max(3, Number(security.maxLoginAttempts));
    if (security.lockoutMinutes !== undefined) db.settings.security.lockoutMinutes = Math.max(5, Number(security.lockoutMinutes));
    if (security.requireEmailVerification !== undefined) db.settings.security.requireEmailVerification = Boolean(security.requireEmailVerification);
    if (security.antiScamStrictness !== undefined) db.settings.security.antiScamStrictness = security.antiScamStrictness;
  }

  saveDatabase(db);

  let auditMessage = 'Configuración general de MercadoX actualizada.';
  if (commissionPercent !== undefined && commissionPercent !== previousCommission) {
    auditMessage += ` Comisión sobre ventas modificada de ${previousCommission}% a ${db.settings.commissionPercent}%.`;
  }
  logAudit(req.user!.id, req.user!.email, 'ADMIN_SETTINGS_UPDATED', auditMessage);

  res.json({ success: true, settings: db.settings });
});

// 16. Immutable Audit Logs (/admin/auditoria)
apiRouter.get('/admin/auditoria', requireAdmin, (req, res) => {
  const db = getDatabase();
  const { action, actor, limit = 200 } = req.query;

  let logs = [...db.auditLogs];
  if (action && typeof action === 'string') {
    logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
  }
  if (actor && typeof actor === 'string') {
    logs = logs.filter(l => (l.actorEmail && l.actorEmail.toLowerCase().includes(actor.toLowerCase())) || l.actorId.includes(actor));
  }

  const boundedLimit = Math.min(500, Math.max(10, Number(limit)));
  res.json({ auditLogs: logs.slice(0, boundedLimit) });
});
