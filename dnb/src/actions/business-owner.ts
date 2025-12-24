"use server";

import { prisma } from "@/lib/prisma";


export async function checkUniqueField(field: string, value: string): Promise<{ exists: boolean; message?: string }> {
  try {
    if (!value || value.trim() === "") {
      return { exists: false };
    }

    let exists = false;
    let message = "";

    switch (field) {
      case "email":
        const userWithEmail = await prisma.user.findUnique({
          where: { email: value }
        });
        exists = !!userWithEmail;
        message = exists ? "Email is already registered" : "";
        break;

      case "businessName":
        const businessWithName = await prisma.businessOwner.findFirst({
          where: { businessName: value }
        });
        exists = !!businessWithName;
        message = exists ? "Business name is already taken" : "";
        break;

      case "registrationNumber":
        const businessWithRegNumber = await prisma.businessOwner.findFirst({
          where: { registrationNumber: value }
        });
        exists = !!businessWithRegNumber;
        message = exists ? "Registration number is already registered" : "";
        break;

      default:
        return { exists: false, message: "Invalid field" };
    }

    return { exists, message };

  } catch (error) {
    console.error("Check unique field error:", error);
    return { exists: false, message: "Error checking field uniqueness" };
  }
}

export async function getBusinessOwnerByUserId(userId: string) {
  try {
    const businessOwner = await prisma.businessOwner.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            subscriptions: true
          }
        }
      }
    });

    return { success: true, data: businessOwner };
  } catch (error) {
    console.error("Get business owner error:", error);
    return { success: false, message: "Failed to get business owner" };
  }
}