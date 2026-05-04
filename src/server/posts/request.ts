export type PostSubmission = {
  content: unknown;
  draftId?: string | null;
  imageFiles: File[];
};

function isMultipartRequest(request: Request): boolean {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("multipart/form-data")
    ? true
    : false;
}

function isFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

function readOptionalText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function readPostSubmission(
  request: Request,
): Promise<PostSubmission> {
  if (isMultipartRequest(request)) {
    return readFormDataSubmission(request);
  }

  const body = (await request.clone().json().catch(() => null)) as {
    content?: unknown;
    draftId?: unknown;
  } | null;

  if (body === null) {
    return readFormDataSubmission(request);
  }

  return {
    content: body.content,
    draftId:
      typeof body.draftId === "string" && body.draftId.trim().length > 0
        ? body.draftId.trim()
        : null,
    imageFiles: [],
  };
}

async function readFormDataSubmission(request: Request): Promise<PostSubmission> {
  const formData = await request.formData();

  return {
    content: formData.get("content"),
    draftId: readOptionalText(formData.get("draftId")),
    imageFiles: formData
      .getAll("images")
      .filter(isFile)
      .filter((file) => file.size > 0),
  };
}
