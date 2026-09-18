import { 
  User, Category, Product, GiftRequest, Order, 
  Conversation, ChatMessage, Rating, Dispute, Report, 
  AuditLog, AdminSettings 
} from '../types.js';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const adminKey = localStorage.getItem('mercadox_admin_key');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (adminKey) {
    headers['x-admin-key'] = adminKey;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // Sends session cookies
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || data.message || 'Ha ocurrido un error en la solicitud.';
    const errorObj = new Error(errorMsg) as Error & { details?: any; code?: string };
    errorObj.details = data.details;
    errorObj.code = data.code;
    throw errorObj;
  }

  return data as T;
}

export const api = {
  // Public config
  getConfig: () => fetchApi<{
    platformName: string;
    logoText: string;
    primaryColor: string;
    commissionPercent: number;
    featuredPrice7Days: number;
    featuredPrice30Days: number;
    bannerNotice: string;
    stripeConfigured: boolean;
    smtpConfigured: boolean;
  }>('/api/config/public'),

  // Auth
  register: (data: { email: string; password: string; name: string; phone?: string; city?: string; province?: string }) =>
    fetchApi<{ user: User; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchApi<{ user: User; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => fetchApi<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  getMe: () => fetchApi<{ user: User }>('/api/auth/me'),

  verifyPhone: (phone: string) =>
    fetchApi<{ success: boolean; user: User; message: string }>('/api/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phone })
    }),

  verifyIdentity: () =>
    fetchApi<{ success: boolean; user: User; message: string }>('/api/auth/verify-identity', {
      method: 'POST'
    }),

  // Categories
  getCategories: () => fetchApi<{ categories: Category[] }>('/api/categories'),

  // Products
  getProducts: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') {
        query.append(k, String(v));
      }
    }
    return fetchApi<{ total: number; products: Product[] }>(`/api/products?${query.toString()}`);
  },

  getProduct: (id: string) =>
    fetchApi<{
      product: Product;
      seller: {
        id: string;
        name: string;
        verificationLevel: string;
        city?: string;
        province?: string;
        createdAt: string;
        totalCompletedSales: number;
        ratingAverage: number;
        totalRatings: number;
        ratings: Rating[];
      } | null;
      relatedProducts: Product[];
    }>(`/api/products/${id}`),

  createProduct: (data: Partial<Product>) =>
    fetchApi<{ success: boolean; product: Product; message: string }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProduct: (id: string, data: Partial<Product>) =>
    fetchApi<{ success: boolean; product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteProduct: (id: string) =>
    fetchApi<{ success: boolean; message: string }>(`/api/products/${id}`, {
      method: 'DELETE'
    }),

  // Gifts
  requestGift: (productId: string, message?: string) =>
    fetchApi<{ success: boolean; request: GiftRequest; message: string }>(`/api/gifts/${productId}/request`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  getGiftRequests: () => fetchApi<{ sent: GiftRequest[]; received: GiftRequest[] }>('/api/gifts/requests'),

  actionGiftRequest: (id: string, action: 'accept' | 'reject' | 'deliver' | 'cancel') =>
    fetchApi<{ success: boolean; request: GiftRequest; productStatus?: string }>(`/api/gifts/requests/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action })
    }),

  // Chat
  getConversations: () => fetchApi<{ conversations: Conversation[] }>('/api/chat/conversations'),

  startConversation: (productId: string) =>
    fetchApi<{ conversation: Conversation }>('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }),

  getMessages: (conversationId: string) =>
    fetchApi<{ conversation: Conversation; messages: ChatMessage[] }>(`/api/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, text: string) =>
    fetchApi<{ message: ChatMessage }>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, text })
    }),

  // Orders
  createOrder: (productId: string, shippingAddress?: any) =>
    fetchApi<{ success: boolean; order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ productId, shippingAddress })
    }),

  getMyOrders: () => fetchApi<{ purchases: Order[]; sales: Order[] }>('/api/orders/my-orders'),

  updateOrderStatus: (id: string, status: string, trackingNumber?: string) =>
    fetchApi<{ success: boolean; order: Order }>(`/api/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, trackingNumber })
    }),

  // Ratings
  submitRating: (data: { orderId: string; stars: number; comment?: string }) =>
    fetchApi<{ success: boolean; rating: Rating }>('/api/ratings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Disputes
  openDispute: (data: { orderId: string; reason: string; description: string; evidenceUrls?: string[] }) =>
    fetchApi<{ success: boolean; dispute: Dispute }>('/api/disputes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Reports
  submitReport: (data: { targetType: 'product' | 'user' | 'message'; targetId: string; reason: string; details?: string }) =>
    fetchApi<{ success: boolean; message: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Favorites
  getFavorites: () => fetchApi<{ favorites: Product[]; favoriteIds: string[] }>('/api/favorites'),

  toggleFavorite: (productId: string) =>
    fetchApi<{ success: boolean; isFavorite: boolean }>(`/api/favorites/${productId}`, {
      method: 'POST'
    }),

  // Admin
  // Password recovery
  forgotPassword: (email: string) =>
    fetchApi<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (token: string, newPassword: string) =>
    fetchApi<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    }),

  // Admin APIs (strictly server-side authenticated)
  getAdminMetrics: () =>
    fetchApi<{
      users: { registered: number; verified: number; suspended: number; underReview: number };
      products: { published: number; sold: number; gifted: number; underReview: number; reported: number };
      sales: { orders: number; confirmed: number; cancellations: number; refunds: number; disputes: number };
      finance: { volume: number; commissions: number; promotions: number; pendingBalances: number; payouts: number; commissionPercent: number };
      security: { alerts: number; reports: number; suspiciousCases: number; fraudAttempts: number; blockedAccounts: number };
    }>('/api/admin/metrics'),

  getAdminUsers: (search?: string) =>
    fetchApi<{ users: any[] }>(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getAdminUserDetails: (userId: string) =>
    fetchApi<{
      user: any;
      listings: any[];
      sales: any[];
      purchases: any[];
      reports: any[];
    }>(`/api/admin/users/${userId}/details`),

  adminUserAction: (userId: string, action: string, riskScore?: string, reason?: string) =>
    fetchApi<{ success: boolean; message: string }>(`/api/admin/users/${userId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, riskScore, reason })
    }),

  getAdminProducts: (params?: { categoryId?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    return fetchApi<{ products: any[] }>(`/api/admin/products?${q.toString()}`);
  },

  adminProductAction: (productId: string, action: string, reason?: string) =>
    fetchApi<{ success: boolean; product: any }>(`/api/admin/products/${productId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason })
    }),

  getAdminOrders: () =>
    fetchApi<{ orders: any[] }>('/api/admin/orders'),

  getAdminPayments: () =>
    fetchApi<{ stripeConfigured: boolean; payments: any[] }>('/api/admin/payments'),

  getAdminCommissions: () =>
    fetchApi<{
      commissionRate: number;
      totalCommissions: number;
      totalVolume: number;
      breakdown: any[];
    }>('/api/admin/commissions'),

  getAdminPayouts: () =>
    fetchApi<{ payouts: any[] }>('/api/admin/payouts'),

  updateAdminPayoutStatus: (payoutId: string, status: string, operationId?: string, note?: string) =>
    fetchApi<{ success: boolean; payout: any }>(`/api/admin/payouts/${payoutId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, operationId, note })
    }),

  getAdminGifts: () =>
    fetchApi<{ gifts: any[] }>('/api/admin/gifts'),

  getAdminProApplications: () =>
    fetchApi<{ applications: any[]; activeProAccounts: any[] }>('/api/admin/profesionales'),

  updateAdminProApplicationStatus: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) =>
    fetchApi<{ success: boolean; application: any }>(`/api/admin/profesionales/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason })
    }),

  getAdminPromotions: () =>
    fetchApi<{ pricing: { featuredPrice7Days: number; featuredPrice30Days: number }; promotedProducts: any[] }>('/api/admin/promociones'),

  getAdminSecurityOverview: () =>
    fetchApi<{
      alerts: any[];
      flaggedMessagesCount: number;
      usersUnderReview: any[];
      securityConfig: any;
    }>('/api/admin/security/overview'),

  updateAdminAlertStatus: (alertId: string, status: string, resolutionNotes?: string) =>
    fetchApi<{ success: boolean; alert: any }>(`/api/admin/security/alerts/${alertId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, resolutionNotes })
    }),

  getAdminFlaggedMessages: () =>
    fetchApi<{ flaggedMessages: any[] }>('/api/admin/flagged-messages'),

  getAdminReports: () =>
    fetchApi<{ reports: any[] }>('/api/admin/reports'),

  resolveReport: (reportId: string, resolution: 'action_taken' | 'dismissed', resolutionNotes?: string) =>
    fetchApi<{ success: boolean; report: Report }>(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, resolutionNotes })
    }),

  getAdminDisputes: () =>
    fetchApi<{ disputes: any[] }>('/api/admin/disputes'),

  resolveDispute: (disputeId: string, resolution: 'resolved_buyer' | 'resolved_seller' | 'closed', resolutionNotes?: string) =>
    fetchApi<{ success: boolean; dispute: Dispute }>(`/api/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, resolutionNotes })
    }),

  getAdminCategories: () =>
    fetchApi<{ categories: Category[] }>('/api/admin/categories'),

  createCategory: (data: Partial<Category>) =>
    fetchApi<{ success: boolean; category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCategory: (id: string, data: Partial<Category>) =>
    fetchApi<{ success: boolean; category: Category }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCategory: (id: string) =>
    fetchApi<{ success: boolean; message: string }>(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    }),

  getAdminSEO: () =>
    fetchApi<{ seo: any }>('/api/admin/seo'),

  updateAdminSEO: (data: any) =>
    fetchApi<{ success: boolean; seo: any }>('/api/admin/seo', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminSettings: () =>
    fetchApi<{ settings: AdminSettings }>('/api/admin/settings'),

  updateAdminSettings: (data: Partial<AdminSettings>) =>
    fetchApi<{ success: boolean; settings: AdminSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminAuditLogs: (params?: { action?: string; actor?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.set('action', params.action);
    if (params?.actor) q.set('actor', params.actor);
    if (params?.limit) q.set('limit', String(params.limit));
    return fetchApi<{ auditLogs: AuditLog[] }>(`/api/admin/auditoria?${q.toString()}`);
  }
};
