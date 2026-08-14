import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
}) => {
  if (totalItems <= pageSize || totalPages <= 1) return null;

  // Generate page numbers range to display
  const pageNumbers = useMemo(() => {
    const range: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      // Always include page 1
      range.push(1);

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) {
        range.push("...left");
      }

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      if (end < totalPages - 1) {
        range.push("...right");
      }

      // Always include last page
      range.push(totalPages);
    }

    return range;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 animate-in fade-in duration-300">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest order-2 sm:order-1">
        Showing <span className="text-slate-800 font-black">{Math.min(totalItems, (page - 1) * pageSize + 1)}-{Math.min(totalItems, page * pageSize)}</span> of <span className="text-slate-800 font-black">{totalItems}</span> records
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft size={14} strokeWidth={2.5} />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((num, idx) => {
            if (typeof num === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-xs font-bold text-slate-400 select-none tracking-tight"
                >
                  •••
                </span>
              );
            }

            const isActive = num === page;
            return (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                className={`w-9 h-9 flex items-center justify-center text-xs font-black rounded-xl transition-all duration-300 active:scale-95 shadow-sm border cursor-pointer ${
                  isActive
                    ? "bg-slate-900 border-slate-900 text-white font-extrabold shadow-slate-900/10 scale-105"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
