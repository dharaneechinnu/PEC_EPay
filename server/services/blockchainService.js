// services/blockchainService.js
const crypto = require('crypto');
const Block = require('../models/block');

// Get secret key from environment variables
const BLOCKCHAIN_SECRET = process.env.BLOCKCHAIN_SECRET || 'default-secret-key-change-in-production';

/**
 * Generate HMAC hash for secure ID hashing
 * @param {string} data - The data to hash
 * @returns {string} - HMAC hash
 */
function generateSecureHash(data) {
  return crypto.createHmac('sha256', BLOCKCHAIN_SECRET).update(data.toString()).digest('hex');
}

/**
 * Generate SHA256 hash
 * @param {string} data - The data to hash
 * @returns {string} - SHA256 hash
 */
function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Calculate block hash
 * @param {Object} block - Block data
 * @returns {string} - Block hash
 */
function calculateBlockHash(block) {
  const blockString = `${block.index}${block.timestamp}${block.prevHash}${block.dataHash}${block.nonce}`;
  return generateHash(blockString);
}

/**
 * Calculate data hash for block content
 * @param {Object} data - Transaction data
 * @returns {string} - Data hash
 */
function calculateDataHash(data) {
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  return generateHash(dataString);
}

/**
 * Get the latest block in the chain
 * @returns {Promise<Object|null>} - Latest block or null if chain is empty
 */
async function getLatestBlock() {
  try {
    const latestBlock = await Block.findOne().sort({ index: -1 });
    return latestBlock;
  } catch (error) {
    console.error('Error fetching latest block:', error);
    return null;
  }
}

/**
 * Create genesis block (first block in the chain)
 * @returns {Promise<Object>} - Genesis block
 */
async function createGenesisBlock() {
  const genesisData = {
    hashedApplicationId: generateSecureHash('genesis'),
    hashedTransactionId: generateSecureHash('genesis'),
    hashedUserId: generateSecureHash('genesis'),
    amount: 0,
    currency: 'INR',
    status: 'genesis',
    razorpayPaymentId: 'genesis',
    razorpayOrderId: 'genesis',
  };

  const dataHash = calculateDataHash(genesisData);
  const block = {
    index: 0,
    timestamp: new Date(),
    prevHash: '0',
    dataHash,
    nonce: 0,
    data: genesisData,
  };

  block.hash = calculateBlockHash(block);

  const genesisBlock = new Block(block);
  await genesisBlock.save();
  
  console.log('Genesis block created:', block.hash);
  return genesisBlock;
}

/**
 * Create a new block for a transaction
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>} - Created block
 */
async function createBlock(transactionData) {
  try {
    // Get latest block
    let latestBlock = await getLatestBlock();
    
    // Create genesis block if chain is empty
    if (!latestBlock) {
      latestBlock = await createGenesisBlock();
    }

    // Hash sensitive data
    const hashedData = {
      hashedApplicationId: generateSecureHash(transactionData.applicationId),
      hashedTransactionId: generateSecureHash(transactionData.transactionId),
      hashedUserId: generateSecureHash(transactionData.userId || 'anonymous'),
      amount: transactionData.amount,
      currency: transactionData.currency || 'INR',
      status: transactionData.status,
      razorpayPaymentId: transactionData.razorpayPaymentId,
      razorpayOrderId: transactionData.razorpayOrderId,
    };

    const dataHash = calculateDataHash(hashedData);
    const newBlock = {
      index: latestBlock.index + 1,
      timestamp: new Date(),
      prevHash: latestBlock.hash,
      dataHash,
      nonce: 0,
      data: hashedData,
    };

    // Calculate block hash
    newBlock.hash = calculateBlockHash(newBlock);

    // Save to database
    const block = new Block(newBlock);
    await block.save();

    console.log(`Block ${newBlock.index} created with hash: ${newBlock.hash}`);
    return block;
  } catch (error) {
    console.error('Error creating block:', error);
    throw error;
  }
}

/**
 * Validate the entire blockchain
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
async function validateChain() {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    
    if (blocks.length === 0) {
      return true; // Empty chain is valid
    }

    // Check genesis block
    if (blocks[0].index !== 0 || blocks[0].prevHash !== '0') {
      console.error('Invalid genesis block');
      return false;
    }

    // Validate each block
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Check if current block's prevHash matches previous block's hash
      if (currentBlock.prevHash !== previousBlock.hash) {
        console.error(`Invalid prevHash at block ${currentBlock.index}`);
        return false;
      }

      // Check if current block's hash is valid
      const calculatedHash = calculateBlockHash(currentBlock);
      if (currentBlock.hash !== calculatedHash) {
        console.error(`Invalid hash at block ${currentBlock.index}`);
        return false;
      }

      // Check if data hash is valid
      const calculatedDataHash = calculateDataHash(currentBlock.data);
      if (currentBlock.dataHash !== calculatedDataHash) {
        console.error(`Invalid data hash at block ${currentBlock.index}`);
        return false;
      }

      // Check sequential index
      if (currentBlock.index !== previousBlock.index + 1) {
        console.error(`Invalid index sequence at block ${currentBlock.index}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating chain:', error);
    return false;
  }
}

/**
 * Generate a secure transaction ID
 * @param {string} applicationId - Application ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @returns {string} - Secure transaction ID
 */
function generateSecureTransactionId(applicationId, razorpayPaymentId) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const dataString = `${applicationId}_${razorpayPaymentId}_${timestamp}_${randomBytes}`;
  return generateSecureHash(dataString);
}

/**
 * Get blockchain statistics
 * @returns {Promise<Object>} - Blockchain stats
 */
async function getBlockchainStats() {
  try {
    const totalBlocks = await Block.countDocuments();
    const latestBlock = await getLatestBlock();
    const isValid = await validateChain();

    return {
      totalBlocks,
      latestBlockHash: latestBlock ? latestBlock.hash : null,
      latestBlockIndex: latestBlock ? latestBlock.index : -1,
      isValid,
      lastValidated: new Date(),
    };
  } catch (error) {
    console.error('Error getting blockchain stats:', error);
    return null;
  }
}

module.exports = {
  generateSecureHash,
  generateHash,
  createBlock,
  validateChain,
  generateSecureTransactionId,
  getLatestBlock,
  getBlockchainStats,
  createGenesisBlock,
};