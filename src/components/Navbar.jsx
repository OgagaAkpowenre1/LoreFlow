import React, { useState } from "react";
import {
  MessageSquare,
  GitBranch,
  Download,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit3,
  Layers,
  Play,
  MoveRight, // Added for Jump Node
} from "lucide-react";
import { useLoreStore } from "../store";
import ImportButton from "./ImportButton";

export default function Navbar() {
  const [isHidden, setIsHidden] = useState(false);
  const {
    projectName,
    updateProjectName,
    addNode,
    exportProject,
    exportGameData,
    resetProject,
    groupSelectedNodes,
  } = useLoreStore();

  return (
    <div
      className={`fixed top-0 left-1/2 -translate-x-1/2 z-[200] transition-transform duration-500 ease-in-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mt-6 flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-2xl">
        {/* Project Name */}
        <div className="flex items-center gap-2 border-r pr-4 mr-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Edit3 size={14} />
          </div>
          <input
            value={projectName}
            onChange={(e) => updateProjectName(e.target.value)}
            className="bg-transparent text-xs font-bold uppercase tracking-widest outline-none border-b border-transparent focus:border-blue-400 w-32 truncate"
            placeholder="PROJECT NAME"
          />
        </div>

        {/* Node Spawning */}
        <div className="flex gap-2">
          <button
            onClick={() => addNode("start")}
            title="Set Project Start"
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-110 transition-all shadow-lg shadow-emerald-200"
          >
            <Play size={20} fill="currentColor" />
          </button>

          <button
            onClick={() => addNode("scene")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-md shadow-blue-200"
          >
            <MessageSquare size={18} /> New Scene
          </button>

          <button
            onClick={() => addNode("logic")}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all hover:scale-105 shadow-md shadow-orange-200"
          >
            <GitBranch size={18} /> New Logic
          </button>

          {/* ── NEW JUMP NODE BUTTON ── */}
          <button
            onClick={() => addNode("jump")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all hover:scale-105 shadow-md shadow-slate-300"
          >
            <MoveRight size={18} className="text-blue-400" /> Jump
          </button>

          <button
            onClick={() => groupSelectedNodes()}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
          >
            <Layers size={16} /> Group Selected
          </button>
        </div>

        <div className="w-[1px] h-6 bg-gray-200" />

        {/* Persistence & Export */}
        <div className="flex items-center gap-2">
          <ImportButton />
          <button
            onClick={exportProject}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Save Project (.lore)"
          >
            <Save size={22} />
          </button>
          <button
            onClick={exportGameData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
          >
            <Download size={20} className="text-blue-400" /> Export JSON
          </button>
        </div>

        <div className="w-[1px] h-6 bg-gray-200" />

        <button
          onClick={resetProject}
          className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
        >
          <Trash2 size={22} />
        </button>
      </div>

      {/* RECALL TAB */}
      <button
        onClick={() => setIsHidden(!isHidden)}
        className="absolute left-1/2 -translate-x-1/2 top-full bg-white/90 backdrop-blur-md px-6 py-1.5 rounded-b-xl border border-t-0 border-white shadow-xl text-gray-400 hover:text-blue-600 transition-all flex flex-col items-center group"
      >
        {isHidden ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
    </div>
  );
}
