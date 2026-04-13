const level = require('level');
const db = level('./chaindata');

module.exports = {
  async put(key, value) {
    await db.put(key, JSON.stringify(value));
  },
  async get(key) {
    try {
      const data = await db.get(key);
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
};