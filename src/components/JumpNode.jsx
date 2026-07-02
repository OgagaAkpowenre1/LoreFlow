import { Handle, Position } from "reactflow";
import { MoveRight } from "lucide-react";

export default function JumpNode({ data, selected }) {
  return (
    <div
      className={`w-48 rounded-xl bg-gray-900 border-2 p-3 transition-all duration-300 ${
        selected
          ? "border-blue-500 scale-[1.03] ring-4 ring-blue-500/30 shadow-2xl shadow-blue-500/20"
          : "border-gray-700 shadow-md hover:shadow-xl hover:border-blue-400 hover:scale-[1.01]"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: "20px",
          height: "20px",
          top: 0,
          marginTop: "-10px",
        }}
        className="w-3 h-3 bg-blue-500 border-2 border-gray-900"
      />

      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-blue-500/20 rounded-lg">
          <MoveRight size={14} className="text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Jump To
          </p>
          <p className="text-[11px] font-bold text-white truncate">
            {data.targetGraph || "Select Graph..."}
          </p>
        </div>
      </div>
    </div>
  );
}
