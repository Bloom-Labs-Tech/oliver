import * as React from "react";

import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const CopyInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            type="text"
            className={cn("cursor-pointer", className)}
            onClick={(e) => {
              e.preventDefault();
              e.currentTarget.select();
              navigator.clipboard.writeText(e.currentTarget.value);
              setCopied(true);
              toast.success("Copied to clipboard");
              setTimeout(() => setCopied(false), 2000);
            }}
            readOnly
            ref={ref}
            {...props}
          />
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied!" : "Click to copy"}</TooltipContent>
      </Tooltip>
    );
  }
);
CopyInput.displayName = "CopyInput";

export { CopyInput, Input };
