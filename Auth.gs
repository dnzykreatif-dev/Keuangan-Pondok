function login(username, password) {
  try {
    const users = getSheetData('users');
    const hashedPassword = hashPassword(password);
    const normalizedUsername = normalizeText(username);

    const user = users.find(row => row.username === normalizedUsername && row.password_hash === hashedPassword);
    if (!user) {
      return { ok: false, message: 'Invalid credentials' };
    }

    return { ok: true, user: { username: user.username, role: user.role } };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}
