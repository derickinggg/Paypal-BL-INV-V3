import { api, APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";
import db from "../db";

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Authenticates a user and returns a JWT token.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    // Find user by email
    const user = await db.queryRow<{
      id: number;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
    }>`
      SELECT id, email, password_hash, first_name, last_name
      FROM users
      WHERE email = ${req.email}
    `;

    if (!user) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJWTSecret(),
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }
);
