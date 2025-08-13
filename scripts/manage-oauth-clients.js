#!/usr/bin/env node

/**
 * Script to manage OAuth clients registered in Clerk
 * This helps clean up dynamically registered clients from MCP/Claude
 */

const CLERK_API_URL = 'https://api.clerk.com/v1';

// Get Clerk secret key from environment or command line
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || process.argv[2];

if (!CLERK_SECRET_KEY) {
  console.error('Usage: node manage-oauth-clients.js <CLERK_SECRET_KEY>');
  console.error('Or set CLERK_SECRET_KEY environment variable');
  process.exit(1);
}

async function listOAuthApplications() {
  try {
    let allApplications = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100; // Clerk's max limit per request

    while (hasMore) {
      const response = await fetch(`${CLERK_API_URL}/oauth_applications?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list OAuth applications: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const applications = data.data || [];
      allApplications = allApplications.concat(applications);
      
      // Check if there are more pages
      hasMore = applications.length === limit;
      offset += limit;
      
      if (hasMore) {
        console.log(`Fetched ${allApplications.length} applications so far...`);
      }
    }

    return allApplications;
  } catch (error) {
    console.error('Error listing OAuth applications:', error);
    throw error;
  }
}

async function deleteOAuthApplication(id) {
  try {
    const response = await fetch(`${CLERK_API_URL}/oauth_applications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete OAuth application ${id}: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting OAuth application ${id}:`, error);
    return false;
  }
}

async function main() {
  console.log('Fetching OAuth applications from Clerk...\n');
  
  try {
    const applications = await listOAuthApplications();
    
    if (applications.length === 0) {
      console.log('No OAuth applications found.');
      return;
    }

    console.log(`Found ${applications.length} OAuth application(s):\n`);
    
    // For large numbers, just show summary
    if (applications.length > 20) {
      console.log('Summary by application name:');
      const nameCounts = {};
      applications.forEach(app => {
        const name = app.name || 'Unnamed';
        nameCounts[name] = (nameCounts[name] || 0) + 1;
      });
      
      Object.entries(nameCounts).forEach(([name, count]) => {
        console.log(`  - ${name}: ${count} application(s)`);
      });
      console.log('');
      
      // Show first few and last few
      console.log('First 3 applications:');
      applications.slice(0, 3).forEach((app, index) => {
        console.log(`  ${index + 1}. ${app.client_id} - ${app.name || 'N/A'} (${new Date(app.created_at).toLocaleDateString()})`);
      });
      
      console.log('\nLast 3 applications:');
      applications.slice(-3).forEach((app, index) => {
        console.log(`  ${applications.length - 2 + index}. ${app.client_id} - ${app.name || 'N/A'} (${new Date(app.created_at).toLocaleDateString()})`);
      });
      console.log('');
    } else {
      applications.forEach((app, index) => {
        console.log(`${index + 1}. Client ID: ${app.client_id}`);
        console.log(`   Name: ${app.name || 'N/A'}`);
        console.log(`   Created: ${new Date(app.created_at).toLocaleString()}`);
        console.log(`   Callback URLs: ${app.callback_url || 'N/A'}`);
        console.log(`   Public: ${app.public}`);
        console.log('');
      });
    }

    // Ask for confirmation before deleting
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Do you want to delete ALL these OAuth applications? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('\nDeleting all OAuth applications...\n');
        
        for (const app of applications) {
          console.log(`Deleting ${app.client_id}...`);
          const success = await deleteOAuthApplication(app.id);
          if (success) {
            console.log(`✓ Deleted ${app.client_id}`);
          } else {
            console.log(`✗ Failed to delete ${app.client_id}`);
          }
        }
        
        console.log('\nDone!');
      } else {
        console.log('Cancelled. No applications were deleted.');
      }
      
      readline.close();
    });

  } catch (error) {
    console.error('Failed to manage OAuth applications:', error);
    process.exit(1);
  }
}

main();