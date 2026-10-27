// Reporter Playwright : ajoute une entrée « e2e » à results/mesures.json en fin de campagne.
// L'historique de ces entrées donne le nombre de passages avant le vert.

import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { record, type Framework } from "../bench/record.ts";
import { MANUELS } from "./manuels.ts";

export default class MesuresReporter implements Reporter {
  private reussis = 0;
  private echecs: string[] = [];
  private projets = new Set<string>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const projet = test.parent.project()?.name ?? "?";
    this.projets.add(projet);
    if (result.status === "passed") this.reussis++;
    else if (result.status !== "skipped") this.echecs.push(`[${projet}] ${test.title}`);
  }

  onEnd(result: FullResult): void {
    const framework = process.env.FRAMEWORK as Framework | undefined;
    if (!framework) {
      console.warn("[mesures] FRAMEWORK absent : campagne non enregistrée dans results/mesures.json");
      return;
    }
    const entree = record({
      framework,
      mesure: "e2e",
      valeur: this.reussis,
      unite: "tests",
      conditions: { navigateur: "chromium (Playwright)", appUrl: process.env.APP_URL, appQuery: process.env.APP_QUERY },
      details: {
        echoues: this.echecs.length,
        listeEchecs: this.echecs,
        manuels: MANUELS,
        dureeMs: Math.round(result.duration),
        projets: [...this.projets],
      },
    });
    console.log(`[mesures] e2e ${framework} : ${this.reussis} réussis, ${this.echecs.length} échoués (${entree.id})`);
  }
}
