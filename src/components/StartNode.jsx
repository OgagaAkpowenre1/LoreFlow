import React from "react";
import { Handle, Position } from "reactflow";
import { Play } from "lucide-react";

export default function StartNode({ selected }) {
  return (
    <div
      className={`px-6 py-3 rounded-full bg-emerald-500 border-4 border-white shadow-xl transition-all ${
        selected ? "ring-4 ring-emerald-500/40 scale-105" : ""
      }`}
    >
      <div className="flex items-center gap-3 text-white">
        <Play size={18} fill="currentColor" />
        <span className="font-black uppercase tracking-widest text-sm">
          Project Start
        </span>
      </div>

      {/* Only Source Handle (Output) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: "20px",
          height: "20px",
          backgroundColor: "#10b981",
          bottom: "-12px",
        }}
        className="border-4 border-white shadow-md hover:scale-110 transition-transform"
      />
    </div>
  );
}
