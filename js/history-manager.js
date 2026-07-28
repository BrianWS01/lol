/**
 * DRAFTLAB - History & Saved Compositions Manager
 * Handles LocalStorage persistence and JSON Export / Import functionality.
 */
class HistoryManager {
  constructor() {
    this.historyKey = 'draftlab_history_v2';
    this.savedCompsKey = 'draftlab_saved_comps_v2';
  }

  getHistory() {
    try {
      const data = localStorage.getItem(this.historyKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveDraftToHistory(draftObj) {
    const history = this.getHistory();
    const newEntry = {
      id: 'draft_' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      name: draftObj.name || `Draft ${history.length + 1}`,
      mySide: draftObj.mySide,
      myTeamPicks: draftObj.myTeamPicks,
      enemyTeamPicks: draftObj.enemyTeamPicks,
      myBans: draftObj.myBans,
      enemyBans: draftObj.enemyBans,
      result: draftObj.result || 'Pendente',
      notes: draftObj.notes || '',
      score: draftObj.score || 0
    };
    history.unshift(newEntry);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
    return newEntry;
  }

  deleteDraftFromHistory(id) {
    let history = this.getHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  getSavedComps() {
    try {
      const data = localStorage.getItem(this.savedCompsKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveComposition(compObj) {
    const comps = this.getSavedComps();
    const newComp = {
      id: 'comp_' + Date.now(),
      name: compObj.name || 'Nova Composição',
      description: compObj.description || '',
      winCondition: compObj.winCondition || '',
      picks: compObj.picks,
      score: compObj.score || 0
    };
    comps.unshift(newComp);
    localStorage.setItem(this.savedCompsKey, JSON.stringify(comps));
    return newComp;
  }

  deleteSavedComp(id) {
    let comps = this.getSavedComps();
    comps = comps.filter(c => c.id !== id);
    localStorage.setItem(this.savedCompsKey, JSON.stringify(comps));
  }

  exportDataToJSON() {
    const exportObject = {
      app: 'DRAFTLAB',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      history: this.getHistory(),
      savedComps: this.getSavedComps()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DRAFTLAB_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importDataFromJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.history && Array.isArray(imported.history)) {
        localStorage.setItem(this.historyKey, JSON.stringify(imported.history));
      }
      if (imported.savedComps && Array.isArray(imported.savedComps)) {
        localStorage.setItem(this.savedCompsKey, JSON.stringify(imported.savedComps));
      }
      return true;
    } catch (e) {
      console.error('Import Error:', e);
      return false;
    }
  }
}

window.historyManager = new HistoryManager();
