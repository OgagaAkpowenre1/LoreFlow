import React from "react";
import { Trash2, Plus, GitBranch, X } from "lucide-react";
import { useLoreStore } from "../store";

export default function ChoiceEditor({ value = [], onChange }) {
  const lists = useLoreStore((s) => s.lists);
  const listMetadata = useLoreStore((s) => s.listMetadata);

  // Extract all available variables for the condition dropdowns
  const allVariables = Object.entries(lists)
    .filter(([id]) => listMetadata[id] === "variable")
    .flatMap(([_, items]) => items);

  const handleAddChoice = () => {
    onChange([
      ...value,
      {
        id: `choice-${crypto.randomUUID()}`,
        text: "",
        conditions: [], // Initialize with empty conditions array
      },
    ]);
  };

  const handleUpdateChoice = (index, updates) => {
    const newChoices = [...value];
    newChoices[index] = { ...newChoices[index], ...updates };
    onChange(newChoices);
  };

  const handleDeleteChoice = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {value.map((choice, choiceIndex) => (
        <div
          key={choice.id}
          className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3 shadow-sm"
        >
          {/* 1. Choice Text & Delete Button */}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-grow p-2 text-xs font-medium border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-colors"
              placeholder="Choice text..."
              value={choice.text || ""}
              onChange={(e) =>
                handleUpdateChoice(choiceIndex, { text: e.target.value })
              }
            />
            <button
              onClick={() => handleDeleteChoice(choiceIndex)}
              className="text-gray-400 hover:text-red-500 p-2 bg-white rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all shrink-0"
              title="Delete Choice"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* 2. Conditions Array for this Choice */}
          {choice.conditions && choice.conditions.length > 0 && (
            <div className="pl-2 border-l-2 border-blue-200 space-y-2 mb-2">
              {choice.conditions.map((cond, condIndex) => {
                // Defensive guard: Find the variable to determine its type, fallback to boolean
                const selectedVar = allVariables.find(
                  (v) => v.name === cond.check_flag,
                ) || {
                  type: "boolean",
                  name: "unresolved",
                };

                const isNumeric = selectedVar.type === "number";
                const operators = isNumeric
                  ? ["==", "!=", ">", ">=", "<", "<="]
                  : ["==", "!="];

                return (
                  <div
                    key={cond.id}
                    className="flex flex-wrap sm:flex-nowrap gap-1.5 items-center bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm relative group"
                  >
                    <GitBranch
                      size={12}
                      className="text-blue-400 mx-1 shrink-0"
                    />

                    <select
                      value={cond.check_flag || ""}
                      onChange={(e) => {
                        const newConditions = [...choice.conditions];
                        newConditions[condIndex].check_flag = e.target.value;
                        // Reset value when changing variables to prevent type mismatch crashes
                        newConditions[condIndex].value = "";
                        handleUpdateChoice(choiceIndex, {
                          conditions: newConditions,
                        });
                      }}
                      className="text-[10px] font-bold p-1.5 bg-gray-50 border border-gray-200 rounded outline-none w-full sm:w-auto cursor-pointer focus:border-blue-400"
                    >
                      <option value="">Select Flag...</option>
                      {Object.entries(lists)
                        .filter(([id]) => listMetadata[id] === "variable")
                        .map(([listName, variables]) => (
                          <optgroup
                            label={listName.toUpperCase()}
                            key={listName}
                          >
                            {variables.map((v) => (
                              <option key={v.name} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                    </select>

                    <select
                      value={cond.operator || "=="}
                      onChange={(e) => {
                        const newConditions = [...choice.conditions];
                        newConditions[condIndex].operator = e.target.value;
                        handleUpdateChoice(choiceIndex, {
                          conditions: newConditions,
                        });
                      }}
                      className="text-[10px] font-black p-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded outline-none cursor-pointer"
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>

                    <div className="flex-grow min-w-[80px] flex">
                      {selectedVar.type === "boolean" ? (
                        <button
                          onClick={() => {
                            const newConditions = [...choice.conditions];
                            const currentVal = newConditions[condIndex].value;
                            newConditions[condIndex].value =
                              currentVal === true || currentVal === "true"
                                ? false
                                : true;
                            handleUpdateChoice(choiceIndex, {
                              conditions: newConditions,
                            });
                          }}
                          className={`w-full text-[10px] font-black uppercase py-1.5 px-2 rounded transition-all ${
                            cond.value === true || cond.value === "true"
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {cond.value === true || cond.value === "true"
                            ? "True"
                            : "False"}
                        </button>
                      ) : selectedVar.type === "string" &&
                        selectedVar.allowedValues?.length > 0 ? (
                        <select
                          value={cond.value ?? ""}
                          onChange={(e) => {
                            const newConditions = [...choice.conditions];
                            newConditions[condIndex].value = e.target.value;
                            handleUpdateChoice(choiceIndex, {
                              conditions: newConditions,
                            });
                          }}
                          className="w-full text-[10px] font-bold p-1.5 bg-gray-50 border border-gray-200 rounded outline-none cursor-pointer"
                        >
                          <option value="" disabled>
                            Select Value...
                          </option>
                          {selectedVar.allowedValues.map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={isNumeric ? "number" : "text"}
                          placeholder={isNumeric ? "0" : "Value..."}
                          value={cond.value ?? ""}
                          onChange={(e) => {
                            const newConditions = [...choice.conditions];
                            const val = e.target.value;
                            newConditions[condIndex].value = isNumeric
                              ? val === ""
                                ? 0
                                : Number(val)
                              : val;
                            handleUpdateChoice(choiceIndex, {
                              conditions: newConditions,
                            });
                          }}
                          className="w-full text-[10px] font-bold p-1.5 bg-gray-50 border border-gray-200 rounded outline-none focus:border-blue-400 focus:bg-white transition-colors"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const newConditions = choice.conditions.filter(
                          (_, i) => i !== condIndex,
                        );
                        handleUpdateChoice(choiceIndex, {
                          conditions: newConditions,
                        });
                      }}
                      className="text-gray-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      title="Remove Requirement"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Add Condition Button */}
          <button
            onClick={() => {
              const newConditions = [...(choice.conditions || [])];
              newConditions.push({
                id: `cond-${crypto.randomUUID()}`,
                check_flag: "",
                operator: "==",
                value: "",
              });
              handleUpdateChoice(choiceIndex, { conditions: newConditions });
            }}
            className="text-[9px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-700 hover:bg-blue-50 py-1.5 px-2 rounded-lg transition-colors flex items-center gap-1 w-max border border-transparent hover:border-blue-100"
          >
            <Plus size={12} strokeWidth={3} /> Add Requirement
          </button>
        </div>
      ))}

      {/* ── MASTER ADD CHOICE BUTTON ── */}
      <button
        onClick={handleAddChoice}
        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
      >
        <Plus size={16} strokeWidth={3} /> Add Branching Choice
      </button>
    </div>
  );
}