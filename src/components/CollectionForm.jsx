import React, { memo } from "react";
import { useLoreStore } from "../store/index";
import { Info } from "lucide-react";

function CollectionForm({ node }) {
  const updateNodeData = useLoreStore((s) => s.updateNodeData);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Info size={16} />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Organizational Group
          </span>
        </div>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          Collections help you organize nodes into chapters, locations, or quest
          lines. Moving the collection moves all nodes inside.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">
          Collection Title
        </label>
        <input
          className="w-full p-2 border rounded text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
          value={node.data.title || ""}
          onChange={(e) =>
            updateNodeData(node.id, { ...node.data, title: e.target.value })
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">
          Internal Notes
        </label>
        <textarea
          placeholder="What happens in this chapter?..."
          className="w-full p-2 border rounded text-xs min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
          value={node.data.notes || ""}
          onChange={(e) =>
            updateNodeData(node.id, { ...node.data, notes: e.target.value })
          }
        />
      </div>
    </div>
  );
}

export default memo(CollectionForm)