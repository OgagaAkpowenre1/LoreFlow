import React from "react";
import { Settings2, X, Trash2, MousePointerClick, Palette } from "lucide-react";
import { useLoreStore } from "../store";
import SceneForm from "./SceneForm";
import LogicForm from "./LogicForm";
import CollectionForm from "./CollectionForm";

export default function Inspector({ selectedNode }) {
  const {
    setEditingNode,
    deleteNode,
    setNodes,
    nodes,
    getConnectedDescendants,
    updateNodeData,
    removeFromGroup,
    moveToCollection,
  } = useLoreStore();

  // Filter for all available collections
  const collections = nodes.filter((n) => n.type === "collection");

  const handleSelectBranch = () => {
    const descendantIds = getConnectedDescendants(selectedNode.id);

    const targetIds = [selectedNode.id, ...descendantIds];
    setNodes(
      nodes.map((n) => ({
        ...n,
        selected: targetIds.includes(n.id),
      })),
    );
  };

  const handleColorChange = (newColor) => {
    if (selectedNode.type === "collection") {
      // Collections use style.backgroundColor for their big background
      setNodes(
        nodes.map((n) =>
          n.id === selectedNode.id
            ? { ...n, style: { ...n.style, backgroundColor: newColor } }
            : n,
        ),
      );
    } else {
      updateNodeData(selectedNode.id, {
        ...selectedNode.data,
        color: newColor,
      });
    }
  };

  const currentColor =
    selectedNode?.type === "collection"
      ? (selectedNode?.style?.backgroundColor ?? "#a855f7")
      : (selectedNode?.data?.color ??
        (selectedNode?.type === "logic" ? "#f97316" : "#3b82f6"));

  return (
    <aside
      className={`fixed right-0 top-0 w-85 bg-white h-screen flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l z-50 transition-transform duration-300 ease-in-out ${
        selectedNode ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* ── Header ── */}
      <header className="p-4 bg-gray-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2
            size={18}
            className={
              selectedNode?.type === "collection"
                ? "text-purple-400"
                : "text-blue-400"
            }
          />
          <h2 className="text-xs font-bold uppercase tracking-widest">
            {selectedNode?.type === "logic"
              ? "Logic Controller"
              : selectedNode?.type === "collection"
                ? "Collection Settings"
                : "Scene Editor"}
          </h2>
        </div>
        <button
          onClick={() => setEditingNode(null)}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 transition-colors"
        >
          <X size={18} />
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <div className="p-4 flex-grow overflow-y-auto">
        {/* 1. Dynamic form */}
        {selectedNode?.type === "logic" ? (
          <LogicForm node={selectedNode} />
        ) : selectedNode?.type === "collection" ? (
          <CollectionForm node={selectedNode} />
        ) : selectedNode ? (
          <SceneForm node={selectedNode} />
        ) : null}

        {/* 2. Universal color palette — shown for every node type */}
        {selectedNode && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Palette size={12} className="text-blue-500" />
              {selectedNode.type === "collection"
                ? "Collection Background"
                : "Node Theme Color"}
            </label>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <input
                type="color"
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm bg-transparent"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
              />
              <div className="flex flex-col flex-grow">
                <span className="text-[9px] font-bold text-gray-400 uppercase">
                  Hex Code
                </span>
                <input
                  type="text"
                  className="bg-transparent text-xs font-mono font-bold text-gray-600 outline-none focus:text-blue-600"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </div>

              {/* Quick presets */}
              <div className="flex gap-1">
                {["#3b82f6", "#f97316", "#ef4444", "#22c55e", "#a855f7"].map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() => handleColorChange(preset)}
                      className="w-4 h-4 rounded-full border border-white shadow-sm hover:scale-125 transition-transform"
                      style={{ backgroundColor: preset }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="px-4 pb-2 space-y-2">
        {/* Remove From Collection — only when node has a parent */}
        {selectedNode?.parentId && (
          <div className="pt-3">
            <button
              onClick={() => removeFromGroup(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              Remove From Collection
            </button>
          </div>
        )}

        {/* Select Branch — not for collections */}
        {selectedNode && selectedNode.type !== "collection" && (
          <div className="pt-1 pb-2 bg-blue-50/50 rounded-xl border border-blue-100 px-3 py-3">
            <button
              onClick={handleSelectBranch}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-100 transition-all group"
            >
              <MousePointerClick
                size={14}
                className="group-hover:scale-110 transition-transform"
              />
              Select Branch
            </button>
            <p className="text-[8px] text-blue-400 text-center mt-2 font-bold uppercase tracking-tight">
              Auto-selects all nodes reachable from here
            </p>
          </div>
        )}

        {selectedNode && selectedNode.type !== "collection" && (
          <div className="px-4 py-4 border-t space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Collection Management
            </label>

            <div className="flex gap-2">
              <select
                className="flex-grow p-2 text-[10px] font-bold border rounded bg-gray-50 outline-none"
                value={selectedNode.parentId || ""}
                onChange={(e) => {
                  if (e.target.value === "") removeFromGroup(selectedNode.id);
                  else moveToCollection(selectedNode.id, e.target.value);
                }}
              >
                <option value="">No Collection (Global)</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    Move to: {c.data.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete ── */}
      {selectedNode && (
        <div className="p-4 bg-red-50 border-t border-red-100 mt-auto">
          <button
            onClick={() => {
              if (confirm("Delete this node and all its connections?")) {
                deleteNode(selectedNode.id);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            <Trash2 size={16} /> Delete Node
          </button>
        </div>
      )}
    </aside>
  );
}