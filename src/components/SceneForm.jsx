import React from "react";
import SmartInput from "./SmartInput";
import SequenceEditor from "./SequenceEditor";
import ChoiceEditor from "./ChoiceEditor";
import FlagGroup from "./FlagGroup";
import { useLoreStore } from "../store";

export default function SceneForm({ node }) {
  const { schema, updateNodeData } = useLoreStore(); 

  return (
    <div className="space-y-6">
      {schema.nodeFields.map((field) => {
        const value = node.data[field.id];

        const onChange = (newVal) => {
          updateNodeData(node.id, { ...node.data, [field.id]: newVal });
        };

        if (field.type === "sequence") {
          return (
            <div key={field.id} className="pt-4 border-t h-[450px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-tighter">
                {field.label}
              </label>
              <SequenceEditor nodeId={node.id} lines={value || []} />
            </div>
          );
        }

        if (field.type === "choice_list") {
          return (
            <div key={field.id} className="space-y-1 pt-4 border-t">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block mb-2">
                {field.label}
              </label>
              <ChoiceEditor value={value || []} onChange={onChange} />
            </div>
          );
        }

        if (field.type === "flag_group") {
          return (
            <div key={field.id} className="space-y-1 pt-4 border-t">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block mb-2">
                {field.label}
              </label>
              <FlagGroup value={value || []} onChange={onChange} />
            </div>
          );
        }

        return (
          <div key={field.id} className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              {field.label}
            </label>
            <SmartInput field={field} value={value} onChange={onChange} />
          </div>
        );
      })}
    </div>
  );
}
