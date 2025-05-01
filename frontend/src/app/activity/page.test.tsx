import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ActivityPage from "./page";
import * as ToastContext from "../../components/Toast";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock useRouter
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Mock Toast
const showToast = jest.fn();
jest.spyOn(ToastContext, "useToast").mockReturnValue({ showToast });

describe("ActivityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar lista de atividades e permitir cadastro", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ activities: [{ id: 1, name: "Ativ 1", description: "Desc 1", created_at: new Date().toISOString() }] }) })
    );
    render(<ActivityPage />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Ativ 1")).toBeInTheDocument());
  });

  it("deve exibir erro ao falhar ao buscar atividades", async () => {
    mockFetch.mockImplementationOnce(() => Promise.reject());
    render(<ActivityPage />);
    await waitFor(() => expect(screen.getByText(/erro ao buscar atividades/i)).toBeInTheDocument());
  });

  it("deve cadastrar nova atividade e exibir toast", async () => {
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ activities: [] }) })) // fetch inicial
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ activity: { id: 2, name: "Nova", description: "Desc", created_at: new Date().toISOString() } }) }));
    render(<ActivityPage />);
    await waitFor(() => expect(screen.getByText(/cadastrar nova atividade/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Nova" } });
    fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: "Desc" } });
    fireEvent.click(screen.getByText(/salvar/i));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Atividade cadastrada com sucesso!", "success"));
  });

  it("deve registrar participação em atividade", async () => {
    mockFetch
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ activities: [{ id: 1, name: "Ativ 1", description: "Desc 1", created_at: new Date().toISOString() }] }) })) // fetch inicial
      .mockImplementationOnce(() => Promise.resolve({ ok: true })); // log
    render(<ActivityPage />);
    await waitFor(() => expect(screen.getByText("Ativ 1")).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue(""), { target: { value: "1" } });
    fireEvent.click(screen.getByText(/registrar participação/i));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Participação registrada com sucesso!", "success"));
  });

  it("deve exibir erro ao tentar registrar participação sem selecionar atividade", async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ activities: [] }) }));
    render(<ActivityPage />);
    await waitFor(() => expect(screen.getByText(/cadastrar nova atividade/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /registrar participação/i }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Selecione uma atividade para registrar.", "info"));
  });
});
