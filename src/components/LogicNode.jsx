import { Handle, Position } from "reactflow";
import { GitBranch } from "lucide-react";

export default function LogicNode({ data, selected }) {
  const accentColor = data.color || "#f97316";

  return (
    <div
      className={`w-32 h-32 flex items-center justify-center transition-all ${selected ? "scale-105" : ""}`}
    >
      {/* 1. The Diamond Shape (Now holds the background) */}
      <div
        style={{
          borderColor: accentColor,
          // Move the 10% transparency here so the whole diamond is tinted
          backgroundColor: `${accentColor}15`,
          boxShadow: selected
            ? `0 0 25px ${accentColor}66`
            : "0 2px 5px rgba(0,0,0,0.1)",
        }}
        className="absolute inset-0 rotate-45 rounded-sm border-2 transition-all duration-300"
      />

      {/* 2. Content Area (Transparent background to hide the square) */}
      <div className="relative z-10 flex flex-col items-center text-center p-3 pointer-events-none">
        <div
          className="p-1.5 rounded-full mb-1 shadow-sm border border-white/50"
          style={{ backgroundColor: `${accentColor}30` }}
        >
          <GitBranch size={14} style={{ color: accentColor }} />
        </div>

        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">
          IF Check
        </span>

        {/* The "Sticker" for the actual variable data */}
        <div className="px-2 py-1 bg-white border border-gray-100 rounded shadow-sm min-w-[70px]">
          <p className="text-[10px] font-bold text-gray-800 truncate max-w-[80px]">
            {data.check_flag || "Unset"}
          </p>
          <p
            className="text-[8px] font-black uppercase"
            style={{ color: accentColor }}
          >
            {data.operator || "=="} {String(data.value ?? "true")}
          </p>
        </div>
      </div>

      {/* 3. Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ backgroundColor: accentColor }}
        className="z-20 w-3 h-3 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        className="z-20 w-3 h-3 bg-green-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="z-20 w-3 h-3 bg-red-500 border-2 border-white"
      />
    </div>
  );
}
