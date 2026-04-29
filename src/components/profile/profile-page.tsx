"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserProfileView } from "@/features/users/profile";

type ProfileTab = "posts" | "likes";

export function ProfilePage({ profile }: { profile: UserProfileView }) {
  const router = useRouter();
  const [view, setView] = useState(profile);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [editing, setEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(profile.viewerFollows);
  const [followError, setFollowError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  async function toggleFollow() {
    setFollowBusy(true);
    setFollowError(null);

    const response = await fetch(`/api/users/${view.userID}/follow`, {
      method: isFollowing ? "DELETE" : "POST",
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      profile?: UserProfileView;
    };

    setFollowBusy(false);

    if (!response.ok) {
      setFollowError(result.message ?? "Could not update follow state.");
      return;
    }

    setIsFollowing(Boolean(result.profile?.viewerFollows));
    if (result.profile) {
      setView(result.profile);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-[#2f3336] bg-black/90 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold transition hover:bg-[#181919]"
          aria-label="Go back"
        >
          &lt;
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black">{view.name}</h1>
          <p className="text-sm text-[#71767b]">{view.postCount} posts</p>
        </div>
      </header>

      <section>
        <div
          className="h-48 border-b border-[#2f3336] bg-[#082947] bg-cover bg-center"
          style={
            view.bannerUrl
              ? { backgroundImage: `url("${view.bannerUrl}")` }
              : {
                  backgroundImage:
                    "linear-gradient(135deg, #082947 0%, #0e4b4f 52%, #102035 100%)",
                }
          }
        />
        <div className="px-4 pb-4">
          <div className="-mt-16 flex items-start justify-between">
            <ProfileAvatar image={view.image} name={view.name} />
            {view.isCurrentUser ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-4 min-h-10 rounded-full border border-[#536471] px-5 text-sm font-black transition hover:bg-[#181919]"
              >
                Edit Profile
              </button>
            ) : (
              <div className="mt-4 flex flex-col items-end gap-2">
                <button
                  type="button"
                  disabled={followBusy}
                  onClick={() => void toggleFollow()}
                  className={`min-h-10 rounded-full px-5 text-sm font-black transition ${
                    isFollowing
                      ? "border border-[#536471] text-[#e7e9ea] hover:border-[#67070f] hover:bg-[#20070a] hover:text-[#f4212e]"
                      : "bg-[#eff3f4] text-[#0f1419] hover:bg-[#d7dbdc]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                {followError ? (
                  <p className="max-w-48 text-right text-xs font-bold text-[#f4212e]">
                    {followError}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-black">{view.name}</h2>
            <p className="text-base text-[#71767b]">@{view.userID}</p>
            {view.bio ? (
              <p className="mt-4 whitespace-pre-wrap text-base leading-6">
                {view.bio}
              </p>
            ) : (
              <p className="mt-4 text-base text-[#71767b]">No bio added yet.</p>
            )}
          </div>
        </div>
      </section>

      <div
        className={`grid border-b border-[#2f3336] ${
          view.isCurrentUser ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <ProfileTabButton
          active={activeTab === "posts"}
          label="Posts"
          onClick={() => setActiveTab("posts")}
        />
        {view.isCurrentUser ? (
          <ProfileTabButton
            active={activeTab === "likes"}
            label="Likes"
            onClick={() => setActiveTab("likes")}
          />
        ) : null}
      </div>

      <section className="px-8 py-14 text-center">
        {activeTab === "likes" && view.isCurrentUser ? (
          <>
            <h3 className="text-2xl font-black">Your likes are private.</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#71767b]">
              Liked posts will appear here after Phase 5 interactions land.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-black">No posts yet.</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#71767b]">
              Posts and reposts arrive in the posting and feed phases.
            </p>
          </>
        )}
      </section>

      {editing ? (
        <EditProfileModal
          profile={view}
          onClose={() => setEditing(false)}
          onSaved={(updatedProfile) => {
            setView(updatedProfile);
            setEditing(false);
            router.refresh();
          }}
        />
      ) : null}
    </main>
  );
}

function ProfileTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-h-14 text-sm font-black transition hover:bg-[#181919]"
    >
      <span className={active ? "text-[#e7e9ea]" : "text-[#71767b]"}>
        {label}
      </span>
      {active ? (
        <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
      ) : null}
    </button>
  );
}

function ProfileAvatar({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "O";

  return (
    <div
      className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-black bg-[#1b3431] bg-cover bg-center text-5xl font-black text-[#9cffef]"
      style={image ? { backgroundImage: `url("${image}")` } : undefined}
      aria-label={`${name} avatar`}
    >
      {image ? null : initial}
    </div>
  );
}

function EditProfileModal({
  onClose,
  onSaved,
  profile,
}: {
  onClose: () => void;
  onSaved: (profile: UserProfileView) => void;
  profile: UserProfileView;
}) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [image, setImage] = useState(profile.image ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/users/me/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        bio,
        image,
        bannerUrl,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      profile?: UserProfileView;
    };

    setSaving(false);

    if (!response.ok || !result.profile) {
      setMessage(result.message ?? "Could not save profile.");
      return;
    }

    onSaved(result.profile);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#5b7083]/40 px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#2f3336] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-5 border-b border-[#2f3336] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold transition hover:bg-[#181919]"
            aria-label="Close edit profile"
          >
            x
          </button>
          <h2 id="edit-profile-title" className="flex-1 text-xl font-black">
            Edit Profile
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveProfile()}
            className="rounded-full bg-[#eff3f4] px-5 py-2 text-sm font-black text-[#0f1419] transition hover:bg-[#d7dbdc] disabled:opacity-60"
          >
            {saving ? "Saving" : "Save"}
          </button>
        </div>

        <div className="space-y-4 p-4">
          <ProfileField
            label="Name"
            value={name}
            maxLength={50}
            onChange={setName}
          />
          <ProfileField
            label="Bio"
            value={bio}
            maxLength={160}
            onChange={setBio}
            multiline
          />
          <ProfileField
            label="Avatar image URL"
            value={image}
            onChange={setImage}
          />
          <ProfileField
            label="Banner image URL"
            value={bannerUrl}
            onChange={setBannerUrl}
          />
          <div className="rounded-xl border border-[#2f3336] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#71767b]">
              userID
            </p>
            <p className="mt-1 text-base font-black">@{profile.userID}</p>
          </div>
          {message ? (
            <p className="rounded-xl border border-[#f4212e] bg-[#20070a] px-4 py-3 text-sm font-bold text-[#ff8b94]">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  maxLength,
  multiline,
  onChange,
  value,
}: {
  label: string;
  maxLength?: number;
  multiline?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputClass =
    "mt-1 w-full bg-transparent text-base font-semibold text-[#e7e9ea] outline-none placeholder:text-[#71767b]";

  return (
    <label className="block rounded-xl border border-[#2f3336] px-4 py-3 focus-within:border-[#1d9bf0]">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#71767b]">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} min-h-24 resize-none`}
        />
      ) : (
        <input
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </label>
  );
}
