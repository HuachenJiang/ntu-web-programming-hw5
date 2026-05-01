import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PostDetailPage } from "@/components/posts/post-detail-page";
import { getPostThread } from "@/server/posts/repository";
import { getCurrentUserProfile } from "@/server/users/repository";
import { auth } from "../../../../auth";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    redirect("/");
  }

  const { postId } = await params;
  const [currentUser, thread] = await Promise.all([
    getCurrentUserProfile(session.user.id),
    getPostThread({
      postId,
      viewerId: session.user.id,
    }),
  ]);

  if (!currentUser) {
    redirect("/");
  }

  if (!thread) {
    notFound();
  }

  return (
    <AppShell currentUser={currentUser}>
      <PostDetailPage currentUser={currentUser} initialThread={thread} />
    </AppShell>
  );
}
