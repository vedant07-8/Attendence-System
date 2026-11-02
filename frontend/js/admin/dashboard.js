/**
 * Admin Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['admin'])) return;
  Layout.init('Admin Dashboard');

  let trendChartInstance = null;
  let classChartInstance = null;

  try {
    const res = await API.get('/dashboard/admin');
    if (!res.success) return;

    const { stats, charts, defaultersPreview, recentSessions } = res.data;

    // Populate stat cards
    document.getElementById('stat-students').textContent = stats.totalStudents;
    document.getElementById('stat-faculty').textContent = stats.totalFaculty;
    document.getElementById('stat-overall-pct').textContent = `${stats.overallPercentage.toFixed(1)}%`;
    document.getElementById('stat-defaulters').textContent = stats.defaultersCount;

    // Render Trend Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const trendLabels = charts.trend.map(t => {
      const d = new Date(t.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const trendValues = charts.trend.map(t => t.percentage);

    trendChartInstance = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendLabels.length ? trendLabels : ['No Data'],
        datasets: [{
          label: 'Attendance %',
          data: trendValues.length ? trendValues : [0],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e5',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Attendance: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: (v) => `${v}%`,
              stepSize: 25,
              color: '#94a3b8'
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          }
        }
      }
    });

    // Render Class Bar Chart
    const classCtx = document.getElementById('classChart').getContext('2d');
    const classLabels = charts.classComparison.map(c => c.className.split('(')[0].trim());
    const classValues = charts.classComparison.map(c => c.percentage);

    classChartInstance = new Chart(classCtx, {
      type: 'bar',
      data: {
        labels: classLabels.length ? classLabels : ['No Classes'],
        datasets: [{
          label: 'Class Avg %',
          data: classValues.length ? classValues : [0],
          backgroundColor: classValues.map(v => v >= 75 ? '#0f172a' : '#ef4444'),
          borderRadius: 6,
          barThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Class Average: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: (v) => `${v}%`,
              stepSize: 25,
              color: '#94a3b8'
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          }
        }
      }
    });

    // Render Defaulters Preview Table
    const defaultersTbody = document.getElementById('defaulters-table-body');
    if (defaultersPreview.length === 0) {
      defaultersTbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">
            No defaulters found! All enrolled students maintain >= 75% attendance.
          </td>
        </tr>
      `;
    } else {
      defaultersTbody.innerHTML = defaultersPreview.map(st => `
        <tr>
          <td><strong style="color: var(--text-primary);">${UI.escapeHtml(st.rollNumber)}</strong></td>
          <td>${UI.escapeHtml(st.name)}</td>
          <td><span class="badge badge-neutral">${UI.escapeHtml(st.className ? st.className.split('(')[0].trim() : '-')}</span></td>
          <td>
            <span class="badge badge-absent">
              <i data-lucide="alert-triangle"></i> ${st.percentage.toFixed(1)}%
            </span>
          </td>
        </tr>
      `).join('');
    }

    // Render Recent Sessions Table
    const sessionsTbody = document.getElementById('sessions-table-body');
    if (recentSessions.length === 0) {
      sessionsTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
            No recorded attendance sessions yet.
          </td>
        </tr>
      `;
    } else {
      sessionsTbody.innerHTML = recentSessions.map(sess => `
        <tr>
          <td>${UI.formatDate(sess.date)}</td>
          <td><strong>${UI.escapeHtml(sess.subjectCode)}</strong> <span style="color: var(--text-muted); font-size: 0.8rem;">(${UI.escapeHtml(sess.subjectName)})</span></td>
          <td><span class="badge badge-neutral">${UI.escapeHtml(sess.className ? sess.className.split('(')[0].trim() : '-')}</span></td>
          <td>${sess.present}/${sess.total}</td>
          <td>${UI.getAttendanceBadge(sess.percentage)}</td>
        </tr>
      `).join('');
    }

    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    UI.showToast(err.message || 'Failed to load dashboard data', 'error');
  }
});
