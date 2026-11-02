/**
 * Student Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth(['student'])) return;
  Layout.init('Student Portal');

  try {
    const res = await API.get('/dashboard/student');
    if (!res.success) return;

    const { student, overall, subjects, recentRecords } = res.data;

    // Populate Student Profile Details
    document.getElementById('student-name-display').textContent = student.name;
    document.getElementById('student-roll-display').textContent = student.rollNumber;
    document.getElementById('student-class-display').textContent = student.class ? student.class.split('(')[0].trim() : '-';

    // Populate Hero Metric
    const heroPct = document.getElementById('hero-percentage');
    const heroStatus = document.getElementById('hero-status-badge');
    heroPct.textContent = `${overall.percentage.toFixed(1)}%`;

    if (overall.isDefaulter) {
      heroPct.style.color = '#f87171';
      heroStatus.innerHTML = `<span class="badge badge-absent" style="background-color: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);"><i data-lucide="alert-triangle"></i> Defaulter Status (&lt;75%)</span>`;
    } else {
      heroPct.style.color = '#4ade80';
      heroStatus.innerHTML = `<span class="badge badge-present" style="background-color: rgba(34, 197, 94, 0.2); color: #86efac; border-color: rgba(34, 197, 94, 0.4);"><i data-lucide="check-circle-2"></i> Eligible (&gt;=75%)</span>`;
    }

    // Eligibility Notice Card
    const eligCard = document.getElementById('eligibility-card');
    const eligIcon = document.getElementById('eligibility-icon');
    const eligTitle = document.getElementById('eligibility-title');
    const eligDesc = document.getElementById('eligibility-desc');

    if (overall.isDefaulter) {
      eligCard.style.borderColor = 'var(--danger-border)';
      eligCard.style.backgroundColor = 'var(--danger-subtle)';
      eligIcon.style.backgroundColor = '#fee2e2';
      eligIcon.style.color = 'var(--danger)';
      eligIcon.innerHTML = '<i data-lucide="alert-circle"></i>';
      eligTitle.style.color = 'var(--danger)';
      eligTitle.textContent = `Action Required: Attendance Deficit of ${overall.classesNeeded} Classes`;
      eligDesc.textContent = `Your attendance of ${overall.percentage.toFixed(1)}% is below the mandatory 75% limit. You must attend the next ${overall.classesNeeded} consecutive lectures without absence to restore eligibility.`;
    } else {
      eligCard.style.borderColor = 'var(--success-border)';
      eligCard.style.backgroundColor = 'var(--success-subtle)';
      eligIcon.style.backgroundColor = '#dcfce7';
      eligIcon.style.color = 'var(--success)';
      eligIcon.innerHTML = '<i data-lucide="shield-check"></i>';
      eligTitle.style.color = 'var(--success)';
      eligTitle.textContent = `Good Standing: Attendance at ${overall.percentage.toFixed(1)}%`;
      eligDesc.textContent = `You currently have a safety cushion of ${overall.safeAbsences} classes before falling below the 75% attendance threshold.`;
    }

    // Quick Stats Cards
    document.getElementById('stat-total-held').textContent = overall.total;
    document.getElementById('stat-total-present').textContent = overall.present;
    document.getElementById('stat-total-absent').textContent = overall.absent;

    const neededEl = document.getElementById('stat-classes-needed');
    const neededSub = document.getElementById('stat-needed-subtext');
    if (overall.isDefaulter) {
      neededEl.textContent = `+${overall.classesNeeded}`;
      neededEl.style.color = 'var(--danger)';
      neededSub.textContent = 'Consecutive classes to attend';
    } else {
      neededEl.textContent = `${overall.safeAbsences}`;
      neededEl.style.color = 'var(--success)';
      neededSub.textContent = 'Safe classes you can miss';
    }

    // Populate Subject Breakdown Table
    const subjectsTbody = document.getElementById('student-subjects-tbody');
    if (subjects.length === 0) {
      subjectsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
            No enrolled subjects found for your class.
          </td>
        </tr>
      `;
    } else {
      subjectsTbody.innerHTML = subjects.map(s => {
        let statusCol = '';
        if (s.total === 0) {
          statusCol = '<span class="badge badge-neutral">No Sessions Yet</span>';
        } else if (s.isDefaulter) {
          statusCol = `<span class="badge badge-warning"><i data-lucide="arrow-up-circle"></i> Need +${s.classesNeeded} classes</span>`;
        } else {
          statusCol = `<span class="badge badge-present"><i data-lucide="check"></i> Safe (+${s.safeAbsences} margin)</span>`;
        }

        return `
          <tr>
            <td><strong style="color: var(--brand-accent);">${UI.escapeHtml(s.subjectCode)}</strong></td>
            <td><div style="font-weight: 600; color: var(--text-primary);">${UI.escapeHtml(s.subjectName)}</div></td>
            <td>${UI.escapeHtml(s.facultyName)}</td>
            <td><strong>${s.present}</strong> / ${s.total}</td>
            <td>
              <div style="font-weight: 600; color: ${s.percentage >= 75 ? 'var(--success)' : 'var(--danger)'};">
                ${s.percentage.toFixed(1)}%
              </div>
            </td>
            <td>${statusCol}</td>
          </tr>
        `;
      }).join('');
    }

    // Populate Recent Records Table
    const recentTbody = document.getElementById('student-recent-tbody');
    if (recentRecords.length === 0) {
      recentTbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">
            No recorded attendance logs yet.
          </td>
        </tr>
      `;
    } else {
      recentTbody.innerHTML = recentRecords.map(r => `
        <tr>
          <td><strong style="color: var(--text-primary);">${UI.formatDate(r.date)}</strong></td>
          <td><span class="badge badge-accent">${UI.escapeHtml(r.subject ? r.subject.code : '-')}</span></td>
          <td>${UI.escapeHtml(r.subject ? r.subject.name : '-')}</td>
          <td>
            <span class="badge ${r.status === 'present' ? 'badge-present' : 'badge-absent'}">
              <i data-lucide="${r.status === 'present' ? 'check' : 'x'}"></i>
              ${r.status === 'present' ? 'Present' : 'Absent'}
            </span>
          </td>
        </tr>
      `).join('');
    }

    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    UI.showToast(err.message || 'Failed to load student dashboard', 'error');
  }
});
