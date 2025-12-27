// test/blockchainTest.js
const mongoose = require('mongoose');
const { 
  createBlock, 
  validateChain, 
  generateSecureTransactionId, 
  getBlockchainStats,
  createGenesisBlock 
} = require('../services/blockchainService');

// Simple test function
async function testBlockchain() {
  try {
    console.log('🔗 Starting Blockchain Test...\n');
    
    // Test 1: Generate secure transaction ID
    console.log('1. Testing secure transaction ID generation:');
    const secureId1 = generateSecureTransactionId('app_123', 'pay_456');
    const secureId2 = generateSecureTransactionId('app_123', 'pay_456');
    console.log(`   Secure ID 1: ${secureId1}`);
    console.log(`   Secure ID 2: ${secureId2}`);
    console.log(`   Are they different? ${secureId1 !== secureId2 ? '✅ Yes' : '❌ No'}\n`);
    
    // Test 2: Create sample blocks
    console.log('2. Testing block creation:');
    
    const testTransaction1 = {
      applicationId: 'app_12345',
      transactionId: 'txn_67890',
      userId: 'user_abcdef',
      amount: 500000, // 5000 INR in paise
      currency: 'INR',
      status: 'paid',
      razorpayPaymentId: 'pay_test1',
      razorpayOrderId: 'order_test1',
    };
    
    const block1 = await createBlock(testTransaction1);
    console.log(`   Block 1 created: Index ${block1.index}, Hash: ${block1.hash.substring(0, 16)}...\n`);
    
    const testTransaction2 = {
      applicationId: 'app_54321',
      transactionId: 'txn_09876',
      userId: 'user_fedcba',
      amount: 300000, // 3000 INR in paise
      currency: 'INR',
      status: 'paid',
      razorpayPaymentId: 'pay_test2',
      razorpayOrderId: 'order_test2',
    };
    
    const block2 = await createBlock(testTransaction2);
    console.log(`   Block 2 created: Index ${block2.index}, Hash: ${block2.hash.substring(0, 16)}...\n`);
    
    // Test 3: Validate chain
    console.log('3. Testing chain validation:');
    const isValid = await validateChain();
    console.log(`   Is blockchain valid? ${isValid ? '✅ Yes' : '❌ No'}\n`);
    
    // Test 4: Get blockchain stats
    console.log('4. Getting blockchain statistics:');
    const stats = await getBlockchainStats();
    if (stats) {
      console.log(`   Total blocks: ${stats.totalBlocks}`);
      console.log(`   Latest block index: ${stats.latestBlockIndex}`);
      console.log(`   Latest block hash: ${stats.latestBlockHash ? stats.latestBlockHash.substring(0, 16) + '...' : 'None'}`);
      console.log(`   Chain is valid: ${stats.isValid ? '✅ Yes' : '❌ No'}`);
      console.log(`   Last validated: ${stats.lastValidated}\n`);
    }
    
    console.log('✅ Blockchain test completed successfully!');
    
  } catch (error) {
    console.error('❌ Blockchain test failed:', error);
  }
}

// Export for use in other tests
module.exports = { testBlockchain };

// Run test if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB (use your actual connection string)
  const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/scholarshipTest';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB for testing');
      return testBlockchain();
    })
    .then(() => {
      console.log('Test completed, disconnecting...');
      return mongoose.disconnect();
    })
    .catch((error) => {
      console.error('Test error:', error);
      mongoose.disconnect();
    });
}