import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { useEffect } from "react";
import { MessageSquare, Flag } from "lucide-react";

export default function SceneNode({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const firstLine = data.dialogueLines?.[0] || {};
  const choices = data.choices || [];
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
          top: 0, // Align to top edge
          marginTop: "-10px", // Fine-tune centering on the border line
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
                bottom: 0, // Align to bottom edge
                marginBottom: "-10px", // Push half the handle outside the node
                transform: "translateX(-50%)", // Center horizontally
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