import React, { useState } from "react";
import { useLoreStore, ALLOWED_TYPES } from "../store";
import {
  Trash2,
  Plus,
  Settings,
  Database,
  Layout,
  X,
  Check,
  Workflow,
  ArrowRight,
  Terminal,
  Tag,
  Lock,
  Monitor,
} from "lucide-react";

export default function SettingsEditor({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("schema");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] sm:h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        {/* ── Header ── */}
        <header className="bg-gray-900 text-white px-4 py-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg shrink-0">
              <Settings size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold uppercase tracking-widest text-xs sm:text-sm leading-tight">
                Engine Configuration
              </h2>
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase hidden sm:block">
                Manage Blueprints, Data &amp; Global Routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-800 p-2 rounded-full transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-grow overflow-hidden min-h-0">
          {/* ── Sidebar Nav ── */}
          <nav className="w-12 sm:w-14 lg:w-56 shrink-0 bg-gray-50 border-r flex flex-col items-center lg:items-stretch gap-2 p-2 sm:p-3 lg:p-6">
            <NavBtn
              active={activeTab === "schema"}
              onClick={() => setActiveTab("schema")}
              icon={<Layout size={16} />}
              label="Blueprints"
            />
            <NavBtn
              active={activeTab === "lists"}
              onClick={() => setActiveTab("lists")}
              icon={<Database size={16} />}
              label="Global Lists"
            />
            <NavBtn
              active={activeTab === "registry"}
              onClick={() => setActiveTab("registry")}
              icon={<Workflow size={16} />}
              label="Conversation Registry"
            />
            <NavBtn
              active={activeTab === "environment"}
              onClick={() => setActiveTab("environment")}
              icon={<Monitor size={16} />}
              label="Environment"
            />
          </nav>

          {/* ── Main Content Area ── */}
          <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white custom-scrollbar">
            {activeTab === "schema" && <SchemaTab />}
            {activeTab === "lists" && <ListsTab />}
            {activeTab === "registry" && <RegistryTab />}
            {activeTab === "environment" && <EnvironmentTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
    NAV BUTTON
════════════════════════════════════════════ */
function NavBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        flex items-center justify-center lg:justify-start gap-3
        p-2.5 lg:p-3 rounded-xl text-xs font-bold transition-all w-full
        ${
          active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
            : "text-gray-500 hover:bg-gray-100"
        }
      `}
    >
      <span className="shrink-0 w-5 flex justify-center">{icon}</span>
      <span className="hidden lg:inline truncate">{label}</span>
    </button>
  );
}

/* ════════════════════════════════════════════
    SCHEMA TAB
════════════════════════════════════════════ */
function SchemaTab() {
  const schema = useLoreStore((s) => s.schema);
  const addFieldToSchema = useLoreStore((s) => s.addFieldToSchema);
  const removeFieldFromSchema = useLoreStore((s) => s.removeFieldFromSchema);
  const lists = useLoreStore((s) => s.lists);
  const listMetadata = useLoreStore((s) => s.listMetadata);
  const [target, setTarget] = useState("nodeFields");
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState({
    id: "",
    label: "",
    type: "text",
    listId: "",
  });

  const handleSave = () => {
    if (!newField.id || !newField.label) return;
    addFieldToSchema(target, newField);
    setNewField({ id: "", label: "", type: "text", listId: "" });
    setIsAdding(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <select
          className="bg-gray-100 font-bold text-xs sm:text-sm p-2 rounded-lg outline-none border-r-8 border-transparent"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="nodeFields">Scene Node Blueprint</option>
          <option value="sequenceFields">Dialogue Line Blueprint</option>
        </select>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={15} /> New Field
        </button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-blue-400 uppercase">
              Technical ID
            </label>
            <input
              className="w-full p-2 text-xs border rounded bg-white"
              placeholder="e.g. cam_zoom"
              value={newField.id}
              onChange={(e) => setNewField({ ...newField, id: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-blue-400 uppercase">
              Display Label
            </label>
            <input
              className="w-full p-2 text-xs border rounded bg-white"
              placeholder="e.g. Camera Zoom"
              value={newField.label}
              onChange={(e) =>
                setNewField({ ...newField, label: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-blue-400 uppercase">
              Data Type
            </label>
            <select
              className="w-full p-2 text-xs border rounded bg-white"
              value={newField.type}
              onChange={(e) =>
                setNewField({ ...newField, type: e.target.value })
              }
            >
              {ALLOWED_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            {newField.type === "list" && (
              <select
                className="flex-grow p-2 text-xs border border-orange-300 rounded bg-white"
                value={newField.listId}
                onChange={(e) =>
                  setNewField({ ...newField, listId: e.target.value })
                }
              >
                <option value="">Select Data Source…</option>
                {Object.keys(lists)
                  .filter((k) => listMetadata[k] !== "variable")
                  .map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
              </select>
            )}
            {newField.type === "flag_group" && (
              <div className="flex-grow p-2 text-[10px] text-orange-600 bg-orange-50 rounded border border-orange-200">
                Auto-linked to: <strong>variables list</strong>
              </div>
            )}
            <button
              onClick={handleSave}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 shrink-0"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {schema[target].map((field) => {
          // Prevent structural components from being downgraded to scalar text fields
          const isStructural = [
            "sequence",
            "choice_list",
            "flag_group",
          ].includes(field.type);

          return (
            <div
              key={field.id}
              className={`flex items-center justify-between p-3 sm:p-4 bg-gray-50 border rounded-xl group transition-colors ${
                field.core
                  ? "border-indigo-100 bg-indigo-50/30"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 w-full">
                <div
                  className={`p-2 rounded-lg shadow-sm shrink-0 ${field.core ? "bg-indigo-100" : "bg-white"}`}
                >
                  {field.core ? (
                    <Lock size={15} className="text-indigo-500" />
                  ) : (
                    <Layout size={15} className="text-gray-400" />
                  )}
                </div>

                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {field.label}
                    </p>
                    {field.core && (
                      <span className="text-[8px] bg-indigo-500 text-white font-black uppercase px-1.5 py-0.5 rounded tracking-widest shadow-sm">
                        Required Core
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-mono font-bold">
                      ID: {field.id}
                    </span>

                    {/* DYNAMIC TYPE SELECTOR */}
                    <div
                      className={`flex items-center gap-1 border rounded px-1.5 py-0.5 ${field.core ? "bg-indigo-50 border-indigo-200" : "bg-blue-50 border-blue-200"}`}
                    >
                      <span
                        className={`text-[9px] font-bold uppercase ${field.core ? "text-indigo-400" : "text-blue-400"}`}
                      >
                        Type:
                      </span>
                      <select
                        disabled={isStructural}
                        className={`text-[9px] bg-transparent font-black tracking-wider outline-none uppercase ${
                          isStructural
                            ? "cursor-not-allowed opacity-70"
                            : "cursor-pointer"
                        } ${field.core ? "text-indigo-600" : "text-blue-600"}`}
                        value={field.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const payload = { type: newType };

                          if (newType === "list" && !field.listId) {
                            const availableLists = Object.keys(lists).filter(
                              (k) => listMetadata[k] !== "variable",
                            );
                            payload.listId = availableLists[0] || "";
                          } else if (newType !== "list") {
                            payload.listId = undefined;
                          }

                          useLoreStore
                            .getState()
                            .updateFieldInSchema(target, field.id, payload);
                        }}
                      >
                        {ALLOWED_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* LIVE SOURCE REMAPPER */}
                    {field.type === "list" && (
                      <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 animate-in fade-in zoom-in-95 duration-200">
                        <span className="text-[9px] font-bold text-orange-400 uppercase">
                          List:
                        </span>
                        <select
                          className="text-[9px] bg-transparent text-orange-600 font-bold uppercase outline-none cursor-pointer"
                          value={field.listId || ""}
                          onChange={(e) =>
                            useLoreStore
                              .getState()
                              .updateFieldInSchema(target, field.id, {
                                listId: e.target.value,
                              })
                          }
                        >
                          <option value="" disabled>
                            Select Source...
                          </option>
                          {Object.keys(lists)
                            .filter((k) => listMetadata[k] !== "variable")
                            .map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CORE LOCK PROTECTION */}
              {!field.core && (
                <button
                  onClick={() => removeFieldFromSchema(target, field.id)}
                  className="text-black hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  title="Delete Field Blueprint"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
    LISTS TAB
════════════════════════════════════════════ */
function ListsTab() {
  const lists = useLoreStore((s) => s.lists);
  const listMetadata = useLoreStore((s) => s.listMetadata);
  const addToList = useLoreStore((s) => s.addToList);
  const removeItemFromList = useLoreStore((s) => s.removeItemFromList);
  const createNewList = useLoreStore((s) => s.createNewList);
  const deleteList = useLoreStore((s) => s.deleteList);
  const updateItemInList = useLoreStore((s) => s.updateItemInList);
  const updateVariable = useLoreStore((s) => s.updateVariable);

  const [isCreating, setIsCreating] = useState(false);
  const [itemInputs, setItemInputs] = useState({});
  const [selectedTypes, setSelectedTypes] = useState({});
  const [tagInputs, setTagInputs] = useState({});

  const handleAction = (listId) => {
    const val = itemInputs[listId]?.trim();
    if (!val) return;
    if (listMetadata[listId] === "variable") {
      const isString = (selectedTypes[listId] || "boolean") === "string";
      addToList(listId, {
        name: val.replace(/\s+/g, "_"), // Case sensitivity preserved!
        type: selectedTypes[listId] || "boolean",
        ...(isString ? { allowedValues: [] } : {}),
      });
    } else {
      addToList(listId, val);
    }
    setItemInputs({ ...itemInputs, [listId]: "" });
  };

  const handleAddEnumTag = (listId, varIdx, currentVar) => {
    const inputKey = `${listId}-${varIdx}`;
    const rawVal = tagInputs[inputKey] || "";
    const cleanVal = rawVal.trim().replace(/\s+/g, "_"); // Case sensitivity preserved!

    if (!cleanVal) return;

    const currentValues = Array.isArray(currentVar.allowedValues)
      ? currentVar.allowedValues
      : [];
    if (currentValues.includes(cleanVal)) {
      alert("This text match token option already exists.");
      return;
    }

    updateVariable(listId, varIdx, "allowedValues", [
      ...currentValues,
      cleanVal,
    ]);
    setTagInputs({ ...tagInputs, [inputKey]: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Global Data Containers
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus size={15} /> New List
          </button>
        )}
      </div>

      {isCreating && (
        <NewListForm
          onCancel={() => setIsCreating(false)}
          onComplete={(name, type, items) => {
            createNewList(name, type, items);
            setIsCreating(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(lists).map(([id, items]) => {
          const isVarList = listMetadata[id] === "variable";
          const currentType = selectedTypes[id] || "boolean";

          return (
            <div
              key={id}
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col h-[420px] overflow-hidden"
            >
              <div className="flex justify-between items-center mb-3 shrink-0 gap-2">
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest truncate">
                  {id}
                </h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${isVarList ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}
                  >
                    {isVarList ? "Variable" : "String"}
                  </span>
                  {id !== "variables" && (
                    <button
                      onClick={() => deleteList(id)}
                      className="text-gray-800 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`flex-grow overflow-y-auto mb-3 pr-2 flex ${isVarList ? "flex-col" : "flex-wrap"} gap-2 content-start custom-scrollbar`}
              >
                {items.map((item, i) => (
                  <div key={i} className="group relative flex flex-col w-full">
                    {isVarList ? (
                      <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl p-2 w-full space-y-2 relative">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateVariable(id, i, "name", e.target.value)
                            }
                            className="bg-white border rounded text-[11px] font-bold px-2 py-1 outline-none w-28"
                          />
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateVariable(id, i, "type", e.target.value)
                            }
                            className="text-[8px] font-black uppercase bg-white border border-gray-200 rounded px-1 py-1 outline-none cursor-pointer"
                          >
                            <option value="boolean">Bool</option>
                            <option value="number">Num</option>
                            <option value="string">Text</option>
                          </select>

                          <div className="h-4 w-px bg-gray-200 mx-0.5" />

                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase">
                              Start:
                            </span>
                            {item.type === "number" ? (
                              <input
                                type="number"
                                value={item.defaultValue ?? 0}
                                onChange={(e) =>
                                  updateVariable(
                                    id,
                                    i,
                                    "defaultValue",
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                  )
                                }
                                className="w-12 bg-white border border-gray-200 rounded text-[10px] font-bold px-1 py-0.5 outline-none"
                              />
                            ) : item.type === "string" ? (
                              item.allowedValues &&
                              item.allowedValues.length > 0 ? (
                                <select
                                  value={item.defaultValue ?? ""}
                                  onChange={(e) =>
                                    updateVariable(
                                      id,
                                      i,
                                      "defaultValue",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20 bg-white border border-gray-200 rounded text-[10px] font-bold px-1 py-0.5 outline-none cursor-pointer"
                                >
                                  <option value="">(Empty)</option>
                                  {item.allowedValues.map((v) => (
                                    <option key={v} value={v}>
                                      {v}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={item.defaultValue ?? ""}
                                  onChange={(e) =>
                                    updateVariable(
                                      id,
                                      i,
                                      "defaultValue",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20 bg-white border border-gray-200 rounded text-[10px] font-bold px-1 py-0.5 outline-none"
                                />
                              )
                            ) : (
                              <button
                                onClick={() =>
                                  updateVariable(
                                    id,
                                    i,
                                    "defaultValue",
                                    !item.defaultValue,
                                  )
                                }
                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${item.defaultValue ? "bg-green-500 text-white" : "bg-gray-300 text-white"}`}
                              >
                                {item.defaultValue ? "True" : "False"}
                              </button>
                            )}
                          </div>
                        </div>

                        {item.type === "string" && (
                          <div className="bg-white border border-gray-100 rounded-lg p-1.5 space-y-1.5">
                            <div className="flex flex-wrap gap-1 items-center">
                              <Tag
                                size={12}
                                className="text-blue-500 shrink-0"
                              />
                              {(item.allowedValues || []).map((vVal, vIdx) => (
                                <div
                                  key={vIdx}
                                  className="flex items-center gap-1 bg-gray-50 border text-[9px] font-bold px-1.5 py-0.5 rounded text-gray-600"
                                >
                                  <span>{vVal}</span>
                                  <button
                                    onClick={() => {
                                      const filtered =
                                        item.allowedValues.filter(
                                          (_, idx) => idx !== vIdx,
                                        );
                                      updateVariable(
                                        id,
                                        i,
                                        "allowedValues",
                                        filtered,
                                      );
                                      if (item.defaultValue === vVal)
                                        updateVariable(
                                          id,
                                          i,
                                          "defaultValue",
                                          "",
                                        );
                                    }}
                                    className="text-gray-700 hover:text-red-500"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                              {(!item.allowedValues ||
                                item.allowedValues.length === 0) && (
                                <span className="text-[9px] text-gray-400 italic">
                                  Freeform string matching type.
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Add type choice..."
                                value={tagInputs[`${id}-${i}`] || ""}
                                onChange={(e) =>
                                  setTagInputs({
                                    ...tagInputs,
                                    [`${id}-${i}`]: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  (e.preventDefault(),
                                  handleAddEnumTag(id, i, item))
                                }
                                className="text-[10px] p-1 border rounded bg-gray-50 flex-grow outline-none focus:bg-white"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => removeItemFromList(id, i)}
                          className="absolute top-1.5 right-1.5 text-gray-900 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full bg-white relative">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            updateItemInList(id, i, e.target.value)
                          }
                          className="text-[11px] font-bold px-2 py-1.5 w-full rounded-md border bg-gray-50 text-gray-600 border-gray-200 outline-none focus:bg-white focus:border-blue-400 transition-all"
                        />
                        <button
                          onClick={() => removeItemFromList(id, i)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100 shrink-0 bg-white">
                {isVarList && (
                  <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md">
                    {["boolean", "number", "string"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setSelectedTypes((prev) => ({ ...prev, [id]: t }))
                        }
                        className={`flex-grow py-1 rounded text-[8px] font-black uppercase transition-all ${
                          currentType === t
                            ? "bg-white text-orange-600 shadow-sm"
                            : "text-gray-400"
                        }`}
                      >
                        {t === "string" ? "text" : t}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <input
                    className="flex-grow text-[11px] p-2 border rounded-lg outline-none bg-gray-50 focus:bg-white min-w-0"
                    placeholder={
                      isVarList ? "Variable Name..." : "New Entry..."
                    }
                    value={itemInputs[id] || ""}
                    onChange={(e) =>
                      setItemInputs({ ...itemInputs, [id]: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAction(id)}
                  />
                  <button
                    onClick={() => handleAction(id)}
                    className="p-2 rounded-lg bg-blue-600 text-white shrink-0 hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
    NEW LIST FORM
════════════════════════════════════════════ */
function NewListForm({ onComplete, onCancel }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("string");
  const [items, setItems] = useState([
    { val: "", t: "boolean" },
    { val: "", t: "boolean" },
    { val: "", t: "boolean" },
  ]);

  const isValid = name.trim() && items.every((i) => i.val.trim() !== "");

  const handleSubmit = () => {
    if (!isValid) return;

    const processedItems =
      type === "variable"
        ? items.map((i) => {
            let defVal = false;
            let setupPayload = {};

            if (i.t === "number") defVal = 0;
            if (i.t === "string") {
              defVal = "";
              setupPayload.allowedValues = [];
            }
            return {
              name: i.val.trim().replace(/\s+/g, "_"), // Case sensitivity preserved!
              type: i.t,
              defaultValue: defVal,
              ...setupPayload,
            };
          })
        : items.map((i) => i.val.trim());

    onComplete(name.replace(/\s+/g, "_"), type, processedItems);
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 mb-4 animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-widest">
            Create New Data Container
          </h3>
          <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">
            Requires a unique name and 3 starting entries
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-blue-400 hover:text-blue-600 shrink-0 ml-4"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-400 uppercase">
              Container Name
            </label>
            <input
              className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Combat_Stats"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-400 uppercase">
              Data Type
            </label>
            <div className="flex gap-2">
              {["string", "variable"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase transition-all ${type === t ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-blue-400 border border-blue-100"}`}
                >
                  {t === "string" ? "Standard List" : "Variable List"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-400 uppercase">
            Initial Entries (Min 3)
          </label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="flex-grow p-2 bg-white border border-blue-100 rounded-lg text-xs outline-none focus:border-blue-400 min-w-0 font-medium"
                placeholder={`Item #${idx + 1}…`}
                value={item.val}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], val: e.target.value };
                  setItems(next);
                }}
              />
              {type === "variable" && (
                <select
                  className="text-[9px] font-bold border rounded bg-white px-1 uppercase shrink-0"
                  value={item.t}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], t: e.target.value };
                    setItems(next);
                  }}
                >
                  <option value="boolean">Bool</option>
                  <option value="number">Num</option>
                  <option value="string">Text</option>
                </select>
              )}
            </div>
          ))}
          <button
            disabled={!isValid}
            onClick={handleSubmit}
            className={`w-full mt-4 py-3 rounded-xl font-black text-xs uppercase transition-all ${isValid ? "bg-green-600 text-white shadow-lg shadow-green-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            Register Container
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
    REGISTRY TAB
════════════════════════════════════════════ */
function RegistryTab() {
  const conversationRegistry = useLoreStore((s) => s.conversationRegistry);
  const registerNpc = useLoreStore((s) => s.registerNpc);
  const deleteNpcFromRegistry = useLoreStore((s) => s.deleteNpcFromRegistry);
  const addRegistryRule = useLoreStore((s) => s.addRegistryRule);
  const updateRegistryRule = useLoreStore((s) => s.updateRegistryRule);
  const deleteRegistryRule = useLoreStore((s) => s.deleteRegistryRule);
  const lists = useLoreStore((s) => s.lists);
  const listMetadata = useLoreStore((s) => s.listMetadata);
  const graphs = useLoreStore((s) => s.graphs);

  const [newNpcName, setNewNpcName] = useState("");

  const allAvailableVariables = Object.entries(lists)
    .filter(([id]) => listMetadata[id] === "variable")
    .flatMap(([_, items]) => items);

  const handleAddNpc = () => {
    if (!newNpcName.trim()) return;
    registerNpc(newNpcName.trim().replace(/\s+/g, "_")); // Case sensitivity preserved!
    setNewNpcName("");
  };

  const handleVariableChange = (npcId, ruleId, varName) => {
    const varDef = allAvailableVariables.find((v) => v.name === varName);
    let defaultVal = true;

    if (varDef?.type === "number") {
      defaultVal = 0;
    } else if (varDef?.type === "string") {
      defaultVal = varDef.defaultValue ?? varDef.allowedValues?.[0] ?? "";
    }

    updateRegistryRule(npcId, ruleId, {
      condition: {
        variable: varName,
        op: "==",
        value: defaultVal,
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end border-b pb-4">
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <Terminal size={16} className="text-blue-500" />
            Global Routing Table
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
            Map NPC IDs to logic-conditional conversations
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New NPC ID..."
            value={newNpcName}
            onChange={(e) => setNewNpcName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNpc()}
            className="p-2 border rounded-lg text-xs font-bold outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddNpc}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase"
          >
            Register NPC
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(conversationRegistry).map(([npcId, rules]) => (
          <div
            key={npcId}
            className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="bg-white px-5 py-3 border-b flex justify-between items-center">
              <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
                {npcId}
              </span>
              <button
                onClick={() => deleteNpcFromRegistry(npcId)}
                className="text-black hover:text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="relative group flex flex-col md:flex-row gap-3 items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
                >
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-10 bg-gray-900 text-white text-[8px] font-black flex items-center justify-center rounded uppercase [writing-mode:vertical-lr]">
                    Prio {rules.length - index}
                  </div>

                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {rule.condition ? (
                      (() => {
                        const varDef = allAvailableVariables.find(
                          (v) => v.name === rule.condition.variable,
                        );
                        const varType = varDef?.type || "boolean";
                        const operators =
                          varType === "number" ? lists.operators : ["==", "!="];

                        return (
                          <>
                            <select
                              value={rule.condition.variable}
                              onChange={(e) =>
                                handleVariableChange(
                                  npcId,
                                  rule.id,
                                  e.target.value,
                                )
                              }
                              className="text-[10px] font-bold p-2 bg-gray-50 border rounded-lg outline-none cursor-pointer"
                            >
                              <option value="">Select Variable...</option>
                              {Object.entries(lists)
                                .filter(
                                  ([id]) => listMetadata[id] === "variable",
                                )
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
                              value={rule.condition.op}
                              onChange={(e) =>
                                updateRegistryRule(npcId, rule.id, {
                                  condition: {
                                    ...rule.condition,
                                    op: e.target.value,
                                  },
                                })
                              }
                              className="text-[10px] font-black p-2 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg outline-none cursor-pointer"
                            >
                              {operators.map((op) => (
                                <option key={op} value={op}>
                                  {op}
                                </option>
                              ))}
                            </select>

                            <div className="w-full flex">
                              {varType === "boolean" ? (
                                <button
                                  onClick={() =>
                                    updateRegistryRule(npcId, rule.id, {
                                      condition: {
                                        ...rule.condition,
                                        value:
                                          rule.condition.value === true ||
                                          rule.condition.value === "true"
                                            ? false
                                            : true,
                                      },
                                    })
                                  }
                                  className={`w-full text-[10px] font-black uppercase py-2 px-4 rounded-lg transition-all ${
                                    rule.condition.value === true ||
                                    rule.condition.value === "true"
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-400 text-white"
                                  }`}
                                >
                                  {rule.condition.value === true ||
                                  rule.condition.value === "true"
                                    ? "True"
                                    : "False"}
                                </button>
                              ) : varType === "string" &&
                                varDef?.allowedValues &&
                                varDef.allowedValues.length > 0 ? (
                                <select
                                  value={
                                    rule.condition.value ??
                                    varDef.defaultValue ??
                                    varDef.allowedValues[0] ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateRegistryRule(npcId, rule.id, {
                                      condition: {
                                        ...rule.condition,
                                        value: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full text-[10px] font-bold p-2 bg-gray-50 border rounded-lg outline-none cursor-pointer"
                                >
                                  {varDef.allowedValues.map((val) => (
                                    <option key={val} value={val}>
                                      {val}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={
                                    varType === "number" ? "number" : "text"
                                  }
                                  placeholder={
                                    varType === "string"
                                      ? "Match text..."
                                      : "Value"
                                  }
                                  value={rule.condition.value ?? ""}
                                  onChange={(e) =>
                                    updateRegistryRule(npcId, rule.id, {
                                      condition: {
                                        ...rule.condition,
                                        value:
                                          varType === "number"
                                            ? e.target.value === ""
                                              ? 0
                                              : Number(e.target.value)
                                            : e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full text-[10px] font-bold p-2 bg-gray-50 border rounded-lg outline-none focus:border-blue-400"
                                />
                              )}
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <div className="col-span-3 flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-lg py-2">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                          Fallback Rule (Always True)
                        </span>
                      </div>
                    )}
                  </div>

                  <ArrowRight
                    className="text-gray-700 hidden md:block"
                    size={18}
                  />

                  <div className="w-full md:w-64">
                    <select
                      value={rule.graph}
                      onChange={(e) =>
                        updateRegistryRule(npcId, rule.id, {
                          graph: e.target.value,
                        })
                      }
                      className="w-full text-[10px] font-black p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg outline-none uppercase cursor-pointer"
                    >
                      <option value="">Select Target Graph...</option>
                      {Object.keys(graphs).map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => deleteRegistryRule(npcId, rule.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:text-red-900"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addRegistryRule(npcId)}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add High-Priority Rule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
    ENVIRONMENT TAB (INJECTED)
════════════════════════════════════════════ */
function EnvironmentTab() {
  const collectionDisplayMode = useLoreStore((s) => s.collectionDisplayMode);
  const setCollectionDisplayMode = useLoreStore(
    (s) => s.setCollectionDisplayMode,
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="border-b pb-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Monitor size={16} className="text-blue-500" />
          Workspace Environment
        </h3>
        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
          Configure how the React Flow canvas renders and behaves
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-black uppercase text-gray-800 mb-2">
            Collection Display Mode
          </h4>
          <p className="text-[10px] font-medium text-gray-500 mb-4 leading-relaxed max-w-2xl">
            Choose how collections operate on the main canvas. "Regular Mode"
            renders collections as massive visual boxes that contain your nodes.
            "Isolated Mode" allows you to double-click a collection to shrink
            the canvas and focus exclusively on its internal nodes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCollectionDisplayMode("regular")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                collectionDisplayMode === "regular"
                  ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-3 h-3 rounded-full ${collectionDisplayMode === "regular" ? "bg-blue-500" : "bg-gray-300"}`}
                />
                <span
                  className={`text-xs font-black uppercase ${collectionDisplayMode === "regular" ? "text-blue-700" : "text-gray-600"}`}
                >
                  Regular Mode
                </span>
              </div>
              <span className="text-[10px] text-gray-500 block ml-5">
                All nodes rendered on a single massive canvas.
              </span>
            </button>

            <button
              onClick={() => setCollectionDisplayMode("isolated")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                collectionDisplayMode === "isolated"
                  ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100"
                  : "border-gray-200 bg-white hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-3 h-3 rounded-full ${collectionDisplayMode === "isolated" ? "bg-indigo-500" : "bg-gray-300"}`}
                />
                <span
                  className={`text-xs font-black uppercase ${collectionDisplayMode === "isolated" ? "text-indigo-700" : "text-gray-600"}`}
                >
                  Isolated Mode
                </span>
              </div>
              <span className="text-[10px] text-gray-500 block ml-5">
                Double-click collections to drill-down into focused workspaces.
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
