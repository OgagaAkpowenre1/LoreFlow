// import LogicEditor from "./LogicEditor";
// import { useLoreStore } from "../store";
// import { Palette } from "lucide-react";

// export default function LogicForm({ node }) {
//   const { updateNodeData } = useLoreStore();

//   return (
//     <div className="space-y-4">
//       <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
//         <p className="text-[10px] text-orange-700 leading-tight italic">
//           This node checks a global variable. If the condition is met, the flow
//           follows the <strong>GREEN</strong> path. Otherwise, it follows{" "}
//           <strong>RED</strong>.
//         </p>
//       </div>

//       <LogicEditor nodeId={node.id} data={node.data} />

//     </div>
//   );
// }

import LogicEditor from "./LogicEditor";
import { useLoreStore } from "../store";

export default function LogicForm({ node }) {
  const { updateNodeData } = useLoreStore();

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-orange-700 uppercase">
            Logic Mode
          </span>
          <select
            value={node.data.logicalOperator || "AND"}
            onChange={(e) =>
              updateNodeData(node.id, {
                ...node.data,
                logicalOperator: e.target.value,
              })
            }
            className="text-[10px] font-bold bg-white border border-orange-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="AND">MATCH ALL (AND)</option>
            <option value="OR">MATCH ANY (OR)</option>
          </select>
        </div>
        <p className="text-[10px] text-orange-700 leading-tight italic">
          Following the <strong>GREEN</strong> path requires{" "}
          {node.data.logicalOperator === "OR"
            ? "at least one condition"
            : "every condition"}{" "}
          to be met.
        </p>
      </div>

      <LogicEditor nodeId={node.id} data={node.data} />
    </div>
  );
}