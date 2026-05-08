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
import ChoiceEditor from "./ChoiceEditor";
import FlagGroup from "./FlagGroup";

export default function Inspector({ selectedNode }) {
  const { schema, updateNodeData, setEditingNode, deleteNode } = useLoreStore();

  // Determine which fields to show based on node type
  const fieldsToShow =
    selectedNode?.type === "logic" ? schema.logicFields : schema.nodeFields;

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
          {fieldsToShow.map((field) => {
            // ... your existing field mapping logic (sequence, flag_group, smartInput) ...
            // 3. Handle Branching Choices (The fix for [object Object])
            if (field.type === "choice_list") {
              return (
                <div key={field.id} className="space-y-1 pt-4 border-t">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {field.label}
                  </label>
                  <ChoiceEditor
                    value={selectedNode.data[field.id] || []}
                    onChange={(newChoices) => {
                      updateNodeData(selectedNode.id, {
                        ...selectedNode.data,
                        [field.id]: newChoices,
                      });
                    }}
                  />
                </div>
              );
            }

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

      {/* DANGER ZONE / DELETE BUTTON */}
      <div className="p-4 bg-red-50 border-t border-red-100 mt-auto">
        <button
          onClick={() => {
            if (
              confirm(
                "Are you sure you want to delete this node and all its connections?",
              )
            ) {
              deleteNode(selectedNode.id);
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
        >
          <Trash2 size={16} /> Delete Node
        </button>
      </div>
    </aside>
  );
}