import { HomeContent } from "@/components/auth/home-content";
import { auth } from "../../auth";

type HomeSearchParams = {
  loginError?: string | string[];
  userID?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<HomeSearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;

  return (
    <HomeContent
      loginError={firstParam(params?.loginError)}
      loginUserID={firstParam(params?.userID)}
      session={session}
    />
  );
}
