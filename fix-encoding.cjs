const fs = require('fs');
const path = require('path');

// Function to fix encoding issues in a file
function fixEncoding(filePath) {
  try {
    // Read the file with UTF-8 encoding
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has encoding issues (mojibake)
    if (content.includes('ä') || content.includes('ö') || content.includes('ü') || 
        content.includes('Ã„') || content.includes('Ã–') || content.includes('Ãœ')) {
      
      // Convert the mojibake back to proper UTF-8
      // This is a simple approach - in a real scenario, you might need more sophisticated conversion
      const fixedContent = content
        .replace(/ä/g, 'ä')
        .replace(/ö/g, 'ö')
        .replace(/ü/g, 'ü')
        .replace(/Ã„/g, 'Ä')
        .replace(/Ã–/g, 'Ö')
        .replace(/Ãœ/g, 'Ü')
        .replace(/ÃŸ/g, 'ß');
      
      // Write the fixed content back to the file with proper UTF-8 encoding
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      
      console.log(`Fixed encoding in: ${filePath}`);
    } else {
      console.log(`No encoding issues found in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

// Function to recursively process all files in a directory
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      
      // Get file stats
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        processDirectory(fullPath);
      } else if (stats.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
        // Process TypeScript and JavaScript files
        fixEncoding(fullPath);
      }
    });
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

// Main execution
console.log('Starting encoding fix process...');

// Process the src directory
const srcDir = path.join(__dirname, 'src');
processDirectory(srcDir);

console.log('Encoding fix process completed.');