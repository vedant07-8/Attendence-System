/**
 * Student Subjects Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['student'])) return;
  Layout.init('My Enrolled Subjects');

  const container = document.getElementById('subjects-cards-grid');

  try {
    const res = await API.get('/dashboard/student');
    if (!res.success) return;

    const { subjects } = res.data;

    if (subjects.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i data-lucide="book-open"></i></div>
          <div class="empty-state-title">No subjects found</div>
          <div class="empty-state-desc">You are not enrolled in any active subjects.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = subjects.map(s => {
      const isDefaulter = s.isDefaulter;
      const progressWidth = Math.min(100, Math.max(0, s.percentage));

      let recommendation = '';
      if (s.total === 0) {
        recommendation = 'No lectures held yet.';
      } else if (isDefaulter) {
        recommendation = `<strong style="color: var(--danger);">Deficit:</strong> Attend next <strong>${s.classesNeeded}</strong> consecutive classes to reach 75%.`;
      } else {
        recommendation = `<strong style="color: var(--success);">Eligible:</strong> You can safely miss up to <strong>${s.safeAbsences}</strong> classes without falling below 75%.`;
      }

      return `
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header">
            <div>
              <span class="badge badge-accent" style="margin-bottom: 4px;">${UI.escapeHtml(s.subjectCode)}</span>
              <h2 class="card-title" style="font-size: var(--font-size-base);">${UI.escapeHtml(s.subjectName)}</h2>
              <div class="card-subtitle"><i data-lucide="user" style="display: inline; width: 12px; height: 12px; vertical-align: -1px;"></i> ${UI.escapeHtml(s.facultyName)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: var(--font-size-xl); font-weight: 700; color: ${isDefaulter ? 'var(--danger)' : 'var(--success)'};">
                ${s.percentage.toFixed(1)}%
              </div>
              <span class="badge ${isDefaulter ? 'badge-absent' : 'badge-present'}" style="margin-top: 4px;">
                ${isDefaulter ? 'Defaulter' : 'Eligible'}
              </span>
            </div>
          </div>

          <div class="card-body" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
            <!-- Progress Bar -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: 6px;">
                <span>Progress to 75% target</span>
                <span>${s.present}/${s.total} Lectures</span>
              </div>
              <div style="width: 100%; height: 8px; background-color: var(--bg-subtle); border-radius: var(--radius-full); overflow: hidden; position: relative;">
                <!-- 75% target marker line -->
                <div style="position: absolute; left: 75%; top: 0; bottom: 0; width: 2px; background-color: var(--text-muted); z-index: 2;" title="75% threshold"></div>
                <!-- Actual fill -->
                <div style="width: ${progressWidth}%; height: 100%; background-color: ${isDefaulter ? 'var(--danger)' : 'var(--success)'}; border-radius: var(--radius-full); transition: width 400ms ease;"></div>
              </div>
            </div>

            <!-- Stats Mini Grid -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; background-color: var(--bg-subtle); padding: 10px; border-radius: var(--radius-md);">
              <div>
                <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted);">Held</span>
                <div style="font-weight: 700; color: var(--text-primary);">${s.total}</div>
              </div>
              <div>
                <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--success);">Attended</span>
                <div style="font-weight: 700; color: var(--success);">${s.present}</div>
              </div>
              <div>
                <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--danger);">Missed</span>
                <div style="font-weight: 700; color: var(--danger);">${s.absent}</div>
              </div>
            </div>

            <!-- Recommendation Box -->
            <div style="font-size: var(--font-size-xs); padding: 8px 12px; border-radius: var(--radius-sm); background-color: ${isDefaulter ? 'var(--danger-subtle)' : 'var(--success-subtle)'}; color: var(--text-secondary); border: 1px solid ${isDefaulter ? 'var(--danger-border)' : 'var(--success-border)'};">
              ${recommendation}
            </div>

            <!-- Action Link -->
            <a href="/student/calculator.html?present=${s.present}&total=${s.total}&subject=${encodeURIComponent(s.subjectName)}" class="btn btn-secondary btn-sm" style="width: 100%;">
              <i data-lucide="calculator"></i>
              <span>Simulate Target in Calculator</span>
            </a>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 32px;">
        ${UI.escapeHtml(err.message || 'Failed to load subjects')}
      </div>
    `;
  }
});
