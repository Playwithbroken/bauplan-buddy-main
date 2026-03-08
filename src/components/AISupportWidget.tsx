/**
 * AI Support Widget
 * Floating chat widget mit KI-Hilfe
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { aiSupport } from '@/services/aiSupportService';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  helpful?: boolean;
}

const AISupportWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen helfen?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getQuickActionsForPage = (): string[] => {
    const path = location.pathname;

    if (path.includes('/invoices')) return ['Wie erstelle ich eine Rechnung?', 'Suche unbezahlte Rechnungen', 'Zahlungserinnerung versenden', 'DATEV Export'];
    if (path.includes('/projects')) return ['Neues Projekt anlegen', 'Suche aktive Projekte', 'Projektstatus aendern', 'Team-Mitglieder zuweisen'];
    if (path.includes('/quotes')) return ['Wie erstelle ich ein Angebot?', 'Suche Angebot vom letzten Monat', 'Wie nutze ich Vorlagen?', 'Angebot in Rechnung umwandeln'];
    if (path.includes('/order-confirmations')) return ['Auftragsbestaetigung erstellen', 'Status auf bestaetigt setzen', 'AB an Kunde senden', 'AB in Rechnung wandeln'];
    if (path.includes('/customers')) return ['Neuen Kunden anlegen', 'Suche Kunde nach Name', 'Stammdaten bearbeiten', 'Kundenhistorie ansehen'];
    if (path.includes('/calendar')) return ['Termin erstellen', 'Wiederholende Termine', 'Team-Kalender synchronisieren', 'Erinnerungen einstellen'];
    if (path.includes('/teams')) return ['Mitarbeiter einladen', 'Rollen und Rechte vergeben', 'Team loeschen', 'Benachrichtigungen konfigurieren'];
    if (path.includes('/settings')) return ['Firmendaten aendern', 'Branding anpassen', 'Supabase verbinden', 'Abo upgraden'];
    if (path.includes('/analytics')) return ['Dashboard erklaeren', 'Export als PDF', 'Filter anwenden', 'Zeitraum aendern'];
    if (path.includes('/login') || path.includes('/register') || path.includes('/forgot-password')) return ['Wie kann ich mich registrieren?', 'Passwort vergessen - was tun?', 'Welche Deployment-Optionen gibt es?', 'Ist meine Firma DSGVO-konform?'];

    return ['Suche Projekt oder Rechnung', 'Wie erstelle ich ein Angebot?', 'Wie lade ich Mitarbeiter ein?', 'Abo upgraden'];
  };

  const quickActions = getQuickActionsForPage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setShowQuickActions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiSupport.getInstantAnswer(messageText);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Entschuldigung, es gab ein Problem. Bitte versuchen Sie es erneut.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    );
    console.log(`Message ${messageId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  };

  const contactHumanSupport = () => {
    window.location.href = '/support';
  };

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="KI-Assistent oeffnen"
          className="fixed bottom-6 right-6 w-12 h-12 bg-card text-foreground border border-border rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {!showQuickActions && messages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickActions(true)}
                    className="text-white hover:bg-white/20 mr-1"
                    title="Zurueck zu Schnellfragen"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Bot className="h-5 w-5" />
                <CardTitle className="text-lg">KI-Assistent</CardTitle>
                <Badge className="bg-green-500 text-white text-xs">Online</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'ai' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                    {message.role === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {message.role === 'ai' && message.helpful === undefined && (
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleFeedback(message.id, true)}
                        className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Hilfreich</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, false)}
                        className="text-xs opacity-70 hover:opacity-100 flex items-center space-x-1"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span>Nicht hilfreich</span>
                      </button>
                    </div>
                  )}

                  {message.helpful === true && (
                    <p className="text-xs opacity-70 mt-2">Als hilfreich markiert</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Denke nach...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {showQuickActions && (
            <div className="px-4 py-2 border-t bg-transparent">
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 font-semibold">Schnelle Fragen:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(action)}
                    className="text-xs bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/10 text-blue-700 dark:text-blue-400 font-medium px-3 py-2 rounded-lg transition-colors border border-blue-700/30 dark:border-blue-400/30"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                placeholder="Ihre Frage..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
              <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <button
              onClick={contactHumanSupport}
              className="w-full mt-2 text-xs text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Mit einem Menschen sprechen</span>
            </button>
          </div>
        </Card>
      )}
    </>
  );
};

export default AISupportWidget;
