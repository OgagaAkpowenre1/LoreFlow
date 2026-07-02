import React, { useState } from "react";
import {
  MessageSquare,
  GitBranch,
  Download,
  Save,
  ChevronUp,
  ChevronDown,
  Edit3,
  Layers,
  Play,
  MoveRight,
  Globe,
  FileText,
  PlayCircle,
  Eraser, // Added for Clear Graph
  FolderX, // Added for Delete Project
} from "lucide-react";
import { useLoreStore } from "../store";
import ImportButton from "./ImportButton";

export default function Navbar() {
  const [isHidden, setIsHidden] = useState(false);
  const [showLocMenu, setShowLocMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const {
    projectName,
    updateProjectName,
    addNode,
    exportProject,
    exportGameData,
    exportStringsCSV,
    groupSelectedNodes,
    deleteProject,
    clearGraph,
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

          {/* Logic & Switch Group */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => addNode("logic")}
              title="Add Logic Gate"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all hover:scale-105 shadow-md shadow-orange-200"
            >
              <GitBranch size={16} /> Logic
            </button>
            <button
              onClick={() => addNode("switch")}
              title="Add Switch Node"
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all hover:scale-105 shadow-md shadow-orange-200"
            >
              <GitBranch size={16} /> Switch
            </button>
          </div>

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

        {/* Persistence & Export (Unified File Menu) */}
        <div className="flex items-center gap-2 relative z-[300]">
          <div className="relative">
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                showFileMenu
                  ? "bg-blue-50 text-blue-600 border-blue-200 shadow-blue-100"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
              }`}
            >
              <Save
                size={16}
                className={showFileMenu ? "text-blue-500" : "text-gray-400"}
              />
              File
            </button>

            {showFileMenu && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-2 py-1.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                  Project File
                </div>

                {/* Note: If ImportButton has its own background, you may need to strip its styling in its own file to match this menu list */}
                <div className="w-full flex items-center text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                  <ImportButton />
                </div>

                <button
                  onClick={() => {
                    exportProject();
                    setShowFileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                >
                  <Save
                    size={14}
                    className="text-gray-400 group-hover:text-blue-500"
                  />
                  Save Project (.lore)
                </button>

                <div className="h-px bg-gray-100 my-1" />

                <div className="px-2 py-1.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                  Engine Compilers
                </div>

                <button
                  onClick={() => {
                    exportGameData();
                    setShowFileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors group"
                >
                  <Download
                    size={14}
                    className="text-gray-400 group-hover:text-emerald-500"
                  />
                  Export JSON Bundle
                </button>

                <button
                  onClick={() => {
                    exportStringsCSV();
                    setShowFileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors group"
                >
                  <FileText
                    size={14}
                    className="text-gray-400 group-hover:text-purple-500"
                  />
                  Export Strings (CSV)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => useLoreStore.getState().toggleSimulator()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-200 ml-1"
          >
            <PlayCircle size={18} /> Test Engine
          </button>
        </div>

        <div className="w-[1px] h-6 bg-gray-200" />

        {/* ── DESTRUCTIVE ACTIONS ── */}
        <button
          onClick={clearGraph}
          className="p-2 text-orange-400 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all"
          title="Clear Current Graph"
        >
          <Eraser size={22} />
        </button>

        <button
          onClick={deleteProject}
          className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all"
          title="Delete Entire Project"
        >
          <FolderX size={22} />
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
