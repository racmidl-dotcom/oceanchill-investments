import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface Props {
  children: ReactNode;
  hideBottomNav?: boolean;
  className?: string;
}

export const PageWrapper = ({ children, hideBottomNav, className = "" }: Props) => (
  <div className="app-shell pb-20">
    <main className={className}>{children}</main>
    {!hideBottomNav && <BottomNav />}
  </div>
);
