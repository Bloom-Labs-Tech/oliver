"use client";

import {
  ChevronDown,
  ChevronRight,
  Copy,
  CopyCheck,
  Trash,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { ColorPicker } from "~/components/ui/color-picker";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { useEmbedStore } from "~/providers/embedProvider";
import { EmbedField, EmbedFooter, EmbedType } from "~/stores/embedStore";

export function EmbedBuilder() {
  const exportData = useEmbedStore((state) => state.export);
  const embeds = useEmbedStore((state) => state.embeds);
  const addEmbed = useEmbedStore((state) => state.addEmbed);
  const clear = useEmbedStore((state) => state.reset);
  const [copied, setCopied] = useState(false);

  return (
    <div className="max-h-[calc(100vh-8rem)] h-full col-span-2 flex flex-col justify-between">
      <div className="bg-[#292b2f] rounded-lg p-4 flex-grow overflow-y-auto space-y-3 h-[90%]">
        <MessageContentCollapsible />
        {embeds.map((embed, idx) => (
          <EmbedCollapsible key={`embed-${idx}`} idx={idx} />
        ))}
      </div>
      <div className="flex-grow" />
      <div className="flex justify-center space-x-4 w-full">
        <Button onClick={addEmbed} variant="default">
          Add Embed
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-red-600 hover:text-white group"
          onClick={() => {
            const confirm = window.confirm(
              "Are you sure you want to clear all embeds?"
            );

            if (confirm) {
              clear();
            }
          }}
        >
          <Trash className="h-5 w-5 text-red-600 group-hover:text-white" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            exportData();
            setCopied(true);
            toast.success("Copied to clipboard!");

            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? (
            <CopyCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

type BaseCollapsibleProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

function BaseCollapsible({
  title,
  children,
  className,
  defaultOpen,
}: BaseCollapsibleProps) {
  const [isOpen, setOpen] = useState(defaultOpen || false);

  return (
    <Collapsible className="border-none" open={isOpen} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "bg-[#242629]/80 w-full text-start rounded-lg p-4 border-none justify-between flex",
          isOpen && "rounded-b-none bg-[#242629]"
        )}
      >
        <h2 className="text-xs font-extrabold">{title}</h2>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-150 text-muted-foreground",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      {isOpen && (
        <CollapsibleContent
          className={cn(
            "bg-[#242629] w-full h-full border-none rounded-t-none",
            className
          )}
        >
          {children}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function MessageContentCollapsible() {
  const content = useEmbedStore((state) => state.content);
  const setContent = useEmbedStore((state) => state.setContent);

  return (
    <BaseCollapsible title="Message Content" className="pb-2" defaultOpen>
      <Textarea
        className="w-full h-32 resize-y max-h-52"
        placeholder="Message content"
        maxLength={2000}
        rows={10}
        onChange={(e) => setContent(e.target.value)}
        defaultValue={content}
      />
    </BaseCollapsible>
  );
}

function FieldInputs({ idx, fieldIdx }: { idx: number; fieldIdx: number }) {
  const field = useEmbedStore((state) => state.embeds[idx].fields?.[fieldIdx]);
  const updateFieldState = useEmbedStore((state) => state.updateField);
  const deleteField = useEmbedStore((state) => state.removeField);
  const createField = useEmbedStore((state) => state.addField);
  const totalFields = useEmbedStore(
    (state) => state.embeds[idx].fields?.length
  );

  const updateField = useCallback(
    (field: EmbedField) => updateFieldState(idx, fieldIdx, field),
    [updateFieldState, idx, fieldIdx]
  );

  if (!field) return null;

  return (
    <div className="grid p-4 pt-0">
      <Input
        placeholder="Name"
        className="rounded-b-none bg-[#292b2f]"
        defaultValue={field.name}
        onChange={(e) => updateField({ ...field, name: e.target.value })}
      />
      <Textarea
        placeholder="Value"
        className="h-20 resize-y max-h-32 bg-[#212226]/75"
        defaultValue={field.value}
        onChange={(e) => updateField({ ...field, value: e.target.value })}
      />
      <div className="flex items-center space-x-4 mt-4">
        <div className="flex space-x-2">
          <Checkbox
            className="col-span-2"
            id="checkbox"
            onCheckedChange={(e) =>
              updateField({
                ...field,
                inline: [true, "true"].includes(e.valueOf()),
              })
            }
            defaultChecked={field.inline}
          />
          <Label htmlFor="checkbox" className="text-xs font-extrabold">
            Inline
          </Label>
        </div>
        <Button
          size="sm"
          variant="link"
          className="text-white hover:text-red-600 !no-underline"
          onClick={() => {
            const confirm = window.confirm(
              "Are you sure you want to delete this field?"
            );

            if (confirm) {
              deleteField(idx, fieldIdx);
            }
          }}
        >
          <X className="h-[1.6rem] w-[1.6rem]" />
          Remove
        </Button>
        {fieldIdx === (totalFields || 0) - 1 && (
          <Button
            size="sm"
            variant="link"
            className="text-white hover:text-green-600 !no-underline"
            onClick={() => createField(idx)}
          >
            Add Field
          </Button>
        )}
      </div>
    </div>
  );
}

function EmbedCollapsible({ idx }: { idx: number }) {
  const [isOpen, setOpen] = useState(false);

  const embed = useEmbedStore((state) => state.embeds[idx]);
  const deleteEmbed = useEmbedStore((state) => state.removeEmbed);
  const updateEmbedState = useEmbedStore((state) => state.updateEmbed);
  const updateEmbed = useCallback(
    (embed: EmbedType) => updateEmbedState(idx, embed),
    [updateEmbedState, idx]
  );

  const fields = useEmbedStore((state) => state.embeds[idx].fields);
  if (!embed) return null;

  return (
    <Collapsible className="border-none" open={isOpen} onOpenChange={setOpen}>
      <div className="flex justify-between items-center">
        <CollapsibleTrigger className="px-1 py-2 text-xs w-full flex items-center justify-start">
          <ChevronRight
            className={cn(
              "h-4 w-4 mr-2 transition-transform duration-150",
              isOpen && "rotate-90"
            )}
          />
          Embed {idx + 1}
          {embed.title && ` - ${embed.title}`}
        </CollapsibleTrigger>

        <div className="flex items-center space-x-2">
          <ColorPicker
            onChange={(color) => updateEmbed({ ...embed, color })}
            value={embed.color || "#000000"}
          />
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:text-red-600"
            onClick={() => {
              const confirm = window.confirm(
                "Are you sure you want to delete this embed?"
              );

              if (confirm) deleteEmbed(idx);
            }}
          >
            <Trash className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <CollapsibleContent className="space-y-4 mt-3">
        <BaseCollapsible
          title="AUTHOR"
          className="grid grid-cols-2 space-x-2 w-full p-4 pt-0 items-center"
        >
          <div className="flex space-x-2 items-center">
            <Avatar className="w-fit h-fit">
              <AvatarImage
                src={embed.author?.icon_url || ""}
                alt="Author Icon"
                className="w-10 h-10 rounded-full"
              />
              <AvatarFallback className="w-10 h-10 rounded-full">
                <X className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Icon URL"
              className="border-b border-muted-foreground rounded-none"
              onChange={(e) =>
                updateEmbed({
                  ...embed,
                  author: { ...embed.author, icon_url: e.target.value },
                })
              }
              defaultValue={embed.author?.icon_url}
            />
          </div>
          <Input
            placeholder="Name"
            className="border-b border-muted-foreground rounded-none"
            onChange={(e) =>
              updateEmbed({
                ...embed,
                author: { ...embed.author, name: e.target.value },
              })
            }
            defaultValue={embed.author?.name}
          />
        </BaseCollapsible>
        <Input
          placeholder="TITLE"
          className="bg-[#212226]/75 text-xs placeholder:font-extrabold py-6 px-4"
          onChange={(e) => updateEmbed({ ...embed, title: e.target.value })}
          defaultValue={embed.title}
        />
        <BaseCollapsible title="DESCRIPTION" className="pb-2">
          <Textarea
            placeholder="Description"
            className="w-full h-32 resize-y max-h-52 px-4"
            maxLength={2048}
            onChange={(e) =>
              updateEmbed({ ...embed, description: e.target.value })
            }
            defaultValue={embed.description}
          />
        </BaseCollapsible>
        <BaseCollapsible title="FIELDS">
          {fields?.map((field, index) => (
            <FieldInputs
              key={`embed-field-${idx}-${index}`}
              idx={idx}
              fieldIdx={index}
            />
          ))}
        </BaseCollapsible>
        <BaseCollapsible
          title="THUMBNAIL"
          className="flex items-start p-4 pt-0 space-x-2"
        >
          <Avatar className="w-fit h-fit rounded-md">
            <AvatarImage
              className="rounded-md w-[75px] h-[75px] object-cover"
              src={embed.image?.url}
              alt="Image"
            />
            <AvatarFallback className="rounded-md w-[75px] h-[75px]">
              <X className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <Input
            placeholder="Thumbnail URL"
            className="border-b border-muted-foreground rounded-none"
            onChange={(e) =>
              updateEmbed({
                ...embed,
                thumbnail: { url: e.target.value },
              })
            }
            defaultValue={embed.thumbnail?.url}
          />
        </BaseCollapsible>
        <BaseCollapsible
          title="IMAGE"
          className="flex items-start p-4 pt-0 space-x-2"
        >
          <Avatar className="w-fit h-fit rounded-md">
            <AvatarImage
              className="rounded-md w-32 h-20 object-cover"
              src={embed.image?.url}
              alt="Image"
            />
            <AvatarFallback className="rounded-md w-32 h-20">
              <X className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <Input
            placeholder="Image URL"
            className="border-b border-muted-foreground rounded-none"
            onChange={(e) =>
              updateEmbed({
                ...embed,
                image: { url: e.target.value },
              })
            }
            defaultValue={embed.image?.url}
          />
        </BaseCollapsible>
        <BaseCollapsible
          title="FOOTER"
          className="grid grid-cols-2 gap-x-2 p-4 pt-0 items-center"
        >
          <div className="flex space-x-1 items-center">
            <Avatar className="w-fit h-fit">
              <AvatarImage
                src={embed.footer?.icon_url || ""}
                alt="Author Icon"
                className="w-10 h-10 rounded-full"
              />
              <AvatarFallback className="w-10 h-10 rounded-full">
                <X className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Icon URL"
              className="border-b border-muted-foreground rounded-none"
              onChange={(e) => {
                updateEmbed({
                  ...embed,
                  footer: embed.footer
                    ? { ...embed.footer, icon_url: e.target.value }
                    : ({ text: "", icon_url: e.target.value } as EmbedFooter),
                });
              }}
              defaultValue={embed.footer?.icon_url}
            />
          </div>
          <Input
            placeholder="Text"
            className="border-b border-muted-foreground rounded-none"
            onChange={(e) => {
              updateEmbed({
                ...embed,
                footer: embed.footer
                  ? { ...embed.footer, text: e.target.value }
                  : ({ text: e.target.value, icon_url: "" } as EmbedFooter),
              });
            }}
            defaultValue={embed.footer?.text}
          />
          <DateTimePicker
            className="col-span-2 w-full mt-3"
            initialDate={
              embed.timestamp ? new Date(embed.timestamp) : new Date()
            }
            onSelect={(date) => {
              updateEmbed({
                ...embed,
                timestamp: date.toISOString(),
              });
            }}
          />
        </BaseCollapsible>
      </CollapsibleContent>
    </Collapsible>
  );
}
