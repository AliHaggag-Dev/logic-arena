export interface SwarmFunctionDoc {
  signature: string;
  category: string;
  description: string;
  returns: string;
  returnDetail: string;
  example: string;
  note: string;
}

export const SWARM_FUNCTIONS_TABLE: SwarmFunctionDoc[] = [
  {
    signature: 'BROADCAST(data)',
    category: 'Swarm Comm',
    description: 'Sends a deep-copy of `data` (dictionary, array, string, or number) to the inbox of every alive teammate. Safely prevents cross-sandbox memory leaks by copying the payload.',
    returns: 'number',
    returnDetail: 'Returns the count of teammates that successfully received the message.',
    example:
      `// Broadcast a target to all allies
IF CAN_SEE_ENEMY THEN
  SET count = BROADCAST({ type: "TARGET", x: NEAREST_VISIBLE_X, y: NEAREST_VISIBLE_Y })
END`,
    note: 'Returns 0 if no data is provided or no alive teammates exist.',
  },
  {
    signature: 'RECEIVE()',
    category: 'Swarm Comm',
    description: 'Atomically drains this robot\'s inbox and returns the full array of messages received since the last RECEIVE() call. The inbox is cleared immediately after reading.',
    returns: 'Array of payloads',
    returnDetail: 'Each element in the array is a message payload sent via BROADCAST().',
    example:
      `// Process all incoming messages
SET msgs = RECEIVE()
SET len = LENGTH(msgs)
IF len > 0 THEN
  // Get the most recent message
  SET latest = msgs[len - 1]
  IF latest.type == "TARGET" THEN
    // Move to target
    SET rotation = ATAN2(latest.y - POSITION_Y, latest.x - POSITION_X)
    MOVE
  END
END`,
    note: 'Calling RECEIVE() when the inbox is empty returns []. Messages are delivered exactly once.',
  },
];
