"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface RegisterUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phoneNumber: string;
  businessName: string;
  registrationNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  taxId?: string;
  website?: string;
}

interface AuthResponse {
  success: boolean;
  statusCode: number;
  data?: {
    accessToken: string;
    refreshToken?: string;
    tokenPayload: any;
    message?: string;
  };
  message?: string;
}

export async function registerAndLoginUser(
  userData: RegisterUserData
): Promise<AuthResponse> {
  try {
    // Validate required fields
    const requiredFields = [
      "email",
      "password",
      "businessName",
      "registrationNumber",
      "first_name",
      "last_name",
      "phoneNumber",
      "country",
      "state",
      "city",
      "address",
      "postalCode",
    ];

    const missingFields = requiredFields.filter(
      (field) => !userData[field as keyof RegisterUserData]
    );
    if (missingFields.length > 0) {
      return {
        success: false,
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid email format",
      };
    }

    // Validate password strength
    if (userData.password.length < 8) {
      return {
        success: false,
        statusCode: 400,
        message: "Password must be at least 8 characters long",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingUser) {
      return {
        success: false,
        statusCode: 409, // Conflict
        message: "User with this email already exists",
      };
    }

    // Check if business name is unique
    const existingBusiness = await prisma.businessOwner.findFirst({
      where: { businessName: userData.businessName },
    });

    if (existingBusiness) {
      return {
        success: false,
        statusCode: 409,
        message: "Business name already exists",
      };
    }

    // Check if registration number is unique
    const existingRegistration = await prisma.businessOwner.findFirst({
      where: { registrationNumber: userData.registrationNumber },
    });

    if (existingRegistration) {
      return {
        success: false,
        statusCode: 409,
        message: "Registration number already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user and business owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with correct field names
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          first_name: userData.first_name,
          last_name: userData.last_name,
          roleId: 2, // Business Owner role ID
          businessName: userData.businessName,
        },
      });

      // Create business owner
      const businessOwner = await tx.businessOwner.create({
        data: {
          userId: user.id,
          businessName: userData.businessName,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          registrationNumber: userData.registrationNumber,
          country: userData.country,
          state: userData.state,
          city: userData.city,
          address: userData.address,
          postalCode: userData.postalCode,
          status: "active",
        },
      });

      return { user, businessOwner };
    });

    // Generate JWT tokens
    const tokenPayload = {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.first_name,
      lastName: result.user.last_name,
      role: "business_owner",
      businessOwnerId: result.businessOwner.id,
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(
      { userId: result.user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return {
      success: true,
      statusCode: 200,
      data: {
        accessToken,
        refreshToken,
        tokenPayload,
        message: "Account created successfully",
      },
    };
  } catch (error: any) {
    console.error("❌ Registration error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
    // Handle specific Prisma errors
    if (error.code === "P2022") {
      console.error("Database schema mismatch. Please check:");
      console.error("1. If all tables exist in database");
      console.error("2. If column names match between schema and database");
      console.error("3. Run `npx prisma db push` or `npx prisma migrate dev`");
      return {
        success: false,
        statusCode: 500,
        message: "Database configuration error. Please contact support.",
      };
    }
    if (error.code === "P2002") {
      const target = error.meta?.target || [];
      const field = target[0] || "field";
      return {
        success: false,
        statusCode: 409,
        message: `${field} already exists`,
      };
    }
    if (error.code === "P2003") {
      return {
        success: false,
        statusCode: 400,
        message: "Foreign key constraint failed",
      };
    }
    return {
      success: false,
      statusCode: 500,
      message: `Registration failed: ${error.message || "Internal server error"}`,
    };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  redirect("/login");
}