"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getOrders, 
  getBranches, 
  updateOrderStatus,
  addOrderPayment,
  Order, 
  Branch 
} from "@/lib/api";
import { TablePageSkeleton } from "@/components/page-skeletons";
import { loadSession } from "@/lib/session";
import { 
  Search, 
  Plus, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  AlertTriangle,
  Loader2,
  Clock,
  IndianRupee,
  X
} from "lucide-react";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // Search and Filters
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Status Change State
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Payment Modal State
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [paymentTargetStatus, setPaymentTargetStatus] = useState<string | null>(null);

  const loadData = () => {
    if (orders.length > 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    getOrders({
      search: search || undefined,
      branchId: branchId || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      page,
      limit: 10,
    })
      .then((res) => {
        setOrders(res.orders);
        setPagination(res.pagination);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (!s) {
      navigate("/login");
      return;
    }

    if (s.user?.role === "ADMIN") {
      getBranches()
        .then((res) => setBranches(res.branches))
        .catch((err) => console.error("Failed to load branches", err));
    }
  }, [navigate]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, page, branchId, status, paymentStatus]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (session) {
        setPage(1);
        loadData();
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // Smart Delivery Prompt: If trying to deliver but they owe money, intercept!
    if (newStatus === "DELIVERED" && Number(order.balanceAmount) > 0) {
      setSelectedOrderForPayment(order);
      setPaymentAmount(Number(order.balanceAmount));
      setPaymentMethod("CASH");
      setPaymentTargetStatus("DELIVERED");
      // Don't update status yet; they must pay first!
      return;
    }

    setUpdatingId(id);
    try {
      await updateOrderStatus(id, newStatus);
      // Update local state
      setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus as any } : o)));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status: " + (err instanceof Error ? err.message : "unknown"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedOrderForPayment || paymentAmount <= 0) return;
    
    setPaymentSubmitting(true);
    try {
      const { order } = await addOrderPayment(selectedOrderForPayment.id, {
        amount: paymentAmount,
        method: paymentMethod,
        ...(paymentTargetStatus ? { status: paymentTargetStatus } : {}),
      });
      
      // Update local order with new paid/balance amounts and potentially auto-updated DELIVERED status if they paid on delivery
      setOrders(orders.map((o) => (o.id === order.id ? order : o)));
      setSelectedOrderForPayment(null);
      
      // Settle & Print Workflow
      if (autoPrint) {
        window.open(`/orders/${order.id}/print`, '_blank');
      }
    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment failed: " + (err instanceof Error ? err.message : "unknown"));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const isOverdue = (order: Order) => {
    if (order.status === "DELIVERED") return false;
    const deliveryDate = new Date(order.expectedDeliveryDate);
    return deliveryDate < new Date();
  };

  if (!session) return null;

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Transactions</h1>
          <p className="text-sm text-muted">Manage laundry workflows, print receipts and update item status</p>
        </div>
        {session?.user?.role !== "ADMIN" && (
          <button
            onClick={() => navigate("/billing/new")}
            className="focus-ring flex h-10 items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-md hover:bg-brand/90"
          >
            <Plus className="h-4.5 w-4.5" />
            Create New Bill
          </button>
        )}
      </div>

      {/* Filter and search bar */}
      <div className="rounded-md border border-line bg-surface p-4 shadow-panel flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted" />
          <input
            className="focus-ring h-10 w-full rounded-md border border-line pl-9 pr-3 text-sm bg-white"
            placeholder="Search invoice / customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
          {session.user?.role === "ADMIN" && (
            <select
              className="focus-ring h-10 rounded-md border border-line bg-white px-3 text-sm"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="focus-ring h-10 rounded-md border border-line bg-white px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Workflow Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="WASHING">Washing</option>
            <option value="DRYING">Drying</option>
            <option value="IRONING">Ironing</option>
            <option value="READY">Ready</option>
            <option value="DELIVERED">Delivered</option>
          </select>

          <select
            className="focus-ring h-10 rounded-md border border-line bg-white px-3 text-sm"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {refreshing && (
        <div className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
          Updating orders list...
        </div>
      )}

      {/* Orders Grid/Table */}
      <div className="rounded-md border border-line bg-surface shadow-panel overflow-hidden">
        {loading && orders.length === 0 ? (
          <TablePageSkeleton rows={6} />
        ) : orders.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-1.5 p-6">
            <Clock className="h-8 w-8 text-muted" />
            <p className="text-sm font-semibold text-gray-700">No order matches found</p>
            <p className="text-xs text-muted">Try adjusting search parameters or create a new laundry bill.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-gray-50/50 text-muted">
                  <th className="px-5 py-3 font-semibold">Bill / Token</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Order Date</th>
                  <th className="px-5 py-3 font-semibold">Delivery Date</th>
                  <th className="px-5 py-3 font-semibold">Total Amount</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Workflow Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => {
                  const overdue = isOverdue(order);
                  const isReady = order.status === "READY";
                  const isDelivered = order.status === "DELIVERED";
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50/75 transition-colors ${
                        overdue 
                          ? "bg-[#fff1ef]/50 text-red-950" 
                          : isReady 
                          ? "bg-[#fffbeb]/50 text-amber-950 font-medium" 
                          : isDelivered 
                          ? "bg-gray-50/30 text-gray-500 opacity-80" 
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-800 font-mono">{order.billNumber}</div>
                        <div className="text-xs text-muted font-mono">{order.tokenNumber}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-800">{order.customer?.name || "Deleted Customer"}</div>
                        <div className="text-xs text-muted font-mono">{order.customer?.mobile}</div>
                      </td>
                      <td className="px-5 py-3.5 text-muted font-mono text-xs">
                        {new Date(order.orderDate).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs font-mono text-muted">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                        {overdue && (
                          <div className="flex items-center gap-0.5 text-red-600 font-semibold text-[10px] uppercase mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 font-mono">
                        INR {Number(order.grandTotal).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          order.paymentStatus === "PAID" 
                            ? "bg-green-50 text-green-700 border border-green-100" 
                            : order.paymentStatus === "PARTIAL"
                            ? "bg-orange-50 text-orange-700 border border-orange-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {updatingId === order.id ? (
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                          </div>
                        ) : (
                          <select
                            disabled={order.status === "DELIVERED"}
                            className={`text-xs font-semibold rounded border px-2 py-1 bg-white outline-none cursor-pointer ${
                              order.status === "DELIVERED"
                                ? "border-gray-200 text-gray-500 bg-gray-50 cursor-not-allowed"
                                : order.status === "READY"
                                ? "border-green-200 text-green-700 bg-green-50/50"
                                : "border-line text-gray-700"
                            }`}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          >
                            <option value="RECEIVED">Received</option>
                            <option value="WASHING">Washing</option>
                            <option value="DRYING">Drying</option>
                            <option value="IRONING">Ironing</option>
                            <option value="READY">Ready</option>
                            <option value="DELIVERED">Delivered</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {Number(order.balanceAmount) > 0 && (
                            <button
                              onClick={() => {
                                setSelectedOrderForPayment(order);
                                setPaymentAmount(Number(order.balanceAmount));
                                setPaymentMethod("CASH");
                                setPaymentTargetStatus(null);
                              }}
                              className="focus-ring inline-flex items-center justify-center h-8 w-8 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 shadow-sm"
                              title="Collect Payment"
                            >
                              <IndianRupee className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/orders/${order.id}/print`, '_blank')}
                            className="focus-ring inline-flex items-center justify-center h-8 w-8 rounded-md border border-line bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 shadow-sm"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5 bg-gray-50/30 text-sm">
            <span className="text-muted">
              Page <span className="font-semibold text-gray-800">{pagination.page}</span> of{" "}
              <span className="font-semibold text-gray-800">{pagination.totalPages}</span> (Total {pagination.total} orders)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="focus-ring flex items-center justify-center gap-1 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="focus-ring flex items-center justify-center gap-1 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-brand" />
                Collect Payment
              </h3>
              <button 
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between text-sm pb-4 border-b border-slate-100">
                <span className="text-slate-500">Bill Number</span>
                <span className="font-bold text-slate-900">{selectedOrderForPayment.billNumber}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Grand Total</span>
                  <span className="font-semibold text-slate-700">₹ {Number(selectedOrderForPayment.grandTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Advance Paid</span>
                  <span className="font-semibold text-slate-700">₹ {Number(selectedOrderForPayment.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Remaining Balance</span>
                  <span className="font-bold text-orange-600">₹ {Number(selectedOrderForPayment.balanceAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount to Collect (₹)</label>
                  <div className="flex h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 focus-within:border-brand focus-within:bg-white transition-colors">
                    <span className="text-sm text-slate-400 select-none">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={Number(selectedOrderForPayment.balanceAmount)}
                      step="0.01"
                      className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 font-mono"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Math.max(0, Math.min(Number(selectedOrderForPayment.balanceAmount), parseFloat(e.target.value) || 0)))}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Method</label>
                  <select
                    className="focus-ring h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CARD">Credit / Debit Card</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand accent-brand cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  Print Delivery Slip
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                  disabled={paymentSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={paymentSubmitting || paymentAmount <= 0}
                  className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {paymentSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Settle Balance</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



