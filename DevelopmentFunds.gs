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

function getDevelopmentProjects() {
  seedOperationalDefaults();

  const donations = getSheetData('donations').filter(donation => donation.status === 'Masuk');
  const expenses = getSheetData('expenses');
  const data = getSheetData('development_projects').map(project => {
    const collected = donations
      .filter(donation => donation.project_id === project.project_id)
      .reduce((sum, donation) => sum + normalizeNumber(donation.amount), 0);
    const used = expenses
      .filter(expense => expense.project_id === project.project_id)
      .reduce((sum, expense) => sum + normalizeNumber(expense.amount), 0);
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
