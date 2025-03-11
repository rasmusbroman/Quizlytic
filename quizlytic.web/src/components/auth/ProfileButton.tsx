"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IoPersonCircle,
  IoChevronDown,
  IoLogOut,
  IoShield,
} from "react-icons/io5";
import { useAuth } from "@/hooks/useAuth";

const ProfileButton: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("In ProfileButton - isAdmin:", isAdmin);
  }, [isAdmin, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAdminDashboard = () => {
    setIsOpen(false);
    router.push("/admin");
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 hover:bg-accent rounded-full p-1 transition"
        aria-label="User menu"
      >
        <IoPersonCircle className="w-8 h-8 text-primary" />
        <span className="text-foreground hidden md:block">
          {user?.name || "User"}
        </span>
        <IoChevronDown
          className={`w-4 h-4 text-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg z-10 border border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="font-medium text-foreground">{user?.name}</div>
            <div className="text-sm text-text-secondary">@{user?.username}</div>
            {isAdmin && (
              <div className="mt-1 text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full inline-block">
                Admin
              </div>
            )}
          </div>

          <div className="py-1">
            {isAdmin && (
              <button
                onClick={handleAdminDashboard}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center"
              >
                <IoShield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center"
            >
              <IoLogOut className="mr-2 h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;
