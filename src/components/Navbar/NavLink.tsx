"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type NavLinkProps = LinkProps & {
   children: ReactNode;
   className?: string;
};

export default function NavLink({ children, className = "", href, ...props }: NavLinkProps) {
   const pathname = usePathname();

   const hrefString = typeof href === "string" ? href : (href.pathname ?? "");

   const isActive = pathname === hrefString || pathname.startsWith(`${hrefString}/`);

   return (
      <Link
         href={href}
         {...props}
         className={`
        rounded-lg px-3 py-2 transition duration-200
        ${isActive ? "bg-primary text-background" : "hover:bg-primary/50"}
        ${className}
      `}>
         {children}
      </Link>
   );
}
