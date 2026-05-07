import React from "react";
import {
  Plus,
  Trash2,
  MessageSquare,
  Flag,
  Info,
  Settings2,
  X
} from "lucide-react";
import { useLoreStore } from "../store";
import SmartInput from "./SmartInput";
import SequenceEditor from "./SequenceEditor";
import FlagGroup from "./FlagGroup";

export default function Inspector({ selectedNode }) {
  const { schema, updateNodeData, setEditingNode } = useLoreStore();

  return (
    <aside
      className={`fixed right-0 top-0 w-85 bg-white h-screen flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l z-50 transition-transform duration-300 ease-in-out ${
        selectedNode ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <header className="p-4 bg-gray-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest">
            Inspector
          </h2>
        </div>
        <button
          onClick={() => setEditingNode(null)}
          className="p-1 hover:bg-gray-800 rounded text-gray-400"
        >
          <X size={18} />
        </button>
      </header>

      {/* Only render form content if a node is actually selected to avoid errors */}
      {selectedNode && (
        <div className="p-4 flex-grow overflow-y-auto space-y-6">
          {schema.nodeFields.map((field) => {
            // ... your existing field mapping logic (sequence, flag_group, smartInput) ...

            if (field.type === "sequence") {
              return (
                <div key={field.id} className="pt-4 border-t h-[450px]">
                  <SequenceEditor
                    nodeId={selectedNode.id}
                    lines={selectedNode.data[field.id] || []}
                  />
                </div>
              );
            }

            if (field.type === "flag_group") {
              return (
                <div key={field.id} className="space-y-1 pt-4 border-t">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {field.label}
                  </label>
                  <FlagGroup
                    value={selectedNode.data[field.id] || []}
                    onChange={(newFlags) => {
                      const newData = {
                        ...selectedNode.data,
                        [field.id]: newFlags,
                      };
                      updateNodeData(selectedNode.id, newData);
                    }}
                  />
                </div>
              );
            }
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  {field.label}
                </label>
                <SmartInput
                  field={field}
                  value={selectedNode.data[field.id]}
                  onChange={(val) => {
                    const newData = { ...selectedNode.data, [field.id]: val };
                    updateNodeData(selectedNode.id, newData);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}