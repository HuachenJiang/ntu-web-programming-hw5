"use client";

import { createContext, useContext } from "react";
import type { PostView } from "@/components/posts/post-composer";

type PostCreatedContextValue = {
  latestPost: PostView | null;
  setLatestPost: (post: PostView) => void;
};

const PostCreatedContext = createContext<PostCreatedContextValue>({
  latestPost: null,
  setLatestPost: () => {},
});

export const PostCreatedProvider = PostCreatedContext.Provider;

export function usePostCreatedPreview() {
  return useContext(PostCreatedContext);
}
