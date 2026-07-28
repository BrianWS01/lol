/**
 * DRAFTLAB - Draft Order & Turn Engine
 * Tracks the 20-step competitive draft sequence (Bans 1-6, Picks 1-6, Bans 7-10, Picks 7-10)
 * and determines whose turn it is (My Team vs Enemy Team).
 */
class DraftOrderEngine {
  constructor() {
    this.myTeamSide = 'BLUE'; // 'BLUE' or 'RED'
    this.currentStepIndex = 0; // 0 to 19 (Step 1 to 20)
  }

  setMyTeamSide(side) {
    this.myTeamSide = side;
  }

  getEnemySide() {
    return this.myTeamSide === 'BLUE' ? 'RED' : 'BLUE';
  }

  getCurrentStep() {
    const phases = window.dataLoader.draftOrder;
    if (!phases || phases.length === 0) return null;
    return phases[this.currentStepIndex] || null;
  }

  nextStep() {
    if (this.currentStepIndex < 19) {
      this.currentStepIndex++;
    }
  }

  previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    }
  }

  setStep(index) {
    if (index >= 0 && index < 20) {
      this.currentStepIndex = index;
    }
  }

  resetDraft() {
    this.currentStepIndex = 0;
  }

  isMyTurn() {
    const current = this.getCurrentStep();
    if (!current) return true;
    return current.side === this.myTeamSide;
  }

  getStepDescription() {
    const current = this.getCurrentStep();
    if (!current) return 'Draft Livre';

    const sideText = current.side === this.myTeamSide ? 'MEU TIME' : 'TIME INIMIGO';
    const actionText = current.type === 'BAN' ? 'BANIR' : 'ESCOLHER (PICK)';
    return `Passo ${current.step}/20: ${actionText} - ${sideText} (${current.label})`;
  }
}

window.draftOrderEngine = new DraftOrderEngine();
