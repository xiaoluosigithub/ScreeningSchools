import React from "react";
import type { FavoriteSchool, School } from "../../types";
import type { AnchorToast } from "../../hooks/useAnchorToast";
import SchoolCard from "./SchoolCard";

interface FavoritesModalProps {
  open: boolean;
  favorites: FavoriteSchool[];
  favoritesLimit: number;
  favoriteKeyword: string;
  onFavoriteKeywordChange: (value: string) => void;
  onClose: () => void;
  onCopyFavorites: () => void;
  onClearFavorites: () => void;
  onOpenSchoolDetail: (school: School) => void;
  onToggleFavorite: (school: School) => void;
  getToast: (schoolCode: string) => AnchorToast | null;
  actionToast: { text: string; visible: boolean };
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({
  open,
  favorites,
  favoritesLimit,
  favoriteKeyword,
  onFavoriteKeywordChange,
  onClose,
  onCopyFavorites,
  onClearFavorites,
  onOpenSchoolDetail,
  onToggleFavorite,
  getToast,
  actionToast
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[80vh] rounded-xl bg-white shadow-lg border border-gray-200 flex flex-col relative">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">收藏夹</h3>
              <p className="text-xs text-gray-500">最多收藏 {favoritesLimit} 所学校，按最近收藏排序</p>
            </div>
            <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200" onClick={onClose}>
              关闭
            </button>
          </div>

          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <input
              value={favoriteKeyword}
              onChange={(e) => onFavoriteKeywordChange(e.target.value)}
              placeholder="搜索收藏学校/省/市/层次..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200 hover:bg-blue-100" onClick={onCopyFavorites}>
              复制清单
            </button>
            <button className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 hover:bg-red-100" onClick={onClearFavorites}>
              清空收藏
            </button>
          </div>

          {actionToast.text && (
            <div
              className={`absolute right-4 top-16 z-10 px-3 py-2 rounded-lg bg-slate-800/90 text-white text-xs shadow-md pointer-events-none transition-all duration-300 ${
                actionToast.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              {actionToast.text}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {favorites.length === 0 && <div className="text-sm text-gray-500">暂无收藏学校</div>}
            {favorites.map((item, idx) => (
              <SchoolCard
                key={`${item.school.school_code}-${item.favoritedAt}`}
                school={item.school}
                index={idx + 1}
                onClick={() => onOpenSchoolDetail(item.school)}
                isFavorited={true}
                onToggleFavorite={onToggleFavorite}
                toast={getToast(item.school.school_code)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;

