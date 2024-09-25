import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Github, Twitter } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function OliverLandingPage() {
  return (
    <main className="relative container mx-auto px-4 py-12 z-10">
      <section className="text-center mb-24">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Meet Oliver
          <br />
          Your All-in-One Discord Companion
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Oliver is your go-to Discord bot for effortless server management.
          With powerful tools and an easy-to-use dashboard, Oliver makes it easy
          to keep your community organized and fun.
        </p>
        <div className="flex justify-center space-x-4">
          <Button
            variant="default"
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-200"
          >
            Discover More
          </Button>
          <Button variant="outline" size="lg">
            See Documentation
          </Button>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="ghost" size="icon">
            <DiscordLogoIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Github className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Twitter className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className="mb-24">
        <h2 className="text-4xl font-bold text-center mb-12">Our Features</h2>
        <h2 className="text-5xl font-bold text-center mb-8">
          Everything You Need to Manage Your Server
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Leveling System",
              image: "https://via.assets.so/img.jpg",
            },
            {
              title: "Moderation Tools",
              image: "https://via.assets.so/img.jpg",
            },
            {
              title: "Tickets System",
              image: "https://via.assets.so/img.jpg",
            },
          ].map((feature) => (
            <div
              key={`feature-${feature.title}`}
              className="bg-gray-800 bg-opacity-30 rounded-lg overflow-hidden"
            >
              <img
                src={feature.image}
                alt={feature.title}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et
                  massa mi. Aliquam in hendrerit urna.
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button
            variant="link"
            size="lg"
            className="text-white hover:text-gray-300"
          >
            See Our Demo
          </Button>
        </div>
      </section>

      <section className="mb-24">
        <img
          src="https://via.assets.so/img.jpg?w=800&h=400"
          alt="Oliver UI"
          width={800}
          height={400}
          className="w-full rounded-lg shadow-2xl"
        />
      </section>

      <section className="text-center mb-24">
        <h2 className="text-4xl font-bold mb-12">
          Oliver&apos;s Monthly Stats
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { label: "Servers Joined", value: "100+", change: "+25%" },
            { label: "Rooms Created", value: "165K+", change: "+16%" },
            { label: "Messages Sent", value: "100M+", change: "-56%" },
          ].map((stat) => (
            <div
              key={`stat-${stat.label}`}
              className="bg-gray-800 bg-opacity-30 p-6 rounded-lg"
            >
              <p className="text-gray-300 mb-2">{stat.label}</p>
              <p className="text-5xl font-bold mb-2">{stat.value}</p>
              <p
                className={`text-sm ${
                  stat.change.startsWith("+")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center mb-24">
        <h2 className="text-4xl font-bold mb-8">
          Join others, discover new rooms, and have fun!
        </h2>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { name: "Bloomlabs", members: 98 },
            { name: "Discord Community", members: 120 },
            { name: "Oliver Support", members: 45 },
          ].map((room) => (
            <div
              key={`room-${room.name}`}
              className="bg-gray-800 bg-opacity-30 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
              <p className="text-gray-300 mb-4">{room.members} members</p>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-white border-white hover:bg-white hover:text-gray-900"
              >
                Room Details
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="default"
          size="lg"
          className="bg-white text-gray-900 hover:bg-gray-200"
        >
          Discover Rooms
        </Button>
      </section>

      <section className="text-center bg-gray-800 bg-opacity-30 rounded-lg p-12">
        <h2 className="text-4xl font-bold mb-8">
          Let&apos;s get started with Oliver
        </h2>
        <p className="mb-8 max-w-2xl mx-auto">
          Invite Oliver to your server and start managing your community with
          ease.
        </p>
        <Button
          variant="default"
          size="lg"
          className="bg-white text-gray-900 hover:bg-gray-200"
        >
          Invite To Server
        </Button>
      </section>
    </main>
  );
}
