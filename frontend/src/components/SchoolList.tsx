import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAllSchools, getSchoolsByProvince, getSchoolsByCity, searchSchools } from "../api/schools";
import type { School, MetricLevel } from "../types";
import SchoolDetailModal from "./SchoolDetailModal";

// 学校列表组件属性接口
interface SchoolListProps {
  level: "country" | "province" | "city"; // 层级：国家、省份、城市
  province?: string | null; // 省份名称（如果层级为省份或城市）
  city?: string | null; // 城市名称（如果层级为城市） 
  metric?: MetricLevel;
}

// 学校卡片组件属性接口
const SchoolCard: React.FC<{ school: School; index: number; onClick?: () => void }> = ({ school, index, onClick }) => { 
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
          <div className="mt-1 text-base text-gray-500">{school.province} · {school.city}</div>
        </div>
        <div className="col-span-3 text-right">
          <span className="text-sm text-gray-400">代码 {school.school_code}</span>
          <div className="mt-1 text-sm text-gray-500 h-6 whitespace-nowrap overflow-hidden text-ellipsis" title={school.notes || undefined}>
            {school.notes ?? ""}
          </div>
        </div>
      </div>
    </div>
  );
};

// 学校列表组件
const SchoolList: React.FC<SchoolListProps> = ({ level, province, city, metric = "total" }) => {
  const [schools, setSchools] = useState<School[]>([]); // 学校数据状态
  const [loading, setLoading] = useState<boolean>(false); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误状态
  const [keyword, setKeyword] = useState<string>(""); // 搜索关键词状态 
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageSizeInput, setPageSizeInput] = useState<string>("10");
  const listRef = useRef<HTMLDivElement | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const listKey = useMemo(() => `${level}|${province ?? ''}|${city ?? ''}|${metric}|${keyword.trim()}`, [level, province, city, metric, keyword]);
  // 标题根据层级和区域动态生成
  const title = useMemo(() => {
    const scope = level === "country" ? "中国" : (level === "province" ? (province ?? "") : (city ?? ""));
    if (metric === "bachelor") return `${scope} 的本科学校`;
    if (level === "country") return "全部学校";
    return `${scope} 的学校`;
  }, [level, province, city, metric]);
  // 加载学校数据
  async function loadData() {
    try {
      setLoading(true); // 设置加载状态为 true
      setError(null); // 清空错误状态
      let data: School[] = []; // 学校数据数组
      if (keyword.trim().length > 0) { // 如果搜索关键词非空
        data = await searchSchools(keyword.trim()); // 调用搜索学校接口
      } else if (level === "country") {
        data = await getAllSchools(); // 调用获取全部学校接口
      } else if (level === "province" && province) {
        data = await getSchoolsByProvince(province); // 调用根据省份获取学校接口
      } else if (level === "city" && city) {
        data = await getSchoolsByCity(city); // 调用根据城市获取学校接口
      }
      const filtered = metric === "bachelor" ? data.filter(s => String(s.education_level || "").includes("本科")) : data;
      setSchools(filtered);
    } catch (e) {
      setError("学校数据加载失败");
    } finally {
      setLoading(false);
    }
  }
  //
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
    try {
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      const pUrl = Number(sp.get("page"));
      const sUrl = Number(sp.get("pageSize"));
      const lsRaw = localStorage.getItem(`list_state:${listKey}`);
      const ls = lsRaw ? JSON.parse(lsRaw) : null;
      const p = Number.isFinite(pUrl) && pUrl > 0 ? pUrl : (ls?.page ?? 1);
      const s = Number.isFinite(sUrl) && sUrl > 0 ? sUrl : (ls?.pageSize ?? pageSize);
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
    const tp = Math.max(1, Math.ceil(total / pageSize));
    if (page > tp) setPage(tp);
  }, [schools, pageSize]);

  const total = schools.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedSchools = schools.slice(start, end);

  function gotoPage(p: number) {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  function commitPageSize(raw: string) {
    const v = Number(raw);
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
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">数据来源：MySQL / 后端接口</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索学校/省/市..." className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {loading && <div className="text-gray-600 text-sm">正在加载...</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!loading && !error && total === 0 && <div className="text-gray-500 text-sm">暂无数据</div>}
        {pagedSchools.map((s, idx) => (
          <SchoolCard key={`${s.school_code}-${start + idx}`} school={s} index={start + idx + 1} onClick={() => setSelectedSchool(s)} />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">共 {total} 条 · 第 {page} / {totalPages} 页</div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageSizeInput(e.target.value);
              gotoPage(1);
            }}
            className="px-2 py-1 rounded border border-gray-200 bg-white text-xs"
          >
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
            onChange={(e) => {
              setPageSizeInput(e.target.value);
            }}
            onBlur={() => commitPageSize(pageSizeInput)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitPageSize(pageSizeInput);
            }}
            className="w-16 px-2 py-1 rounded border border-gray-200 bg-white text-xs"
          />
          <button
            className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50"
            onClick={() => gotoPage(1)}
            disabled={page === 1}
          >首页</button>
          <button
            className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50"
            onClick={() => gotoPage(page - 1)}
            disabled={page === 1}
          >上一页</button>
          <button
            className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50"
            onClick={() => gotoPage(page + 1)}
            disabled={page === totalPages}
          >下一页</button>
          <button
            className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 disabled:opacity-50"
            onClick={() => gotoPage(totalPages)}
            disabled={page === totalPages}
          >末页</button>
        </div>
      </div>
      <SchoolDetailModal school={selectedSchool} onClose={() => setSelectedSchool(null)} />
    </div>
  );
};

export default SchoolList;
