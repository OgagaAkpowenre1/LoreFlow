// Graph and folder lifecycle: create/rename/delete/duplicate graphs,
// folder management, and project reset/delete.
import { createEmptyGraph } from "./utils";

export const createGraphSlice = (set, get) => ({
  getConnectedDescendants: (nodeId) => {
    const { activeGraph, graphs } = get();
    const { edges } = graphs[activeGraph] || { edges: [] };
    const descendants = [];
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      edges
        .filter((e) => e.source === currentId)
        .map((e) => e.target)
        .forEach((childId) => {
          if (!descendants.includes(childId)) {
            descendants.push(childId);
            queue.push(childId);
          }
        });
    }
    return descendants;
  },

  // PROJECT LIFECYCLE MANAGEMENT

  clearGraph: () => {
    if (
      !confirm(
        "This will clear all nodes and edges from the current graph. Are you sure?",
      )
    )
      return;
    const { activeGraph } = get();
    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: createEmptyGraph(),
      },
      editingNodeId: null,
    }));
  },

  deleteProject: () => {
    if (
      !confirm(
        "WARNING: This will permanently delete your entire project, including all graphs, lists, variables, and registry rules.\n\nAre you absolutely sure?",
      )
    )
      return;

    // Fully obliterates the store and restores the initial factory seed state
    set({
      projectName: "Untitled Lore",
      activeGraph: "Main Story",
      startGraph: "Main Story",
      graphs: { "Main Story": createEmptyGraph() },
      graphFolders: [],
      activeFolder: null,
      conversationRegistry: {},
      editingNodeId: null,
      languages: ["en"],
      currentLanguage: "en",
      locales: { en: {} },
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
    });
  },

  // GRAPH PERSISTENCE OPERATIONS
  addGraph: (name = "New Conversation") => {
    const graphs = get().graphs;
    let uniqueName = name;
    let counter = 1;
    while (graphs[uniqueName]) uniqueName = `${name} ${counter++}`;
    set((state) => ({
      graphs: { ...state.graphs, [uniqueName]: createEmptyGraph() },
      viewports: {
        ...state.viewports,
        [uniqueName]: { x: 0, y: 0, zoom: 1 },
      },
      activeGraph: uniqueName,
    }));
  },

  renameGraph: (oldName, newName) => {
    if (oldName === newName || !newName.trim()) return;
    set((state) => {
      const newGraphs = { ...state.graphs };
      newGraphs[newName] = newGraphs[oldName];
      delete newGraphs[oldName];

      // ── INJECTED: Rename Viewport ──
      const newViewports = { ...state.viewports };
      newViewports[newName] = newViewports[oldName] || {
        x: 0,
        y: 0,
        zoom: 1,
      };
      delete newViewports[oldName];

      const newRegistry = { ...state.conversationRegistry };
      Object.keys(newRegistry).forEach((npcId) => {
        newRegistry[npcId] = newRegistry[npcId].map((rule) =>
          rule.graph === oldName ? { ...rule, graph: newName } : rule,
        );
      });

      Object.keys(newGraphs).forEach((key) => {
        newGraphs[key] = {
          ...newGraphs[key],
          nodes: newGraphs[key].nodes.map((node) => {
            if (node.type === "jump" && node.data?.targetGraph === oldName) {
              return {
                ...node,
                data: { ...node.data, targetGraph: newName },
              };
            }
            return node;
          }),
        };
      });

      const newLocales = { ...state.locales };
      Object.keys(newLocales).forEach((lang) => {
        const updatedBlock = {};
        Object.keys(newLocales[lang]).forEach((key) => {
          if (key.startsWith(`${oldName}.`)) {
            const tracking = `${newName}.${key.slice(oldName.length + 1)}`;
            updatedBlock[tracking] = newLocales[lang][key];
          } else {
            updatedBlock[key] = newLocales[lang][key];
          }
        });
        newLocales[lang] = updatedBlock;
      });

      return {
        graphs: newGraphs,
        conversationRegistry: newRegistry,
        viewports: newViewports, // Added to return
        locales: newLocales,
        activeGraph:
          state.activeGraph === oldName ? newName : state.activeGraph,
      };
    });
  },

  deleteGraph: (name) => {
    const graphs = { ...get().graphs };
    if (Object.keys(graphs).length <= 1) return;
    delete graphs[name];

    const viewports = { ...get().viewports }; // Added
    delete viewports[name]; // Added

    Object.keys(graphs).forEach((gKey) => {
      graphs[gKey] = {
        ...graphs[gKey],
        nodes: graphs[gKey].nodes.map((node) =>
          node.type === "jump" && node.data?.targetGraph === name
            ? { ...node, data: { ...node.data, targetGraph: "" } }
            : node,
        ),
      };
    });

    const nextGraph = Object.keys(graphs)[0];
    set({ graphs, viewports, activeGraph: nextGraph, editingNodeId: null });
  },

  duplicateGraph: (name) => {
    const { graphs } = get();
    const sourceGraph = graphs[name];
    if (!sourceGraph) return;

    const sourceViewport = get().viewports?.[name] || {
      x: 0,
      y: 0,
      zoom: 1,
    }; // Added

    let newName = `${name} (Copy)`;
    let counter = 1;
    while (graphs[newName]) {
      newName = `${name} (Copy) ${counter++}`;
    }

    const clonedNodes = JSON.parse(JSON.stringify(sourceGraph.nodes));
    const clonedEdges = JSON.parse(JSON.stringify(sourceGraph.edges));

    set((state) => ({
      graphs: {
        ...state.graphs,
        [newName]: {
          ...sourceGraph,
          nodes: clonedNodes,
          edges: clonedEdges,
        },
      },
      viewports: { ...state.viewports, [newName]: { ...sourceViewport } }, // Added
      activeGraph: newName,
    }));
  },

  // FOLDER ARRANGEMENT UTILITIES
  addFolder: (name) =>
    set((state) => ({ graphFolders: [...state.graphFolders, name] })),

  renameFolder: (oldName, newName) =>
    set((state) => {
      const newFolders = state.graphFolders.map((f) =>
        f === oldName ? newName : f,
      );
      const newGraphs = { ...state.graphs };

      Object.keys(newGraphs).forEach((gKey) => {
        if (newGraphs[gKey].folder === oldName) {
          newGraphs[gKey] = { ...newGraphs[gKey], folder: newName };
        }
      });
      return { graphFolders: newFolders, graphs: newGraphs };
    }),

  deleteFolder: (folderName) =>
    set((state) => {
      const newGraphs = { ...state.graphs };
      Object.keys(newGraphs).forEach((gKey) => {
        if (newGraphs[gKey].folder === folderName) {
          newGraphs[gKey] = { ...newGraphs[gKey], folder: null };
        }
      });
      return {
        graphFolders: state.graphFolders.filter((f) => f !== folderName),
        graphs: newGraphs,
      };
    }),

  moveGraphToFolder: (graphName, folderName) =>
    set((state) => ({
      graphs: {
        ...state.graphs,
        [graphName]: { ...state.graphs[graphName], folder: folderName },
      },
    })),
});
