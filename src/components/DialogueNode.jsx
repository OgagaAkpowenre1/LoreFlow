import { Handle, Position } from "reactflow";
import { MessageSquare, Settings2, Flag } from "lucide-react";

export default function DialogueNode({ data, selected }) {
  return (
    <div
      className={`min-w-[250px] shadow-xl rounded-lg bg-white border-2 transition-all ${selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}
    >
      {/* Input Handle (Where the previous choice comes from) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Dialogue Scene
          </span>
        </div>
        {data.actions?.length > 0 && (
          <Flag size={14} className="text-orange-500" />
        )}
      </div>

      {/* Node Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">
          {data.title || "Untitled Scene"}
        </h3>
        <p className="text-xs text-gray-500 italic mb-2">
          {data.speaker || "No Speaker"}
        </p>
        <p className="text-[10px] leading-relaxed text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded border border-dashed border-gray-200">
          {data.content || "Click to add dialogue..."}
        </p>
      </div>

      {/* Footer / Flags Preview */}
      <div className="px-4 py-2 bg-gray-50 border-t flex gap-2 overflow-hidden">
        {data.actions?.map((a, i) => (
          <span
            key={i}
            className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full border border-orange-200"
          >
            {a.flag}
          </span>
        ))}
      </div>

      {/* Output Handle (Where choices lead out) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}
