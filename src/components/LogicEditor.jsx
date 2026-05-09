import React from "react";
import { useLoreStore } from "../store";

export default function LogicEditor({ nodeId, data }) {
  const { lists, updateNodeData } = useLoreStore();
  const variables = lists.variables || [];

  // Find the currently selected variable to determine its type
  const selectedVar = variables.find((v) => v.name === data.check_flag);
  const isNumeric = selectedVar?.type === "number";

  const handleUpdate = (key, val) => {
    updateNodeData(nodeId, { ...data, [key]: val });
  };

  // When changing the variable, safely reset operators/values if the type changes
  const onFlagChange = (newFlag) => {
    const newVar = variables.find((v) => v.name === newFlag);
    const newUpdates = { check_flag: newFlag };

    if (newVar?.type === "boolean") {
      // Force boolean-safe operators and values
      if (!["==", "!="].includes(data.operator)) newUpdates.operator = "==";
      if (data.value !== "true" && data.value !== "false")
        newUpdates.value = "true";
    } else if (newVar?.type === "number") {
      // Force numeric value
      if (isNaN(data.value)) newUpdates.value = 0;
    }

    updateNodeData(nodeId, { ...data, ...newUpdates });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      {/* 1. Target Variable Selection */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          Target Variable
        </label>
        <select
          className="w-full p-2 border rounded text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500"
          value={data.check_flag || ""}
          onChange={(e) => onFlagChange(e.target.value)}
        >
          <option value="" disabled>
            Select variable...
          </option>
          {variables.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.type})
            </option>
          ))}
        </select>
      </div>

      {/* Only show these if a valid variable is selected */}
      {selectedVar && (
        <div className="flex gap-2">
          {/* 2. Operator */}
          <div className="space-y-1 w-1/3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              Compare
            </label>
            <select
              className="w-full p-2 border rounded text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500"
              value={data.operator || "=="}
              onChange={(e) => handleUpdate("operator", e.target.value)}
            >
              <option value="==">==</option>
              <option value="!=">!=</option>
              {isNumeric && (
                <>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                </>
              )}
            </select>
          </div>

          {/* 3. Value Input */}
          <div className="space-y-1 w-2/3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              Value
            </label>
            {isNumeric ? (
              <input
                type="number"
                className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
                value={data.value !== undefined ? data.value : 0}
                onChange={(e) =>
                  handleUpdate("value", parseFloat(e.target.value) || 0)
                }
              />
            ) : (
              <select
                className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
                value={data.value || "true"}
                onChange={(e) => handleUpdate("value", e.target.value)}
              >
                <option value="true">TRUE</option>
                <option value="false">FALSE</option>
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
