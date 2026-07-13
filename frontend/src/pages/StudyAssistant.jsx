import { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import { getChatHistory, getDocuments, getSuggestedQuestions, askQuestion, uploadDocument, rateFeedback } from '../api/chat';
import { BookOpen, Loader2 } from 'lucide-react';

const StudyAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [chatHistory, docs, suggestions] = await Promise.all([
          getChatHistory(),
          getDocuments(),
          getSuggestedQuestions(),
        ]);
        setMessages(chatHistory);
        setDocuments(docs);
        setSuggestedQuestions(suggestions);
      } catch (err) {
        console.error('Failed to load chat data:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSendMessage = async (question) => {
    // Add user message immediately for responsiveness
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const aiResponse = await askQuestion(question);
      setMessages((prev) => [...prev.filter((m) => m.id !== userMsg.id), 
        { ...userMsg, id: `msg-${Date.now() - 1}` }, 
        aiResponse
      ]);
    } catch (err) {
      console.error('Failed to get response:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (file) => {
    try {
      const newDoc = await uploadDocument(file);
      setDocuments((prev) => [...prev, newDoc]);
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  const handleRate = async (messageId, rating) => {
    try {
      await rateFeedback(messageId, rating);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
      );
    } catch (err) {
      console.error('Failed to rate:', err);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary-500" />
          <p className="text-surface-500 text-sm">Loading Study Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Study Assistant</h1>
            <p className="text-surface-500 text-sm">AI-powered study companion with your uploaded notes</p>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 min-h-0">
        <ChatWindow
          messages={messages}
          documents={documents}
          suggestedQuestions={suggestedQuestions}
          onSendMessage={handleSendMessage}
          onUploadDoc={handleUploadDoc}
          onRate={handleRate}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default StudyAssistant;
