import { Handle, Position } from "reactflow";
import { GitBranch } from "lucide-react";

export default function LogicNode({ data, selected }) {
  const accentColor = data.color || "#f97316";
  const conditions = data.conditions || [];

  // Logic Preview Text
  const previewText =
    conditions.length > 0 ? conditions[0].check_flag || "Unset" : "No Logic";

  return (
    <div
      className={`w-32 h-32 flex items-center justify-center transition-all ${selected ? "scale-105" : ""}`}
    >
      {/* 1. The Diamond Shape Background */}
      <div
        style={{
          borderColor: accentColor,
          backgroundColor: `${accentColor}15`,
          boxShadow: selected
            ? `0 0 25px ${accentColor}66`
            : "0 2px 5px rgba(0,0,0,0.1)",
        }}
        className="absolute inset-0 rotate-45 rounded-sm border-2 transition-all duration-300"
      />

      {/* 2. Content Area */}
      <div className="relative z-10 flex flex-col items-center text-center p-3 pointer-events-none">
        <div
          className="p-1.5 rounded-full mb-1 shadow-sm border border-white/50"
          style={{ backgroundColor: `${accentColor}30` }}
        >
          <GitBranch size={14} style={{ color: accentColor }} />
        </div>

        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1 leading-none">
          {data.logicalOperator || "AND"} CHECK
        </span>

        {/* The "Sticker" for actual data */}
        <div className="px-2 py-1 bg-white border border-gray-100 rounded shadow-sm min-w-[70px]">
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
              style={{ color: accentColor }}
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
          backgroundColor: accentColor,
          width: "16px",
          height: "16px",
          top: "4px", // Recessed inside the tip
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
          left: "4px", // Recessed inside the tip
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
          right: "4px", // Recessed inside the tip
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-110 transition-transform"
      />
    </div>
  );
}

// import { Handle, Position } from "reactflow";
// import { GitBranch, Plus } from "lucide-react";

// export default function LogicNode({ id, data, selected }) {
//   const accentColor = data.color || "#f97316";
//   const conditions = data.conditions || [];

//   return (
//     <div
//       className={`min-w-[160px] flex flex-col items-center transition-all ${selected ? "scale-105" : ""}`}
//     >
//       {/* Visual Diamond Background */}
//       <div
//         style={{
//           borderColor: accentColor,
//           backgroundColor: `${accentColor}15`,
//           transform: "rotate(45deg)",
//           width: "120px",
//           height: "120px",
//           position: "absolute",
//           top: 0,
//         }}
//         className="rounded-sm border-2 shadow-lg"
//       />

//       {/* Content Stack */}
//       <div className="relative z-10 flex flex-col items-center p-4 pt-8">
//         <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full mb-2 border border-orange-200">
//           <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">
//             {data.logicalOperator} Check ({conditions.length})
//           </span>
//         </div>

//         <div className="space-y-1">
//           {conditions.slice(0, 3).map((c, i) => (
//             <div
//               key={c.id}
//               className="bg-white px-2 py-1 rounded border shadow-sm text-[8px] font-bold text-gray-600 whitespace-nowrap"
//             >
//               {c.check_flag || "?"} {c.operator} {c.value}
//             </div>
//           ))}
//           {conditions.length > 3 && (
//             <div className="text-[8px] font-bold text-gray-400 text-center">
//               +{conditions.length - 3} more...
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Standard Logic Handles */}

//        <Handle
//         type="target"
//         position={Position.Top}
//         style={{
//           backgroundColor: accentColor,
//           width: "20px",
//           height: "20px",
//           top: "-10px", // Pull half up
//         }}
//         className="z-20 border-4 border-white shadow-md"
//       />
//       <Handle
//         type="source"
//         position={Position.Left}
//         id="true"
//         style={{
//           background: "#22c55e", // Green for True
//           width: "20px",
//           height: "20px",
//           left: "-10px", // Pull half left
//         }}
//         className="z-20 border-4 border-white shadow-md"
//       />
//       <Handle
//         type="source"
//         position={Position.Right}
//         id="false"
//         style={{
//           background: "#ef4444", // Red for False
//           width: "20px",
//           height: "20px",
//           right: "-10px", // Pull half right
//         }}
//         className="z-20 border-4 border-white shadow-md"
//       />

//     </div>
//   );
// }
