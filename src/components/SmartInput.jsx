import { useState } from "react";
import { useLoreStore } from "../store";
import { Plus, ChevronDown } from "lucide-react";

export default function SmartInput({ field, value, onChange }) {
  const { lists, addToList } = useLoreStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newValue, setNewValue] = useState("");

  // 1. Textarea Rendering
  if (field.type === "textarea") {
    return (
      <textarea
        className="w-full p-2 border rounded text-xs min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        className="w-full p-2 border rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  // 2. List / Dropdown with "Add New" Logic
  if (field.type === "list") {
    const options = lists[field.listId] || [];

    const handleAddNew = () => {
      if (newValue.trim()) {
        addToList(field.listId, newValue.trim());
        onChange(newValue.trim());
        setNewValue("");
        setIsAddingNew(false);
      }
    };

    return (
      <div className="space-y-1">
        {isAddingNew ? (
          <div className="flex gap-1">
            <input
              autoFocus
              className="flex-grow p-1 text-xs border rounded outline-none border-blue-500"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
              placeholder="New entry name..."
            />
            <button
              onClick={handleAddNew}
              className="bg-blue-500 text-white p-1 rounded"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              className="w-full p-2 pr-8 border rounded text-xs appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={value || ""}
              onChange={(e) => {
                if (e.target.value === "ADD_NEW_INTERNAL") {
                  setIsAddingNew(true);
                } else {
                  onChange(e.target.value);
                }
              }}
            >
              <option value="">-- Select {field.label} --</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option
                value="ADD_NEW_INTERNAL"
                className="text-blue-600 font-bold"
              >
                + Create New "{field.label}"
              </option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"
            />
          </div>
        )}
      </div>
    );
  }

  // 3. Default Text Input
  return (
    <input
      type="text"
      className="w-full p-2 border rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
