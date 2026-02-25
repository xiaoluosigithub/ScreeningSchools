import React from "react";

interface PaginationBarProps {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeInput: string;
  onChangePageSize: (value: number) => void;
  onChangePageSizeInput: (value: string) => void;
  onCommitPageSize: () => void;
  onGotoPage: (page: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  total,
  page,
  totalPages,
  pageSize,
  pageSizeInput,
  onChangePageSize,
  onChangePageSizeInput,
  onCommitPageSize,
  onGotoPage
}) => {
  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="text-xs text-gray-500">
        共 {total} 条 · 第 {page} / {totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => {
            onChangePageSize(Number(e.target.value));
            onGotoPage(1);
          }}
          className="px-2 py-1 rounded border border-gray-200 bg-white text-xs"
        >
          <option value={6}>每页 6</option>
          <option value={10}>每页 10</option>
          <option value={20}>每页 20</option>
          <option value={50}>每页 50</option>
        </select>
        <span className="text-xs text-gray-500">自定义</span>
        <input
          type="number"
          min={5}
          max={200}
          step={5}
          value={pageSizeInput}
          onChange={(e) => onChangePageSizeInput(e.target.value)}
          onBlur={onCommitPageSize}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitPageSize();
          }}
          className="w-16 px-2 py-1 rounded border border-gray-200 bg-white text-xs"
        />
        <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50" onClick={() => onGotoPage(1)} disabled={page === 1}>
          首页
        </button>
        <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50" onClick={() => onGotoPage(page - 1)} disabled={page === 1}>
          上一页
        </button>
        <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50" onClick={() => onGotoPage(page + 1)} disabled={page === totalPages}>
          下一页
        </button>
        <button className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50" onClick={() => onGotoPage(totalPages)} disabled={page === totalPages}>
          末页
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;

