import React, { useState } from "react";
import { useLoreStore } from "../store";
import { Trash2, Plus, Settings, Database, Layout, X } from "lucide-react";

export default function SettingsEditor({ isOpen, onClose }) {
  const {
    schema,
    lists,
    addFieldToSchema,
    removeFieldFromSchema,
    createNewList,
    deleteList,
  } = useLoreStore();
  const [activeTab, setActiveTab] = useState("schema");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-blue-400" />
            <h2 className="font-bold uppercase tracking-widest text-sm">
              Engine Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-800 p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex flex-grow overflow-hidden">
          {/* Sidebar Tabs */}
          <nav className="w-48 bg-gray-50 border-r p-4 space-y-2">
            <button
              onClick={() => setActiveTab("schema")}
              className={`w-full flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTab === "schema" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <Layout size={14} /> Blueprints
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`w-full flex items-center gap-2 p-2 rounded text-xs font-bold ${activeTab === "lists" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <Database size={14} /> Global Lists
            </button>
          </nav>

          {/* Content Area */}
          <main className="flex-grow p-6 overflow-y-auto">
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

  const handleAddField = () => {
    const id = prompt("Enter unique field ID (e.g., 'cam_angle'):");
    if (!id) return;
    const label = prompt("Enter display label (e.g., 'Camera Angle'):");
    const type = prompt("Type (text, textarea, list, flag_group):", "text");

    let listId = "";
    if (type === "list") {
      listId = prompt("Enter the ID of the list to use (from Global Lists):");
    }

    addFieldToSchema(target, { id, label, type, listId });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-end border-b pb-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {target === "nodeFields"
              ? "Scene Blueprint"
              : "Dialogue Line Blueprint"}
          </h3>
          <div className="flex gap-2">
            <select
              className="text-xs border rounded p-1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="nodeFields">Scene Node</option>
              <option value="sequenceFields">Dialogue Line</option>
            </select>
            <button
              onClick={handleAddField}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
            >
              <Plus size={14} /> Add Field
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {schema[target].map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg group"
            >
              <div>
                <p className="text-sm font-bold text-gray-700">{field.label}</p>
                <p className="text-[10px] text-gray-400 font-mono italic">
                  {field.id} • Type: {field.type}
                </p>
              </div>
              <button
                onClick={() => removeFieldFromSchema(target, field.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListsTab() {
  const { lists, createNewList, deleteList } = useLoreStore();

  const handleCreateList = () => {
    const id = prompt("Enter New List ID (e.g. 'locations'):");
    if (id) createNewList(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-bold text-gray-800">
          Global Predefined Lists
        </h3>
        <button
          onClick={handleCreateList}
          className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
        >
          <Plus size={14} /> New List
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(lists).map(([id, items]) => (
          <div
            key={id}
            className="border rounded-lg p-4 bg-gray-50 relative group"
          >
            <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">
              {id}
            </h4>
            <div className="flex flex-wrap gap-1">
              {items.map((item, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-white border px-2 py-0.5 rounded shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
            <button
              onClick={() => deleteList(id)}
              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
