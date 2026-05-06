import React, { useState } from "react";
import { useLoreStore } from "../store";
import SmartInput from "./SmartInput";
import {
  Plus,
  Trash2,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

export default function SequenceEditor({ nodeId, lines = [] }) {
  const { schema, updateNodeData } = useLoreStore();
  const [activeIndex, setActiveIndex] = useState(null);

  const updateLine = (index, fieldId, value) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [fieldId]: value };
    updateNodeData(nodeId, {
      ...useLoreStore.getState().nodes.find((n) => n.id === nodeId).data,
      dialogueLines: newLines,
    });
  };

  const addLine = () => {
    const newLine = schema.sequenceFields.reduce(
      (acc, field) => ({ ...acc, [field.id]: "" }),
      {},
    );
    const newLines = [...lines, newLine];
    updateNodeData(nodeId, {
      ...useLoreStore.getState().nodes.find((n) => n.id === nodeId).data,
      dialogueLines: newLines,
    });
    setActiveIndex(newLines.length - 1); // Auto-focus new line
  };

  const removeLine = (e, index) => {
    e.stopPropagation();
    const newLines = lines.filter((_, i) => i !== index);
    updateNodeData(nodeId, {
      ...useLoreStore.getState().nodes.find((n) => n.id === nodeId).data,
      dialogueLines: newLines,
    });
    if (activeIndex === index) setActiveIndex(null);
  };

  // DETAIL VIEW: The specific form for one line
  if (activeIndex !== null) {
    const currentLine = lines[activeIndex];
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-200">
        <button
          onClick={() => setActiveIndex(null)}
          className="flex items-center gap-2 p-3 text-blue-600 hover:bg-blue-50 border-b text-xs font-bold"
        >
          <ArrowLeft size={14} /> Back to Sequence
        </button>

        <div className="p-4 space-y-4 overflow-y-auto">
          {schema.sequenceFields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                {field.label}
              </label>
              <SmartInput
                field={field}
                value={currentLine[field.id]}
                onChange={(val) => updateLine(activeIndex, field.id, val)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MASTER VIEW: The scrollable list of boxes
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase">
          Dialogue List ({lines.length})
        </span>
        <button
          onClick={addLine}
          className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {lines.map((line, index) => (
          <div
            key={index}
            onClick={() => setActiveIndex(index)}
            className="group relative bg-gray-50 border border-gray-200 rounded-md p-3 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-blue-600 truncate max-w-[120px]">
                {line.speaker || "No Speaker"}
              </span>
              <button
                onClick={(e) => removeLine(e, index)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <p className="text-[11px] text-gray-600 line-clamp-2 italic">
              "{line.text || "..."}"
            </p>
            <ChevronRight
              size={14}
              className="absolute bottom-2 right-2 text-gray-300"
            />
          </div>
        ))}

        {lines.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <MessageSquare className="mx-auto text-gray-200 mb-2" size={32} />
            <p className="text-[10px] text-gray-400">
              No dialogue added to this scene.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
