
import React from 'react';
import { motion } from 'framer-motion';

export default function PlanzeeLoader({ size = 'md', text = 'Carregando...' }) {
  const sizeClasses = {
    sm: { container: 'h-16 w-16', logo: 'h-8', text: 'text-sm' },
    md: { container: 'h-24 w-24', logo: 'h-12', text: 'text-base' },
    lg: { container: 'h-32 w-32', logo: 'h-16', text: 'text-lg' },
    xl: { container: 'h-40 w-40', logo: 'h-20', text: 'text-xl' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Container do loader com o logo */}
      <div className="relative flex items-center justify-center">
        {/* Anel de carregamento externo */}
        <motion.div
          className={`absolute ${currentSize.container} border-4 border-gray-200 rounded-full`}
          style={{
            borderTopColor: '#4F7CFF',
            borderRightColor: '#00C896'
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Anel de carregamento interno */}
        <motion.div
          className={`absolute ${currentSize.container} border-2 border-transparent rounded-full`}
          style={{
            borderTopColor: '#FFC700',
            borderLeftColor: '#4F7CFF'
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {/* Logo do Planzee no centro */}
        <motion.img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9b480e47a_image.png"
          alt="Planzee"
          className={`${currentSize.logo} object-contain z-10`}
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ 
            scale: [0.8, 1, 0.8],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Texto de carregamento */}
      {text && (
        <motion.p
          className={`${currentSize.text} font-medium text-gray-600`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {text}
        </motion.p>
      )}

      {/* Pontos de loading animados */}
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Variante para tela cheia
export function PlanzeeFullScreenLoader({ text = 'Carregando...' }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center z-50">
      <PlanzeeLoader size="xl" text={text} />
    </div>
  );
}

// Variante para loading inline
export function PlanzeeInlineLoader({ text = 'Carregando...', className = '' }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <PlanzeeLoader size="md" text={text} />
    </div>
  );
}

// Variante para botões
export function PlanzeeButtonLoader() {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      <span>Carregando...</span>
    </div>
  );
}
