import React, { useState } from "react";
import { IoClose } from "react-icons/io5";

interface ContactModalProps {
  onClose: () => void;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", { name, email, message });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">Contact Us</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <IoClose className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-foreground mb-1">
              Your Name
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
            <label htmlFor="email" className="block text-foreground mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-foreground mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              className="w-full border border-border rounded-md px-3 py-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
