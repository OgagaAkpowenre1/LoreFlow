// import { NodeResizer } from "reactflow";
// import "@reactflow/node-resizer/dist/style.css"; // Make sure this is imported

// export default function CollectionNode({ data, selected }) {
//   const baseColor = data.color || "#f1f5f9";
//   const transparentBg = baseColor.startsWith("#")
//     ? `${baseColor}33`
//     : baseColor;

//   // Custom style for the resizer handles
//   const handleStyle = {
//     width: 12,
//     height: 12,
//     borderRadius: "50%",
//     backgroundColor: `${baseColor}`,
//     border: `3px solid ${baseColor}`,
//     margin: -6, // Centers the handle on the corner
//   };

//   return (
//     <>
//       <NodeResizer
//         isVisible={selected}
//         minWidth={200}
//         minHeight={200}
//         handleStyle={handleStyle} // Apply chunky handles
//         lineStyle={{ border: `2px solid ${baseColor}`, borderRadius: "24px" }}
//       />
//       <div
//         style={{
//           backgroundColor: transparentBg,
//           borderColor: baseColor,
//           zIndex: -1,
//         }}
//         // pointer-events-none on the wrapper,
//         // but pointer-events-auto on the children that need clicking
//         className={`w-full h-full rounded-3xl border-2 border-dashed transition-all pointer-events-none ${
//           selected ? "border-blue-500 ring-2 ring-blue-500/20" : ""
//         }`}
//       >
//         <div className="absolute -top-8 left-0 flex items-center gap-2 pointer-events-auto">
//           <span
//             style={{ backgroundColor: baseColor }}
//             className="text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg"
//           >
//             📦 {data.title}
//           </span>
//         </div>
//       </div>
//     </>
//   );
// }

import React from "react";
import { NodeResizer } from "reactflow";

// Helper to force transparency on Hex or RGB strings
const getTransparentColor = (color, opacity = 0.2) => {
  if (!color) return "rgba(241, 245, 249, 0.2)";

  // Handle Hex
  if (color.startsWith("#")) {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color.slice(0, 7)}${alpha}`;
  }

  // Handle RGB
  if (color.startsWith("rgb(")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }

  return color;
};

export default function CollectionNode({ data, selected }) {
  const baseColor = data.color || "#6366f1";
  const transparentBg = getTransparentColor(baseColor, 0.15); // 15% opacity

  // Custom style for the resizer handles
  const handleStyle = {
    width: 16, // Made slightly larger
    height: 16,
    borderRadius: "50%",
    backgroundColor: baseColor, // Now strictly follows inspector color
    border: `3px solid white`, // Added white border to make them pop
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
          zIndex: -1,
        }}
        className={`w-full h-full rounded-3xl border-2 border-dashed transition-all pointer-events-none ${
          selected ? "ring-4 ring-blue-500/20" : ""
        }`}
      >
        <div className="absolute -top-10 left-0 flex items-center gap-2 pointer-events-auto">
          <span
            style={{ backgroundColor: baseColor }}
            className="text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2"
          >
            <span className="opacity-50">📦</span>
            {data.title || "New Collection"}
          </span>
        </div>
      </div>
    </>
  );
}