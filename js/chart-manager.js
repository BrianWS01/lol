/**
 * DRAFTLAB - Chart Manager (Chart.js Integration)
 * Controls Radar Chart (9 traits) & Power Curve Line Chart (Early/Mid/Late).
 */
class ChartManager {
  constructor() {
    this.radarChart = null;
    this.powerCurveChart = null;
  }

  initCharts() {
    this.initRadarChart();
    this.initPowerCurveChart();
  }

  initRadarChart() {
    const ctx = document.getElementById('compositionRadarCanvas');
    if (!ctx) return;

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Engage', 'Peel', 'Split', 'Team Fight', 'Scaling', 'Early Game', 'Poke', 'CC', 'Frontline'],
        datasets: [
          {
            label: 'Meu Time',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(10, 200, 185, 0.25)',
            borderColor: '#0AC8B9',
            pointBackgroundColor: '#0AC8B9',
            pointBorderColor: '#fff',
            borderWidth: 2
          },
          {
            label: 'Time Inimigo',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(232, 64, 87, 0.25)',
            borderColor: '#E84057',
            pointBackgroundColor: '#E84057',
            pointBorderColor: '#fff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: {
              color: '#8A94A6',
              font: { family: 'Inter', size: 11, weight: '600' }
            },
            ticks: {
              display: false,
              min: 0,
              max: 10
            }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#FFFFFF', font: { family: 'Outfit', weight: '700' } }
          }
        }
      }
    });
  }

  initPowerCurveChart() {
    const ctx = document.getElementById('powerCurveCanvas');
    if (!ctx) return;

    this.powerCurveChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['0-10 min (Early)', '10-20 min (Mid)', '20-30 min (Late-Mid)', '35+ min (Late)'],
        datasets: [
          {
            label: 'Meu Time',
            data: [5, 5, 5, 5],
            borderColor: '#0AC8B9',
            backgroundColor: 'rgba(10, 200, 185, 0.15)',
            fill: true,
            tension: 0.3,
            borderWidth: 3
          },
          {
            label: 'Time Inimigo',
            data: [5, 5, 5, 5],
            borderColor: '#E84057',
            backgroundColor: 'rgba(232, 64, 87, 0.15)',
            fill: true,
            tension: 0.3,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8A94A6', font: { family: 'Inter' } }
          },
          y: {
            min: 0,
            max: 10,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8A94A6', font: { family: 'Inter' } }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#FFFFFF', font: { family: 'Outfit', weight: '700' } }
          }
        }
      }
    });
  }

  updateCharts(myScores, enemyScores, myTimeline, enemyTimeline) {
    if (this.radarChart) {
      this.radarChart.data.datasets[0].data = [
        myScores.engage || 0,
        myScores.peel || 0,
        myScores.splitpush || 0,
        myScores.teamfight || 0,
        myScores.late || 0,
        myScores.early || 0,
        myScores.poke || 0,
        myScores.cc || 0,
        myScores.frontline || 0
      ];
      this.radarChart.data.datasets[1].data = [
        enemyScores.engage || 0,
        enemyScores.peel || 0,
        enemyScores.splitpush || 0,
        enemyScores.teamfight || 0,
        enemyScores.late || 0,
        enemyScores.early || 0,
        enemyScores.poke || 0,
        enemyScores.cc || 0,
        enemyScores.frontline || 0
      ];
      this.radarChart.update();
    }

    if (this.powerCurveChart && myTimeline) {
      this.powerCurveChart.data.datasets[0].data = myTimeline.curveData || [5,5,5,5];
      if (enemyTimeline) {
        this.powerCurveChart.data.datasets[1].data = enemyTimeline.curveData || [5,5,5,5];
      }
      this.powerCurveChart.update();
    }
  }
}

window.chartManager = new ChartManager();
