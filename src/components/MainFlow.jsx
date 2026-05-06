// import { useState, useCallback } from "react";
// import DialogueNode from "./DialogueNode";
// import Inspector from "./Inspector";
// import ReactFlow, {
//   Background,
//   Controls,
//   applyEdgeChanges,
//   applyNodeChanges,
//   addEdge,
//   MiniMap,
// } from "reactflow";
// import "reactflow/dist/style.css";

// export default function MainFlow({ initialNodes, initialEdges }) {
//   const [nodes, setNodes] = useState(initialNodes);
//   const [edges, setEdges] = useState(initialEdges);

//   const onNodesChange = useCallback(
//     (changes) =>
//       setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
//     [],
//   );

//   const onEdgesChange = useCallback(
//     (changes) =>
//       setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
//     [],
//   );

//   const onConnect = useCallback(
//     (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
//     [],
//   );

//   // 1. Get the selected node from the nodes array
//   const selectedNode = nodes.find((n) => n.selected);

//   // 2. Function to update node data globally
//   const updateNodeData = useCallback((nodeId, newData) => {
//     setNodes((nds) =>
//       nds.map((node) => {
//         if (node.id === nodeId) {
//           return { ...node, data: newData };
//         }
//         return node;
//       }),
//     );
//   }, []);

//   const nodeTypes = {
//     dialogue: DialogueNode,
//   };

//   const [variant, setVariant] = useState("cross");

//   return (
//     <div style={{ width: "100vw", height: "100vh" }}>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onConnect={onConnect}
//         nodeTypes={nodeTypes}
//         fitView
//       >
//         <Background color="skyblue" variant={variant} gap={16} />
//         <Controls />
//         <MiniMap nodeStrokeWidth={3} zoomable pannable />
//       </ReactFlow>

//       {/* The Sidebar */}
//       <Inspector selectedNode={selectedNode} updateNodeData={updateNodeData} />
//     </div>
//   );
// }
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { useLoreStore } from "../store"; // Import the store
import DialogueNode from "./DialogueNode";
import Inspector from "./Inspector";

const nodeTypes = {
  dialogue: DialogueNode,
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
  } = useLoreStore();

  // Find the selected node for the inspector
  const selectedNode = nodes.find((n) => n.selected);

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