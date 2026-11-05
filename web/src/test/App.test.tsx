import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { Game } from "../components/Game";

const cards = () => screen.getAllByRole("button", { name: "Hidden card" });

describe("Memory", () => {
  beforeEach(() => localStorage.clear());

  it("offers three grid sizes", () => {
    render(<App />);
    expect(cards()).toHaveLength(16);
    fireEvent.click(screen.getByRole("button", { name: /Medium/ }));
    expect(cards()).toHaveLength(20);
    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    expect(cards()).toHaveLength(30);
  });

  it("shows the best score for the selected size", () => {
    localStorage.setItem("freememory-best", "9000");
    localStorage.setItem("freememory-best-hard", "7000");
    render(<App />);
    expect(screen.getByText("9000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Hard/ }));
    expect(screen.getByText("7000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Medium/ }));
    expect(screen.queryByText("7000")).toBeNull();
  });
});

describe("Game", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("clears the mismatch flip-back timeout on unmount", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic deck: cards 0 and 1 differ
    const { unmount } = render(<Game difficulty="easy" onWin={() => {}} />);
    vi.mocked(Math.random).mockRestore();
    fireEvent.click(cards()[0]!);
    fireEvent.click(cards()[0]!);
    expect(cards()).toHaveLength(14);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.runAllTimers());
  });
});
