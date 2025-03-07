"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-card shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Quizlytic
          </Link>
          <nav className="hidden md:flex space-x-1">
            <Link
              href="/"
              className={`px-3 py-1 rounded-t-md ${
                isActive("/")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className={`px-3 py-1 rounded-t-md ${
                isActive("/create")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Create Quiz
            </Link>
            <Link
              href="/results"
              className={`px-3 py-1 rounded-t-md ${
                isActive("/results")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Results
            </Link>
            <Link
              href="/join"
              className={`px-3 py-1 rounded-t-md ${
                isActive("/join")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Join
            </Link>
          </nav>

          <button
            className="md:hidden text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="pt-4 pb-2 space-y-2 md:hidden">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md ${
                isActive("/")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className={`block px-3 py-2 rounded-md ${
                isActive("/create")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Quiz
            </Link>
            <Link
              href="/results"
              className={`block px-3 py-2 rounded-md ${
                isActive("/results")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Results
            </Link>
            <Link
              href="/join"
              className={`block px-3 py-2 rounded-md ${
                isActive("/join")
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-accent"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Join
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
