const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminPanel.jsx', 'utf8');
const styles = fs.readFileSync('styles.txt', 'utf8');

const matchStr = 'const styles = {';
const index = content.lastIndexOf(matchStr);

if (index !== -1) {
  const newContent = content.substring(0, index) + styles;
  fs.writeFileSync('src/pages/AdminPanel.jsx', newContent);
  console.log('Fixed AdminPanel.jsx');
} else {
  console.log('Failed to find split point.');
}
