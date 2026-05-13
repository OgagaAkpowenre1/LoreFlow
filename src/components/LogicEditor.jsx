// import { useLoreStore } from "../store";

// export default function LogicEditor({ nodeId, data }) {
//   const { lists, updateNodeData, listMetadata } = useLoreStore();

//   // Find all lists that are of type 'variable'
//   const variableLists = Object.keys(listMetadata).filter(
//     (key) => listMetadata[key] === "variable",
//   );

//   // This combines everything from 'variables', 'stats', etc., into one array for searching
//   const allVariables = variableLists.flatMap((key) => lists[key] || []);

//   // 3. Update the search logic to use the flat array
//   const selectedVar = allVariables.find((v) => v.name === data.check_flag);
//   const isNumeric = selectedVar?.type === "number";

//   const handleUpdate = (key, val) => {
//     updateNodeData(nodeId, { ...data, [key]: val });
//   };

//   const onFlagChange = (newFlag) => {
//     // 4. Also use the flat array here
//     const newVar = allVariables.find((v) => v.name === newFlag);
//     const newUpdates = { check_flag: newFlag };

//     if (newVar?.type === "boolean") {
//       if (!["==", "!="].includes(data.operator)) newUpdates.operator = "==";
//       if (data.value !== "true" && data.value !== "false")
//         newUpdates.value = "true";
//     } else if (newVar?.type === "number") {
//       if (isNaN(data.value)) newUpdates.value = 0;
//     }

//     updateNodeData(nodeId, { ...data, ...newUpdates });
//   };

//   return (
//     <div className="space-y-4 pt-4 border-t border-gray-100">
//       {/* 1. Target Variable Selection */}
//       <div className="space-y-1">
//         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
//           Target Variable
//         </label>
//         <select
//           className="w-full p-2 border rounded text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500"
//           value={data.check_flag || ""}
//           onChange={(e) => onFlagChange(e.target.value)}
//         >
//           <option value="" disabled>
//             Select variable...
//           </option>
//           {variableLists.map((listKey) => (
//             <optgroup key={listKey} label={listKey.toUpperCase()}>
//               {lists[listKey].map((v) => (
//                 <option key={v.name} value={v.name}>
//                   {v.name}
//                 </option>
//               ))}
//             </optgroup>
//           ))}
//         </select>
//       </div>

//       {/* Only show these if a valid variable is selected */}
//       {selectedVar && (
//         <div className="flex gap-2">
//           {/* 2. Operator */}
//           <div className="space-y-1 w-1/3">
//             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
//               Compare
//             </label>
//             <select
//               className="w-full p-2 border rounded text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500"
//               value={data.operator || "=="}
//               onChange={(e) => handleUpdate("operator", e.target.value)}
//             >
//               <option value="==">==</option>
//               <option value="!=">!=</option>
//               {isNumeric && (
//                 <>
//                   <option value=">">&gt;</option>
//                   <option value="<">&lt;</option>
//                   <option value=">=">&gt;=</option>
//                   <option value="<=">&lt;=</option>
//                 </>
//               )}
//             </select>
//           </div>

//           {/* 3. Value Input */}
//           <div className="space-y-1 w-2/3">
//             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
//               Value
//             </label>
//             {isNumeric ? (
//               <input
//                 type="number"
//                 className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
//                 value={data.value !== undefined ? data.value : 0}
//                 onChange={(e) =>
//                   handleUpdate("value", parseFloat(e.target.value) || 0)
//                 }
//               />
//             ) : (
//               <select
//                 className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
//                 value={data.value || "true"}
//                 onChange={(e) => handleUpdate("value", e.target.value)}
//               >
//                 <option value="true">TRUE</option>
//                 <option value="false">FALSE</option>
//               </select>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useLoreStore } from "../store";
import { Plus, Trash2 } from "lucide-react";

export default function LogicEditor({ nodeId, data }) {
  const {
    lists,
    updateNodeData,
    listMetadata,
    addConditionToLogic,
    removeConditionFromLogic,
  } = useLoreStore();

  const variableLists = Object.keys(listMetadata).filter(
    (key) => listMetadata[key] === "variable",
  );
  const allVariables = variableLists.flatMap((key) => lists[key] || []);
  const conditions = data.conditions || [];

  // Helper to update a specific condition in the array
  const updateCondition = (conditionId, updates) => {
    const newConditions = conditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c,
    );
    updateNodeData(nodeId, { ...data, conditions: newConditions });
  };

  return (
    <div className="space-y-6">
      {conditions.map((cond, index) => {
        const selectedVar = allVariables.find(
          (v) => v.name === cond.check_flag,
        );
        const isNumeric = selectedVar?.type === "number";

        return (
          <div
            key={cond.id}
            className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative group animate-in fade-in slide-in-from-top-2"
          >
            {/* Header with Index and Delete */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Condition #{index + 1}
              </span>
              {conditions.length > 1 && (
                <button
                  onClick={() => removeConditionFromLogic(nodeId, cond.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* 1. Variable Selection */}
            <div className="space-y-3">
              <div className="space-y-1">
                <select
                  className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
                  value={cond.check_flag || ""}
                  onChange={(e) =>
                    updateCondition(cond.id, { check_flag: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select variable...
                  </option>
                  {variableLists.map((listKey) => (
                    <optgroup key={listKey} label={listKey.toUpperCase()}>
                      {lists[listKey].map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* 2. Operator & Value */}
              {selectedVar && (
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <select
                      className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={cond.operator || "=="}
                      onChange={(e) =>
                        updateCondition(cond.id, { operator: e.target.value })
                      }
                    >
                      <option value="==">==</option>
                      <option value="!=">!=</option>
                      {isNumeric && (
                        <>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value=">=">&gt;=</option>
                          <option value="<=">&lt;=</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="w-2/3">
                    {isNumeric ? (
                      <input
                        type="number"
                        className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        value={cond.value ?? 0}
                        onChange={(e) =>
                          updateCondition(cond.id, {
                            value: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      <select
                        className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        value={cond.value || "true"}
                        onChange={(e) =>
                          updateCondition(cond.id, { value: e.target.value })
                        }
                      >
                        <option value="true">TRUE</option>
                        <option value="false">FALSE</option>
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Condition Button */}
      <button
        onClick={() => addConditionToLogic(nodeId)}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Add Condition
      </button>
    </div>
  );
}