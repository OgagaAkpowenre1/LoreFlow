import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { useEffect } from "react";
import { MessageSquare, Flag } from "lucide-react";

export default function SceneNode({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const firstLine = data.dialogueLines?.[0] || {};
  const choices = data.choices || [];
  const flags = data.flags || []; // Get the flags array
  const accentColor = data.color || "#3b82f6";

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, choices.length, updateNodeInternals]);

  return (
    <div
      style={{
        borderColor: accentColor,
        boxShadow: selected
          ? `0 0 20px ${accentColor}44`
          : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      }}
      className="w-[260px] rounded-lg bg-white border-2 transition-all duration-300"
    >
      {/* TARGET HANDLE (TOP) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          backgroundColor: accentColor,
          width: "20px",
          height: "20px",
          top: 0,
          marginTop: "-10px",
        }}
        className="border-4 border-white shadow-md hover:scale-110 transition-transform"
      />

      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b rounded-t-md"
        style={{ backgroundColor: `${accentColor}08` }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} style={{ color: accentColor }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate max-w-[180px]">
            {data.title || "Scene Node"}
          </span>
        </div>
      </div>

      {/* Dialogue Preview */}
      <div className="p-4 bg-white">
        <p
          className="text-[10px] font-bold mb-1 uppercase truncate"
          style={{ color: accentColor }}
        >
          {firstLine.speaker || "No Dialogue Set"}
        </p>
        <p className="text-[11px] leading-snug text-gray-600 line-clamp-2 italic">
          {firstLine.text ? `"${firstLine.text}"` : "Add dialogue lines..."}
        </p>
      </div>

      {/* ── FLAG SECTION (Restored) ── */}
      {/* ── FLAG SECTION (Restored & Capped) ── */}
      {flags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {flags.slice(0, 2).map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 shadow-sm"
            >
              <Flag size={8} className="text-orange-500" fill="currentColor" />
              <span className="text-[8px] font-black uppercase text-gray-500">
                {f.key} {f.op || "="} {String(f.value)}
              </span>
            </div>
          ))}

          {/* Show counter if more than 3 exist */}
          {flags.length > 2 && (
            <div className="px-1.5 py-0.5 text-[7px] font-black text-gray-400 uppercase self-center">
              + {flags.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* CHOICE HANDLES (BOTTOM) */}
      <div className="h-4 bg-gray-100 border-t rounded-b-md relative">
        {choices.length > 0 ? (
          choices.map((choice, index) => (
            <Handle
              key={choice.id}
              type="source"
              position={Position.Bottom}
              id={choice.id}
              style={{
                left: `${((index + 1) / (choices.length + 1)) * 100}%`,
                background: accentColor,
                width: "20px",
                height: "20px",
                bottom: 0,
                marginBottom: "-10px",
                transform: "translateX(-50%)",
              }}
              className="border-4 border-white shadow-md hover:scale-110 transition-transform"
            />
          ))
        ) : (
          <Handle
            type="source"
            position={Position.Bottom}
            id="default-output"
            style={{
              background: "#9ca3af",
              width: "20px",
              height: "20px",
              bottom: 0,
              marginBottom: "-10px",
              transform: "translateX(-50%)",
            }}
            className="border-4 border-white shadow-md hover:scale-110 transition-transform"
          />
        )}
      </div>
    </div>
  );
}
