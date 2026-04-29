import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { ProfilePage } from "@/components/profile/profile-page";
import { validateUserID } from "@/features/users/user-id";
import {
  getCurrentUserProfile,
  getPublicUserProfileByUserID,
} from "@/server/users/repository";
import { auth } from "../../../../auth";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userID: string }>;
}) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    redirect("/");
  }

  const parsed = validateUserID((await params).userID);

  if (!parsed.ok) {
    notFound();
  }

  const [currentUser, profile] = await Promise.all([
    getCurrentUserProfile(session.user.id),
    getPublicUserProfileByUserID({
      userID: parsed.value,
      currentUserId: session.user.id,
    }),
  ]);

  if (!currentUser) {
    redirect("/");
  }

  if (!profile) {
    notFound();
  }

  return (
    <AppShell currentUser={currentUser}>
      <ProfilePage profile={profile} />
    </AppShell>
  );
}
