/**
 * Web Bluetooth ESC/POS Thermal Printer Utility for Bubbleworks
 * Supports 58mm and 80mm thermal printers
 * Works on Chrome/Edge for Android
 */

const PRINTER_PROFILES = [
  { service: "000018f0-0000-1000-8000-00805f9b34fb", characteristic: "00002af1-0000-1000-8000-00805f9b34fb" },
  { service: "e7810a71-73ae-499d-8c15-faa9aef0c3f2", characteristic: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f" },
  { service: "49535343-fe7d-4ae5-8fa9-9fafd205e455", characteristic: "49535343-8841-43f4-a8d4-ecbe34729bb3" },
  { service: "0000ff00-0000-1000-8000-00805f9b34fb", characteristic: "0000ff02-0000-1000-8000-00805f9b34fb" },
];

let cachedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let cachedDeviceName: string = "";

export function getConnectedPrinterName(): string {
  return cachedDeviceName;
}

export function isPrinterConnected(): boolean {
  return cachedCharacteristic !== null;
}

export function disconnectPrinter() {
  cachedCharacteristic = null;
  cachedDeviceName = "";
}

export async function connectPrinter(): Promise<string> {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth is not supported on this browser. Use Chrome on Android.");
  }
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_PROFILES.map((p) => p.service),
  });
  if (!device.gatt) throw new Error("Bluetooth GATT not available on this device.");

  const server = await device.gatt.connect();

  for (const profile of PRINTER_PROFILES) {
    try {
      const service = await server.getPrimaryService(profile.service);
      const characteristic = await service.getCharacteristic(profile.characteristic);
      cachedCharacteristic = characteristic;
      cachedDeviceName = device.name || "Thermal Printer";

      device.addEventListener("gattserverdisconnected", () => {
        cachedCharacteristic = null;
        cachedDeviceName = "";
      });
      return cachedDeviceName;
    } catch {
      continue;
    }
  }
  throw new Error("No compatible print service found. Make sure your printer is turned on.");
}

const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  init: [ESC, 0x40],
  feed3: [ESC, 0x64, 0x03],
  cutPaper: [GS, 0x56, 0x42, 0x00],
};

const encoder = new TextEncoder();

function bytes(...parts: (number[] | Uint8Array | string)[]): Uint8Array {
  const arrays = parts.map((p) => {
    if (typeof p === "string") return encoder.encode(p);
    if (Array.isArray(p)) return new Uint8Array(p);
    return p;
  });
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/** Layout formatting */
function center(str: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return " ".repeat(pad) + str + "\n";
}

function lpad(str: string, len: number): string {
  str = String(str);
  if (str.length > len) str = str.substring(0, len - 1) + ".";
  return str.padEnd(len);
}

function rpad(str: string, len: number): string {
  str = String(str);
  if (str.length > len) str = str.substring(0, len - 1) + ".";
  return str.padStart(len);
}

function dashes(width: number): string {
  return "-".repeat(width) + "\n";
}

function dualCol(left: string, right: string, width: number): string {
  const spaces = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(spaces) + right + "\n";
}

function generateCustomerSlipText(
  order: any,
  settings: any,
  W: number,
  COL_NAME: number,
  COL_QTY: number,
  COL_RATE: number,
  COL_AMT: number,
  slipType: "BOOKING" | "DELIVERY"
): string {
  const headerRow = 
    lpad("Service", COL_NAME) +
    rpad("Qty", COL_QTY) +
    rpad("Rate", COL_RATE) +
    rpad("Amt", COL_AMT) + "\n";

  let receiptStr = "";

  receiptStr += "\n";
  receiptStr += center(settings?.businessName || "Bubbleworks", W);
  const address = order.branch?.address || settings?.address;
  const mobile = order.branch?.mobile || settings?.mobile;
  if (address) receiptStr += center(address, W);
  if (mobile) receiptStr += center(`Mobile: ${mobile}`, W);
  if (settings?.gstNumber) receiptStr += center(`GST: ${settings.gstNumber}`, W);
  receiptStr += dashes(W);
  
  receiptStr += center(slipType === "BOOKING" ? "*** BOOKING SLIP ***" : "*** DELIVERY SLIP ***", W);
  receiptStr += dashes(W);

  receiptStr += dualCol("Bill No:", order.billNumber, W);
  receiptStr += dualCol("Token No:", order.tokenNumber, W);
  receiptStr += dualCol("Date:", new Date(order.orderDate).toLocaleDateString(), W);
  receiptStr += dualCol("Cust:", order.customer.name, W);
  receiptStr += dualCol("Mobile:", order.customer.mobile, W);
  receiptStr += dashes(W);

  receiptStr += headerRow;
  receiptStr += dashes(W);
  order.items.forEach((item: any) => {
    const qtyText = item.pricingType === "PER_KG" ? `${Number(item.weightKg).toFixed(1)}kg` : String(item.quantity);
    receiptStr += 
      lpad(item.serviceNameSnapshot, COL_NAME) +
      rpad(qtyText, COL_QTY) +
      rpad(Number(item.rate).toFixed(0), COL_RATE) +
      rpad(Number(item.amount).toFixed(2), COL_AMT) + "\n";
  });
  receiptStr += dashes(W);

  receiptStr += dualCol("Subtotal:", Number(order.subtotal).toFixed(2), W);
  if (Number(order.discountAmount) > 0) {
    receiptStr += dualCol("Discount:", "-" + Number(order.discountAmount).toFixed(2), W);
  }
  if (Number(order.gstAmount) > 0) {
    receiptStr += dualCol("CGST:", (Number(order.gstAmount) / 2).toFixed(2), W);
    receiptStr += dualCol("SGST:", (Number(order.gstAmount) / 2).toFixed(2), W);
  }
  
  if (Number(order.roundOff) !== 0) {
    receiptStr += dualCol("Round Off:", Number(order.roundOff).toFixed(2), W);
  }
  
  receiptStr += dashes(W);
  receiptStr += dualCol("GRAND TOTAL:", Number(order.grandTotal).toFixed(2), W);
  receiptStr += dashes(W);

  if (slipType === "BOOKING") {
    receiptStr += dualCol("Advance Paid:", Number(order.paidAmount).toFixed(2), W);
    receiptStr += dualCol("Balance Due:", Number(order.balanceAmount).toFixed(2), W);
  } else {
    let finalSettlement = 0;
    let advanceAmount = Number(order.paidAmount);
    
    if (order.payments && order.payments.length > 1) {
      finalSettlement = Number(order.payments[order.payments.length - 1].amount);
      advanceAmount = advanceAmount - finalSettlement;
    } else if (order.payments && order.payments.length === 1 && Number(order.balanceAmount) === 0) {
       advanceAmount = Number(order.paidAmount);
       finalSettlement = 0;
    } else if (order.payments && order.payments.length === 1) {
       finalSettlement = Number(order.paidAmount);
       advanceAmount = 0;
    }
    
    receiptStr += dualCol("Advance Paid:", advanceAmount.toFixed(2), W);
    receiptStr += dualCol("Final Settled:", finalSettlement.toFixed(2), W);
    receiptStr += dualCol("Balance Due:", Number(order.balanceAmount).toFixed(2), W);
  }

  receiptStr += dashes(W);
  receiptStr += dualCol("Status:", order.paymentStatus, W);
  receiptStr += "\n";
  receiptStr += center("Thank you for your business!", W);
  receiptStr += "\n";

  return receiptStr;
}

function generateShopSlipText(
  order: any,
  settings: any,
  W: number,
  COL_NAME: number,
  COL_QTY: number
): string {
  let receiptStr = "";

  receiptStr += "\n";
  receiptStr += center(settings?.businessName || "Bubbleworks", W);
  receiptStr += center("*** WORKSHOP COPY ***", W);
  receiptStr += dashes(W);

  receiptStr += dualCol("Token No:", order.tokenNumber, W);
  receiptStr += dualCol("Bill No:", order.billNumber, W);
  receiptStr += dualCol("Exp. Delivery:", new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).toUpperCase(), W);
  receiptStr += dualCol("Cust:", order.customer.name, W);
  receiptStr += dualCol("Mobile:", order.customer.mobile, W);
  receiptStr += dashes(W);

  receiptStr += lpad("Service", COL_NAME) + rpad("Qty", COL_QTY) + "\n";
  receiptStr += dashes(W);
  
  order.items.forEach((item: any) => {
    const qtyText = item.pricingType === "PER_KG" ? `${Number(item.weightKg).toFixed(1)}kg` : String(item.quantity);
    receiptStr += 
      lpad(item.serviceNameSnapshot, COL_NAME) +
      rpad(qtyText, COL_QTY) + "\n";
  });
  receiptStr += dashes(W);

  if (order.notes) {
    receiptStr += "SPECIAL INSTRUCTIONS:\n";
    receiptStr += order.notes + "\n";
    receiptStr += dashes(W);
  }

  receiptStr += center("FOR INTERNAL USE ONLY", W);
  receiptStr += "\n";

  return receiptStr;
}

export async function printBubbleworksReceipt(
  order: any,
  settings: any,
  size: "MM_58" | "MM_80",
  slipType: "BOOKING" | "DELIVERY",
  copyType: "BOTH" | "CUSTOMER" | "SHOP" = "BOTH"
): Promise<void> {
  if (!cachedCharacteristic) {
    throw new Error("No Bluetooth printer connected.");
  }

  const W = size === "MM_58" ? 32 : 48;
  const COL_NAME = size === "MM_58" ? 12 : 20;
  const COL_QTY = size === "MM_58" ? 6 : 10;
  const COL_RATE = size === "MM_58" ? 6 : 8;
  const COL_AMT = size === "MM_58" ? 8 : 10;

  let combinedPayload: Uint8Array;

  if (copyType === "CUSTOMER") {
    const text = generateCustomerSlipText(order, settings, W, COL_NAME, COL_QTY, COL_RATE, COL_AMT, slipType);
    combinedPayload = bytes(CMD.init, text, CMD.feed3, CMD.cutPaper);
  } else if (copyType === "SHOP") {
    const text = generateShopSlipText(order, settings, W, COL_NAME, COL_QTY);
    combinedPayload = bytes(CMD.init, text, CMD.feed3, CMD.cutPaper);
  } else {
    const customerText = generateCustomerSlipText(order, settings, W, COL_NAME, COL_QTY, COL_RATE, COL_AMT, slipType);
    const shopText = generateShopSlipText(order, settings, W, COL_NAME, COL_QTY);
    
    combinedPayload = bytes(
      CMD.init, 
      customerText, 
      CMD.feed3, 
      CMD.cutPaper, 
      CMD.init, 
      shopText, 
      CMD.feed3, 
      CMD.cutPaper
    );
  }

  const CHUNK_SIZE = 100;
  for (let i = 0; i < combinedPayload.length; i += CHUNK_SIZE) {
    await cachedCharacteristic.writeValue(combinedPayload.slice(i, i + CHUNK_SIZE));
    await new Promise((r) => setTimeout(r, 30));
  }
}
