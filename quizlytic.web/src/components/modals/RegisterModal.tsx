"use client";

import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useAuth } from "@/hooks/useAuth";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onShowLogin,
}) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { register, error, clearError } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setName("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      clearError();
      setValidationError(null);
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError("Passwords don't match");
      return;
    }

    if (password.length < 4) {
      setValidationError("Password must be at least 4 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(name, username, password);
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">Create Account</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>

        {(error || validationError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error || validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-foreground mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="register-username"
              className="block text-foreground mb-1"
            >
              Username
            </label>
            <input
              id="register-username"
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-foreground mb-1"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="w-full border border-border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-foreground mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="w-full border border-border rounded-md px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-text-secondary">
            Already have an account?{" "}
            <button
              onClick={() => {
                clearError();
                onShowLogin();
              }}
              className="text-primary hover:text-primary-hover"
            >
              Log in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
