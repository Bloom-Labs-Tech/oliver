"use client";

import { Plus } from "lucide-react";
import { useStats } from "~/hooks/useStats";
import NumberTicker from "../magicui/number-ticker";

const formatValue = (value: number) =>
  value > 1_000_000_000
    ? value / 1_000_000_000
    : value > 1_000_000
    ? value / 1_000_000
    : value > 1_000
    ? value / 1_000
    : value;

const formatValueLabel = (value: number) =>
  value > 1_000_000_000
    ? "B"
    : value > 1_000_000
    ? "M"
    : value > 1_000
    ? "K"
    : "";

const formatLabel = (label: string) =>
  label === "messagesSent"
    ? "Messages Sent"
    : label === "roomsCreated"
    ? "Rooms Created"
    : "Servers Joined";

export function Stats() {
  const { data } = useStats();

  return (
    <section className="h-full justify-center items-center flex flex-col text-center">
      <h2 className="text-4xl font-bold mb-12">Oliver&apos;s Monthly Stats</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {Object.keys(data).map((stat) => {
          const value = data[stat as keyof typeof data];

          return (
            <div
              key={`stat-${stat}`}
              className="bg-gray-800 bg-opacity-30 p-6 rounded-lg"
            >
              <p className="text-gray-300 mb-2 text-xl">{formatLabel(stat)}</p>
              <div className="text-4xl font-medium mb-2 flex items-center w-full justify-center">
                {/* only have the number, nothing after thousand million ect */}
                <NumberTicker value={formatValue(value)} decimalPlaces={0} />
                {formatValueLabel(value)}
                {value > 1_000 && <Plus className="h-6 w-6 ml-1" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
