// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function signIn(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  beforeEach(() => render(<LoginForm />));

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    push.mockReset();
  });

  it("posts the credentials and brings the user into the platform", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    signIn("ada@example.com", "secret");

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/nda/"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "ada@example.com", password: "secret" });
  });

  it("shows an error and stays on the page when sign in fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));

    signIn("ada@example.com", "secret");

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Sign in failed. Please try again.",
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveProperty("disabled", false);
  });

  it("shows an error when the backend is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    signIn("ada@example.com", "secret");

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
