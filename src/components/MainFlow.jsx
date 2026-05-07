import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { useLoreStore } from "../store"; // Import the store
import SceneNode from "./SceneNode";
import Inspector from "./Inspector";

const nodeTypes = {
  scene: SceneNode,
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
  } = useLoreStore();

  // Find the selected node for the inspector
  const selectedNode = nodes.find((n) => n.id === editingNodeId);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
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