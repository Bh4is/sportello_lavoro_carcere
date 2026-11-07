import { ReactNode } from "react";

type PageTitleProps = {
   children: ReactNode;
   className?: string;
};

export default function PageTitle({ children, className = "" }: PageTitleProps) {
   return <h1 className={`text-3xl font-semibold text-primary flex justify-center mt-3 ${className}`}>{children}</h1>;
}
