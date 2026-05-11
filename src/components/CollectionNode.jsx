import React from "react";
import { NodeResizer } from "reactflow";
// import { NodeResizer } from "@reactflow/node-resizer";
import "@reactflow/node-resizer/dist/style.css"; // Make sure this is imported!

export default function CollectionNode({ data, selected }) {
  // Automatic transparency logic:
  // If color is #RRGGBB, we append '33' for ~20% opacity
  const baseColor = data.color || "#f1f5f9";
  const transparentBg = baseColor.startsWith("#")
    ? `${baseColor}33`
    : baseColor;

  return (
    <>
      {/* 1. MANUAL RESIZER */}
      <NodeResizer
        minWidth={200}
        minHeight={200}
        isVisible={selected}
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded"
      />
      <div
        style={{
          backgroundColor: transparentBg,
          borderColor: baseColor,
        }}
        className={`w-full h-full rounded-3xl border-2 border-dashed transition-all ${
          selected ? "border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
      >
        <div className="absolute -top-8 left-0 flex items-center gap-2">
          <span
            style={{ backgroundColor: baseColor }}
            className="text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg"
          >
            📦 {data.title}
          </span>
        </div>
      </div>
    </>
  );
}
