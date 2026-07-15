// Global project metadata, localization state, schema definitions, and
// the basic setters that touch only this slice's own fields.
import { createEmptyGraph } from "./utils";

export const createCoreSlice = (set, get) => ({
  // GLOBAL STATE
  projectName: "Untitled Lore",
  activeGraph: "Main Story",
  startGraph: "Main Story",
  graphs: { "Main Story": createEmptyGraph() },
  viewports: { "Main Story": { x: 0, y: 0, zoom: 1 } },
  graphFolders: [],
  activeFolder: null,
  conversationRegistry: {},
  editingNodeId: null,
  sidebarOpen: true, // Restored state property
  isSimulatorOpen: false,

  // LOCALIZATION STATE
  languages: ["en"],
  currentLanguage: "en",
  locales: { en: {} },

  // SCHEMA DEFINITIONS
  schema: {
    nodeFields: [
      { id: "title", label: "Scene Title", type: "text", core: true },
      {
        id: "background",
        label: "Background Image",
        type: "list",
        listId: "backgrounds",
      },
      { id: "flags", label: "Scene Flags", type: "flag_group", core: true },
      {
        id: "music",
        label: "BGM Track",
        type: "list",
        listId: "music_tracks",
      },
      {
        id: "dialogueLines",
        label: "Dialogue Sequence",
        type: "sequence",
        core: true,
      },
      {
        id: "choices",
        label: "Branching Choices",
        type: "choice_list",
        core: true,
      },
    ],
    sequenceFields: [
      {
        id: "speaker",
        label: "Speaker",
        type: "list",
        listId: "characters",
        core: true,
      },
      { id: "text", label: "Dialogue Text", type: "textarea", core: true },
      {
        id: "portrait",
        label: "Portrait/Expression",
        type: "list",
        listId: "expressions",
      },
      { id: "sound", label: "SFX", type: "list", listId: "sfx_list" },
    ],
    logicFields: [
      {
        id: "check_flag",
        label: "Target Flag",
        type: "list",
        listId: "available_flags",
      },
      {
        id: "operator",
        label: "Comparison",
        type: "list",
        listId: "operators",
      },
      { id: "value", label: "Value to Check", type: "text" },
    ],
  },

  listMetadata: {
    characters: "string",
    backgrounds: "string",
    music_tracks: "string",
    expressions: "string",
    sfx_list: "string",
    variables: "variable",
    operators: "string",
  },

  lists: {
    characters: ["Narrator", "Protagonist", "Mysterious Stranger"],
    backgrounds: ["Tavern_Night", "Forest_Path", "Castle_Gate"],
    music_tracks: ["Peaceful_Town", "Battle_Theme", "Suspense_Ambient"],
    expressions: ["Neutral", "Happy", "Angry", "Surprised"],
    sfx_list: ["Door_Creek", "Sword_Clash", "Gold_Coins"],
    variables: [
      { name: "game_started", type: "boolean", defaultValue: false },
      { name: "gold_amount", type: "number", defaultValue: 0 },
    ],
    operators: ["==", "!=", ">", "<", ">=", "<="],
  },

  // Legacy holders preserved exclusively for fallback hydration context mapping
  nodes: [],
  edges: [],

  updateProjectName: (name) => set({ projectName: name }),
  setActiveGraph: (name) => set({ activeGraph: name, editingNodeId: null }),
  setStartGraph: (name) => set({ startGraph: name }),
  setEditingNode: (id) => set({ editingNodeId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })), // Restored Action
  toggleSimulator: () =>
    set((state) => ({ isSimulatorOpen: !state.isSimulatorOpen })),
});
