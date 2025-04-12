import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If the user is not loaded yet, show a loading indicator
  if (loading) {
    return <div>Loading...</div>;
  }

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    router.push("/login");
    return null;
  }

  // If the user is authenticated, render the children components
  return <>{children}</>;
}
