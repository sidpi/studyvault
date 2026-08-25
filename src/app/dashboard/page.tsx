"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase";

export default function Dashboard() {
  useEffect(() => {
    const { supabase } = useSupabase();
    
    // Check auth state
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        const router = useRouter();
        router.push("/login");
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-sidebar flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">StudyVault</h2>
          </div>
          <nav className="flex-1 p-2">
            <ul className="space-y-2">
              <li>
                <a href="#" className="flex items-center px-3 py-2 rounded hover:bg-primary/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 6v6a1 1 0 01-1 1h-3m6-6v6a1 1 0 01-1 1h-3m2-6v6a1 1 0 01-1 1h-3m6 2a0 0 0 0 1 1h3a1 1 0 011 1v5m-5 1h5c3-1 5-3 5-5v-2c0-2-1.5-3.5-3.5-3.5H6c-2 0-3.5 1.5-3.5 3.5v2c0 2 1.5 3.5 3.5 3.5z"/>
                  </svg>
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 rounded hover:bg-primary/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14m2-6h2m2 4H7m6 4h2m-2-6l-2.286-1.286a1 1 0 01.442-.894l2.828 2.828a1 1 0 01.136 1.993l-2.636 2.635a1 1 0 01-.894-.442L21 12l1.286-2.286a1 1 0 011.993 0l1.286 2.286c.536.881.16.193-.442.894l-2.636 2.635a1 1 0 01-.894-.136L21 12l1.286-2.286a1 1 0 011.993 0l1.286 2.286c.536.881.16.193-.442.894l-2.636 2.635a1 1 0 01-.894-.136L13 21l-2.286 1.286a1 1 0 01-1.993.136l-2.828-2.828a1 1 0 01-.894-.442L5 12l2.286-1.286a1 1 0 01.894.442l2.636-2.635a1 1 0 01.136 1.993l2.828 2.828c.536.881-.16.193.442.894l2.636-2.635a1 1 0 01.894.136L3 12l-1.286 2.286z"/>
                  </svg>
                  Subjects
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center px-3 py-2 rounded hover:bg-primary/5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14m2-6h2m2 4H7m6 4h2m-2-6l-2.286-1.286a1 1 0 01.442-.894l2.828 2.828a1 1 0 01.136 1.993l-2.636 2.635a1 1 0 01-.894-.442L21 12l1.286-2.286a1 1 0 011.993 0l1.286 2.286c.536.881.16.193-.442.894l-2.636 2.635a1 1 0 01-.894-.136L21 12l1.286-2.286a1 1 0 011.993 0l1.286 2.286c.536.881.16.193-.442.894l-2.636 2.635a1 1 0 01-.894-.136L13 21l-2.286 1.286a1 1 0 01-1.993.136l-2.828-2.828a1 1 0 01-.894-.442L5 12l2.286-1.286a1 1 0 01.894.442l2.636-2.635a1 1 0 01.136 1.993l2.828 2.828c.536.881-.16.193.442.894l2.636-2.635a1 1 0 01.894.136L3 12l-1.286 2.286z"/>
                  </svg>
                  Materials
                </a>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t">
            <a href="/admin" className="text-sm text-primary hover:underline">Admin</a>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Welcome back!
                </span>
              </div>
            </header>

            {/* Content area */}
            <main>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Recently Materials Card */}
                <div className="bg-card p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-2">Recently Added</h3>
                  <p className="text-muted-foreground">No materials yet</p>
                </div>

                {/* Popular Subjects Card */}
                <div className="bg-card p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-2">Popular Subjects</h3>
                  <p className="text-muted-foreground">No subjects yet</p>
                </div>

                {/* Bookmarks Card */}
                <div className="bg-card p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-2">Bookmarks</h3>
                  <p className="text-muted-foreground">No bookmarks yet</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}