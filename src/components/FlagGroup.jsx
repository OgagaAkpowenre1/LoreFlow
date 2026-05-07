import React, { useState } from "react";
import { useLoreStore } from "../store";
import { Plus, X } from "lucide-react";

export default function FlagGroup({ value = [], onChange }) {
  const { lists, addToList } = useLoreStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");

  const handleAddNewFlag = () => {
    if (newFlagName.trim()) {
      addToList("available_flags", newFlagName.trim());
      // Add this new flag to the current node immediately
      onChange([...value, { key: newFlagName.trim(), value: true }]);
      setNewFlagName("");
      setIsAddingNew(false);
    }
  };

  const removeFlag = (index) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateFlag = (index, field, val) => {
    const updated = [...value];
    updated[index][field] = val;
    onChange(updated);
  };

  return (
    <div className="space-y-2 border p-3 rounded-lg bg-gray-50 border-gray-200">
      {value.map((flag, i) => (
        <div key={i} className="flex gap-1 items-center">
          <select
            className="text-[10px] border rounded p-1 flex-grow bg-white outline-none focus:border-blue-400"
            value={flag.key}
            onChange={(e) => updateFlag(i, "key", e.target.value)}
          >
            {lists.available_flags.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* <select
            className="text-[10px] border rounded p-1 bg-white outline-none"
            value={flag.value.toString()} // Cast to string for the select
            onChange={(e) => updateFlag(i, "value", e.target.value === "true")}
          >
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select> */}

          <select
            className="text-[10px] border rounded p-1 bg-white outline-none"
            /* Added ?? true to prevent the toString() crash */
            value={(flag.value ?? true).toString()}
            onChange={(e) => updateFlag(i, "value", e.target.value === "true")}
          >
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>

          <button
            onClick={() => removeFlag(i)}
            className="text-gray-400 hover:text-red-500"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {isAddingNew ? (
        <div className="flex gap-1 mt-2">
          <input
            autoFocus
            className="flex-grow text-[10px] p-1 border rounded outline-none border-blue-400"
            placeholder="Flag name..."
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
      ) : (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() =>
              onChange([
                ...value,
                { key: lists.available_flags[0] || "new_flag", value: true },
              ])
            }
            className="text-[10px] text-blue-600 font-bold hover:underline"
          >
            + Add Existing
          </button>
          <button
            onClick={() => setIsAddingNew(true)}
            className="text-[10px] text-green-600 font-bold hover:underline"
          >
            + Create New Flag
          </button>
        </div>
      )}
    </div>
  );
}
