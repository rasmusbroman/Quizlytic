"use client";

import { useState } from "react";
import ContactModal from "@/components/modals/ContactUsModal";
import AboutModal from "@/components/modals/AboutUsModal";

export default function Footer() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <>
      <footer className="bg-card py-6 border-t border-border sticky bottom-0 z-40 w-full">
        <div className="mx-auto">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-text-secondary mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Quizlytic. All rights
                reserved.
              </div>
              <div className="space-x-6">
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="text-primary hover:text-primary-hover transition"
                >
                  About Us
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="text-primary hover:text-primary-hover transition"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
    </>
  );
}
