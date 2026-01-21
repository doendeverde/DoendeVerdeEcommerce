/**
 * Profile Page
 * 
 * User profile management with personal info, addresses, and preferences.
 * Server component that fetches data and passes to client components.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userService } from "@/services";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { AddressManager } from "@/components/profile/AddressManager";
import { PreferencesManager } from "@/components/profile/PreferencesManager";
import type { UserPreferencesData } from "@/types/subscription-checkout";

export const metadata = {
  title: "Meu Perfil | Doende HeadShop",
  description: "Gerencie suas informações pessoais, endereços e preferências",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await userService.getUserFullProfile(session.user.id);

  if (!user) {
    redirect("/login");
  }

  // Transform preferences to the expected type
  const preferencesData: UserPreferencesData | null = user.preferences
    ? {
        yearsSmoking: user.preferences.yearsSmoking,
        favoritePaperType: user.preferences.favoritePaperType as any,
        favoritePaperSize: user.preferences.favoritePaperSize as any,
        paperFilterSize: user.preferences.paperFilterSize as any,
        glassFilterSize: user.preferences.glassFilterSize as any,
        glassFilterThickness: user.preferences.glassFilterThickness as any,
        favoriteColors: user.preferences.favoriteColors,
        tobaccoUsage: user.preferences.tobaccoUsage as any,
        consumptionFrequency: user.preferences.consumptionFrequency as any,
        consumptionMoment: user.preferences.consumptionMoment as any[],
        consumesFlower: user.preferences.consumesFlower,
        consumesSkunk: user.preferences.consumesSkunk,
        consumesHash: user.preferences.consumesHash,
        consumesExtracts: user.preferences.consumesExtracts,
        consumesOilEdibles: user.preferences.consumesOilEdibles,
        likesAccessories: user.preferences.likesAccessories,
        likesCollectibles: user.preferences.likesCollectibles,
        likesPremiumItems: user.preferences.likesPremiumItems,
        notes: user.preferences.notes,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <ProfileHeader
        fullName={user.fullName}
        email={user.email}
        createdAt={user.createdAt}
        status={user.status}
        subscriptionPlan={user.activeSubscription?.plan.name}
      />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Info */}
          <ProfileInfoCard
            fullName={user.fullName}
            email={user.email}
            whatsapp={user.whatsapp}
            birthDate={user.birthDate}
            document={user.profile?.document || null}
          />

          {/* Preferences */}
          <PreferencesManager initialPreferences={preferencesData} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Addresses */}
          <AddressManager initialAddresses={user.addresses} />
        </div>
      </div>
    </div>
  );
}
