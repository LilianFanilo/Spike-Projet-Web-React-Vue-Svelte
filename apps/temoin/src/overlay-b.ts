import "./style.css";
import { connect } from "@shared/client.ts";
import { serialize, type VarValue } from "@shared/protocol.ts";
import { jouerAlerte } from "./alerte.ts";
import { defaut } from "./defauts.ts";

const app = document.querySelector<HTMLElement>("#app")!;
app.dataset.alert = "off";
app.innerHTML = `<div class="bandeau" data-var="bandeau">EN DIRECT</div>`;
const bandeau = app.querySelector<HTMLElement>("[data-var=bandeau]")!;

function appliquer(id: string, value: VarValue): void {
  if (id !== "bandeau" || defaut("bandeau")) return;
  bandeau.style.display = value === true ? "" : "none";
  bandeau.dataset.value = serialize("boolean", value);
}

connect({
  role: "overlay",
  name: "overlay-b",
  reconnect: !defaut("reconnexion"),
  onWelcome(_vars, values) {
    if (defaut("bandeau")) {
      bandeau.dataset.value = serialize("boolean", values.bandeau);
      return;
    }
    appliquer("bandeau", values.bandeau);
  },
  onUpdate: appliquer,
  onAlert: () => jouerAlerte(app, [bandeau]),
  onStatus() {},
});
