import "./globals.css";

export const metadata = {
  title: "Sole Sync - Supply Chain Management",
  description: "Supply chain management system for shoe distribution",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
