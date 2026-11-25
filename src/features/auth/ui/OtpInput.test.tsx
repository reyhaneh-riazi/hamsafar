import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "./OtpInput";

function Harness({ onComplete }: { onComplete: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <OtpInput
      length={5}
      value={value}
      onChange={setValue}
      onComplete={onComplete}
      autoFocus
    />
  );
}

describe("OtpInput", () => {
  it("moves focus forward while typing and completes with 5 digits", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await userEvent.keyboard("12345");
    expect(onComplete).toHaveBeenCalledWith("12345");
    expect(screen.getByLabelText("رقم 5 از 5")).toHaveValue("5");
  });

  it("accepts a pasted Persian code", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    await userEvent.click(screen.getByLabelText("رقم 1 از 5"));
    await userEvent.paste("۱۲۳۴۵");
    expect(onComplete).toHaveBeenCalledWith("12345");
  });

  it("Backspace on an empty cell clears the previous digit", async () => {
    render(<Harness onComplete={() => undefined} />);
    await userEvent.keyboard("12");
    await userEvent.keyboard("{Backspace}");
    expect(screen.getByLabelText("رقم 2 از 5")).toHaveValue("");
    expect(screen.getByLabelText("رقم 1 از 5")).toHaveValue("1");
  });

  it("ignores non-digits", async () => {
    render(<Harness onComplete={() => undefined} />);
    await userEvent.keyboard("a");
    expect(screen.getByLabelText("رقم 1 از 5")).toHaveValue("");
  });
});
