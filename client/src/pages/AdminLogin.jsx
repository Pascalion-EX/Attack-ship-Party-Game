import { useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext.jsx";

import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    admin,
    authLoading,
    login,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      toast.error("Enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate(
        location.state?.from || "/admin",
        {
          replace: true,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Login failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!authLoading && admin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="grid min-h-screen bg-zinc-950 lg:grid-cols-2">
      <section className="hidden border-r border-zinc-800 bg-zinc-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 font-bold text-zinc-950">
            A
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-400">
            Attackship
          </p>

          <h1 className="mt-3 max-w-lg text-4xl font-semibold leading-tight tracking-tight text-white">
            Camp game control without unnecessary complexity.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">
            Create games, configure rounds, control attacks,
            and display the live projector board from one interface.
          </p>
        </div>

        <p className="text-xs text-zinc-600">
          Administrator access only
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-bold text-zinc-950">
              A
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Attackship
            </p>
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            Sign in
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Use your administrator account to continue.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="admin@attackship.com"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={submitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting
                ? "Signing in..."
                : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default AdminLogin;