// Test Razorpay Integration
async function testRazorpayIntegration() {
    try {
        console.log('Testing Razorpay integration...');
        
        const response = await fetch('http://localhost:3500/patient/test-razorpay', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Razorpay test successful:', data);
            return data;
        } else {
            console.error('❌ Razorpay test failed:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Network error testing Razorpay:', error);
        return null;
    }
}

// Run test if this script is executed directly
if (typeof window === 'undefined') {
    testRazorpayIntegration();
}

module.exports = { testRazorpayIntegration };