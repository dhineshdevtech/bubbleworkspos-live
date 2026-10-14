import type { CreateOrderInput } from "@bubbleworks/shared";
import {
  fbLogin,
  fbGetBranches,
  fbCreateBranch,
  fbUpdateBranch,
  fbGetUsers,
  fbCreateCashier,
  fbUpdateUser,
  fbGetServices,
  fbCreateService,
  fbUpdateService,
  fbDeleteService,
  fbGetCategories,
  fbCreateCategory,
  fbUpdateCategory,
  fbDeleteCategory,
  fbGetProducts,
  fbCreateProduct,
  fbUpdateProduct,
  fbDeleteProduct,
  fbGetRates,
  fbCreateRate,
  fbUpdateRate,
  fbDeleteRate,
  fbGetAddOns,
  fbCreateAddOn,
  fbUpdateAddOn,
  fbDeleteAddOn,
  fbGetSettings,
  fbUpdateSettings,
  fbGetCustomers,
  fbSearchCustomers,
  fbCreateCustomer,
  fbUpdateCustomer,
  fbDeleteCustomer,
  fbGetCustomerProfile,
  fbGetOrderNumberPreview,
  fbCreateOrder,
  fbGetOrders,
  fbGetOrder,
  fbUpdateOrderStatus,
  fbAddOrderPayment,
  fbRecordOrderPrint,
  fbRecordOrderReprint,
  fbGetReports,
  fbClearTransactionData,
  fbGetPublicOrderStatus,
} from "./firebaseDb";

export type ApiSession = {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: "ADMIN" | "CASHIER";
    branchId: string | null;
    branch?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  mobile: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  mobile: string;
  username: string;
  role: "ADMIN" | "CASHIER";
  status: "ACTIVE" | "DISABLED";
  branchId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  branch?: {
    name: string;
    code: string;
  } | null;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type ItemCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRate = {
  id: string;
  serviceId: string;
  productId: string | null;
  categoryId: string | null;
  unit: string;
  rate: number;
  gstRate: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  service?: { id: string; name: string };
  product?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
};

export type AddOn = {
  id: string;
  name: string;
  rate: number;
  unit: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type GlobalSettings = {
  id: string;
  businessName: string;
  logoUrl: string | null;
  address: string;
  mobile: string;
  gstNumber: string;
  defaultGstRate: number;
  printerSize: "MM_58" | "MM_80";
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  branchId: string;
  name: string;
  mobile: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    name: string;
    code: string;
  } | null;
};

export type CustomerProfile = {
  customer: Customer;
  stats: {
    totalOrders: number;
    totalAmountSpent: number;
    outstandingBalance: number;
    lastVisit: string | null;
  };
  orders: Array<{
    id: string;
    billNumber: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    orderDate: string;
    status: string;
  }>;
};

export type Order = {
  id: string;
  branchId: string;
  customerId: string;
  createdById: string;
  billNumber: string;
  tokenNumber: string;
  status: "RECEIVED" | "WASHING" | "DRYING" | "IRONING" | "READY" | "DELIVERED";
  orderDate: string;
  expectedDeliveryDate: string;
  deliveredDate: string | null;
  subtotal: number;
  discountAmount: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  notes: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    name: string;
    mobile: string;
  };
  branch?: {
    name: string;
    code: string;
    address?: string;
    mobile?: string;
  };
};

export class ApiError extends Error {
  details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

export type { CreateOrderInput } from "@bubbleworks/shared";

// =========================================================================
// Firebase-Powered API Handlers
// =========================================================================

// 1. Auth
export async function login(input: { username: string; password: string }): Promise<ApiSession> {
  return fbLogin(input);
}

// 2. Branches
export async function getBranches(): Promise<{ branches: Branch[] }> {
  return fbGetBranches();
}

export async function createBranch(input: Omit<Branch, "id" | "createdAt" | "updatedAt">): Promise<{ branch: Branch }> {
  return fbCreateBranch(input);
}

export async function updateBranch(id: string, input: Partial<Omit<Branch, "id" | "createdAt" | "updatedAt">>): Promise<{ branch: Branch }> {
  return fbUpdateBranch(id, input);
}

export async function activateBranch(id: string): Promise<{ branch: Branch }> {
  return fbUpdateBranch(id, { status: "ACTIVE" });
}

export async function deactivateBranch(id: string): Promise<{ branch: Branch }> {
  return fbUpdateBranch(id, { status: "INACTIVE" });
}

export async function getBranchOrders(id: string): Promise<{ orders: any[] }> {
  const result = await fbGetOrders({ branchId: id });
  return { orders: result.orders };
}

export async function getBranchRevenue(id: string): Promise<{ branchId: string; totalRevenue: number; totalSales: number; orderCount: number }> {
  const reports = await fbGetReports(id);
  return {
    branchId: id,
    totalRevenue: reports.kpis.totalRevenue,
    totalSales: reports.kpis.totalSales,
    orderCount: reports.kpis.orderCount,
  };
}

// 3. Users / Cashiers
export async function getUsers(): Promise<{ users: User[] }> {
  return fbGetUsers();
}

export async function createCashier(input: { name: string; mobile: string; username: string; password?: string; branchId: string }): Promise<{ user: User }> {
  return fbCreateCashier(input);
}

export async function updateUser(id: string, input: Partial<Omit<User, "id" | "role" | "status" | "createdAt">> & { password?: string }): Promise<{ user: User }> {
  return fbUpdateUser(id, input);
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  await fbUpdateUser(id, { password });
}

export async function enableUser(id: string): Promise<{ user: Partial<User> }> {
  return fbUpdateUser(id, { status: "ACTIVE" });
}

export async function disableUser(id: string): Promise<{ user: Partial<User> }> {
  return fbUpdateUser(id, { status: "DISABLED" });
}

// 4. Services
export async function getServices(): Promise<{ services: Service[] }> {
  return fbGetServices();
}

export async function createService(input: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<{ service: Service }> {
  return fbCreateService(input);
}

export async function updateService(id: string, input: Partial<Omit<Service, "id" | "createdAt" | "updatedAt">>): Promise<{ service: Service }> {
  return fbUpdateService(id, input);
}

export async function deleteService(id: string): Promise<void> {
  return fbDeleteService(id);
}

export async function activateService(id: string): Promise<{ service: Service }> {
  return fbUpdateService(id, { status: "ACTIVE" });
}

export async function deactivateService(id: string): Promise<{ service: Service }> {
  return fbUpdateService(id, { status: "INACTIVE" });
}

// 5. Settings
export async function getSettings(): Promise<{ settings: GlobalSettings }> {
  return fbGetSettings();
}

export async function updateBusinessSettings(input: { businessName: string; logoUrl?: string | null; address: string; mobile: string; gstNumber?: string }): Promise<{ settings: GlobalSettings }> {
  return fbUpdateSettings(input);
}

export async function updateTaxSettings(defaultGstRate: number): Promise<{ settings: GlobalSettings }> {
  return fbUpdateSettings({ defaultGstRate });
}

export async function updatePrinterSettings(printerSize: "MM_58" | "MM_80"): Promise<{ settings: GlobalSettings }> {
  return fbUpdateSettings({ printerSize });
}

// 6. Customers
export async function getCustomers(params: {
  search?: string;
  branchId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  customers: Customer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  return fbGetCustomers(params);
}

export async function searchCustomers(query: string, branchId?: string): Promise<{ customers: Customer[] }> {
  return fbSearchCustomers(query, branchId);
}

export async function createCustomer(input: Omit<Customer, "id" | "createdAt" | "updatedAt" | "branch">): Promise<{ customer: Customer }> {
  return fbCreateCustomer(input);
}

export async function updateCustomer(id: string, input: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt" | "branch">>): Promise<{ customer: Customer }> {
  return fbUpdateCustomer(id, input);
}

export async function deleteCustomer(id: string): Promise<void> {
  return fbDeleteCustomer(id);
}

export async function getCustomerProfile(id: string): Promise<CustomerProfile> {
  return fbGetCustomerProfile(id);
}

// 7. Orders
export async function getOrders(params: {
  search?: string;
  branchId?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  orders: Order[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  return fbGetOrders(params);
}

export async function getOrderNumberPreview(branchId?: string): Promise<{
  billNumber: string;
  tokenNumber: string;
  sequenceDate: string;
}> {
  return fbGetOrderNumberPreview(branchId);
}

export async function createOrder(input: CreateOrderInput): Promise<{ order: Order }> {
  return fbCreateOrder(input);
}

export async function getOrder(id: string): Promise<{
  order: Order & {
    items: Array<{
      id: string;
      serviceNameSnapshot: string;
      pricingType: "PER_PIECE" | "PER_KG";
      quantity: number | null;
      weightKg: number | null;
      rate: number;
      amount: number;
    }>;
    payments: Array<{
      id: string;
      method: string;
      amount: number;
      paidAt: string;
      receivedBy: { name: string };
    }>;
    printLogs: Array<{
      id: string;
      printType: string;
      printCount: number;
      printedAt: string;
      user: { name: string };
    }>;
  };
}> {
  return fbGetOrder(id);
}

export async function updateOrderStatus(id: string, status: string): Promise<{ order: Order }> {
  return fbUpdateOrderStatus(id, status);
}

export async function addOrderPayment(id: string, payload: { amount: number; method: string; referenceNumber?: string; status?: string }): Promise<{ order: Order }> {
  return fbAddOrderPayment(id, payload);
}

export async function recordOrderPrint(id: string): Promise<any> {
  return fbRecordOrderPrint(id);
}

export async function recordOrderReprint(id: string): Promise<any> {
  return fbRecordOrderReprint(id);
}

export async function downloadInvoicePdf(id: string, billNumber: string): Promise<void> {
  window.open(`/orders/${id}/print`, "_blank");
}

export async function downloadReportsPdf(branchId?: string, startDate?: string, endDate?: string): Promise<void> {
  window.print();
}

export async function getReports(branchId?: string, startDate?: string, endDate?: string): Promise<any> {
  return fbGetReports(branchId, startDate, endDate);
}

export async function clearTransactionData(confirmText: string): Promise<any> {
  return fbClearTransactionData(confirmText);
}

export async function getPublicOrderStatus(billNumber: string, mobile: string): Promise<any> {
  return fbGetPublicOrderStatus(billNumber, mobile);
}

// 8. Products
export async function getProducts(): Promise<{ products: Product[] }> {
  return fbGetProducts();
}

export async function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<{ product: Product }> {
  return fbCreateProduct(input);
}

export async function updateProduct(id: string, input: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<{ product: Product }> {
  return fbUpdateProduct(id, input);
}

export async function deleteProduct(id: string): Promise<void> {
  return fbDeleteProduct(id);
}

// 9. Categories
export async function getCategories(): Promise<{ categories: ItemCategory[] }> {
  return fbGetCategories();
}

export async function createCategory(input: { name: string }): Promise<{ category: ItemCategory }> {
  return fbCreateCategory(input);
}

export async function updateCategory(id: string, input: { name: string }): Promise<{ category: ItemCategory }> {
  return fbUpdateCategory(id, input);
}

export async function deleteCategory(id: string): Promise<void> {
  return fbDeleteCategory(id);
}

// 10. Rates
export async function getRates(): Promise<{ rates: ServiceRate[] }> {
  return fbGetRates();
}

export async function createRate(input: {
  serviceId: string;
  productId?: string | null;
  categoryId?: string | null;
  unit: string;
  rate: number;
  gstRate?: number;
  status?: "ACTIVE" | "INACTIVE";
}): Promise<{ rate: ServiceRate }> {
  return fbCreateRate(input);
}

export async function updateRate(id: string, input: Partial<{
  serviceId: string;
  productId: string | null;
  categoryId: string | null;
  unit: string;
  rate: number;
  gstRate: number;
  status: "ACTIVE" | "INACTIVE";
}>): Promise<{ rate: ServiceRate }> {
  return fbUpdateRate(id, input);
}

export async function deleteRate(id: string): Promise<void> {
  return fbDeleteRate(id);
}

// 11. AddOns
export async function getAddOns(): Promise<{ addons: AddOn[] }> {
  return fbGetAddOns();
}

export async function createAddOn(input: Omit<AddOn, "id" | "createdAt" | "updatedAt">): Promise<{ addon: AddOn }> {
  return fbCreateAddOn(input);
}

export async function updateAddOn(id: string, input: Partial<Omit<AddOn, "id" | "createdAt" | "updatedAt">>): Promise<{ addon: AddOn }> {
  return fbUpdateAddOn(id, input);
}

export async function deleteAddOn(id: string): Promise<void> {
  return fbDeleteAddOn(id);
}
