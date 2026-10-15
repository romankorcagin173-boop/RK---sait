import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type FlaconStatus = "open" | "sold_out" | "closed";

export interface Flacon {
  id: number;
  name: string;
  totalMl: number;
  remainingMl: number;
  pricePerMl: number | null;
  status: FlaconStatus;
  createdAt: string;
}

export type RequestStatus = "pending" | "confirmed" | "rejected";

export interface PresplitRequest {
  id: number;
  flaconId: number;
  userId: number;
  username: string | null;
  firstName: string;
  ml: number;
  status: RequestStatus;
  createdAt: string;
  confirmedAt: string | null;
}

interface State {
  nextFlaconId: number;
  nextRequestId: number;
  flacons: Flacon[];
  requests: PresplitRequest[];
}

const DATA_FILE = join(dirname(fileURLToPath(import.meta.url)), "data.json");

function emptyState(): State {
  return { nextFlaconId: 1, nextRequestId: 1, flacons: [], requests: [] };
}

function load(): State {
  if (!existsSync(DATA_FILE)) return emptyState();
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as State;
  } catch {
    return emptyState();
  }
}

const state = load();

function save() {
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, DATA_FILE);
}

export function addFlacon(name: string, totalMl: number, pricePerMl: number | null): Flacon {
  const flacon: Flacon = {
    id: state.nextFlaconId++,
    name,
    totalMl,
    remainingMl: totalMl,
    pricePerMl,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  state.flacons.push(flacon);
  save();
  return flacon;
}

export function getOpenFlacons(): Flacon[] {
  return state.flacons.filter((f) => f.status === "open");
}

export function getFlacon(id: number): Flacon | undefined {
  return state.flacons.find((f) => f.id === id);
}

export function closeFlacon(id: number): boolean {
  const flacon = getFlacon(id);
  if (!flacon) return false;
  flacon.status = "closed";
  save();
  return true;
}

export function addRequest(
  input: Omit<PresplitRequest, "id" | "status" | "createdAt" | "confirmedAt">
): PresplitRequest {
  const request: PresplitRequest = {
    ...input,
    id: state.nextRequestId++,
    status: "pending",
    createdAt: new Date().toISOString(),
    confirmedAt: null,
  };
  state.requests.push(request);
  save();
  return request;
}

export function getRequest(id: number): PresplitRequest | undefined {
  return state.requests.find((r) => r.id === id);
}

export function getPendingRequests(): PresplitRequest[] {
  return state.requests.filter((r) => r.status === "pending");
}

export function getConfirmedRequests(): PresplitRequest[] {
  return state.requests.filter((r) => r.status === "confirmed");
}

export type ConfirmResult = { ok: true } | { ok: false; reason: string };

// Remaining ml is only deducted here, at confirmation time — not when the
// request is created — per how this bot is meant to be used: a buyer's
// claim doesn't reserve stock until the admin has actually seen payment and
// confirmed it, so the ml check has to happen again now against whatever is
// left, since other requests may have been confirmed in the meantime.
export function confirmRequest(id: number): ConfirmResult {
  const request = getRequest(id);
  if (!request) return { ok: false, reason: "Заявка не найдена." };
  if (request.status !== "pending") return { ok: false, reason: "Заявка уже обработана." };
  const flacon = getFlacon(request.flaconId);
  if (!flacon) return { ok: false, reason: "Флакон не найден." };
  if (flacon.remainingMl < request.ml) {
    return {
      ok: false,
      reason: `Недостаточно остатка: осталось ${flacon.remainingMl} мл, а запрошено ${request.ml} мл.`,
    };
  }
  flacon.remainingMl -= request.ml;
  if (flacon.remainingMl === 0) flacon.status = "sold_out";
  request.status = "confirmed";
  request.confirmedAt = new Date().toISOString();
  save();
  return { ok: true };
}

export function rejectRequest(id: number): boolean {
  const request = getRequest(id);
  if (!request || request.status !== "pending") return false;
  request.status = "rejected";
  save();
  return true;
}
