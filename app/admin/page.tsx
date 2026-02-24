import { cookies } from "next/headers";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  // Cookies
  const cookieStore = await cookies();

  return <AdminDashboard />;
}
