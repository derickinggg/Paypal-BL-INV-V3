import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";

const jwtSecret = secret("JWTSecret");

function getJWTSecret(): string {
  try {
    return jwtSecret();
  } catch (err) {
    // Fallback for development - use a default secret
    console.warn("JWTSecret not configured, using development default");
    return "development-jwt-secret-change-in-production-1234567890abcdef";
  }
}

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const payload = jwt.verify(token, getJWTSecret()) as any;
      return {
        userID: payload.userId.toString(),
        email: payload.email,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
