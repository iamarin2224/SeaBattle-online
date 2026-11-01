import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  // Default fallback for development
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
}

export function getSocket(): Socket {
  if (!socket) {
    const url = getSocketUrl();
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export const SESSION_KEYS = {
  ROOM_CODE: 'sea_battle_room_code',
  PLAYER_TOKEN: 'sea_battle_player_token',
  PLAYER_ID: 'sea_battle_player_id',
  DISPLAY_NAME: 'sea_battle_display_name',
  BOARD_SIZE: 'sea_battle_board_size',
  MODE: 'sea_battle_mode',
};

export function saveSession(roomCode: string, token: string, playerId: string, displayName: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEYS.ROOM_CODE, roomCode);
  sessionStorage.setItem(SESSION_KEYS.PLAYER_TOKEN, token);
  sessionStorage.setItem(SESSION_KEYS.PLAYER_ID, playerId);
  localStorage.setItem(SESSION_KEYS.DISPLAY_NAME, displayName);
}

export function getSavedSession(): { roomCode: string | null; token: string | null; playerId: string | null; displayName: string } {
  if (typeof window === 'undefined') {
    return { roomCode: null, token: null, playerId: null, displayName: '' };
  }
  return {
    roomCode: sessionStorage.getItem(SESSION_KEYS.ROOM_CODE),
    token: sessionStorage.getItem(SESSION_KEYS.PLAYER_TOKEN),
    playerId: sessionStorage.getItem(SESSION_KEYS.PLAYER_ID),
    displayName: localStorage.getItem(SESSION_KEYS.DISPLAY_NAME) || '',
  };
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEYS.ROOM_CODE);
  sessionStorage.removeItem(SESSION_KEYS.PLAYER_TOKEN);
  sessionStorage.removeItem(SESSION_KEYS.PLAYER_ID);
}

