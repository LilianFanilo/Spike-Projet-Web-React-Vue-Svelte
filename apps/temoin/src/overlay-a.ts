import "./style.css";
import { connect } from "@shared/client.ts";
import { serialize, type VarValue } from "@shared/protocol.ts";
import { jouerAlerte } from "./alerte.ts";
import { defaut } from "./defauts.ts";

const app = document.querySelector<HTMLElement>("#app")!;
app.dataset.alert = "off";
app.innerHTML = `
  <div class="carte">
    <h1 class="titre" data-var="titre"></h1>
    <p class="score" data-var="score"></p>
  </div>
`;
const carte = app.querySelector<HTMLElement>(".carte")!;
const titre = app.querySelector<HTMLElement>("[data-var=titre]")!;
const score = app.querySelector<HTMLElement>("[data-var=score]")!;

function appliquer(id: string, value: VarValue): void {
  if (id === "titre") {
    titre.textContent = String(value);
    titre.dataset.value = serialize("text", value);
  } else if (id === "score" && !defaut("score")) {
    score.textContent = String(value);
    score.dataset.value = serialize("number", value);
  }
}

connect({
  role: "overlay",
  name: "overlay-a",
  reconnect: !defaut("reconnexion"),
  onWelcome(_vars, values) {
    appliquer("titre", values.titre);
    appliquer("score", values.score);
  },
  onUpdate: appliquer,
  onAlert: () => jouerAlerte(app, [carte]),
  onStatus() {},
});
