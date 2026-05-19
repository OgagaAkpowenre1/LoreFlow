import React from "react";
import { useLoreStore } from "../store";

export default function SwitchForm({ node }) {
  const { lists, listMetadata, updateNodeData } = useLoreStore();

  const stringVariables = Object.entries(lists)
    .filter(([id]) => listMetadata[id] === "variable")
    .flatMap(([_, vars]) => vars.filter((v) => v.type === "string"));

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-1">
        <label className="text-[10px] font-black text-purple-500 uppercase tracking-wider block">
          String Variable to Match
        </label>
        <select
          value={node.data?.check_flag || ""}
          onChange={(e) =>
            updateNodeData(node.id, {
              ...node.data,
              check_flag: e.target.value,
            })
          }
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-purple-400 cursor-pointer"
        >
          <option value="">Select an Enum Variable...</option>
          {stringVariables.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
        <p className="text-[9px] text-gray-400 mt-2 font-medium">
          This node automatically generates an output branch for every choice
          defined in the variable's setting matrix.
        </p>
      </div>
    </div>
  );
}
