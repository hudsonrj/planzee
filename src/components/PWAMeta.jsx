import React from 'react';

export default function PWAMeta() {
  // Criar o manifest inline para evitar problemas de path
  const manifest = {
    "name": "Planzee - Gerenciamento de Projetos",
    "short_name": "Planzee",
    "description": "Plataforma completa de gerenciamento de projetos com IA",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#4F7CFF",
    "orientation": "portrait-primary",
    "categories": ["productivity", "business"],
    "lang": "pt-BR",
    "icons": [
      {
        "src": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c6f29d9f3_image.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  };

  // Criar blob URL para o manifest
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  React.useEffect(() => {
    // Criar e adicionar link do manifest
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);

    // Cleanup
    return () => {
      document.head.removeChild(link);
      URL.revokeObjectURL(manifestUrl);
    };
  }, [manifestUrl]);

  return (
    <>
      {/* Meta tags PWA */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="theme-color" content="#4F7CFF" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Planzee" />
      
      {/* Ícones básicos */}
      <link rel="apple-touch-icon" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c6f29d9f3_image.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c6f29d9f3_image.png" />
      
      {/* Microsoft */}
      <meta name="msapplication-TileColor" content="#4F7CFF" />
      <meta name="msapplication-TileImage" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c6f29d9f3_image.png" />
    </>
  );
}