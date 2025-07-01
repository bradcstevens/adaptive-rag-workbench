import { useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}



export function useChatStream(mode: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get access token (will be 'demo-token' in demo mode)
      const token = await getAccessToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          prompt: content,
          mode: mode
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      let assistantMessage = '';
      let messageIndex = -1;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.token) {
                  assistantMessage += data.token;
                  
                  setMessages(prev => {
                    const newMessages = [...prev];
                    
                    if (messageIndex === -1) {
                      messageIndex = newMessages.length;
                      newMessages.push({
                        role: 'assistant',
                        content: assistantMessage,
                        timestamp: new Date()
                      });
                    } else {
                      const existingMessage = newMessages[messageIndex];
                      newMessages[messageIndex] = {
                        role: existingMessage?.role || 'assistant',
                        content: assistantMessage,
                        timestamp: existingMessage?.timestamp || new Date()
                      };
                    }
                    
                    return newMessages;
                  });
                }
                
                if (data.done) {
                  break;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [mode, getAccessToken]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
