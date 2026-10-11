import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import useFolders from "../../hooks/useFolders";

// Layout: sidebar stays, the selected folder page renders in <Outlet />
const Dashboard = () => {
  const { folders, stats, refresh } = useFolders();

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
      <Sidebar folders={folders} stats={stats} />
      <main className="min-w-0 flex-1 rounded-2xl bg-surface p-4 shadow-sm sm:p-6 lg:p-8">
        <Outlet context={{ folders, refreshFolders: refresh }} />
      </main>
    </div>
  );
};

export default Dashboard;
