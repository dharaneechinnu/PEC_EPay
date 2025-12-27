// Blockchain feature removed — stubbed no-op service
module.exports = {
  createBlock: async function () {
    throw new Error('Blockchain feature removed from this codebase');
  },
  generateSecureTransactionId: function () {
    return null;
  },
  validateChain: async function () { return true; },
  getBlockchainStats: async function () { return null; },
  createGenesisBlock: async function () { return null; },
  generateSecureHash: function () { return null; },
  generateHash: function () { return null; },
  getLatestBlock: async function () { return null; },
};