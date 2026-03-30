export type AppLocale = "en" | "zh";

export function localizePath(path: string, locale: AppLocale = "en") {
  if (locale === "en") {
    return path;
  }

  if (path === "/") {
    return "/zh";
  }

  if (!path.startsWith("/")) {
    return path;
  }

  return `/zh${path}`;
}
