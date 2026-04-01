"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, getCurrentUser } from "@/services/userService";
import styles from "./Sidebar.module.css";

const icons = {
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>
    </svg>
  ),
  box: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  tag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  barChart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  send: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  dollarSign: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/>
      <line x1="9" y1="6" x2="9.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/>
      <line x1="15" y1="6" x2="15.01" y2="6"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="15" y1="14" x2="15.01" y2="14"/>
    </svg>
  ),
  truck: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  shoppingCart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  logOut: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const roleMenus = {
  management: [
    { label: "Take Orders", feature: "takeOrders", icon: icons.clipboard },
    { label: "Stock Management", feature: "stock", icon: icons.box },
    { label: "Create Schemes", feature: "schemes", icon: icons.tag },
    { label: "Create Users", feature: "users", icon: icons.building },
    { label: "Monitor Orders", feature: "monitor", icon: icons.barChart },
  ],
  distributor: [
    { label: "Take Orders", feature: "takeOrders", icon: icons.clipboard },
    { label: "Place Order", feature: "placeOrder", icon: icons.send },
    { label: "Loyalty Points", feature: "loyalty", icon: icons.star },
    { label: "Track Stock", feature: "stock", icon: icons.box },
    { label: "Finance", feature: "finance", icon: icons.dollarSign },
  ],
  retailer: [
    { label: "Place Order", feature: "placeOrder", icon: icons.send },
    { label: "Track Stock", feature: "stock", icon: icons.box },
    { label: "Loyalty Points", feature: "loyalty", icon: icons.star },
    { label: "Finance", feature: "finance", icon: icons.dollarSign },
  ],
};

const roleLabels = {
  management: "Management",
  distributor: "Distributor",
  retailer: "Retailer",
};

const roleColors = {
  management: "#4f46e5",
  distributor: "#f59e0b",
  retailer: "#22c55e",
};

export default function Sidebar({ activeFeature, onFeatureChange }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  let currentRole = null;
  if (pathname.includes("/management")) currentRole = "management";
  else if (pathname.includes("/distributor")) currentRole = "distributor";
  else if (pathname.includes("/retailer")) currentRole = "retailer";

  const menuItems = currentRole ? roleMenus[currentRole] : [];

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <span className={styles.logoLetters}>SS</span>
        </div>
        <div className={styles.logoGroup}>
          <span className={styles.logoText}>Sole Sync</span>
          <span className={styles.logoSubtext}>Supply Chain</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {currentRole && (
          <>
            <div className={styles.sectionLabel}>{roleLabels[currentRole]}</div>
            {menuItems.map((item) => (
              <button
                key={item.feature}
                className={`${styles.navItem} ${
                  activeFeature === item.feature ? styles.active : ""
                }`}
                onClick={() => onFeatureChange(item.feature)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

          </>
        )}

        {!currentRole && (
          <>
            <Link
              href="/dashboard/management"
              className={`${styles.navItem} ${
                pathname.includes("/management") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>{icons.building}</span>
              <span>Management</span>
            </Link>
            <Link
              href="/dashboard/distributor"
              className={`${styles.navItem} ${
                pathname.includes("/distributor") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>{icons.truck}</span>
              <span>Distributor</span>
            </Link>
            <Link
              href="/dashboard/retailer"
              className={`${styles.navItem} ${
                pathname.includes("/retailer") ? styles.active : ""
              }`}
            >
              <span className={styles.navIcon}>{icons.shoppingCart}</span>
              <span>Retailer</span>
            </Link>
          </>
        )}
      </nav>

      <div className={styles.footer}>
        {user && (
          <div className={styles.userInfo}>
            <div className={styles.userAvatar} style={{ background: roleColors[currentRole] || "#4f46e5" }}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{user.role}</div>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          {icons.logOut}
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
