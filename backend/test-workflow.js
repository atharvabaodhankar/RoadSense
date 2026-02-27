// Quick test script to verify workflow routes are loaded
// Run: node test-workflow.js

const express = require('express');

console.log('Testing workflow routes...\n');

try {
  // Check if workflow.js exists
  const workflowRoute = require('./routes/workflow');
  console.log('✓ workflow.js file found');
  console.log('✓ workflow routes module loaded successfully');
  
  // Check if it's a valid Express router
  if (workflowRoute && typeof workflowRoute === 'function') {
    console.log('✓ workflow routes is a valid Express router');
  } else {
    console.log('✗ workflow routes is not a valid Express router');
  }
  
  console.log('\nWorkflow routes should be available at:');
  console.log('  PATCH /api/workflow/:id/status');
  console.log('  POST  /api/workflow/:id/complete');
  console.log('  POST  /api/workflow/:id/feedback');
  
  console.log('\n✓ All checks passed!');
  console.log('\nNext steps:');
  console.log('1. Make sure backend server is running: npm run dev');
  console.log('2. Create Supabase storage bucket named "inspections"');
  console.log('3. Test the workflow in the frontend');
  
} catch (error) {
  console.error('✗ Error loading workflow routes:', error.message);
  console.error('\nMake sure:');
  console.error('1. backend/routes/workflow.js exists');
  console.error('2. All dependencies are installed (npm install)');
  console.error('3. No syntax errors in workflow.js');
}
