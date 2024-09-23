"use client";

import { nestedTest } from "@oliver/api";
import { useAuthStore } from "~/providers/authStoreProvider";

export default function Home() {
  const login = useAuthStore((store) => store.login);
  const logout = useAuthStore((store) => store.logout);
  const user = useAuthStore((store) => store.session);

  nestedTest();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {user ? (
        <p>{JSON.stringify(user, null, 4)}</p>
      ) : (
        <h1 className="text-2xl font-bold">Please login</h1>
      )}
      <button
        className="px-4 py-2 text-white bg-blue-500 rounded-md"
        type="button"
        onClick={login}
      >
        Login
      </button>
      <button
        className="px-4 py-2 text-white bg-red-500 rounded-md"
        type="button"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
}
