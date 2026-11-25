/**
 * Demo-only switch for the mock API: lets reviewers see loading, error and offline states on
 * purpose. Read by the mock handlers; has no effect when VITE_API_MOCKING=disabled.
 */
export type MockNetworkMode = "normal" | "slow" | "error" | "offline";

export const MOCK_NETWORK_MODES: readonly {
  value: MockNetworkMode;
  label: string;
  hint: string;
}[] = [
  { value: "normal", label: "عادی", hint: "پاسخ‌ها با تأخیر کوتاه" },
  { value: "slow", label: "شبکه کند", hint: "هر درخواست حدود ۳ ثانیه" },
  {
    value: "error",
    label: "خطای سرور",
    hint: "همه درخواست‌ها ۵۰۰ برمی‌گردانند",
  },
  { value: "offline", label: "قطع ارتباط", hint: "سرور در دسترس نیست" },
];

const KEY = "hamsafar:mock-network";

export function getMockNetworkMode(): MockNetworkMode {
  try {
    const v = window.sessionStorage.getItem(KEY);
    return v === "slow" || v === "error" || v === "offline" ? v : "normal";
  } catch {
    return "normal";
  }
}

export function setMockNetworkMode(mode: MockNetworkMode): void {
  try {
    if (mode === "normal") window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, mode);
  } catch {
    /* storage unavailable: stays normal */
  }
}
