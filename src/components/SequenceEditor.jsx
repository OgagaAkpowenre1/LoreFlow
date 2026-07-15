import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { useLoreStore } from "../store";
import SmartInput from "./SmartInput";
import {
  Plus,
  Trash2,
  ChevronRight,
  MessageSquare,
  X,
  Sliders,
  AlertTriangle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Layout,
  User,
  Tag,
  Grip,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// LINE ROW (memoized)
// Pulled out of the parent's render so each row only re-renders
// when ITS OWN line object reference changes. Because
// SequenceEditor's updateLine/moveLine/handleDrop only replace
// the single line object that actually changed (newLines[index]
// = {...}), every other row's `line` prop keeps the same
// reference across a re-render — so memo() lets those rows skip
// re-rendering entirely, even with hundreds of lines in the list.
//
// Callbacks (onSelect, onRemove, onDragStart, etc.) are passed
// down as stable index-taking functions from the parent via
// useCallback, rather than being created fresh per-row on every
// render, so they don't defeat the memo comparison either.
// ─────────────────────────────────────────────────────────────
const LineRow = memo(function LineRow({
  line,
  index,
  isActive,
  isDragged,
  isDragOver,
  onSelect,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const variantsCount = line.variants?.length || 0;
  console.log(`Line ${index} rendered`)
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`relative group flex border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isActive
          ? "border-blue-500 shadow-lg shadow-blue-100 bg-blue-50/30 scale-[1.02] z-10"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
      } ${isDragged ? "opacity-40 scale-95 border-dashed" : ""} ${
        isDragOver ? "border-t-4 border-t-blue-500 translate-y-1" : ""
      }`}
      onClick={() => onSelect(index)}
    >
      {/* Left Color Accent & Drag Handle */}
      <div
        className={`w-8 flex flex-col items-center justify-center shrink-0 border-r border-gray-100 transition-colors ${
          isActive
            ? "bg-blue-500 text-white"
            : "bg-gray-50 group-hover:bg-blue-50"
        }`}
      >
        <div className="relative group/handle flex items-center justify-center w-full h-full">
          <span
            className={`text-[10px] font-black group-hover/handle:opacity-0 transition-opacity absolute ${
              isActive ? "text-blue-100" : "text-gray-400"
            }`}
          >
            {(index + 1).toString().padStart(2, "0")}
          </span>

          <div
            className={`opacity-0 group-hover/handle:opacity-100 transition-opacity absolute cursor-grab active:cursor-grabbing ${
              isActive ? "text-white" : "text-gray-500"
            }`}
          >
            <Grip size={14} />
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="p-3 flex-grow min-w-0">
        <div className="flex justify-between items-center mb-1 w-full gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-grow">
            <span className="text-[10px] font-black text-blue-700 truncate bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shadow-sm shrink-0 max-w-[120px]">
              {line.speaker || "UNASSIGNED SPEAKER"}
            </span>
            {variantsCount > 0 && (
              <span className="text-[8px] px-1 py-0.5 bg-purple-100 font-extrabold text-purple-600 rounded flex-shrink-0 border border-purple-200">
                +{variantsCount} VAR
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(e, index);
            }}
            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            title="Delete Line"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <p className="text-xs text-gray-600 font-medium line-clamp-2 pr-2">
          {line.text || (
            <span className="italic text-gray-300">Empty dialogue line...</span>
          )}
        </p>
      </div>
    </div>
  );
});

function SequenceEditor({ nodeId, lines = [] }) {
  const schema = useLoreStore((s) => s.schema);
  const lists = useLoreStore((s) => s.lists);
  const updateNodeData = useLoreStore((s) => s.updateNodeData);
  const [activeIndex, setActiveIndex] = useState(null);

  const listScrollContainerRef = useRef(null);
  const availableVariables = lists.variables || [];

  useEffect(() => {
    if (listScrollContainerRef.current) {
      listScrollContainerRef.current.scrollTo({
        top: listScrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [lines.length]);

  // ── LIVE TOKEN SYNTAX VALIDATOR ENGINE ──
  const checkStringTokens = (text = "") => {
    const tokenRegex = /\[(.*?)\]/g;
    const invalidTokens = [];
    const validTokens = [];
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      const tokenName = match[1];
      const isRegistered = availableVariables.some((v) => v.name === tokenName);
      if (isRegistered) {
        if (!validTokens.includes(tokenName)) validTokens.push(tokenName);
      } else {
        if (!invalidTokens.includes(tokenName)) invalidTokens.push(tokenName);
      }
    }
    return { invalidTokens, validTokens };
  };

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

  // Reads the CURRENT lines straight from the store at call-time, instead
  // of closing over the `lines` prop. This is what lets every callback
  // below depend only on `nodeId` (which basically never changes) rather
  // than on `lines` (which changes every single keystroke). If these
  // callbacks depended on `lines`, they'd get a new function identity on
  // every edit, and that new reference - passed down as a prop like
  // onRemove/onSelect - would defeat LineRow's memo() for ALL rows, not
  // just the one actually being edited. That was the bug: rows were
  // rendering not because their own `line` object changed, but because
  // the *callback props* passed to every row changed identity.
  const getCurrentLines = useCallback(() => {
    const { activeGraph, graphs } = useLoreStore.getState();
    const node = graphs[activeGraph]?.nodes.find((n) => n.id === nodeId);
    return node?.data?.dialogueLines || [];
  }, [nodeId]);

  // ── STABLE, INDEX-TAKING CALLBACKS ──
  const updateLine = useCallback(
    (index, fieldId, value) => {
      const newLines = [...getCurrentLines()];
      newLines[index] = { ...newLines[index], [fieldId]: value };
      syncDialogueLinesWithStore(newLines);
    },
    [getCurrentLines],
  );

  const addLine = useCallback(() => {
    const newLine = {
      id: crypto.randomUUID(),
      speaker: "",
      text: "",
      portrait: "",
      sound: "",
      variants: [],
    };
    syncDialogueLinesWithStore([...getCurrentLines(), newLine]);
  }, [getCurrentLines]);

  const removeLine = useCallback(
    (e, index) => {
      e.stopPropagation();
      const newLines = getCurrentLines().filter((_, i) => i !== index);
      syncDialogueLinesWithStore(newLines);
      setActiveIndex((cur) => (cur === index ? null : cur));
    },
    [getCurrentLines],
  );

  const moveLine = useCallback(
    (e, index, direction) => {
      e.stopPropagation();
      const currentLines = getCurrentLines();
      if (direction === "up" && index === 0) return;
      if (direction === "down" && index === currentLines.length - 1) return;

      const newLines = [...currentLines];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      [newLines[index], newLines[targetIndex]] = [
        newLines[targetIndex],
        newLines[index],
      ];

      syncDialogueLinesWithStore(newLines);

      setActiveIndex((cur) => {
        if (cur === index) return targetIndex;
        if (cur === targetIndex) return index;
        return cur;
      });
    },
    [getCurrentLines],
  );

  const addVariant = useCallback(
    (lineIndex) => {
      const newLines = [...getCurrentLines()];
      const targetLine = { ...newLines[lineIndex] };
      const currentVariants = Array.isArray(targetLine.variants)
        ? targetLine.variants
        : [];

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
    },
    [getCurrentLines, availableVariables],
  );

  const handleVariantVariableChange = useCallback(
    (lineIndex, variantIndex, varName) => {
      const newLines = [...getCurrentLines()];
      const targetLine = { ...newLines[lineIndex] };
      const currentVariants = [...targetLine.variants];
      const varDef = availableVariables.find((v) => v.name === varName);

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
    },
    [getCurrentLines, availableVariables],
  );

  const updateVariant = useCallback(
    (lineIndex, variantIndex, fieldId, value) => {
      const newLines = [...getCurrentLines()];
      const targetLine = { ...newLines[lineIndex] };
      const currentVariants = [...targetLine.variants];

      currentVariants[variantIndex] = {
        ...currentVariants[variantIndex],
        [fieldId]: value,
      };

      targetLine.variants = currentVariants;
      newLines[lineIndex] = targetLine;
      syncDialogueLinesWithStore(newLines);
    },
    [getCurrentLines],
  );

  const removeVariant = useCallback(
    (lineIndex, variantIndex) => {
      const newLines = [...getCurrentLines()];
      const targetLine = { ...newLines[lineIndex] };

      targetLine.variants = targetLine.variants.filter(
        (_, i) => i !== variantIndex,
      );
      newLines[lineIndex] = targetLine;
      syncDialogueLinesWithStore(newLines);
    },
    [getCurrentLines],
  );

  // Line dragging setup
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex((cur) => (cur !== index ? index : cur));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();
      setDraggedIndex((currentDragged) => {
        if (currentDragged !== null && currentDragged !== dropIndex) {
          const newLines = [...getCurrentLines()];
          const draggedItem = newLines.splice(currentDragged, 1)[0];
          newLines.splice(dropIndex, 0, draggedItem);

          syncDialogueLinesWithStore(newLines);

          setActiveIndex((cur) => (cur === currentDragged ? dropIndex : cur));
        }
        return null;
      });
      setDragOverIndex(null);
    },
    [getCurrentLines],
  );

  const handleSelect = useCallback((index) => {
    setActiveIndex((cur) => (cur === index ? null : index));
  }, []);

  const currentLine = activeIndex !== null ? lines[activeIndex] : null;
  const currentVariants =
    currentLine && Array.isArray(currentLine.variants)
      ? currentLine.variants
      : [];

  const mainTextValidation = currentLine
    ? checkStringTokens(currentLine.text)
    : { invalidTokens: [], validTokens: [] };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* ── SIDEBAR MASTER VIEW LIST ── */}
      <div className="flex justify-between items-center bg-white pb-3 shrink-0 sticky top-0 z-10 border-b border-gray-50">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Dialogue Sequence ({lines.length})
        </span>
        <button
          onClick={addLine}
          className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-md shadow-blue-100 flex items-center gap-1 text-[10px] font-bold uppercase pl-2 pr-3"
        >
          <Plus size={14} /> Add Line
        </button>
      </div>

      <div
        ref={listScrollContainerRef}
        className="flex-grow overflow-y-auto space-y-2 pt-2 pr-1 custom-scrollbar w-full overflow-x-hidden pb-12"
      >
        <div className="space-y-3">
          {lines.map((line, index) => (
            <LineRow
              key={line.id}
              line={line}
              index={index}
              isActive={activeIndex === index}
              isDragged={draggedIndex === index}
              isDragOver={dragOverIndex === index && draggedIndex !== index}
              onSelect={handleSelect}
              onRemove={removeLine}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))}
        </div>

        {lines.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-200 bg-gray-50/50">
            <MessageSquare className="mx-auto text-gray-300 mb-2" size={28} />
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              No narrative dialogue lines inside block.
            </p>
          </div>
        )}
      </div>

      {/* ── PORTAL ESCAPE ENGINE MODAL OVERLAY ── */}
      {activeIndex !== null &&
        currentLine &&
        createPortal(
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
            onClick={() => setActiveIndex(null)}
          >
            <div
              className="bg-white w-full max-w-3xl h-[80vh] rounded-2xl border border-gray-100 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <header className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-black shrink-0">
                    LINE #{String(activeIndex + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-200 truncate">
                    Dialogue Element focus studio
                  </h3>
                </div>
                <button
                  onClick={() => setActiveIndex(null)}
                  className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </header>

              {/* Scrollable Form Workspace */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                {/* Main Template Input Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {schema.sequenceFields.map((field) => (
                      <div
                        key={field.id}
                        className={`space-y-1 ${field.id === "text" ? "sm:col-span-2" : ""}`}
                      >
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          {field.label}
                        </label>
                        <SmartInput
                          field={field}
                          value={currentLine[field.id] || ""}
                          onChange={(val) =>
                            updateLine(activeIndex, field.id, val)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Main Row Token Live Parsing Visual Indicators */}
                  {(mainTextValidation.validTokens.length > 0 ||
                    mainTextValidation.invalidTokens.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold">
                      {mainTextValidation.validTokens.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md"
                        >
                          <CheckCircle size={10} /> token: [{t}]
                        </span>
                      ))}
                      {mainTextValidation.invalidTokens.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-md animate-pulse"
                        >
                          <AlertTriangle size={10} /> missing tracking key: [{t}
                          ]
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Conditional Local Sub-branches Track */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Sliders size={14} className="text-blue-500" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                        Conditional Narrative Variants ({currentVariants.length}
                        )
                      </span>
                    </div>
                    <button
                      onClick={() => addVariant(activeIndex)}
                      className="flex items-center gap-1 text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      <Plus size={12} /> Add Condition Variant
                    </button>
                  </div>

                  {/* Sub-variant Card Stack Configuration */}
                  <div className="space-y-3">
                    {currentVariants.map((variant, vIdx) => {
                      const selectedVar = availableVariables.find(
                        (v) => v.name === variant.check_flag,
                      );
                      const isNumeric = selectedVar?.type === "number";
                      const isString = selectedVar?.type === "string";

                      const variantValidation = checkStringTokens(variant.text);

                      return (
                        <div
                          key={variant.id || vIdx}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3 relative animate-in fade-in zoom-in-95 duration-150"
                        >
                          {/* Selector Evaluation Action Row */}
                          <div className="flex items-center justify-between gap-1 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 flex-grow min-w-0">
                              <span className="font-black text-blue-500 text-[10px] uppercase flex-shrink-0">
                                IF
                              </span>

                              <select
                                value={variant.check_flag}
                                onChange={(e) =>
                                  handleVariantVariableChange(
                                    activeIndex,
                                    vIdx,
                                    e.target.value,
                                  )
                                }
                                className="bg-transparent font-black text-gray-800 focus:outline-none flex-1 min-w-[50px] w-0 truncate cursor-pointer text-xs"
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
                                className="bg-transparent font-black text-blue-600 px-1 focus:outline-none cursor-pointer flex-shrink-0 text-xs"
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

                              <div className="flex-1 min-w-[40px] w-0 flex">
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
                                    className="bg-transparent focus:underline font-bold text-gray-800 w-full focus:outline-none border-b border-dashed border-gray-200 focus:border-blue-400 text-xs"
                                  />
                                ) : isString &&
                                  selectedVar.allowedValues &&
                                  selectedVar.allowedValues.length > 0 ? (
                                  <select
                                    value={
                                      variant.value ??
                                      selectedVar.defaultValue ??
                                      selectedVar.allowedValues[0] ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateVariant(
                                        activeIndex,
                                        vIdx,
                                        "value",
                                        e.target.value,
                                      )
                                    }
                                    className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer w-full text-xs"
                                  >
                                    {selectedVar.allowedValues.map((val) => (
                                      <option key={val} value={val}>
                                        {val}
                                      </option>
                                    ))}
                                  </select>
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
                                    className="bg-transparent focus:underline font-bold text-gray-800 w-full focus:outline-none border-b border-dashed border-gray-200 focus:border-blue-400 truncate text-xs"
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
                                    className="bg-transparent font-black text-gray-800 cursor-pointer w-full text-xs outline-none"
                                  >
                                    <option value="true">TRUE</option>
                                    <option value="false">FALSE</option>
                                  </select>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => removeVariant(activeIndex, vIdx)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Alternative Variant Text Block Input */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">
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
                              placeholder='e.g., "Welcome back, [player_name]! Your gold balance is [gold_amount]."'
                              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 placeholder-gray-300 italic focus:outline-none focus:border-blue-400 resize-none font-medium shadow-inner"
                            />
                          </div>

                          {/* ── INLINE VARIANT SPECIFIC TOKEN VERIFICATION FOOTER ── */}
                          {(variantValidation.validTokens.length > 0 ||
                            variantValidation.invalidTokens.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-bold">
                              {variantValidation.validTokens.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-green-50 text-green-700 border border-green-100 rounded"
                                >
                                  <CheckCircle size={9} /> token verified: [{t}]
                                </span>
                              ))}
                              {variantValidation.invalidTokens.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-orange-50 text-orange-600 border border-orange-100 rounded animate-pulse"
                                >
                                  <AlertTriangle size={9} /> unrecognized token
                                  asset: [{t}]
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {currentVariants.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-[10px] text-gray-400 font-bold uppercase">
                        This element uses the parent text block across all
                        engine scenarios.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Completion Lock Row */}
              <footer className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  onClick={() => setActiveIndex(null)}
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Save Line Changes
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default memo(SequenceEditor)