Here is the blueprint for **LoreFlow: A Visual Narrative Logic Suite**.

---

## Project Description
**LoreFlow** is a professional-grade, local-first visual editor designed for narrative designers and game writers. Unlike standard text editors, LoreFlow allows users to architect non-linear stories through a node-based interface. Each node represents a story beat, dialogue, or script event, connected by logic-driven "edges" that define player choices and branching paths.

The tool focuses on the bridge between **creative writing** and **technical implementation**, allowing writers to export their complex narrative trees into structured JSON files ready to be dropped into any game engine (Unity, Unreal, or Godot).

### Core Features
*   **Infinite Canvas Interface:** A high-performance workspace with pan, zoom, and "snap-to-grid" node placement.
*   **Logic-Embedded Edges:** Connections aren't just lines; they hold conditional data (e.g., *"Only show this choice if `gold > 50`"*).
*   **Markdown-Powered Content:** A rich-text sidebar for each node, allowing writers to use Markdown for dialogue and stage directions.
*   **Global Variable Manager:** A dashboard to define player stats or flags (e.g., `isAlive`, `health`, `reputation`) that the flowchart logic interacts with.
*   **Instant Schema Export:** One-click export to a clean JSON structure that represents the narrative graph.
*   **Local Persistence:** Uses **IndexedDB** or **LocalStorage** to ensure work is never lost, even without a login system.

---



---

## Development Roadmap

### Phase 1: The Canvas & Node Architecture (The Foundation)
The goal is to get a draggable box on a screen and be able to create more of them.
*   **Tech Stack Setup:** React + Vite + Tailwind CSS.
*   **Library Selection:** Decide between **React Flow** (industry standard for nodes) or building a custom **SVG/Canvas** implementation if you want to show off "under-the-hood" math.
*   **The Node Model:** Define the TypeScript interface for a `Node` (ID, Position, Type, Data).
*   **Canvas Interaction:** Implement zooming, panning, and a "Context Menu" to add new nodes at specific coordinates.

### Phase 2: The "Link" Logic (Graph Theory)
This is where the game dev logic kicks in. You aren't just drawing lines; you’re creating a **Directed Acyclic Graph (DAG)**.
*   **Edge Implementation:** Create the ability to drag a "handle" from one node to another.
*   **Validation Logic:** Prevent "Illegal Connections" (e.g., a node connecting to itself if your engine doesn't support loops).
*   **State Sync:** Ensure that when a node moves, the lines (edges) recalculate their paths in real-time.

### Phase 3: The Narrative Suite (The "Writing" Part)
Transforming the boxes into a writing tool.
*   **The Inspector Sidebar:** Build a sliding panel that opens when a node is clicked.
*   **Markdown Integration:** Integrate a library like `react-markdown` or `Monaco Editor` for the node's main text.
*   **Metadata Fields:** Add inputs for "Speaker Name," "Emotion Tags," and "Audio Trigger Filepath."

### Phase 4: Variable System & Conditional Branching
This is the "pro" feature that separates this from a simple flowchart.
*   **Variable Store:** Create a global state to track user-defined variables (e.g., `has_sword: boolean`).
*   **Condition UI:** On the connection lines (edges), add a small UI to input conditions (e.g., `if has_sword == true`).
*   **Visual Feedback:** Style the lines differently (colors/dashes) if they have conditions attached.

### Phase 5: Serialization & Deployment
Making the tool useful for actual game development.
*   **JSON Compiler:** Write a utility function that traverses the graph and produces a nested JSON object.
*   **Local-First Storage:** Implement a "Save" system using the **File System Access API** (allowing users to save a `.lore` file directly to their computer).
*   **Portfolio Polish:** Add a "Demo Mode" with a pre-built story (e.g., a classic "Choose Your Own Adventure" intro) so recruiters can see it in action immediately.

---

### Why this works for you:
1.  **Complexity:** It shows you can handle $O(n)$ traversal of data and complex UI coordinate math.
2.  **Clean Code:** A project like this becomes "spaghetti" quickly if you don't use clean component architecture—building it proves you're an organized dev.
3.  **Unique:** Most applicants have a Todo list. You have a **Narrative Engine**.

Since you're going for a professional look, do you want to stick with **React Flow** to get it done faster, or are you looking to build the connection logic from scratch to show off your math/logic skills?


If speed and professional execution are the goals, **React Flow** is your best friend. It is the industry standard for this exact UI and will save you weeks of complex DOM math. 

Here is the architectural blueprint to build **LoreFlow** as fast as possible, leaning entirely on React Flow’s built-in power.

---

### 1. What React Flow Does For You (Don't build this)
React Flow handles the "hard math" of spatial UI. You get these out of the box:
*   **The Canvas:** Infinite panning, zooming, and a customizable dot/grid background.
*   **Node Physics:** Drag-and-drop mechanics, selection states, and bounding boxes.
*   **Routing & Connections:** Drawing lines (Edges) between nodes. It automatically calculates Bezier curves or 90-degree step-lines.
*   **Minimap & Controls:** Built-in components for a bottom-corner minimap and zoom buttons.
*   **Connection Validation:** Built-in hooks that let you say "Node A cannot connect to Node B."

---

### 2. The Data Architecture (What Nodes & Edges Hold)
React Flow requires a specific structure for `nodes` and `edges`. We will use their base structure and inject our game logic into the `data` object.

**The Node Schema (JSON)**
```typescript
{
  id: "node_1",
  type: "dialogueNode", // Maps to your custom React component
  position: { x: 250, y: 100 }, // React Flow handles updating this!
  data: {
    speaker: "King Arthur",
    text: "Only the worthy may pass. Do you have the sword?",
    tags: ["quest_main", "voice_clip_01"],
    // Any game-specific logic goes here
  }
}
```

**The Edge Schema (JSON)**
Edges represent the **Player's Choices** or **Logic Gates**.
```typescript
{
  id: "edge_1_to_2",
  source: "node_1", // Where it starts
  target: "node_2", // Where it goes
  type: "choiceEdge", // Maps to a custom line component
  data: {
    choiceText: "Yes, I have the Excalibur. (Show Sword)",
    condition: "inventory.includes('excalibur')", // Game engine logic
  }
}
```

---

### 3. Component Architecture
To build this fast, keep your React components strictly separated by responsibility.

*   **`App.jsx`** (The Wrapper)
    *   Holds global state (recommend **Zustand** for React Flow, it handles rapid updates much better than Context).
*   **`Toolbar.jsx`** (Top Bar)
    *   Buttons: `[+ Add Dialogue]`, `[+ Add Logic Node]`, `[Export to JSON]`, `[Clear Board]`.
*   **`FlowCanvas.jsx`** (The Core)
    *   The actual `<ReactFlow/>` component.
    *   Includes `<Background/>` and `<MiniMap/>`.
*   **Custom Nodes (Inside the Canvas)**
    *   `DialogueNode.jsx`: A styled card with a header (Speaker) and body (Text). Has a "Target Handle" (input) on top and "Source Handles" (outputs) on the bottom.
    *   `LogicNode.jsx`: A smaller, visually distinct node (maybe a diamond) used strictly for game logic (e.g., "Set gold = 0").
*   **`InspectorPanel.jsx`** (Right Sidebar)
    *   Listens for `onNodeClick` or `onEdgeClick` from React Flow.
    *   When a node is selected, this panel displays an HTML `<form>` to edit that node's `data` (Speaker name, typing the markdown text, setting conditions).

---

### 4. The "Fast Track" Implementation Strategy

**Step 1: Boilerplate & Board**
Install `reactflow` and render a hardcoded board. Get two default nodes on the screen and connect them. 
*Goal: Prove the canvas works.*

**Step 2: The Custom Node**
Create `DialogueNode.jsx`. Tell React Flow to use this component instead of its default boxes. Add some Tailwind styling so it looks like a script card.
*Goal: Make it look like a writing tool, not a generic flowchart.*

**Step 3: The Inspector (Crucial Step)**
Connect React Flow's `onSelectionChange` event to your state. When a user clicks your custom node, populate the right-side `InspectorPanel` with that node's data. If the user types in the Inspector, update the Node's data in real-time.
*Goal: Make the nodes editable without having to type directly on the tiny canvas boxes.*

**Step 4: The Exporter**
Create a function that takes React Flow's `nodes` and `edges` arrays, strips out the UI-specific stuff (like `position: {x,y}` if you don't need it), and spits out a clean JSON file. 
*Goal: Make it a real developer tool.*

### Recommended Tech Stack for Speed:
*   **Framework:** Vite + React (Fastest setup).
*   **Styling:** Tailwind CSS (Keeps your custom nodes looking sharp with minimal code).
*   **State:** Zustand (React Flow docs heavily recommend Zustand; it prevents the entire canvas from re-rendering every time you type a letter in the inspector).
*   **Icons:** Lucide-React (Clean, professional icons for your toolbar).