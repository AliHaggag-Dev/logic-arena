export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
}
