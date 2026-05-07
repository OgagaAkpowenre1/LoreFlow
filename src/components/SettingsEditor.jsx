// import React, { useState } from "react";
// import { useLoreStore } from "../store";
// import { Trash2, Plus, Settings, Database, Layout, X } from "lucide-react";

// export default function SettingsEditor({ isOpen, onClose }) {
//   const {
//     schema,
//     lists,
//     addFieldToSchema,
//     removeFieldFromSchema,
//     createNewList,
//     deleteList,
//   } = useLoreStore();
//   const [activeTab, setActiveTab] = useState("schema");

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
//       <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
//         {/* Header */}
//         <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <Settings size={20} className="text-blue-400" />
//             <h2 className="font-bold uppercase tracking-widest text-sm">
//               Engine Settings
//             </h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="hover:bg-gray-800 p-1 rounded-full"
//           >
//             <X size={20} />
//           </button>
//         </header>

//         <div className="flex flex-grow overflow-hidden">
//           {/* Sidebar Tabs */}
//           <nav className="w-48 bg-gray-50 border-r p-4 space-y-2">
//             <button
//               onClick={() => setActiveTab("schema")}
//               className={`w-full flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTab === "schema" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
//             >
//               <Layout size={14} /> Blueprints
//             </button>
//             <button
//               onClick={() => setActiveTab("lists")}
//               className={`w-full flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTab === "lists" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
//             >
//               <Database size={14} /> Global Lists
//             </button>
//           </nav>

//           {/* Content Area */}
//           <main className="flex-grow p-6 overflow-y-auto">
//             {activeTab === "schema" ? <SchemaTab /> : <ListsTab />}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// function SchemaTab() {
//   const { schema, addFieldToSchema, removeFieldFromSchema, lists } =
//     useLoreStore();
//   const [target, setTarget] = useState("nodeFields");

//   const handleAddField = () => {
//     const id = prompt("Enter unique field ID (e.g., 'cam_angle'):");
//     if (!id) return;
//     const label = prompt("Enter display label (e.g., 'Camera Angle'):");
//     const type = prompt("Type (text, textarea, list, flag_group):", "text");

//     let listId = "";
//     if (type === "list") {
//       listId = prompt("Enter the ID of the list to use (from Global Lists):");
//     }

//     addFieldToSchema(target, { id, label, type, listId });
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <div className="flex justify-between items-end border-b pb-2 mb-4">
//           <h3 className="text-lg font-bold text-gray-800">
//             {target === "nodeFields"
//               ? "Scene Blueprint"
//               : "Dialogue Line Blueprint"}
//           </h3>
//           <div className="flex gap-2">
//             <select
//               className="text-xs border rounded p-1"
//               value={target}
//               onChange={(e) => setTarget(e.target.value)}
//             >
//               <option value="nodeFields">Scene Node</option>
//               <option value="sequenceFields">Dialogue Line</option>
//             </select>
//             <button
//               onClick={handleAddField}
//               className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
//             >
//               <Plus size={14} /> Add Field
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-2">
//           {schema[target].map((field) => (
//             <div
//               key={field.id}
//               className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg group"
//             >
//               <div>
//                 <p className="text-sm font-bold text-gray-700">{field.label}</p>
//                 <p className="text-[10px] text-gray-400 font-mono italic">
//                   {field.id} • Type: {field.type}
//                 </p>
//               </div>
//               <button
//                 onClick={() => removeFieldFromSchema(target, field.id)}
//                 className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
//               >
//                 <Trash2 size={16} />
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function ListsTab() {
//   const { lists, createNewList, deleteList } = useLoreStore();

//   const handleCreateList = () => {
//     const id = prompt("Enter New List ID (e.g. 'locations'):");
//     if (id) createNewList(id);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center border-b pb-2">
//         <h3 className="text-lg font-bold text-gray-800">
//           Global Predefined Lists
//         </h3>
//         <button
//           onClick={handleCreateList}
//           className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
//         >
//           <Plus size={14} /> New List
//         </button>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         {Object.entries(lists).map(([id, items]) => (
//           <div
//             key={id}
//             className="border rounded-lg p-4 bg-gray-50 relative group"
//           >
//             <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">
//               {id}
//             </h4>
//             <div className="flex flex-wrap gap-1">
//               {items.map((item, i) => (
//                 <span
//                   key={i}
//                   className="text-[10px] bg-white border px-2 py-0.5 rounded shadow-sm"
//                 >
//                   {item}
//                 </span>
//               ))}
//             </div>
//             <button
//               onClick={() => deleteList(id)}
//               className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
//             >
//               <Trash2 size={14} />
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

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
  Save,
} from "lucide-react";

export default function SettingsEditor({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("schema");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <header className="bg-gray-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold uppercase tracking-widest text-sm">
                Engine Configuration
              </h2>
              <p className="text-[10px] text-gray-400 uppercase">
                Manage Blueprints & Global Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex flex-grow overflow-hidden">
          <nav className="w-56 bg-gray-50 border-r p-6 space-y-3">
            <button
              onClick={() => setActiveTab("schema")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "schema"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Layout size={16} /> Blueprints
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "lists"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Database size={16} /> Global Lists
            </button>
          </nav>

          <main className="flex-grow p-8 overflow-y-auto bg-white">
            {activeTab === "schema" ? <SchemaTab /> : <ListsTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

function SchemaTab() {
  const { schema, addFieldToSchema, removeFieldFromSchema, lists } =
    useLoreStore();
  const [target, setTarget] = useState("nodeFields");
  const [isAdding, setIsAdding] = useState(false);

  // Form State
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <select
          className="bg-gray-100 font-bold text-sm p-2 rounded-lg outline-none border-r-8 border-transparent"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="nodeFields">Scene Node Blueprint</option>
          <option value="sequenceFields">Dialogue Line Blueprint</option>
        </select>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={16} /> New Field
        </button>
      </div>

      {/* ADD FIELD FORM (The "Modal" Replacement) */}
      {isAdding && (
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
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
                <option value="">Select Data Source...</option>
                {Object.keys(lists)
                  // FILTER: Don't show the flags list for a regular dropdown field
                  .filter((listKey) => listKey !== "available_flags")
                  .map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
              </select>
            )}

            {/* Logic: If they pick flag_group, we auto-assign available_flags in the background */}
            {newField.type === "flag_group" && (
              <div className="flex-grow p-2 text-[10px] text-orange-600 bg-orange-50 rounded border border-orange-200">
                Auto-linked to: <strong>available_flags</strong>
              </div>
            )}
            <button
              onClick={handleSave}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {schema[target].map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl group hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Layout size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{field.label}</p>
                <p className="text-[10px] text-gray-400 font-mono italic flex gap-2">
                  <span>ID: {field.id}</span>
                  <span className="text-blue-500 uppercase font-bold">
                    • {field.type}
                  </span>
                  {field.listId && (
                    <span className="text-orange-500">
                      • List: {field.listId}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeFieldFromSchema(target, field.id)}
              className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListsTab() {
  const { lists, createNewList, deleteList, addToList } = useLoreStore();
  const [newListId, setNewListId] = useState("");
  const [itemInputs, setItemInputs] = useState({}); // Track input per list

  const handleCreate = () => {
    if (!newListId) return;
    createNewList(newListId);
    setNewListId("");
  };

  const handleAddItem = (listId) => {
    const val = itemInputs[listId];
    if (!val) return;
    addToList(listId, val);
    setItemInputs((prev) => ({ ...prev, [listId]: "" }));
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-3 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
        <input
          placeholder="New List ID (e.g. sound_effects)"
          className="flex-grow p-3 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-green-500"
          value={newListId}
          onChange={(e) => setNewListId(e.target.value)}
        />
        <button
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Create List
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {Object.entries(lists).map(([id, items]) => (
          <div
            key={id}
            className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col h-[280px]"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">
                {id}
              </h4>
              <button
                onClick={() => deleteList(id)}
                className="text-gray-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Scrollable Items Area */}
            <div className="flex-grow overflow-y-auto mb-4 flex flex-wrap gap-2 align-start content-start">
              {items.map((item, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  {item}
                </span>
              ))}
              {items.length === 0 && (
                <p className="text-[10px] text-gray-400 italic">
                  No values yet.
                </p>
              )}
            </div>

            {/* DIRECT VALUE ADDITION */}
            <div className="flex gap-2 pt-4 border-t">
              <input
                className="flex-grow text-xs p-2 border rounded-lg bg-gray-50 focus:bg-white outline-none"
                placeholder="Add value..."
                value={itemInputs[id] || ""}
                onChange={(e) =>
                  setItemInputs({ ...itemInputs, [id]: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddItem(id)}
              />
              <button
                onClick={() => handleAddItem(id)}
                className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}