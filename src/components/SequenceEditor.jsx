// import React, { useState } from "react";
// import { useLoreStore } from "../store";
// import SmartInput from "./SmartInput";
// import {
//   Plus,
//   Trash2,
//   ChevronRight,
//   MessageSquare,
//   ArrowLeft,
// } from "lucide-react";

// export default function SequenceEditor({ nodeId, lines = [] }) {
//   const { schema, updateNodeData } = useLoreStore();
//   const [activeIndex, setActiveIndex] = useState(null);

//   const updateLine = (index, fieldId, value) => {
//     const { activeGraph, graphs } = useLoreStore.getState();
//     const node = graphs[activeGraph].nodes.find((n) => n.id === nodeId);
//     if (!node) return;
//     const newLines = [...lines];
//     newLines[index] = { ...newLines[index], [fieldId]: value };
//     updateNodeData(nodeId, {
//       ...node.data,
//       dialogueLines: newLines,
//     });
//   };

//   const addLine = () => {
//     const { activeGraph, graphs, updateNodeData } = useLoreStore.getState();
//     const node = graphs[activeGraph].nodes.find((n) => n.id === nodeId);

//     if (!node) return;

//     const newLine = {
//       id: crypto.randomUUID(),
//       speaker: "",
//       text: "",
//       portrait: "",
//       sound: "",
//     };

//     updateNodeData(nodeId, {
//       ...node.data,
//       dialogueLines: [...(node.data.dialogueLines || []), newLine],
//     });
//   };

//   const removeLine = (e, index) => {
//     e.stopPropagation();
//     const { activeGraph, graphs } = useLoreStore.getState();
//     const node = graphs[activeGraph].nodes.find((n) => n.id === nodeId);
//     if (!node) return;
//     const newLines = lines.filter((_, i) => i !== index);
//     updateNodeData(nodeId, {
//       ...node.data,
//       dialogueLines: newLines,
//     });
//     if (activeIndex === index) setActiveIndex(null);
//   };

//   // DETAIL VIEW: The specific form for one line
//   if (activeIndex !== null) {
//     const currentLine = lines[activeIndex];

//     // SAFETY CHECK: If the store hasn't caught up with the index yet, show a loader or return null
//     if (!currentLine) {
//       return (
//         <div className="p-4 text-xs text-gray-400">Loading line data...</div>
//       );
//     }

//     return (
//       <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-200">
//         <button
//           onClick={() => setActiveIndex(null)}
//           className="flex items-center gap-2 p-3 text-blue-600 hover:bg-blue-50 border-b text-xs font-bold"
//         >
//           <ArrowLeft size={14} /> Back to Sequence
//         </button>

//         <div className="p-4 space-y-4 overflow-y-auto">
//           {schema.sequenceFields.map((field) => (
//             <div key={field.id} className="space-y-1">
//               <label className="text-[10px] font-bold text-gray-400 uppercase">
//                 {field.label}
//               </label>
//               <SmartInput
//                 field={field}
//                 value={currentLine[field.id] || ""}
//                 onChange={(val) => updateLine(activeIndex, field.id, val)}
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // MASTER VIEW: The scrollable list of boxes
//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex justify-between items-center p-2 mb-2">
//         <span className="text-[10px] font-bold text-gray-400 uppercase">
//           Dialogue List ({lines.length})
//         </span>
//         <button
//           onClick={addLine}
//           className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors"
//         >
//           <Plus size={16} />
//         </button>
//       </div>

//       <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
//         {lines.map((line, index) => (
//           <div
//             key={index}
//             onClick={() => setActiveIndex(index)}
//             className="group relative bg-gray-50 border border-gray-200 rounded-md p-3 pl-12 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all min-h-[60px]"
//           >
//             {/* LINE NUMBER BADGE - Fixed in a gutter */}
//             <div className="absolute left-0 top-0 bottom-0 w-8 bg-gray-100 border-r flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
//               {String(index + 1).padStart(2, "0")}
//             </div>

//             {/* CONTENT - Now pushed right by the pl-12 */}
//             <div className="flex justify-between items-start mb-1">
//               <span className="text-[10px] font-bold text-blue-600 truncate max-w-[120px]">
//                 {line.speaker || "No Speaker"}
//               </span>
//               <button
//                 onClick={(e) => removeLine(e, index)}
//                 className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
//               >
//                 <Trash2 size={12} />
//               </button>
//             </div>
//             <p className="text-[11px] text-gray-600 line-clamp-1 italic">
//               "{line.text || "..."}"
//             </p>
//             <ChevronRight
//               size={14}
//               className="absolute bottom-2 right-2 text-gray-300"
//             />
//           </div>
//         ))}

//         {lines.length === 0 && (
//           <div className="text-center py-10 border-2 border-dashed rounded-lg">
//             <MessageSquare className="mx-auto text-gray-200 mb-2" size={32} />
//             <p className="text-[10px] text-gray-400">
//               No dialogue added to this scene.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useLoreStore } from "../store";
import SmartInput from "./SmartInput";
import {
  Plus,
  Trash2,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
  Sliders,
} from "lucide-react";

export default function SequenceEditor({ nodeId, lines = [] }) {
  const { schema, lists, updateNodeData } = useLoreStore();
  const [activeIndex, setActiveIndex] = useState(null);

  const availableVariables = lists.variables || [];

  // Core update dispatch wrapper
  const syncDialogueLinesWithStore = (newLines) => {
    const { activeGraph, graphs } = useLoreStore.getState();
    const node = graphs[activeGraph].nodes.find((n) => n.id === nodeId);
    if (!node) return;

    updateNodeData(nodeId, {
      ...node.data,
      dialogueLines: newLines,
    });
  };

  const updateLine = (index, fieldId, value) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [fieldId]: value };
    syncDialogueLinesWithStore(newLines);
  };

  const addLine = () => {
    const newLine = {
      id: crypto.randomUUID(),
      speaker: "",
      text: "",
      portrait: "",
      sound: "",
      variants: [],
    };
    syncDialogueLinesWithStore([...lines, newLine]);
  };

  const removeLine = (e, index) => {
    e.stopPropagation();
    const newLines = lines.filter((_, i) => i !== index);
    syncDialogueLinesWithStore(newLines);
    if (activeIndex === index) setActiveIndex(null);
  };

  // ── TYPE-SAFE VARIANT OPERATION MANIPULATORS ──
  const addVariant = (lineIndex) => {
    const newLines = [...lines];
    const targetLine = { ...newLines[lineIndex] };
    const currentVariants = Array.isArray(targetLine.variants)
      ? targetLine.variants
      : [];

    // Peek first variable's type to seed a correct primitive default value
    const firstVar = availableVariables[0];
    let defaultVal = true;
    if (firstVar?.type === "number") defaultVal = 0;
    if (firstVar?.type === "string") defaultVal = "";

    const newVariant = {
      id: crypto.randomUUID(),
      check_flag: firstVar?.name || "",
      operator: "==",
      value: defaultVal,
      text: "",
    };

    targetLine.variants = [...currentVariants, newVariant];
    newLines[lineIndex] = targetLine;
    syncDialogueLinesWithStore(newLines);
  };

  const handleVariantVariableChange = (lineIndex, variantIndex, varName) => {
    const newLines = [...lines];
    const targetLine = { ...newLines[lineIndex] };
    const currentVariants = [...targetLine.variants];
    const varDef = availableVariables.find((v) => v.name === varName);

    // Enforce instant type coercion on variable switch
    let newVal = true;
    if (varDef?.type === "number") newVal = 0;
    if (varDef?.type === "string") newVal = "";

    currentVariants[variantIndex] = {
      ...currentVariants[variantIndex],
      check_flag: varName,
      operator: "==",
      value: newVal,
    };

    targetLine.variants = currentVariants;
    newLines[lineIndex] = targetLine;
    syncDialogueLinesWithStore(newLines);
  };

  const updateVariant = (lineIndex, variantIndex, fieldId, value) => {
    const newLines = [...lines];
    const targetLine = { ...newLines[lineIndex] };
    const currentVariants = [...targetLine.variants];

    currentVariants[variantIndex] = {
      ...currentVariants[variantIndex],
      [fieldId]: value,
    };

    targetLine.variants = currentVariants;
    newLines[lineIndex] = targetLine;
    syncDialogueLinesWithStore(newLines);
  };

  const removeVariant = (lineIndex, variantIndex) => {
    const newLines = [...lines];
    const targetLine = { ...newLines[lineIndex] };

    targetLine.variants = targetLine.variants.filter(
      (_, i) => i !== variantIndex,
    );
    newLines[lineIndex] = targetLine;
    syncDialogueLinesWithStore(newLines);
  };

  // DETAIL VIEW: Form for editing a specific line layout
  if (activeIndex !== null) {
    const currentLine = lines[activeIndex];

    if (!currentLine) {
      return (
        <div className="p-4 text-xs text-gray-400">Loading line data...</div>
      );
    }

    const currentVariants = Array.isArray(currentLine.variants)
      ? currentLine.variants
      : [];

    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-200">
        <button
          onClick={() => setActiveIndex(null)}
          className="flex items-center gap-2 p-3 text-blue-600 hover:bg-blue-50 border-b text-xs font-bold"
        >
          <ArrowLeft size={14} /> Back to Sequence
        </button>

        <div className="p-4 space-y-5 overflow-y-auto flex-grow custom-scrollbar">
          {/* Main Layout Blueprints Fields */}
          <div className="space-y-4">
            {schema.sequenceFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  {field.label}
                </label>
                <SmartInput
                  field={field}
                  value={currentLine[field.id] || ""}
                  onChange={(val) => updateLine(activeIndex, field.id, val)}
                />
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Conditional Line Variants Segment */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-gray-700">
                <Sliders size={13} className="text-blue-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Conditional Text Variants ({currentVariants.length})
                </span>
              </div>
              <button
                onClick={() => addVariant(activeIndex)}
                className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-all"
              >
                <Plus size={12} /> Add Condition Variant
              </button>
            </div>

            {/* Vertical Stack of Type-Safe Variant Cards */}
            <div className="space-y-3">
              {currentVariants.map((variant, vIdx) => {
                const selectedVar = availableVariables.find(
                  (v) => v.name === variant.check_flag,
                );
                const isNumeric = selectedVar?.type === "number";
                const isString = selectedVar?.type === "string";

                return (
                  <div
                    key={variant.id || vIdx}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-3 relative animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Header Action Bar (Fixed CSS Overflow Issue) */}
                    <div className="flex items-center justify-between gap-1 bg-white border border-gray-100 rounded p-1.5 shadow-sm">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 flex-grow min-w-0">
                        <span className="font-black text-blue-500 text-[10px] uppercase flex-shrink-0">
                          IF
                        </span>

                        {/* Variable Selection Wrapper (Flex proportional sharing) */}
                        <select
                          value={variant.check_flag}
                          onChange={(e) =>
                            handleVariantVariableChange(
                              activeIndex,
                              vIdx,
                              e.target.value,
                            )
                          }
                          className="bg-transparent font-bold text-gray-700 focus:outline-none flex-1 min-w-[40px] w-0 truncate cursor-pointer"
                        >
                          {availableVariables.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                          {availableVariables.length === 0 && (
                            <option value="">No Variables Defined</option>
                          )}
                        </select>

                        {/* Adaptive Operators Dropdown Selection (Shrink-proof) */}
                        <select
                          value={variant.operator || "=="}
                          onChange={(e) =>
                            updateVariant(
                              activeIndex,
                              vIdx,
                              "operator",
                              e.target.value,
                            )
                          }
                          className="bg-transparent font-black text-blue-600 px-0.5 focus:outline-none cursor-pointer flex-shrink-0"
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

                        {/* Target Coerced Value Primitive Forms (Flex proportional sharing) */}
                        <div className="flex-1 min-w-[30px] w-0 flex">
                          {isNumeric ? (
                            <input
                              type="number"
                              value={variant.value ?? 0}
                              onChange={(e) =>
                                updateVariant(
                                  activeIndex,
                                  vIdx,
                                  "value",
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                              className="bg-transparent focus:underline font-semibold text-gray-700 w-full focus:outline-none border-b border-dashed border-gray-200 focus:border-blue-400"
                            />
                          ) : isString ? (
                            <input
                              type="text"
                              value={variant.value ?? ""}
                              placeholder="text..."
                              onChange={(e) =>
                                updateVariant(
                                  activeIndex,
                                  vIdx,
                                  "value",
                                  e.target.value,
                                )
                              }
                              className="bg-transparent focus:underline font-semibold text-gray-700 w-full focus:outline-none border-b border-dashed border-gray-200 focus:border-blue-400 truncate"
                            />
                          ) : (
                            <select
                              value={
                                variant.value === false ||
                                variant.value === "false"
                                  ? "false"
                                  : "true"
                              }
                              onChange={(e) =>
                                updateVariant(
                                  activeIndex,
                                  vIdx,
                                  "value",
                                  e.target.value === "true",
                                )
                              }
                              className="bg-transparent font-bold text-gray-700 focus:outline-none cursor-pointer w-full"
                            >
                              <option value="true">TRUE</option>
                              <option value="false">FALSE</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeVariant(activeIndex, vIdx)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Remove Variant"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Variant Response Line Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                        Alternative Text Display Value
                      </label>
                      <textarea
                        rows={2}
                        value={variant.text || ""}
                        onChange={(e) =>
                          updateVariant(
                            activeIndex,
                            vIdx,
                            "text",
                            e.target.value,
                          )
                        }
                        placeholder='e.g., "You are insufferable, brother! I detest you!"'
                        className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-700 placeholder-gray-300 italic focus:outline-none focus:border-blue-400 resize-none font-medium shadow-inner"
                      />
                    </div>
                  </div>
                );
              })}

              {currentVariants.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-[10px] text-gray-400">
                  This line uses the default text string globally across all
                  project conditions.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MASTER VIEW: Scrollable list of boxes
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex justify-between items-center p-2 mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase">
          Dialogue List ({lines.length})
        </span>
        <button
          onClick={addLine}
          className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar w-full overflow-x-hidden">
        {lines.map((line, index) => {
          const variantsCount = Array.isArray(line.variants)
            ? line.variants.length
            : 0;
          return (
            <div
              key={line.id || index}
              onClick={() => setActiveIndex(index)}
              className="group relative bg-gray-50 border border-gray-200 rounded-md p-3 pl-12 pr-8 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all min-h-[60px] overflow-hidden select-none"
            >
              {/* LINE NUMBER BADGE */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gray-100 border-r flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* CONTENT */}
              <div className="flex justify-between items-center mb-1 w-full gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-grow">
                  <span className="text-[10px] font-bold text-blue-600 truncate">
                    {line.speaker || "No Speaker"}
                  </span>
                  {variantsCount > 0 && (
                    <span className="text-[8px] px-1 py-0.2 bg-blue-100 font-extrabold text-blue-600 rounded flex-shrink-0">
                      +{variantsCount} VAR
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => removeLine(e, index)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Strict safety truncate limits to bypass string overflows inside elements */}
              <p className="text-[11px] text-gray-600 truncate w-full block italic pr-2">
                "{line.text || "..."}"
              </p>
              <ChevronRight
                size={14}
                className="absolute bottom-2 right-2 text-gray-300 pointer-events-none"
              />
            </div>
          );
        })}

        {lines.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <MessageSquare className="mx-auto text-gray-200 mb-2" size={32} />
            <p className="text-[10px] text-gray-400">
              No dialogue added to this scene.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
