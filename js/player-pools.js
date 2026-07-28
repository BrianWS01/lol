/**
 * DRAFTLAB - Player Pools Manager
 * Manages player rosters and categorized champion pools.
 */
class PlayerPoolManager {
  getPlayerInfo(role) {
    if (!window.dataLoader.isLoaded) return null;
    return window.dataLoader.players.players?.[role] || null;
  }

  getPoolForRole(role) {
    const player = this.getPlayerInfo(role);
    if (!player) return [];

    let poolList = [];
    Object.values(player.pools).forEach(champs => {
      poolList = poolList.concat(champs);
    });

    // Deduplicate
    return [...new Set(poolList)];
  }

  getCategoryForChampion(role, champName) {
    const player = this.getPlayerInfo(role);
    if (!player || !player.pools) return null;

    for (const [category, champs] of Object.entries(player.pools)) {
      if (champs.includes(champName)) {
        return category;
      }
    }
    return null;
  }
}

window.playerPoolManager = new PlayerPoolManager();
