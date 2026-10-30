import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Resources from "../components/resources/Resources";

const state = vi.hoisted(() => ({ role: "admin", rows: [] as Record<string, unknown>[], inserted: null as Record<string, unknown> | null }));
vi.mock("@/lib/state", () => ({ useApp: () => ({ user: { id: "staff-id", role: state.role } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({
  select: () => ({ order: async () => ({ data: state.rows, error: null }), eq: async () => ({ data: [], error: null }) }),
  insert: (values: Record<string, unknown>) => ({ select: () => ({ single: async () => {
    state.inserted = values;
    const row = { ...values, id: "resource-id" };
    state.rows.push(row);
    return { data: row, error: null };
  } }) }),
}) } }));

afterEach(() => { cleanup(); state.rows = []; state.inserted = null; });
describe("resource management", () => {
  it("saves an educational channel and reads it back with its link", async () => {
    state.role = "admin";
    render(<Resources />);
    fireEvent.click(await screen.findByRole("button", { name: "إضافة مصدر" }));
    fireEvent.change(screen.getByLabelText("عنوان المصدر"), { target: { value: "قناة الرياضيات" } });
    fireEvent.change(screen.getByLabelText("المادة", { selector: "input" }), { target: { value: "الرياضيات" } });
    fireEvent.change(screen.getByLabelText("الرابط"), { target: { value: "https://www.youtube.com/@teacher" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ المصدر" }));
    await waitFor(() => expect(state.inserted).toMatchObject({ title: "قناة الرياضيات", category: "youtube", created_by: "staff-id", subject: "الرياضيات" }));
    expect(await screen.findByRole("link", { name: "فتح المصدر" })).toHaveAttribute("href", "https://www.youtube.com/@teacher");
  });
  it("students browse exercise links without staff controls", async () => {
    state.role = "student";
    state.rows = [{ id: "exercise-id", created_by: "staff-id", title: "تمارين الرياضيات", subject: "الرياضيات", category: "exercise", url: "https://example.org/exercises.pdf", description: "" }];
    render(<Resources />);
    expect(await screen.findByRole("link", { name: "فتح المصدر" })).toHaveAttribute("href", "https://example.org/exercises.pdf");
    expect(screen.queryByRole("button", { name: "إضافة مصدر" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "تعديل تمارين الرياضيات" })).not.toBeInTheDocument();
  });
});