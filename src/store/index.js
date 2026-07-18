import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { getActiveStorageAdapter, PERSIST_KEY } from "./persistAdapter";
import { createCoreSlice } from "./coreSlice";
import { createGraphSlice } from "./graphSlice";
import { createFlowSlice } from "./flowSlice";
import { createSchemaListsSlice } from "./schemaListsSlice";
import { createRegistrySlice } from "./registrySlice";
import { createExportSlice } from "./exportSlice";

export { ALLOWED_TYPES } from "./constants";

// ---------------------------------------------------------------------------
// STORE ARCHITECTURE
//
// The store is composed from feature slices (see ./*.js) using zustand's
// standard "slices" pattern: every slice is a (set, get) => ({ ...fields })
// function, and they're all merged into one flat store below. This is still
// a single store — set()/get() are shared across all slices, so actions in
// one slice can freely read/update fields owned by another (e.g. export
// actions reading `graphs` from the flow slice). Splitting into files is
// purely for readability/debugging; it changes nothing about how components
// call useLoreStore(...).
// ---------------------------------------------------------------------------

export const useLoreStore = create(
  persist(
    (set, get) => ({
      ...createCoreSlice(set, get),
      ...createGraphSlice(set, get),
      ...createFlowSlice(set, get),
      ...createSchemaListsSlice(set, get),
      ...createRegistrySlice(set, get),
      ...createExportSlice(set, get),
    }),
    {
      name: "lore-engine-storage",
      // Backend is chosen by a separate mode flag (see persistAdapter.js) —
      // defaults to localStorage, switches to IndexedDB once a project
      // opts in (mode-switching UI/migration is a separate piece of work).
      storage: createJSONStorage(() => getActiveStorageAdapter()),

      // Perf fix: without `partialize`, zustand's persist middleware
      // JSON.stringify's and writes the ENTIRE store to localStorage on
      // every single set() call — including every mouse-move frame while
      // dragging a node (onNodesChange fires continuously during a drag).
      // That's a synchronous localStorage write + full-project serialization
      // per frame, which is a major source of drag/edit jank.
      //
      // partialize scopes what actually gets written down to real project
      // data worth persisting. Ephemeral/derived UI state (which node is
      // being edited, whether the simulator modal or a collection focus is
      // open) is excluded — it doesn't need to survive a reload and there's
      // no reason to pay to serialize it on every store update.
      //
      // `nodes`/`edges` are the legacy pre-multi-graph holders: after
      // onRehydrateStorage below migrates them into `graphs["Main Story"]`
      // they're always empty, but they're kept in the persisted payload so
      // that a *fresh* load of an old (pre-migration) save still has them
      // available to migrate from.
      partialize: (state) => ({
        projectName: state.projectName,
        activeGraph: state.activeGraph,
        startGraph: state.startGraph,
        graphs: state.graphs,
        viewports: state.viewports,
        graphFolders: state.graphFolders,
        activeFolder: state.activeFolder,
        conversationRegistry: state.conversationRegistry,
        sidebarOpen: state.sidebarOpen,
        languages: state.languages,
        currentLanguage: state.currentLanguage,
        locales: state.locales,
        schema: state.schema,
        listMetadata: state.listMetadata,
        lists: state.lists,
        nodes: state.nodes,
        edges: state.edges,
      }),

      // Restored Legacy Automated Data-migration pipeline
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          state.nodes?.length > 0 &&
          state.graphs?.["Main Story"]?.nodes?.length === 0
        ) {
          console.log("Migrating legacy project to multi-graph format…");
          state.graphs["Main Story"].nodes = state.nodes;
          state.graphs["Main Story"].edges = state.edges;
          state.nodes = [];
          state.edges = [];
        }
      },
    },
  ),
);

window.useLoreStore = useLoreStore; // Restored Global window handle layout debugging access point
