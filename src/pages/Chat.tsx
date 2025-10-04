import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceMessage, AudioPlayer } from "@/components/ui/voice-message";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  message_type?: 'text' | 'voice';
  voice_message_url?: string;
  voice_duration?: number;
}

interface OtherUser {
  id: string;
  name: string;
  profile_pic: string | null;
  role: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userId = searchParams.get("user");

  useEffect(() => {
    initChat();
  }, [userId]);

  useEffect(() => {
    if (currentUserId && userId) {
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentUserId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (newMsg.sender_id === userId) {
              setMessages(prev => [...prev, newMsg]);
              markAsRead(newMsg.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const initChat = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      if (!userId) {
        toast({
          title: "Error",
          description: "No user specified for chat",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setCurrentUserId(session.user.id);

      // Fetch other user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, profile_pic, role")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setOtherUser(profileData);

      // Fetch messages
      await fetchMessages(session.user.id);
    } catch (error: unknown) {
      console.error("Error initializing chat:", error);
      toast({
        title: "Error",
        description: "Failed to load chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (currentUserId: string) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);

    // Mark received messages as read
    const unreadMessages = data?.filter(
      m => m.receiver_id === currentUserId && !m.read
    ) || [];
    
    for (const msg of unreadMessages) {
      await markAsRead(msg.id);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("id", messageId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: userId,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      await fetchMessages(currentUserId);
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!userId || sending) return;

    setSending(true);
    try {
      // Convert audio blob to base64 for storage in database
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const base64Audio = await base64Promise;
      
      // Format duration for display
      const formattedDuration = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
      
      // Create voice message content with embedded audio data
      const voiceMessageContent = JSON.stringify({
        type: 'voice',
        duration: duration,
        formattedDuration: formattedDuration,
        audioData: base64Audio
      });

      // Save the message to the database
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: userId,
          content: voiceMessageContent,
        });

      if (messageError) {
        console.error('Database error details:', {
          error: messageError,
          messageContent: voiceMessageContent.substring(0, 200) + '...',
          contentLength: voiceMessageContent.length
        });
        throw new Error(`Database error: ${messageError.message || 'Unknown error'}`);
      }
      
      toast({
        title: "Voice message sent",
        description: "Your voice message has been delivered.",
      });
      
      // Refresh messages to get the proper message from database
      await fetchMessages(currentUserId);
    } catch (error: unknown) {
      console.error("Error sending voice message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send voice message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 animate-pulse mx-auto"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {otherUser && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.profile_pic || undefined} />
                <AvatarFallback className="bg-primary/20">{otherUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{otherUser.name}</h2>
                <p className="text-xs text-muted-foreground capitalize">{otherUser.role}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-20 pb-6">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="ultra-card fade-in">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="gradient-text">Chat with {otherUser?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
            <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => {
                  const isSent = message.sender_id === currentUserId;
                  
                  // Parse voice message data
                  let voiceMessageData = null;
                  let isVoiceMessage = false;
                  
                  try {
                    const parsed = JSON.parse(message.content);
                    if (parsed.type === 'voice' && parsed.audioData) {
                      voiceMessageData = parsed;
                      isVoiceMessage = true;
                    }
                  } catch {
                    // Not a JSON message, check for old format
                    isVoiceMessage = message.content.includes('[Voice Message') || message.message_type === 'voice';
                  }
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          isSent
                            ? "bg-primary text-primary-foreground"
                            : "ultra-card"
                        }`}
                      >
                        {isVoiceMessage ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mic className="h-4 w-4" />
                              <span className="text-xs font-medium">Voice Message</span>
                            </div>
                            {voiceMessageData?.audioData ? (
                              <AudioPlayer 
                                audioUrl={voiceMessageData.audioData} 
                                duration={voiceMessageData.duration}
                                className="w-full"
                              />
                            ) : message.voice_message_url ? (
                              <AudioPlayer 
                                audioUrl={message.voice_message_url} 
                                duration={message.voice_duration}
                                className="w-full"
                              />
                            ) : (
                              <div className="flex items-center gap-2 py-2">
                                <div className="flex gap-1">
                                  {Array.from({ length: 15 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1 rounded-full ${
                                        isSent ? "bg-primary-foreground/30" : "bg-primary/30"
                                      }`}
                                      style={{
                                        height: `${Math.random() * 16 + 8}px`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs">
                                  {voiceMessageData?.formattedDuration || 
                                   message.content.match(/\d+:\d+/)?.[0] || '0:00'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm break-words">{message.content}</p>
                        )}
                        <p className={`text-xs mt-2 ${
                          isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="space-y-3">
              {/* Voice Message Component */}
              <VoiceMessage 
                onSendVoiceMessage={handleSendVoiceMessage}
                disabled={sending}
              />
              
              {/* Text Message Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || sending} className="shadow-neon hover:shadow-glow">
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
};

export default Chat;
