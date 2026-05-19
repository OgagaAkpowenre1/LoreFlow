import React, { useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider, // Added provider
  useReactFlow,
  Background,
  Controls,
  MiniMap,
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

const nodeTypes = {
  scene: SceneNode,
  logic: LogicNode,
  collection: CollectionNode,
  start: StartNode,
  jump: JumpNode,
  switch: SwitchNode
};

const edgeTypes = {
  default: DeleteEdge,
};

// ── SUB-COMPONENT: Safely handles context hook logic ──
function FlowContent() {
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    editingNodeId,
    setEditingNode,
    graphs,
    activeGraph,
    onViewportChange,
  } = useLoreStore();

  const { setViewport } = useReactFlow();

  const nodes = graphs[activeGraph]?.nodes || [];
  const edges = graphs[activeGraph]?.edges || [];
  const savedViewport = graphs[activeGraph]?.viewport;
  const selectedNode = nodes.find((n) => n.id === editingNodeId);

  // Smooth Teleportation Engine safely decoupled from automated adjustments
  useEffect(() => {
    if (savedViewport) {
      setViewport(
        { x: savedViewport.x, y: savedViewport.y, zoom: savedViewport.zoom },
        { duration: 400 },
      );
    }
  }, [activeGraph, setViewport]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Navbar />

      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => setEditingNode(node.id)}
          onPaneClick={() => setEditingNode(null)}
          elevateNodesOnSelect={false}
          // REMOVED: fitView to prevent coordinate clobber loops
          // ONLY saves coordinates when panning/zooming finishes completely
          onMoveEnd={(_, viewport) => {
            if (viewport) {
              onViewportChange(viewport);
            }
          }}
        >
          <Background color="#f1f5f9" variant="dots" gap={20} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>

      <Inspector selectedNode={selectedNode} />
    </div>
  );
}

// ── MAIN EXPORT: Wraps the system inside the safe provider layer ──
export default function MainFlow() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}