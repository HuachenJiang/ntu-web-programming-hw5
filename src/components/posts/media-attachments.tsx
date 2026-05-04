"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef } from "react";
import {
  POST_MEDIA_MAX_IMAGES,
  validatePostImageFiles,
  type PostMediaView,
} from "@/features/posts/media";

function ImageIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="m7 16 3.5-4 2.5 3 2-2.2 2 3.2" />
      <circle cx="8.5" cy="9" r="1.2" />
    </svg>
  );
}

function createPreviewUrl(file: File): string {
  return typeof URL.createObjectURL === "function"
    ? URL.createObjectURL(file)
    : "";
}

function revokePreviewUrl(url: string) {
  if (url && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

export function MediaAttachmentPicker({
  disabled,
  files,
  onError,
  onFilesChange,
}: {
  disabled?: boolean;
  files: File[];
  onError: (message: string | null) => void;
  onFilesChange: (files: File[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: createPreviewUrl(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        revokePreviewUrl(preview.url);
      }
    };
  }, [previews]);

  function addFiles(fileList: FileList | null) {
    const nextFiles = [...files, ...Array.from(fileList ?? [])];
    const validation = validatePostImageFiles(nextFiles);

    if (!validation.ok) {
      onError(validation.message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    onError(null);
    onFilesChange(validation.files);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
    onError(null);
  }

  return (
    <div className="mt-3">
      {previews.length > 0 ? (
        <div
          className={`mb-3 grid overflow-hidden rounded-2xl border border-[#2f3336] ${
            previews.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
              className="relative aspect-[4/3] min-w-0 bg-[#050505]"
            >
              <span
                role="img"
                aria-label={preview.file.name || "Selected image"}
                className="block h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${preview.url}")` }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeFile(index)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-sm font-black text-white transition hover:bg-[#181919] disabled:opacity-60"
                aria-label={`Remove image ${index + 1}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label="Attach images"
          multiple
          className="sr-only"
          disabled={disabled || files.length >= POST_MEDIA_MAX_IMAGES}
          onChange={(event) => addFiles(event.target.files)}
        />
        <label
          htmlFor={inputId}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[#1d9bf0] transition ${
            disabled || files.length >= POST_MEDIA_MAX_IMAGES
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-[#031018]"
          }`}
          title="Attach images"
        >
          <ImageIcon />
        </label>
        <span className="text-xs font-bold text-[#71767b]">
          {files.length}/{POST_MEDIA_MAX_IMAGES} images
        </span>
      </div>
    </div>
  );
}

export function PostMediaGrid({ media }: { media: PostMediaView[] }) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div
      className={`mt-3 grid overflow-hidden rounded-2xl border border-[#2f3336] ${
        media.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}
    >
      {media.slice(0, POST_MEDIA_MAX_IMAGES).map((item, index) => (
        <div
          key={item.pathname}
          className={`relative min-w-0 bg-[#050505] ${
            media.length === 1 ? "aspect-[16/10]" : "aspect-square"
          }`}
        >
          <Image
            src={item.url}
            alt={item.filename ?? `Attached image ${index + 1}`}
            fill
            sizes={
              media.length === 1
                ? "(max-width: 720px) 92vw, 560px"
                : "(max-width: 720px) 46vw, 280px"
            }
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
