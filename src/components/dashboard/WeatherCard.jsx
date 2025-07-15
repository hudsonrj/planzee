
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Zap, CloudSun, CloudFog } from 'lucide-react';

const getWeatherIcon = (iconName, size = 24) => {
  const iconMap = {
    'Clear': <Sun size={size} className="text-yellow-400" />,
    'Clouds': <Cloud size={size} className="text-gray-400" />,
    'Rain': <CloudRain size={size} className="text-blue-400" />,
    'Drizzle': <CloudRain size={size} className="text-blue-300" />,
    'Thunderstorm': <Zap size={size} className="text-yellow-500" />,
    'Snow': <CloudSnow size={size} className="text-white" />,
    'Mist': <CloudFog size={size} className="text-gray-300" />,
    'Fog': <CloudFog size={size} className="text-gray-300" />,
    'few clouds': <CloudSun size={size} className="text-gray-400" />
  };
  
  const lowerCaseIcon = iconName?.toLowerCase() || '';

  for (const key in iconMap) {
    if (lowerCaseIcon.includes(key.toLowerCase())) {
      return iconMap[key];
    }
  }

  return <Cloud size={size} className="text-gray-400" />; // Default icon
};

const getWeatherBackground = (condition) => {
  const lowerCondition = condition?.toLowerCase() || '';
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
    return {
      background: 'linear-gradient(135deg, #87CEEB 0%, #98D8E8 50%, #F0F8FF 100%)',
      textColor: 'text-blue-900',
      shadowColor: 'rgba(135, 206, 235, 0.3)'
    };
  }
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return {
      background: 'linear-gradient(135deg, #4A5568 0%, #718096 50%, #A0AEC0 100%)',
      textColor: 'text-white',
      shadowColor: 'rgba(74, 85, 104, 0.3)'
    };
  }
  
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return {
      background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 50%, #718096 100%)',
      textColor: 'text-white',
      shadowColor: 'rgba(45, 55, 72, 0.4)'
    };
  }
  
  if (lowerCondition.includes('cloud')) {
    return {
      background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E0 50%, #A0AEC0 100%)',
      textColor: 'text-gray-800',
      shadowColor: 'rgba(226, 232, 240, 0.3)'
    };
  }
  
  if (lowerCondition.includes('snow')) {
    return {
      background: 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)',
      textColor: 'text-gray-700',
      shadowColor: 'rgba(247, 250, 252, 0.3)'
    };
  }
  
  // Default sunny day
  return {
    background: 'linear-gradient(135deg, #87CEEB 0%, #98D8E8 50%, #F0F8FF 100%)',
    textColor: 'text-blue-900',
    shadowColor: 'rgba(135, 206, 235, 0.3)'
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function WeatherCard({ weather }) {
  if (!weather) {
    return (
      <Card className="planzee-card yellow-glow h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span>Carregando clima...</span>
        </div>
      </Card>
    );
  }

  const { current, forecast } = weather;
  const weatherStyle = getWeatherBackground(current.condition);

  // SEMPRE definir uma imagem - priorizar chuva se houver qualquer indicação de chuva, senão sol
  let gabihImage = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2863b6750_gabihsol.png'; // Padrão: sol
  
  const condition = current.condition?.toLowerCase() || '';
  const icon = current.icon?.toLowerCase() || '';
  
  // Se tiver qualquer indicação de chuva, trocar para imagem de chuva
  if (condition.includes('chuva') || 
      condition.includes('rain') || 
      condition.includes('tempestade') || 
      condition.includes('storm') || 
      condition.includes('drizzle') ||
      icon.includes('rain') ||
      icon.includes('drizzle') ||
      icon.includes('thunderstorm')) {
    gabihImage = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8fd08ecc0_gabihchuva.png';
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="h-full"
    >
      <Card 
        className="planzee-card yellow-glow h-full shadow-lg overflow-hidden relative"
        style={{ 
          background: weatherStyle.background,
          boxShadow: `0 8px 32px ${weatherStyle.shadowColor}, 0 4px 16px rgba(0,0,0,0.1)`
        }}
      >
        {/* Elementos decorativos de fundo baseados no clima */}
        <div className="absolute inset-0 overflow-hidden">
          {current.condition?.toLowerCase().includes('clear') && (
            <>
              <div className="absolute top-4 right-24 w-16 h-16 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute top-12 right-32 w-8 h-8 bg-yellow-200 rounded-full opacity-30"></div>
            </>
          )}
          
          {current.condition?.toLowerCase().includes('cloud') && (
            <>
              <div className="absolute top-2 right-20 w-20 h-12 bg-white rounded-full opacity-40"></div>
              <div className="absolute top-6 right-28 w-16 h-8 bg-white rounded-full opacity-30"></div>
            </>
          )}
          
          {current.condition?.toLowerCase().includes('rain') && (
            <>
              <div className="absolute top-0 left-4 w-1 h-8 bg-blue-300 opacity-50 animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="absolute top-2 left-8 w-1 h-6 bg-blue-300 opacity-50 animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="absolute top-1 left-12 w-1 h-7 bg-blue-300 opacity-50 animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </>
          )}
        </div>

        {/* Imagem da Gabih com moldura oval no canto superior direito */}
        <motion.div
          className="absolute top-4 right-4 z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        >
          <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/70 shadow-lg backdrop-blur-sm bg-white/20">
            <img
              src={gabihImage}
              alt="Gabih ilustrando o tempo"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </motion.div>

        <CardHeader className="pb-2 relative z-10">
          <CardTitle className={`${weatherStyle.textColor} flex items-center justify-between pr-24`}>
            <span className="font-bold">{current.city}</span>
            <motion.div 
              whileHover={{ scale: 1.2, rotate: 15 }}
              className="drop-shadow-lg"
            >
              {getWeatherIcon(current.icon, 36)}
            </motion.div>
          </CardTitle>
          <CardDescription className={`${weatherStyle.textColor} opacity-80 font-medium`}>
            {current.condition}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.p 
              className={`text-6xl font-bold ${weatherStyle.textColor} drop-shadow-lg`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              {Math.round(current.temp)}°
            </motion.p>
          </div>
          
          <div className={`border-t border-opacity-30 pt-3 ${weatherStyle.textColor === 'text-white' ? 'border-white' : 'border-gray-400'}`}>
            <p className={`font-semibold text-sm mb-2 ${weatherStyle.textColor} opacity-90`}>
              Próximos 5 dias
            </p>
            <div className="flex justify-between items-center text-sm">
              {forecast.slice(0, 5).map((day, index) => (
                <motion.div 
                  key={index} 
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-black/10 transition-colors cursor-default backdrop-blur-sm"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <span className={`font-medium ${weatherStyle.textColor} text-xs`}>{day.day}</span>
                  <motion.div whileHover={{ y: -2, scale: 1.1 }}>
                    {getWeatherIcon(day.icon, 24)}
                  </motion.div>
                  <div className="flex gap-1 text-xs">
                    <span className={`font-bold ${weatherStyle.textColor}`}>
                      {Math.round(day.temp_max)}°
                    </span>
                    <span className={`${weatherStyle.textColor} opacity-70`}>
                      {Math.round(day.temp_min)}°
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
