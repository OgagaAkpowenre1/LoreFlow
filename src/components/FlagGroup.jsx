// import React, { useState } from "react";
// import { useLoreStore } from "../store";
// import { Plus, Minus, Equal, X } from "lucide-react";

// export default function FlagGroup({ value = [], onChange }) {
//   const { lists, addToList, listMetadata } = useLoreStore();
//   const [isAddingNew, setIsAddingNew] = useState(false);
//   const [newFlagName, setNewFlagName] = useState("");

//   const variableListIds = Object.keys(listMetadata || {}).filter(
//     (key) => listMetadata[key] === "variable",
//   );

//   const allAvailableVars = variableListIds.flatMap((key) => lists[key] || []);

//   const handleVariableChange = (index, varName) => {
//     const varDef = allAvailableVars.find((v) => v.name === varName);
//     let defaultVal = true;
//     if (varDef?.type === "number") defaultVal = 0;
//     if (varDef?.type === "string") defaultVal = "";

//     const updated = [...value];
//     updated[index] = { key: varName, value: defaultVal, op: "=" };
//     onChange(updated);
//   };

//   const updateFlag = (index, field, val) => {
//     const updated = [...value];
//     updated[index][field] = val;
//     onChange(updated);
//   };

//   return (
//     <div className="space-y-2 border p-3 rounded-lg bg-gray-50 border-gray-200">
//       {value.map((flag, i) => {
//         const varDef = allAvailableVars.find((v) => v.name === flag.key);
//         const isNumber = varDef?.type === "number";
//         const isString = varDef?.type === "string";
//         const currentOp = flag.op || "=";

//         return (
//           <div
//             key={i}
//             className="flex gap-1 items-center bg-white p-1 rounded border border-gray-100 shadow-sm"
//           >
//             <select
//               className="text-[11px] p-1 flex-grow bg-transparent outline-none font-bold text-gray-700"
//               value={flag.key}
//               onChange={(e) => handleVariableChange(i, e.target.value)}
//             >
//               {variableListIds.map((listKey) => (
//                 <optgroup key={listKey} label={listKey.toUpperCase()}>
//                   {lists[listKey].map((v) => (
//                     <option key={v.name} value={v.name}>
//                       {v.name}
//                     </option>
//                   ))}
//                 </optgroup>
//               ))}
//             </select>

//             {isNumber && (
//               <div className="flex border rounded overflow-hidden bg-gray-50">
//                 {[
//                   { id: "=", icon: <Equal size={10} /> },
//                   { id: "+", icon: <Plus size={10} /> },
//                   { id: "-", icon: <Minus size={10} /> },
//                 ].map((op) => (
//                   <button
//                     key={op.id}
//                     onClick={() => updateFlag(i, "op", op.id)}
//                     className={`p-1.5 transition-colors ${currentOp === op.id ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-gray-200"}`}
//                   >
//                     {op.icon}
//                   </button>
//                 ))}
//               </div>
//             )}

//             <div className="min-w-[60px] flex justify-end">
//               {isNumber ? (
//                 <input
//                   type="number"
//                   className="text-[10px] border-l pl-2 w-14 bg-transparent outline-none font-black text-blue-600"
//                   value={flag.value ?? 0}
//                   onChange={(e) =>
//                     updateFlag(i, "value", parseFloat(e.target.value) || 0)
//                   }
//                 />
//               ) : isString ? (
//                 <input
//                   type="text"
//                   placeholder="text..."
//                   className="text-[10px] border-l pl-2 w-20 bg-transparent outline-none font-bold text-blue-500"
//                   value={flag.value ?? ""}
//                   onChange={(e) => updateFlag(i, "value", e.target.value)}
//                 />
//               ) : (
//                 <select
//                   className="text-[10px] pl-2 bg-transparent outline-none font-bold text-blue-500"
//                   value={(flag.value ?? true).toString()}
//                   onChange={(e) =>
//                     updateFlag(i, "value", e.target.value === "true")
//                   }
//                 >
//                   <option value="true">TRUE</option>
//                   <option value="false">FALSE</option>
//                 </select>
//               )}
//             </div>

//             <button
//               onClick={() => onChange(value.filter((_, idx) => idx !== i))}
//               className="p-1 text-gray-300 hover:text-red-500"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         );
//       })}

//       <div className="flex gap-3 pt-1">
//         <button
//           onClick={() =>
//             onChange([
//               ...value,
//               {
//                 key: allAvailableVars[0]?.name || "new_flag",
//                 value: true,
//                 op: "=",
//               },
//             ])
//           }
//           className="text-[9px] text-blue-600 font-black uppercase hover:text-blue-800"
//         >
//           + Add Action
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useLoreStore } from "../store";
import { Plus, Minus, Equal, X } from "lucide-react";

export default function FlagGroup({ value = [], onChange }) {
  const { lists, addToList, listMetadata } = useLoreStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFlagName, setNewFlagName] = useState("");

  // 1. Get the list of IDs for all variable-type containers
  const variableListIds = Object.keys(listMetadata || {}).filter(
    (key) => listMetadata[key] === "variable",
  );

  // 2. Flatten all variables into one array for easy lookup
  const allAvailableVars = variableListIds.flatMap((key) => lists[key] || []);

  const handleAddNewFlag = () => {
    if (newFlagName.trim()) {
      const newVar = { name: newFlagName.trim(), type: "boolean" };
      // Default new flags created inline go into the primary global "variables" list
      addToList("variables", newVar);
      onChange([...value, { key: newVar.name, value: true, op: "=" }]);
      setNewFlagName("");
      setIsAddingNew(false);
    }
  };

  const handleVariableChange = (index, varName) => {
    const varDef = allAvailableVars.find((v) => v.name === varName);
    let defaultVal = true;
    if (varDef?.type === "number") defaultVal = 0;
    if (varDef?.type === "string") defaultVal = "";

    const updated = [...value];
    updated[index] = { key: varName, value: defaultVal, op: "=" };
    onChange(updated);
  };

  const updateFlag = (index, field, val) => {
    const updated = [...value];
    updated[index][field] = val;
    onChange(updated);
  };

  return (
    <div className="space-y-2 border p-3 rounded-lg bg-gray-50 border-gray-200">
      {value.map((flag, i) => {
        const varDef = allAvailableVars.find((v) => v.name === flag.key);
        const isNumber = varDef?.type === "number";
        const isString = varDef?.type === "string";
        const currentOp = flag.op || "=";

        return (
          <div
            key={i}
            className="flex gap-1 items-center bg-white p-1 rounded border border-gray-100 shadow-sm"
          >
            <select
              className="text-[11px] p-1 flex-grow bg-transparent outline-none font-bold text-gray-700"
              value={flag.key}
              onChange={(e) => handleVariableChange(i, e.target.value)}
            >
              {variableListIds.map((listKey) => (
                <optgroup key={listKey} label={listKey.toUpperCase()}>
                  {lists[listKey].map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {isNumber && (
              <div className="flex border rounded overflow-hidden bg-gray-50">
                {[
                  { id: "=", icon: <Equal size={10} /> },
                  { id: "+", icon: <Plus size={10} /> },
                  { id: "-", icon: <Minus size={10} /> },
                ].map((op) => (
                  <button
                    key={op.id}
                    onClick={() => updateFlag(i, "op", op.id)}
                    className={`p-1.5 transition-colors ${currentOp === op.id ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-gray-200"}`}
                  >
                    {op.icon}
                  </button>
                ))}
              </div>
            )}

            <div className="min-w-[60px] flex justify-end">
              {isNumber ? (
                <input
                  type="number"
                  className="text-[10px] border-l pl-2 w-14 bg-transparent outline-none font-black text-blue-600"
                  value={flag.value ?? 0}
                  onChange={(e) =>
                    updateFlag(i, "value", parseFloat(e.target.value) || 0)
                  }
                />
              ) : isString ? (
                <input
                  type="text"
                  placeholder="text..."
                  className="text-[10px] border-l pl-2 w-20 bg-transparent outline-none font-bold text-blue-500"
                  value={flag.value ?? ""}
                  onChange={(e) => updateFlag(i, "value", e.target.value)}
                />
              ) : (
                <select
                  className="text-[10px] pl-2 bg-transparent outline-none font-bold text-blue-500"
                  value={(flag.value ?? true).toString()}
                  onChange={(e) =>
                    updateFlag(i, "value", e.target.value === "true")
                  }
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              )}
            </div>

            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="p-1 text-gray-300 hover:text-red-500"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* ── FOOTER CONTROLS ── */}
      <div className="flex gap-3 pt-1 border-t border-gray-100 mt-2">
        <button
          onClick={() =>
            onChange([
              ...value,
              {
                key: allAvailableVars[0]?.name || "new_flag",
                value: true,
                op: "=",
              },
            ])
          }
          className="text-[9px] text-blue-600 font-black uppercase hover:text-blue-800"
        >
          + Add Action
        </button>

        {/* RESTORED BUTTON */}
        <button
          onClick={() => setIsAddingNew(true)}
          className="text-[9px] text-green-600 font-black uppercase hover:text-green-800"
        >
          + New Global
        </button>
      </div>

      {/* RESTORED INLINE FORM */}
      {isAddingNew && (
        <div className="flex gap-1 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            autoFocus
            className="flex-grow text-[10px] p-1.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 font-bold"
            placeholder="New flag name..."
            value={newFlagName}
            onChange={(e) => setNewFlagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNewFlag()}
          />
          <button
            onClick={handleAddNewFlag}
            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg flex items-center justify-center shadow-sm shrink-0"
          >
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}