import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import WorkspaceEmpty from "./components/WorkspaceEmpty";
import WorkspaceGrid from "./components/WorkspaceGrid";

const Dashboard = () => {
  // Toggle this state or tie it to your workspace mock data count
  const [hasForms, setHasForms] = useState(true); 

  return (
    <div className="flex gap-6">
      <Sidebar />
      
      <main className="flex-1 rounded-2xl bg-surface p-8 shadow-sm">
        <DashboardHeader />
        
        {hasForms ? <WorkspaceGrid /> : <WorkspaceEmpty />}
      </main>
    </div>
  );
};

export default Dashboard;