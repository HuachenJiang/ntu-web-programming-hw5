import { HomeContent } from "@/components/auth/home-content";
import { auth } from "../../auth";

export default async function Home() {
  const session = await auth();

  return <HomeContent session={session} />;
}
