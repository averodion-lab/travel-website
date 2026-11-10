import type { Metadata } from "next";
import AdminApp from "./AdminApp";

export const metadata: Metadata = { title: "Owner dashboard", robots: { index: false, follow: false } };

// Full-screen app: no site header; the dashboard covers the site footer.
export default function AdminPage() {
  return <AdminApp />;
}
