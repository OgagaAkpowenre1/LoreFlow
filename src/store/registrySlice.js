// NPC conversation registry, localization strings, and node
// grouping/collection-move actions (which need absolute-position math).
import { getAbsolutePos } from "./utils";

export const createRegistrySlice = (set, get) => ({
  // ── REGISTRY ACTIONS ──

  registerNpc: (npcId) =>
    set((state) => ({
      conversationRegistry: {
        ...state.conversationRegistry,
        [npcId]: [
          {
            id: crypto.randomUUID(),
            priority: 0,
            condition: null,
            graph: "",
          },
        ],
      },
    })),

  updateRegistryRule: (npcId, ruleId, updates) =>
    set((state) => ({
      conversationRegistry: {
        ...state.conversationRegistry,
        [npcId]: state.conversationRegistry[npcId].map((r) =>
          r.id === ruleId ? { ...r, ...updates } : r,
        ),
      },
    })),

  // addRegistryRule: (npcId) =>
  //   set((state) => ({
  //     conversationRegistry: {
  //       ...state.conversationRegistry,
  //       [npcId]: [
  //         {
  //           id: crypto.randomUUID(),
  //           priority: 10,
  //           condition: { variable: "", op: "==", value: "" },
  //           graph: "",
  //         },
  //         ...state.conversationRegistry[npcId],
  //       ],
  //     },
  //   })),

  addRegistryRule: (npcId) =>
    set((state) => {
      const currentRules = state.conversationRegistry[npcId] || [];

      // Find the highest current priority value among existing rules for this NPC
      const maxPriority = currentRules.reduce(
        (max, rule) => Math.max(max, rule.priority || 0),
        0,
      );

      // Escalates by 10 above the current max (defaults to 10 if it's the first conditional rule)
      const nextPriority =
        maxPriority === 0 && currentRules.length <= 1 ? 10 : maxPriority + 10;

      return {
        conversationRegistry: {
          ...state.conversationRegistry,
          [npcId]: [
            {
              id: crypto.randomUUID(),
              priority: nextPriority,
              condition: { variable: "", op: "==", value: "" },
              graph: "",
            },
            ...currentRules,
          ],
        },
      };
    }),

  deleteRegistryRule: (npcId, ruleId) =>
    set((state) => ({
      conversationRegistry: {
        ...state.conversationRegistry,
        [npcId]: state.conversationRegistry[npcId].filter(
          (r) => r.id !== ruleId,
        ),
      },
    })),

  deleteNpcFromRegistry: (npcId) =>
    set((state) => {
      const newRegistry = { ...state.conversationRegistry };
      delete newRegistry[npcId];
      return { conversationRegistry: newRegistry };
    }),

  // RESTORED LOCALIZATION SYSTEM MATRIX ENGINE ACTIONS
  addLanguage: (code) =>
    set((state) => {
      const cleanedCode = code.trim().toLowerCase();
      if (!cleanedCode || state.languages.includes(cleanedCode)) return {};
      return {
        languages: [...state.languages, cleanedCode],
        locales: { ...state.locales, [cleanedCode]: {} },
      };
    }),

  updateTranslation: (lang, key, text) =>
    set((state) => ({
      locales: {
        ...state.locales,
        [lang]: { ...(state.locales[lang] || {}), [key]: text },
      },
    })),

  // COLLECTION / MOVEMENT UTILITIES
  removeFromGroup: () => {
    const { activeGraph, graphs } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;

    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: {
          ...currentGraph,
          nodes: currentGraph.nodes.map((node) => {
            if (node.selected && node.parentId) {
              const nodeAbsPos = getAbsolutePos(node, currentGraph.nodes);
              return {
                ...node,
                parentId: undefined,
                extent: undefined,
                position: nodeAbsPos,
              };
            }
            return node;
          }),
        },
      },
    }));
  },

  moveToCollection: (targetGroupId) => {
    // Restored Contextual Nesting Relocator Action
    const { activeGraph, graphs } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;
    const targetGroup = currentGraph.nodes.find((n) => n.id === targetGroupId);
    if (!targetGroup) return;

    const updatedNodes = currentGraph.nodes.map((n) => {
      if (n.selected && n.type !== "collection" && n.id !== targetGroupId) {
        const absPos = getAbsolutePos(n, currentGraph.nodes);
        return {
          ...n,
          parentId: targetGroupId,
          extent: "parent",
          zIndex: 10,
          position: {
            x: absPos.x - targetGroup.position.x,
            y: absPos.y - targetGroup.position.y,
          },
        };
      }
      return n;
    });

    const sortedNodes = [...updatedNodes].sort((a, b) => {
      if (a.type === "collection" && b.type !== "collection") return -1;
      if (a.type !== "collection" && b.type === "collection") return 1;
      return 0;
    });

    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: { ...currentGraph, nodes: sortedNodes },
      },
    }));
  },

  groupSelectedNodes: (providedName, baseColor = "#6366f1") => {
    const isString = typeof providedName === "string";
    const groupName =
      isString && providedName.trim() !== ""
        ? providedName
        : prompt("Enter collection name:");

    if (!groupName) return state; // Cancelled

    const { activeGraph, graphs } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;
    const selectedNodes = currentGraph.nodes.filter(
      (n) => n.selected && n.type !== "collection",
    );
    if (selectedNodes.length < 1) return;

    const absPositions = selectedNodes.map((n) =>
      getAbsolutePos(n, currentGraph.nodes),
    );
    const minX = Math.min(...absPositions.map((p) => p.x));
    const minY = Math.min(...absPositions.map((p) => p.y));
    const maxX = Math.max(...absPositions.map((p) => p.x + 260));
    const maxY = Math.max(...absPositions.map((p) => p.y + 200));
    const padding = 60;
    const groupId = crypto.randomUUID();

    const groupNode = {
      id: groupId,
      type: "collection",
      position: { x: minX - padding, y: minY - padding },
      zIndex: -50,
      style: {
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      },
      data: { title: groupName, color: baseColor },
    };

    const nextNodes = currentGraph.nodes.map((node) => {
      if (node.selected && node.type !== "collection") {
        const abs = getAbsolutePos(node, currentGraph.nodes);
        return {
          ...node,
          parentId: groupId,
          extent: "parent",
          zIndex: 10,
          position: {
            x: abs.x - (minX - padding),
            y: abs.y - (minY - padding),
          },
          selected: false,
        };
      }
      return node;
    });

    set({
      graphs: {
        ...get().graphs,
        [activeGraph]: {
          ...currentGraph,
          nodes: [groupNode, ...nextNodes],
        },
      },
    });
  },

  // onViewportChange: (viewport) => {
  //   const { activeGraph, graphs } = get();
  //   if (!graphs[activeGraph]) return;
  //   set((state) => ({
  //     graphs: {
  //       ...state.graphs,
  //       [activeGraph]: {
  //         ...state.graphs[activeGraph],
  //         viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
  //       },
  //     },
  //   }));
  // },

  onViewportChange: (viewport) => {
    const { activeGraph } = get();
    set((state) => ({
      viewports: {
        ...state.viewports,
        [activeGraph]: {
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        },
      },
    }));
  },
});
