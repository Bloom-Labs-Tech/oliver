"use client";

export default function Page({ params }: { params: { guild: string } }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="text-lg mt-4">
        Welcome to the dashboard! This is where you can manage your server.
        {params.guild}
      </p>
    </div>
  );
}
