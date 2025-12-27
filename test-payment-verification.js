// Test Payment Verification Flow
async function testPaymentVerification() {
    console.log('=== Testing Payment Verification Flow ===\n');
    
    // Mock payment response data (similar to what Razorpay returns)
    const mockPaymentResponse = {
        razorpay_payment_id: 'pay_test123456',
        razorpay_order_id: 'order_test789',
        razorpay_signature: 'mock_signature_12345'
    };
    
    const mockRequestData = {
        requestId: '507f1f77bcf86cd799439011', // Test MongoDB ObjectId
        paymentId: mockPaymentResponse.razorpay_payment_id,
        orderId: mockPaymentResponse.razorpay_order_id,
        signature: mockPaymentResponse.razorpay_signature,
        amount: 1000
    };
    
    console.log('Mock payment data:', mockRequestData);
    
    try {
        const response = await fetch('http://localhost:3500/patient/verify-emi-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test_token'
            },
            body: JSON.stringify(mockRequestData)
        });
        
        const responseText = await response.text();
        console.log('\nResponse status:', response.status);
        console.log('Raw response:', responseText);
        
        try {
            const data = JSON.parse(responseText);
            console.log('Parsed response:', data);
            
            if (response.ok) {
                console.log('✅ Payment verification test passed');
                return true;
            } else {
                console.log('❌ Payment verification failed');
                console.log('Error message:', data.message);
                console.log('Missing field:', data.field);
                console.log('Received value:', data.received);
                return false;
            }
        } catch (parseError) {
            console.log('❌ Failed to parse response as JSON');
            console.log('Parse error:', parseError.message);
            return false;
        }
        
    } catch (networkError) {
        console.log('❌ Network error during verification test');
        console.log('Error:', networkError.message);
        return false;
    }
}

// Test with missing fields to see error handling
async function testMissingFields() {
    console.log('\n=== Testing Missing Fields Handling ===\n');
    
    const testCases = [
        { name: 'Missing requestId', data: { paymentId: 'pay_123', orderId: 'order_123', signature: 'sig_123', amount: 1000 } },
        { name: 'Missing paymentId', data: { requestId: '507f1f77bcf86cd799439011', orderId: 'order_123', signature: 'sig_123', amount: 1000 } },
        { name: 'Missing orderId', data: { requestId: '507f1f77bcf86cd799439011', paymentId: 'pay_123', signature: 'sig_123', amount: 1000 } },
        { name: 'Missing signature', data: { requestId: '507f1f77bcf86cd799439011', paymentId: 'pay_123', orderId: 'order_123', amount: 1000 } }
    ];
    
    for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);
        
        try {
            const response = await fetch('http://localhost:3500/patient/verify-emi-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test_token'
                },
                body: JSON.stringify(testCase.data)
            });
            
            const data = await response.json();
            
            if (response.status === 400 && data.field) {
                console.log(`✅ Correctly identified missing field: ${data.field}`);
            } else {
                console.log(`❌ Unexpected response: ${data.message}`);
            }
        } catch (error) {
            console.log(`❌ Error testing ${testCase.name}: ${error.message}`);
        }
        
        console.log('');
    }
}

// Run all tests
async function runVerificationTests() {
    await testPaymentVerification();
    await testMissingFields();
    console.log('=== All Tests Complete ===');
}

module.exports = { testPaymentVerification, testMissingFields, runVerificationTests };

// Run if called directly
if (require.main === module) {
    runVerificationTests();
}