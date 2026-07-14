import React, { useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { useLoreStore } from "../store";
import SceneNode from "./SceneNode";
import LogicNode from "./LogicNode";
import Inspector from "./Inspector";
import CollectionNode from "./CollectionNode";
import Navbar from "./Navbar";
import DeleteEdge from "./DeleteEdge";
import StartNode from "./StartNode";
import JumpNode from "./JumpNode";
import SwitchNode from "./SwitchNode";
import { Globe, ChevronRight } from "lucide-react";

const nodeTypes = {
  scene: SceneNode,
  logic: LogicNode,
  collection: CollectionNode,
  start: StartNode,
  jump: JumpNode,
  switch: SwitchNode,
};

const edgeTypes = {
  default: DeleteEdge,
};

function FlowContent() {
  // ── ZUSTAND SELECTORS ──
  // Each field is subscribed individually so a change to an unrelated slice
  // of the store (a toast, some other UI flag, etc.) does NOT re-render
  // this component. Previously `useLoreStore()` was called with no
  // selector, which subscribes to the ENTIRE store.
  const onNodesChange = useLoreStore((s) => s.onNodesChange);
  const onEdgesChange = useLoreStore((s) => s.onEdgesChange);
  const onConnect = useLoreStore((s) => s.onConnect);
  const editingNodeId = useLoreStore((s) => s.editingNodeId);
  const setEditingNode = useLoreStore((s) => s.setEditingNode);
  const activeGraph = useLoreStore((s) => s.activeGraph);
  const onViewportChange = useLoreStore((s) => s.onViewportChange);
  const focusedCollectionId = useLoreStore((s) => s.focusedCollectionId);
  const setFocusedCollectionId = useLoreStore((s) => s.setFocusedCollectionId);
  const collectionDisplayMode = useLoreStore((s) => s.collectionDisplayMode);

  // Selecting the active graph slice this way means the component only
  // gets a new reference when graphs[activeGraph] itself changes -
  // editing a *different* graph in the store won't cause a re-render here,
  // because Zustand does a reference-equality check on the selector output.
  const activeGraphData = useLoreStore((s) => s.graphs[s.activeGraph]);

  const { setViewport } = useReactFlow();

  const rawNodes = activeGraphData?.nodes || [];
  const rawEdges = activeGraphData?.edges || [];

  // Read viewport from the separate `viewports` slice instead of from `graphs`
  // so drag operations don't cause this component to re-render unnecessarily
  const savedViewport = useLoreStore((s) => s.viewports?.[s.activeGraph]);

  // ── O(1) LOOKUP MAP ──
  // Replaces every rawNodes.find(n => n.id === X) in this file, which was
  // O(n) per call and got called inside loops (O(n*m) overall).
  const nodeById = useMemo(() => {
    const map = new Map();
    for (const n of rawNodes) map.set(n.id, n);
    return map;
  }, [rawNodes]);

  const selectedNode = editingNodeId ? nodeById.get(editingNodeId) : undefined;
  const focusedCollection = focusedCollectionId
    ? nodeById.get(focusedCollectionId)
    : undefined;

  // ── REFERENCE-STABILITY CACHES ──
  // Keyed by node id. We only build a new object for a node when that
  // specific node's source reference changed. Nodes that didn't change
  // (e.g. everything except the one being dragged) keep the exact same
  // object identity across renders, so React Flow / React can skip them.
  const collectionStyleCacheRef = useRef(new Map()); // id -> { srcNode, cleaned }
  const internalNodeCacheRef = useRef(new Map()); // id -> { srcNode, cleaned }
  const ghostNodeCacheRef = useRef(new Map()); // id -> { srcNode, colX, colY, cleaned }

  function getCleanedCollectionNode(n) {
    const cache = collectionStyleCacheRef.current;
    const cached = cache.get(n.id);
    if (cached && cached.srcNode === n) return cached.cleaned;

    const { width, height, backgroundColor, ...safeStyle } = n.style || {};
    const cleaned = { ...n, style: safeStyle };
    cache.set(n.id, { srcNode: n, cleaned });
    return cleaned;
  }

  function getInternalNode(n) {
    const cache = internalNodeCacheRef.current;
    const cached = cache.get(n.id);
    if (cached && cached.srcNode === n) return cached.cleaned;

    const cleaned = { ...n, parentId: undefined };
    cache.set(n.id, { srcNode: n, cleaned });
    return cleaned;
  }

  function getGhostNode(n, colX, colY) {
    const cache = ghostNodeCacheRef.current;
    const cached = cache.get(n.id);
    if (
      cached &&
      cached.srcNode === n &&
      cached.colX === colX &&
      cached.colY === colY
    ) {
      return cached.cleaned;
    }

    let absoluteX = n.position.x;
    let absoluteY = n.position.y;
    if (n.parentId) {
      const parent = nodeById.get(n.parentId);
      if (parent) {
        absoluteX += parent.position.x;
        absoluteY += parent.position.y;
      }
    }

    const cleaned = {
      ...n,
      parentId: undefined,
      position: { x: absoluteX - colX, y: absoluteY - colY },
      style: {
        ...(n.style || {}),
        opacity: 0.5,
        pointerEvents: "none",
        filter: "grayscale(100%)",
        backgroundColor: "transparent",
      },
    };
    cache.set(n.id, { srcNode: n, colX, colY, cleaned });
    return cleaned;
  }

  // ── 1. VIEW PROJECTION: NODES ──
  const displayNodes = useMemo(() => {
    // FAST PATH 1: Regular mode - zero compute, original array reference.
    if (collectionDisplayMode === "regular") {
      return rawNodes;
    }

    // FAST PATH 2: Isolated mode, main canvas.
    // Only collection nodes ever need a new object (to strip style);
    // everything else keeps its original reference.
    if (!focusedCollectionId) {
      return rawNodes
        .filter((n) => !n.parentId)
        .map((n) =>
          n.type === "collection" ? getCleanedCollectionNode(n) : n,
        );
    }

    // HEAVY PATH: drilled inside a collection.
    const collectionNode = nodeById.get(focusedCollectionId);
    const colX = collectionNode?.position?.x || 0;
    const colY = collectionNode?.position?.y || 0;

    const internalNodes = [];
    const internalNodeIds = new Set();

    for (const n of rawNodes) {
      if (n.parentId === focusedCollectionId) {
        internalNodes.push(getInternalNode(n));
        internalNodeIds.add(n.id);
      }
    }

    const externalNodeIds = new Set();
    for (const e of rawEdges) {
      if (internalNodeIds.has(e.source) && !internalNodeIds.has(e.target)) {
        externalNodeIds.add(e.target);
      }
      if (internalNodeIds.has(e.target) && !internalNodeIds.has(e.source)) {
        externalNodeIds.add(e.source);
      }
    }

    const ghostNodes = [];
    for (const id of externalNodeIds) {
      const n = nodeById.get(id);
      if (n) ghostNodes.push(getGhostNode(n, colX, colY));
    }

    return [...internalNodes, ...ghostNodes];
  }, [
    rawNodes,
    rawEdges,
    collectionDisplayMode,
    focusedCollectionId,
    nodeById,
  ]);

  // ── 2. VIEW PROJECTION: EDGES ──
  const displayEdges = useMemo(() => {
    // FAST PATH: zero compute for regular mode.
    if (collectionDisplayMode === "regular") return rawEdges;

    if (!focusedCollectionId) {
      const parentMap = new Map();
      for (const n of rawNodes) {
        if (n.parentId) parentMap.set(n.id, n.parentId);
      }

      const bundledEdges = [];
      const edgeTracker = new Set();

      for (const e of rawEdges) {
        const sParent = parentMap.get(e.source);
        const tParent = parentMap.get(e.target);

        if (sParent && sParent === tParent) continue;

        const proxyEdge = { ...e };
        let isBundled = false;

        if (sParent) {
          proxyEdge.source = sParent;
          proxyEdge.sourceHandle = null;
          isBundled = true;
        }
        if (tParent) {
          proxyEdge.target = tParent;
          proxyEdge.targetHandle = null;
          isBundled = true;
        }

        const uniqueKey = `${proxyEdge.source}-${proxyEdge.target}`;
        if (!edgeTracker.has(uniqueKey)) {
          edgeTracker.add(uniqueKey);
          if (isBundled) {
            proxyEdge.style = {
              ...proxyEdge.style,
              strokeWidth: 3,
              strokeDasharray: "5 5",
              opacity: 0.6,
            };
            proxyEdge.label = "";
          }
          bundledEdges.push(proxyEdge);
        }
      }
      return bundledEdges;
    }

    const visibleNodeIds = new Set(displayNodes.map((n) => n.id));
    const internalNodeIds = new Set();
    for (const n of rawNodes) {
      if (n.parentId === focusedCollectionId) internalNodeIds.add(n.id);
    }

    return rawEdges
      .filter(
        (e) =>
          visibleNodeIds.has(e.source) &&
          visibleNodeIds.has(e.target) &&
          (internalNodeIds.has(e.source) || internalNodeIds.has(e.target)),
      )
      .map((e) => {
        const isGhostEdge =
          !internalNodeIds.has(e.source) || !internalNodeIds.has(e.target);
        if (isGhostEdge) {
          return {
            ...e,
            style: { ...(e.style || {}), opacity: 0.4, strokeDasharray: "5 5" },
          };
        }
        return e;
      });
  }, [
    rawEdges,
    collectionDisplayMode,
    displayNodes,
    rawNodes,
    focusedCollectionId,
  ]);

  useEffect(() => {
    if (savedViewport && !focusedCollectionId) {
      setViewport(
        { x: savedViewport.x, y: savedViewport.y, zoom: savedViewport.zoom },
        { duration: 400 },
      );
    }
  }, [activeGraph, focusedCollectionId, setViewport]);

  const handleNodeDoubleClick = (_, node) => {
    if (collectionDisplayMode === "isolated" && node.type === "collection") {
      setFocusedCollectionId(node.id);
      // Instant snap to 0,0 - removes the feeling of input lag
      setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Navbar />

      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => setEditingNode(node.id)}
          onNodeDoubleClick={handleNodeDoubleClick}
          onPaneClick={() => setEditingNode(null)}
          elevateNodesOnSelect={false}
          onMoveEnd={(_, viewport) => {
            if (viewport && !focusedCollectionId) {
              onViewportChange(viewport);
            }
          }}
        >
          <Background color="#f1f5f9" variant="dots" gap={20} />

          {/* React Flow Native Widgets */}
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />

          {/* ── BREADCRUMB NAVIGATION ── */}
          {focusedCollectionId && collectionDisplayMode === "isolated" && (
            <Panel position="bottom-left" className="ml-14 mb-2 z-[150]">
              <div className="ml-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => setFocusedCollectionId(null)}
                  className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <Globe size={14} /> Main Graph
                </button>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                  <span className="opacity-50">📦</span>
                  {focusedCollection?.data?.title || "Collection Workspace"}
                </span>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <Inspector selectedNode={selectedNode} />
    </div>
  );
}

export default function MainFlow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}
