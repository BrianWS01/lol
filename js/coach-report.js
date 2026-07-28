/**
 * DRAFTLAB - Pro Coach Analysis Report Generator
 * Generates actionable tactical advice for the team after draft completion.
 */
class CoachReportEngine {
  generateReport(analysis) {
    if (!analysis || !analysis.myChamps) return [];

    const instructions = [];
    const myChamps = analysis.myChamps;
    const scores = analysis.myScores;
    const styles = analysis.styles;

    // Primary Style Directive
    if (styles.primary) {
      instructions.push({
        target: 'TIME',
        icon: '🎯',
        text: `Identidade da Composição: ${styles.primary.name}. ${styles.primary.coachingTips[0]}`
      });
    }

    // Individual Champion Tactical Directives
    myChamps.forEach(c => {
      if (c.id === 'Sett') {
        instructions.push({
          target: 'Alcantara (Sett)',
          icon: '🥊',
          text: 'Buscar arremesso com R (Showstopper) no tanque principal inimigo em direção aos Carries.'
        });
      } else if (c.id === 'Jax' || c.id === 'Tryndamere') {
        instructions.push({
          target: `${c.name}`,
          icon: '🚩',
          text: `${c.name} precisa pressionar rota lateral (Split Push) a partir dos 18 minutos.`
        });
      } else if (c.id === 'JarvanIV') {
        instructions.push({
          target: 'Rafa (Jarvan IV)',
          icon: '⚔️',
          text: 'Combear Cataclismo com as ultimates de dano em área da equipe.'
        });
      } else if (c.id === 'Orianna') {
        instructions.push({
          target: 'Leo (Orianna)',
          icon: '🔮',
          text: 'Manter a esfera no iniciador principal e guardar Shockwave para o 3º Dragão.'
        });
      } else if (c.id === 'Jhin') {
        instructions.push({
          target: 'Duduzin (Jhin)',
          icon: '🎯',
          text: 'Jhin NUNCA deve iniciar lutas. Aguardar controle de grupo antes de atirar com Chamado do Destino.'
        });
      } else if (c.id === 'Rell' || c.id === 'Alistar') {
        instructions.push({
          target: 'Brian',
          icon: '🛡️',
          text: 'Procurar ângulos de Flank através da névoa de guerra e lentes de detecção.'
        });
      }
    });

    // Objective Strategic Directives
    if (scores.teamfight >= 7.5) {
      instructions.push({
        target: 'OBJETIVOS',
        icon: '🐉',
        text: 'Sua composição quer lutar no 3º Dragão e no Barão em área aberta.'
      });
    } else if (scores.splitpush >= 7.5) {
      instructions.push({
        target: 'OBJETIVOS',
        icon: '🏰',
        text: 'Evitar lutas 5v5 diretas no meio do mapa. Agrupar em 4 e dar espaço para o Splitter lateral.'
      });
    }

    if (scores.early >= 8.0) {
      instructions.push({
        target: 'RITMO',
        icon: '⚡',
        text: 'Composição de Snowball Early Game! Forçar lutas nos primeiros Larvas e Arauto até os 15 min.'
      });
    } else if (scores.late >= 8.5) {
      instructions.push({
        target: 'RITMO',
        icon: '⏳',
        text: 'Composição de Escala Superior Late Game! Evitar trocas arriscadas no início e farmar com segurança.'
      });
    }

    return instructions;
  }
}

window.coachReportEngine = new CoachReportEngine();
