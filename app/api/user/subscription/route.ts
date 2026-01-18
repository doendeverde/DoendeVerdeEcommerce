import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { subscriptionService } from "@/services";

/**
 * GET /api/user/subscription
 *
 * Returns the current user's active subscription with plan details.
 * Used by SubscriptionBanner to display current plan info.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { subscription: null, isLoggedIn: false },
        { status: 200 }
      );
    }

    const subscription = await subscriptionService.getUserSubscription(
      session.user.id
    );

    if (!subscription) {
      return NextResponse.json(
        { subscription: null, isLoggedIn: true },
        { status: 200 }
      );
    }

    // Get plan config for additional display data (discount, color)
    const planConfig = subscriptionService.getPlanDisplayConfig(
      subscription.plan.slug
    );

    return NextResponse.json({
      isLoggedIn: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startedAt: subscription.startedAt,
        nextBillingAt: subscription.nextBillingAt,
        plan: {
          ...subscription.plan,
          discountPercent: planConfig.discountPercent,
          color: planConfig.color,
          colorDark: planConfig.colorDark,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
