import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const demoCredentials = [
  { email: "admin@bauplan.de", password: "admin123", role: "Admin" },
  { email: "manager@bauplan.de", password: "manager123", role: "Manager" },
  { email: "user@bauplan.de", password: "user123", role: "User" },
  { email: "client@bauplan.de", password: "client123", role: "Client" },
];

export function useLoginPageState() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const submitLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("LoginPage: Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("LoginPage: Quick login error:", err);
      setError(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showPassword,
    setShowPassword,
    isLoading,
    error,
    demoCredentials,
    submitLogin,
    quickLogin,
  };
}
