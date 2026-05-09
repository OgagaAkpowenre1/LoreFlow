import React, { useState } from "react";
import { useLoreStore } from "../store";
import { Plus, Minus, Equal, X } from "lucide-react";

export default function FlagGroup({ value = [], onChange }) {
  const { lists, addToList } = useLoreStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");

  const availableVars = lists.variables || [];

  const handleAddNewFlag = () => {
    if (newFlagName.trim()) {
      const newVar = { name: newFlagName.trim(), type: "boolean" };
      addToList("variables", newVar);
      // Default new flags to 'set' operator
      onChange([...value, { key: newVar.name, value: true, op: "=" }]);
      setNewFlagName("");
      setIsAddingNew(false);
    }
  };

  const updateFlag = (index, field, val) => {
    const updated = [...value];
    updated[index][field] = val;
    onChange(updated);
  };

  return (
    <div className="space-y-2 border p-3 rounded-lg bg-gray-50 border-gray-200">
      {value.map((flag, i) => {
        const varDef = availableVars.find((v) => v.name === flag.key);
        const isNumber = varDef?.type === "number";
        // Default to "=" if no operator exists in older data
        const currentOp = flag.op || "=";

        return (
          <div
            key={i}
            className="flex gap-1 items-center bg-white p-1 rounded border border-gray-100 shadow-sm"
          >
            {/* 1. Variable Selector */}
            <select
              className="text-[10px] p-1 flex-grow bg-transparent outline-none font-bold text-gray-700"
              value={flag.key}
              onChange={(e) => updateFlag(i, "key", e.target.value)}
            >
              {availableVars.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* 2. Operator Toggle (Numeric Only) */}
            {isNumber && (
              <div className="flex border rounded overflow-hidden bg-gray-50">
                {[
                  { id: "=", icon: <Equal size={10} /> },
                  { id: "+", icon: <Plus size={10} /> },
                  { id: "-", icon: <Minus size={10} /> },
                ].map((op) => (
                  <button
                    key={op.id}
                    onClick={() => updateFlag(i, "op", op.id)}
                    className={`p-1.5 transition-colors ${
                      currentOp === op.id
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {op.icon}
                  </button>
                ))}
              </div>
            )}

            {/* 3. Value Input */}
            {isNumber ? (
              <input
                type="number"
                className="text-[10px] border-l pl-2 w-14 bg-transparent outline-none font-black text-blue-600"
                value={flag.value ?? 0}
                onChange={(e) =>
                  updateFlag(i, "value", parseFloat(e.target.value) || 0)
                }
              />
            ) : (
              <select
                className="text-[10px] pl-2 bg-transparent outline-none font-bold text-blue-500"
                value={(flag.value ?? true).toString()}
                onChange={(e) =>
                  updateFlag(i, "value", e.target.value === "true")
                }
              >
                <option value="true">TRUE</option>
                <option value="false">FALSE</option>
              </select>
            )}

            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="p-1 text-gray-300 hover:text-red-500"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* Footer controls remain the same ... */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={() =>
            onChange([
              ...value,
              {
                key: availableVars[0]?.name || "new_flag",
                value: true,
                op: "=",
              },
            ])
          }
          className="text-[9px] text-blue-600 font-black uppercase hover:text-blue-800"
        >
          + Add Action
        </button>
        <button
          onClick={() => setIsAddingNew(true)}
          className="text-[9px] text-green-600 font-black uppercase hover:text-green-800"
        >
          + New Global
        </button>
      </div>

      {isAddingNew && (
        <div className="flex gap-1 mt-2">
          <input
            autoFocus
            className="flex-grow text-[10px] p-1 border rounded outline-none border-blue-400"
            placeholder="New flag name..."
            value={newFlagName}
            onChange={(e) => setNewFlagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNewFlag()}
          />
          <button
            onClick={handleAddNewFlag}
            className="bg-blue-500 text-white p-1 rounded"
          >
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
