// @vitest-environment jsdom

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecentPhoneInput } from "./recent-phone-input";

const serviceMocks = vi.hoisted(() => ({
  getRecentRecipients: vi.fn(),
  removeRecentRecipient: vi.fn(),
  clearRecentRecipients: vi.fn(),
}));

vi.mock("../services/customerService", () => ({
  customerService: serviceMocks,
}));

vi.mock("./shared-ui", () => ({ inputCls: "input" }));

function renderInput(initialValue = "") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Harness() {
    const [phone, setPhone] = useState(initialValue);
    return <RecentPhoneInput value={phone} onChange={setPhone} />;
  }

  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe("RecentPhoneInput", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getRecentRecipients.mockResolvedValue([
      { id: 1, phone: "07017844031", last_used_at: "2026-08-12T12:00:00Z" },
      { id: 2, phone: "08052551516", last_used_at: "2026-08-11T12:00:00Z" },
    ]);
    serviceMocks.removeRecentRecipient.mockResolvedValue(undefined);
    serviceMocks.clearRecentRecipients.mockResolvedValue(undefined);
  });

  it("fills the editable purchase input when a recent number is selected", async () => {
    renderInput();

    fireEvent.click(await screen.findByRole("button", { name: /choose a recent phone number/i }));
    fireEvent.click(screen.getByRole("option", { name: "08052551516" }));

    expect(screen.getByRole("textbox")).toHaveValue("08052551516");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("still accepts a newly typed number and strips non-digits", async () => {
    renderInput();
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "0805-255-1516" } });

    expect(input).toHaveValue("08052551516");
    expect(input).toHaveAttribute("maxlength", "11");
  });
});
