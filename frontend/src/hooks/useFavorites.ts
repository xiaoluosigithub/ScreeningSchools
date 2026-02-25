import { useCallback, useEffect, useMemo, useState } from "react";
import type { FavoriteSchool, School } from "../types";

const FAVORITES_KEY = "school_favorites_v1";

function readFavorites(): FavoriteSchool[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item: any) => item?.school?.school_code && typeof item?.favoritedAt === "number");
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteSchool[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

export function useFavorites(limit: number) {
  const [favorites, setFavorites] = useState<FavoriteSchool[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  const favoriteCodeSet = useMemo(() => new Set(favorites.map((item) => item.school.school_code)), [favorites]);

  const isFavorited = useCallback((schoolCode: string) => favoriteCodeSet.has(schoolCode), [favoriteCodeSet]);

  const toggleFavorite = useCallback((school: School) => {
    const exists = favorites.some((item) => item.school.school_code === school.school_code);
    if (exists) {
      const next = favorites.filter((item) => item.school.school_code !== school.school_code);
      setFavorites(next);
      writeFavorites(next);
      return { status: "removed" as const, favorites: next };
    }
    if (favorites.length >= limit) {
      return { status: "limit" as const, favorites };
    }
    const next: FavoriteSchool[] = [{ school, favoritedAt: Date.now() }, ...favorites];
    setFavorites(next);
    writeFavorites(next);
    return { status: "added" as const, favorites: next };
  }, [favorites, limit]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    writeFavorites([]);
  }, []);

  return {
    favorites,
    favoriteCodeSet,
    isFavorited,
    toggleFavorite,
    clearFavorites
  };
}

