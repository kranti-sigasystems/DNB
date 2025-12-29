import cron from "node-cron";
import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";
import { sendExpiryMail } from "@/lib/email";

async function getExpiringPlans() {
  try {
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        endDate: {
          gte: today,
          lte: threeDaysLater,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
          },
        },
      },
    });

    return expiringSubscriptions;
  } catch (err) {
    console.error("Error fetching expiring plans:", err);
    return [];
  }
}

export const initSubscriptionExpiryCron = () => {
  cron.schedule("11 10 * * *", async () => {
    console.log("🔍 Checking for plans with upcoming end dates...");

    try {
      const expiringPlans = await getExpiringPlans();

      if (!expiringPlans.length) {
        console.log("ℹ️ No active plans found nearing expiry today.");
        return;
      }

      for (const subscription of expiringPlans) {
        if (!subscription.user?.email) {
          continue;
        }

        const endDate = subscription.endDate
          ? new Date(subscription.endDate)
          : new Date();
        const formattedDate = dayjs(endDate).format("DD MMM YYYY");

        try {
          await sendExpiryMail({
            to: subscription.user.email,
            subject: "Your plan is about to expire",
            userName: subscription.user.first_name || "User",
            planName: subscription.planName,
            expiryDate: formattedDate,
          });

          console.log(
            `📩 Reminder sent to ${subscription.user.email} (Plan: ${subscription.planName})`
          );
        } catch (emailError) {
          console.error(
            `Failed to send email to ${subscription.user.email}:`,
            emailError
          );
        }
      }

      console.log(
        `✅ Completed expiry check for ${expiringPlans.length} plans.`
      );
    } catch (error) {
      console.error("Error running expiry cron:", error);
    }
  });

  console.log("✅ Subscription expiry cron job initialized");
};

export default getExpiringPlans;
