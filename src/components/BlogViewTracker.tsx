"use client";

import { useEffect } from "react";

type BlogViewTrackerProps = {
  slug: string;
};

export default function BlogViewTracker({ slug }: BlogViewTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    const storageKey = `blog-view:${slug}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");

    fetch("/api/blog-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      sessionStorage.removeItem(storageKey);
    });
  }, [slug]);

  return null;
}
