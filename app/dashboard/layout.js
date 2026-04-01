"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/services/userService";
import { initStorage } from "@/api/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initStorage();
    isLoggedIn().then((loggedIn) => {
      if (!loggedIn) {
        router.push("/");
      } else {
        setAuthenticated(true);
      }
    });
  }, [router]);

  if (!authenticated) return null;

  return <div className="dashboardLayout">{children}</div>;
}
