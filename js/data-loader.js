/**
 * DRAFTLAB - Data Loader Module
 * Loads and manages all 8 JSON datasets asynchronously.
 */
class DataLoader {
  constructor() {
    this.champions = [];
    this.strategies = [];
    this.synergies = [];
    this.counters = [];
    this.objectives = {};
    this.draftOrder = [];
    this.tierlist = {};
    this.players = {};
    this.isLoaded = false;
  }

  async loadAllData() {
    try {
      const [
        champsData,
        stratData,
        synData,
        countData,
        objData,
        orderData,
        tierData,
        playData
      ] = await Promise.all([
        fetch('./data/champions.json').then(r => r.json()),
        fetch('./data/strategies.json').then(r => r.json()),
        fetch('./data/synergies.json').then(r => r.json()),
        fetch('./data/counters.json').then(r => r.json()),
        fetch('./data/objectives.json').then(r => r.json()),
        fetch('./data/draft-order.json').then(r => r.json()),
        fetch('./data/tierlist.json').then(r => r.json()),
        fetch('./data/players.json').then(r => r.json())
      ]);

      this.champions = champsData;
      this.strategies = stratData;
      this.synergies = synData;
      this.counters = countData;
      this.objectives = objData;
      this.draftOrder = orderData.phases || [];
      this.tierlist = tierData;
      this.players = playData;
      this.isLoaded = true;

      console.log('⚡ DRAFTLAB Data Engine Loaded Successfully! (8 Datasets Active)');
      return true;
    } catch (error) {
      console.error('❌ Failed to load DRAFTLAB datasets:', error);
      return false;
    }
  }

  getChampionByName(name) {
    if (!name) return null;
    return this.champions.find(c => c.name.toLowerCase() === name.toLowerCase() || c.id.toLowerCase() === name.toLowerCase()) || null;
  }

  getChampionsByRole(role) {
    if (!role) return this.champions;
    return this.champions.filter(c => c.lanes.includes(role));
  }
}

window.dataLoader = new DataLoader();
