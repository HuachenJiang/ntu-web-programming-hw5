import type { Session } from "next-auth";
import Image from "next/image";
import { OnboardingForm } from "./onboarding-form";
import { SignInButtons } from "./sign-in-buttons";
import { SignOutButton } from "./sign-out-button";
import { UserIDSignInForm } from "./user-id-sign-in-form";

export function HomeContent({
  loginError,
  loginUserID,
  session,
}: {
  loginError?: string | null;
  loginUserID?: string | null;
  session: Session | null;
}) {
  const isSignedIn = Boolean(session?.user);
  const isOnboarded = Boolean(session?.user?.onboarded);

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-[#e7e9ea] sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl grid-cols-1 overflow-hidden border border-[#2f3336] bg-black lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex min-h-[340px] flex-col justify-between border-b border-[#2f3336] bg-[#061018] p-6 lg:border-r lg:border-b-0 lg:p-8">
          <div className="flex items-center gap-3">
            <Image
              src="/orbit-logo.svg"
              alt="Orbit forum logo"
              width={48}
              height={48}
              className="h-12 w-12"
              priority
            />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#71767b]">
                HW5
              </p>
              <p className="text-2xl font-black text-[#9cffef]">Orbit</p>
            </div>
          </div>

          <div>
            <p className="w-fit rounded-full border border-[#536471] bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#1d9bf0]">
              Phase 3
            </p>
            <h1 className="mt-5 max-w-xl text-5xl font-black leading-none sm:text-6xl">
              Sign in. Claim your handle.
            </h1>
          </div>
        </div>

        <div className="flex items-center bg-black p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-xl">
            {!isSignedIn ? (
              <SignedOutPanel
                loginError={loginError}
                loginUserID={loginUserID}
              />
            ) : null}
            {isSignedIn && !isOnboarded ? (
              <OnboardingPanel session={session} />
            ) : null}
            {isSignedIn && isOnboarded ? (
              <SignedInPanel session={session} />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function SignedOutPanel({
  loginError,
  loginUserID,
}: {
  loginError?: string | null;
  loginUserID?: string | null;
}) {
  const errorMessage =
    loginError === "user_id_mismatch"
      ? `That OAuth account is not registered as @${
          loginUserID ?? "the requested userID"
        }. Please choose the account linked to that userID.`
      : null;

  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#71767b]">
        Welcome
      </p>
      <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
        Continue with your OAuth provider.
      </h2>
      {errorMessage ? (
        <p className="mt-5 rounded-2xl border border-[#67070f] bg-[#20070a] px-4 py-3 text-sm font-bold leading-6 text-[#ff8b94]">
          {errorMessage}
        </p>
      ) : null}
      <div className="mt-8">
        <SignInButtons />
      </div>
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2f3336]" />
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[#71767b]">
          or
        </span>
        <div className="h-px flex-1 bg-[#2f3336]" />
      </div>
      <UserIDSignInForm />
    </div>
  );
}

function OnboardingPanel({ session }: { session: Session | null }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#71767b]">
        First login
      </p>
      <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
        Choose your immutable userID.
      </h2>
      <p className="mt-4 text-base font-semibold leading-7 text-[#71767b]">
        Signed in as{" "}
        {session?.user?.email ?? session?.user?.name ?? "OAuth user"}.
      </p>
      <div className="mt-8">
        <OnboardingForm />
      </div>
    </div>
  );
}

function SignedInPanel({ session }: { session: Session | null }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#71767b]">
        Session active
      </p>
      <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
        You are signed in as @{session?.user.userID}.
      </h2>
      <p className="mt-4 text-base font-semibold leading-7 text-[#71767b]">
        {session?.user.name ?? session?.user.email ?? "Your account"} can return
        while this session remains valid.
      </p>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
