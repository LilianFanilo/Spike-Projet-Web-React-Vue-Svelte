// Protocole partagé du spike : constantes, types des messages, validation et sérialisation.
// Contrat : specs/002-infra-commune/contracts/protocole.md (gelé au tag base-commune).
// TypeScript effaçable uniquement : exécuté tel quel par Node 26 et importé par Vite.

export const SERVICE_PORT = 8787;
export const SERVICE_HOST = "127.0.0.1";
export const WS_URL = `ws://${SERVICE_HOST}:${SERVICE_PORT}`;
export const HTTP_URL = `http://${SERVICE_HOST}:${SERVICE_PORT}`;

/** Durée de l'animation d'alerte (FR-023 et FR-032 de la spec gelée). */
export const ALERT_DURATION_MS = 2000;

export type VarType = "text" | "number" | "boolean" | "color" | "speed";
export type VarValue = string | number | boolean;
export type Values = Record<string, VarValue>;

export interface VariableDef {
  id: string;
  label: string;
  type: VarType;
  default: VarValue;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
}

export type OverlayName = "overlay-a" | "overlay-b" | "overlay-3d";
export const OVERLAY_NAMES: readonly OverlayName[] = ["overlay-a", "overlay-b", "overlay-3d"];

export type Role = "dashboard" | "overlay" | "bench" | "test";

export type ClientMessage =
  | { type: "hello"; role: Role; name?: OverlayName }
  | { type: "set"; id: string; value: VarValue }
  | { type: "alert" }
  | { type: "ack"; seq: number; overlay: OverlayName }
  | { type: "fps"; overlay: OverlayName; value: number };

export type ServerMessage =
  | { type: "welcome"; vars: VariableDef[]; values: Values }
  | { type: "update"; seq: number; id: string; value: VarValue }
  | { type: "alert"; seq: number };

const COLOR_RE = /^#[0-9a-f]{6}$/;
const STEP_TOLERANCE = 1e-9;

function inBounds(def: VariableDef, n: number): boolean {
  if (def.min !== undefined && n < def.min) return false;
  if (def.max !== undefined && n > def.max) return false;
  return true;
}

/** Règles de validation du data-model (specs/002-infra-commune/data-model.md). */
export function validate(def: VariableDef, value: unknown): boolean {
  switch (def.type) {
    case "text":
      return typeof value === "string" && (def.maxLength === undefined || value.length <= def.maxLength);
    case "number":
      return typeof value === "number" && Number.isInteger(value) && inBounds(def, value);
    case "boolean":
      return typeof value === "boolean";
    case "color":
      return typeof value === "string" && COLOR_RE.test(value.toLowerCase());
    case "speed": {
      if (typeof value !== "number" || !Number.isFinite(value) || !inBounds(def, value)) return false;
      if (def.step === undefined) return true;
      const ratio = value / def.step;
      return Math.abs(ratio - Math.round(ratio)) < STEP_TOLERANCE * Math.max(1, Math.abs(ratio));
    }
  }
}

/** Forme canonique d'une valeur valide : couleur en minuscules, vitesse arrondie au pas. */
export function normalize(def: VariableDef, value: VarValue): VarValue {
  if (def.type === "color" && typeof value === "string") return value.toLowerCase();
  if (def.type === "speed" && typeof value === "number" && def.step !== undefined) {
    const decimals = (String(def.step).split(".")[1] ?? "").length;
    return Number((Math.round(value / def.step) * def.step).toFixed(decimals));
  }
  return value;
}

/** Valeur à placer dans data-value (FR-041 de la spec gelée). */
export function serialize(type: VarType, value: VarValue): string {
  switch (type) {
    case "boolean":
      return value ? "true" : "false";
    case "color":
      return String(value).toLowerCase();
    default:
      return String(value);
  }
}

/** Lecture tolérante d'un message JSON ; renvoie null si le texte n'est pas un objet avec un type. */
export function parseMessage(text: string): { type: string; [key: string]: unknown } | null {
  try {
    const data: unknown = JSON.parse(text);
    if (data && typeof data === "object" && typeof (data as { type?: unknown }).type === "string") {
      return data as { type: string; [key: string]: unknown };
    }
  } catch {
    // message mal formé : l'appelant le compte comme rejeté
  }
  return null;
}
