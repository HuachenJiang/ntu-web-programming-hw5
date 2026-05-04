import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import {
  isAllowedPostImageType,
  type PostMediaView,
} from "@/features/posts/media";

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

function cleanFilename(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 120) : null;
}

export async function uploadPostMedia({
  files,
  userId,
}: {
  files: File[];
  userId: string;
}): Promise<PostMediaView[]> {
  const uploaded: PostMediaView[] = [];

  try {
    for (const file of files) {
      if (!isAllowedPostImageType(file.type)) {
        throw new Error(`Unsupported image content type: ${file.type}`);
      }

      const extension = extensionForContentType(file.type);
      const pathname = `posts/${userId}/${randomUUID()}.${extension}`;
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      });

      uploaded.push({
        url: blob.url,
        pathname: blob.pathname,
        contentType: file.type,
        size: file.size,
        filename: cleanFilename(file.name),
        uploadedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    await deletePostMedia(uploaded);
    throw error;
  }

  return uploaded;
}

export async function deletePostMedia(media: PostMediaView[]) {
  const pathnames = media.map((item) => item.pathname);

  if (pathnames.length === 0) {
    return;
  }

  await del(pathnames).catch(() => undefined);
}
