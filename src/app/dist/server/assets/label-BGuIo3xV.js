import { jsx } from "react/jsx-runtime";
import { Label as Label$1 } from "radix-ui";
import { d as cn } from "./router-Bhor0jGk.js";
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Label$1.Root,
    {
      "data-slot": "label",
      className: cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      ),
      ...props
    }
  );
}
export {
  Label as L
};
