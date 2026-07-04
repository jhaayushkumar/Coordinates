#!/usr/bin/env node

/**
 * Quick single URL test script
 * Usage: node test-single.js "https://www.google.com/maps/@28.6139,77.2090,15z"
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/extract';

// Get URL from command line argument
const testUrl = process.argv[2];

if (!testUrl) {
  console.log('\n❌ Please provide a URL to test');
  console.log('\nUsage:');
  console.log('  node test-single.js "YOUR_GOOGLE_MAPS_URL"');
  console.log('\nExamples:');
  console.log('  node test-single.js "https://www.google.com/maps/@28.6139,77.2090,15z"');
  console.log('  node test-single.js "https://www.google.com/maps?q=19.0760,72.8777"');
  process.exit(1);
}

async function testCoordinateExtraction() {
  console.log('\n🔍 Testing Coordinate Extraction');
  console.log('================================\n');
  console.log('URL:', testUrl);
  console.log('\n⏳ Processing...\n');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(API_URL, {
      url: testUrl,
    }, {
      timeout: 15000, // 15 second timeout
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.success) {
      console.log('✅ SUCCESS!\n');
      console.log('Results:');
      console.log('--------');
      console.log(`📍 Latitude:  ${response.data.data.latitude}`);
      console.log(`📍 Longitude: ${response.data.data.longitude}`);
      console.log(`🔧 Source:    ${response.data.data.source}`);
      console.log(`⏱️  Duration:  ${duration}ms`);
      
      // Show Google Maps link with extracted coordinates
      const lat = response.data.data.latitude;
      const lng = response.data.data.longitude;
      console.log(`\n🗺️  View on Google Maps:`);
      console.log(`   https://www.google.com/maps/@${lat},${lng},15z`);
      
      console.log('\n✨ Coordinate extraction successful!\n');
    } else {
      console.log('❌ FAILED\n');
      console.log('Error:', response.data.error);
      console.log('Message:', response.data.message);
      console.log('');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log('❌ ERROR\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server is not running!');
      console.log('   Please start the server first: npm start');
    } else if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${error.response.data.error || 'Unknown error'}`);
      console.log(`Message: ${error.response.data.message || 'No message provided'}`);
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏱️  Request timeout - the URL took too long to process');
    } else {
      console.log('Error:', error.message);
    }
    
    console.log(`\nDuration: ${duration}ms\n`);
    process.exit(1);
  }
}

testCoordinateExtraction();
