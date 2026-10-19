import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The real checkbox sits invisibly on top of the drawn box, so a click lands on it directly.
 * (Clicking a drawn box that re-clicks the input toggled twice inside a <label>: once by the
 * script, once by the label, so it never stayed ticked.)
 */
const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);

  React.useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);

  const handleChange = (e) => {
    setIsChecked(e.target.checked);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <span className="relative inline-flex h-4 w-4 shrink-0">
      <input
        type="checkbox"
        ref={ref}
        checked={isChecked}
        onChange={handleChange}
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-sm border transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          "peer-disabled:opacity-50",
          isChecked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
          className
        )}
      >
        {isChecked && <Check className="h-3 w-3" />}
      </span>
    </span>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox }
