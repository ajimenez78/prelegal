// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function submit(email: string, password: string, button = "Sign in") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: button }));
}

function respondWith(body: object, status: number) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    push.mockReset();
  });

  it("posts the credentials and brings the user to their documents", async () => {
    render(<LoginForm />);
    const fetchMock = respondWith({ email: "ada@example.com" }, 200);

    submit("ada@example.com", "secret");

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/documents/"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "ada@example.com", password: "secret" });
  });

  it("signs up in signup mode", async () => {
    render(<LoginForm mode="signup" />);
    const fetchMock = respondWith({ email: "ada@example.com" }, 200);

    submit("ada@example.com", "secret123", "Create account");

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/documents/"));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/signup");
  });

  it("shows the server's reason for wrong credentials", async () => {
    render(<LoginForm />);
    respondWith({ detail: "Invalid email or password" }, 401);

    submit("ada@example.com", "secret");

    expect((await screen.findByRole("alert")).textContent).toBe("Invalid email or password");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a generic error and stays on the page when the server fails", async () => {
    render(<LoginForm />);
    respondWith({}, 500);

    submit("ada@example.com", "secret");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Sign in failed. Please try again.",
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveProperty("disabled", false);
  });

  it("shows an error when the backend is unreachable", async () => {
    render(<LoginForm />);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    submit("ada@example.com", "secret");

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
