/**
 * DRAFTLAB - Application Controller
 * Wires UI, event listeners, real-time reactive updates, and view rendering.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load Data Engine
  const success = await window.dataLoader.loadAllData();
  if (!success) {
    alert('Erro ao carregar os bancos de dados JSON do DRAFTLAB. Verifique o console.');
    return;
  }

  // State Management
  const state = {
    mySide: 'BLUE', // 'BLUE' or 'RED'
    myTeamPicks: { TOP: '', JUNGLE: '', MID: '', ADC: '', SUP: '' },
    enemyTeamPicks: { TOP: '', JUNGLE: '', MID: '', ADC: '', SUP: '' },
    myBans: ['', '', '', '', ''],
    enemyBans: ['', '', '', '', '']
  };

  // Initialize UI & Components
  window.chartManager.initCharts();
  populateChampionSelects();
  populateBanSlots();
  renderStrategyLibrary();
  renderHistoryView();
  renderSavedCompsView();

  // Tab Navigation
  document.querySelectorAll('[data-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('[data-tab]').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

      tabBtn.classList.add('active');
      const targetPanel = document.getElementById(tabBtn.getAttribute('data-tab'));
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Side Selector Toggle
  const sideToggleBtn = document.getElementById('sideToggleBtn');
  if (sideToggleBtn) {
    sideToggleBtn.addEventListener('click', () => {
      state.mySide = state.mySide === 'BLUE' ? 'RED' : 'BLUE';
      window.draftOrderEngine.setMyTeamSide(state.mySide);
      updateSideUI();
      triggerRealtimeAnalysis();
    });
  }

  // Turn Step Controls
  document.getElementById('prevStepBtn')?.addEventListener('click', () => {
    window.draftOrderEngine.previousStep();
    updateTurnUI();
  });
  document.getElementById('nextStepBtn')?.addEventListener('click', () => {
    window.draftOrderEngine.nextStep();
    updateTurnUI();
  });

  // Reset Draft Button
  document.getElementById('resetDraftBtn')?.addEventListener('click', () => {
    state.myTeamPicks = { TOP: '', JUNGLE: '', MID: '', ADC: '', SUP: '' };
    state.enemyTeamPicks = { TOP: '', JUNGLE: '', MID: '', ADC: '', SUP: '' };
    state.myBans = ['', '', '', '', ''];
    state.enemyBans = ['', '', '', '', ''];

    document.querySelectorAll('.champ-select').forEach(select => (select.value = ''));
    window.draftOrderEngine.resetDraft();

    updateTurnUI();
    triggerRealtimeAnalysis();
  });

  // Save Draft to History
  document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
    const name = prompt('Nome do Draft:', `Draft vs ${state.mySide === 'BLUE' ? 'Red' : 'Blue'} Team`);
    if (!name) return;

    const analysis = window.draftEngine.analyzeComposition(
      state.myTeamPicks, state.enemyTeamPicks, state.myBans, state.enemyBans
    );

    window.historyManager.saveDraftToHistory({
      name,
      mySide: state.mySide,
      myTeamPicks: { ...state.myTeamPicks },
      enemyTeamPicks: { ...state.enemyTeamPicks },
      myBans: [...state.myBans],
      enemyBans: [...state.enemyBans],
      score: analysis?.scoreData?.total || 0
    });

    renderHistoryView();
    alert('Draft salvo no Histórico com sucesso!');
  });

  // Export JSON Button
  document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    window.historyManager.exportDataToJSON();
  });

  // Import JSON File Input
  document.getElementById('importJsonInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = window.historyManager.importDataFromJSON(event.target.result);
      if (ok) {
        alert('Dados importados com sucesso!');
        renderHistoryView();
        renderSavedCompsView();
      } else {
        alert('Erro ao importar arquivo JSON. Formato inválido.');
      }
    };
    reader.readAsText(file);
  });

  // Populate Select Options
  function populateChampionSelects() {
    const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUP'];

    roles.forEach(role => {
      // My Team Select
      const mySelect = document.getElementById(`my_pick_${role}`);
      if (mySelect) {
        mySelect.innerHTML = `<option value="">-- Selecionar ${role} --</option>`;
        const poolChamps = window.playerPoolManager.getPoolForRole(role);

        poolChamps.forEach(champName => {
          const cat = window.playerPoolManager.getCategoryForChampion(role, champName) || 'Pool';
          const opt = document.createElement('option');
          opt.value = champName;
          opt.textContent = `⭐ ${champName} (${cat})`;
          mySelect.appendChild(opt);
        });

        mySelect.addEventListener('change', (e) => {
          state.myTeamPicks[role] = e.target.value;
          updateChampionAvatar(`my_avatar_${role}`, e.target.value);
          triggerRealtimeAnalysis();
        });
      }

      // Enemy Team Select
      const enemySelect = document.getElementById(`enemy_pick_${role}`);
      if (enemySelect) {
        enemySelect.innerHTML = `<option value="">-- Selecionar ${role} Inimigo --</option>`;
        const allChamps = window.dataLoader.champions.filter(c => c.lanes.includes(role));

        allChamps.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          enemySelect.appendChild(opt);
        });

        enemySelect.addEventListener('change', (e) => {
          state.enemyTeamPicks[role] = e.target.value;
          updateChampionAvatar(`enemy_avatar_${role}`, e.target.value);
          triggerRealtimeAnalysis();
        });
      }
    });
  }

  function populateBanSlots() {
    // Populate Ban Selects for My Team & Enemy Team
    for (let i = 0; i < 5; i++) {
      const myBanSel = document.getElementById(`my_ban_${i}`);
      const enemyBanSel = document.getElementById(`enemy_ban_${i}`);

      const fillOptions = (sel) => {
        if (!sel) return;
        sel.innerHTML = `<option value="">Ban ${i + 1}</option>`;
        window.dataLoader.champions.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          sel.appendChild(opt);
        });
      };

      fillOptions(myBanSel);
      fillOptions(enemyBanSel);

      if (myBanSel) {
        myBanSel.addEventListener('change', (e) => {
          state.myBans[i] = e.target.value;
          triggerRealtimeAnalysis();
        });
      }
      if (enemyBanSel) {
        enemyBanSel.addEventListener('change', (e) => {
          state.enemyBans[i] = e.target.value;
          triggerRealtimeAnalysis();
        });
      }
    }
  }

  function updateChampionAvatar(elementId, champName) {
    const avatarEl = document.getElementById(elementId);
    if (!avatarEl) return;

    if (!champName) {
      avatarEl.innerHTML = '🛡️';
      return;
    }

    const champ = window.dataLoader.getChampionByName(champName);
    const key = champ ? champ.icon : champName.replace(/[^a-zA-Z]/g, '');
    const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${key}.png`;

    avatarEl.innerHTML = `<img src="${cdnUrl}" alt="${champName}" onerror="this.src='https://raw.githubusercontent.com/RiotGames/developer-relations/main/data/champion-placeholder.png'">`;
  }

  function updateSideUI() {
    const sideBadge = document.getElementById('sideBadge');
    if (sideBadge) {
      sideBadge.textContent = state.mySide === 'BLUE' ? 'MEU TIME: BLUE SIDE 🟦' : 'MEU TIME: RED SIDE 🟥';
      sideBadge.className = state.mySide === 'BLUE' ? 'badge bg-info text-dark p-2' : 'badge bg-danger p-2';
    }
    updateTurnUI();
  }

  function updateTurnUI() {
    const stepText = document.getElementById('turnStepText');
    const stepDesc = window.draftOrderEngine.getStepDescription();
    if (stepText) stepText.textContent = stepDesc;

    const current = window.draftOrderEngine.getCurrentStep();
    if (current) {
      const turnBadge = document.getElementById('activeTurnBadge');
      if (turnBadge) {
        turnBadge.textContent = current.label;
        turnBadge.className = `turn-badge ${current.side.toLowerCase()}-turn`;
      }
    }
  }

  // Real-time Re-active Draft Analysis Trigger
  function triggerRealtimeAnalysis() {
    const analysis = window.draftEngine.analyzeComposition(
      state.myTeamPicks,
      state.enemyTeamPicks,
      state.myBans,
      state.enemyBans
    );

    if (!analysis) return;

    // 1. Overall Score & Stars
    document.getElementById('overallScoreNum').textContent = `${analysis.scoreData.total}/100`;
    document.getElementById('overallScoreStars').textContent = analysis.scoreData.stars;

    // 2. Archetype Hierarchy Pills
    const archContainer = document.getElementById('archetypeHierarchyBox');
    if (archContainer) {
      let html = '';
      if (analysis.styles.primary) {
        html += `<span class="archetype-pill archetype-primary">${analysis.styles.primary.icon} 1º ${analysis.styles.primary.name}</span> `;
      }
      if (analysis.styles.secondary) {
        html += `<span class="archetype-pill archetype-secondary">${analysis.styles.secondary.icon} 2º ${analysis.styles.secondary.name}</span> `;
      }
      if (analysis.styles.tertiary) {
        html += `<span class="archetype-pill archetype-tertiary">${analysis.styles.tertiary.icon} 3º ${analysis.styles.tertiary.name}</span>`;
      }
      archContainer.innerHTML = html;
    }

    // 3. Trait Progress Bars
    updateProgressBar('barEngage', analysis.myScores.engage * 10);
    updateProgressBar('barPeel', analysis.myScores.peel * 10);
    updateProgressBar('barSplit', analysis.myScores.splitpush * 10);
    updateProgressBar('barPoke', analysis.myScores.poke * 10);
    updateProgressBar('barScaling', analysis.myScores.late * 10);
    updateProgressBar('barFrontline', analysis.myScores.frontline * 10);

    // 4. Damage Heatmap
    const heat = analysis.damageHeatmap;
    document.getElementById('adPercentText').textContent = `${heat.adPercent}% AD`;
    document.getElementById('apPercentText').textContent = `${heat.apPercent}% AP`;
    document.getElementById('truePercentText').textContent = `${heat.truePercent}% True/Híbrido`;

    const dmgBarAd = document.getElementById('dmgBarAd');
    const dmgBarAp = document.getElementById('dmgBarAp');
    const dmgBarTrue = document.getElementById('dmgBarTrue');
    if (dmgBarAd) dmgBarAd.style.width = `${heat.adPercent}%`;
    if (dmgBarAp) dmgBarAp.style.width = `${heat.apPercent}%`;
    if (dmgBarTrue) dmgBarTrue.style.width = `${heat.truePercent}%`;

    // 5. Timeline Ratings
    const timeBox = document.getElementById('timelineRatingsBox');
    if (timeBox && analysis.timeline.phases) {
      let tHtml = '';
      Object.entries(analysis.timeline.phases).forEach(([phaseName, pData]) => {
        tHtml += `
          <div class="d-flex justify-content-between align-items-center mb-1 fs-6">
            <span class="text-muted">${phaseName}:</span>
            <span class="text-warning font-monospace">${pData.stars}</span>
          </div>
        `;
      });
      timeBox.innerHTML = tHtml;
    }

    // 6. Update Charts
    const enemyAnalysis = window.draftEngine.analyzeComposition(
      state.enemyTeamPicks, state.myTeamPicks, state.enemyBans, state.myBans
    );
    window.chartManager.updateCharts(
      analysis.myScores,
      enemyAnalysis?.myScores || {},
      analysis.timeline,
      enemyAnalysis?.timeline
    );

    // 7. Objective Matrix
    const objBox = document.getElementById('objectivesMatrixBox');
    if (objBox) {
      let oHtml = '';
      analysis.objectives.forEach(o => {
        const iconCheck = o.suitable ? '✔' : '✖';
        const badgeClass = o.suitable ? 'text-success' : 'text-muted opacity-50';
        oHtml += `<div class="mb-1 ${badgeClass}">${o.icon} <strong>${iconCheck} ${o.name}</strong> (${o.score} pts)</div>`;
      });
      objBox.innerHTML = oHtml;
    }

    // 8. Lane Matchups
    const matchupBox = document.getElementById('laneMatchupsBox');
    if (matchupBox) {
      if (analysis.matchups.length === 0) {
        matchupBox.innerHTML = '<span class="text-muted fs-7">Selecione campeões opostos nas lanes para calcular matchups.</span>';
      } else {
        let mHtml = '';
        analysis.matchups.forEach(m => {
          const isFav = m.winrate >= 51.5;
          const statusClass = isFav ? 'fav' : 'unfav';
          mHtml += `
            <div class="matchup-item">
              <div><strong>[${m.role}]</strong> ${m.myChamp} vs ${m.enemyChamp}</div>
              <div class="matchup-winrate ${statusClass}">${m.winrate}% (${m.status})</div>
            </div>
          `;
        });
        matchupBox.innerHTML = mHtml;
      }
    }

    // 9. Synergies
    const synBox = document.getElementById('synergiesBox');
    if (synBox) {
      if (analysis.synergies.length === 0) {
        synBox.innerHTML = '<span class="text-muted fs-7">Nenhuma sinergia de combo detectada ainda.</span>';
      } else {
        let sHtml = '';
        analysis.synergies.forEach(syn => {
          sHtml += `
            <div class="mb-2 p-2 rounded bg-dark border border-gold">
              <div class="fw-bold text-gold">✨ ${syn.name} (${syn.tier})</div>
              <div class="fs-7 text-muted">${syn.description}</div>
            </div>
          `;
        });
        synBox.innerHTML = sHtml;
      }
    }

    // 10. Alerts
    const alertBox = document.getElementById('alertsBox');
    if (alertBox) {
      if (analysis.alerts.length === 0) {
        alertBox.innerHTML = '<span class="text-muted fs-7">Composição equilibrada sem alertas críticos.</span>';
      } else {
        let aHtml = '';
        analysis.alerts.forEach(a => {
          aHtml += `<div class="mb-1 p-2 rounded bg-dark border border-${a.type}">${a.text}</div>`;
        });
        alertBox.innerHTML = aHtml;
      }
    }

    // 11. Recommendations (Picks & Bans)
    const recBox = document.getElementById('recommendationsBox');
    if (recBox) {
      let rHtml = '<h6>Sugestões para o Próximo Pick:</h6>';
      if (analysis.pickSuggestions.length === 0) {
        rHtml += '<span class="text-muted fs-7">Pool de campeões completa ou sem candidatos.</span>';
      } else {
        analysis.pickSuggestions.forEach(p => {
          rHtml += `
            <div class="p-2 mb-1 rounded bg-dark border border-cyan">
              <strong class="text-cyan">[${p.role}] ${p.champion}</strong>
              <div class="fs-7 text-muted">${p.reasons.join(' | ')}</div>
            </div>
          `;
        });
      }
      recBox.innerHTML = rHtml;
    }

    // 12. Coach Tactical Report
    const coachReport = window.coachReportEngine.generateReport(analysis);
    const coachBox = document.getElementById('coachReportBox');
    if (coachBox) {
      if (coachReport.length === 0) {
        coachBox.innerHTML = '<span class="text-muted">Selecione campeões para gerar o relatório tático do Coach.</span>';
      } else {
        let cHtml = '';
        coachReport.forEach(item => {
          cHtml += `
            <div class="coach-instruction-item">
              <span class="fs-5">${item.icon}</span>
              <div>
                <strong class="text-cyan">${item.target}:</strong> ${item.text}
              </div>
            </div>
          `;
        });
        coachBox.innerHTML = cHtml;
      }
    }
  }

  function updateProgressBar(id, value) {
    const el = document.getElementById(id);
    if (el) {
      const clamped = Math.min(100, Math.max(0, value));
      el.style.width = `${clamped}%`;
    }
  }

  function renderStrategyLibrary() {
    const container = document.getElementById('strategyLibraryContainer');
    if (!container) return;

    const strats = window.dataLoader.strategies || [];
    let html = '';
    strats.forEach(s => {
      html += `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="strategy-card">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="fs-2">${s.icon}</span>
              <h5 class="m-0 text-gold font-heading">${s.name}</h5>
            </div>
            <p class="fs-7 text-muted mb-3">${s.description}</p>
            <div class="mb-2"><strong>Objetivo:</strong> ${s.objective}</div>
            <div class="mb-2"><strong>Quando usar:</strong> ${s.whenToUse}</div>
            <div class="mt-3">
              <strong class="text-success">Pontos Fortes:</strong>
              <ul class="fs-7 text-muted ps-3 mb-2">
                ${s.strengths.map(st => `<li>${st}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderHistoryView() {
    const container = document.getElementById('historyTableBody');
    if (!container) return;

    const history = window.historyManager.getHistory();
    if (history.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum draft salvo no histórico ainda.</td></tr>';
      return;
    }

    let html = '';
    history.forEach(item => {
      const picksMy = Object.values(item.myTeamPicks).filter(Boolean).join(', ') || 'Nenhum';
      const picksEnemy = Object.values(item.enemyTeamPicks).filter(Boolean).join(', ') || 'Nenhum';

      html += `
        <tr>
          <td>${item.date}</td>
          <td class="fw-bold text-gold">${item.name}</td>
          <td><span class="badge ${item.mySide === 'BLUE' ? 'bg-info' : 'bg-danger'}">${item.mySide}</span></td>
          <td class="fs-7">${picksMy}</td>
          <td class="fs-7">${picksEnemy}</td>
          <td><span class="badge bg-gold text-dark">${item.score}/100</span></td>
        </tr>
      `;
    });
    container.innerHTML = html;
  }

  function renderSavedCompsView() {
    const container = document.getElementById('savedCompsContainer');
    if (!container) return;

    const comps = window.historyManager.getSavedComps();
    if (comps.length === 0) {
      container.innerHTML = '<div class="col-12 text-muted">Nenhuma composição salva ainda.</div>';
      return;
    }

    let html = '';
    comps.forEach(c => {
      html += `
        <div class="col-md-6 mb-3">
          <div class="dl-card">
            <h5 class="text-cyan m-0">${c.name}</h5>
            <p class="fs-7 text-muted mb-2">${c.description}</p>
            <div class="fs-7 mb-2"><strong>Win Condition:</strong> ${c.winCondition}</div>
            <button class="btn btn-sm btn-gold mt-2">Carregar Composição</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  // Trigger initial analysis
  triggerRealtimeAnalysis();
});
