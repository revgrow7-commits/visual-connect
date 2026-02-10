import { memo, useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import SidebarNav from "./SidebarNav";
import MobileNav from "./MobileNav";

const AppLayout = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-16 lg:pl-60 pb-16 lg:pb-4 contain-layout">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
});

AppLayout.displayName = "AppLayout";

export default AppLayout;
