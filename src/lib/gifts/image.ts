export const GIFT_PLACEHOLDER_URL = "/assets/img/gift-placeholder.jpg";

export function resolveGiftImageUrl(
  imageUrl: string | null | undefined,
): string {
  const trimmed = imageUrl?.trim();
  if (trimmed) {
    return trimmed;
  }
  return GIFT_PLACEHOLDER_URL;
}
