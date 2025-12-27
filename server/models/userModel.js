class UserModel {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  create(data) {
    const user = { id: this.nextId++, ...data };
    this.users.push(user);
    return user;
  }

  findAll() {
    return this.users;
  }

  findById(id) {
    return this.users.find(u => u.id === Number(id)) || null;
  }

  update(id, data) {
    const user = this.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  remove(id) {
    const idx = this.users.findIndex(u => u.id === Number(id));
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    return true;
  }
}

module.exports = new UserModel();
