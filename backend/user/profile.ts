import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

// Retrieves the current user's profile information.
export const getProfile = api<void, UserProfile>(
  { auth: true, expose: true, method: "GET", path: "/user/profile" },
  async () => {
    const auth = getAuthData()!;
    
    const user = await db.queryRow<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      created_at: Date;
    }>`
      SELECT id, email, first_name, last_name, created_at
      FROM users
      WHERE id = ${parseInt(auth.userID)}
    `;

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id.toString(),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
    };
  }
);
