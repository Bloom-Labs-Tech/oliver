"use client";

import { cn } from "~/lib/utils";
import { useEmbedStore } from "~/providers/embedProvider";

export function EmbedPreviewer() {
  const embeds = useEmbedStore((state) => state.embeds);

  return (
    <div className="bg-[#292b2f] rounded-lg p-4 flex-grow h-full overflow-y-auto space-y-3 col-span-4 max-h-[calc(100vh-8rem)]">
      {embeds.map((embed, index) => {
        const { author, title, description, fields, image, thumbnail, footer } =
          embed;

        return (
          <div
            className={cn(
              "bg-gray-800 p-4 rounded-lg text-white max-w-2xl border-solid border-l-8"
            )}
            style={{
              borderLeftColor: embed.color,
            }}
            key={`embed-${index}`}
          >
            {/* Author */}
            {author?.name && (
              <div className="flex items-center mb-2">
                {author.icon_url && (
                  <img
                    src={author.icon_url}
                    alt="Author Icon"
                    className="h-8 w-8 mr-2 rounded-full"
                  />
                )}
                <span className="font-semibold">{author.name}</span>
              </div>
            )}

            {/* Title */}
            {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}

            {/* Description */}
            {description && <p className="mb-4">{description}</p>}

            {/* Fields */}
            {fields && fields.length > 0 && (
              <div className="mb-4">
                {fields.map((field, index) => (
                  <div
                    key={`field-${index}`}
                    className={`mb-2 ${
                      field.inline ? "inline-block w-1/2" : ""
                    }`}
                  >
                    <strong>{field.name}</strong>: {field.value}
                  </div>
                ))}
              </div>
            )}

            {/* Image */}
            {image?.url && (
              <div className="mb-4">
                <img src={image.url} alt="Embed" className="rounded-lg" />
              </div>
            )}

            {/* Thumbnail */}
            {thumbnail?.url && (
              <div className="absolute top-0 right-0">
                <img
                  src={thumbnail.url}
                  alt="Thumbnail"
                  className="h-16 w-16"
                />
              </div>
            )}

            {/* Footer */}
            {footer?.text && (
              <div className="mt-4 flex items-center">
                {footer.icon_url && (
                  <img
                    src={footer.icon_url}
                    alt="Footer Icon"
                    className="h-6 w-6 mr-2"
                  />
                )}
                <span>{footer.text}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
