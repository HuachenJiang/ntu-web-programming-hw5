export const POST_MEDIA_MAX_IMAGES = 2;
export const POST_MEDIA_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_POST_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedPostImageType = (typeof ALLOWED_POST_IMAGE_TYPES)[number];

export type PostMediaView = {
  url: string;
  pathname: string;
  contentType: AllowedPostImageType;
  size: number;
  filename: string | null;
  uploadedAt: string;
};

export type PostMediaValidationResult =
  | {
      ok: true;
      files: File[];
    }
  | {
      ok: false;
      status: "too_many_images" | "invalid_image_type" | "image_too_large";
      message: string;
    };

export function isAllowedPostImageType(
  value: string,
): value is AllowedPostImageType {
  return ALLOWED_POST_IMAGE_TYPES.includes(value as AllowedPostImageType);
}

export function validatePostImageFiles(
  files: File[],
): PostMediaValidationResult {
  if (files.length > POST_MEDIA_MAX_IMAGES) {
    return {
      ok: false,
      status: "too_many_images",
      message: `Attach at most ${POST_MEDIA_MAX_IMAGES} images.`,
    };
  }

  for (const file of files) {
    if (!isAllowedPostImageType(file.type)) {
      return {
        ok: false,
        status: "invalid_image_type",
        message: "Only JPEG, PNG, WebP, or GIF images can be attached.",
      };
    }

    if (file.size > POST_MEDIA_MAX_FILE_SIZE_BYTES) {
      return {
        ok: false,
        status: "image_too_large",
        message: "Each attached image must be 5 MB or smaller.",
      };
    }
  }

  return {
    ok: true,
    files,
  };
}
