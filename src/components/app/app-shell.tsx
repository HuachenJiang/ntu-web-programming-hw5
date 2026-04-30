"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState, type ReactNode } from "react";
import { PostCreatedProvider } from "@/components/posts/post-created-context";
import {
  PostComposerModal,
  type PostView,
} from "@/components/posts/post-composer";

export type AppShellUser = {
  name: string;
  userID: string;
  image: string | null;
};

export function AppShell({
  children,
  currentUser,
}: {
  children: ReactNode;
  currentUser: AppShellUser;
}) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [createdPost, setCreatedPost] = useState<PostView | null>(null);
  const postCreatedContext = useMemo(
    () => ({
      latestPost: createdPost,
      setLatestPost: setCreatedPost,
    }),
    [createdPost],
  );

  return (
    <PostCreatedProvider value={postCreatedContext}>
      <div className="min-h-screen bg-black text-[#e7e9ea]">
        <div className="mx-auto grid min-h-screen w-full max-w-5xl grid-cols-1 md:grid-cols-[260px_minmax(0,640px)]">
          <aside className="sticky top-0 hidden h-screen border-r border-[#2f3336] px-3 py-3 md:flex md:flex-col">
            <Link
              href="/home"
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-full transition hover:bg-[#181919]"
              aria-label="Orbit Home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#536471] bg-[#0b1514] text-sm font-black text-[#9cffef] shadow-[0_0_24px_rgba(156,255,239,0.2)]">
                O
              </span>
            </Link>

            <nav className="flex flex-1 flex-col gap-2" aria-label="Main">
              <NavItem
                href="/home"
                icon="H"
                label="Home"
                active={pathname === "/home"}
              />
              <NavItem
                href="/profile"
                icon="P"
                label="Profile"
                active={pathname === "/profile"}
              />
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="mt-4 min-h-12 rounded-full bg-[#eff3f4] px-8 text-base font-black text-[#0f1419] transition hover:bg-[#d7dbdc] focus:outline-none focus:ring-2 focus:ring-[#1d9bf0]"
              >
                Post
              </button>
            </nav>

            <div className="relative">
              {accountOpen ? (
                <div className="absolute bottom-20 left-0 w-full rounded-2xl border border-[#2f3336] bg-black p-3 shadow-[0_0_24px_rgba(255,255,255,0.16)]">
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition hover:bg-[#181919]"
                  >
                    Log out @{currentUser.userID}
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
                className="flex w-full items-center gap-3 rounded-full p-3 text-left transition hover:bg-[#181919] focus:outline-none focus:ring-2 focus:ring-[#1d9bf0]"
              >
                <Avatar name={currentUser.name} image={currentUser.image} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">
                    {currentUser.name}
                  </span>
                  <span className="block truncate text-sm text-[#71767b]">
                    @{currentUser.userID}
                  </span>
                </span>
                <span className="text-lg font-black" aria-hidden="true">
                  ...
                </span>
              </button>
            </div>
          </aside>

          <div className="min-w-0 border-r border-[#2f3336] md:border-r">
            <MobileTopBar
              currentUser={currentUser}
              onPost={() => setComposerOpen(true)}
            />
            {children}
          </div>
        </div>

        {composerOpen ? (
          <PostComposerModal
            currentUser={currentUser}
            onCreated={setCreatedPost}
            onClose={() => setComposerOpen(false)}
          />
        ) : null}
      </div>
    </PostCreatedProvider>
  );
}

function NavItem({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-4 rounded-full px-4 py-3 text-xl transition hover:bg-[#181919]"
      aria-current={active ? "page" : undefined}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-black ${
          active
            ? "border-[#1d9bf0] bg-[#031018] text-[#1d9bf0]"
            : "border-[#536471] text-[#e7e9ea]"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className={active ? "font-black" : "font-bold"}>{label}</span>
    </Link>
  );
}

function MobileTopBar({
  currentUser,
  onPost,
}: {
  currentUser: AppShellUser;
  onPost: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#2f3336] bg-black/90 px-4 py-2 backdrop-blur md:hidden">
      <Link href="/home" className="text-base font-black text-[#9cffef]">
        Orbit
      </Link>
      <nav className="flex items-center gap-2" aria-label="Mobile main">
        <Link
          href="/home"
          className="rounded-full px-3 py-2 text-sm font-bold hover:bg-[#181919]"
        >
          Home
        </Link>
        <Link
          href="/profile"
          className="rounded-full px-3 py-2 text-sm font-bold hover:bg-[#181919]"
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={onPost}
          className="rounded-full bg-[#eff3f4] px-4 py-2 text-sm font-black text-[#0f1419]"
        >
          Post
        </button>
      </nav>
      <span className="sr-only">Signed in as @{currentUser.userID}</span>
    </div>
  );
}

function Avatar({ image, name }: { image: string | null; name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "O";

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b3431] bg-cover bg-center text-sm font-black text-[#9cffef]"
      style={image ? { backgroundImage: `url("${image}")` } : undefined}
    >
      {image ? null : initial}
    </span>
  );
}
