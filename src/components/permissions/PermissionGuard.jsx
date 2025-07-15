import React, { useState, useEffect } from "react";
import { usePermissions } from "./PermissionUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

export default function PermissionGuard({ 
    children, 
    permission, 
    projectId = null,
    fallback = null 
}) {
    const [hasPermission, setHasPermission] = useState(false);
    const [loading, setLoading] = useState(true);
    const { checkPermission } = usePermissions();

    useEffect(() => {
        const verifyPermission = async () => {
            try {
                const result = await checkPermission(permission, null, projectId);
                setHasPermission(result);
            } catch (error) {
                console.error("Erro ao verificar permissão:", error);
                setHasPermission(false);
            } finally {
                setLoading(false);
            }
        };

        verifyPermission();
    }, [permission, projectId]);

    if (loading) {
        return (
            <div className="animate-pulse flex space-x-2 items-center text-gray-400 p-4">
                <Shield className="h-5 w-5" />
                <div>Verificando permissões...</div>
            </div>
        );
    }

    if (!hasPermission) {
        if (fallback) return fallback;
        
        return (
            <Alert variant="destructive" className="my-4">
                <AlertDescription className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Você não possui permissão para acessar este recurso.
                </AlertDescription>
            </Alert>
        );
    }

    return children;
}