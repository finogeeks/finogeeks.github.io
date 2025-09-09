(function(){
  const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => document.documentElement.classList.contains('dark') || (mq && mq.matches);
  const palette = () => ({
    text: isDark() ? '#e5e7eb' : '#4A5568',
    grid: isDark() ? '#334155' : '#E2E8F0',
    tooltipBg: isDark() ? '#0b132b' : '#073B4C'
  });

  const wrapLabel = (label, maxLength = 16) => {
    if (typeof label !== 'string' || label.length <= maxLength) return label;
    const words = label.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxLength && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = (currentLine + ' ' + word).trim();
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  };

  const tooltipTitleCallback = (tooltipItems) => {
    const item = tooltipItems[0];
    let label = item.chart.data.labels[item.dataIndex];
    if (Array.isArray(label)) return label.join(' ');
    return label;
  };

  function buildSharedOptions(){
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: palette().text,
            font: { family: "'Inter', sans-serif", size: 14 }
          }
        },
        tooltip: {
          callbacks: { title: tooltipTitleCallback },
          backgroundColor: palette().tooltipBg,
          titleFont: { size: 16, family: "'Inter', sans-serif" },
          bodyFont: { size: 14, family: "'Inter', sans-serif" },
          padding: 12,
          cornerRadius: 8,
        }
      },
      scales: {
        y: { ticks: { color: palette().text, font: { family: "'Inter', sans-serif" } }, grid: { color: palette().grid } },
        x: { ticks: { color: palette().text, font: { family: "'Inter', sans-serif" } }, grid: { display: false } }
      }
    };
  }

  function initCharts(){
    const agentCanvas = document.getElementById('agentEvolutionChart');
    if (agentCanvas) {
      const ctx = agentCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['2025', '2027', '2029', '2031', '2033', '2035', '2037'],
          datasets: [
            { label: 'Agent-Enhanced Apps', data: [3,30,40,25,10,10,5], backgroundColor: '#FFD166' },
            { label: 'Agent-Led Interfaces', data: [0,5,20,40,50,35,25], backgroundColor: '#06D6A0' },
            { label: 'Agents as Full Apps', data: [0,0,5,20,25,50,65], backgroundColor: '#118AB2' }
          ]
        },
        options: {
          ...buildSharedOptions(),
          scales: {
            y: {
              stacked: true,
              ticks: { callback: (v)=> v + '%', color: palette().text },
              grid: { color: palette().grid }
            },
            x: { stacked: true, ticks: { color: palette().text }, grid: { display: false } }
          }
        }
      });
    }

    const webmcpCanvas = document.getElementById('webmcpChart');
    if (webmcpCanvas) {
      const ctx2 = webmcpCanvas.getContext('2d');
      const labels = ['Shift to Structured Actions','Outcome-Based Incentives','Scoped Authentication & Security','Standardized Distribution'].map(l=>wrapLabel(l));
      new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ label: 'WebMCP Pillars', data: [30,25,25,20], backgroundColor: ['#118AB2','#FFD166','#06D6A0','#FF6B6B'], borderColor: '#fff', borderWidth: 4, hoverOffset: 4 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: palette().text, font: { family: "'Inter', sans-serif", size: 12 }, boxWidth: 15, padding: 20 }
            },
            tooltip: { callbacks: { title: tooltipTitleCallback }, backgroundColor: palette().tooltipBg, titleFont: { size: 16, family: "'Inter', sans-serif" }, bodyFont: { size: 14, family: "'Inter', sans-serif" }, padding: 12, cornerRadius: 8 }
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCharts); else initCharts();
})();
