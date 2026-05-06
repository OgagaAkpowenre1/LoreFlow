import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import MainFlow from './components/MainFlow';

const initialNodes = [
  {
    id: "1",
    type: "dialogue", // Must be a string in quotes
    position: { x: 100, y: 0 },
    data: {
      title: "Opening Scene",
      speaker: "System",
      content: "Start your story here!", // Or use an array for multiple lines
      actions: [{ flag: "game_started", value: true }],
    },
  },
  {
    id: "2",
    type: "dialogue", // Must be a string in quotes
    position: { x: 100, y: 300 },
    data: {
      title: "The End",
      speaker: "Narrator",
      content: "And so, the journey began...",
    },
  },
];
const initialEdges = [
  // {
  //   id: '1-2',
  //   source: '1',
  //   target: '2',
  //   type: 'step',
  //   label: 'connects with'
  // }
];

export default function App() {
  return (
    <main>
      <MainFlow initialEdges={initialEdges} initialNodes={initialNodes} />
    </main>
  );
}