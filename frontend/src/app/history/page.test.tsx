import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HistoryPage from "./page";
import * as ToastContext from "../../components/Toast";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock useRouter
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Mock Toast
const showToast = jest.fn();
jest.spyOn(ToastContext, "useToast").mockReturnValue({ showToast });

describe("HistoryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar histórico e permitir filtro de período", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ history: [{ id: 1, name: "Ativ", description: "Desc", performed_at: new Date().toISOString() }] }) })
    );
    render(<HistoryPage />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Ativ")).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue("month"), { target: { value: "week" } });
    expect(mockFetch).toHaveBeenCalled();
  });

  it("deve exibir mensagem se não houver histórico", async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ history: [] }) }));
    render(<HistoryPage />);
    await waitFor(() => expect(screen.getByText(/nenhuma atividade encontrada/i)).toBeInTheDocument());
  });

  it("deve exibir erro ao falhar ao buscar histórico", async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject());
    render(<HistoryPage />);
    await waitFor(() => expect(screen.getByText(/erro ao buscar histórico/i)).toBeInTheDocument());
  });
});
