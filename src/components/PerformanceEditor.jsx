import React, { memo, useEffect, useRef } from "react";
import { useLoreStore } from "../store";

function PerformanceMonitor() {
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Only run this once on mount
    startTimeRef.current = performance.now();

    // Log initial memory (Chrome only)
    if (performance.memory) {
      console.log(
        `Initial heap: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
      );
    }

    // Generate stress-test graph after a short delay so DOM is ready
    const timer = setTimeout(() => {
      generateStressTestGraph(10); // Start with 500 nodes, scale up from here
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const generateStressTestGraph = (nodeCount) => {
    const generateStart = performance.now();

    const nodes = [];
    const edges = [];

    for (let i = 0; i < nodeCount; i++) {
      // Generate dialogue lines — vary the count to stress the modal
      const lineCount = i % 10 === 0 ? 100 : 20; // Some scenes with 100 lines
      const dialogueLines = [];

      for (let j = 0; j < lineCount; j++) {
        dialogueLines.push({
          id: `line-${i}-${j}`,
          speaker: j % 3 === 0 ? "Alice" : j % 3 === 1 ? "Bob" : "Narrator",
          text: `Line ${j}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          portrait: "",
          sound: "",
          variants:
            j % 5 === 0
              ? [
                  {
                    id: `var-${i}-${j}-0`,
                    check_flag: "player_name",
                    operator: "==",
                    value: "Alice",
                    text: "Alternative text for this line",
                  },
                ]
              : [],
        });
      }

      nodes.push({
        id: `scene-${i}`,
        type: "scene",
        position: {
          x: (i % 25) * 300,
          y: Math.floor(i / 25) * 200,
        },
        data: {
          title: `Scene ${i}`,
          dialogueLines,
          choices: [
            { id: `choice-${i}-0`, label: "Choice A", text: "Go left" },
            { id: `choice-${i}-1`, label: "Choice B", text: "Go right" },
          ],
          flags: [],
          color: "#3b82f6",
        },
      });

      // Link scenes sequentially
      if (i > 0 && Math.random() > 0.3) {
        // 70% of scenes chain to the next one
        edges.push({
          id: `e-${i - 1}-${i}`,
          source: `scene-${i - 1}`,
          target: `scene-${i}`,
          sourceHandle: "default-output",
        });
      }

      // Add some random cross-edges for branching
      if (i > 5 && Math.random() > 0.9) {
        edges.push({
          id: `e-random-${i}-${Math.random()}`,
          source: `scene-${Math.max(0, i - 5)}`,
          target: `scene-${i}`,
        });
      }
    }

    const generateEnd = performance.now();
    console.log(
      `Generated ${nodeCount} nodes in ${(generateEnd - generateStart).toFixed(2)}ms`,
    );

    // Store it
    const storeStart = performance.now();
    useLoreStore.setState({
      graphs: {
        "stress-test": {
          nodes,
          edges,
          viewport: { x: 0, y: 0, zoom: 0.5 },
        },
      },
      activeGraph: "stress-test",
    });
    const storeEnd = performance.now();
    console.log(`Stored in Zustand in ${(storeEnd - storeStart).toFixed(2)}ms`);

    // Log memory after
    if (performance.memory) {
      console.log(
        `Heap after graph: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
      );
    }

    // Calculate displayNodes/displayEdges time by checking the next state
    setTimeout(() => {
      if (performance.memory) {
        console.log(
          `Heap stabilized: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
        );
      }
    }, 500);
  };

  const generateLightweightStressTest = (nodeCount) => {
    const generateStart = performance.now();

    const nodes = [];
    const edges = [];

    // Cycle through a few colors for visual distinction
    const colors = ["#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#f97316"];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `scene-${i}`,
        type: "scene",
        position: {
          x: (i % 25) * 300,
          y: Math.floor(i / 25) * 200,
        },
        data: {
          title: `Scene ${i}`,
          dialogueLines: [], // Empty payload
          choices: [], // Empty payload
          flags: [], // Empty payload
          color: colors[i % colors.length],
        },
      });

      // Link scenes sequentially
      if (i > 0 && Math.random() > 0.3) {
        // 70% of scenes chain to the next one
        edges.push({
          id: `e-${i - 1}-${i}`,
          source: `scene-${i - 1}`,
          target: `scene-${i}`,
          sourceHandle: "default-output",
        });
      }

      // Add some random cross-edges for branching
      if (i > 5 && Math.random() > 0.9) {
        edges.push({
          id: `e-random-${i}-${Math.random()}`,
          source: `scene-${Math.max(0, i - 5)}`,
          target: `scene-${i}`,
        });
      }
    }

    const generateEnd = performance.now();
    console.log(
      `Generated ${nodeCount} lightweight nodes in ${(generateEnd - generateStart).toFixed(2)}ms`,
    );

    // Store it safely using the new decoupled viewport architecture
    const storeStart = performance.now();
    useLoreStore.setState((state) => ({
      graphs: {
        ...state.graphs,
        "stress-test-light": {
          nodes,
          edges,
          folder: null,
        },
      },
      viewports: {
        ...state.viewports,
        "stress-test-light": { x: 0, y: 0, zoom: 0.5 },
      },
      activeGraph: "stress-test-light",
    }));

    const storeEnd = performance.now();
    console.log(`Stored in Zustand in ${(storeEnd - storeStart).toFixed(2)}ms`);

    // Log memory after (Chrome only, safely ignored in Firefox)
    if (performance.memory) {
      console.log(
        `Heap after graph: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
      );
    }

    // Calculate displayNodes/displayEdges time by checking the next state
    setTimeout(() => {
      if (performance.memory) {
        console.log(
          `Heap stabilized: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
        );
      }
    }, 500);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono max-w-xs z-[10000]">
      <p>Performance Monitor Active</p>
      <p className="text-gray-400 text-[10px] mt-2">
        Check console for detailed timing logs
      </p>
      <button
        onClick={() => generateLightweightStressTest(50)}
        className="mt-2 bg-blue-600 px-2 py-1 rounded text-[10px] hover:bg-blue-700"
      >
        Generate 50 Nodes
      </button>
      <button
        onClick={() => generateLightweightStressTest(100)}
        className="mt-2 ml-2 bg-red-600 px-2 py-1 rounded text-[10px] hover:bg-red-700"
      >
        Generate 100 Nodes
      </button>
    </div>
  );
}

export default memo(PerformanceMonitor);

// let totalBytes = 0;
// for (let i = 0; i < localStorage.length; i++) {
//   let key = localStorage.key(i);
//   let value = localStorage.getItem(key);
//   // Firefox stores data as UTF-16 strings (2 bytes per character)
//   totalBytes += (key.length + value.length) * 2;
// }
// console.log(
//   "Local Storage Used: " +
//     (totalBytes / 1024).toFixed(2) +
//     " KB (" +
//     totalBytes +
//     " bytes)",
// );
