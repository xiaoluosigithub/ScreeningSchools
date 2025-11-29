import React, { useMemo, useState } from "react";

interface Props {
  url: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
  storageKey?: string;
  rememberByHost?: boolean;
}

const ExternalLinkConfirm: React.FC<Props> = ({ url, className, title, children, storageKey, rememberByHost = true }) => {
  const key = useMemo(() => {
    try {
      if (storageKey) return storageKey;
      if (rememberByHost) {
        const host = new URL(url).host;
        return `ext_skip:${host}`;
      }
    } catch {}
    return `ext_skip:global`;
  }, [url, storageKey, rememberByHost]);

  const [open, setOpen] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(false);

  function proceed() {
    try {
      if (remember) localStorage.setItem(key, "1");
    } catch {}
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function onTrigger(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const skip = localStorage.getItem(key);
      if (skip === "1") {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
    } catch {}
    setOpen(true);
  }

  return (
    <>
      <button type="button" className={className} title={title} onClick={onTrigger} aria-label={title || "external-link"}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 text-gray-900 font-semibold text-base">跳转提示</div>
              <div className="px-4 py-3 text-sm text-gray-700">
                您将打开第三方网站，其内容与操作不由本应用提供或承担。请谨慎识别并自行决定是否继续访问。
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" className="rounded" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  本次站点不再提示
                </label>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200" onClick={() => setOpen(false)}>取消</button>
                  <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700" onClick={proceed}>继续访问</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExternalLinkConfirm;
