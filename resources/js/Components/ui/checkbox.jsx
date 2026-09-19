import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);

  React.useEffect(() => {
    setIsChecked(checked || false);
  }, [checked]);

  const handleChange = (e) => {
    const newValue = e.target.checked;
    setIsChecked(newValue);
    if (onCheckedChange) {
      onCheckedChange(newValue);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        checked={isChecked}
        onChange={handleChange}
        className="peer sr-only"
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white cursor-pointer transition-all",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "flex items-center justify-center",
          isChecked ? "bg-blue-600 text-white border-blue-600" : "bg-white",
          className
        )}
        onClick={() => {
          const input = ref?.current || document.getElementById(props.id);
          if (input) input.click();
        }}
      >
        {isChecked && <Check className="h-3 w-3 text-white" />}
      </div>
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox }
