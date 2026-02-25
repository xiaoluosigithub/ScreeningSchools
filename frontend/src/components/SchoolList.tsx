import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAllSchools, getSchoolsByProvince, getSchoolsByCity, searchSchools } from "../api/schools";
import type { MetricLevel, School } from "../types";
import { useFavorites } from "../hooks/useFavorites";
import { useAnchorToast, type ToastTone } from "../hooks/useAnchorToast";
import SchoolDetailModal from "./SchoolDetailModal";
import FavoritesModal from "./school-list/FavoritesModal";
import PaginationBar from "./school-list/PaginationBar";
import SchoolCard from "./school-list/SchoolCard";

interface SchoolListProps {
  level: "country" | "province" | "city";
  province?: string | null;
  city?: string | null;
  metric?: MetricLevel;
}

type TriggerScope = "list" | "favorites" | "modal";

const FAVORITES_LIMIT = 100;
const CARD_TOAST_HIDE_MS = 900;
const CARD_TOAST_REMOVE_MS = 1300;
const ACTION_TOAST_HIDE_MS = 1000;
const ACTION_TOAST_REMOVE_MS = 1400;

const SchoolList: React.FC<SchoolListProps> = ({ level, province, city, metric = "total" }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [pageSizeInput, setPageSizeInput] = useState<string>("6");

  const [favoritesOpen, setFavoritesOpen] = useState<boolean>(false);
  const [favoriteKeyword, setFavoriteKeyword] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const [favoritesActionToast, setFavoritesActionToast] = useState<{ text: string; visible: boolean }>({ text: "", visible: false });
  const [modalToast, setModalToast] = useState<{ text: string; tone: ToastTone; visible: boolean } | null>(null);

  const favoritesActionTimerRef = useRef<{ hideId?: number; removeId?: number }>({});
  const modalToastTimerRef = useRef<{ hideId?: number; removeId?: number }>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  const { favorites, favoriteCodeSet, toggleFavorite: toggleFavoriteCore, clearFavorites } = useFavorites(FAVORITES_LIMIT);
  const { getToast, showToast } = useAnchorToast({
    maxToasts: 2,
    hideMs: CARD_TOAST_HIDE_MS,
    removeMs: CARD_TOAST_REMOVE_MS
  });

  const listKey = useMemo(() => `${level}|${province ?? ""}|${city ?? ""}|${metric}|${keyword.trim()}`, [level, province, city, metric, keyword]);

  const title = useMemo(() => {
    const scope = level === "country" ? "中国" : level === "province" ? province ?? "" : city ?? "";
    if (metric === "bachelor") return `${scope} 的本科学校`;
    if (level === "country") return "全部学校";
    return `${scope} 的学校`;
  }, [level, province, city, metric]);

  const filteredFavorites = useMemo(() => {
    const kw = favoriteKeyword.trim().toLowerCase();
    if (!kw) return favorites;
    return favorites.filter((item) => {
      const school = item.school;
      return (
        school.school_name.toLowerCase().includes(kw) ||
        school.province.toLowerCase().includes(kw) ||
        school.city.toLowerCase().includes(kw) ||
        school.education_level.toLowerCase().includes(kw)
      );
    });
  }, [favorites, favoriteKeyword]);

  function showFavoritesActionToast(text: string) {
    if (favoritesActionTimerRef.current.hideId) window.clearTimeout(favoritesActionTimerRef.current.hideId);
    if (favoritesActionTimerRef.current.removeId) window.clearTimeout(favoritesActionTimerRef.current.removeId);

    setFavoritesActionToast({ text, visible: true });

    favoritesActionTimerRef.current.hideId = window.setTimeout(() => {
      setFavoritesActionToast((prev) => ({ ...prev, visible: false }));
    }, ACTION_TOAST_HIDE_MS);

    favoritesActionTimerRef.current.removeId = window.setTimeout(() => {
      setFavoritesActionToast({ text: "", visible: false });
    }, ACTION_TOAST_REMOVE_MS);
  }

  function showModalToast(text: string, tone: ToastTone) {
    if (modalToastTimerRef.current.hideId) window.clearTimeout(modalToastTimerRef.current.hideId);
    if (modalToastTimerRef.current.removeId) window.clearTimeout(modalToastTimerRef.current.removeId);

    setModalToast({ text, tone, visible: true });

    modalToastTimerRef.current.hideId = window.setTimeout(() => {
      setModalToast((prev) => (prev ? { ...prev, visible: false } : prev));
    }, CARD_TOAST_HIDE_MS);

    modalToastTimerRef.current.removeId = window.setTimeout(() => {
      setModalToast(null);
    }, CARD_TOAST_REMOVE_MS);
  }

  function handleFavoriteResult(source: TriggerScope, schoolCode: string, status: "added" | "removed" | "limit") {
    if (status === "limit") {
      const text = `收藏上限为 ${FAVORITES_LIMIT} 所学校`;
      if (source === "favorites") showFavoritesActionToast(text);
      else if (source === "modal") showModalToast(text, "cancel");
      else showToast("list", schoolCode, text, "cancel");
      return;
    }

    const text = status === "added" ? "已加入收藏" : "已取消收藏";
    const tone: ToastTone = status === "added" ? "favorite" : "cancel";

    if (source === "modal") {
      showModalToast(text, tone);
      return;
    }
    if (source === "favorites") {
      showToast("favorites", schoolCode, text, tone);
      return;
    }
    showToast("list", schoolCode, text, tone);
  }

  function toggleFavorite(school: School, source: TriggerScope) {
    const result = toggleFavoriteCore(school);
    handleFavoriteResult(source, school.school_code, result.status);
  }

  async function copyFavorites() {
    if (filteredFavorites.length === 0) {
      showFavoritesActionToast("收藏夹为空");
      return;
    }
    const lines = filteredFavorites.map((item, idx) => {
      const school = item.school;
      return `${idx + 1}. ${school.school_name} | ${school.province}-${school.city} | ${school.education_level}`;
    });
    const text = `收藏学校清单（共 ${filteredFavorites.length} 所）\n${lines.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      showFavoritesActionToast("已复制到剪贴板");
    } catch {
      showFavoritesActionToast("复制失败，请手动复制");
    }
  }

  function handleClearFavorites() {
    if (favorites.length === 0) return;
    const ok = window.confirm("确定清空全部收藏吗？该操作不可撤销。");
    if (!ok) return;
    clearFavorites();
    showFavoritesActionToast("已取消收藏");
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      let data: School[] = [];
      if (keyword.trim().length > 0) {
        data = await searchSchools(keyword.trim());
      } else if (level === "country") {
        data = await getAllSchools();
      } else if (level === "province" && province) {
        data = await getSchoolsByProvince(province);
      } else if (level === "city" && city) {
        data = await getSchoolsByCity(city);
      }
      const filtered = metric === "bachelor" ? data.filter((s) => String(s.education_level || "").includes("本科")) : data;
      setSchools(filtered);
    } catch {
      setError("学校数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [level, province, city, metric]);

  useEffect(() => {
    const id = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(id);
  }, [keyword]);

  useEffect(() => {
    if (!favoritesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFavoritesOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [favoritesOpen]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      const pUrl = Number(sp.get("page"));
      const sUrl = Number(sp.get("pageSize"));
      const lsRaw = localStorage.getItem(`list_state:${listKey}`);
      const ls = lsRaw ? JSON.parse(lsRaw) : null;
      const p = Number.isFinite(pUrl) && pUrl > 0 ? pUrl : ls?.page ?? 1;
      const s = Number.isFinite(sUrl) && sUrl > 0 ? sUrl : ls?.pageSize ?? pageSize;
      setPage(schools.length ? Math.min(p, Math.max(1, Math.ceil(schools.length / s))) : p);
      setPageSize(s);
    } catch {}
  }, [listKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`list_state:${listKey}`, JSON.stringify({ page, pageSize }));
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [page, pageSize, listKey]);

  useEffect(() => {
    setPageSizeInput(String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    return () => {
      if (favoritesActionTimerRef.current.hideId) window.clearTimeout(favoritesActionTimerRef.current.hideId);
      if (favoritesActionTimerRef.current.removeId) window.clearTimeout(favoritesActionTimerRef.current.removeId);
      if (modalToastTimerRef.current.hideId) window.clearTimeout(modalToastTimerRef.current.hideId);
      if (modalToastTimerRef.current.removeId) window.clearTimeout(modalToastTimerRef.current.removeId);
    };
  }, []);

  const total = schools.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedSchools = schools.slice(start, end);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(total / pageSize));
    if (page > tp) setPage(tp);
  }, [schools, pageSize]);

  function gotoPage(p: number) {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  function commitPageSize() {
    const v = Number(pageSizeInput);
    if (!Number.isFinite(v)) {
      setPageSizeInput(String(pageSize));
      return;
    }
    const s = Math.min(200, Math.max(5, Math.floor(v)));
    setPageSize(s);
    setPageSizeInput(String(s));
    gotoPage(1);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">数据来源：MySQL / 后端接口</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-200 hover:bg-amber-100"
            onClick={() => setFavoritesOpen(true)}
          >
            收藏夹 {favorites.length}
          </button>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索学校/省/市..."
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedSchool(null);
        }}
      >
        {loading && <div className="text-gray-600 text-sm">正在加载...</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!loading && !error && total === 0 && <div className="text-gray-500 text-sm">暂无数据</div>}
        {pagedSchools.map((s, idx) => (
          <SchoolCard
            key={`${s.school_code}-${start + idx}`}
            school={s}
            index={start + idx + 1}
            onClick={() => setSelectedSchool(s)}
            isFavorited={favoriteCodeSet.has(s.school_code)}
            onToggleFavorite={(school) => toggleFavorite(school, "list")}
            toast={getToast("list", s.school_code)}
          />
        ))}
      </div>

      <PaginationBar
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeInput={pageSizeInput}
        onChangePageSize={(value) => {
          setPageSize(value);
          setPageSizeInput(String(value));
        }}
        onChangePageSizeInput={setPageSizeInput}
        onCommitPageSize={commitPageSize}
        onGotoPage={gotoPage}
      />

      <FavoritesModal
        open={favoritesOpen}
        favorites={filteredFavorites}
        favoritesLimit={FAVORITES_LIMIT}
        favoriteKeyword={favoriteKeyword}
        onFavoriteKeywordChange={setFavoriteKeyword}
        onClose={() => setFavoritesOpen(false)}
        onCopyFavorites={copyFavorites}
        onClearFavorites={handleClearFavorites}
        onOpenSchoolDetail={setSelectedSchool}
        onToggleFavorite={(school) => toggleFavorite(school, "favorites")}
        getToast={(schoolCode) => getToast("favorites", schoolCode)}
        actionToast={favoritesActionToast}
      />

      <SchoolDetailModal
        school={selectedSchool}
        onClose={() => setSelectedSchool(null)}
        isFavorited={selectedSchool ? favoriteCodeSet.has(selectedSchool.school_code) : false}
        onToggleFavorite={(school) => toggleFavorite(school, "modal")}
        feedback={modalToast}
      />
    </div>
  );
};

export default SchoolList;

