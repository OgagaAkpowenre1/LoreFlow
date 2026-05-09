import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { useLoreStore } from "../store"; // Import the store
import SceneNode from "./SceneNode";
import LogicNode from "./LogicNode";
import Inspector from "./Inspector";
import ImportButton from "./ImportButton";
import { MessageSquare, GitBranch, Download, Trash2 } from "lucide-react";

const nodeTypes = {
  scene: SceneNode,
  logic: LogicNode
};

export default function MainFlow() {
  // Pull EVERYTHING from the store
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeData,
    editingNodeId, // Pull this
    setEditingNode,
    addNode, 
    exportGameData,
    resetProject,
    exportProject
  } = useLoreStore();

  // Find the selected node for the inspector
  const selectedNode = nodes.find((n) => n.id === editingNodeId);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* CREATION TOOLBAR */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white shadow-2xl">
        <button
          onClick={() => addNode("scene")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all hover:scale-105"
        >
          <MessageSquare size={16} /> New Scene
        </button>
        <button
          onClick={() => addNode("logic")}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all hover:scale-105"
        >
          <GitBranch size={16} /> New Logic
        </button>
        <div className="w-[1px] h-6 bg-gray-200 mx-2" />
        {/* Project Management */}
        <ImportButton />
        <button onClick={exportProject} className="...">
          Save Project
        </button>
        {/* EXPORT BUTTON */}
        <div className="w-[1px] h-8 bg-gray-200 mx-2" /> {/* Divider */}
        <button
          onClick={exportGameData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg"
        >
          <Download size={16} className="text-blue-400" /> Export JSON
        </button>
        <button
          onClick={resetProject}
          className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-bold uppercase transition-colors"
        >
          <Trash2 size={14} /> Clear Workspace
        </button>
      </div>

      <div className="flex-grow h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setEditingNode(node.id)}
          onPaneClick={() => setEditingNode(null)}
          fitView
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