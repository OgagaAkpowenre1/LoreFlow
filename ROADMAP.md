# LoreFlow — RPG Roadmap & Feature Specification

---

## Current State

LoreFlow is a single-graph dialogue editor. One project = one canvas. Variables and
lists are project-wide, but there is only one node graph per project. Logic nodes
currently evaluate one condition: one variable, one operator, one value.

This makes it complete for linear narrative games (visual novels, narrative RPGs where
the player mostly talks). It is not yet usable for open-world RPGs where a cast of
NPCs each need multiple conversations that react to a shared global game state.

---

## Phase 1 — Logic Node Compounding
**Scope: one feature, self-contained, no architecture changes**

### The Problem
A logic node currently checks one thing:
```
IF player_has_key == true → Branch A
```

Real branching needs compound conditions:
```
IF player_has_key == true AND door_unlocked == false → Branch A
IF gold >= 50 OR player_is_thief == true → Branch B
```

### Data Model Change
A single logic node's condition row changes from:

```js
// BEFORE — one condition per route
{ variable: "player_has_key", op: "==", value: true, target: "node_x" }

// AFTER — a group of conditions per route, combined by a logical operator
{
  operator: "AND",   // "AND" | "OR"
  conditions: [
    { variable: "player_has_key", op: "==", value: true },
    { variable: "door_unlocked",  op: "==", value: false }
  ],
  target: "node_x"
}
```

Each route in the logic node has:
- An `operator` field: AND or OR
- An array of `conditions`, each being a variable + op + value check
- A `target` node to route to if the group evaluates to true
- The existing fallback route stays as-is (no conditions, always fires last)

### Evaluation Logic
```
AND → every condition in the group must be true
OR  → at least one condition in the group must be true
```

### UI Changes (LogicEditor.jsx)
Each route row expands to show:
- An AND/OR toggle at the top of the route
- A list of condition rows (variable, operator, value) — minimum one
- A + Add Condition button per route
- A remove button per individual condition (hidden when only one remains)
- The target node selector stays where it is, at the end of the route row

Visually each route becomes a small card rather than a single row.

### What Does Not Change
- The number of routes per logic node (still unlimited)
- The fallback route
- How targets are assigned
- The store's addConditionToRoute / removeRoute actions — just extended

---

## Phase 2 — Multi-Graph Project Model
**Scope: store architecture change, new UI panel, no visual changes to canvas**

### The Problem
One project = one graph. RPG authors need to author 50+ conversations in one
project with shared variables and lists.

### Store Change
```js
// BEFORE
{
  nodes: [...],
  edges: [...],
  lists: {...},
  schema: {...}
}

// AFTER
{
  graphs: {
    "main": { nodes: [...], edges: [...] },          // default graph on new project
    "blacksmith_intro": { nodes: [...], edges: [...] },
    "guard_default":    { nodes: [...], edges: [...] }
  },
  activeGraph: "main",
  lists: {...},    // unchanged — still project-wide
  schema: {...}    // unchanged — still project-wide
}
```

The canvas always renders `graphs[activeGraph].nodes` and
`graphs[activeGraph].edges`. All existing node/edge actions (addNode, updateNodeData,
deleteNode, etc.) are scoped to `activeGraph` — they only change one line each.

### New UI: Graph Manager Panel
A collapsible left sidebar panel (or new tab in the existing left area) showing:
- List of all graphs in the project
- Click a graph name → sets activeGraph → canvas updates
- + New Graph button → prompts for a name → creates empty graph
- Rename (double-click on name)
- Duplicate graph
- Delete graph (with confirm, disabled if it's the last one)
- Active graph highlighted

The graph manager is the only new UI surface. The canvas, inspector, settings editor,
and all node types are unchanged.

### Migration
Existing saved projects have `nodes` and `edges` at the top level. On load, if the
store detects the old shape, it wraps them automatically:
```js
if (saved.nodes && !saved.graphs) {
  saved.graphs = { main: { nodes: saved.nodes, edges: saved.edges } };
  saved.activeGraph = "main";
}
```
No data loss, no user action required.

---

## Phase 3 — Conversation Registry
**Scope: new SettingsEditor tab, new export section**

### The Problem
After Phase 2, the author has 50 graphs. The game engine still needs to know which
graph to load for which NPC under which conditions. Without this, the author writes
that routing logic manually in GDScript.

### What It Is
A registry is a lookup table: NPC name → ordered list of (condition, graph) pairs.
The engine walks the list top to bottom and loads the first graph whose condition
is met.

```json
"registry": {
  "blacksmith": [
    { "priority": 100, "condition": { "variable": "wolf_dead", "op": "==", "value": true }, "graph": "blacksmith_wolf_done" },
    { "priority": 0,   "condition": null, "graph": "blacksmith_intro" }
  ]
}
```

`priority: 0, condition: null` is always the fallback.

### UI: Registry Tab in SettingsEditor
New tab alongside Blueprints and Global Lists:
- List of NPC entries, each with a name
- Each NPC has an ordered list of rules
- Each rule: a condition picker (uses existing variable list) + graph selector
  (populated from the graphs in Phase 2) + priority number
- Rules can be reordered by dragging
- Add NPC / remove NPC buttons

### What This Unlocks
The Godot plugin's `talk_to(npc_id)` needs zero custom code per NPC. The entire
routing table ships inside the exported JSON.

---

## Phase 4 — Export Pipeline
**Scope: new export function, ImportButton.jsx update**

### Export Format
One JSON file for the entire project:

```json
{
  "version": "2.0",
  "variables": {
    "wolf_dead":   { "type": "boolean", "default": false },
    "player_gold": { "type": "number",  "default": 0 }
  },
  "graphs": {
    "blacksmith_intro": {
      "entry": "node_1",
      "nodes": { ... },
      "edges": [ ... ]
    }
  },
  "registry": {
    "blacksmith": [ ... ]
  }
}
```

`entry` is the ID of the first node in that graph (the one with no incoming edges).
The exporter calculates this automatically by finding nodes with in-degree 0.

### Visual Novel Export (backwards compatible)
If the project has only one graph and no registry, the export omits the
`registry` key and puts `nodes`/`edges` at the top level with a `"version": "1.0"`
flag. The existing v1 Godot plugin still works without changes.

### What Triggers Export
Replaces or extends the existing ImportButton.jsx:
- Export Project button → downloads the full JSON
- Export Format selector: Full Project (RPG) | Single Graph (Visual Novel)
- Import Project → loads a previously exported JSON back into the editor

---

## Phase 5 — Godot Plugin
**Scope: GDScript only, ships alongside the tool as a downloadable addon**

### File Structure
```
addons/loreflow/
  plugin.cfg
  loreflow.gd          ← runtime class, loaded once as autoload
  dialogue_manager.gd  ← singleton, handles talk_to() and registry routing
  dialogue_ui.tscn     ← optional starter UI scene
```

### loreflow.gd responsibilities
- Load and parse the exported JSON
- Seed GameState variables from the `variables` block on first load
- Evaluate compound AND/OR conditions against GameState
- Advance through a graph (next line, pick choice, resolve logic node)
- Emit signals: `line_started`, `line_finished`, `choice_presented`, `graph_finished`

### dialogue_manager.gd responsibilities
- `talk_to(npc_id: String)` — looks up the registry, evaluates conditions against
  GameState, loads the correct graph, starts it
- `set_variable(key, value)` — writes to GameState and fires any watchers
- `get_variable(key)` — reads from GameState

### Integration for the developer
```gdscript
# In any NPC script:
func _on_interact():
    DialogueManager.talk_to("blacksmith")

# Anywhere a game event fires:
func _on_wolf_killed():
    DialogueManager.set_variable("wolf_dead", true)

# In your dialogue UI:
func _on_LoreFlow_line_started(line):
    $Speaker.text = line.speaker
    $Text.text = line.text
```

That is the complete integration. No custom routing code, no file path management,
no condition evaluation — all handled by the plugin.

---

## Phase 6 — Playtest Mode
**Scope: new UI mode inside LoreFlow, no engine required**

### What It Is
A "Play from here" button on any node that simulates walking the graph inside the
browser. The author can test their dialogue without opening Godot.

### How It Works
- Click "Play from here" on any node → enters playtest mode
- A panel slides in showing the current node's lines one at a time
- If the node has choices, they appear as buttons
- Logic nodes are evaluated automatically using the current variable state
- A variable inspector panel shows live variable values and lets the author
  manually set them (to test different branches)
- An event log shows every node visited in order (the variable timeline)
- "Exit Playtest" returns to the normal editor

### Why This Matters
- Cuts the test loop from: edit → export → open Godot → run scene → find bug
  down to: edit → play → find bug
- The variable inspector replaces the need for a separate debug session in Godot
  for most logic issues

---

## Build Order Summary

| Phase | What It Delivers | Effort |
|-------|-----------------|--------|
| 1 — Logic Compounding | AND/OR multi-condition logic nodes | Small — store + LogicEditor UI only |
| 2 — Multi-Graph Model | Full RPG cast authoring in one project | Medium — store migration + graph panel |
| 3 — Conversation Registry | NPC routing table, no GDScript per NPC | Medium — new SettingsEditor tab |
| 4 — Export Pipeline | Shippable JSON for game engines | Small — pure data transformation |
| 5 — Godot Plugin | Drop-in runtime, zero engine config | Medium — GDScript only, no React |
| 6 — Playtest Mode | In-editor dialogue testing | Large — new UI mode, condition evaluator |

Phases 1–4 make LoreFlow a complete RPG pipeline.
Phase 5 makes it a complete Godot tool.
Phase 6 makes it better than every paid competitor.

---

## What Stays Unchanged

The canvas, ReactFlow wiring, node visual design, Inspector, SceneForm,
SequenceEditor, ChoiceEditor, FlagGroup, SmartInput, schema system, and
SettingsEditor structure are all untouched through Phase 4. Every phase
is additive. Nothing already built is thrown away.


### Future Optimization (Post-MVP)
*   **Lazy Validation for Deletions:** Currently, when a user deletes a Variable or a Character from the Global Lists, the engine synchronously loops through all graphs, nodes, and registry rules to "scrub" the deleted item. For small to medium projects, this is fine and keeps the data perfectly clean. However, if projects scale to hundreds of graphs and thousands of nodes, this $O(N)$ operation on the UI thread will cause a noticeable freeze.
*   **Solution:** Move to a "Lazy Validation" model (like Unity/Unreal). Deletions from the Global List should be instant. The Map Nodes and Registry should check for "broken references" during render and display a red warning state. The heavy scrubbing should be deferred to the `exportGameData` JSON generation process.