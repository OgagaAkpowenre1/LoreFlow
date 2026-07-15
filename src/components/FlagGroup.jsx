import React, { useState } from "react";
import { useLoreStore } from "../store/index";
import { Plus, Minus, Equal, X } from "lucide-react";

export default function FlagGroup({ value = [], onChange }) {
  const lists = useLoreStore((s) => s.lists);
  const addToList = useLoreStore((s) => s.addToList);
  const listMetadata = useLoreStore((s) => s.listMetadata);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");

  // 1. Discover all active global variable data collections
  const variableListIds = Object.keys(listMetadata || {}).filter(
    (key) => listMetadata[key] === "variable",
  );

  // 2. Flatten tracking records down to a clean flat array matrix
  const allAvailableVars = variableListIds.flatMap((key) => lists[key] || []);

  const handleAddNewFlag = () => {
    const cleanName = newFlagName.trim().toLowerCase().replace(/\s+/g, "_");
    if (cleanName) {
      // Check for structural naming conflicts before registering inline variables
      if (allAvailableVars.some((v) => v.name === cleanName)) {
        alert("A variable with this name already exists globally.");
        return;
      }

      const newVar = { name: cleanName, type: "boolean" };
      addToList("variables", newVar);
      onChange([...value, { key: newVar.name, value: true, op: "=" }]);
      setNewFlagName("");
      setIsAddingNew(false);
    }
  };

  // ── TYPE-SAFE RESET ENGINE: Recalibrates fallback values whenever a flag variable target flips ──
  const handleVariableChange = (index, varName) => {
    const varDef = allAvailableVars.find((v) => v.name === varName);
    let defaultVal = true;

    if (varDef?.type === "number") {
      defaultVal = 0;
    } else if (varDef?.type === "string") {
      // Strict fallback resolution chain: default -> first array choice -> blank literal token
      defaultVal = varDef.defaultValue ?? varDef.allowedValues?.[0] ?? "";
    }

    const updated = [...value];
    updated[index] = { key: varName, value: defaultVal, op: "=" };
    onChange(updated);
  };

  const updateFlag = (index, field, val) => {
    const updated = [...value];
    updated[index][field] = val;
    onChange(updated);
  };

  return (
    <div className="space-y-2 border p-3 rounded-lg bg-gray-50 border-gray-200">
      {value.map((flag, i) => {
        const varDef = allAvailableVars.find((v) => v.name === flag.key);
        const isNumber = varDef?.type === "number";
        const isString = varDef?.type === "string";
        const currentOp = flag.op || "=";

        return (
          <div
            key={i}
            className="flex gap-1 items-center bg-white p-1 rounded border border-gray-100 shadow-sm"
          >
            {/* Flag Variable Dropdown Picker */}
            <select
              className="text-[11px] p-1 flex-grow bg-transparent outline-none font-bold text-gray-700 cursor-pointer max-w-[140px] truncate"
              value={flag.key}
              onChange={(e) => handleVariableChange(i, e.target.value)}
            >
              {variableListIds.map((listKey) => (
                <optgroup key={listKey} label={listKey.toUpperCase()}>
                  {lists[listKey].map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Arithmetic Modification Handles for Numbers */}
            {isNumber && (
              <div className="flex border rounded overflow-hidden bg-gray-50 shrink-0">
                {[
                  { id: "=", icon: <Equal size={10} /> },
                  { id: "+", icon: <Plus size={10} /> },
                  { id: "-", icon: <Minus size={10} /> },
                ].map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => updateFlag(i, "op", op.id)}
                    className={`p-1.5 transition-colors ${currentOp === op.id ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-gray-200"}`}
                  >
                    {op.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Adaptive Value Modifiers with Strict Truncation Overflow Layout Controls */}
            <div className="min-w-[60px] flex-grow flex justify-end min-w-0">
              {isNumber ? (
                <input
                  type="number"
                  className="text-[10px] border-l pl-2 w-14 bg-transparent outline-none font-black text-blue-600"
                  value={flag.value ?? 0}
                  onChange={(e) =>
                    updateFlag(
                      i,
                      "value",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                />
              ) : isString ? (
                varDef?.allowedValues && varDef.allowedValues.length > 0 ? (
                  /* 🏆 DROPDOWN ENUM ACTION PICKER: Protects alternative scene assignments from typing breaks */
                  <select
                    className="text-[10px] pl-2 bg-transparent outline-none font-bold text-blue-500 max-w-[110px] truncate cursor-pointer"
                    value={
                      flag.value ??
                      varDef.defaultValue ??
                      varDef.allowedValues[0] ??
                      ""
                    }
                    onChange={(e) => updateFlag(i, "value", e.target.value)}
                  >
                    {varDef.allowedValues.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                ) : (
                  /* RAW BACKUP INPUT: Freeform layout if string requires unconstrained data keys */
                  <input
                    type="text"
                    placeholder="text..."
                    className="text-[10px] border-l pl-2 w-20 bg-transparent outline-none font-bold text-blue-500 truncate"
                    value={flag.value ?? ""}
                    onChange={(e) => updateFlag(i, "value", e.target.value)}
                  />
                )
              ) : (
                /* BOOLEAN ASSIGNMENT CHANNELS */
                <select
                  className="text-[10px] pl-2 bg-transparent outline-none font-bold text-blue-500 cursor-pointer"
                  value={
                    flag.value === false || flag.value === "false"
                      ? "false"
                      : "true"
                  }
                  onChange={(e) =>
                    updateFlag(i, "value", e.target.value === "true")
                  }
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              )}
            </div>

            {/* Drop Row Item Link Trigger */}
            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-1"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* ── FOOTER CONTROLS ── */}
      <div className="flex gap-3 pt-2 border-t border-gray-100 mt-2 select-none">
        <button
          type="button"
          onClick={() => {
            const firstVar = allAvailableVars[0];
            let initialVal = true;
            if (firstVar?.type === "number") initialVal = 0;
            if (firstVar?.type === "string") {
              initialVal =
                firstVar.defaultValue ?? firstVar.allowedValues?.[0] ?? "";
            }

            onChange([
              ...value,
              {
                key: firstVar?.name || "new_flag",
                value: initialVal,
                op: "=",
              },
            ]);
          }}
          className="text-[9px] text-blue-600 font-black uppercase hover:text-blue-800 transition-colors"
        >
          + Add Action
        </button>

        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="text-[9px] text-green-600 font-black uppercase hover:text-green-800 transition-colors"
        >
          + New Global
        </button>
      </div>

      {/* Inline Mini-Variable Generator */}
      {isAddingNew && (
        <div className="flex gap-1 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            autoFocus
            className="flex-grow text-[10px] p-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700 font-bold"
            placeholder="New flag name..."
            value={newFlagName}
            onChange={(e) => setNewFlagName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddNewFlag())
            }
          />
          <button
            type="button"
            onClick={handleAddNewFlag}
            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg flex items-center justify-center shadow-sm shrink-0 transition-colors"
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(false);
              setNewFlagName("");
            }}
            className="bg-gray-200 text-gray-600 p-1.5 rounded-lg flex items-center justify-center hover:bg-gray-300 shrink-0 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}