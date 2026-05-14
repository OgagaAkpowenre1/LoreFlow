import { Handle, Position } from "reactflow";
import { MoveRight } from "lucide-react";

export default function JumpNode({ data, selected }) {
  return (
    <div
      className={`w-48 rounded-xl bg-gray-900 border-2 transition-all p-3 ${selected ? "border-blue-500 shadow-lg" : "border-gray-700"}`}
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
