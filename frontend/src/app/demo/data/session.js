// Public fictional session only; never an API authentication or authorization token.
export function createSession(fixtures, storage) {
  const key = 'vacate.demo.account.v2';
  return {
    currentUser() {
      try {
        const person = fixtures.person(storage.getItem(key));
        if (!person) storage.removeItem(key);
        return person || null;
      } catch { return null; }
    },
    login(username, password) {
      const alias = { user: 'maya', admin: 'nora' }[username];
      const person = alias ? fixtures.person(alias) : fixtures.people.find(person => person.username === username);
      if (!person || password !== username) return false;
      storage.removeItem('vacate.demo.account.v1');
      storage.setItem(key, person.id);
      return true;
    },
    logout() {
      try {
        storage.removeItem(key);
        storage.removeItem('vacate.demo.account.v1');
      } catch { /* Already signed out. */ }
    },
  };
}
