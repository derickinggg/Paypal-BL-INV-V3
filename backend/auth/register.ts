import { api, APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import db from "../db";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  invitationCode: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Registers a new user account.
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    // Validate invitation code
    const VALID_INVITATION_CODE = "MYX223#$1";
    if (req.invitationCode !== VALID_INVITATION_CODE) {
      throw APIError.invalidArgument("Invalid invitation code");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    // Validate password strength
    if (req.password.length < 8) {
      throw APIError.invalidArgument("Password must be at least 8 characters long");
    }

    // Check if user already exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;
    
    if (existingUser) {
      throw APIError.alreadyExists("User with this email already exists");
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(req.password, saltRounds);

    // Create user
    const user = await db.queryRow<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    }>`
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES (${req.email}, ${passwordHash}, ${req.firstName}, ${req.lastName})
      RETURNING id, email, first_name, last_name
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
    }

    return {
      userId: user.id.toString(),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }
);
