import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getDecryptedCredentials } from "./credentials";
import db from "../db";

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  environment: "sandbox" | "live";
  description?: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
  approvalUrl?: string;
  amount: number;
  currency: string;
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, environment: "sandbox" | "live") {
  const baseUrl = environment === "sandbox" 
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw APIError.internal(`PayPal authentication failed: ${response.statusText}`);
  }

  const data = await response.json() as any;
  return data.access_token;
}

// Creates a PayPal payment and returns the approval URL.
export const createPayment = api<CreatePaymentRequest, PaymentResponse>(
  { auth: true, expose: true, method: "POST", path: "/paypal/payment" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);

    if (req.amount <= 0) {
      throw APIError.invalidArgument("Amount must be greater than 0");
    }

    // Get PayPal credentials (shared across all users)
    const credentials = await getDecryptedCredentials(req.environment);
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(
      credentials.clientId,
      credentials.clientSecret,
      req.environment
    );

    const baseUrl = req.environment === "sandbox" 
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    // Create payment
    const paymentData = {
      intent: "sale",
      payer: {
        payment_method: "paypal"
      },
      transactions: [{
        amount: {
          total: req.amount.toFixed(2),
          currency: req.currency
        },
        description: req.description || "Payment via PayPal Integration"
      }],
      redirect_urls: {
        return_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel"
      }
    };

    const response = await fetch(`${baseUrl}/v1/payments/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw APIError.internal(`PayPal payment creation failed: ${JSON.stringify(errorData)}`);
    }

    const paymentResult = await response.json() as any;
    
    // Find approval URL
    const approvalUrl = paymentResult.links?.find((link: any) => link.rel === "approval_url")?.href;

    // Store transaction record
    await db.exec`
      INSERT INTO transactions (user_id, transaction_id, type, amount, currency, status, environment, response_data)
      VALUES (${userId}, ${paymentResult.id}, 'payment', ${req.amount}, ${req.currency}, ${paymentResult.state}, ${req.environment}, ${JSON.stringify(paymentResult)})
    `;

    return {
      paymentId: paymentResult.id,
      status: paymentResult.state,
      approvalUrl: approvalUrl,
      amount: req.amount,
      currency: req.currency,
    };
  }
);
