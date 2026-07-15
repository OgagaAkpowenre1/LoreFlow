import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Search,
  Plus,
  Share2,
  Trash2,
  Edit2,
  X,
  Copy,
  Play,
  Flag,
  Folder,
  GripVertical, // Added for the drag handle visual interface
} from "lucide-react";
import { useLoreStore } from "../store";

function GraphNavigator() {
  const graphs = useLoreStore((s) => s.graphs);
  const activeGraph = useLoreStore((s) => s.activeGraph);
  const setActiveGraph = useLoreStore((s) => s.setActiveGraph);
  const addGraph = useLoreStore((s) => s.addGraph);
  const deleteGraph = useLoreStore((s) => s.deleteGraph);
  const renameGraph = useLoreStore((s) => s.renameGraph);
  const duplicateGraph = useLoreStore((s) => s.duplicateGraph);
  const startGraph = useLoreStore((s) => s.startGraph);
  const setStartGraph = useLoreStore((s) => s.setStartGraph);
  const sidebarOpen = useLoreStore((s) => s.sidebarOpen);
  const toggleSidebar = useLoreStore((s) => s.toggleSidebar);
  const graphFolders = useLoreStore((s) => s.graphFolders);
  const addFolder = useLoreStore((s) => s.addFolder);
  const renameFolder = useLoreStore((s) => s.renameFolder);
  const deleteFolder = useLoreStore((s) => s.deleteFolder);
  const moveGraphToFolder = useLoreStore((s) => s.moveGraphToFolder);

  const [search, setSearch] = useState("");
  const [renamingName, setRenamingName] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [folderEditValue, setFolderEditValue] = useState("");
  const inputRef = useRef(null);

  // ─── LEFT SIDEBAR RESIZING ENGINE ───
  const [width, setWidth] = useState(256); // Default matching w-64
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        // Left sidebar calculation tracks straight mouse position from left margin
        const newWidth = e.clientX;
        // Clamp layout limits between 200px and 550px to protect workspace nodes
        if (newWidth >= 200 && newWidth <= 550) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  // Global cursor coordination listener hook
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isResizing, resize, stopResizing]);

  const filteredGraphNames = Object.keys(graphs).filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRename = () => {
    if (editValue.trim() && editValue !== renamingName) {
      renameGraph(renamingName, editValue.trim());
    }
    setRenamingName(null);
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  const handleRenameFolder = () => {
    if (folderEditValue.trim() && folderEditValue !== renamingFolder) {
      renameFolder(renamingFolder, folderEditValue.trim());
    }
    setRenamingFolder(null);
  };

  useEffect(() => {
    if (renamingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingName]);

  const renderGraphItem = (graphName) => {
    if (!filteredGraphNames.includes(graphName)) return null;

    const isActive = activeGraph === graphName;
    const isRenaming = renamingName === graphName;
    const isStart = startGraph === graphName;
    const nodeCount = graphs[graphName]?.nodes?.length || 0;

    return (
      <div
        key={graphName}
        onClick={() => !isRenaming && setActiveGraph(graphName)}
        className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
          isActive
            ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-50"
            : "border-transparent hover:bg-white hover:border-gray-200 text-gray-500"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-grow min-w-0 pr-1">
          <Share2
            size={13}
            className={`shrink-0 ${isActive ? "text-blue-500" : "text-gray-300"}`}
          />

          {isRenaming ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="bg-blue-50 text-[11px] font-bold text-blue-700 outline-none w-full rounded px-1"
            />
          ) : (
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center min-w-0 pr-1 flex-grow">
                <span
                  className={`text-[11px] font-bold truncate ${isActive ? "text-gray-900" : ""}`}
                >
                  {graphName}
                </span>
                {isStart && (
                  <div className="ml-1.5 p-0.5 bg-emerald-100 text-emerald-600 rounded shrink-0">
                    <Play size={8} fill="currentColor" />
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-1">
                {nodeCount}
              </span>
            </div>
          )}
        </div>

        {!isRenaming && (
          <div className="absolute right-1.5 inset-y-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1.5">
            {graphFolders?.length > 0 && (
              <select
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  moveGraphToFolder(graphName, e.target.value || null);
                }}
                value={graphs[graphName]?.folder || ""}
                className="text-[9px] font-bold text-gray-400 bg-transparent border-none outline-none cursor-pointer max-w-[50px] truncate"
                title="Move to folder"
              >
                <option value="">—</option>
                {graphFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            {!isStart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStartGraph(graphName);
                }}
                className="p-1 hover:text-emerald-600 text-gray-400"
                title="Set as Project Start"
              >
                <Flag size={11} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateGraph(graphName);
              }}
              className="p-1 hover:text-indigo-600 text-gray-400"
              title="Duplicate"
            >
              <Copy size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingName(graphName);
                setEditValue(graphName);
              }}
              className="p-1 hover:text-blue-600 text-gray-400"
              title="Rename"
            >
              <Edit2 size={11} />
            </button>
            {Object.keys(graphs).length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGraph(graphName);
                }}
                className="p-1 hover:text-red-600 text-gray-400"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        style={{ width: `${width}px` }}
        className={`fixed left-0 top-0 h-screen bg-gray-50 border-r border-gray-200 z-40 flex flex-col shadow-sm transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* ── DRAG HANDLE FOR RIGHT BOUNDARY MARGIN ── */}
        <div
          onMouseDown={startResizing}
          className={`absolute right-0 top-0 bottom-0 w-2 flex items-center justify-center cursor-col-resize z-50 transition-colors group translation-all ${
            isResizing ? "bg-blue-500" : "bg-transparent hover:bg-blue-400/30"
          }`}
        >
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ml-2 w-4 h-8 bg-blue-500 text-white rounded-r-md shadow-md ${isResizing ? "opacity-100" : ""}`}
          >
            <GripVertical size={11} />
          </div>
        </div>

        {/* HEADER PANEL CONTAINER */}
        <div className="p-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">
              Project Navigator
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsAddingFolder((v) => !v)}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${isAddingFolder ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}
                title="New Folder"
              >
                <Folder size={11} /> Folder
              </button>
              <button
                onClick={() => addGraph()}
                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
                title="New Graph"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={toggleSidebar}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* New Folder Field Row */}
          {isAddingFolder && (
            <div className="flex gap-1 mb-3">
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") setIsAddingFolder(false);
                }}
                className="flex-grow text-[11px] font-bold px-2 py-1 border border-blue-400 rounded-lg outline-none bg-blue-50 min-w-0"
              />
              <button
                onClick={handleAddFolder}
                className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setIsAddingFolder(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Search Box Engine */}
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={11}
            />
            <input
              type="text"
              placeholder="Find conversation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 pl-7 pr-3 py-1.5 rounded-xl text-xs outline-none border border-transparent focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* GRAPH TRACK LIST CANVAS GRID */}
        <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar min-w-0">
          {/* 1. Folders Group */}
          {(graphFolders || []).map((folderName) => {
            const folderGraphs = Object.keys(graphs).filter(
              (name) => graphs[name]?.folder === folderName,
            );
            if (
              search &&
              !folderGraphs.some((n) => filteredGraphNames.includes(n))
            )
              return null;

            return (
              <div key={folderName} className="space-y-1 min-w-0">
                <div className="flex items-center justify-between px-2 py-0.5 group min-w-0">
                  {renamingFolder === folderName ? (
                    <input
                      autoFocus
                      value={folderEditValue}
                      onChange={(e) => setFolderEditValue(e.target.value)}
                      onBlur={handleRenameFolder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFolder();
                        if (e.key === "Escape") setRenamingFolder(null);
                      }}
                      className="flex-grow text-[10px] font-black bg-blue-50 border border-blue-400 rounded px-1 outline-none text-blue-700 min-w-0"
                    />
                  ) : (
                    <h3
                      onDoubleClick={() => {
                        setRenamingFolder(folderName);
                        setFolderEditValue(folderName);
                      }}
                      className="text-[10px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1.5 cursor-default select-none truncate flex-grow min-w-0"
                      title="Double-click to rename"
                    >
                      <Folder
                        size={11}
                        className="text-blue-400 flex-shrink-0"
                      />
                      <span className="truncate">{folderName}</span>
                    </h3>
                  )}
                  <button
                    onClick={() => deleteFolder(folderName)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-opacity ml-1 flex-shrink-0"
                    title="Delete folder"
                  >
                    <X size={16} />
                  </button>
                </div>
                {folderGraphs.map((name) => renderGraphItem(name))}
              </div>
            );
          })}

          {/* 2. Unassigned standalone graph indexes */}
          {Object.keys(graphs).some((name) => !graphs[name]?.folder) && (
            <div className="space-y-1 min-w-0">
              {graphFolders?.length > 0 && (
                <h3 className="px-2 py-1 text-[10px] font-black text-gray-300 uppercase tracking-tighter truncate">
                  Unassigned
                </h3>
              )}
              {Object.keys(graphs)
                .filter((name) => !graphs[name]?.folder)
                .map((name) => renderGraphItem(name))}
            </div>
          )}
        </div>

        {/* STATIC ACCUMULATOR FOOTER SUMMARY */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-tighter">
            <span>Total Graphs</span>
            <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">
              {Object.keys(graphs).length}
            </span>
          </div>
        </div>
      </aside>

      {/* SIDEBAR CLOSED FLOATING TOGGLE HASH BUTTON */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-4 z-30 bg-white p-3 rounded-xl shadow-xl border border-gray-200 hover:scale-110 transition-all"
        >
          <Share2 size={20} className="text-blue-500" />
        </button>
      )}
    </>
  );
}

export default memo(GraphNavigator)