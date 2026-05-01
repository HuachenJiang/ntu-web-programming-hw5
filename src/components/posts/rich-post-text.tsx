import type React from "react";
import type { PostEntity } from "@/features/posts/content";

export function RichPostText({
  content,
  entities,
}: {
  content: string;
  entities: PostEntity[];
}) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const entity of entities) {
    if (entity.start > cursor) {
      nodes.push(content.slice(cursor, entity.start));
    }

    nodes.push(
      <a
        key={`${entity.type}-${entity.start}-${entity.end}`}
        href={entity.href}
        onClick={(event) => event.stopPropagation()}
        target={entity.type === "url" ? "_blank" : undefined}
        rel={entity.type === "url" ? "noreferrer" : undefined}
        className="font-semibold text-[#1d9bf0] hover:underline"
      >
        {entity.text}
      </a>,
    );
    cursor = entity.end;
  }

  if (cursor < content.length) {
    nodes.push(content.slice(cursor));
  }

  return <p className="whitespace-pre-wrap break-words leading-6">{nodes}</p>;
}
