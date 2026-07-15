import { memo } from "react";
import { useLoreStore } from "../store";
import { Plus, Trash2 } from "lucide-react";

function LogicEditor({ nodeId, data }) {
  const lists = useLoreStore((s) => s.lists);
  const updateNodeData = useLoreStore((s) => s.updateNodeData);
  const listMetadata = useLoreStore((s) => s.listMetadata);
  const addConditionToLogic = useLoreStore((s) => s.addConditionToLogic);
  const removeConditionFromLogic = useLoreStore(
    (s) => s.removeConditionFromLogic,
  );

  const variableLists = Object.keys(listMetadata).filter(
    (key) => listMetadata[key] === "variable",
  );
  const allVariables = variableLists.flatMap((key) => lists[key] || []);
  const conditions = data.conditions || [];

  const updateCondition = (conditionId, updates) => {
    const newConditions = conditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c,
    );
    updateNodeData(nodeId, { ...data, conditions: newConditions });
  };

  // ── TYPE-SAFE RESET ENGINE: Enforces true primitive types when a variable changes ──
  const handleVariableChange = (condId, varName) => {
    const varDef = allVariables.find((v) => v.name === varName);
    let newVal = true; // Strict primitive boolean fallback

    if (varDef?.type === "number") {
      newVal = 0; // Strict primitive number fallback
    } else if (varDef?.type === "string") {
      // Coerce fallback chain directly: explicit default -> first option index -> empty string
      newVal = varDef.defaultValue ?? varDef.allowedValues?.[0] ?? "";
    }

    updateCondition(condId, {
      check_flag: varName,
      value: newVal,
      operator: "==",
    });
  };

  return (
    <div className="space-y-6">
      {conditions.map((cond, index) => {
        const selectedVar = allVariables.find(
          (v) => v.name === cond.check_flag,
        );
        const isNumeric = selectedVar?.type === "number";
        const isString = selectedVar?.type === "string";

        return (
          <div
            key={cond.id}
            className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative group animate-in fade-in slide-in-from-top-2"
          >
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

            <div className="space-y-3">
              {/* Variable Target Selection */}
              <select
                className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                value={cond.check_flag || ""}
                onChange={(e) => handleVariableChange(cond.id, e.target.value)}
              >
                <option value="" disabled>
                  Select variable...
                </option>
                {variableLists.map((listKey) => (
                  <optgroup key={listKey} label={listKey.toUpperCase()}>
                    {lists[listKey].map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.type})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {selectedVar && (
                <div className="flex gap-2">
                  {/* Operator Selection */}
                  <div className="w-1/3">
                    <select
                      className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold cursor-pointer"
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

                  {/* Adaptive Value Target Inputs — Formats values directly into primitives */}
                  <div className="w-2/3">
                    {isNumeric ? (
                      <input
                        type="number"
                        className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        value={cond.value ?? 0}
                        onChange={(e) =>
                          updateCondition(cond.id, {
                            value:
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                          })
                        }
                      />
                    ) : isString ? (
                      selectedVar.allowedValues &&
                      selectedVar.allowedValues.length > 0 ? (
                        /* 🏆 ENUM DROPDOWN: Renders choices safely if a list format rule exists, avoiding errors */
                        <select
                          className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold cursor-pointer"
                          value={
                            cond.value ??
                            selectedVar.defaultValue ??
                            selectedVar.allowedValues[0] ??
                            ""
                          }
                          onChange={(e) =>
                            updateCondition(cond.id, { value: e.target.value })
                          }
                        >
                          {selectedVar.allowedValues.map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      ) : (
                        /* RAW INPUT FIELD: Fallback UI wrapper for unconstrained, freeform string paths */
                        <input
                          type="text"
                          placeholder="Text to match..."
                          className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                          value={cond.value ?? ""}
                          onChange={(e) =>
                            updateCondition(cond.id, { value: e.target.value })
                          }
                        />
                      )
                    ) : (
                      /* BOOLEAN INPUT ARRAYS: Evaluated strictly as clean boolean primitives */
                      <select
                        className="w-full p-2 border rounded text-xs bg-white outline-none focus:ring-2 focus:ring-orange-500 font-bold cursor-pointer"
                        value={
                          cond.value === false || cond.value === "false"
                            ? "false"
                            : "true"
                        }
                        onChange={(e) =>
                          updateCondition(cond.id, {
                            value: e.target.value === "true",
                          })
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

      <button
        onClick={() => addConditionToLogic(nodeId)}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Add Condition
      </button>
    </div>
  );
}

export default memo(LogicEditor)