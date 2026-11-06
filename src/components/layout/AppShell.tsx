import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import UpdatePrompt from "./UpdatePrompt";

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <UpdatePrompt />
    </div>
  );
}
