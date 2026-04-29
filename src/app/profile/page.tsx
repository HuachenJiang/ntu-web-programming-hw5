import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { ProfilePage } from "@/components/profile/profile-page";
import { getCurrentUserProfile } from "@/server/users/repository";
import { auth } from "../../../auth";

export default async function CurrentUserProfilePage() {
  const session = await auth();

  if (!session?.user?.onboarded) {
    redirect("/");
  }

  const profile = await getCurrentUserProfile(session.user.id);

  if (!profile) {
    redirect("/");
  }

  return (
    <AppShell currentUser={profile}>
      <ProfilePage profile={profile} />
    </AppShell>
  );
}
