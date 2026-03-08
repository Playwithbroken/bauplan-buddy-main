const fs = require('fs');
const path = require('path');

// Function to fix encoding issues in a file
function fixEncoding(filePath) {
  try {
    // Read the file with UTF-8 encoding
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has encoding issues (mojibake)
    const encodingIssues = [
      { wrong: 'ä', correct: 'ä' },
      { wrong: 'ö', correct: 'ö' },
      { wrong: 'ü', correct: 'ü' },
      { wrong: 'Ã„', correct: 'Ä' },
      { wrong: 'Ã–', correct: 'Ö' },
      { wrong: 'Ãœ', correct: 'Ü' },
      { wrong: 'ÃŸ', correct: 'ß' }
    ];
    
    let hasIssues = false;
    for (const issue of encodingIssues) {
      if (content.includes(issue.wrong)) {
        hasIssues = true;
        content = content.split(issue.wrong).join(issue.correct);
      }
    }
    
    if (hasIssues) {
      // Write the fixed content back to the file with proper UTF-8 encoding
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed encoding in: ${filePath}`);
      return true;
    } else {
      console.log(`No encoding issues found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively scan directories
function scanDirectory(dirPath) {
  let fixedFiles = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      // Skip node_modules and other unnecessary directories
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.next') {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixedFiles += scanDirectory(fullPath);
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.html') || fullPath.endsWith('.css') || fullPath.endsWith('.md'))) {
        if (fixEncoding(fullPath)) {
          fixedFiles++;
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return fixedFiles;
}

// Run the script
console.log('Starting encoding fix process...');
const fixedCount = scanDirectory('.');
console.log(`\nProcess completed. Fixed ${fixedCount} files with encoding issues.`);