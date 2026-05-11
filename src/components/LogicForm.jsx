// import React from "react";
// import LogicEditor from "./LogicEditor";

// export default function LogicForm({ node }) {
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

import React from "react";
import LogicEditor from "./LogicEditor";
import { useLoreStore } from "../store";
import { Palette } from "lucide-react";

export default function LogicForm({ node }) {
  const { updateNodeData } = useLoreStore();

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
        <p className="text-[10px] text-orange-700 leading-tight italic">
          This node checks a global variable. If the condition is met, the flow
          follows the <strong>GREEN</strong> path. Otherwise, it follows{" "}
          <strong>RED</strong>.
        </p>
      </div>

      <LogicEditor nodeId={node.id} data={node.data} />

     
    </div>
  );
}