const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'source_site.html');
const destCssPath = path.join(__dirname, 'allstartrade-clone', 'frontend', 'css', 'style.css');
const destHtmlPath = path.join(__dirname, 'allstartrade-clone', 'frontend', 'index.html');

const htmlContent = fs.readFileSync(sourcePath, 'utf8');

// Regex to find style tags
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

let cssContent = '';
let match;
let cleanedHtml = htmlContent;

while ((match = styleRegex.exec(htmlContent)) !== null) {
  cssContent += match[1] + '\n\n';
  // Remove style block from HTML
  cleanedHtml = cleanedHtml.replace(match[0], '');
}

// Add link to style.css in head
cleanedHtml = cleanedHtml.replace('</head>', '<link rel="stylesheet" href="css/style.css">\n</head>');

// Fix image paths (remove domain)
cleanedHtml = cleanedHtml.replace(/https:\/\/allstartrade.pk\//g, '/');

// Write CSS file
fs.writeFileSync(destCssPath, cssContent);

// Write HTML file
fs.writeFileSync(destHtmlPath, cleanedHtml);

console.log('CSS extracted and HTML updated.');
