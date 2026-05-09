import React, { useRef } from "react";
import { Upload } from "lucide-react";
import { useLoreStore } from "../store";

export default function ImportButton() {
  const fileInputRef = useRef(null);
  const importProject = useLoreStore((state) => state.importProject);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      importProject(e.target.result);
    };
    reader.readAsText(file);

    // Reset input so the same file can be uploaded twice if needed
    event.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".lore,.json"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current.click()}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
      >
        <Upload size={24} className="text-blue-500" /> Load Project
      </button>
    </>
  );
}
