import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

export const ALLOWED_TYPES = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "list", label: "Dropdown List" },
  { id: "flag_group", label: "Logic Flags" },
  { id: "sequence", label: "Dialogue Sequence" },
];

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

  ALLOWED_TYPES: [
    { id: "text", label: "Short Text" },
    { id: "textarea", label: "Long Text / Body" },
    { id: "number", label: "Numeric Value" },
    { id: "list", label: "Dropdown List" },
    { id: "flag_group", label: "Game Logic Flags" },
    { id: "sequence", label: "Dialogue Sequence" },
  ],

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
      type: "scene",
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
  // updateNodeData: (nodeId, newData) => {
  //   set({
  //     nodes: get().nodes.map((node) => {
  //       if (node.id === nodeId) {
  //         return { ...node, data: newData };
  //       }
  //       return node;
  //     }),
  //   });
  // },

  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: newData } : node,
      ),
    }));
  },

  // --- NEW ACTIONS FOR SETTINGS ---

  // Remove a field from the schema (e.g., deciding you don't need 'BGM Track' anymore)
  removeFieldFromSchema: (target, fieldId) =>
    set((state) => ({
      schema: {
        ...state.schema,
        [target]: state.schema[target].filter((f) => f.id !== fieldId),
      },
    })),

  // Create a brand new empty list (e.g., 'WeaponTypes')
  createNewList: (listId) =>
    set((state) => ({
      lists: {
        ...state.lists,
        [listId]: [],
      },
    })),

  // Delete an entire list
  deleteList: (listId) =>
    set((state) => {
      if (listId === "available_flags") {
        alert(
          "System Error: 'available_flags' is a core logic list and cannot be deleted.",
        );
        return state;
      }
      const newLists = { ...state.lists };
      delete newLists[listId];
      return { lists: newLists };
    }),

  // Remove a specific item from a list
  removeItemFromList: (listId, index) =>
    set((state) => ({
      lists: {
        ...state.lists,
        [listId]: state.lists[listId].filter((_, i) => i !== index),
      },
    })),

  // Update a specific item in a list
  updateItemInList: (listId, index, newValue) =>
    set((state) => {
      const newList = [...state.lists[listId]];
      newList[index] = newValue;
      return {
        lists: { ...state.lists, [listId]: newList },
      };
    }),

  editingNodeId: null, // New property

  setEditingNode: (id) => set({ editingNodeId: id }),
}));
