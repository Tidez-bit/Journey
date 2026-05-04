import React from 'react';

export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`rounded-2xl overflow-hidden border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 ${className}`} {...props}>
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left whitespace-nowrap">
        {children}
      </table>
    </div>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', children, ...props }) => (
  <thead className={`bg-slate-900/50 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider ${className}`} {...props}>
    {children}
  </thead>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', children, ...props }) => (
  <tr className={`border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-150 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
  <td className={`px-4 py-3 text-sm text-slate-300 ${className}`} {...props}>
    {children}
  </td>
);

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', children, ...props }) => (
  <th className={`px-4 py-3 font-medium ${className}`} {...props}>
    {children}
  </th>
);
