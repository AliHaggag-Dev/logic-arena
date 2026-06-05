import { z } from 'zod';

export const SendFriendRequestSchema = z.object({
  receiverUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long'),
  message: z.string().max(200, 'Message too long').optional(),
});

export type SendFriendRequestDto = z.infer<typeof SendFriendRequestSchema>;

export const RespondFriendRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request id'),
});

export type RespondFriendRequestDto = z.infer<
  typeof RespondFriendRequestSchema
>;

export const SearchUsersSchema = z.object({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(30, 'Search query too long'),
});

export type SearchUsersDto = z.infer<typeof SearchUsersSchema>;
