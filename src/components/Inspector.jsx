import React from "react";
import { Plus, Trash2, MessageSquare, Flag, Info, Settings2 } from "lucide-react";

export default function Inspector({ selectedNode, updateNodeData }) {
  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <Info className="text-gray-300 mb-2" size={48} />
        <p className="text-gray-500 text-sm">
          Select a scene on the map to edit its properties.
        </p>
      </div>
    );
  }

  const { data } = selectedNode;

  // Helper to update specific fields
  const handleChange = (field, value) => {
    updateNodeData(selectedNode.id, { ...data, [field]: value });
  };

  // Dialogue Line Helpers
  const updateLine = (index, text) => {
    const newLines = [...(data.lines || [])];
    newLines[index] = text;
    handleChange("lines", newLines);
  };

  const addLine = () => {
    handleChange("lines", [...(data.lines || []), ""]);
  };

  const removeLine = (index) => {
    const newLines = data.lines.filter((_, i) => i !== index);
    handleChange("lines", newLines);
  };

  return (
    <div className="w-80 border-l bg-white h-full overflow-y-auto shadow-2xl">
      <div className="p-4 border-b bg-gray-900 text-white flex items-center gap-2">
        <Settings2 size={18} />
        <h2 className="font-bold text-sm uppercase tracking-widest">
          Scene Inspector
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* SECTION: GENERAL INFO */}
        <section>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
            General Info
          </label>
          <input
            type="text"
            placeholder="Scene Title"
            className="w-full p-2 border rounded text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={data.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
          />
          <input
            type="text"
            placeholder="Speaker Name"
            className="w-full p-2 border rounded text-sm italic bg-gray-50"
            value={data.speaker || ""}
            onChange={(e) => handleChange("speaker", e.target.value)}
          />
        </section>

        {/* SECTION: DIALOGUE SEQUENCE */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              Dialogue Sequence
            </label>
            <button
              onClick={addLine}
              className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {(data.lines || []).map((line, index) => (
              <div key={index} className="group relative">
                <textarea
                  className="w-full p-2 pr-8 border rounded text-xs min-h-[60px] resize-none focus:border-blue-400 outline-none"
                  value={line}
                  onChange={(e) => updateLine(index, e.target.value)}
                  placeholder={`Line ${index + 1}...`}
                />
                <button
                  onClick={() => removeLine(index)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(!data.lines || data.lines.length === 0) && (
              <p className="text-[10px] text-gray-400 text-center py-4 border border-dashed rounded">
                No lines added yet.
              </p>
            )}
          </div>
        </section>

        {/* SECTION: GAME LOGIC / FLAGS */}
        <section>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
            Triggers & Flags
          </label>
          <div className="bg-orange-50 border border-orange-100 rounded p-3">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <Flag size={14} />
              <span className="text-[10px] font-bold">On Scene Start:</span>
            </div>
            {/* This could be expanded to a list of flag inputs later */}
            <p className="text-[9px] text-orange-600 italic">
              Global flags set here will be exported to the game engine.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
