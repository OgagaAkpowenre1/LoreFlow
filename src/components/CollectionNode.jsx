// import React from "react";
// import { NodeResizer } from "reactflow";

// // Helper to force transparency on Hex or RGB strings
// const getTransparentColor = (color, opacity = 0.2) => {
//   if (!color) return "rgba(241, 245, 249, 0.2)";

//   // Handle Hex
//   if (color.startsWith("#")) {
//     const alpha = Math.round(opacity * 255)
//       .toString(16)
//       .padStart(2, "0");
//     return `${color.slice(0, 7)}${alpha}`;
//   }

//   // Handle RGB
//   if (color.startsWith("rgb(")) {
//     return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
//   }

//   return color;
// };

// export default function CollectionNode({ data, selected }) {
//   const baseColor = data.color || "#6366f1";
//   const transparentBg = getTransparentColor(baseColor, 0.15); // 15% opacity

//   // Custom style for the resizer handles
//   const handleStyle = {
//     width: 16, // Made slightly larger
//     height: 16,
//     borderRadius: "50%",
//     backgroundColor: baseColor, // Now strictly follows inspector color
//     border: `3px solid white`, // Added white border to make them pop
//     margin: -8,
//     boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
//     cursor: "nwse-resize",
//   };

//   return (
//     <>
//       <NodeResizer
//         isVisible={selected}
//         minWidth={200}
//         minHeight={200}
//         handleStyle={handleStyle}
//         lineStyle={{ border: `2px solid ${baseColor}`, borderRadius: "24px" }}
//       />
//       <div
//         style={{
//           backgroundColor: transparentBg,
//           borderColor: baseColor,
//           boxShadow: selected
//             ? `0 0 0 4px ${getTransparentColor(baseColor, 0.2)}, 0 25px 50px -12px ${getTransparentColor(baseColor, 0.15)}`
//             : "none",
//           zIndex: -1,
//         }}
//         className={`w-full h-full rounded-3xl border-2 border-dashed transition-all duration-300 pointer-events-none ${
//           selected ? "scale-[1.01]" : ""
//         }`}
//       >
//         <div className="absolute -top-10 left-0 flex items-center gap-2 pointer-events-auto">
//           <span
//             style={{ backgroundColor: baseColor }}
//             className="text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2"
//           >
//             <span className="opacity-50">📦</span>
//             {data.title || "New Collection"}
//           </span>
//         </div>
//       </div>
//     </>
//   );
// }

import React from "react";
import { NodeResizer } from "reactflow";
import { useLoreStore } from "../store";
import { Handle } from "reactflow";
import { Position } from "reactflow";

// Helper to force transparency on Hex or RGB strings
const getTransparentColor = (color, opacity = 0.2) => {
  if (!color) return "rgba(241, 245, 249, 0.2)";

  if (color.startsWith("#")) {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color.slice(0, 7)}${alpha}`;
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }

  return color;
};

export default function CollectionNode({ id, data, selected }) {
  const baseColor = data.color || "#6366f1";
  const transparentBg = getTransparentColor(baseColor, 0.15);

  const { setFocusedCollectionId, collectionDisplayMode } = useLoreStore();

  const handleDrillDown = (e) => {
    if (collectionDisplayMode === "isolated") {
      e.stopPropagation();
      setFocusedCollectionId(id);
    }
  };

  // ── ISOLATED MODE RENDERING (Compact Folder Node) ──
  if (collectionDisplayMode === "isolated") {
    return (
      <div
        onDoubleClick={handleDrillDown}
        style={{
          borderColor: baseColor,
          boxShadow: selected
            ? `0 0 0 4px ${getTransparentColor(baseColor, 0.2)}, 0 10px 25px -5px ${getTransparentColor(baseColor, 0.15)}`
            : "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
        className={`relative w-[220px] bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer ${
          selected ? "scale-[1.03]" : "hover:scale-[1.01] hover:shadow-xl"
        }`}
        title="Double-click to enter Collection Workspace"
      >
        {/* ── INJECTED: Proxy Target Handle (Top) ── */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 border-4 border-white shadow-md z-10"
          style={{ backgroundColor: baseColor, top: "-10px" }}
        />

        <div
          className="flex items-center justify-between p-3 border-b border-gray-100 rounded-t-lg"
          style={{ backgroundColor: `${baseColor}10` }}
        >
          <div className="flex items-center gap-2">
            <span className="opacity-70 text-sm">📦</span>
            <span
              className="text-[11px] font-black uppercase tracking-widest truncate max-w-[150px]"
              style={{ color: baseColor }}
            >
              {data.title || "New Collection"}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col items-center justify-center text-center gap-1.5 bg-white rounded-b-lg">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-1 rounded bg-gray-50">
            Workspace Node
          </span>
          <span className="text-[8px] text-gray-400 italic">
            Double-click to enter
          </span>
        </div>

        {/* ── INJECTED: Proxy Source Handle (Bottom) ── */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 border-4 border-white shadow-md z-10"
          style={{ backgroundColor: baseColor, bottom: "-10px" }}
        />
      </div>
    );
  }

  // ── REGULAR MODE RENDERING (Massive Resizable Area) ──
  const handleStyle = {
    width: 16,
    height: 16,
    borderRadius: "50%",
    backgroundColor: baseColor,
    border: `3px solid white`,
    margin: -8,
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    cursor: "nwse-resize",
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={200}
        handleStyle={handleStyle}
        lineStyle={{ border: `2px solid ${baseColor}`, borderRadius: "24px" }}
      />
      <div
        style={{
          backgroundColor: transparentBg,
          borderColor: baseColor,
          boxShadow: selected
            ? `0 0 0 4px ${getTransparentColor(baseColor, 0.2)}, 0 25px 50px -12px ${getTransparentColor(baseColor, 0.15)}`
            : "none",
          zIndex: -1,
        }}
        className={`w-full h-full rounded-3xl border-2 border-dashed transition-all duration-300 pointer-events-none ${
          selected ? "scale-[1.01]" : ""
        }`}
      >
        <div className="absolute -top-10 left-0 flex items-center gap-2 pointer-events-auto">
          <span
            onDoubleClick={handleDrillDown}
            style={{ backgroundColor: baseColor }}
            className="text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 transition-transform"
          >
            <span className="opacity-50">📦</span>
            {data.title || "New Collection"}
          </span>
        </div>
      </div>
    </>
  );
}
