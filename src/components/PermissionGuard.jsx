import React from 'react';
import { usePermissions } from '@/utils/permissions';

export default function PermissionGuard({ 
    children, 
    permission, 
    projectId = null,
    fallback = null 
}) {
    const [hasPermission, setHasPermission] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const { checkPermission } = usePermissions();

    React.useEffect(() => {
        const verifyPermission = async () => {
            try {
                const result = await checkPermission(permission, null, projectId);
                setHasPermission(result);
            } catch (error) {
                console.error('Erro ao verificar permissão:', error);
                setHasPermission(false);
            } finally {
                setLoading(false);
            }
        };

        verifyPermission();
    }, [permission, projectId]);

    if (loading) return null;
    if (!hasPermission) return fallback;
    return children;
}