import { useState } from "react";
import { Settings } from "lucide-react"; // Added this import
import MainFlow from "./components/MainFlow";
import SettingsEditor from "./components/SettingsEditor";
import GraphNavigator from "./components/GraphNavigator";
import Simulator from "./components/Simulator";
import { ReactFlowProvider } from "reactflow";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen bg-gray-100">
      {/* Settings Button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute top-4 right-4 z-[100] bg-white p-3 rounded-full shadow-2xl border border-gray-200 hover:bg-gray-50 transition-all hover:scale-110 active:scale-95"
        title="Engine Settings"
      >
        <Settings size={20} className="text-gray-600" />
      </button>

      {/* Main Workspace */}
      <main className="h-full w-full">
        <ReactFlowProvider>
          <MainFlow />
        </ReactFlowProvider>
      </main>

      {/* Overlays */}
      <SettingsEditor
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Simulator />

      <GraphNavigator />
    </div>
  );
}
