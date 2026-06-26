"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearUser, getUser } from "@/lib/auth";

/**
 * Shared app top bar: brand mark, primary navigation, the signed-in email and a
 * sign-out action. Redirects to the sign-in screen if no user is present.
 *
 * `active` highlights the current section; `actions` slots page-specific
 * controls (e.g. Save, Download) on the right.
 */
export default function TopBar({
  active,
  actions,
}: {
  active?: "creator" | "documents";
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/");
      return;
    }
    setEmail(user.email);
  }, [router]);

  function signOut() {
    clearUser();
    router.replace("/");
  }

  const navLink = (href: string, label: string, key: "creator" | "documents") => (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active === key
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.push("/creator")}
            className="flex items-center gap-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-sm font-bold text-brand-heading">
              P
            </span>
            <span className="text-lg font-semibold text-brand-heading">Prelegal</span>
          </button>
          <nav className="hidden items-center gap-1 sm:flex">
            {navLink("/creator", "New Document", "creator")}
            {navLink("/documents", "My Documents", "documents")}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {actions}
          <div className="hidden items-center gap-3 sm:flex">
            {email && <span className="text-sm text-gray-500">{email}</span>}
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
