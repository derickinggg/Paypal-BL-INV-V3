import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import crypto from "crypto";
import db from "../db";

const encryptionKey = secret("EncryptionKey");

function getEncryptionKey(): string {
  try {
    return encryptionKey();
  } catch (err) {
    // Fallback for development - use a default key
    console.warn("EncryptionKey not configured, using development default");
    return "development-encryption-key-change-in-production-32char";
  }
}

export interface SaveCredentialsRequest {
  environment: "sandbox" | "live";
  clientId: string;
  clientSecret: string;
  remark: string;
}

export interface GetCredentialsResponse {
  credentials: Array<{
    id: string;
    environment: "sandbox" | "live";
    clientId: string;
    remark: string;
    hasClientSecret: boolean;
    createdAt: Date;
  }>;
}

function encrypt(text: string): string {
  const key = Buffer.from(getEncryptionKey(), 'utf-8').subarray(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const key = Buffer.from(getEncryptionKey(), 'utf-8').subarray(0, 32);
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Saves encrypted PayPal API credentials for the user.
export const saveCredentials = api<SaveCredentialsRequest, void>(
  { auth: true, expose: true, method: "POST", path: "/paypal/credentials" },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID);

    if (!req.clientId.trim() || !req.clientSecret.trim()) {
      throw APIError.invalidArgument("Client ID and Client Secret are required");
    }

    if (!req.remark.trim()) {
      throw APIError.invalidArgument("Remark is required");
    }

    const encryptedClientId = encrypt(req.clientId);
    const encryptedClientSecret = encrypt(req.clientSecret);

    await db.exec`
      INSERT INTO paypal_credentials (user_id, environment, client_id_encrypted, client_secret_encrypted, remark)
      VALUES (${userId}, ${req.environment}, ${encryptedClientId}, ${encryptedClientSecret}, ${req.remark})
      ON CONFLICT (environment, remark)
      DO UPDATE SET
        client_id_encrypted = EXCLUDED.client_id_encrypted,
        client_secret_encrypted = EXCLUDED.client_secret_encrypted,
        updated_at = NOW()
    `;
  }
);

// Retrieves all PayPal credentials for the user (without exposing secrets).
export const getCredentials = api<{ environment?: string }, GetCredentialsResponse>(
  { auth: true, expose: true, method: "GET", path: "/paypal/credentials" },
  async (req) => {
    const auth = getAuthData()!;

    let credentials;
    if (req.environment && (req.environment === "sandbox" || req.environment === "live")) {
      credentials = await db.query<{
        id: number;
        environment: string;
        client_id_encrypted: string;
        remark: string;
        created_at: Date;
      }>`
        SELECT id, environment, client_id_encrypted, remark, created_at
        FROM paypal_credentials
        WHERE environment = ${req.environment}
        ORDER BY created_at DESC
      `;
    } else {
      credentials = await db.query<{
        id: number;
        environment: string;
        client_id_encrypted: string;
        remark: string;
        created_at: Date;
      }>`
        SELECT id, environment, client_id_encrypted, remark, created_at
        FROM paypal_credentials
        ORDER BY environment, created_at DESC
      `;
    }

    const credentialsList = [];
    for await (const cred of credentials) {
      const clientId = decrypt(cred.client_id_encrypted);
      credentialsList.push({
        id: cred.id.toString(),
        environment: cred.environment as "sandbox" | "live",
        clientId: clientId,
        remark: cred.remark,
        hasClientSecret: true,
        createdAt: cred.created_at,
      });
    }

    return {
      credentials: credentialsList,
    };
  }
);

// Deletes PayPal credentials by ID.
export const deleteCredentials = api<{ id: string }, void>(
  { auth: true, expose: true, method: "DELETE", path: "/paypal/credentials/:id" },
  async (req) => {
    const auth = getAuthData()!;
    const credentialId = parseInt(req.id);

    // Check if the credential exists
    const exists = await db.queryRow<{ id: number }>`
      SELECT id
      FROM paypal_credentials
      WHERE id = ${credentialId}
    `;
    
    if (!exists) {
      throw APIError.notFound("Credentials not found");
    }

    await db.exec`
      DELETE FROM paypal_credentials
      WHERE id = ${credentialId}
    `;
  }
);

export async function getDecryptedCredentials(environment: "sandbox" | "live", remark?: string) {
  let credentials;
  
  if (remark) {
    credentials = await db.queryRow<{
      client_id_encrypted: string;
      client_secret_encrypted: string;
    }>`
      SELECT client_id_encrypted, client_secret_encrypted
      FROM paypal_credentials
      WHERE environment = ${environment} AND remark = ${remark}
    `;
  } else {
    // Get the first credential for the environment if no remark specified
    credentials = await db.queryRow<{
      client_id_encrypted: string;
      client_secret_encrypted: string;
    }>`
      SELECT client_id_encrypted, client_secret_encrypted
      FROM paypal_credentials
      WHERE environment = ${environment}
      ORDER BY created_at ASC
      LIMIT 1
    `;
  }

  if (!credentials) {
    throw APIError.notFound("PayPal credentials not configured for this environment");
  }

  return {
    clientId: decrypt(credentials.client_id_encrypted),
    clientSecret: decrypt(credentials.client_secret_encrypted),
  };
}
