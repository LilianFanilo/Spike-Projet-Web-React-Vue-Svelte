import "./style.css";
import { connect } from "@shared/client.ts";
import type { VariableDef, VarValue } from "@shared/protocol.ts";

const app = document.querySelector<HTMLElement>("#app")!;
app.className = "dashboard";
app.dataset.connection = "off";
app.innerHTML = `
  <h1>Dashboard — témoin</h1>
  <p class="etat"></p>
  <form class="champs" onsubmit="return false"></form>
  <button type="button" class="alerte-btn" data-action="alerte">Alerte</button>
`;
const form = app.querySelector<HTMLFormElement>(".champs")!;
const controls = new Map<string, HTMLInputElement>();

const INPUT_TYPE = { text: "text", number: "number", boolean: "checkbox", color: "color", speed: "range" } as const;

function lireValeur(def: VariableDef, input: HTMLInputElement): VarValue | undefined {
  switch (def.type) {
    case "boolean":
      return input.checked;
    case "number": {
      const n = Number(input.value);
      const ok = input.value !== "" && Number.isInteger(n) && n >= (def.min ?? -Infinity) && n <= (def.max ?? Infinity);
      return ok ? n : undefined;
    }
    case "speed":
      return Number(input.value);
    default:
      return input.value;
  }
}

function afficherValeur(def: VariableDef, input: HTMLInputElement, value: VarValue): void {
  if (def.type === "boolean") input.checked = value === true;
  // Un champ en cours d'édition ignore les échos : un écho en retard écraserait la frappe.
  else if (document.activeElement !== input) input.value = String(value);
}

function construire(vars: VariableDef[], values: Record<string, VarValue>): void {
  form.replaceChildren();
  controls.clear();
  for (const def of vars) {
    const label = document.createElement("label");
    label.className = "champ";
    const texte = document.createElement("span");
    texte.textContent = def.label;
    const input = document.createElement("input");
    input.type = INPUT_TYPE[def.type];
    input.dataset.var = def.id;
    if (def.maxLength !== undefined) input.maxLength = def.maxLength;
    if (def.min !== undefined) input.min = String(def.min);
    if (def.max !== undefined) input.max = String(def.max);
    if (def.step !== undefined) input.step = String(def.step);
    afficherValeur(def, input, values[def.id]);
    input.addEventListener(def.type === "boolean" ? "change" : "input", () => {
      const value = lireValeur(def, input);
      if (value !== undefined) client.set(def.id, value);
    });
    label.append(texte, input);
    form.append(label);
    controls.set(def.id, input);
  }
}

let defs = new Map<string, VariableDef>();

const client = connect({
  role: "dashboard",
  onWelcome(vars, values) {
    defs = new Map(vars.map((d) => [d.id, d]));
    construire(vars, values);
  },
  onUpdate(id, value) {
    const def = defs.get(id);
    const input = controls.get(id);
    if (def && input) afficherValeur(def, input, value);
  },
  onAlert() {},
  onStatus(connected) {
    app.dataset.connection = connected ? "on" : "off";
  },
});

app.querySelector("[data-action=alerte]")!.addEventListener("click", () => client.alert());
