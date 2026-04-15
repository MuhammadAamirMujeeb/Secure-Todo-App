import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      {children}
    </main>
  );
}
