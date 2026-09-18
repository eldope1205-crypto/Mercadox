export type UserRole = 'user' | 'admin';
export type VerificationLevel = 'basic' | 'verified' | 'identity_verified';
export type RiskScore = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  verificationLevel: VerificationLevel;
  riskScore: RiskScore;
  isBlocked: boolean;
  isSuspended: boolean;
  city?: string;
  province?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  verifiedIdentity: boolean;
  isPro?: boolean;
  isAuthorizedAdmin?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  iconName: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
  imageUrl?: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
}

export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';
export type ProductStatus = 
  | 'active' 
  | 'under_review' 
  | 'paused' 
  | 'sold' 
  | 'gift_reserved' 
  | 'gift_delivered' 
  | 'deleted' 
  | 'blocked';

export type ShippingMethod = 'pickup' | 'shipping' | 'both';

export interface Product {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerVerification?: VerificationLevel;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  price: number; // 0 for gifts
  isGift: boolean;
  condition: ProductCondition;
  images: string[];
  approxLocation: {
    city: string;
    province: string;
  };
  shippingMethod: ShippingMethod;
  additionalInfo?: string;
  status: ProductStatus;
  isFeatured: boolean;
  featuredUntil?: string | null;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type GiftRequestStatus = 'pending' | 'accepted' | 'rejected' | 'delivered' | 'cancelled';

export interface GiftRequest {
  id: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  requesterId: string;
  requesterName?: string;
  ownerId: string;
  status: GiftRequestStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'payment_pending' 
  | 'payment_confirmed' 
  | 'preparing_shipment' 
  | 'shipped' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled' 
  | 'refunded' 
  | 'in_dispute';

export interface Order {
  id: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  amount: number;
  commissionAmount: number;
  sellerAmount: number;
  status: OrderStatus;
  paymentProvider: 'stripe' | 'pending_setup';
  paymentIntentId?: string;
  trackingNumber?: string;
  ratingId?: string;
  shippingAddress?: {
    fullName: string;
    street?: string;
    city: string;
    postalCode: string;
    province: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  lastMessage?: string;
  lastMessageText?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  text: string;
  warningAlert?: string | null;
  isFlaggedAsScam?: boolean;
  isReported?: boolean;
  createdAt: string;
}

export interface Rating {
  id: string;
  orderId: string;
  productId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewedUserId: string;
  stars: number; // 1 - 5
  comment: string;
  createdAt: string;
}

export type DisputeReason = 
  | 'not_received' 
  | 'different_from_desc' 
  | 'damaged' 
  | 'counterfeit' 
  | 'payment_issue' 
  | 'seller_issue';

export type DisputeStatus = 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'closed';

export interface Dispute {
  id: string;
  orderId: string;
  productTitle?: string;
  openedById: string;
  openedByName?: string;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type ReportTargetType = 'product' | 'user' | 'message';
export type ReportReason = 
  | 'scam' 
  | 'prohibited_item' 
  | 'counterfeit' 
  | 'spam' 
  | 'misleading_price' 
  | 'inappropriate' 
  | 'off_platform_payment' 
  | 'suspicious_account' 
  | 'other';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitleOrName?: string;
  reporterId: string;
  reporterName?: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  socialImageUrl: string;
  sitemapEnabled: boolean;
  robotsTxtCustom: string;
  organizationName: string;
  organizationLogo: string;
}

export interface SecurityConfig {
  twoFactorEnabled: boolean;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  requireEmailVerification: boolean;
  requirePhoneForSelling: boolean;
  antiScamStrictness: 'standard' | 'high' | 'maximum';
}

export interface AdminSettings {
  platformName: string;
  logoText: string;
  faviconUrl?: string;
  primaryColor: string;
  commissionPercent: number; // Default 8%
  featuredPrice7Days: number;
  featuredPrice30Days: number;
  allowRegistrations: boolean;
  bannerNotice: string;
  bannerEnabled?: boolean;
  maintenanceMode?: boolean;
  footerLegalNotice?: string;
  adminNotificationEmail: string;
  stripeConfigured: boolean;
  smtpConfigured: boolean;
  stripePublishableKeyMasked?: string;
  smtpHostMasked?: string;
  authorizedAdminEmail?: string;
  seo?: SEOConfig;
  security?: SecurityConfig;
  termsText?: string;
  privacyText?: string;
}

export interface AdminAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedProductId?: string;
  relatedProductTitle?: string;
  signalType: string;
  status: 'new' | 'under_review' | 'resolved' | 'closed';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  cifOrNif: string;
  businessAddress: string;
  taxDocumentNote: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  sellerName?: string;
  amount: number;
  ibanMasked: string;
  method?: string;
  operationId?: string;
  status: 'pending' | 'under_review' | 'processing' | 'completed' | 'rejected';
  riskScore: RiskScore;
  holdReason?: string;
  createdAt: string;
  processedAt?: string;
}
