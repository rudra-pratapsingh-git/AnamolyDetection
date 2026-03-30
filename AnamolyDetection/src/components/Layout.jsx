import React from "react";
import { Outlet } from "react-router-dom";
import PageTransition from "./PageTransition";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout() {
  return (
    <div className="min-h-screen text-gray-100 font-sans bg-[#070A12] relative overflow-hidden">
      <div className="app-bg-grid" />
      <div className="app-bg-scanlines" />

      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <TopBar />
          <main className="px-4 sm:px-6 lg:px-8 py-5 lg:py-7">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
