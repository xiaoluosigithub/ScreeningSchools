import React, { useEffect, useRef } from "react";
import type { School } from "../types";
import ExternalLinkConfirm from "./ExternalLinkConfirm";

interface Props {
  school: School | null;
  onClose: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: (school: School) => void;
  feedback?: {
    text: string;
    tone: "favorite" | "cancel";
    visible: boolean;
  } | null;
}

const SchoolDetailModal: React.FC<Props> = ({ school, onClose, isFavorited = false, onToggleFavorite, feedback = null }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!school) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [school, onClose]);

  if (!school) return null;

  const searchUrl = `https://www.gaokao.cn/school/search?keyword=${encodeURIComponent(school.school_name)}`;
  const feedbackToneClass = feedback?.tone === "favorite" ? "bg-amber-500 text-white" : "bg-slate-700 text-white";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-2xl rounded-xl bg-white shadow-lg border border-gray-200 outline-none"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{school.school_name}</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    isFavorited
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => onToggleFavorite?.(school)}
                >
                  {isFavorited ? "★ 已收藏" : "☆ 收藏"}
                </button>
                {feedback && (
                  <div
                    className={`absolute right-0 -top-10 pointer-events-none transition-all duration-300 ${
                      feedback.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                  >
                    <div className={`relative rounded-lg px-3 py-1.5 text-xs shadow-md whitespace-nowrap ${feedbackToneClass}`}>
                      {feedback.text}
                      <span className={`absolute -bottom-1 right-3 w-2 h-2 rotate-45 ${feedbackToneClass}`} />
                    </div>
                  </div>
                )}
              </div>
              <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200" onClick={onClose}>
                关闭
              </button>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">学校标识码</div>
              <div className="mt-1 text-gray-900 font-semibold">{school.school_code}</div>
            </div>
            <div>
              <div className="text-gray-500">办学层次</div>
              <div className="mt-1 text-gray-900 font-semibold">{school.education_level}</div>
            </div>
            <div>
              <div className="text-gray-500">主管部门</div>
              <div className="mt-1 text-gray-900">{school.department}</div>
            </div>
            <div>
              <div className="text-gray-500">所在地区</div>
              <div className="mt-1 text-gray-900">
                {school.province} · {school.city}
              </div>
            </div>
            {school.notes && (
              <div className="col-span-2">
                <div className="text-gray-500">备注</div>
                <div className="mt-1 text-gray-900">{school.notes}</div>
              </div>
            )}
            <div className="col-span-2 pt-2">
              <ExternalLinkConfirm url={searchUrl} title="在高考帮搜索该学校">
                <span className="card inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 hover:shadow-md">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">搜</span>
                  <span className="font-medium">掌上高考搜索链接</span>
                </span>
              </ExternalLinkConfirm>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailModal;
