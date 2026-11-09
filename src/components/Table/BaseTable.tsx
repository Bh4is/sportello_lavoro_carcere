import type React from "react";

export type Column<T> = {
   header: string;
   render: (row: T) => React.ReactNode;
   className?: string;
   sticky?: boolean;
   group?: string;
};

type BaseTableProps<T> = {
   columns: Column<T>[];
   rows: T[];
   getRowKey: (row: T) => React.Key;
   compact?: boolean;
   fullWidth?: boolean;
   fillHeight?: boolean;
   emptyMessage?: string;
};

export default function BaseTable<T>({
   columns,
   rows,
   getRowKey,
   compact = false,
   fullWidth = true,
   fillHeight = true,
   emptyMessage = "Nessun dato disponibile",
}: BaseTableProps<T>) {
   const hasGroups = columns.some((column) => column.group);

   const headerGroups: {
      label: string;
      columns: Column<T>[];
   }[] = [];

   if (hasGroups) {
      columns.forEach((column) => {
         const lastGroup = headerGroups[headerGroups.length - 1];

         if (column.group && lastGroup && lastGroup.label === column.group) {
            lastGroup.columns.push(column);
         } else {
            headerGroups.push({
               label: column.group ?? "",
               columns: [column],
            });
         }
      });
   }

   const cellPadding = compact ? "px-3 py-2" : "px-4 py-3";

   return (
      <div
         className={`
        overflow-hidden rounded-xl
        border border-border
        bg-lightbg shadow-sm
        ${fullWidth ? `mx-auto mt-4 w-19/20 ${fillHeight ? "h-[calc(100%-1rem)]" : ""}` : "w-full"}
      `}>
         <div className={fillHeight ? "h-full overflow-auto" : "overflow-x-auto"}>
            <table className="w-full min-w-max border-separate border-spacing-0">
               <thead className="sticky top-0 z-30">
                  {hasGroups ? (
                     <>
                        <tr>
                           {headerGroups.map((group, index) => {
                              const firstColumn = group.columns[0];

                              if (!group.label) {
                                 return (
                                    <th
                                       key={index}
                                       scope="col"
                                       rowSpan={2}
                                       className={`
                            min-w-24 whitespace-nowrap
                            border-b border-r border-border-strong
                            bg-surface-raised
                            text-sm font-semibold
                            tracking-wide text-primary
                            ${cellPadding}
                            ${firstColumn.sticky ? "sticky left-0 z-40" : ""}
                            ${firstColumn.className ?? ""}
                          `}>
                                       {firstColumn.header}
                                    </th>
                                 );
                              }

                              return (
                                 <th
                                    key={index}
                                    scope="colgroup"
                                    colSpan={group.columns.length}
                                    className={`
                          border-b border-r border-border-strong
                          bg-surface-raised
                          px-4 py-3 text-center
                          text-sm font-semibold
                          tracking-wide text-primary
                        `}>
                                    {group.label}
                                 </th>
                              );
                           })}
                        </tr>

                        <tr>
                           {columns
                              .filter((column) => column.group)
                              .map((column, index) => (
                                 <th
                                    key={index}
                                    scope="col"
                                    className={`
                          min-w-28 whitespace-nowrap
                          border-b border-r border-border-strong
                          bg-slate-700/95
                          text-center text-sm font-semibold
                          text-text-on-surface
                          ${cellPadding}
                          ${column.className ?? ""}
                        `}>
                                    {column.header}
                                 </th>
                              ))}
                        </tr>
                     </>
                  ) : (
                     <tr>
                        {columns.map((column, index) => (
                           <th
                              key={index}
                              scope="col"
                              className={`
                      min-w-24 whitespace-nowrap
                      border-b border-border-strong
                      bg-surface-raised
                      text-sm font-semibold
                      tracking-wide text-primary
                      ${cellPadding}
                      ${column.sticky ? "sticky left-0 z-40" : ""}
                      ${column.className ?? ""}
                    `}>
                              {column.header}
                           </th>
                        ))}
                     </tr>
                  )}
               </thead>

               <tbody>
                  {rows.length === 0 ? (
                     <tr>
                        <td
                           colSpan={columns.length}
                           className="
                    px-4 py-10 text-center
                    text-sm text-muted
                  ">
                           {emptyMessage}
                        </td>
                     </tr>
                  ) : (
                     rows.map((row) => (
                        <tr
                           key={getRowKey(row)}
                           className="
                    group border-b border-border
                    bg-lightbg text-center
                    transition-colors
                    hover:bg-slate-700/50
                  ">
                           {columns.map((column, index) => (
                              <td
                                 key={index}
                                 className={`
                        min-w-24 whitespace-nowrap
                        border-b border-border
                        text-sm text-text-on-surface
                        ${cellPadding}
                        ${column.sticky ? "sticky left-0 z-20 bg-lightbg group-hover:bg-surface-raised" : ""}
                        ${column.className ?? ""}
                      `}>
                                 {column.render(row)}
                              </td>
                           ))}
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}
