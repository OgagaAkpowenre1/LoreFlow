import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

export const useLoreStore = create((set, get) => ({
  // --- 1. THE SCHEMA (The Blueprint) ---
  // This defines what inputs appear in your sidebar
  schema: {
    nodeFields: [
      { id: "title", label: "Scene Title", type: "text" },
      {
        id: "background",
        label: "Background Image",
        type: "list",
        listId: "backgrounds",
      },
      { id: "flags", label: "Scene Flags", type: "flag_group" }, // New Type
      { id: "music", label: "BGM Track", type: "list", listId: "music_tracks" },
      { id: "dialogueLines", label: "Dialogue Sequence", type: "sequence" }, // Nested Sequence
    ],

    sequenceFields: [
      { id: "speaker", label: "Speaker", type: "list", listId: "characters" },
      { id: "text", label: "Dialogue Text", type: "textarea" },
      {
        id: "portrait",
        label: "Portrait/Expression",
        type: "list",
        listId: "expressions",
      },
      { id: "sound", label: "SFX", type: "list", listId: "sfx_list" },
    ],
  },

  // --- 2. PREDEFINED LISTS ---
  // The "Source of Truth" for your dropdowns
  lists: {
    characters: ["Narrator", "Protagonist", "Mysterious Stranger"],
    backgrounds: ["Tavern_Night", "Forest_Path", "Castle_Gate"],
    music_tracks: ["Peaceful_Town", "Battle_Theme", "Suspense_Ambient"],
    expressions: ["Neutral", "Happy", "Angry", "Surprised"],
    sfx_list: ["Door_Creek", "Sword_Clash", "Gold_Coins"],
    available_flags: ["game_started", "has_key", "met_rival"],
  },

  // --- 3. REACT FLOW DATA ---
  nodes: [
    {
      id: "1",
      type: "dialogue",
      position: { x: 250, y: 5 },
      data: {
        title: "The Beginning",
        dialogueLines: [], // Match the schema ID
        flags: [], // Initialize flags too
      },
    },
  ],
  edges: [],

  // --- 4. ACTIONS: SCHEMA & LISTS ---

  // Add a new option to a list (e.g., adding a new character name)
  addToList: (listId, newItem) =>
    set((state) => ({
      lists: {
        ...state.lists,
        [listId]: [...(state.lists[listId] || []), newItem],
      },
    })),

  // Add a brand new field to the UI (e.g., adding "Camera Shake" to dialogue lines)
  addFieldToSchema: (target, newField) =>
    set((state) => ({
      schema: {
        ...state.schema,
        [target]: [...state.schema[target], newField],
      },
    })),

  // --- 5. ACTIONS: REACT FLOW HANDLERS ---

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // Update specific data inside a node
  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      }),
    });
  },
}));
