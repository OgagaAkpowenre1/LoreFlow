import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 100, y: 0 }, data: { label: 'Start your story here!' } },
  { id: '2', position: { x: 100, y: 100}, data: { label: 'End your story here!' } },
];
const initialEdges = [
  {
    id: '1-2',
    source: '1',
    target: '2',
    type: 'step',
    label: 'connects with'
  }
];

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges}>
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}