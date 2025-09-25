import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { isLoading, token } = useAuth();
  if (isLoading) return null;
  return <Redirect href={token ? "/web" : "/sign-in"} />;
}
