import { OrderData } from "@/types/payment";
import { generateReceiptHTML } from "./GenerateReceipt";

export const openAndPrintReceipt = (orderData: OrderData) => {
  const receiptWindow = window.open("", "_blank");
  if (!receiptWindow) return;

  receiptWindow.document.write(generateReceiptHTML(orderData));
  receiptWindow.document.close();

  setTimeout(() => {
    receiptWindow.print();
  }, 500);
};
