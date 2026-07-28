/**
 * DRAFTLAB - Main Draft Analysis Engine
 * Calculates composition scores, style hierarchies, damage distribution,
 * power curves, lane matchups, synergies, alerts, and next pick/ban recommendations.
 */
class DraftEngine {
  analyzeComposition(myTeamPicks, enemyTeamPicks, myBans, enemyBans) {
    if (!window.dataLoader.isLoaded) return null;

    const myChamps = this.resolveChampions(myTeamPicks);
    const enemyChamps = this.resolveChampions(enemyTeamPicks);

    // 1. Calculate Aggregated Weighted Scores
    const myScores = this.calculateAggregateScores(myChamps);
    const enemyScores = this.calculateAggregateScores(enemyChamps);

    // 2. Compute Composition Score (0 - 100) & Stars
    const scoreData = this.calculateOverallScore(myScores, myChamps);

    // 3. Hierarchical Styles (Primary, Secondary, Tertiary)
    const styles = this.calculateStyles(myScores);

    // 4. Damage Heatmap (AD, AP, True %)
    const damageHeatmap = this.calculateDamageHeatmap(myScores);

    // 5. Timeline Ratings & Power Curve Data
    const timeline = this.calculateTimelinePower(myScores);

    // 6. Objective Suitability Checklist
    const objectives = this.calculateObjectiveSuitability(myScores);

    // 7. Lane Matchups
    const matchups = this.calculateLaneMatchups(myTeamPicks, enemyTeamPicks);

    // 8. Champion Synergies
    const synergies = this.detectSynergies(myChamps);

    // 9. Warnings & Alerts
    const alerts = this.generateAlerts(myScores, myChamps, enemyScores, damageHeatmap);

    // 10. Next Pick & Ban Suggestions
    const pickSuggestions = this.suggestNextPick(myTeamPicks, enemyTeamPicks, myScores);
    const banSuggestions = this.suggestBans(myTeamPicks, enemyTeamPicks, enemyBans);

    return {
      myScores,
      enemyScores,
      scoreData,
      styles,
      damageHeatmap,
      timeline,
      objectives,
      matchups,
      synergies,
      alerts,
      pickSuggestions,
      banSuggestions,
      myChamps,
      enemyChamps
    };
  }

  resolveChampions(picksMap) {
    const list = [];
    Object.values(picksMap).forEach(name => {
      if (name) {
        const champ = window.dataLoader.getChampionByName(name);
        if (champ) list.push(champ);
      }
    });
    return list;
  }

  calculateAggregateScores(champs) {
    const keys = [
      'engage', 'teamfight', 'splitpush', 'frontline', 'early', 'late',
      'objective', 'waveclear', 'mobility', 'peel', 'ap', 'ad', 'trueDamage',
      'cc', 'burst', 'sustain'
    ];
    const total = {};
    keys.forEach(k => (total[k] = 0));

    if (champs.length === 0) return total;

    champs.forEach(c => {
      keys.forEach(k => {
        total[k] += c.scores[k] || 0;
      });
    });

    // Average per picked champion (scale 0 - 10)
    const avg = {};
    keys.forEach(k => {
      avg[k] = parseFloat((total[k] / champs.length).toFixed(1));
    });

    return avg;
  }

  calculateOverallScore(scores, champs) {
    if (champs.length === 0) {
      return { total: 0, stars: '☆☆☆☆☆', breakdown: {} };
    }

    const teamfightScore = Math.min(10, (scores.teamfight * 0.6 + scores.cc * 0.4));
    const scalingScore = Math.min(10, scores.late);
    const engageScore = Math.min(10, scores.engage);
    const frontlineScore = Math.min(10, scores.frontline);
    const waveclearScore = Math.min(10, scores.waveclear);
    const objectiveScore = Math.min(10, scores.objective);
    const consistencyScore = Math.min(10, (scores.peel * 0.5 + scores.sustain * 0.5));

    const totalRaw = (
      teamfightScore * 1.5 +
      scalingScore * 1.2 +
      engageScore * 1.2 +
      frontlineScore * 1.3 +
      waveclearScore * 1.1 +
      objectiveScore * 1.2 +
      consistencyScore * 1.5
    );

    // Normalize to 0-100 scale
    const total = Math.min(100, Math.round((totalRaw / 9) * 10));

    let stars = '★☆☆☆☆';
    if (total >= 90) stars = '★★★★★';
    else if (total >= 80) stars = '★★★★☆';
    else if (total >= 65) stars = '★★★☆☆';
    else if (total >= 50) stars = '★★☆☆☆';

    return {
      total,
      stars,
      breakdown: {
        teamfight: Math.round(teamfightScore * 10),
        scaling: Math.round(scalingScore * 10),
        engage: Math.round(engageScore * 10),
        frontline: Math.round(frontlineScore * 10),
        waveclear: Math.round(waveclearScore * 10),
        objective: Math.round(objectiveScore * 10),
        consistency: Math.round(consistencyScore * 10)
      }
    };
  }

  calculateStyles(scores) {
    const strategies = window.dataLoader.strategies || [];
    const styleScores = [];

    strategies.forEach(strat => {
      let sum = 0;
      strat.keyAttributes.forEach(attr => {
        sum += scores[attr] || 0;
      });
      const avg = sum / strat.keyAttributes.length;
      styleScores.push({ ...strat, score: avg });
    });

    styleScores.sort((a, b) => b.score - a.score);

    return {
      primary: styleScores[0] || null,
      secondary: styleScores[1] || null,
      tertiary: styleScores[2] || null
    };
  }

  calculateDamageHeatmap(scores) {
    const totalDmg = (scores.ad || 0) + (scores.ap || 0) + (scores.trueDamage || 0);
    if (totalDmg === 0) return { adPercent: 50, apPercent: 50, truePercent: 0 };

    const adPercent = Math.round(((scores.ad || 0) / totalDmg) * 100);
    const apPercent = Math.round(((scores.ap || 0) / totalDmg) * 100);
    const truePercent = 100 - (adPercent + apPercent);

    return { adPercent, apPercent, truePercent: Math.max(0, truePercent) };
  }

  calculateTimelinePower(scores) {
    const early = Math.min(5, Math.round((scores.early || 5) / 2));
    const mid = Math.min(5, Math.round(((scores.early + scores.late) / 2 || 5) / 2));
    const lateMid = Math.min(5, Math.round(((scores.late * 0.8 + scores.objective * 0.2) || 5) / 2));
    const late = Math.min(5, Math.round((scores.late || 5) / 2));

    const renderStars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

    return {
      phases: {
        '0-10 min': { stars: renderStars(early), score: early },
        '10-20 min': { stars: renderStars(mid), score: mid },
        '20-30 min': { stars: renderStars(lateMid), score: lateMid },
        '35+ min': { stars: renderStars(late), score: late }
      },
      curveData: [early * 2, mid * 2, lateMid * 2, late * 2] // Scale 0-10 for Chart.js
    };
  }

  calculateObjectiveSuitability(scores) {
    const result = [];
    const objDefs = window.dataLoader.objectives || {};

    Object.entries(objDefs).forEach(([key, obj]) => {
      let sum = 0;
      obj.keyAttributes.forEach(attr => {
        sum += scores[attr] || 0;
      });
      const avg = sum / obj.keyAttributes.length;
      result.push({
        key,
        name: obj.name,
        icon: obj.icon,
        suitable: avg >= 6.0,
        score: Math.round(avg * 10)
      });
    });

    return result;
  }

  calculateLaneMatchups(myPicks, enemyPicks) {
    const matchups = [];
    const counters = window.dataLoader.counters || [];
    const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'];

    roles.forEach(role => {
      const myChamp = myPicks[role];
      const enemyChamp = enemyPicks[role];

      if (myChamp && enemyChamp) {
        const matchData = counters.find(
          c => c.champion.toLowerCase() === myChamp.toLowerCase() &&
               c.versus.toLowerCase() === enemyChamp.toLowerCase()
        );

        if (matchData) {
          matchups.push({
            role,
            myChamp,
            enemyChamp,
            winrate: matchData.winrate,
            status: matchData.status,
            note: matchData.note
          });
        } else {
          matchups.push({
            role,
            myChamp,
            enemyChamp,
            winrate: 50.0,
            status: 'Equilibrado',
            note: 'Confronto direto parelho sem vantagem esmagadora pré-definida.'
          });
        }
      }
    });

    return matchups;
  }

  detectSynergies(myChamps) {
    const list = [];
    const allSyns = window.dataLoader.synergies || [];
    const myNames = myChamps.map(c => c.name);

    allSyns.forEach(syn => {
      const hasAll = syn.champions.every(reqName =>
        myNames.some(m => m.toLowerCase() === reqName.toLowerCase())
      );
      if (hasAll) {
        list.push(syn);
      }
    });

    return list;
  }

  generateAlerts(myScores, myChamps, enemyScores, damageHeatmap) {
    const alerts = [];

    if (myChamps.length >= 3) {
      if (damageHeatmap.apPercent >= 80) {
        alerts.push({ type: 'warning', text: '⚠️ Excesso de Dano Mágico (80%+ AP). Time inimigo itemizará Resistência Mágica facilmente.' });
      }
      if (damageHeatmap.adPercent >= 80) {
        alerts.push({ type: 'warning', text: '⚠️ Excesso de Dano Físico (80%+ AD). Time inimigo acumulará Armadura facilmente.' });
      }
      if (myScores.frontline < 4) {
        alerts.push({ type: 'danger', text: '🛑 Falta de Linha de Frente (Frontline < 4.0). Carries muito expostos!' });
      }
      if (myScores.cc < 4) {
        alerts.push({ type: 'warning', text: '⚠️ Pouco Controle de Grupo (CC baixo). Dificuldade para parar assassinos.' });
      }
      if (myScores.waveclear < 4) {
        alerts.push({ type: 'warning', text: '⚠️ Pouco Limpeza de Tropas (Waveclear baixo). Vulnerável a pressão de torres.' });
      }
      if (myScores.teamfight >= 8.5) {
        alerts.push({ type: 'success', text: '🔥 Excelente Composição de Team Fight! Forçar lutas em objetivos neutros.' });
      }
      if (myScores.splitpush >= 8.0) {
        alerts.push({ type: 'success', text: '⚡ Excelente Potencial de Split Push! Pressionar rotas laterais.' });
      }
    }

    return alerts;
  }

  suggestNextPick(myPicks, enemyPicks, myScores) {
    const unpickedRoles = Object.keys(myPicks).filter(r => !myPicks[r]);
    if (unpickedRoles.length === 0) return [];

    const suggestions = [];
    const availableChamps = window.dataLoader.champions.filter(c =>
      !Object.values(myPicks).includes(c.name) &&
      !Object.values(enemyPicks).includes(c.name)
    );

    unpickedRoles.forEach(role => {
      // Get player pool champions for this role
      const pool = window.playerPoolManager.getPoolForRole(role);
      const candidates = availableChamps.filter(c => c.lanes.includes(role) && pool.includes(c.name));

      candidates.forEach(c => {
        let score = 0;
        let reasons = [];

        if (myScores.frontline < 6 && c.scores.frontline >= 8) {
          score += 3;
          reasons.push('Fortalece a Linha de Frente');
        }
        if (myScores.engage < 6 && c.scores.engage >= 8) {
          score += 3;
          reasons.push('Fornece Engajamento Pesado');
        }
        if (c.scores.teamfight >= 8.5) {
          score += 2;
          reasons.push('Potencializa Team Fights');
        }

        suggestions.push({
          role,
          champion: c.name,
          score,
          reasons: reasons.length ? reasons : ['Excelente pick para a pool do jogador']
        });
      });
    });

    suggestions.sort((a, b) => b.score - a.score);
    return suggestions.slice(0, 4);
  }

  suggestBans(myPicks, enemyPicks, enemyBans) {
    const suggestions = [];
    const tierlist = window.dataLoader.tierlist || {};
    const priorityBans = tierlist.bansPriority || [];

    priorityBans.forEach(champName => {
      if (!Object.values(myPicks).includes(champName) &&
          !Object.values(enemyPicks).includes(champName) &&
          !Object.values(enemyBans).includes(champName)) {
        suggestions.push({
          champion: champName,
          reason: 'Campeão de Prioridade Alta / Perigoso no Meta Atual'
        });
      }
    });

    return suggestions.slice(0, 5);
  }
}

window.draftEngine = new DraftEngine();
