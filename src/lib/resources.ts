export function safeResourceUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export const RESOURCE_TYPES = [
  { value: "youtube", label: "قناة / فيديو يوتيوب" },
  { value: "telegram", label: "قناة تلغرام" },
  { value: "drive", label: "Google Drive" },
  { value: "file", label: "ملف جاهز (رفع)" },
  { value: "exercise", label: "تمارين" },
  { value: "website", label: "موقع إلكتروني" },
] as const;

const LABELS: Record<string, string> = {
  youtube: "يوتيوب",
  telegram: "تلغرام",
  drive: "Google Drive",
  file: "ملف",
  exercise: "تمارين",
  website: "موقع",
  channel: "قناة تعليمية",
};

export const resourceTypeLabel = (category: string) => LABELS[category] ?? "مصدر";

/** Guess the resource type from a link so admins don't have to pick it manually. */
export function detectResourceType(value: string): "youtube" | "telegram" | "drive" | null {
  const url = safeResourceUrl(value);
  if (!url) return null;
  const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "t.me" || host === "telegram.me" || host === "telegram.org" || host.endsWith(".telegram.org")) return "telegram";
  if (host === "drive.google.com" || host === "docs.google.com") return "drive";
  return null;
}
