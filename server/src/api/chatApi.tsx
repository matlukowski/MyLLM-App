import axios from "axios";

export const getChats = async (userId: string) => {
  const response = await axios.get(
    `http://localhost:3001/api/chats?userId=${userId}`
  );
  return response.data;
};

export const getChat = async (id: string) => {
  const response = await axios.get(`http://localhost:3001/api/chats/${id}`);
  return response.data;
};

export const createAIChat = async (
  userId: string,
  title: string,
  modelId: string
) => {
  const response = await axios.post("http://localhost:3001/api/ai/chats", {
    userId,
    title,
    modelId,
  });
  return response.data;
};

export const deleteChatById = async (chatId: string, userId: string) => {
  const response = await axios.delete(
    `http://localhost:3001/api/chats/${chatId}`,
    {
      data: { userId },
    }
  );
  return response.data;
};
