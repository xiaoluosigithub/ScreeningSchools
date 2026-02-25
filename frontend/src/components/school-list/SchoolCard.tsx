import React, { useEffect, useRef, useState } from "react";
import type { School } from "../../types";
import type { AnchorToast } from "../../hooks/useAnchorToast";

interface SchoolCardProps {
  school: School;
  index: number;
  onClick?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: (school: School) => void;
  toast?: AnchorToast | null;
}

type ToastDirection = "top" | "bottom";

const TOP_SAFE_GAP = 88;

const SchoolCard: React.FC<SchoolCardProps> = ({
  school,
  index,
  onClick,
  isFavorited = false,
  onToggleFavorite,
  toast
}) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [toastDirection, setToastDirection] = useState<ToastDirection>("top");

  useEffect(() => {
    if (!toast?.visible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setToastDirection(rect.top < TOP_SAFE_GAP ? "bottom" : "top");
  }, [toast?.visible, toast?.text]);

  const toneClass = toast?.tone === "favorite" ? "bg-amber-500 text-white" : "bg-slate-700 text-white";
  const containerPositionClass = toastDirection === "top" ? "right-0 -top-10" : "right-0 top-9";
  const arrowPositionClass = toastDirection === "top" ? "absolute -bottom-1 right-3 w-2 h-2 rotate-45" : "absolute -top-1 right-3 w-2 h-2 rotate-45";

  return (
    <div className="card p-4 cursor-pointer" onClick={onClick}>
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-1 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">{index}</div>
        </div>
        <div className="col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 font-semibold">{school.school_name}</h3>
          </div>
          <div className="mt-1 text-base text-gray-600">
            <span className="mr-3">{school.education_level}</span>
            <span className="mr-3">{school.department}</span>
          </div>
          <div className="mt-1 text-base text-gray-500">
            {school.province} · {school.city}
          </div>
        </div>
        <div className="col-span-3 text-right">
          <div ref={triggerRef} className="relative inline-flex items-center justify-end gap-2">
            <span className="text-sm text-gray-400">代码 {school.school_code}</span>
            <button
              className={`w-7 h-7 rounded-full text-sm transition-colors ${
                isFavorited
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(school);
              }}
              title={isFavorited ? "取消收藏" : "收藏"}
            >
              {isFavorited ? "★" : "☆"}
            </button>

            {toast && (
              <div
                className={`absolute ${containerPositionClass} pointer-events-none transition-all duration-300 ${
                  toast.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <div className={`relative rounded-lg px-3 py-1.5 text-xs shadow-md whitespace-nowrap ${toneClass}`}>
                  {toast.text}
                  <span className={`${arrowPositionClass} ${toneClass}`} />
                </div>
              </div>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-500 h-6 whitespace-nowrap overflow-hidden text-ellipsis" title={school.notes || undefined}>
            {school.notes ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolCard;

