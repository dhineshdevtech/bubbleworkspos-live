"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getOrder, 
  getSettings,
  recordOrderPrint, 
  recordOrderReprint, 
  downloadInvoicePdf 
} from "@/lib/api";
import { loadSession } from "@/lib/session";
import { Loader2, Printer, Download, ArrowLeft, RefreshCw, Bluetooth, BluetoothOff, BluetoothSearching } from "lucide-react";
import { connectPrinter, disconnectPrinter, printBubbleworksReceipt } from "@/lib/bluetoothPrinter";

export default function OrderPrintPage() {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();

  const [session, setSession] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printerSize, setPrinterSize] = useState<"MM_58" | "MM_80">("MM_80");
  const [slipType, setSlipType] = useState<"BOOKING" | "DELIVERY">("BOOKING");
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "success" | "error">("idle");
  const [copyType, setCopyType] = useState<"BOTH" | "CUSTOMER" | "SHOP">("BOTH");
  const [bleStatus, setBleStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [bleError, setBleError] = useState("");

  const loadData = () => {
    if (!orderId) return;
    setError("");
    Promise.all([getOrder(orderId), getSettings()])
      .then(([{ order: o }, { settings: s }]) => {
        setOrder(o);
        setSettings(s);
        setPrinterSize(s?.printerSize || "MM_80");
        setSlipType(o.status === "RECEIVED" ? "BOOKING" : "DELIVERY");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load order printable receipt");
        setLoading(false);
      });
  };

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (!s) {
      navigate("/login");
      return;
    }
    loadData();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 no-print">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-muted">Retrieving order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-600 no-print">
        <p className="font-semibold">Error Loading Invoice</p>
        <p>{error || "Order details could not be found."}</p>
        <button
          onClick={loadData}
          className="mt-3 flex items-center gap-1.5 font-semibold text-brand hover:underline text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry Loading
        </button>
      </div>
    );
  }

  const handlePrint = async () => {
    setPrintStatus("printing");
    try {
      // Determine if there is already an ORIGINAL print log for this order
      const hasOriginalPrint = order.printLogs.some((l: any) => l.printType === "ORIGINAL");
      
      if (!hasOriginalPrint) {
        await recordOrderPrint(order.id);
      } else {
        await recordOrderReprint(order.id);
      }
      
      // Reload print logs counters
      const { order: updated } = await getOrder(order.id);
      setOrder(updated);
      
      // Trigger browser print
      window.print();
      setPrintStatus("success");
    } catch (err) {
      console.error(err);
      setPrintStatus("error");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadInvoicePdf(order.id, order.billNumber);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF invoice");
    }
  };

  const handleConnectBle = async () => {
    setBleError("");
    setBleStatus("connecting");
    try {
      await connectPrinter();
      setBleStatus("connected");
    } catch (err: any) {
      setBleError(err.message || "Failed to connect to Bluetooth printer");
      setBleStatus("idle");
    }
  };

  const handleDisconnectBle = () => {
    disconnectPrinter();
    setBleStatus("idle");
  };

  const handleBlePrint = async () => {
    setBleError("");
    setPrintStatus("printing");
    try {
      const hasOriginalPrint = order.printLogs.some((l: any) => l.printType === "ORIGINAL");
      if (!hasOriginalPrint) {
        await recordOrderPrint(order.id);
      } else {
        await recordOrderReprint(order.id);
      }
      
      const { order: updated } = await getOrder(order.id);
      setOrder(updated);
      
      await printBubbleworksReceipt(updated, settings, printerSize, slipType, copyType);
      setPrintStatus("success");
    } catch (err: any) {
      console.error(err);
      setBleError(err.message || "Failed to print via Bluetooth");
      setPrintStatus("error");
    }
  };

  const hasPrintedOriginal = order.printLogs.some((l: any) => l.printType === "ORIGINAL");
  
  // Status check URL for customer QR code
  // Generate a URL on the domain that shows order status lookup
  const webDomain = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const orderLookupUrl = `${webDomain}/orders/status?bill=${order.billNumber}&phone=${order.customer.mobile}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pb-12">
      {/* Print styles */}
      <style>{`
        @media print {
          /* Hide everything except the print container */
          body * {
            visibility: hidden;
          }
          .print-wrapper, .print-wrapper * {
            visibility: visible;
          }
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          /* Page setup */
          @page {
            margin: 0;
          }
          body {
            background: white !important;
          }

          /* Dimensions */
          .print-container {
            width: ${printerSize === "MM_58" ? "58mm" : "80mm"} !important;
            padding: 2mm !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            color: black !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-header {
            font-size: 16px !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 no-print shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/orders")}
              className="focus-ring flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:flex items-center gap-2">
              <Printer className="h-5 w-5 text-brand" /> Print Center
            </h1>
          </div>
          {bleError && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-pulse">
              {bleError}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Analytics */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Print Methods Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-slate-50/50">
                <h2 className="text-sm font-bold tracking-wide text-gray-900 uppercase">Print Methods</h2>
                <p className="text-xs text-gray-500 mt-1">Choose how you want to print this receipt.</p>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Copy Type Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Receipt Copy Type</label>
                  <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                    <button
                      onClick={() => setCopyType("BOTH")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        copyType === "BOTH" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Print Both
                    </button>
                    <button
                      onClick={() => setCopyType("CUSTOMER")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        copyType === "CUSTOMER" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Customer Copy
                    </button>
                    <button
                      onClick={() => setCopyType("SHOP")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        copyType === "SHOP" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Shop Copy
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Desktop Printing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Wired / Desktop</h3>
                    
                    {/* Size Selector Segmented Control */}
                    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <button
                        onClick={() => setPrinterSize("MM_80")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          printerSize === "MM_80" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        80 mm
                      </button>
                      <button
                        onClick={() => setPrinterSize("MM_58")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          printerSize === "MM_58" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        58 mm
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePrint}
                    className="focus-ring w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white shadow-md hover:bg-gray-800 transition-all active:scale-[0.98]"
                  >
                    <Printer className="h-5 w-5" />
                    {hasPrintedOriginal ? "Reprint via Browser" : "Print via Browser"}
                  </button>
                </div>

                <hr className="border-gray-100" />

                {/* Wireless Printing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      Bluetooth <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Android / Windows</span>
                    </h3>
                    {bleStatus === "connected" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Connected
                      </span>
                    )}
                  </div>

                  {bleStatus === "connected" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleBlePrint}
                        className="focus-ring flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
                      >
                        <Bluetooth className="h-5 w-5" />
                        Wireless Print
                      </button>
                      <button
                        onClick={handleDisconnectBle}
                        className="focus-ring flex h-12 w-12 items-center justify-center rounded-xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200 transition-all"
                        title="Disconnect Bluetooth"
                      >
                        <BluetoothOff className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectBle}
                      disabled={bleStatus === "connecting"}
                      className="focus-ring w-full flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-blue-100 bg-blue-50/50 px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {bleStatus === "connecting" ? (
                        <>
                          <BluetoothSearching className="h-5 w-5 animate-pulse" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Bluetooth className="h-5 w-5" />
                          Connect Wireless Printer
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Export Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Digital Copy</h3>
                <p className="text-xs text-gray-500 mt-0.5">Save as A4 PDF document</p>
              </div>
              <button
                onClick={handleDownloadPdf}
                className="focus-ring flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>

          </div>

          {/* Right Column: Live Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-200/50 rounded-3xl border border-slate-200 p-8 sm:p-12 flex-1 flex items-start justify-center overflow-x-auto relative shadow-inner">
              
              {/* Decorative top tape */}
              <div className="absolute top-6 w-32 h-6 bg-white/40 backdrop-blur-sm shadow-sm rotate-2 z-10 border border-white/60"></div>
              
              {/* Print Wrapper (Visible in print) */}
              <div className="print-wrapper relative flex flex-col gap-8 items-center">
                {/* 1. Customer Copy */}
                {(copyType === "BOTH" || copyType === "CUSTOMER") && (
                  <div 
                    className="bg-white p-3 print-container font-mono text-black uppercase leading-tight shadow-md print:shadow-none"
                    style={{ 
                      width: printerSize === "MM_58" ? "58mm" : "80mm", 
                      minHeight: "400px",
                      fontSize: printerSize === "MM_58" ? "10px" : "12px",
                      fontWeight: 600
                    }}
                  >
                    {/* Header */}
                    <div className="pb-2">
                      <div className="text-center">
                        <div className="font-bold text-base">{settings?.businessName || "BUBBLEWORKS"}</div>
                        {(order.branch?.address || settings?.address) && <div>{order.branch?.address || settings?.address}</div>}
                        {(order.branch?.mobile || settings?.mobile) && <div>Mobile: {order.branch?.mobile || settings?.mobile}</div>}
                      </div>
                      {settings?.gstNumber && <div className="mt-1 text-left">GST No :{settings.gstNumber}</div>}
                    </div>

                    {/* Title */}
                    <div className="text-center pt-1 pb-2">
                      <div className="inline-block px-2 border-b border-dashed border-black">
                        {slipType === "BOOKING" ? "BOOKING SLIP" : "DELIVERY SLIP"}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="pb-1 space-y-0.5 break-words">
                      {slipType === "DELIVERY" && (
                        <>
                          <div>
                            DELIVERY NO :{order.billNumber} ({new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})})
                          </div>
                          <div>{new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                        </>
                      )}
                      
                      {slipType === "DELIVERY" ? (
                        <>
                          <div>ORDER NO :{order.tokenNumber}</div>
                          <div>ORDER DATE :{new Date(order.orderDate).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</div>
                          <div>ORDER TIME :{new Date(order.orderDate).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
                        </>
                      ) : (
                        <>
                          <div className="border-b border-dashed border-black pb-1 mb-1 text-center font-bold">
                            EXP. DELIVERY: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).toUpperCase()}
                          </div>
                          <div>
                            ORDER NO :{order.tokenNumber} <br/>({new Date(order.orderDate).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}):{new Date(order.orderDate).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </>
                      )}
                      <div className="pt-1">To.</div>
                      <div className="truncate">{order.customer.name}</div>
                    </div>

                    {/* Table */}
                    <div className="border-t border-b border-dashed border-black py-0.5 my-1">
                      <table className="w-full text-left table-fixed">
                        <thead>
                          <tr>
                            <th className="font-semibold py-0.5">PARTICULARS</th>
                            <th className="font-semibold py-0.5 text-center border-l border-dashed border-black w-8">QTY</th>
                            <th className="font-semibold py-0.5 text-right border-l border-dashed border-black w-10">Rate</th>
                            <th className="font-semibold py-0.5 text-right border-l border-dashed border-black w-12">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item: any) => {
                            const itemName = item.productNameSnapshot 
                              ? `${item.productNameSnapshot} - ${item.serviceNameSnapshot}`
                              : item.serviceNameSnapshot;
                            const isKg = item.pricingType === "PER_KG";
                            const qtyLabel = isKg ? `${Number(item.weightKg).toFixed(1)}kg` : `${item.quantity}pc`;

                            return (
                              <tr key={item.id}>
                                <td className="py-0.5 pr-1 text-[10px] sm:text-[11px] break-words leading-tight" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                                  {itemName}
                                </td>
                                <td className="py-0.5 text-center border-l border-dashed border-black whitespace-nowrap">
                                  {qtyLabel}
                                </td>
                                <td className="py-0.5 text-right border-l border-dashed border-black">{Number(item.rate).toFixed(0)}</td>
                                <td className="py-0.5 text-right border-l border-dashed border-black">{Number(item.amount).toFixed(0)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="py-1">
                      <table className="w-full text-left">
                        <tbody>
                          <tr>
                            <td className="w-3/5">NET AMOUNT</td>
                            <td className="w-[10px] text-center">:</td>
                            <td className="text-right">{Number(order.grandTotal).toFixed(2)}</td>
                          </tr>
                          
                          {slipType === "BOOKING" ? (
                            <>
                              <tr>
                                <td>ADVANCE AMOUNT</td>
                                <td className="text-center">:</td>
                                <td className="text-right">{Number(order.paidAmount).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td>BALANCE</td>
                                <td className="text-center">:</td>
                                <td className="text-right">{Number(order.balanceAmount).toFixed(2)}</td>
                              </tr>
                            </>
                          ) : (
                            <>
                              {(() => {
                                const sortedPayments = (order.payments || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                                const finalSettlement = sortedPayments.length > 0 ? sortedPayments[sortedPayments.length - 1] : { amount: 0, method: "Cash" };
                                const advanceTotal = sortedPayments.length > 1 ? sortedPayments.slice(0, -1).reduce((sum: number, p: any) => sum + Number(p.amount), 0) : 0;
                                
                                return (
                                  <>
                                    <tr>
                                      <td className="border-b border-dashed border-black pb-1">ADVANCE AMOUNT</td>
                                      <td className="border-b border-dashed border-black text-center pb-1">:</td>
                                      <td className="border-b border-dashed border-black text-right pb-1">{advanceTotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                      <td className="pt-1">PAID AMOUNT</td>
                                      <td className="pt-1 text-center">:</td>
                                      <td className="pt-1 text-right">{Number(finalSettlement.amount).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                      <td>BALANCE DUE</td>
                                      <td className="text-center">:</td>
                                      <td className="text-right">{Number(order.balanceAmount).toFixed(2)}</td>
                                    </tr>
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </tbody>
                      </table>
                      
                      {slipType === "DELIVERY" && (
                        <>
                          {(() => {
                            const sortedPayments = (order.payments || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                            const finalSettlement = sortedPayments.length > 0 ? sortedPayments[sortedPayments.length - 1] : { amount: 0, method: "Cash" };
                            return (
                              <div className="border-t border-dashed border-black mt-1 pt-1 pb-1">
                                Payment Mode: {finalSettlement.method}--{Number(finalSettlement.amount).toFixed(2)}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 pb-2">
                      {slipType === "BOOKING" && order.payments && order.payments.length > 0 && (
                        <div className="border-b border-dashed border-black pb-1 mb-2">
                          Payment Mode: {order.payments[0].method}
                        </div>
                      )}
                      <div className="font-bold text-center mt-2">Thank You! Visit Again</div>
                    </div>
                  </div>
                )}

                {/* 2. Page Break Divider */}
                {copyType === "BOTH" && <div className="page-break no-print w-full border-t border-dashed border-slate-400 my-4" />}

                {/* 3. Shop Copy */}
                {(copyType === "BOTH" || copyType === "SHOP") && (
                  <div 
                    className="bg-white p-3 print-container font-mono text-black uppercase leading-tight shadow-md print:shadow-none"
                    style={{ 
                      width: printerSize === "MM_58" ? "58mm" : "80mm", 
                      minHeight: "300px",
                      fontSize: printerSize === "MM_58" ? "10px" : "12px",
                      fontWeight: 600
                    }}
                  >
                    {/* Header */}
                    <div className="pb-2 text-center">
                      <div className="font-bold text-base">{settings?.businessName || "BUBBLEWORKS"}</div>
                      <div className="text-xs font-bold border-b border-t border-dashed border-black py-0.5 my-1">
                        *** WORKSHOP COPY ***
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="pb-1 space-y-0.5 break-words">
                      <div className="font-bold text-sm">TOKEN NO : {order.tokenNumber}</div>
                      <div>BILL NO : {order.billNumber}</div>
                      <div className="font-bold border-b border-dashed border-black pb-1 mb-1">
                        EXP. DELIVERY: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).toUpperCase()}
                      </div>
                      <div>CUST: {order.customer.name} ({order.customer.mobile})</div>
                    </div>

                    {/* Table */}
                    <div className="border-t border-b border-dashed border-black py-0.5 my-1">
                      <table className="w-full text-left table-fixed">
                        <thead>
                          <tr>
                            <th className="font-semibold py-0.5">PARTICULARS</th>
                            <th className="font-semibold py-0.5 text-right w-16">QTY/WT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item: any) => {
                            const itemName = item.productNameSnapshot 
                              ? `${item.productNameSnapshot} - ${item.serviceNameSnapshot}`
                              : item.serviceNameSnapshot;
                            const isKg = item.pricingType === "PER_KG";
                            const qtyLabel = isKg ? `${Number(item.weightKg).toFixed(1)}kg` : `${item.quantity}pc`;

                            return (
                              <tr key={item.id}>
                                <td className="py-0.5 pr-1 text-[10px] sm:text-[11px] break-words leading-tight" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                                  {itemName}
                                </td>
                                <td className="py-0.5 text-right whitespace-nowrap">
                                  {qtyLabel}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Notes */}
                    {order.notes && (
                      <div className="border border-black p-1.5 my-2 text-left text-[10px] sm:text-[11px]">
                        <div className="font-bold mb-0.5">SPECIAL INSTRUCTIONS:</div>
                        <div className="break-words font-medium">{order.notes}</div>
                      </div>
                    )}
                    
                    <div className="font-bold text-center mt-2 border-t border-dashed border-black pt-1">
                      FOR INTERNAL USE ONLY
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
