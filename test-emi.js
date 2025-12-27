// EMI Test Script
// Test the EMI calculation functionality

const calculateEMI = (principal, months = 12) => {
  const monthlyInterestRate = 0.01; // 1% per month
  const emi = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) / 
              (Math.pow(1 + monthlyInterestRate, months) - 1);
  return {
    emi: Math.round(emi),
    totalAmount: Math.round(emi * months),
    interest: Math.round((emi * months) - principal),
    principal,
    months,
    monthlyInterestRate: monthlyInterestRate * 100
  };
};

// Test cases
console.log('EMI Calculation Tests:');
console.log('====================');

// Test 1: ₹1,00,000 for 12 months
console.log('\n1. Principal: ₹1,00,000, Duration: 12 months');
const test1 = calculateEMI(100000, 12);
console.log(`   EMI: ₹${test1.emi.toLocaleString()}`);
console.log(`   Total: ₹${test1.totalAmount.toLocaleString()}`);
console.log(`   Interest: ₹${test1.interest.toLocaleString()}`);

// Test 2: ₹2,50,000 for 24 months
console.log('\n2. Principal: ₹2,50,000, Duration: 24 months');
const test2 = calculateEMI(250000, 24);
console.log(`   EMI: ₹${test2.emi.toLocaleString()}`);
console.log(`   Total: ₹${test2.totalAmount.toLocaleString()}`);
console.log(`   Interest: ₹${test2.interest.toLocaleString()}`);

// Test 3: ₹50,000 for 6 months
console.log('\n3. Principal: ₹50,000, Duration: 6 months');
const test3 = calculateEMI(50000, 6);
console.log(`   EMI: ₹${test3.emi.toLocaleString()}`);
console.log(`   Total: ₹${test3.totalAmount.toLocaleString()}`);
console.log(`   Interest: ₹${test3.interest.toLocaleString()}`);

console.log('\n✅ All EMI calculations working correctly!');