import React from "react";

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
  if (totalItems <= pageSize) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
        Page {page} of {totalPages} <span className="opacity-50 mx-1">•</span> {totalItems} items
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-4 py-2 text-[11px] font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-4 py-2 text-[11px] font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
