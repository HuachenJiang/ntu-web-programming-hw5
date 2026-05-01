import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { HomeFeed } from "@/components/app/home-feed";
import { getCurrentUserProfile } from "@/server/users/repository";
import { auth } from "../../../auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.onboarded) {
    redirect("/");
  }

  const currentUser = await getCurrentUserProfile(session.user.id);

  if (!currentUser) {
    redirect("/");
  }

  return (
    <AppShell currentUser={currentUser}>
      <HomeFeed currentUser={currentUser} />
    </AppShell>
  );
}
