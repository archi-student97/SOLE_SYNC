"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/userService";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.role) {
        router.replace(`/dashboard/${user.role}`);
      } else {
        router.replace("/");
      }
    });
  }, [router]);

  return null;
}
