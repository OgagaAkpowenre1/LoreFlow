// import { Handle, Position } from "reactflow";
// import { GitBranch, AlertTriangle } from "lucide-react";

// export default function LogicNode({ data, selected }) {
//   const accentColor = data.color || "#f97316";
//   const conditions = data.conditions || [];

//   // Logic Preview Text
//   const previewText =
//     conditions.length > 0 ? conditions[0].check_flag || "Unset" : "No Logic";

//   return (
//     <div
//       className={`w-32 h-32 flex items-center justify-center transition-all ${selected ? "scale-105" : ""}`}
//     >
//       {/* 1. The Diamond Shape Background */}
//       <div
//         style={{
//           borderColor: accentColor,
//           backgroundColor: `${accentColor}15`,
//           boxShadow: selected
//             ? `0 0 25px ${accentColor}66`
//             : "0 2px 5px rgba(0,0,0,0.1)",
//         }}
//         className="absolute inset-0 rotate-45 rounded-sm border-2 transition-all duration-300"
//       />

//       {/* 2. Content Area */}
//       <div className="relative z-10 flex flex-col items-center text-center p-3 pointer-events-none">
//         <div
//           className="p-1.5 rounded-full mb-1 shadow-sm border border-white/50"
//           style={{ backgroundColor: `${accentColor}30` }}
//         >
//           <GitBranch size={14} style={{ color: accentColor }} />
//         </div>

//         <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1 leading-none">
//           {data.logicalOperator || "AND"} CHECK
//         </span>

//         {/* The "Sticker" for actual data */}
//         <div className="px-2 py-1 bg-white border border-gray-100 rounded shadow-sm min-w-[70px]">
//           <p className="text-[10px] font-bold text-gray-800 truncate max-w-[80px] leading-tight">
//             {previewText}
//           </p>
//           {conditions.length > 1 ? (
//             <p className="text-[8px] font-black text-gray-400 uppercase">
//               +{conditions.length - 1} more
//             </p>
//           ) : (
//             <p
//               className="text-[8px] font-black uppercase leading-none"
//               style={{ color: accentColor }}
//             >
//               {conditions[0]?.operator || "=="}{" "}
//               {String(conditions[0]?.value ?? "true")}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* 3. Handles - Recessed "Inside" the diamond points */}
//       <Handle
//         type="target"
//         position={Position.Top}
//         style={{
//           backgroundColor: accentColor,
//           width: "16px",
//           height: "16px",
//           top: "4px", // Recessed inside the tip
//         }}
//         className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
//       />
//       <Handle
//         type="source"
//         position={Position.Left}
//         id="true"
//         style={{
//           background: "#22c55e",
//           width: "16px",
//           height: "16px",
//           left: "4px", // Recessed inside the tip
//         }}
//         className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
//       />
//       <Handle
//         type="source"
//         position={Position.Right}
//         id="false"
//         style={{
//           background: "#ef4444",
//           width: "16px",
//           height: "16px",
//           right: "4px", // Recessed inside the tip
//         }}
//         className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
//       />
//     </div>
//   );
// }

import React from "react";
import { Handle, Position } from "reactflow";
import { GitBranch, AlertTriangle } from "lucide-react";
import { useLoreStore } from "../store"; // Pull global store connection

export default function LogicNode({ id, data, selected }) {
  // added 'id' parameter
  const accentColor = data.color || "#f97316";
  const conditions = data.conditions || [];

  // ── LAZY VALIDATION SENSOR LAYER (Bug #10 Fix) ──
  // Extract live edge state from active workspace canvas configuration
  const edges = useLoreStore(
    (state) => state.graphs[state.activeGraph]?.edges || [],
  );

  // Verify if both condition vectors are securely attached downstream
  const hasTrueBranch = edges.some(
    (e) => e.source === id && e.sourceHandle === "true",
  );
  const hasFalseBranch = edges.some(
    (e) => e.source === id && e.sourceHandle === "false",
  );
  const isIncomplete = !hasTrueBranch || !hasFalseBranch;

  // Logic Preview Text
  const previewText =
    conditions.length > 0 ? conditions[0].check_flag || "Unset" : "No Logic";

  return (
    <div
      className={`w-32 h-32 flex items-center justify-center relative transition-all ${selected ? "scale-105" : ""}`}
    >
      {/* 1. The Diamond Shape Background */}
      <div
        style={{
          // Dynamically shifts colors to warn developers of dangling flow maps
          borderColor: isIncomplete ? "#ef4444" : accentColor,
          backgroundColor: isIncomplete ? "#fff5f5" : `${accentColor}15`,
          boxShadow: selected
            ? `0 0 25px ${isIncomplete ? "#ef4444" : accentColor}66`
            : "0 2px 5px rgba(0,0,0,0.1)",
        }}
        className="absolute inset-0 rotate-45 rounded-sm border-2 transition-all duration-300"
      />

      {/* ── FLOATING ERROR INDICATOR BADGE ── */}
      {isIncomplete && (
        <div
          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-lg z-30 animate-pulse border border-white"
          title="Missing output connection! Ensure both TRUE and FALSE handles are wired to downstream nodes."
        >
          <AlertTriangle size={10} />
        </div>
      )}

      {/* 2. Content Area */}
      <div className="relative z-10 flex flex-col items-center text-center p-3 pointer-events-none">
        <div
          className="p-1.5 rounded-full mb-1 shadow-sm border border-white/50"
          style={{
            backgroundColor: isIncomplete ? "#fee2e2" : `${accentColor}30`,
          }}
        >
          <GitBranch
            size={14}
            style={{ color: isIncomplete ? "#ef4444" : accentColor }}
          />
        </div>

        <span
          className={`text-[9px] font-black uppercase tracking-widest mb-1 leading-none ${isIncomplete ? "text-red-500" : "text-gray-500"}`}
        >
          {data.logicalOperator || "AND"} CHECK
        </span>

        {/* The "Sticker" for actual data */}
        <div
          className={`px-2 py-1 bg-white border rounded shadow-sm min-w-[70px] ${isIncomplete ? "border-red-200" : "border-gray-100"}`}
        >
          <p className="text-[10px] font-bold text-gray-800 truncate max-w-[80px] leading-tight">
            {previewText}
          </p>
          {conditions.length > 1 ? (
            <p className="text-[8px] font-black text-gray-400 uppercase">
              +{conditions.length - 1} more
            </p>
          ) : (
            <p
              className="text-[8px] font-black uppercase leading-none"
              style={{ color: isIncomplete ? "#ef4444" : accentColor }}
            >
              {conditions[0]?.operator || "=="}{" "}
              {String(conditions[0]?.value ?? "true")}
            </p>
          )}
        </div>
      </div>

      {/* 3. Handles - Recessed "Inside" the diamond points */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          backgroundColor: isIncomplete ? "#ef4444" : accentColor,
          width: "16px",
          height: "16px",
          top: "4px",
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        style={{
          background: "#22c55e",
          width: "16px",
          height: "16px",
          left: "4px",
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{
          background: "#ef4444",
          width: "16px",
          height: "16px",
          right: "4px",
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
      />
    </div>
  );
}