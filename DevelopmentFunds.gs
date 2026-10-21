function addDevelopmentProject(project) {
  try {
    seedOperationalDefaults();

    if (!normalizeText(project.name)) throw new Error('Nama proyek wajib diisi');
    const targetBudget = normalizeNumber(project.target_budget);
    if (targetBudget <= 0) throw new Error('Target anggaran harus lebih dari nol');

    const record = {
      project_id: generateId('PRJ'),
      name: normalizeText(project.name),
      target_budget: targetBudget,
      description: normalizeText(project.description),
      status: normalizeText(project.status) || 'Aktif',
      start_date: project.start_date ? new Date(project.start_date) : new Date(),
      end_date: project.end_date ? new Date(project.end_date) : '',
      created_at: new Date(),
      created_by: project.created_by || 'System'
    };

    appendObjectRow('development_projects', record);
    return { ok: true, message: 'Proyek pembangunan berhasil dibuat', data: record };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function updateDevelopmentProject(projectId, project) {
  try {
    const existing = getSheetData('development_projects').find(item => item.project_id === projectId);
    if (!existing) throw new Error('Proyek pembangunan tidak ditemukan');

    const name = normalizeText(project.name) || existing.name;
    const targetBudget = normalizeNumber(project.target_budget, normalizeNumber(existing.target_budget));
    if (!name) throw new Error('Nama proyek wajib diisi');
    if (targetBudget <= 0) throw new Error('Target anggaran harus lebih dari nol');

    updateSheetRowByKey('development_projects', 'project_id', projectId, {
      name,
      target_budget: targetBudget,
      description: normalizeText(project.description),
      status: normalizeText(project.status) || existing.status || 'Aktif',
      start_date: project.start_date ? new Date(project.start_date) : existing.start_date,
      end_date: project.end_date ? new Date(project.end_date) : ''
    });

    return { ok: true, message: 'Proyek pembangunan berhasil diperbarui' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function deleteDevelopmentProject(projectId) {
  try {
    const hasDonation = getSheetData('donations').some(donation => donation.project_id === projectId);
    const hasExpense = getSheetData('expenses').some(expense => expense.project_id === projectId);
    if (hasDonation || hasExpense) {
      throw new Error('Proyek yang sudah dipakai donasi/pengeluaran tidak bisa dihapus');
    }

    const deleted = deleteSheetRowByKey('development_projects', 'project_id', projectId);
    if (!deleted) throw new Error('Proyek pembangunan tidak ditemukan');
    return { ok: true, message: 'Proyek pembangunan berhasil dihapus' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function getDevelopmentProjects(skipSeed) {
  if (!skipSeed) seedOperationalDefaults();

  const donations = getSheetData('donations').filter(donation => donation.status === 'Masuk');
  const expenses = getSheetData('expenses');
  const collectedByProject = {};
  const usedByProject = {};

  donations.forEach(donation => {
    const projectId = normalizeText(donation.project_id);
    if (!projectId) return;
    collectedByProject[projectId] = (collectedByProject[projectId] || 0) + normalizeNumber(donation.amount);
  });

  expenses.forEach(expense => {
    const projectId = normalizeText(expense.project_id);
    if (!projectId) return;
    usedByProject[projectId] = (usedByProject[projectId] || 0) + normalizeNumber(expense.amount);
  });

  const data = getSheetData('development_projects').map(project => {
    const collected = collectedByProject[project.project_id] || 0;
    const used = usedByProject[project.project_id] || 0;
    const target = normalizeNumber(project.target_budget);
    return {
      ...project,
      collected,
      used,
      remaining_budget: target - used,
      remaining_to_target: Math.max(target - collected, 0),
      progress_percent: target ? Math.min(Math.round((collected / target) * 100), 100) : 0
    };
  });

  return { ok: true, data };
}
