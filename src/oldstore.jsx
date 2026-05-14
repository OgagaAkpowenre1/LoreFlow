import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

const getAbsolutePos = (node, nodes, depth = 0) => {
  // Safety break: if we go deeper than 5 levels, something is wrong
  if (!node.parentId || depth > 5) return node.position;
  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return node.position;
  const parentPos = getAbsolutePos(parent, nodes, depth + 1);
  return {
    x: node.position.x + parentPos.x,
    y: node.position.y + parentPos.y,
  };
};

// 1. Define the default shape of a new graph
const createEmptyGraph = () => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
});

export const ALLOWED_TYPES = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "list", label: "Dropdown List" },
  { id: "flag_group", label: "Logic Flags" },
  { id: "sequence", label: "Dialogue Sequence" },
  { id: "choice_list", label: "Player Choices" },
];

export const useLoreStore = create(
  persist(
    (set, get) => ({
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
          {
            id: "music",
            label: "BGM Track",
            type: "list",
            listId: "music_tracks",
          },
          { id: "dialogueLines", label: "Dialogue Sequence", type: "sequence" }, // Nested Sequence
          { id: "choices", label: "Branching Choices", type: "choice_list" },
        ],

        sequenceFields: [
          {
            id: "speaker",
            label: "Speaker",
            type: "list",
            listId: "characters",
          },
          { id: "text", label: "Dialogue Text", type: "textarea" },
          {
            id: "portrait",
            label: "Portrait/Expression",
            type: "list",
            listId: "expressions",
          },
          { id: "sound", label: "SFX", type: "list", listId: "sfx_list" },
        ],

        // Logic-Specific Fields
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

      // --- 2. PREDEFINED LISTS ---
      // The "Source of Truth" for your dropdowns
      listMetadata: {
        characters: "string",
        backgrounds: "string",
        music_tracks: "string",
        expressions: "string",
        sfx_list: "string",
        variables: "variable", // The base non-deletable list
        operators: "string",
      },

      lists: {
        characters: ["Narrator", "Protagonist", "Mysterious Stranger"],
        backgrounds: ["Tavern_Night", "Forest_Path", "Castle_Gate"],
        music_tracks: ["Peaceful_Town", "Battle_Theme", "Suspense_Ambient"],
        expressions: ["Neutral", "Happy", "Angry", "Surprised"],
        sfx_list: ["Door_Creek", "Sword_Clash", "Gold_Coins"],
        variables: [
          { name: "game_started", type: "boolean" },
          { name: "gold_amount", type: "number" },
          { name: "has_key", type: "boolean" },
        ],
        operators: ["==", "!=", ">", "<", ">=", "<="],
      },

      projectName: "Untitled Lore",

      // --- 3. REACT FLOW DATA (TEST CASE) ---
      // These top-level nodes/edges are now "computed" or legacy
      nodes: [],
      edges: [],

      // --- 4. ACTIONS: SCHEMA & LISTS ---

      // Add a new option to a list (e.g., adding a new character name)
      addToList: (listId, newItem) =>
        set((state) => {
          let finalItem = newItem;
          // If adding a variable, ensure it has a type-safe default value
          if (
            state.listMetadata[listId] === "variable" &&
            typeof newItem === "object"
          ) {
            finalItem = {
              ...newItem,
              defaultValue: newItem.type === "number" ? 0 : false,
            };
          }
          return {
            lists: {
              ...state.lists,
              [listId]: [...(state.lists[listId] || []), finalItem],
            },
          };
        }),

      // Add a brand new field to the UI (e.g., adding "Camera Shake" to dialogue lines)
      addFieldToSchema: (target, newField) =>
        set((state) => ({
          schema: {
            ...state.schema,
            [target]: [...state.schema[target], newField],
          },
        })),

      // --- 5. ACTIONS: REACT FLOW HANDLERS ---

      // onNodesChange: (changes) => {
      //   set({
      //     nodes: applyNodeChanges(changes, get().nodes),
      //   });
      // },
      // REFACTORED: onNodesChange (Crucial for React Flow)
      onNodesChange: (changes) => {
        const { activeGraph, graphs } = get();
        set({
          graphs: {
            ...graphs,
            [activeGraph]: {
              ...graphs[activeGraph],
              nodes: applyNodeChanges(changes, graphs[activeGraph].nodes),
            },
          },
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        const { nodes, edges } = get();
        const sourceNode = nodes.find((n) => n.id === connection.source);

        if (!sourceNode) return;

        let edgeStyle = { strokeWidth: 2, stroke: "#3b82f6" }; // Default Blue
        let edgeLabel = "";
        let animated = false;

        // 1. Logic Node Connection
        if (sourceNode.type === "logic") {
          animated = true;
          if (connection.sourceHandle === "true") {
            edgeStyle.stroke = "#22c55e"; // Green
            edgeLabel = "TRUE";
          } else if (connection.sourceHandle === "false") {
            edgeStyle.stroke = "#ef4444"; // Red
            edgeLabel = "FALSE";
          }
        }
        // 2. Scene Node Connection
        else if (sourceNode.type === "scene" && sourceNode.data.choices) {
          const choice = sourceNode.data.choices.find(
            (c) => c.id === connection.sourceHandle,
          );
          if (choice) edgeLabel = choice.text;
        }

        const newEdge = {
          ...connection,
          label: edgeLabel,
          animated: animated,
          type: "default",
          style: edgeStyle,
          labelStyle: { fill: edgeStyle.stroke, fontWeight: 800, fontSize: 10 },
          labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
        };

        set({ edges: addEdge(newEdge, edges) });
      },

      updateNodeData: (nodeId, newData) => {
        set((state) => {
          const oldNode = state.nodes.find((n) => n.id === nodeId);
          let newEdges = [...state.edges]; // Start with a copy of existing edges

          if (oldNode && oldNode.type === "scene") {
            const oldChoices = oldNode.data.choices || [];
            const newChoices = newData.choices || [];

            // --- CASE A: Handle Inheritance (0 to 1+ choices) ---
            if (oldChoices.length === 0 && newChoices.length > 0) {
              const firstChoice = newChoices[0];
              newEdges = newEdges.map((edge) => {
                if (
                  edge.source === nodeId &&
                  (!edge.sourceHandle || edge.sourceHandle === "default-output")
                ) {
                  return {
                    ...edge,
                    sourceHandle: firstChoice.id,
                    label: firstChoice.text,
                    style: { ...edge.style, stroke: "#3b82f6" },
                  };
                }
                return edge;
              });
            }

            // --- CASE B: Reverting to Linear (Choices to 0) ---
            else if (oldChoices.length > 0 && newChoices.length === 0) {
              newEdges = newEdges.map((edge) => {
                if (edge.source === nodeId) {
                  return {
                    ...edge,
                    sourceHandle: "default-output",
                    label: "",
                    style: { ...edge.style, stroke: "#9ca3af" },
                  };
                }
                return edge;
              });
            }

            // --- CASE C: LIVE LABEL SYNC (Updating existing choice text) ---
            // This is what was missing!
            else {
              newEdges = newEdges.map((edge) => {
                if (edge.source === nodeId) {
                  // Find the choice object that matches this line's handle
                  const matchingChoice = newChoices.find(
                    (c) => c.id === edge.sourceHandle,
                  );
                  if (matchingChoice && edge.label !== matchingChoice.text) {
                    return {
                      ...edge,
                      label: matchingChoice.text,
                    };
                  }
                }
                return edge;
              });
            }
          }

          return {
            nodes: state.nodes.map((node) =>
              node.id === nodeId ? { ...node, data: newData } : node,
            ),
            edges: newEdges,
          };
        });
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

      createNewList: (id, type, initialItems) => {
        set((state) => ({
          listMetadata: { ...state.listMetadata, [id]: type },
          lists: { ...state.lists, [id]: initialItems },
        }));
      },

      deleteList: (listId) =>
        set((state) => {
          if (listId === "variables") return state; // Protection
          const newLists = { ...state.lists };
          const newMeta = { ...state.listMetadata };
          delete newLists[listId];
          delete newMeta[listId];
          return { lists: newLists, listMetadata: newMeta };
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
      updateItemInList: (listId, index, newValue) => {
        set((state) => {
          const newList = [...(state.lists[listId] || [])];
          // If it's a string list, newValue is a string.
          // If it's a variable list, newValue is the updated object.
          newList[index] = newValue;

          return {
            lists: { ...state.lists, [listId]: newList },
          };
        });
      },

      // A specialized action for variables to keep the code clean
      updateVariable: (listId, index, field, value) => {
        set((state) => {
          const newList = [...(state.lists[listId] || [])];
          const updatedVar = { ...newList[index], [field]: value };

          // If the type changes, we MUST reset the defaultValue to be type-safe
          if (field === "type") {
            updatedVar.defaultValue = value === "number" ? 0 : false;
          }

          newList[index] = updatedVar;
          return { lists: { ...state.lists, [listId]: newList } };
        });
      },

      editingNodeId: null, // New property

      setEditingNode: (id) => set({ editingNodeId: id }),

      // --- NODE MANAGEMENT ACTIONS ---

      // addNode: (type) => {
      //   const id = crypto.randomUUID();

      //   // Logic default data now uses a 'conditions' array
      //   const defaultLogicData = {
      //     logicalOperator: "AND", // "AND" or "OR"
      //     conditions: [
      //       {
      //         id: crypto.randomUUID(),
      //         check_flag: "",
      //         operator: "==",
      //         value: "true",
      //       },
      //     ],
      //   };

      //   const newNode = {
      //     id,
      //     type,
      //     position: { x: Math.random() * 400, y: Math.random() * 400 },
      //     zIndex: type === "collection" ? -10 : 10, // Ensure standard nodes are always on top
      //     data:
      //       type === "scene"
      //         ? {
      //             title: "New Scene",
      //             dialogueLines: [],
      //             choices: [],
      //             flags: [],
      //           }
      //         : type === "logic"
      //           ? defaultLogicData
      //           : {}, // Start node needs no data
      //   };

      //   set((state) => {
      //     // RULE: Only one start node allowed. If adding start, remove any existing one.
      //     if (type === "start") {
      //       return {
      //         nodes: [
      //           ...state.nodes.filter((n) => n.type !== "start"),
      //           newNode,
      //         ],
      //       };
      //     }
      //     return { nodes: [...state.nodes, newNode] };
      //   });
      // },

      // Add a new graph
      addGraph: (name = "New Conversation") => {
        const uniqueName = get().graphs[name]
          ? `${name} (${Object.keys(get().graphs).length})`
          : name;
        set((state) => ({
          graphs: {
            ...state.graphs,
            [uniqueName]: createEmptyGraph(),
          },
          activeGraph: uniqueName,
        }));
      },

      // Set Active Graph
      setActiveGraph: (name) => set({ activeGraph: name }),

      // REFACTORED: addNode
      addNode: (type) => {
        const { activeGraph, graphs } = get();
        const id = crypto.randomUUID();
        const newNode = {
          id,
          type,
          position: { x: 150, y: 150 },
          data:
            type === "scene"
              ? {
                  title: "New Scene",
                  dialogueLines: [],
                  choices: [],
                  flags: [],
                }
              : {},
        };

        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...state.graphs[activeGraph],
              nodes: [...state.graphs[activeGraph].nodes, newNode],
            },
          },
        }));
      },

      deleteNode: (nodeId) => {
        const { nodes, edges } = get();
        const nodeToDelete = nodes.find((n) => n.id === nodeId);

        // 1. Handle Collection Deletion Logic
        if (nodeToDelete?.type === "collection") {
          const children = nodes.filter((n) => n.parentId === nodeId);

          if (children.length > 0) {
            const deleteContent = window.confirm(
              "This collection contains nodes. Do you want to delete the nodes inside as well?\n\n" +
                "OK: Delete everything\n" +
                "Cancel: Keep nodes but remove them from group",
            );

            if (!deleteContent) {
              // --- SCENARIO: KEEP CHILDREN, DELETE BOX ---
              set((state) => {
                const updatedNodes = state.nodes
                  .filter((n) => n.id !== nodeId) // Remove the collection node
                  .map((node) => {
                    if (node.parentId === nodeId) {
                      // Find parent's position to calculate absolute coordinates
                      const parent = state.nodes.find((n) => n.id === nodeId);
                      return {
                        ...node,
                        parentId: undefined,
                        extent: undefined,
                        position: {
                          x: node.position.x + (parent?.position.x || 0),
                          y: node.position.y + (parent?.position.y || 0),
                        },
                      };
                    }
                    return node;
                  });

                return {
                  nodes: updatedNodes,
                  edges: state.edges.filter(
                    (e) => e.source !== nodeId && e.target !== nodeId,
                  ),
                  editingNodeId:
                    state.editingNodeId === nodeId ? null : state.editingNodeId,
                };
              });
              return; // Exit here, state is updated
            } else {
              // --- SCENARIO: DELETE EVERYTHING ---
              const childIds = children.map((c) => c.id);
              set((state) => ({
                nodes: state.nodes.filter(
                  (n) => n.id !== nodeId && !childIds.includes(n.id),
                ),
                edges: state.edges.filter(
                  (e) =>
                    !childIds.includes(e.source) &&
                    !childIds.includes(e.target) &&
                    e.source !== nodeId &&
                    e.target !== nodeId,
                ),
                editingNodeId:
                  state.editingNodeId === nodeId ||
                  childIds.includes(state.editingNodeId)
                    ? null
                    : state.editingNodeId,
              }));
              return; // Exit here
            }
          }
        }

        // 2. Standard Delete Logic (for Scene/Logic/Start nodes)
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
          ),
          editingNodeId:
            state.editingNodeId === nodeId ? null : state.editingNodeId,
        }));
      },

      // Add this near your other node actions (like addNode, deleteNode)
      setNodes: (newNodes) => set({ nodes: newNodes }),

      // exportGameData: () => {
      //   const { nodes, edges, lists, schema } = get();

      //   const processNode = (node) => {
      //     const nextMap = {};
      //     edges
      //       .filter((e) => e.source === node.id)
      //       .forEach((e) => {
      //         // --- NORMALIZATION LOGIC ---
      //         // If it's a linear output (null, undefined, or 'default-output'),
      //         // we always name the key "next" for the engine.
      //         const key =
      //           !e.sourceHandle || e.sourceHandle === "default-output"
      //             ? "next"
      //             : e.sourceHandle;

      //         nextMap[key] = e.target;
      //       });

      //     return {
      //       id: node.id,
      //       type: node.type,
      //       // collectionId: node.parentId || null, // Export the group ownership
      //       data: node.data,
      //       next: nextMap, // The clean navigation map
      //     };
      //   };

      //   const exportBundle = {
      //     metadata: { exportedAt: new Date().toISOString() },
      //     // The "Registry" handles your global data
      //     registry: {
      //       // All items from your Global Lists (Characters, Locations, etc.)
      //       lists: lists,
      //       // We can also export the Schema if the engine needs to know
      //       // what "types" of data to expect (e.g., 'flag_group')
      //       definitions: {
      //         nodeFields: schema.nodeFields.map((f) => ({
      //           id: f.id,
      //           type: f.type,
      //         })),
      //         logicFields: schema.logicFields.map((f) => ({
      //           id: f.id,
      //           type: f.type,
      //         })),
      //       },
      //     },
      //     variables: lists.variables || [],
      //     scenes: nodes.filter((n) => n.type === "scene").map(processNode),
      //     logic: nodes.filter((n) => n.type === "logic").map(processNode),
      //   };

      //   // 3. Trigger Download
      //   const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      //     type: "application/json",
      //   });
      //   const url = URL.createObjectURL(blob);
      //   const link = document.createElement("a");
      //   link.href = url;
      //   const fileName = get()
      //     .projectName.replace(/[^a-z0-9]/gi, "_")
      //     .toLowerCase();
      //   link.download = `${fileName}_project.json`; // or .json
      //   // link.download = `narrative_export_${Date.now()}.json`;
      //   document.body.appendChild(link);
      //   link.click();
      //   document.body.removeChild(link);
      // },

      exportGameData: () => {
        const { nodes, edges, lists, schema, projectName } = get();

        // 1. Find the actual Start Node component
        const startNode = nodes.find((n) => n.type === "start");

        // 2. Find the edge connected to it to see where it's pointing
        const startEdge = edges.find((e) => e.source === startNode?.id);

        // 3. The "Entry Point" is the ID of the FIRST playable node (Scene or Logic)
        const entryPointId = startEdge ? startEdge.target : null;

        const processNode = (node) => {
          const nextMap = {};
          edges
            .filter((e) => e.source === node.id)
            .forEach((e) => {
              // --- NORMALIZATION ---
              // Converts "default-output" or null handles to "next" for the engine
              const key =
                !e.sourceHandle || e.sourceHandle === "default-output"
                  ? "next"
                  : e.sourceHandle;

              nextMap[key] = e.target;
            });

          return {
            id: node.id,
            type: node.type,
            data: node.data,
            next: nextMap,
          };
        };

        const exportBundle = {
          metadata: {
            projectName,
            exportedAt: new Date().toISOString(),
            version: "2.0", // Incremented version for the new structure
          },

          // The "Registry" handles your global definitions
          registry: {
            lists: lists,
            // Definitions tell the engine what fields exist in the UI
            definitions: {
              nodeFields: schema.nodeFields.map((f) => ({
                id: f.id,
                type: f.type,
              })),
              sequenceFields: schema.sequenceFields.map((f) => ({
                id: f.id,
                type: f.type,
              })),
            },
          },

          // Top-level arrays for easy parsing in Godot
          startNode: entryPointId,
          scenes: nodes.filter((n) => n.type === "scene").map(processNode),
          logic: nodes.filter((n) => n.type === "logic").map(processNode),
        };

        // --- Download Trigger ---
        const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const fileName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        link.download = `${fileName}_export.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      resetProject: () => {
        if (confirm("This will delete your entire map. Are you sure?")) {
          set({
            nodes: [],
            edges: [],
            // You could also reset the schema/lists if you want a true factory reset
          });
        }
      },

      // Inside useLoreStore
      exportProject: () => {
        const { nodes, edges, lists, schema, projectName } = get();
        const fileName = projectName.toLowerCase().replace(/\s+/g, "_");

        // The Project file includes EVERYTHING (positions, handles, types)
        const projectData = {
          type: "LORE_PROJECT_FILE",
          version: "1.0.0",
          nodes,
          edges,
          lists,
          schema,
          projectName,
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.lore`;
        link.click();
      },

      importProject: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);

          // Safety check: is this actually our file?
          if (data.type !== "LORE_PROJECT_FILE") {
            alert("Invalid file format. Please upload a .lore project file.");
            return;
          }

          // Overwrite the store
          set({
            nodes: data.nodes || [],
            edges: data.edges || [],
            lists: data.lists || get().lists,
            schema: data.schema || get().schema,
          });

          alert("Project loaded successfully!");
        } catch (err) {
          alert("Error parsing the file. Is it a valid JSON?");
        }
      },

      updateProjectName: (name) => set({ projectName: name }),

      // --- 6. GROUPING & SELECTION ACTIONS ---

      // Helper to find all descendants connected to a node
      getConnectedDescendants: (nodeId) => {
        const { nodes, edges } = get();
        let descendants = [];
        let queue = [nodeId];

        while (queue.length > 0) {
          const currentId = queue.shift();
          const children = edges
            .filter((e) => e.source === currentId)
            .map((e) => e.target);

          for (const childId of children) {
            if (!descendants.includes(childId)) {
              descendants.push(childId);
              queue.push(childId);
            }
          }
        }
        return descendants;
      },

      groupSelectedNodes: (baseColor = "#6366f1") => {
        const { nodes } = get();
        const selectedNodes = nodes.filter(
          (n) => n.selected && n.type !== "collection",
        );

        if (selectedNodes.length < 1) return;
        const title = window.prompt("Collection Name:", "New Chapter");
        if (!title) return;

        // 1. Calculate the bounding box using absolute positions
        const absPositions = selectedNodes.map((n) => getAbsolutePos(n, nodes));
        const minX = Math.min(...absPositions.map((p) => p.x));
        const minY = Math.min(...absPositions.map((p) => p.y));
        const maxX = Math.max(...absPositions.map((p) => p.x + 260));
        const maxY = Math.max(...absPositions.map((p) => p.y + 200));

        const padding = 60;
        const groupId = crypto.randomUUID();

        // 2. Create the Collection Node
        const groupNode = {
          id: groupId,
          type: "collection",
          position: { x: minX - padding, y: minY - padding },
          zIndex: -50,
          style: {
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2,
          },
          data: { title, color: baseColor },
        };

        // 3. Update all nodes: assign parent to selected, keep others exactly as they are
        const nextNodes = nodes.map((node) => {
          if (node.selected && node.type !== "collection") {
            const abs = getAbsolutePos(node, nodes);
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

        // 4. Combine: Group Node first (bottom), then all other nodes
        set({ nodes: [groupNode, ...nextNodes] });
      },

      moveToCollection: (targetGroupId) => {
        const { nodes } = get();
        const targetGroup = nodes.find((n) => n.id === targetGroupId);
        if (!targetGroup) return;

        const updates = nodes.map((n) => {
          if (n.selected && n.type !== "collection" && n.id !== targetGroupId) {
            const absPos = getAbsolutePos(n, nodes);
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

        // Re-sort so parents are earlier in the array than children
        const sortedNodes = [...updates].sort((a, b) => {
          if (a.type === "collection" && b.type !== "collection") return -1;
          if (a.type !== "collection" && b.type === "collection") return 1;
          return 0;
        });

        set({ nodes: sortedNodes });
      },

      removeFromGroup: () => {
        set((state) => {
          const { nodes } = state;
          return {
            nodes: nodes.map((node) => {
              // If the node is selected AND has a parent, pop it out
              if (node.selected && node.parentId) {
                const parent = nodes.find((n) => n.id === node.parentId);
                return {
                  ...node,
                  parentId: undefined,
                  extent: undefined,
                  // Calculate absolute position so it stays exactly where it is visually
                  position: {
                    x: node.position.x + (parent?.position.x || 0),
                    y: node.position.y + (parent?.position.y || 0),
                  },
                };
              }
              return node;
            }),
          };
        });
      },

      deleteEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
        }));
      },

      addConditionToLogic: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    // Fallback to empty array if conditions doesn't exist yet
                    conditions: [
                      ...(n.data.conditions || []),
                      {
                        id: crypto.randomUUID(),
                        check_flag: "",
                        operator: "==",
                        value: "true",
                      },
                    ],
                  },
                }
              : n,
          ),
        }));
      },

      removeConditionFromLogic: (nodeId, conditionId) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    conditions: (n.data.conditions || []).filter(
                      (c) => c.id !== conditionId,
                    ),
                  },
                }
              : n,
          ),
        }));
      },
    }),
    {
      name: "lore-engine-storage", // Unique key in localStorage
      storage: createJSONStorage(() => localStorage), // Defaults to localStorage
      onRehydrateStorage: () => (state) => {
        // If the user has old-style nodes but no graphs object
        if (
          state &&
          state.nodes.length > 0 &&
          Object.keys(state.graphs).length === 1 &&
          state.graphs["Main Story"].nodes.length === 0
        ) {
          console.log("Migrating Legacy Project to Multi-Graph...");
          state.graphs["Main Story"].nodes = state.nodes;
          state.graphs["Main Story"].edges = state.edges;
          state.nodes = [];
          state.edges = [];
        }
      },
    },
  ),
);

window.useLoreStore = useLoreStore;
