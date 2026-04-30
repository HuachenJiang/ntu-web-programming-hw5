export const POST_MAX_COUNTED_LENGTH = 280;
export const URL_COUNTED_LENGTH = 23;

export type PostEntityType = "url" | "mention" | "hashtag";

export type PostEntity = {
  type: PostEntityType;
  text: string;
  href: string;
  start: number;
  end: number;
};

export type ParsedPostContent = {
  content: string;
  countedLength: number;
  entities: PostEntity[];
};

export type PostContentValidationResult =
  | {
      ok: true;
      value: ParsedPostContent;
    }
  | {
      ok: false;
      status: "invalid_content" | "empty_content" | "content_too_long";
      message: string;
      countedLength?: number;
    };

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/giu;
const TAG_PATTERN = /(^|[^\p{L}\p{N}_])([#@])([a-zA-Z0-9_]{1,50})/giu;
const TRAILING_URL_PUNCTUATION = /[.,!?;:]+$/u;

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function normalizeUrlHref(value: string): string {
  return value.toLowerCase().startsWith("www.") ? `https://${value}` : value;
}

function rangesOverlap(a: { start: number; end: number }, b: PostEntity) {
  return a.start < b.end && b.start < a.end;
}

function readContent(input: unknown): string | null {
  return typeof input === "string" ? input.trim() : null;
}

export function parsePostContent(input: string): ParsedPostContent {
  const content = input.trim();
  const urlEntities: PostEntity[] = [];

  for (const match of content.matchAll(URL_PATTERN)) {
    const rawText = match[0];
    const trailing = rawText.match(TRAILING_URL_PUNCTUATION)?.[0] ?? "";
    const text = trailing ? rawText.slice(0, -trailing.length) : rawText;

    if (text.length === 0 || typeof match.index !== "number") {
      continue;
    }

    const start = match.index;
    const end = start + text.length;

    urlEntities.push({
      type: "url",
      text,
      href: normalizeUrlHref(text),
      start,
      end,
    });
  }

  const tagEntities: PostEntity[] = [];

  for (const match of content.matchAll(TAG_PATTERN)) {
    if (typeof match.index !== "number") {
      continue;
    }

    const prefix = match[1] ?? "";
    const marker = match[2];
    const value = match[3];

    if (!marker || !value) {
      continue;
    }

    const text = `${marker}${value}`;
    const start = match.index + prefix.length;
    const end = start + text.length;
    const candidate = { start, end };

    if (urlEntities.some((entity) => rangesOverlap(candidate, entity))) {
      continue;
    }

    tagEntities.push({
      type: marker === "@" ? "mention" : "hashtag",
      text,
      href:
        marker === "@"
          ? `/users/${value.toLowerCase()}`
          : `/home?hashtag=${encodeURIComponent(value.toLowerCase())}`,
      start,
      end,
    });
  }

  const entities = [...urlEntities, ...tagEntities].sort(
    (left, right) => left.start - right.start || left.end - right.end,
  );
  const countedLength = entities.reduce((length, entity) => {
    if (entity.type === "url") {
      return length - codePointLength(entity.text) + URL_COUNTED_LENGTH;
    }

    return length - codePointLength(entity.text);
  }, codePointLength(content));

  return {
    content,
    countedLength,
    entities,
  };
}

export function validatePostContent(
  input: unknown,
): PostContentValidationResult {
  const content = readContent(input);

  if (content === null) {
    return {
      ok: false,
      status: "invalid_content",
      message: "Post content must be text.",
    };
  }

  if (content.length === 0) {
    return {
      ok: false,
      status: "empty_content",
      message: "Post content cannot be empty.",
    };
  }

  const parsed = parsePostContent(content);

  if (parsed.countedLength > POST_MAX_COUNTED_LENGTH) {
    return {
      ok: false,
      status: "content_too_long",
      message: "Post content must be 280 counted characters or fewer.",
      countedLength: parsed.countedLength,
    };
  }

  return {
    ok: true,
    value: parsed,
  };
}
