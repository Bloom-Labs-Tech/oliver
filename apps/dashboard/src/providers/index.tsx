import { AuthStoreProvider } from "./authStoreProvider";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthStoreProvider>{children}</AuthStoreProvider>;
}
