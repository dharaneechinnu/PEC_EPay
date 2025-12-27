// Test EMI Payment Order Creation
async function testEMIOrderCreation() {
    try {
        console.log('Testing EMI order creation...');
        
        const testData = {
            requestId: '507f1f77bcf86cd799439011', // Test MongoDB ObjectId
            amount: 1000 // ₹10 for testing
        };

        const response = await fetch('http://localhost:3500/patient/create-emi-payment-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test_token'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (response.ok && data.orderId) {
            console.log('✅ EMI order creation test successful');
            console.log('Order ID:', data.orderId);
            console.log('Amount:', data.amount);
            console.log('Currency:', data.currency);
            return true;
        } else {
            console.log('❌ EMI order creation test failed');
            console.log('Error:', data.message || data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Network error testing EMI order:', error.message);
        return false;
    }
}

// Test basic server health
async function testServerHealth() {
    try {
        const response = await fetch('http://localhost:3500/patient/test-razorpay');
        const data = await response.json();
        
        console.log('Server health check:', response.ok ? '✅' : '❌');
        console.log('Razorpay status:', data.message);
        
        return response.ok;
    } catch (error) {
        console.error('❌ Server health check failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('=== EMI Payment System Tests ===\n');
    
    const healthOk = await testServerHealth();
    console.log();
    
    if (healthOk) {
        await testEMIOrderCreation();
    } else {
        console.log('Skipping order creation test due to server issues');
    }
    
    console.log('\n=== Tests Complete ===');
}

// Export for use in other files
module.exports = { testEMIOrderCreation, testServerHealth, runTests };

// Run if called directly
if (require.main === module) {
    runTests();
}