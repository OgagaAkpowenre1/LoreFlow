// import React, { useState } from "react";
// import { useLoreStore, ALLOWED_TYPES } from "../store";
// import {
//   Trash2,
//   Plus,
//   Settings,
//   Database,
//   Layout,
//   X,
//   Check,
//   Save,
// } from "lucide-react";

// export default function SettingsEditor({ isOpen, onClose }) {
//   const [activeTab, setActiveTab] = useState("schema");
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
//       <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
//         <header className="bg-gray-900 text-white p-5 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <div className="bg-blue-500 p-2 rounded-lg">
//               <Settings size={20} className="text-white" />
//             </div>
//             <div>
//               <h2 className="font-bold uppercase tracking-widest text-sm">
//                 Engine Configuration
//               </h2>
//               <p className="text-[10px] text-gray-400 uppercase">
//                 Manage Blueprints & Global Data
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="hover:bg-gray-800 p-2 rounded-full transition-colors"
//           >
//             <X size={20} />
//           </button>
//         </header>

//         <div className="flex flex-grow overflow-hidden">
//           <nav className="w-56 flex-shrink-0 bg-gray-50 border-r p-6 space-y-3">
//             <button
//               onClick={() => setActiveTab("schema")}
//               className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
//                 activeTab === "schema"
//                   ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
//                   : "text-gray-500 hover:bg-gray-100"
//               }`}
//             >
//               <Layout size={16} /> Blueprints
//             </button>
//             <button
//               onClick={() => setActiveTab("lists")}
//               className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
//                 activeTab === "lists"
//                   ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
//                   : "text-gray-500 hover:bg-gray-100"
//               }`}
//             >
//               <Database size={16} /> Global Lists
//             </button>
//           </nav>

//           <main className="flex-grow min-w-0 p-8 overflow-y-auto bg-white">
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
//   const [isAdding, setIsAdding] = useState(false);

//   // Form State
//   const [newField, setNewField] = useState({
//     id: "",
//     label: "",
//     type: "text",
//     listId: "",
//   });

//   const handleSave = () => {
//     if (!newField.id || !newField.label) return;
//     addFieldToSchema(target, newField);
//     setNewField({ id: "", label: "", type: "text", listId: "" });
//     setIsAdding(false);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <select
//           className="bg-gray-100 font-bold text-sm p-2 rounded-lg outline-none border-r-8 border-transparent"
//           value={target}
//           onChange={(e) => setTarget(e.target.value)}
//         >
//           <option value="nodeFields">Scene Node Blueprint</option>
//           <option value="sequenceFields">Dialogue Line Blueprint</option>
//         </select>

//         <button
//           onClick={() => setIsAdding(true)}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
//         >
//           <Plus size={16} /> New Field
//         </button>
//       </div>

//       {/* ADD FIELD FORM (The "Modal" Replacement) */}
//       {isAdding && (
//         <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-blue-400 uppercase">
//               Technical ID
//             </label>
//             <input
//               className="w-full p-2 text-xs border rounded bg-white"
//               placeholder="e.g. cam_zoom"
//               value={newField.id}
//               onChange={(e) => setNewField({ ...newField, id: e.target.value })}
//             />
//           </div>
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-blue-400 uppercase">
//               Display Label
//             </label>
//             <input
//               className="w-full p-2 text-xs border rounded bg-white"
//               placeholder="e.g. Camera Zoom"
//               value={newField.label}
//               onChange={(e) =>
//                 setNewField({ ...newField, label: e.target.value })
//               }
//             />
//           </div>
//           <div className="space-y-1">
//             <label className="text-[10px] font-bold text-blue-400 uppercase">
//               Data Type
//             </label>
//             <select
//               className="w-full p-2 text-xs border rounded bg-white"
//               value={newField.type}
//               onChange={(e) =>
//                 setNewField({ ...newField, type: e.target.value })
//               }
//             >
//               {ALLOWED_TYPES.map((t) => (
//                 <option key={t.id} value={t.id}>
//                   {t.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="flex items-end gap-2">
//             {newField.type === "list" && (
//               <select
//                 className="flex-grow p-2 text-xs border border-orange-300 rounded bg-white"
//                 value={newField.listId}
//                 onChange={(e) =>
//                   setNewField({ ...newField, listId: e.target.value })
//                 }
//               >
//                 <option value="">Select Data Source...</option>
//                 {Object.keys(lists)
//                   // FILTER: Don't show the flags list for a regular dropdown field
//                   .filter((listKey) => listKey !== "available_flags")
//                   .map((l) => (
//                     <option key={l} value={l}>
//                       {l}
//                     </option>
//                   ))}
//               </select>
//             )}

//             {/* Logic: If they pick flag_group, we auto-assign available_flags in the background */}
//             {newField.type === "flag_group" && (
//               <div className="flex-grow p-2 text-[10px] text-orange-600 bg-orange-50 rounded border border-orange-200">
//                 Auto-linked to: <strong>variables list</strong>
//               </div>
//             )}
//             <button
//               onClick={handleSave}
//               className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
//             >
//               <Check size={18} />
//             </button>
//             <button
//               onClick={() => setIsAdding(false)}
//               className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 gap-3">
//         {schema[target].map((field) => (
//           <div
//             key={field.id}
//             className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl group hover:border-blue-300 transition-colors"
//           >
//             <div className="flex items-center gap-4">
//               <div className="p-2 bg-white rounded-lg shadow-sm">
//                 <Layout size={16} className="text-gray-400" />
//               </div>
//               <div>
//                 <p className="text-sm font-bold text-gray-800">{field.label}</p>
//                 <p className="text-[10px] text-gray-400 font-mono italic flex gap-2">
//                   <span>ID: {field.id}</span>
//                   <span className="text-blue-500 uppercase font-bold">
//                     • {field.type}
//                   </span>
//                   {field.listId && (
//                     <span className="text-orange-500">
//                       • List: {field.listId}
//                     </span>
//                   )}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => removeFieldFromSchema(target, field.id)}
//               className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
//             >
//               <Trash2 size={18} />
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function ListsTab() {
//   const { lists, listMetadata, addToList, removeItemFromList, createNewList } = useLoreStore();
//   const [isCreating, setIsCreating] = useState(false);
//   const [itemInputs, setItemInputs] = useState({});
//   const [selectedTypes, setSelectedTypes] = useState({});

//   const handleAction = (listId) => {
//     const val = itemInputs[listId];
//     if (!val) return;

//     // FIX: Check if the list is a variable list via metadata
//     if (listMetadata[listId] === "variable") {
//       // Assign the type currently selected for THIS specific list
//       const typeToAssign = selectedTypes[listId] || "boolean";
//       addToList(listId, { name: val, type: typeToAssign });
//     } else {
//       addToList(listId, val);
//     }

//     setItemInputs({ ...itemInputs, [listId]: "" });
//   };

//   return (
//     // Force w-full and match SchemaTab spacing
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
//             Global Data Containers
//           </h3>
//         </div>
//         {!isCreating && (
//           <button
//             onClick={() => setIsCreating(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md"
//           >
//             <Plus size={16} /> New List
//           </button>
//         )}
//       </div>

//       {isCreating && (
//         <NewListForm
//           onCancel={() => setIsCreating(false)}
//           onComplete={(name, type, items) => {
//             createNewList(name, type, items);
//             setIsCreating(false);
//           }}
//         />
//       )}

//       {/* Grid container with forced full width */}
//       <div className="grid grid-cols-2 gap-4">
//         {Object.entries(lists).map(([id, items]) => {
//           const isVarList = listMetadata[id] === "variable";
//           const currentType = selectedTypes[id] || "boolean";

//           return (
//             <div key={id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col h-[320px] min-w-0">
//               <div className="flex justify-between items-center mb-3">
//                 <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{id}</h4>
//                 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${isVarList ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
//                   {isVarList ? 'Variable' : 'String'}
//                 </span>
//               </div>

//               <div className="flex-grow overflow-y-auto mb-3 flex flex-wrap gap-1.5 content-start">
//                 {items.map((item, i) => (
//                   <div key={i} className="group relative">
//                     <span className="text-[11px] font-bold px-2 py-1 rounded-md border bg-gray-50 text-gray-600 border-gray-200">
//                       {typeof item === "object" ? `${item.name} (${item.type})` : item}
//                     </span>
//                     <button onClick={() => removeItemFromList(id, i)} className="absolute -top-[-3] -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <X size={8} />
//                     </button>
//                   </div>
//                 ))}
//               </div>

//               <div className="space-y-2 pt-3 border-t">
//                 {isVarList && (
//                   <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md">
//                     {["boolean", "number"].map((t) => (
//                       <button
//                         key={t}
//                         onClick={() => setSelectedTypes(prev => ({...prev, [id]: t}))}
//                         className={`flex-grow py-1 rounded text-[8px] font-black uppercase transition-all ${
//                           currentType === t ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"
//                         }`}
//                       >
//                         {t}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//                 <div className="flex gap-1.5">
//                   <input
//                     className="flex-grow text-[11px] p-2 border rounded-lg outline-none bg-gray-50 focus:bg-white"
//                     placeholder="Value..."
//                     value={itemInputs[id] || ""}
//                     onChange={(e) => setItemInputs({ ...itemInputs, [id]: e.target.value })}
//                   />
//                   <button onClick={() => handleAction(id)} className="p-2 rounded-lg bg-blue-600 text-white">
//                     <Plus size={14} />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function NewListForm({ onComplete, onCancel }) {
//   const [name, setName] = useState("");
//   const [type, setType] = useState("string");
//   // const [items, setItems] = useState(["", "", ""]); // Forced 3 items

//   // const isValid = name.trim() && items.every((i) => i.trim() !== "");

//   // const handleSubmit = () => {
//   //   if (!isValid) return;

//   // Process items based on type
//   //   const processedItems =
//   //     type === "variable"
//   //       ? items.map((i) => ({ name: i, type: "boolean" })) // Default to boolean
//   //       : items;

//   //   onComplete(name.replace(/\s+/g, "_").toLowerCase(), type, processedItems);
//   // };

//   // Track items AND their individual types
//   const [items, setItems] = useState([
//     { val: "", t: "boolean" },
//     { val: "", t: "boolean" },
//     { val: "", t: "boolean" },
//   ]);

//   const isValid = name.trim() && items.every((i) => i.val.trim() !== "");

//   const handleSubmit = () => {
//     if (!isValid) return;

//     const processedItems =
//       type === "variable"
//         ? items.map((i) => ({ name: i.val, type: i.t }))
//         : items.map((i) => i.val);

//     onComplete(name.replace(/\s+/g, "_").toLowerCase(), type, processedItems);
//   };

//   return (
//     <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 animate-in fade-in zoom-in duration-200">
//       <div className="flex justify-between items-start mb-6">
//         <div>
//           <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">
//             Create New Data Container
//           </h3>
//           <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">
//             Requires a unique name and 3 starting entries
//           </p>
//         </div>
//         <button
//           onClick={onCancel}
//           className="text-blue-400 hover:text-blue-600"
//         >
//           <X size={20} />
//         </button>
//       </div>

//       <div className="grid grid-cols-2 gap-8">
//         <div className="space-y-4">
//           <div className="space-y-1">
//             <label className="text-[10px] font-black text-blue-400 uppercase">
//               Container Name
//             </label>
//             <input
//               className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400"
//               placeholder="e.g. Combat_Stats"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//             />
//           </div>
//           <div className="space-y-1">
//             <label className="text-[10px] font-black text-blue-400 uppercase">
//               Data Type
//             </label>
//             <div className="flex gap-2">
//               {["string", "variable"].map((t) => (
//                 <button
//                   key={t}
//                   onClick={() => setType(t)}
//                   className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
//                     type === t
//                       ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
//                       : "bg-white text-blue-400 border border-blue-100"
//                   }`}
//                 >
//                   {t === "string" ? "Standard List" : "Variable List"}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="space-y-2">
//           <label className="text-[10px] font-black text-blue-400 uppercase">
//             Initial Entries (Min 3)
//           </label>
//           {/* {items.map((item, idx) => (
//             <input
//               key={idx}
//               className="w-full p-2 bg-white border border-blue-100 rounded-lg text-xs outline-none focus:border-blue-400"
//               placeholder={`Item #${idx + 1}...`}
//               value={item}
//               onChange={(e) => {
//                 const next = [...items];
//                 next[idx] = e.target.value;
//                 setItems(next);
//               }}
//             />
//           ))} */}
//           {items.map((item, idx) => (
//             <div key={idx} className="flex gap-2">
//               <input
//                 className="flex-grow p-2 bg-white border border-blue-100 rounded-lg text-xs outline-none focus:border-blue-400"
//                 placeholder={`Item #${idx + 1}...`}
//                 value={item.val}
//                 onChange={(e) => {
//                   const next = [...items];
//                   next[idx].val = e.target.value;
//                   setItems(next);
//                 }}
//               />

//               {/* Only show the sub-type toggle if the container is a 'variable' type */}
//               {type === "variable" && (
//                 <select
//                   className="text-[9px] font-bold border rounded bg-white px-1 uppercase"
//                   value={item.t}
//                   onChange={(e) => {
//                     const next = [...items];
//                     next[idx].t = e.target.value;
//                     setItems(next);
//                   }}
//                 >
//                   <option value="boolean">Bool</option>
//                   <option value="number">Num</option>
//                 </select>
//               )}
//             </div>
//           ))}
//           <button
//             disabled={!isValid}
//             onClick={handleSubmit}
//             className={`w-full mt-4 py-3 rounded-xl font-black text-xs uppercase transition-all ${
//               isValid
//                 ? "bg-green-600 text-white shadow-lg shadow-green-200"
//                 : "bg-gray-200 text-gray-400 cursor-not-allowed"
//             }`}
//           >
//             Register Container
//           </button>
//         </div>
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
    <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] sm:h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
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
                Manage Blueprints &amp; Global Data
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
          {/* ── Sidebar ── collapses to icon-only below lg */}
          <nav
            className="
            w-12 sm:w-14 lg:w-56
            shrink-0 bg-gray-50 border-r
            flex flex-col items-center lg:items-stretch
            gap-2 p-2 sm:p-3 lg:p-6
          "
          >
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
          </nav>

          {/* ── Main content ── */}
          <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white">
            {activeTab === "schema" ? <SchemaTab /> : <ListsTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

/* Sidebar button — shows label only at lg+ */
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
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/* ════════════════════════════════════════════
   SCHEMA TAB
════════════════════════════════════════════ */
function SchemaTab() {
  const { schema, addFieldToSchema, removeFieldFromSchema, lists } =
    useLoreStore();
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

      {/* Add-field form — 1 col → 2 col → 4 col */}
      {isAdding && (
        <div
          className="
          bg-blue-50 border border-blue-200 p-4 rounded-xl
          grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3
          animate-in fade-in slide-in-from-top-2
        "
        >
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

          {/* Actions / list picker */}
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
                  .filter((k) => k !== "available_flags")
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
        {schema[target].map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl group hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Layout size={15} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {field.label}
                </p>
                <p className="text-[10px] text-gray-400 font-mono italic flex flex-wrap gap-x-2">
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
              className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   LISTS TAB
════════════════════════════════════════════ */
function ListsTab() {
  const {
    lists,
    listMetadata,
    addToList,
    removeItemFromList,
    createNewList,
    deleteList,
    updateItemInList,
    updateVariable,
  } = useLoreStore();

  const [isCreating, setIsCreating] = useState(false);
  const [itemInputs, setItemInputs] = useState({});
  const [selectedTypes, setSelectedTypes] = useState({});

  const handleAction = (listId) => {
    const val = itemInputs[listId];
    if (!val) return;
    if (listMetadata[listId] === "variable") {
      addToList(listId, {
        name: val,
        type: selectedTypes[listId] || "boolean",
      });
    } else {
      addToList(listId, val);
    }
    setItemInputs({ ...itemInputs, [listId]: "" });
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
              /* FIX 1: Set a fixed height (h-[380px]) instead of min-h */
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col h-[380px] overflow-hidden"
            >
              {/* Header - Fixed height */}
              <div className="flex justify-between items-center mb-3 shrink-0 gap-2">
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest truncate">
                  {id}
                </h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isVarList
                        ? "bg-orange-100 text-orange-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isVarList ? "Variable" : "String"}
                  </span>
                  {id !== "variables" && (
                    <button
                      onClick={() => deleteList(id)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Editable Tags Area - FIX 2: This child grows and scrolls */}
              <div className="flex-grow overflow-y-auto mb-3 pr-2 flex flex-wrap gap-2 content-start scrollbar-thin scrollbar-thumb-gray-200">
                {items.map((item, i) => (
                  <div key={i} className="group relative flex items-center">
                    {isVarList ? (
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md pr-1 transition-all focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateVariable(id, i, "name", e.target.value)
                          }
                          className="bg-transparent text-[11px] font-bold px-2 py-1 outline-none w-24 sm:w-32"
                        />
                        <select
                          value={item.type}
                          onChange={(e) =>
                            updateVariable(id, i, "type", e.target.value)
                          }
                          className="text-[8px] font-black uppercase bg-white border border-gray-200 rounded px-1 py-0.5 outline-none"
                        >
                          <option value="boolean">Bool</option>
                          <option value="number">Num</option>
                        </select>

                        <div className="h-4 w-px bg-gray-200 mx-1" />

                        {/* Default Value Input */}
                        <div className="flex items-center gap-1.5">
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
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-12 bg-white border border-gray-200 rounded text-[10px] font-bold px-1 outline-none"
                            />
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
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${
                                item.defaultValue
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-white"
                              }`}
                            >
                              {item.defaultValue ? "True" : "False"}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item}
                        onChange={(e) =>
                          updateItemInList(id, i, e.target.value)
                        }
                        className="text-[11px] font-bold px-2 py-1 rounded-md border bg-gray-50 text-gray-600 border-gray-200 outline-none focus:bg-white focus:border-blue-400 transition-all"
                      />
                    )}

                    <button
                      onClick={() => removeItemFromList(id, i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer - Fixed at bottom via shrink-0 */}
              <div className="space-y-2 pt-3 border-t border-gray-100 shrink-0 bg-white">
                {isVarList && (
                  <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md">
                    {["boolean", "number"].map((t) => (
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
                        {t}
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
        ? items.map((i) => ({ name: i.val, type: i.t }))
        : items.map((i) => i.val);
    onComplete(name.replace(/\s+/g, "_").toLowerCase(), type, processedItems);
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

      {/* 1 col on mobile, 2 on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: name + type */}
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
                  className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                    type === t
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-white text-blue-400 border border-blue-100"
                  }`}
                >
                  {t === "string" ? "Standard List" : "Variable List"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: initial entries */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-blue-400 uppercase">
            Initial Entries (Min 3)
          </label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="flex-grow p-2 bg-white border border-blue-100 rounded-lg text-xs outline-none focus:border-blue-400 min-w-0"
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
                </select>
              )}
            </div>
          ))}
          <button
            disabled={!isValid}
            onClick={handleSubmit}
            className={`w-full mt-4 py-3 rounded-xl font-black text-xs uppercase transition-all ${
              isValid
                ? "bg-green-600 text-white shadow-lg shadow-green-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Register Container
          </button>
        </div>
      </div>
    </div>
  );
}
