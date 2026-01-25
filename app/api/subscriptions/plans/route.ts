import { NextResponse } from "next/server";
import { subscriptionService } from "@/services";

/**
 * GET /api/subscriptions/plans
 *
 * Returns all active subscription plans for display.
 * Public endpoint - no authentication required.
 * Used by SubscriptionCTABanner carousel.
 */
export async function GET() {
  try {
    const plans = await subscriptionService.getPaidPlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
