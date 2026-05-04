import {
  POST_MEDIA_MAX_FILE_SIZE_BYTES,
  validatePostImageFiles,
} from "@/features/posts/media";
import { describe, expect, it } from "vitest";

describe("post media validation", () => {
  it("accepts up to two supported image files", () => {
    const files = [
      new File(["one"], "one.jpg", { type: "image/jpeg" }),
      new File(["two"], "two.webp", { type: "image/webp" }),
    ];

    expect(validatePostImageFiles(files)).toEqual({
      ok: true,
      files,
    });
  });

  it("rejects more than two images", () => {
    const result = validatePostImageFiles([
      new File(["one"], "one.png", { type: "image/png" }),
      new File(["two"], "two.png", { type: "image/png" }),
      new File(["three"], "three.png", { type: "image/png" }),
    ]);

    expect(result).toMatchObject({
      ok: false,
      status: "too_many_images",
    });
  });

  it("rejects non-image files", () => {
    const result = validatePostImageFiles([
      new File(["text"], "notes.txt", { type: "text/plain" }),
    ]);

    expect(result).toMatchObject({
      ok: false,
      status: "invalid_image_type",
    });
  });

  it("rejects images larger than five megabytes", () => {
    const bytes = new Uint8Array(POST_MEDIA_MAX_FILE_SIZE_BYTES + 1);
    const result = validatePostImageFiles([
      new File([bytes], "large.png", { type: "image/png" }),
    ]);

    expect(result).toMatchObject({
      ok: false,
      status: "image_too_large",
    });
  });
});
