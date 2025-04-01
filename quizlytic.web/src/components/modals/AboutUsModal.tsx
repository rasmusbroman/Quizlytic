import React from "react";
import { IoClose } from "react-icons/io5";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">About Quizlytic</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-text-secondary">
            Quizlytic is a modern, (real-time in development) quiz and survey
            platform designed to help educators, trainers, and event organizers
            create engaging interactive experiences.
          </p>

          <div className="bg-accent p-4 rounded-md">
            <h3 className="font-medium text-foreground mb-2">Our Mission</h3>
            <p className="text-text-secondary">
              To create an accessible, easy-to-use platform that makes learning
              and audience engagement more interactive and enjoyable.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Key Features</h3>
            <ul className="list-disc pl-5 space-y-1 text-text-secondary">
              <li>Real-time quiz participation</li>
              <li>Multiple question types</li>
              <li>Instant response visualization</li>
              <li>(Comprehensive results analysis - in development)</li>
              <li>Easy sharing via PIN codes and QR codes</li>
            </ul>
          </div>

          <div className="pt-2">
            <p className="text-text-secondary text-sm">
              Version 1.0.0 | &copy; {new Date().getFullYear()} Quizlytic Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
