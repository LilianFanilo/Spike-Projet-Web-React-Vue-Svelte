// Error boundary : bascule vers le repli si la scène échoue (modèle introuvable, contexte WebGL impossible).
// React 19 n'a pas d'équivalent en hook, d'où le composant classe.

import { Component, type ReactNode } from "react";

interface Props {
  repli: ReactNode;
  children: ReactNode;
}

export class LimiteErreur extends Component<Props, { erreur: boolean }> {
  state = { erreur: false };

  static getDerivedStateFromError() {
    return { erreur: true };
  }

  render() {
    return this.state.erreur ? this.props.repli : this.props.children;
  }
}
