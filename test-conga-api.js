// Simple test script for Conga Sign API
import fetch from 'node-fetch';

// Configuration - replace with your actual values
const CONFIG = {
  apiToken: 'YOUR_JWT_TOKEN', // Replace with your actual token
  email: 'test@example.com', // Replace with the email to search for
  baseUrl: 'https://coreapps-rlspreview.congacloud.com'
};

async function testListPackages() {
  try {
    // URL encode the email address
    const encodedEmail = encodeURIComponent(CONFIG.email);
    
    // Construct the full URL with the required parameters
    const url = `${CONFIG.baseUrl}/api/sign/v1/cs-packages?ownerEmail=${encodedEmail}&from=1&to=100`;
    
    console.log(`Making request to: ${url}`);
    
    // Send the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Parse the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    // Log the response
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    console.log('Found packages:', data.packages ? data.packages.length : 'No packages array in response');
    
    if (data.packages && data.packages.length > 0) {
      // Show summary of each package
      data.packages.forEach((pkg, index) => {
        console.log(`Package ${index + 1}: id=${pkg.id}, name=${pkg.name}, status=${pkg.status}`);
      });
    } else {
      console.log('No packages found or packages array is empty');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testListPackages();