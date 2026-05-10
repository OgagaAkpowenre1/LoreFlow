import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

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
      nodes: [
        {
          id: "1",
          type: "scene", // Your Scene Node
          position: { x: 200, y: 50 },
          data: {
            title: "The Bridge Guard",
            dialogueLines: [
              {
                speaker: "Guard",
                text: "Halt! Show me your royal pass or turn back.",
              },
            ],
            choices: [
              { id: "choice_show_pass", text: "Show Pass" },
              { id: "choice_bribe", text: "Offer 50 Gold" },
            ],
            flags: [],
          },
        },
        {
          id: "2",
          type: "logic", // Your Logic Node (Diamond)
          position: { x: 100, y: 250 },
          data: {
            check_flag: "has_royal_pass",
            operator: "==",
            value: "true",
          },
        },
        {
          id: "3",
          type: "scene",
          position: { x: -100, y: 450 },
          data: {
            title: "Entry Granted",
            dialogueLines: [
              {
                speaker: "Guard",
                text: "Everything is in order. Pass through.",
              },
            ],
            choices: [],
            flags: [],
          },
        },
        {
          id: "4",
          type: "scene",
          position: { x: 300, y: 450 },
          data: {
            title: "Caught in a Lie",
            dialogueLines: [
              {
                speaker: "Guard",
                text: "This is a forgery! Guards, seize them!",
              },
            ],
            choices: [],
            flags: [],
          },
        },
        {
          id: "5",
          type: "scene",
          position: { x: 500, y: 250 },
          data: {
            title: "Bribe Attempt",
            dialogueLines: [
              {
                speaker: "Guard",
                text: "I'm a man of honor, but... for 50 gold, I didn't see anything.",
              },
            ],
            choices: [],
            flags: [{ key: "gold_amount", value: -50 }],
          },
        },
      ],

      edges: [
        // Scene 1 Choice -> Logic Node
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "choice_show_pass",
          label: "Show Pass",
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        },
        // Scene 1 Choice -> Scene 5 (Direct Bribe)
        {
          id: "e1-5",
          source: "1",
          target: "5",
          sourceHandle: "choice_bribe",
          label: "Offer 50 Gold",
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        },
        // Logic TRUE Path -> Scene 3
        {
          id: "e2-3",
          source: "2",
          target: "3",
          sourceHandle: "true",
          label: "TRUE",
          animated: true,
          style: { stroke: "#22c55e", strokeWidth: 2 },
        },
        // Logic FALSE Path -> Scene 4
        {
          id: "e2-4",
          source: "2",
          target: "4",
          sourceHandle: "false",
          label: "FALSE",
          animated: true,
          style: { stroke: "#ef4444", strokeWidth: 2 },
        },
      ],

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
          type: "smoothstep",
          style: edgeStyle,
          labelStyle: { fill: edgeStyle.stroke, fontWeight: 800, fontSize: 10 },
          labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
        };

        set({ edges: addEdge(newEdge, edges) });
      },

      // updateNodeData: (nodeId, newData) => {
      //   set((state) => ({
      //     nodes: state.nodes.map((node) =>
      //       node.id === nodeId ? { ...node, data: newData } : node,
      //     ),
      //   }));
      // },

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

      // Create a brand new empty list (e.g., 'WeaponTypes')
      // createNewList: (listId) =>
      //   set((state) => ({
      //     lists: {
      //       ...state.lists,
      //       [listId]: [],
      //     },
      //   })),

      // // Delete an entire list
      // deleteList: (listId) =>
      //   set((state) => {
      //     if (listId === "available_flags") {
      //       alert(
      //         "System Error: 'available_flags' is a core logic list and cannot be deleted.",
      //       );
      //       return state;
      //     }
      //     const newLists = { ...state.lists };
      //     delete newLists[listId];
      //     return { lists: newLists };
      //   }),

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

      // --- NODE MANAGEMENT ACTIONS ---

      addNode: (type) => {
        const id = crypto.randomUUID();
        const newNode = {
          id,
          type,
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data:
            type === "scene"
              ? {
                  title: "New Scene",
                  dialogueLines: [],
                  choices: [],
                  flags: [],
                }
              : {
                  check_flag: "",
                  operator: "==",
                  value: "true",
                },
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
          // Optional: Auto-select and start editing the new node
          editingNodeId: id,
        }));
      },

      deleteNode: (nodeId) => {
        set((state) => ({
          // Remove the node
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          // Clean up any "ghost" edges connected to that node
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId,
          ),
          // Deselect if we were editing it
          editingNodeId:
            state.editingNodeId === nodeId ? null : state.editingNodeId,
        }));
      },

      exportGameData: () => {
        const { nodes, edges, lists, schema } = get();

        const processNode = (node) => {
          // Create a flat map of handleId -> targetId
          const nextMap = {};
          edges
            .filter((edge) => edge.source === node.id)
            .forEach((edge) => {
              // If it's a linear node with no specific handle ID, we can use a 'default' key
              const key = edge.sourceHandle || "default";
              nextMap[key] = edge.target;
            });

          return {
            id: node.id,
            type: node.type,
            data: node.data,
            next: nextMap, // The clean navigation map
          };
        };

        const exportBundle = {
          metadata: { exportedAt: new Date().toISOString() },
          // The "Registry" handles your global data
          registry: {
            // All items from your Global Lists (Characters, Locations, etc.)
            lists: lists,
            // We can also export the Schema if the engine needs to know
            // what "types" of data to expect (e.g., 'flag_group')
            definitions: {
              nodeFields: schema.nodeFields.map((f) => ({
                id: f.id,
                type: f.type,
              })),
              logicFields: schema.logicFields.map((f) => ({
                id: f.id,
                type: f.type,
              })),
            },
          },
          scenes: nodes.filter((n) => n.type === "scene").map(processNode),
          logic: nodes.filter((n) => n.type === "logic").map(processNode),
        };

        // 3. Trigger Download
        const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const fileName = get()
          .projectName.replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();
        link.download = `${fileName}_project.lore`; // or .json
        // link.download = `narrative_export_${Date.now()}.json`;
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
    }),
    {
      name: "lore-engine-storage", // Unique key in localStorage
      storage: createJSONStorage(() => localStorage), // Defaults to localStorage
    },
  ),
);
