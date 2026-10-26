document.addEventListener('DOMContentLoaded', () => {
  if (!API.checkAuth()) return;

  const user = API.getUser();
  if (user && user.name) {
    document.getElementById('user-display').textContent = user.name;
  }

  document.getElementById('btn-logout').addEventListener('click', () => {
    API.logout();
  });

  const trackerDate = document.getElementById('tracker-date');
  const trackerList = document.getElementById('tracker-list');
  const trackerLoading = document.getElementById('tracker-loading');
  const trackerEmpty = document.getElementById('tracker-empty');
  const selectHabitChart = document.getElementById('select-habit-chart');
  const selectChartRange = document.getElementById('select-chart-range');
  const chartSubtitle = document.getElementById('chart-subtitle');
  const alertBox = document.getElementById('alert-box');
  const chartEmpty = document.getElementById('chart-empty');
  const chartCanvas = document.getElementById('habitChart');

  let currentHabits = [];
  let currentLogs = [];
  let chartInstance = null;

  // Set tanggal default ke hari ini (format YYYY-MM-DD lokal)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  trackerDate.value = `${year}-${month}-${day}`;

  const COLOR_PALETTE = [
    '#4f46e5', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#f97316'  // Orange
  ];

  function showAlert(message, type = 'danger') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 4000);
  }

  // Muat data untuk tanggal yang dipilih
  async function loadData() {
    trackerLoading.style.display = 'block';
    trackerList.style.display = 'none';
    trackerEmpty.style.display = 'none';

    try {
      const selectedDate = trackerDate.value;
      const [habitsRes, logsRes] = await Promise.all([
        API.request('/api/habits'),
        API.request(`/api/logs?date=${selectedDate}`),
      ]);

      currentHabits = habitsRes.habits || [];
      currentLogs = logsRes.logs || [];
      trackerLoading.style.display = 'none';

      if (currentHabits.length === 0) {
        trackerEmpty.style.display = 'block';
        updateChartOptions([]);
        return;
      }

      renderTrackerList();
      updateChartOptions(currentHabits);

      // Render chart
      loadChart(selectHabitChart.value || 'combined');
    } catch (err) {
      trackerLoading.style.display = 'none';
      showAlert(err.message || 'Gagal memuat data tracker');
    }
  }

  function renderTrackerList() {
    trackerList.innerHTML = '';

    currentHabits.forEach(habit => {
      const isBoolean = habit.type === 'boolean';
      const logEntry = currentLogs.find(l => l.habit_id === habit.id) || { actual_value: 0, notes: '' };
      const actual = logEntry.actual_value || 0;
      const target = habit.target_value || 1;

      let percentage = 0;
      let isComplete = false;

      if (isBoolean) {
        isComplete = actual >= 1;
        percentage = isComplete ? 100 : 0;
      } else {
        percentage = Math.min(100, Math.round((actual / target) * 100));
        isComplete = actual >= target;
      }

      const card = document.createElement('div');
      card.className = 'habit-item';
      card.style.borderLeft = isComplete ? '4px solid var(--success)' : '4px solid var(--primary)';

      // Kontrol input
      let inputControlHTML = '';
      if (isBoolean) {
        inputControlHTML = `
          <div style="flex: 1; min-width: 140px;">
            <select class="form-control input-actual" data-id="${habit.id}" style="font-weight: 600;">
              <option value="1" ${actual >= 1 ? 'selected' : ''}>✓ Ya (Terpenuhi)</option>
              <option value="0" ${actual < 1 ? 'selected' : ''}>✗ Tidak (Belum)</option>
            </select>
          </div>
        `;
      } else {
        inputControlHTML = `
          <div style="flex: 1; min-width: 130px;">
            <input type="number" step="any" min="0" class="form-control input-actual" data-id="${habit.id}" value="${actual}" placeholder="Capaian (${escapeHTML(habit.unit)})">
          </div>
        `;
      }

      const statusBadgeText = isBoolean
        ? (isComplete ? '✓ Ya (Terpenuhi)' : 'Belum Terpenuhi')
        : (isComplete ? '✓ Target Tercapai' : `${percentage}%`);

      const statusInfoText = isBoolean
        ? `Status: <b>${actual >= 1 ? 'Ya' : 'Tidak'}</b> (Parameter Ya/Tidak)`
        : `Capaian: <b>${actual}</b> / ${target} ${escapeHTML(habit.unit)} (Target: ${target} ${escapeHTML(habit.unit)})`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 700;">${escapeHTML(habit.name)}</h4>
            <p style="font-size: 0.82rem; color: var(--gray-600);">${escapeHTML(habit.description || '')}</p>
          </div>
          <span class="habit-target-badge" style="background: ${isComplete ? '#dcfce7' : 'var(--primary-light)'}; color: ${isComplete ? '#15803d' : 'var(--primary)'};">
            ${statusBadgeText}
          </span>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill ${isComplete ? 'complete' : ''}" style="width: ${percentage}%;"></div>
        </div>
        <div style="font-size: 0.8rem; color: var(--gray-600); margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
          <span>${statusInfoText}</span>
          <span>${percentage}%</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
          ${inputControlHTML}
          <div style="flex: 2; min-width: 160px;">
            <input type="text" class="form-control input-notes" data-id="${habit.id}" value="${escapeHTML(logEntry.notes || '')}" placeholder="Catatan singkat (opsional)">
          </div>
          <button class="btn btn-primary btn-sm btn-save-log" data-id="${habit.id}">
            💾 Simpan
          </button>
        </div>
      `;
      trackerList.appendChild(card);
    });

    trackerList.style.display = 'flex';

    // Event listener tombol simpan capaian
    document.querySelectorAll('.btn-save-log').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const habitId = parseInt(e.target.getAttribute('data-id'));
        const inputActual = document.querySelector(`.input-actual[data-id="${habitId}"]`);
        const inputNotes = document.querySelector(`.input-notes[data-id="${habitId}"]`);

        const actualValue = parseFloat(inputActual.value) || 0;
        const notes = inputNotes.value.trim();
        const date = trackerDate.value;

        try {
          await API.request('/api/logs', {
            method: 'POST',
            body: JSON.stringify({
              habit_id: habitId,
              date,
              actual_value: actualValue,
              notes,
            }),
          });

          showAlert('Capaian berhasil disimpan!', 'success');
          await loadData();
        } catch (err) {
          showAlert(err.message || 'Gagal menyimpan capaian');
        }
      });
    });
  }

  function updateChartOptions(habits) {
    const selectedBefore = selectHabitChart.value;
    selectHabitChart.innerHTML = '';

    if (habits.length === 0) {
      selectHabitChart.innerHTML = '<option value="">(Tidak ada kebiasaan)</option>';
      return;
    }

    // Opsi 1: Grafik Gabungan Seluruh Kebiasaan
    const optCombined = document.createElement('option');
    optCombined.value = 'combined';
    optCombined.textContent = '🌟 Grafik Gabungan Seluruh Kebiasaan (% Capaian)';
    selectHabitChart.appendChild(optCombined);

    // Opsi per kebiasaan
    habits.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.id;
      const typeLabel = h.type === 'boolean' ? 'Ya/Tidak' : `${h.target_value} ${h.unit}`;
      opt.textContent = `📌 ${h.name} (${typeLabel})`;
      selectHabitChart.appendChild(opt);
    });

    if (selectedBefore && (selectedBefore === 'combined' || habits.some(h => h.id == selectedBefore))) {
      selectHabitChart.value = selectedBefore;
    } else {
      selectHabitChart.value = 'combined';
    }
  }

  // Muat grafik
  async function loadChart(chartSelection) {
    if (!chartSelection) return;

    const days = selectChartRange.value || '30';

    if (chartSelection === 'combined') {
      await renderCombinedChart(days);
    } else {
      await renderSingleHabitChart(chartSelection, days);
    }
  }

  // 1. Render Grafik Gabungan
  async function renderCombinedChart(days) {
    chartSubtitle.textContent = `Grafik perkembangan capaian seluruh kebiasaan (${days} hari). Parameter Ya/Tidak mengalami kenaikan kumulatif +${(100/days).toFixed(1)}% setiap hari "Ya" (mencapai 100% jika konsisten selama ${days} hari).`;

    try {
      const data = await API.request(`/api/logs/chart-combined?days=${days}`);
      const dates = data.dates || [];
      const habits = data.habits || [];
      const totalDays = data.days_count || parseInt(days);
      const stepPct = (100.0 / totalDays).toFixed(1);

      if (habits.length === 0 || dates.length === 0) {
        chartCanvas.style.display = 'none';
        chartEmpty.style.display = 'block';
        if (chartInstance) {
          chartInstance.destroy();
          chartInstance = null;
        }
        return;
      }

      chartEmpty.style.display = 'none';
      chartCanvas.style.display = 'block';

      if (chartInstance) {
        chartInstance.destroy();
      }

      const datasets = habits.map((habit, index) => {
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
        return {
          label: habit.name,
          data: habit.percentages,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: totalDays > 14 ? 3 : 4,
          pointHoverRadius: 6,
          habitDetail: habit,
        };
      });

      const ctx = chartCanvas.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Persentase Capaian (%)',
                font: { weight: 'bold' },
              },
              ticks: {
                callback: function(val) {
                  return val + '%';
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Tanggal',
                font: { weight: 'bold' },
              },
              ticks: {
                maxRotation: 45,
                minRotation: totalDays > 14 ? 45 : 0,
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                boxWidth: 8,
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const habit = context.dataset.habitDetail;
                  const idx = context.dataIndex;
                  const pct = context.parsed.y;
                  const rawVal = habit.actuals[idx];

                  if (habit.type === 'boolean') {
                    const status = rawVal >= 1 ? `✓ Ya (+${stepPct}%)` : '✗ Tidak (+0%)';
                    const cum = habit.cumulatives ? habit.cumulatives[idx] : 0;
                    return ` ${habit.name}: ${status} | Akumulasi: ${cum}/${totalDays} hari (${pct}%)`;
                  } else {
                    return ` ${habit.name}: ${rawVal}/${habit.target_value} ${habit.unit} (${pct}%)`;
                  }
                }
              }
            }
          }
        }
      });

    } catch (err) {
      console.error(err);
    }
  }

  // 2. Render Grafik Tunggal per Kebiasaan
  async function renderSingleHabitChart(habitId, days) {
    try {
      const data = await API.request(`/api/logs/chart/${habitId}?days=${days}`);
      const habit = data.habit;
      const history = data.history || [];
      const totalDays = data.total_days || parseInt(days);
      const isBoolean = habit.type === 'boolean';
      const stepPct = data.step_percentage || (100.0 / totalDays).toFixed(1);

      if (isBoolean) {
        chartSubtitle.textContent = `Grafik akumulasi keberhasilan "${habit.name}" (${totalDays} hari). Kenaikan +${stepPct}% per hari Ya hingga mencapai 100% jika konsisten selama ${totalDays} hari.`;
      } else {
        chartSubtitle.textContent = `Riwayat perkembangan capaian spesifik untuk kebiasaan "${habit.name}" (${totalDays} hari).`;
      }

      if (history.length === 0) {
        chartCanvas.style.display = 'none';
        chartEmpty.style.display = 'block';
        if (chartInstance) {
          chartInstance.destroy();
          chartInstance = null;
        }
        return;
      }

      chartEmpty.style.display = 'none';
      chartCanvas.style.display = 'block';

      const labels = history.map(item => item.date);

      if (chartInstance) {
        chartInstance.destroy();
      }

      let datasets = [];

      if (isBoolean) {
        // Tipe Boolean: Garis persentase akumulatif 0 s/d 100%
        const percentages = history.map(item => item.percentage);
        const target100 = history.map(() => 100);

        datasets = [
          {
            label: `Keberhasilan Akumulatif (% Capaian Bulanan)`,
            data: percentages,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
            pointBackgroundColor: '#4f46e5',
            pointRadius: totalDays > 14 ? 3 : 5,
          },
          {
            label: `Target Konsisten Penuh (100% = ${totalDays}/${totalDays} Hari Ya)`,
            data: target100,
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
          }
        ];
      } else {
        // Tipe Numerik: Capaian Riil vs Garis Target
        const values = history.map(item => item.actual_value);
        datasets = [
          {
            label: `Capaian Riil (${habit.unit})`,
            data: values,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.25,
            pointBackgroundColor: '#4f46e5',
            pointRadius: totalDays > 14 ? 3 : 5,
          },
          {
            label: `Target Harian (${habit.target_value} ${habit.unit})`,
            data: history.map(() => habit.target_value),
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
          }
        ];
      }

      const ctx = chartCanvas.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: isBoolean ? 100 : undefined,
              title: {
                display: true,
                text: isBoolean ? 'Keberhasilan Kumulatif (%)' : `Nilai (${habit.unit})`,
                font: { weight: 'bold' },
              },
              ticks: isBoolean ? {
                callback: function(v) { return v + '%'; }
              } : undefined,
            },
            x: {
              title: {
                display: true,
                text: 'Tanggal',
                font: { weight: 'bold' },
              },
              ticks: {
                maxRotation: 45,
                minRotation: totalDays > 14 ? 45 : 0,
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const idx = context.dataIndex;
                  const item = history[idx];

                  if (isBoolean) {
                    if (context.datasetIndex === 0) {
                      const status = item.actual_value >= 1 ? `✓ Ya (+${stepPct}%)` : '✗ Tidak (+0%)';
                      return ` Status: ${status} | Akumulasi: ${item.cumulative_count}/${totalDays} Hari (${item.percentage}%)`;
                    }
                    return ' Target Konsistensi: 100%';
                  } else {
                    if (context.datasetIndex === 0) {
                      return ` Capaian: ${item.actual_value} ${habit.unit}`;
                    }
                    return ` Target Harian: ${habit.target_value} ${habit.unit}`;
                  }
                },
                afterBody: (context) => {
                  const idx = context[0].dataIndex;
                  const note = history[idx]?.notes;
                  return note ? `Catatan: ${note}` : '';
                }
              }
            }
          }
        }
      });

    } catch (err) {
      console.error(err);
    }
  }

  // Listener ganti tanggal
  trackerDate.addEventListener('change', () => {
    loadData();
  });

  // Listener ganti pilihan kebiasaan pada grafik
  selectHabitChart.addEventListener('change', (e) => {
    loadChart(e.target.value);
  });

  // Listener ganti pilihan rentang grafik (30 hari, 14 hari, 7 hari)
  selectChartRange.addEventListener('change', () => {
    loadChart(selectHabitChart.value);
  });

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  loadData();
});
