import React, { useEffect } from "react";
import ReactFlow, { useReactFlow, Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { useLoreStore } from "../store"; // Import the store
import SceneNode from "./SceneNode";
import LogicNode from "./LogicNode";
import Inspector from "./Inspector";
import CollectionNode from "./CollectionNode";
import Navbar from "./Navbar";
import DeleteEdge from "./DeleteEdge";
import StartNode from "./StartNode";

const nodeTypes = {
  scene: SceneNode,
  logic: LogicNode,
  collection: CollectionNode,
  start: StartNode,
};

const edgeTypes = {
  default: DeleteEdge, // Override the default edge with our custom one
};

export default function MainFlow() {
  // Pull EVERYTHING from the store
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    editingNodeId, // Pull this
    setEditingNode,
    graphs,
    activeGraph,
    onViewportChange,
  } = useLoreStore();

  const { setViewport } = useReactFlow();

  // Pull the current data dynamically
  const nodes = graphs[activeGraph]?.nodes || [];
  const edges = graphs[activeGraph]?.edges || [];
  const savedViewport = graphs[activeGraph]?.viewport;

  // Find the selected node for the inspector
  const selectedNode = nodes.find((n) => n.id === editingNodeId);

  // --- THE TELEPORT LOGIC ---
  // Whenever the activeGraph changes, tell React Flow to move the camera
  useEffect(() => {
    if (savedViewport) {
      setViewport(
        { x: savedViewport.x, y: savedViewport.y, zoom: savedViewport.zoom },
        { duration: 400 }, // This adds a smooth "glide" transition
      );
    }
  }, [activeGraph, setViewport]); // Runs only when you switch graphs

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* CREATION TOOLBAR */}
      <Navbar />

      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes} // Pass edgeTypes here
          onNodeClick={(_, node) => setEditingNode(node.id)}
          onPaneClick={() => setEditingNode(null)}
          fitView
          elevateNodesOnSelect={false}
          onMoveEnd={(event, viewport) => onViewportChange(viewport)}
        >
          <Background color="#f1f5f9" variant="dots" gap={20} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>

      {/* The Sidebar stays inside the flex container */}
      <Inspector selectedNode={selectedNode} />
    </div>
  );
}
