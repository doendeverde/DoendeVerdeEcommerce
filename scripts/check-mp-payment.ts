/**
 * Check payment status directly from Mercado Pago
 */
import "dotenv/config";
import { Payment, MercadoPagoConfig } from "mercadopago";

const isProduction = process.env.MP_USE_PRODUCTION === "true";
const accessToken = isProduction 
  ? process.env.MP_PROD_ACCESS_TOKEN 
  : process.env.MP_TEST_ACCESS_TOKEN;

if (!accessToken) {
  console.error("Access token not found in .env (using", isProduction ? "PRODUCTION" : "TEST", "mode)");
  process.exit(1);
}

const config = new MercadoPagoConfig({ accessToken });
const paymentClient = new Payment(config);

const paymentId = process.argv[2] || "142602039851";

async function checkPayment() {
  console.log("=".repeat(60));
  console.log("Checking payment:", paymentId);
  console.log("=".repeat(60));
  
  try {
    const payment = await paymentClient.get({ id: paymentId });
    
    console.log("\n📋 PAYMENT INFO:");
    console.log("  Status:", payment.status);
    console.log("  Status Detail:", payment.status_detail);
    console.log("  Amount:", payment.transaction_amount);
    console.log("  Method:", payment.payment_method_id);
    console.log("  Date Created:", payment.date_created);
    console.log("  Date Approved:", payment.date_approved);
    console.log("  External Reference:", payment.external_reference);
    console.log("  Payer Email:", payment.payer?.email);
    
    console.log("\n📦 RAW STATUS:", payment.status);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

checkPayment();
