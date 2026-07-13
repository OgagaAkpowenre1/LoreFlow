import {React, memo} from "react";
import { Handle, Position } from "reactflow";
import { useLoreStore } from "../store";
import { GitFork } from "lucide-react";

 function SwitchNode({ id, data, selected }) {
  const lists = useLoreStore((s) => s.lists);
  const listMetadata = useLoreStore((s) => s.listMetadata);

  const allVariables = Object.entries(lists)
    .filter(([key]) => listMetadata[key] === "variable")
    .flatMap(([_, items]) => items); 

  const targetVar = allVariables.find((v) => v.name === data.check_flag);
  const branches = targetVar?.allowedValues || [];

return (
  <div
    className={`bg-white rounded-xl border-2 transition-all duration-300 min-w-[160px] ${
      selected
        ? "border-purple-500 scale-[1.03] ring-4 ring-purple-500/30 shadow-2xl shadow-purple-500/20"
        : "border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-300 hover:scale-[1.01]"
    }`}
  >
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-gray-400 border-2 border-white"
    />

    <div className="bg-purple-50 rounded-t-xl px-3 py-2 flex items-center gap-2 border-b border-purple-100">
      <GitFork size={14} className="text-purple-600" />
      <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider">
        Switch
      </span>
    </div>

    <div className="p-3 text-center">
      <span className="text-xs font-black text-gray-700 bg-gray-100 px-2 py-1 rounded">
        {data.check_flag || "Unassigned"}
      </span>
    </div>

    <div className="flex flex-col gap-1 pb-3 px-2">
      {branches.map((branchText) => (
        <div
          key={branchText}
          className="relative h-6 flex items-center justify-end pr-2 bg-purple-50/50 rounded-md border border-purple-100"
        >
          <span className="text-[9px] font-bold text-purple-600 uppercase pr-2">
            {branchText}
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id={branchText}
            style={{ top: "50%", right: "-4px" }}
            className="w-2.5 h-2.5 bg-purple-500 border-2 border-white"
          />
        </div>
      ))}

      <div className="relative h-6 flex items-center justify-end pr-2 mt-1">
        <span className="text-[9px] font-bold text-gray-400 uppercase pr-2">
          Default / Else
        </span>
        <Handle
          type="source"
          position={Position.Right}
          id="default-output"
          style={{ top: "50%", right: "-4px" }}
          className="w-2.5 h-2.5 bg-gray-400 border-2 border-white"
        />
      </div>
    </div>
  </div>
);
}

export default memo(SwitchNode)