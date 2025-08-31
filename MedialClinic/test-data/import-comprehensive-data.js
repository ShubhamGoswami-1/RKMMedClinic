/**
 * Script to import comprehensive test data for leave management
 * 
 * This script imports more extensive test data with multiple entity types
 * (users, staff, doctors) with various leave request scenarios.
 * 
 * Run this script with: node import-comprehensive-data.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection string - update if needed
const uri = 'mongodb://localhost:27017/mediclinic';

async function importComprehensiveData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Read and evaluate the comprehensive data file
    const dataFilePath = path.join(__dirname, 'comprehensive-test-data.js');
    let fileContent = fs.readFileSync(dataFilePath, 'utf8');
    
    // Replace db.collection.insertMany with actual MongoDB operations
    const collections = [
      'staffs', 'doctors', 'departments', 'leavetypes', 
      'users', 'leavebalances', 'leaverequests'
    ];
    
    console.log('Beginning data import...');
    
    for (const collection of collections) {
      console.log(`Importing ${collection}...`);
      
      // Extract the insertMany block for this collection
      const regex = new RegExp(`db\\.${collection}\\.insertMany\\(\\[([\\s\\S]*?)\\]\\);`, 'g');
      const matches = regex.exec(fileContent);
      
      if (matches && matches[1]) {
        // Process the data to make it valid JSON
        let dataString = '[' + matches[1] + ']';
        
        // Replace ObjectId, ISODate with appropriate values
        dataString = dataString.replace(/ObjectId\("([^"]+)"\)/g, '{"$oid":"$1"}');
        dataString = dataString.replace(/ISODate\("([^"]+)"\)/g, '{"$date":"$1"}');
        
        // Handle trailing commas which are invalid in JSON
        dataString = dataString.replace(/,(\s*[}\]])/g, '$1');
        
        try {
          // Parse the data
          const data = JSON.parse(dataString);
          
          // Transform back to MongoDB format
          const documents = data.map(doc => {
            const transformed = { ...doc };
            
            // Transform ObjectId
            Object.keys(transformed).forEach(key => {
              if (transformed[key] && transformed[key].$oid) {
                transformed[key] = new ObjectId(transformed[key].$oid);
              } else if (transformed[key] && transformed[key].$date) {
                transformed[key] = new Date(transformed[key].$date);
              } else if (Array.isArray(transformed[key])) {
                transformed[key] = transformed[key].map(item => {
                  if (item && item.$oid) return new ObjectId(item.$oid);
                  if (item && item.$date) return new Date(item.$date);
                  return item;
                });
              }
            });
            
            return transformed;
          });
          
          // Delete existing data with these IDs
          const ids = documents.map(doc => doc._id);
          await db.collection(collection).deleteMany({ _id: { $in: ids } });
          
          // Insert the data
          if (documents.length > 0) {
            const result = await db.collection(collection).insertMany(documents);
            console.log(`Successfully inserted ${result.insertedCount} documents into ${collection}`);
          }
        } catch (error) {
          console.error(`Error processing ${collection}:`, error.message);
        }
      } else {
        console.log(`No data found for ${collection}`);
      }
    }
    
    console.log('Comprehensive test data import completed!');
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import function
importComprehensiveData().catch(console.error);
