
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PWAMeta from "@/components/PWAMeta";

// Array of pre-approved admin users
const ADMIN_USERS = [
  'hudson.santos@alliedit.com.br',
  'bruno.mune@alliedit.com.br',
  'hermerson.miranda@alliedit.com.br',
  'andre.marques@alliedit.com.br',
  'jimmy@alliedit.com.br'
];

// Default password
const DEFAULT_PASSWORD = '1q2w3e4r%T';

export default function IndexPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        const user = await User.me();
        if (user) {
          setIsAuthenticated(true);
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        // Not logged in, stay on the login page
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Function to create admin users
  const createAdminUsers = async () => {
    try {
      for (const email of ADMIN_USERS) {
        const fullName = email.split('@')[0].split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        try {
          // Check if user exists first to avoid duplicates
          await User.create({
            email: email,
            full_name: fullName,
            role: "admin"
          });
          console.log(`Created user: ${email}`);
        } catch (err) {
          // User might already exist, that's fine
          console.log(`User might already exist: ${email}`);
        }
      }
    } catch (error) {
      console.error("Error creating admin users:", error);
    }
  };

  // Call this once during development to create the users
  // useEffect(() => {
  //   createAdminUsers();
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Simple validation
    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }
    
    // Check if this is an allowed admin user
    if (!ADMIN_USERS.includes(email)) {
      setError("Usuário não autorizado");
      return;
    }
    
    // Check password
    if (password !== DEFAULT_PASSWORD) {
      setError("Senha incorreta");
      return;
    }
    
    setLoading(true);
    
    try {
      // For the base44 platform, we need to use the built-in authentication
      await User.login();
      
      // Once logged in, try to update the user role (in case it's a new user)
      try {
        await User.updateMyUserData({ role: "admin" });
      } catch (err) {
        console.log("Could not update role, but login succeeded");
      }
      
      // After login, navigate to dashboard
      navigate(createPageUrl("Dashboard"));
    } catch (loginError) {
      console.error("Login error:", loginError);
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Already authenticated, will redirect in useEffect
  }

  return (
    <>
      <PWAMeta />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b78ad2_Logo.png" 
              alt="AlliedIT Logo" 
              className="h-16"
            />
          </div>
          
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4 pt-6">
              <CardTitle className="text-2xl text-center">Gerenciador de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@alliedit.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={remember} 
                      onCheckedChange={setRemember} 
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-gray-500 leading-none cursor-pointer"
                    >
                      Lembrar de mim
                    </label>
                  </div>
                  
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                    Esqueceu sua senha?
                  </a>
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Entrando
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Acesse com sua conta AlliedIT
              </div>
              
              <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                <p className="text-center font-medium">Usuários para teste:</p>
                <ul className="mt-2 space-y-1">
                  {ADMIN_USERS.map((user, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{user}</span>
                      <span className="text-gray-400">1q2w3e4r%T</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
