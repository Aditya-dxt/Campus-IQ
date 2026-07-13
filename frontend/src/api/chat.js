// Chat API — handles study assistant RAG interactions
// Currently resolves mock data; swap internals for real API calls later.

import {
  mockChatHistory,
  mockDocuments,
  mockSuggestedQuestions,
  mockAIResponses,
  delay,
} from '../mocks/mockData';

let localChatHistory = [...mockChatHistory];
let responseIndex = 0;

/**
 * Get chat history for the current session.
 */
export const getChatHistory = async () => {
  await delay(400);
  return [...localChatHistory];
};

/**
 * Get uploaded documents list.
 */
export const getDocuments = async () => {
  await delay(300);
  return [...mockDocuments];
};

/**
 * Get suggested questions.
 */
export const getSuggestedQuestions = async () => {
  await delay(200);
  return [...mockSuggestedQuestions];
};

/**
 * Upload a document (mock — just adds to the list).
 * @param {File} file
 */
export const uploadDocument = async (file) => {
  await delay(1000);

  const newDoc = {
    id: `doc-${Date.now()}`,
    name: file.name,
    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    uploadedAt: new Date().toISOString().split('T')[0],
    pages: Math.floor(Math.random() * 50) + 10,
  };

  mockDocuments.push(newDoc);
  return newDoc;
};

/**
 * Ask a question — simulates RAG round-trip.
 * @param {string} question
 * @returns {Promise<{ id, role, content, source, timestamp }>}
 */
export const askQuestion = async (question) => {
  await delay(1500); // simulate RAG processing

  // Add user message
  const userMsg = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: question,
    timestamp: new Date().toISOString(),
  };
  localChatHistory.push(userMsg);

  // Pick a canned response (cycle through available ones)
  const response = mockAIResponses[responseIndex % mockAIResponses.length];
  responseIndex++;

  const aiMsg = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: response.content,
    source: response.source,
    feedback: null,
    timestamp: new Date().toISOString(),
  };
  localChatHistory.push(aiMsg);

  return aiMsg;
};

/**
 * Rate an AI response (thumbs up/down).
 * @param {string} messageId
 * @param {'up' | 'down'} rating
 */
export const rateFeedback = async (messageId, rating) => {
  await delay(200);

  const msg = localChatHistory.find((m) => m.id === messageId);
  if (msg) {
    msg.feedback = rating;
  }

  return { success: true };
};

/**
 * Clear chat history (for fresh session).
 */
export const clearChat = async () => {
  await delay(200);
  localChatHistory = [];
  responseIndex = 0;
  return { success: true };
};
