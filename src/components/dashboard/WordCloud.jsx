import React from 'react';
import { motion } from 'framer-motion';

const scaleFont = (value, min, max, minFont, maxFont) => {
  if (max - min === 0) return minFont;
  return minFont + ((value - min) / (max - min)) * (maxFont - minFont);
};

const colors = ['#4F7CFF', '#00C896', '#FFC700', '#5A67D8', '#38B2AC'];

export default function WordCloud({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <p>Dados insuficientes para gerar a nuvem de palavras.</p>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 p-3 max-h-32 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {data.slice(0, 25).map((word, i) => (
        <motion.span
          key={word.text}
          variants={itemVariants}
          style={{
            fontSize: `${scaleFont(word.value, min, max, 12, 28)}px`,
            color: colors[i % colors.length],
            fontWeight: word.value > max * 0.6 ? '600' : '500',
            lineHeight: '1.1',
          }}
          className="transition-all duration-300 hover:scale-110 hover:text-[#FFC700] hover:drop-shadow-[0_0_8px_rgba(255,199,0,0.6)] cursor-default"
          whileHover={{ 
            scale: 1.1,
            filter: "drop-shadow(0 0 8px rgba(255,199,0,0.6))"
          }}
        >
          {word.text}
        </motion.span>
      ))}
    </motion.div>
  );
}