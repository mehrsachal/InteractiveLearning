const fs = require('fs');
const path = 'src/visualizations/new.jsx';
const content = fs.readFileSync(path, 'utf8');

const escapedContent = content
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

const reactComponent = `import React from 'react';
import { Globe } from 'lucide-react';

const htmlContent = \`${escapedContent}\`;

export default function EllipsoidsVisualization() {
  return (
    <div className="w-full h-full relative border-0 overflow-hidden rounded-xl bg-slate-900">
      <iframe 
        srcDoc={htmlContent} 
        style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }} 
        title="Ellipsoids and Datums"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export const metadata = {
  id: 'ellipsoids-datums',
  title: 'ELI5: Ellipsoids & Datum Shifts',
  description: 'An interactive visualization explaining the difference between the true shape of the Earth (Geoid), mathematical ellipsoids, and how changing datums causes coordinates to shift.',
  iconName: 'Globe',
  category: 'GIS Math',
  status: 'Available'
};
`;

fs.writeFileSync(path, reactComponent);
console.log('Successfully converted new.jsx to a React component.');
