'use client';

const STORAGE_KEY = 'moontv_favorite_tags';

export interface FavoriteTag {
  name: string;
  color: string;
}

export function getFavoriteTags(): FavoriteTag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '_definitions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteTags(tags: FavoriteTag[]) {
  localStorage.setItem(STORAGE_KEY + '_definitions', JSON.stringify(tags));
}

export function getItemTags(key: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '_items');
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    return map[key] || [];
  } catch {
    return [];
  }
}

export function setItemTags(key: string, tags: string[]) {
  const raw = localStorage.getItem(STORAGE_KEY + '_items');
  const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
  map[key] = tags;
  localStorage.setItem(STORAGE_KEY + '_items', JSON.stringify(map));
}

export function getAllItemTags(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '_items');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const TAG_COLORS = [
  '#e50914',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#14b8a6',
];

export function getTagColor(name: string, tags: FavoriteTag[]): string {
  const existing = tags.find((t) => t.name === name);
  if (existing) return existing.color;
  const usedColors = new Set(tags.map((t) => t.color));
  const available = TAG_COLORS.find((c) => !usedColors.has(c));
  return available || TAG_COLORS[tags.length % TAG_COLORS.length];
}
