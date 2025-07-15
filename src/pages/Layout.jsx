

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Bell,
  Search,
  ChevronDown,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Calendar,
  DollarSign,
  Server,
  CheckSquare,
  Clock,
  BarChart3,
  Briefcase,
  Activity,
  Users,
  User,
  ChartBar,
  Beaker,
  Zap,
  Settings,
  Book,
  Database,
  Code,
  Lightbulb,
  Shield,
  Layers,
  MessageSquare,
  Network,
  HelpCircle,
  Plus,
  Brain,
  LineChart,
  PieChart,
  FolderOpen,
  Target,
  CalendarDays,
  ClipboardCheck,
  Binary,
  Mail,
  Microscope,
  Sparkles,
  Cog,
  Gauge,
  UserCog,
  Bot // Adicionado ícone para Agentes
} from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ContextualHelp from "../components/ContextualHelp";
import NotificationCenter from "../components/notifications/NotificationCenter"; // Moved NotificationCenter to its own file
import PlanzeeMe from "../components/PlanzeeMe";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileDetection } from "@/components/MobileDetector";
import MobileLayout from "@/components/mobile/MobileLayout";
import PWAMeta from "@/components/PWAMeta";
import PWAInstall from "@/components/PWAInstall";
import PlanzeeLoader, { PlanzeeFullScreenLoader } from "../components/PlanzeeLoader";

// The mockNotifications data and NotificationCenter component logic have been moved
// to src/components/notifications/NotificationCenter.js

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await UserEntity.me();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await UserEntity.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <PlanzeeFullScreenLoader text="Carregando Planzee..." />;
  }

  // Render mobile layout for mobile devices
  if (isMobile) {
    return (
      <>
        <PWAMeta />
        <MobileLayout currentPageName={currentPageName}>
          {children}
        </MobileLayout>
        <PWAInstall />
      </>
    );
  }

  // Keep existing desktop layout unchanged
  return (
    <>
      <PWAMeta />
      <style>{`
        :root {
          --planzee-blue: #4F7CFF;
          --planzee-teal: #00C896;
          --planzee-yellow: #FFC700;
          --planzee-dark-blue: #3B5FE6;
          --planzee-light-blue: #EEF3FF;
          --planzee-light-teal: #E6FDF7;
        }
        
        .planzee-gradient {
          background: linear-gradient(135deg, var(--planzee-blue) 0%, var(--planzee-teal) 100%);
        }
        
        .planzee-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(79, 124, 255, 0.08), 0 2px 6px rgba(0, 200, 150, 0.04);
          transition: all 0.3s ease;
        }
        
        .planzee-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 124, 255, 0.15), 0 4px 12px rgba(0, 200, 150, 0.08);
          border-color: var(--planzee-blue);
        }
        
        /* Efeito especial amarelo para cards importantes */
        .card-hover-effect:hover {
          border-color: #FFC700 !important;
          box-shadow: 0 8px 25px rgba(255, 199, 0, 0.2), 0 4px 12px rgba(255, 199, 0, 0.1) !important;
        }
        
        /* Status específico dos cards de projeto */
        .project-card-concluido {
          background: linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #bbf7d0;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15), 0 2px 6px rgba(34, 197, 94, 0.08);
        }
        
        .project-card-concluido:hover {
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.25), 0 4px 12px rgba(255, 199, 0, 0.15);
          border-color: #FFC700;
        }
        
        .project-card-andamento {
          background: linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15), 0 2px 6px rgba(59, 130, 246, 0.08);
        }
        
        .project-card-andamento:hover {
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(255, 199, 0, 0.15);
          border-color: #FFC700;
        }
        
        .project-card-atrasado {
          background: linear-gradient(145deg, #fefce8 0%, #fef3c7 100%);
          border: 1px solid #fed7aa;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15), 0 2px 6px rgba(251, 191, 36, 0.08);
        }
        
        .project-card-atrasado:hover {
          box-shadow: 0 8px 25px rgba(251, 191, 36, 0.25), 0 4px 12px rgba(255, 199, 0, 0.15);
          border-color: #FFC700;
        }
        
        .project-card-critico {
          background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fecaca;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15), 0 2px 6px rgba(239, 68, 68, 0.08);
        }
        
        .project-card-critico:hover {
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.25), 0 4px 12px rgba(255, 199, 0, 0.15);
          border-color: #FFC700;
        }
        
        .planzee-button-primary {
          background: linear-gradient(135deg, var(--planzee-blue) 0%, var(--planzee-teal) 100%);
          border: none;
          color: white;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(79, 124, 255, 0.3);
        }
        
        .planzee-button-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(79, 124, 255, 0.4), 0 0 10px rgba(255, 199, 0, 0.8);
          filter: drop-shadow(0 0 8px rgba(255, 199, 0, 0.6));
        }
        
        .planzee-nav-item {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .planzee-nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          box-shadow: 0 0 15px rgba(255, 199, 0, 0.3);
        }
        
        .planzee-dropdown {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(79, 124, 255, 0.15);
          backdrop-filter: blur(20px);
        }
        
        .planzee-logo-container {
          display: flex;
          align-items: center;
          space-x: 12px;
        }
        
        /* Animações especiais em amarelo */
        @keyframes yellowPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(255, 199, 0, 0.3); }
          50% { box-shadow: 0 0 20px rgba(255, 199, 0, 0.8); }
        }
        
        .yellow-pulse {
          animation: yellowPulse 2s infinite;
        }
        
        /* Efeito de brilho amarelo para elementos importantes */
        .yellow-glow:hover {
          filter: drop-shadow(0 0 10px rgba(255, 199, 0, 0.7));
          transition: filter 0.3s ease;
        }
      `}</style>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-teal-50">
        {/* Cabeçalho Principal com Gradient */}
        <header className="planzee-gradient text-white w-full h-16 flex items-center px-6 shadow-lg z-50">
          <div className="flex justify-between items-center w-full">
            <div className="planzee-logo-container">
              <Link to={createPageUrl("Dashboard")} className="flex items-center space-x-3">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0e30c9_Allied-IT-colorido.png"
                  alt="AlliedIT Logo"
                  className="h-8"
                />
                <div className="w-px h-14 bg-white/30"></div>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c6f29d9f3_image.png"
                  alt="Planzee Logo"
                  className="h-20"
                />
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative z-10">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-white/10 border-white/20 text-white placeholder-white/70 w-64 h-10 pl-10 rounded-full backdrop-blur-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
              </div>

              <ContextualHelp currentPageName={currentPageName} />

              <Link
                to={createPageUrl("AIAssistant")}
                className="flex items-center gap-2 px-3 py-1.5 text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" className="h-7 w-7 rounded-full border-2 border-white/50"/>
                <span className="hidden sm:inline font-medium">Gabih</span>
              </Link>

              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10 rounded-full px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{user?.full_name || "Usuário"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="planzee-dropdown">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Menu de Navegação Principal */}
        <nav className="bg-white/80 backdrop-blur-lg text-gray-700 w-full border-b border-gray-200/50 shadow-sm z-40">
          <div className="container flex flex-wrap">
            {/* Home */}
            <div className="group relative">
              <Link
                to={createPageUrl("Dashboard")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "Dashboard" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Home
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("Dashboard")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Dashboard
                </Link>
                <Link to={createPageUrl("Planzee360")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Planzee 360°
                </Link>
                <Link to={createPageUrl("ExecutiveView")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Visão Executiva
                </Link>
                <Link to={createPageUrl("SelfView")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Visão do Colaborador
                </Link>
              </div>
            </div>

            {/* Projetos */}
            <div className="group relative">
              <Link
                to={createPageUrl("Projects")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "Projects" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Projetos
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("Projects")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Projetos
                </Link>
                <Link to={createPageUrl("Milestones")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Milestones
                </Link>
                <Link to={createPageUrl("Timeline")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Cronograma Anual
                </Link>
                <Link to={createPageUrl("WeeklySchedule")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Cronograma Semanal
                </Link>
                <Link to={createPageUrl("Budgets")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Orçamentos
                </Link>
                <Link to={createPageUrl("Infrastructure")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Infraestrutura
                </Link>
                <Link to={createPageUrl("MarketRates")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Valores de Mercado
                </Link>
              </div>
            </div>

            {/* Tarefas */}
            <div className="group relative">
              <Link
                to={createPageUrl("Tasks")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "Tasks" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <ClipboardList className="h-5 w-5 mr-2" />
                Tarefas
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("Tasks")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Tarefas
                </Link>
                <Link to={createPageUrl("Meetings")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Reuniões
                </Link>
                <Link to={createPageUrl("Calendar")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Calendário
                </Link>
              </div>
            </div>

            {/* Análises & Insights */}
            <div className="group relative">
              <Link
                to={createPageUrl("Analytics")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "Analytics" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <LineChart className="h-5 w-5 mr-2" />
                Análises & Insights
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("Analytics")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Análises Gerais
                </Link>
                <Link to={createPageUrl("SelfView")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Visão do Colaborador
                </Link>
                <Link to={createPageUrl("Feedbacks")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Feedbacks
                </Link>
              </div>
            </div>

            {/* Gabih (Assistente IA) */}
            <div className="group relative">
              <Link
                to={createPageUrl("AIAssistant")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "AIAssistant" || currentPageName === "GabihAlliedIT" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" className="h-6 w-6 rounded-full mr-2"/>
                Gabih
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("AIAssistant")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  GerêncIA de Projetos
                </Link>
                <Link to={createPageUrl("GabihAlliedIT")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Gabih na AlliedIT
                </Link>
                <Link to={createPageUrl("ClientReport")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Report ao Cliente
                </Link>
              </div>
            </div>

            {/* Laboratório */}
            <div className="group relative">
              <Link
                to={createPageUrl("IdeaAnalysis")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  ["IdeaAnalysis", "Sinergia"].includes(currentPageName) ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <Beaker className="h-5 w-5 mr-2" />
                Laboratório
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("IdeaAnalysis")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Analise sua Ideia
                </Link>
                <Link to={createPageUrl("Sinergia")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Análise de Sinergia
                </Link>
              </div>
            </div>

            {/* Agentes de IA */}
            <div className="group relative">
              <Link
                to={createPageUrl("RiskAgent")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  ["RiskAgent", "ResourceAgent", "CommunicationAgent", "ScenarioAgent"].includes(currentPageName) ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <Bot className="h-5 w-5 mr-2" />
                Agentes IA
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("RiskAgent")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Agente de Riscos
                </Link>
                <Link to={createPageUrl("ResourceAgent")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Agente de Recursos
                </Link>
                <Link to={createPageUrl("CommunicationAgent")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Agente de Comunicação
                </Link>
                <Link to={createPageUrl("ScenarioAgent")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Agente de Cenários
                </Link>
              </div>
            </div>

            {/* Configurações */}
            <div className="group relative">
              <Link
                to={createPageUrl("Settings")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "Settings" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <Settings className="h-5 w-5" />
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("Users")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Usuários
                </Link>
                <Link to={createPageUrl("Areas")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Áreas
                </Link>
                <Link to={createPageUrl("ProjectTypes")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Tipos de Projeto
                </Link>
                <Link to={createPageUrl("ProjectStatus")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Status de Projeto
                </Link>
                <Link to={createPageUrl("Documentation")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Documentação
                </Link>
              </div>
            </div>

            {/* Ajuda */}
            <div className="group relative">
              <Link
                to={createPageUrl("Help")}
                className={`planzee-nav-item flex items-center px-6 py-4 hover:text-blue-600 transition-colors font-medium ${
                  currentPageName === "Help" ? "text-blue-600 bg-blue-50" : ""
                }`}
              >
                <HelpCircle className="h-5 w-5" />
                <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute hidden group-hover:block planzee-dropdown mt-1 min-w-[200px] z-50">
                <Link to={createPageUrl("QuickGuide")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Guia Rápido
                </Link>
                <Link to={createPageUrl("UserManual")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Manual do Usuário
                </Link>
                <Link to={createPageUrl("PlatformDiagram")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Diagrama da Plataforma
                </Link>
                <Link to={createPageUrl("FAQ")} className="block px-4 py-3 hover:bg-blue-50 transition-colors">
                  Perguntas Frequentes
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Conteúdo principal */}
        <main className="flex-grow p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* PlanzeeMe - Assistente Pessoal Suspenso */}
        <PlanzeeMe />
      </div>
      
      <PWAInstall />
    </>
  );
}

