import { Handle, Position } from "reactflow";
import { MessageSquare, Flag } from "lucide-react";

export default function SceneNode({ data, selected }) {
  // Pull the first line from the sequence for the preview
  const firstLine = data.dialogueLines?.[0] || {};

  return (
    <div
      className={`w-[260px] shadow-xl rounded-lg bg-white border-2 transition-all overflow-hidden ${
        selected ? "border-blue-500 ring-4 ring-blue-500/20" : "border-gray-200"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {data.title || "Scene Node"}
          </span>
        </div>
        {data.flags?.length > 0 && (
          <Flag size={12} className="text-orange-500 fill-orange-500" />
        )}
      </div>

      {/* Content Preview: Pulling from the sequence */}
      <div className="p-4 bg-white">
        <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase truncate">
          {firstLine.speaker || "No Dialogue Set"}
        </p>
        <p className="text-[11px] leading-snug text-gray-600 line-clamp-2 italic">
          {firstLine.text
            ? `"${firstLine.text}"`
            : "Add dialogue lines in the inspector..."}
        </p>

        {data.dialogueLines?.length > 1 && (
          <div className="mt-2 text-[9px] text-gray-400 font-medium">
            + {data.dialogueLines.length - 1} more lines
          </div>
        )}
      </div>

      {/* Fixed-Height Flags Footer */}
      {data.flags?.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t flex gap-1 flex-wrap max-h-[60px] overflow-hidden">
          {data.flags.map((f, i) => (
            <span
              key={i}
              className="text-[8px] bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap"
            >
              {f.key}
            </span>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}