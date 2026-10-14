declare module "@bubbleworks/shared" {
  export type UserRole = "ADMIN" | "CASHIER";
  export type UserStatus = "ACTIVE" | "DISABLED";
  export type BranchStatus = "ACTIVE" | "INACTIVE";
  export type ServiceStatus = "ACTIVE" | "INACTIVE";
  export type PricingType = "PER_PIECE" | "PER_KG";
  export type OrderStatus = "RECEIVED" | "WASHING" | "DRYING" | "IRONING" | "READY" | "DELIVERED";
  export type PaymentMethod = "CASH" | "UPI" | "CARD" | "CREDIT";
  export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";
  export type PrinterSize = "MM_58" | "MM_80";

  export type OrderItemAddOnInput = {
    addOnId?: string;
    addOnName: string;
    rate: number;
  };

  export type BillingItemInput = {
    serviceRateId?: string;
    serviceName: string;
    productName?: string | null;
    category?: string | null;
    unit: string;
    quantity?: number;
    weightKg?: number;
    rate: number;
    gstRate?: number;
    amount?: number;
    addOns?: OrderItemAddOnInput[];
  };

  export type CreateOrderInput = {
    branchId: string;
    customerId: string;
    orderDate?: string;
    expectedDeliveryDate: string;
    status?: OrderStatus;
    discountAmount?: number;
    roundOff?: number;
    gstRate?: number;
    notes?: string;
    items: BillingItemInput[];
    initialPayment?: {
      amount: number;
      method: PaymentMethod;
      referenceNumber?: string;
    };
  };

  export type BillingTotals = {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    gstAmount: number;
    roundOff: number;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: PaymentStatus;
  };

  export function calculateItemAmount(item: BillingItemInput): number;
  export function calculateBillingTotals(input: {
    items: BillingItemInput[];
    discountAmount?: number;
    gstRate?: number;
    paidAmount?: number;
    roundOff?: number;
  }): BillingTotals;
}
