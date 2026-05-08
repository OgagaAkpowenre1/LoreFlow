import { Handle, Position } from "reactflow";
import { MessageSquare, Flag } from "lucide-react";

export default function SceneNode({ data, selected }) {
  const firstLine = data.dialogueLines?.[0] || {};
  const choices = data.choices || [];

  return (
    <div
      className={`w-[260px] shadow-xl rounded-lg bg-white border-2 transition-all ${
        selected ? "border-blue-500 ring-4 ring-blue-500/20" : "border-gray-200"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-md">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate max-w-[180px]">
            {data.title || "Scene Node"}
          </span>
        </div>
        {data.flags?.length > 0 && (
          <Flag size={12} className="text-orange-500 fill-orange-500" />
        )}
      </div>

      {/* Content Preview */}
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

      {/* Flags Section */}
      {data.flags?.length > 0 && (
        <div className="px-3 py-2 bg-gray-50/50 border-t flex gap-1 flex-wrap overflow-hidden max-h-[50px]">
          {data.flags.map((f, i) => (
            <span
              key={i}
              className="text-[8px] bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-100"
            >
              {f.key}
            </span>
          ))}
        </div>
      )}

      {/* Choice Handles Footer */}
      <div className="h-4 bg-gray-100 border-t rounded-b-md relative">
        {choices.length > 0 ? (
          choices.map((choice, index) => (
            <Handle
              key={choice.id}
              type="source"
              position={Position.Bottom}
              id={choice.id}
              style={{
                left: `${(index + 1) * (100 / (choices.length + 1))}%`,
                background: "#2563eb", // Blue-600
              }}
              className="w-3 h-3 border-2 border-white hover:scale-125 transition-transform"
            />
          ))
        ) : (
          /* Default handle for linear progression */
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: "#9ca3af" }} // Gray-400
            className="w-3 h-3 border-2 border-white hover:scale-125 transition-transform"
          />
        )}
      </div>
    </div>
  );
}
