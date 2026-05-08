import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ChoiceEditor({ value = [], onChange }) {
  const addChoice = () => {
    // Ensure we use a clean string for the ID
    const newChoice = {
      id: `choice-${crypto.randomUUID()}`,
      text: "New Choice",
    };
    onChange([...value, newChoice]);
  };

  const updateChoice = (index, text) => {
    const updated = [...value];
    updated[index].text = text;
    onChange(updated);
  };

  const removeChoice = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
      {value.map((choice, i) => (
        <div key={choice.id} className="flex gap-2 items-center">
          <div className="text-[9px] font-black text-blue-400 w-4">{i + 1}</div>
          <input
            className="flex-grow text-xs p-1.5 border rounded bg-white outline-none focus:border-blue-400"
            value={choice.text}
            onChange={(e) => updateChoice(i, e.target.value)}
          />
          <button
            onClick={() => removeChoice(i)}
            className="text-gray-300 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={addChoice}
        className="w-full py-1.5 border-2 border-dashed border-blue-200 text-blue-500 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors"
      >
        + Add Player Choice
      </button>
    </div>
  );
}
