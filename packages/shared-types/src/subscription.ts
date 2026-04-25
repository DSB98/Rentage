import { SubscriptionStatus, PaymentStatus } from './enums';

export interface ISubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
  maxListings: number;
  maxContactReveals: number;
  features: Record<string, boolean>;
  isActive: boolean;
  sortOrder: number;
}

export interface IUserSubscription {
  id: string;
  userId: string;
  planId: string;
  razorpaySubId?: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  plan?: ISubscriptionPlan;
}

export interface IPayment {
  id: string;
  userId: string;
  subscriptionId?: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  invoiceUrl?: string;
  paidAt?: string;
  createdAt: string;
}
