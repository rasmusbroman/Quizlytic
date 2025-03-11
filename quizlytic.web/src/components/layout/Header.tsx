"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { IoMenu, IoClose, IoLogIn } from "react-icons/io5";
import { useAuth } from "@/hooks/useAuth";
import ProfileButton from "@/components/auth/ProfileButton";
import LoginModal from "@/components/modals/LoginModal";
import RegisterModal from "@/components/modals/RegisterModal";

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    console.log("Auth state in Header:", {
      user,
      isAuthenticated,
      isAdmin: isAdmin,
    });
  }, [user, isAuthenticated, isAdmin]);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleShowRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleShowLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <header className="bg-card shadow border-b border-border sticky top-0 z-50">
        <div className="mx-auto">
          <div className="container mx-auto px-4 py-4 max-w-4xl">
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
                {isAuthenticated && isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-3 py-1 rounded-t-md ${
                      isActive("/admin")
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </nav>

              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <ProfileButton />
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center text-primary hover:text-primary-hover"
                  >
                    <IoLogIn className="w-5 h-5 mr-1" />
                    <span className="hidden md:inline">Login</span>
                  </button>
                )}

                <button
                  className="md:hidden text-primary"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {mobileMenuOpen ? (
                    <IoClose className="h-6 w-6" />
                  ) : (
                    <IoMenu className="h-6 w-6" />
                  )}
                </button>
              </div>
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
                {isAuthenticated && isAdmin && (
                  <Link
                    href="/admin"
                    className={`block px-3 py-2 rounded-md ${
                      isActive("/admin")
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-accent"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLoginClick();
                    }}
                    className="flex items-center w-full text-left px-3 py-2 rounded-md text-foreground hover:bg-accent"
                  >
                    <IoLogIn className="w-5 h-5 mr-2" />
                    Login
                  </button>
                )}
              </nav>
            )}
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onShowRegister={handleShowRegister}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onShowLogin={handleShowLogin}
      />
    </>
  );
}
