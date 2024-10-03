"use client";

import { forwardRef, useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import type { ButtonProps } from "~/components/ui/button";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useForwardedRef } from "~/lib/use-forwarded-ref";
import { cn } from "~/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (value: `#${string}`) => void;
  onBlur?: () => void;
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, "value" | "onChange" | "onBlur"> & ColorPickerProps
>(
  (
    { disabled, value, onChange, onBlur, name, className, ...props },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);
    const [color, setColor] = useState(value);

    const handleChange = useCallback(
      (newColor: `#${string}`) => {
        setColor(newColor);
        onChange(newColor);

        if (ref.current) {
          ref.current.value = newColor;
        }
      },
      [onChange, ref]
    );

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn("block", className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size="icon"
            style={{
              backgroundColor: color,
            }}
            variant="outline"
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full">
          <HexColorPicker
            color={color}
            onChange={(v) => handleChange(v as `#${string}`)}
          />
          <Input
            maxLength={7}
            onChange={(e) => {
              const value = e.target.value;
              if (value.match(/^#[0-9a-f]{0,6}$/i)) {
                handleChange(color as `#${string}`);
              }
            }}
            ref={ref}
            defaultValue={value}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
