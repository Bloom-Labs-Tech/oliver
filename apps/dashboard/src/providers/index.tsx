import { OliverAPIProvider } from "@oliver/api/react";
import { AuthStoreProvider } from "./authStoreProvider";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <OliverAPIProvider apiKey="prod:70EllT4IBNBm4l1p">
      <AuthStoreProvider>{children}</AuthStoreProvider>
    </OliverAPIProvider>
  );
}
