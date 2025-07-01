import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Shield, LogIn, Play } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MicrosoftLogo } from '../components/MicrosoftLogo';

export function Login() {
  const { login, loginDemo } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md mx-auto text-center bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Adaptive RAG Workbench
        </h1>
        <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-xs font-medium mb-6">
          Solution Accelerator
        </Badge>
        <p className="text-gray-600 mb-6">
          Sign in with your Microsoft account to access the workbench. Only @microsoft.com accounts are allowed.
        </p>
        <Button
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mb-4"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign in with Microsoft
        </Button>
        
        {/* Demo bypass option */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-xs text-gray-500 mb-3">
            For demo purposes only
          </p>
          <button
            onClick={loginDemo}
            className="text-sm text-blue-600 hover:text-blue-700 underline decoration-dotted flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <Play className="h-3 w-3" />
            Continue as Demo User
          </button>
        </div>
        
        <div className="flex items-center justify-center mt-6">
          <MicrosoftLogo />
        </div>
      </Card>
    </div>
  );
}
