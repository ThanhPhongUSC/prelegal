import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthScreen from "@/components/AuthScreen";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userId: 1, email: "user@example.com", token: "tok" }),
    }),
  );
});

describe("AuthScreen", () => {
  it("renders the sign-in form by default", () => {
    render(<AuthScreen />);
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("switches to the sign-up form", async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);
    await user.click(screen.getByRole("button", { name: "Create one" }));
    expect(
      screen.getByRole("heading", { name: "Create your account" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("logs in, stores the token, and enters the platform", async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/creator"));
    expect(fetch).toHaveBeenCalledWith("/api/login", expect.objectContaining({ method: "POST" }));
    expect(window.localStorage.getItem("prelegal.auth")).toContain("tok");
  });

  it("shows an error when authentication fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Invalid email or password" }),
      }),
    );
    const user = userEvent.setup();
    render(<AuthScreen />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpw");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(push).not.toHaveBeenCalled();
  });
});
