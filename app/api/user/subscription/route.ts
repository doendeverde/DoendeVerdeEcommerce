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

    return NextResponse.json({
      isLoggedIn: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startedAt: subscription.startedAt,
        nextBillingAt: subscription.nextBillingAt,
        plan: {
          ...subscription.plan,
          // colorScheme is already included in subscription.plan from service
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
