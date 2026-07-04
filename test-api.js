#!/usr/bin/env node

/**
 * Simple test script to test the coordinate extraction API
 * Usage: node test-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/extract';

// Test URLs
const testUrls = [
  {
    name: '✅ Test 1: Direct Coordinates (@lat,lng)',
    url: 'https://www.google.com/maps/@28.6139,77.2090,15z',
    expectedToWork: true,
  },
  {
    name: '✅ Test 2: Place with Coordinates',
    url: 'https://www.google.com/maps/place/Taj+Mahal/@27.1751,78.0421,17z',
    expectedToWork: true,
  },
  {
    name: '✅ Test 3: Query Parameter (q=lat,lng)',
    url: 'https://www.google.com/maps?q=19.0760,72.8777',
    expectedToWork: true,
  },
  {
    name: '✅ Test 4: LL Parameter (ll=lat,lng)',
    url: 'https://www.google.com/maps?ll=12.9716,77.5946',
    expectedToWork: true,
  },
  {
    name: '⚠️  Test 5: Short URL (may work)',
    url: 'https://maps.app.goo.gl/xyz123',
    expectedToWork: false,
  },
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testUrl(testCase) {
  console.log(`\n${colors.cyan}${testCase.name}${colors.reset}`);
  console.log(`${colors.blue}URL: ${testCase.url}${colors.reset}`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(API_URL, {
      url: testCase.url,
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.success) {
      console.log(`${colors.green}✓ SUCCESS${colors.reset} (${duration}ms)`);
      console.log(`  Latitude:  ${response.data.data.latitude}`);
      console.log(`  Longitude: ${response.data.data.longitude}`);
      console.log(`  Source:    ${response.data.data.source}`);
      return { success: true, duration };
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      console.log(`  Error: ${response.data.error}`);
      return { success: false, duration };
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset}`);
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Message: ${error.response.data.message || error.response.data.error}`);
    } else {
      console.log(`  ${error.message}`);
    }
    return { success: false, duration: 0 };
  }
}

async function runTests() {
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  Google Maps Coordinate Extractor - API Test Suite${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  
  // Check if server is running
  console.log(`\n${colors.yellow}Checking server...${colors.reset}`);
  try {
    await axios.get('http://localhost:3000/api/health');
    console.log(`${colors.green}✓ Server is running${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Server is not running!${colors.reset}`);
    console.log(`${colors.yellow}Please start the server first: npm start${colors.reset}`);
    process.exit(1);
  }
  
  // Run tests
  const results = [];
  
  for (const testCase of testUrls) {
    const result = await testUrl(testCase);
    results.push({ ...testCase, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  Test Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = totalDuration / results.filter(r => r.success).length || 0;
  
  console.log(`\nTotal Tests:  ${results.length}`);
  console.log(`${colors.green}Passed:       ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${failed}${colors.reset}`);
  console.log(`Avg Duration: ${avgDuration.toFixed(0)}ms`);
  
  if (passed === results.filter(r => r.expectedToWork).length) {
    console.log(`\n${colors.green}${colors.bright}🎉 All expected tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
