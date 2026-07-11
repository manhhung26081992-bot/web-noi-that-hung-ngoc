import { addTrailingSlash } from "@/lib/url";

const redirects: Record<string, string> = {
  // Thêm các slug sản phẩm cũ tại đây khi phát hiện URL 404 nhưng sản phẩm vẫn còn bán.
  // Ví dụ: "/san-pham/slug-cu/": "/san-pham/slug-moi/",
};

export const productRedirects = Object.fromEntries(
  Object.entries(redirects).map(([source, destination]) => [
    addTrailingSlash(source),
    addTrailingSlash(destination),
  ]),
) as Record<string, string>;
