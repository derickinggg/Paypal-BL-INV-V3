import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

export interface Transaction {
  id: string;
  transactionId: string;
  type: "payment" | "balance_check";
  amount?: number;
  currency?: string;
  status: string;
  environment: "sandbox" | "live";
  createdAt: Date;
}

export interface TransactionHistoryRequest {
  limit?: Query<number>;
  offset?: Query<number>;
  environment?: Query<string>;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

// Retrieves the user's transaction history.
export const getHistory = api<TransactionHistoryRequest, TransactionHistoryResponse>(
  { auth: true, expose: true, method: "GET", path: "/transaction/history" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);
    const limit = req.limit || 50;
    const offset = req.offset || 0;

    // Get total count
    let totalResult;
    if (req.environment && (req.environment === 'sandbox' || req.environment === 'live')) {
      totalResult = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM transactions 
        WHERE user_id = ${userId} AND environment = ${req.environment}
      `;
    } else {
      totalResult = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM transactions 
        WHERE user_id = ${userId}
      `;
    }
    const total = totalResult?.count || 0;

    // Get transactions
    let transactions;
    if (req.environment && (req.environment === 'sandbox' || req.environment === 'live')) {
      transactions = await db.query<{
        id: number;
        transaction_id: string;
        type: string;
        amount: number | null;
        currency: string | null;
        status: string;
        environment: string;
        created_at: Date;
      }>`
        SELECT id, transaction_id, type, amount, currency, status, environment, created_at
        FROM transactions 
        WHERE user_id = ${userId} AND environment = ${req.environment}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      transactions = await db.query<{
        id: number;
        transaction_id: string;
        type: string;
        amount: number | null;
        currency: string | null;
        status: string;
        environment: string;
        created_at: Date;
      }>`
        SELECT id, transaction_id, type, amount, currency, status, environment, created_at
        FROM transactions 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const transactionList: Transaction[] = [];
    for await (const t of transactions) {
      transactionList.push({
        id: t.id.toString(),
        transactionId: t.transaction_id,
        type: t.type as "payment" | "balance_check",
        amount: t.amount || undefined,
        currency: t.currency || undefined,
        status: t.status,
        environment: t.environment as "sandbox" | "live",
        createdAt: t.created_at,
      });
    }

    return {
      transactions: transactionList,
      total,
      hasMore: offset + limit < total,
    };
  }
);
