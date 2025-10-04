"use client";

import React from "react";

interface AuthPageProps {
  type: "signin" | "signup";
  onClose: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4">
          {type === "signin" ? "Sign In" : "Sign Up"}
        </h2>

        <form className="flex flex-col gap-4">
          {type === "signup" && (
            <input
              type="text"
              placeholder="Name"
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            className={`${
              type === "signin"
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white py-2 rounded`}
          >
            {type === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
