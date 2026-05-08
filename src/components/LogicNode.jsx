import { Handle, Position } from "reactflow";
import { GitBranch } from "lucide-react";

export default function LogicNode({ data, selected }) {
  return (
    <div
      className={`w-32 h-32 flex items-center justify-center transition-all ${selected ? "scale-105" : ""}`}
    >
      {/* The Diamond Shape */}
      <div
        className={`absolute inset-0 rotate-45 rounded-sm border-2 bg-white transition-colors ${
          selected
            ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            : "border-orange-400 shadow-sm"
        }`}
      />

      {/* Content Area (Not Rotated) */}
      <div className="relative z-10 flex flex-col items-center text-center p-3">
        <div className="bg-orange-100 p-1.5 rounded-full mb-1">
          <GitBranch size={14} className="text-orange-600" />
        </div>
        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">
          IF Check
        </span>
        <div className="px-2 py-1 bg-gray-50 rounded border border-gray-100 min-w-[60px]">
          <p className="text-[10px] font-bold text-gray-800 truncate">
            {data.check_flag || "Unset"}
          </p>
          <p className="text-[8px] text-orange-600 font-black uppercase">
            {data.operator || "=="} {String(data.value ?? "true")}
          </p>
        </div>
      </div>

      {/* Handles - Positioned on the points of the diamond */}
      <Handle
        type="target"
        position={Position.Top}
        className="z-20 w-3 h-3 bg-orange-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        title="True Path"
        className="z-20 w-3 h-3 bg-green-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        title="False Path"
        className="z-20 w-3 h-3 bg-red-500 border-2 border-white"
      />
    </div>
  );
}
