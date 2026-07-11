const STATIC_FILE_PATTERN = /\.(?:webp|png|jpe?g|gif|svg|ico|css|js|mjs|map|json|xml|txt|pdf|woff2?|ttf|eot|avif)(?:[?#].*)?$/i;

const NON_HTTP_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export function addTrailingSlash(url: string) {
  if (!url) return "/";
  if (url === "/") return "/";
  if (NON_HTTP_SCHEME_PATTERN.test(url) && !url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

  if (!path || path === "/") return `/${query}${hash}`;
  if (STATIC_FILE_PATTERN.test(path)) return url;

  return `${path.endsWith("/") ? path : `${path}/`}${query}${hash}`;
}

export function siteUrl(path = "/") {
  const baseUrl = "https://www.noithathungngoc.com";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return addTrailingSlash(path);
  }
  return addTrailingSlash(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
}
