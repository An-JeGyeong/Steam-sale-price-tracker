const KEY = "steam-local-wishlist";

export interface LocalWishItem {
  id: string;
  title: string;
  boxart?: string;
  cut: number;
  price: number;
  url: string;
  savedAt: number;
}

export function getLocalWishlist(): LocalWishItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalWishItem[];
  } catch {
    return [];
  }
}

export function addToLocalWishlist(item: LocalWishItem): void {
  const list = getLocalWishlist().filter((i) => i.id !== item.id);
  localStorage.setItem(KEY, JSON.stringify([item, ...list]));
}

export function removeFromLocalWishlist(id: string): void {
  const list = getLocalWishlist().filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isInLocalWishlist(id: string): boolean {
  return getLocalWishlist().some((i) => i.id === id);
}
