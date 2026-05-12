import { Handle, Position } from "reactflow";
import { GitBranch } from "lucide-react";

export default function LogicNode({ data, selected }) {
  const accentColor = data.color || "#f97316";

  return (
    <div
      className={`w-32 h-32 flex items-center justify-center transition-all ${selected ? "scale-105" : ""}`}
    >
      {/* 1. The Diamond Shape */}
      <div
        style={{
          borderColor: accentColor,
          backgroundColor: `${accentColor}15`,
          boxShadow: selected
            ? `0 0 25px ${accentColor}66`
            : "0 2px 5px rgba(0,0,0,0.1)",
        }}
        className="absolute inset-0 rotate-45 rounded-sm border-2 transition-all duration-300"
      />

      {/* 2. Content Area */}
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

      {/* 3. Handles - Centered exactly on the points */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          backgroundColor: accentColor,
          width: "20px",
          height: "20px",
          top: "-10px", // Pull half up
        }}
        className="z-20 border-4 border-white shadow-md"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        style={{
          background: "#22c55e", // Green for True
          width: "20px",
          height: "20px",
          left: "-10px", // Pull half left
        }}
        className="z-20 border-4 border-white shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{
          background: "#ef4444", // Red for False
          width: "20px",
          height: "20px",
          right: "-10px", // Pull half right
        }}
        className="z-20 border-4 border-white shadow-md"
      />
    </div>
  );
}
