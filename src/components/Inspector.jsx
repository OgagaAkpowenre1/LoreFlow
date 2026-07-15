import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Settings2,
  X,
  Trash2,
  MousePointerClick,
  Palette,
  Play,
  GripVertical,
} from "lucide-react";
import { useReactFlow } from "reactflow"; // <-- IMPORTANT: Added React Flow canvas engine
import { useLoreStore } from "../store";
import SceneForm from "./SceneForm";
import LogicForm from "./LogicForm";
import CollectionForm from "./CollectionForm";
import JumpForm from "./JumpForm";
import SwitchForm from "./SwitchForm";
import { useShallow } from "zustand/shallow";

function Inspector({ selectedNode }) {
  const setEditingNode = useLoreStore((s) => s.setEditingNode);
  const deleteNode = useLoreStore((s) => s.deleteNode);
  // Aliased to prevent conflict with React Flow's setNodes
  const setStoreNodes = useLoreStore((s) => s.setNodes);
  const getConnectedDescendants = useLoreStore(
    (s) => s.getConnectedDescendants,
  );
  const updateNodeData = useLoreStore((s) => s.updateNodeData);
  const removeFromGroup = useLoreStore((s) => s.removeFromGroup);
  const moveToCollection = useLoreStore((s) => s.moveToCollection);

  // Scoped to just the active graph's node array, instead of subscribing
  // to the whole `graphs` object. `graphs` is replaced wholesale on every
  // onNodesChange/onEdgesChange call (including drags in OTHER graphs, if
  // any exist off-screen), so selecting the top-level object was causing
  // Inspector - and everything it renders, including SequenceEditor's
  // line list - to re-render on store updates unrelated to the node
  // actually being inspected. This selector only produces a new
  // reference when the active graph's own node array changes.
  // const currentNodes = useLoreStore(
  //   (s) => s.graphs[s.activeGraph]?.nodes || [],
  // );

  const { getNodes, getEdges, setNodes: setReactFlowNodes } = useReactFlow();

  // ─── RESIZING ENGINE ───
  const [width, setWidth] = useState(380);
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
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 280 && newWidth <= 800) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

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

  // --- SCOPING LOGIC ---
  // const collections = currentNodes.filter((n) => n.type === "collection");
  // At the top of Inspector.jsx
  const collectionsString = useLoreStore((s) => {
    const nodes = s.graphs[s.activeGraph]?.nodes || [];
    return nodes
      .filter((n) => n.type === "collection")
      .map((n) => `${n.id}::${n.data?.title || "Unnamed Collection"}`)
      .join("||");
  });

  const collections = React.useMemo(() => {
    if (!collectionsString) return [];
    return collectionsString.split("||").map((item) => {
      const [id, title] = item.split("::");
      return { id, data: { title } };
    });
  }, [collectionsString]);

  // ── BOOLEAN TRACK SELECTION (Repaired for Inspector Scope) ──
  const toggleTrackSelection = (e, trackHandle = null) => {
    e.stopPropagation();
    const currentEdges = getEdges();
    const canvasNodes = getNodes();

    const trackNodeIds = new Set();
    const queue = [];

    // Seed the queue: If trackHandle is null, grab all outputs. Otherwise, grab specific handle.
    currentEdges
      .filter(
        (edge) =>
          edge.source === selectedNode.id &&
          (!trackHandle || edge.sourceHandle === trackHandle),
      )
      .forEach((edge) => queue.push(edge.target));

    // Traverse all downstream routes via Breadth-First Search
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!trackNodeIds.has(currentId)) {
        trackNodeIds.add(currentId);
        currentEdges
          .filter((edge) => edge.source === currentId)
          .forEach((edge) => queue.push(edge.target));
      }
    }

    if (trackNodeIds.size === 0) {
      alert("No downstream nodes connected to this branch.");
      return;
    }

    // Check boolean state: Are ALL downstream nodes in this track currently selected?
    const trackNodes = canvasNodes.filter((n) => trackNodeIds.has(n.id));
    const allSelected = trackNodes.every((n) => n.selected);

    // Flip the selection state directly in the React Flow engine
    setReactFlowNodes((nds) =>
      nds.map((node) => {
        if (trackNodeIds.has(node.id)) {
          return { ...node, selected: !allSelected };
        }
        return node;
      }),
    );
  };

  const handleColorChange = (newColor) => {
    // Now ALL nodes (including collections) save their color to the exact same place
    updateNodeData(selectedNode.id, {
      ...selectedNode.data,
      color: newColor,
    });
  };

  const currentColor =
    selectedNode?.data?.color ??
    (selectedNode?.type === "collection"
      ? "#a855f7"
      : selectedNode?.type === "logic"
        ? "#f97316"
        : "#3b82f6");

  // Add this to Inspector.jsx or SequenceEditor.jsx temporarily
  const start = performance.now();
  // (component mounts or opens modal)
  const end = performance.now();
  console.log(`Modal render: ${end - start}ms`);

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`fixed right-0 top-0 bg-white h-screen flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l z-50 transition-transform duration-300 ease-in-out ${
        selectedNode ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* ── DRAG HANDLE ── */}
      <div
        onMouseDown={startResizing}
        className={`absolute left-0 top-0 bottom-0 w-2 flex items-center justify-center cursor-col-resize z-50 transition-colors group ${
          isResizing ? "bg-blue-500" : "bg-transparent hover:bg-blue-400/30"
        }`}
      >
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center -ml-2 w-4 h-8 bg-blue-500 text-white rounded-l-md shadow-md ${isResizing ? "opacity-100" : ""}`}
        >
          <GripVertical size={12} />
        </div>
      </div>

      {/* ── Header (Statically Fixed) ── */}
      <header className="p-4 pl-6 bg-gray-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2
            size={18}
            className={`shrink-0 ${
              selectedNode?.type === "collection"
                ? "text-purple-400"
                : "text-blue-400"
            }`}
          />
          <h2 className="text-xs font-bold uppercase tracking-widest truncate">
            {selectedNode?.type === "logic"
              ? "Logic Controller"
              : selectedNode?.type === "collection"
                ? "Collection Settings"
                : selectedNode?.type === "start"
                  ? "Entry Point"
                  : selectedNode?.type === "jump"
                    ? "Jump To Next Graph"
                    : selectedNode?.type === "switch"
                      ? "Multi-variable Logic Check"
                      : "Scene Editor"}
          </h2>
        </div>
        <button
          onClick={() => setEditingNode(null)}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 transition-colors shrink-0 ml-2"
        >
          <X size={18} />
        </button>
      </header>

      {/* ── Scrollable Body Context Panel ── */}
      <div className="p-4 pl-6 flex-grow overflow-y-auto custom-scrollbar space-y-6">
        {/* 1. Dynamic Forms Wrapper */}
        <div>
          {selectedNode?.type === "logic" ? (
            <LogicForm node={selectedNode} />
          ) : selectedNode?.type === "collection" ? (
            <CollectionForm node={selectedNode} />
          ) : selectedNode?.type === "jump" ? (
            <JumpForm node={selectedNode} />
          ) : selectedNode?.type === "switch" ? (
            <SwitchForm node={selectedNode} />
          ) : selectedNode?.type === "start" ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
                  <Play
                    size={24}
                    className="text-white ml-1"
                    fill="currentColor"
                  />
                </div>
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">
                  Entry Point
                </h3>
                <p className="text-[11px] text-emerald-700 mt-2 leading-relaxed italic">
                  This is where your story begins. Connect this node to the
                  first scene or logic check of your game.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase text-center">
                  No configurable data for this node
                </p>
              </div>
            </div>
          ) : selectedNode ? (
            <SceneForm node={selectedNode} />
          ) : null}
        </div>

        {/* 2. Universal Color Palette */}
        {selectedNode && (
          <div className="pt-5 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Palette size={12} className="text-blue-500" />
              {selectedNode.type === "collection"
                ? "Collection Background"
                : "Node Theme Color"}
            </label>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 flex-wrap">
              <input
                type="color"
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm bg-transparent shrink-0"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
              />
              <div className="flex flex-col flex-grow min-w-[100px]">
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

        {/* 3. Branching & Collection Management Actions */}
        {selectedNode && selectedNode.type !== "start" && (
          <div className="pt-5 border-t border-gray-100 space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Canvas Arrangements
            </label>

            {/* Remove item from group container hook */}
            {selectedNode?.parentId && (
              <button
                onClick={() => removeFromGroup(selectedNode.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
              >
                Remove From Collection
              </button>
            )}

            {selectedNode.type !== "collection" && (
              <div className="space-y-4">
                {/* Branch Mapping Engine */}
                {selectedNode.type === "logic" ? (
                  <div className="grid grid-cols-2 gap-2 bg-blue-50/50 rounded-xl border border-blue-100 p-2">
                    <button
                      onClick={(e) => toggleTrackSelection(e, "true")}
                      className="flex items-center justify-center gap-1 py-2 bg-white text-green-600 border border-green-200 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    >
                      Select TRUE Track
                    </button>
                    <button
                      onClick={(e) => toggleTrackSelection(e, "false")}
                      className="flex items-center justify-center gap-1 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      Select FALSE Track
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-2">
                    <button
                      onClick={(e) => toggleTrackSelection(e, null)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-100 transition-all group shadow-sm"
                    >
                      <MousePointerClick
                        size={14}
                        className="group-hover:scale-110 transition-transform"
                      />
                      Select Downstream Branch
                    </button>
                  </div>
                )}

                {/* Structural Dropdown Relocator */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block pl-1">
                    Assign Parent Group
                  </span>
                  <select
                    className="p-2 text-[10px] font-bold border border-gray-200 rounded-lg bg-gray-50 outline-none w-full cursor-pointer shadow-sm focus:bg-white focus:border-blue-400 transition-colors"
                    value={selectedNode.parentId || ""}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        // ✅ GOOD: Fetch nodes on-demand when the user actually clicks.
                        // No subscription required!
                        const canvasNodes = getNodes();
                        canvasNodes
                          .filter((n) => n.selected)
                          .forEach((n) => removeFromGroup(n.id));
                      } else {
                        moveToCollection(e.target.value);
                      }
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
        )}
      </div>

      {/* ── Delete Node Section (Statically Fixed at Footer Boundary) ── */}
      {selectedNode && (
        <div className="p-4 pl-6 bg-red-50 border-t border-red-100 mt-auto shrink-0">
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

export default memo(Inspector)