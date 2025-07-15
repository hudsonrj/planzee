import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FormattedInsight({ insightText }) {
  if (!insightText) {
    return (
      <div className="flex items-center gap-2 text-gray-500 animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" /> Gerando análise...
      </div>
    );
  }

  const sections = insightText.split('### ').filter(Boolean);

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const [title, ...contentLines] = section.split('\n');
        const content = contentLines.join('\n').trim();

        return (
          <div key={index}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <div className="text-gray-600 space-y-2">
              {content.split('\n').map((line, lineIndex) => {
                if (line.startsWith('* ')) {
                  return (
                    <ul key={lineIndex} className="list-disc list-inside pl-2">
                      {line.split('\n* ').map((item, itemIndex) => (
                        <li key={itemIndex} className="mb-1">{item.replace('* ', '')}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={lineIndex}>{line}</p>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}