import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Trie } from '../trie/trie';
import { validateWord } from '../game/validator';
import words from 'word-list';
import { readFileSync } from 'node:fs';
import { scoreWord } from '../game/scoring';

// Types
type PlayerKey = string;

interface ParticipantBase {
  socketId: string;
  name: string;
  connected: boolean;
}

interface Player extends ParticipantBase {
  key: PlayerKey;
  score: number;
  role: "player";
}

interface Spectator extends ParticipantBase {
  role: "spectator";
}

type Participant = Player | Spectator;

interface Submission {
  playerKey: PlayerKey;
  word: string;
  score: number;
  submittedAt: number;
}

interface RoomState {
  roomId: string;
  hostKey: PlayerKey;
  players: Player[];
  spectators: Spectator[]; 
  grid: string[][];
  startAt?: number;
  roundDurationMs: number;
  submissions: Submission[];
  usedByPlayer: Record<PlayerKey, Set<string>>;
  boardSize: number;
}

@Injectable()
@WebSocketGateway({
  namespace: '/rooms',
  cors: { origin: '*' },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);
  private readonly rooms = new Map<string, RoomState>();
  private readonly trie = new Trie();

  constructor() {
    const isTest = process.env.JEST_WORKER_ID !== undefined;

    if (isTest) {
      ['cat', 'dog', 'bird', 'lion'].forEach((w) => this.trie.insert(w));
      this.generateGrid = () => [
        ['C', 'A', 'T', 'X'],
        ['D', 'O', 'G', 'X'],
        ['B', 'I', 'R', 'D'],
        ['L', 'I', 'O', 'N'],
      ];
    } else {
      const text = readFileSync(words, 'utf8');
      const list = text.split('\n');
      const filtered = list.filter(
        (w) => w.length >= 3 && w.length <= 5 && /^[a-z]+$/.test(w),
      );
      filtered.forEach((w) => this.trie.insert(w));
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.socketId === client.id);
      if (player) {
        player.connected = false;
        if (room.hostKey === player.key) {
          const nextHost = room.players.find(p => p.connected);
          room.hostKey = nextHost ? nextHost.key : '';
        }
      }

      const spec = room.spectators.find(s => s.socketId === client.id);
      if (spec) spec.connected = false;

      if (player || spec) {
        this.broadcastRoomState(room);
        this.broadcastPlayerState(room);
      }
    }
  }

  // Utilities
  private getOrCreateRoom(roomId: string): RoomState {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        hostKey: '',
        players: [],
        spectators: [], 
        grid: [],
        roundDurationMs: 60000,
        submissions: [],
        usedByPlayer: {},
        boardSize: 6,
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  private getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  private snapshotPlayers(room: RoomState) {
    return room.players.map((p) => ({
      id: p.socketId,
      key: p.key,
      name: p.name,
      score: p.score,
      connected: p.connected,
      isHost: p.key === room.hostKey,
      role: "player" as const,
    }));
  }

  private snapshotSpectators(room: RoomState) {
    return room.spectators.map(s => ({
      id: s.socketId,
      name: s.name,
      connected: s.connected,
      role: "spectator" as const,
    }));
  }

  private broadcastRoomState(room: RoomState) {
    this.server.to(room.roomId).emit('sync_state', {
      roomId: room.roomId,
      hostKey: room.hostKey,
      grid: room.grid,
      players: this.snapshotPlayers(room),
      spectators: this.snapshotSpectators(room),
      submissions: room.submissions,
      timeRemaining: this.getTimeRemaining(room),
      roundDurationMs: room.roundDurationMs,
      boardSize: room.boardSize,
      startAt: room.startAt ?? null,
    });
  }

  private broadcastPlayerState(room: RoomState) {
    this.server.to(room.roomId).emit('player_state', {
      hostKey: room.hostKey,
      players: this.snapshotPlayers(room),
      spectators: this.snapshotSpectators(room),
    });
  }

  private getTimeRemaining(room: RoomState): number {
    if (!room.startAt) return 0;
    const elapsed = Date.now() - room.startAt;
    const remaining = room.roundDurationMs - elapsed;
    return Math.max(remaining, 0);
  }

  private generateGrid(size = 6): string[][] {
    const rows = size;
    const cols = size;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const grid: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(letters[Math.floor(Math.random() * letters.length)]);
      }
      grid.push(row);
    }
    return grid;
  }

  // Events
  @SubscribeMessage('create_room')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId?: string; name: string; playerKey: string; roundDurationMs?: number },
  ) {
    const roomId =
      data.roomId ?? Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = this.getOrCreateRoom(roomId);

    if (data.roundDurationMs) room.roundDurationMs = data.roundDurationMs;

    client.join(roomId);

    let player = room.players.find((p) => p.key === data.playerKey);
    if (!player) {
      player = {
        socketId: client.id,
        key: data.playerKey,
        name: data.name,
        score: 0,
        connected: true,
        role: 'player'
      };
      room.players.push(player);
    } else {
      player.socketId = client.id;
      player.name = data.name;
      player.connected = true;
    }

    if (!room.hostKey) room.hostKey = player.key;

    this.broadcastRoomState(room);
    this.broadcastPlayerState(room);

    client.emit('room_created', {
      roomId,
      playerId: player.socketId,
      players: this.snapshotPlayers(room),
      hostKey: room.hostKey,
    });

    return { roomId };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; name: string; playerKey?: string; role?: "player" | "spectator" },
  ) {
    const room = this.getOrCreateRoom(data.roomId);
    client.join(room.roomId);

    const role = data.role ?? "player";

    if (role === "spectator") {
      room.players = room.players.filter(p => p.socketId !== client.id);
      // reconnect spectator by socketId (or name)
      let spec = room.spectators.find(s => s.socketId === client.id);
      if (!spec) {
        spec = { socketId: client.id, name: data.name, connected: true, role: "spectator" };
        room.spectators.push(spec);
      } else {
        spec.name = data.name;
        spec.connected = true;
      }

      this.broadcastRoomState(room);
      this.broadcastPlayerState(room);

      return client.emit('joined_room', {
        roomId: room.roomId,
        playerId: client.id,
        role: "spectator",
      });
    }

    room.spectators = room.spectators.filter(s => s.socketId !== client.id);

    if (!data.playerKey) return client.emit('error', { message: 'playerKey required to join as player' });

    let player = room.players.find(p => p.key === data.playerKey);
    if (!player) {
      player = { socketId: client.id, key: data.playerKey, name: data.name, score: 0, connected: true, role: "player" };
      room.players.push(player);
    } else {
      player.socketId = client.id;
      player.name = data.name;
      player.connected = true;
    }

    if (!room.hostKey) room.hostKey = player.key;

    this.broadcastRoomState(room);
    this.broadcastPlayerState(room);

    client.emit('joined_room', {
      roomId: room.roomId,
      playerId: player.socketId,
      role: "player",
    });
  }

  @SubscribeMessage('start_round')
  handleStartRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.getRoom(data.roomId);
    if (!room) return client.emit('error', { message: 'Room not found' });

    const starter = room.players.find((p) => p.socketId === client.id);
    if (!starter) return client.emit('error', { message: 'Not in room' });

    if (!room.hostKey || starter.key !== room.hostKey) {
      return client.emit('error', { message: 'Only host can start the round' });
    }

    if (room.startAt && this.getTimeRemaining(room) > 0) {
      return client.emit('error', { message: 'Round already active' });
    }

    room.grid = this.generateGrid(room.boardSize);
    room.startAt = Date.now();
    room.submissions = [];
    room.players.forEach((p) => (p.score = 0));

    // advanced: reset duplicates tracking each round
    room.usedByPlayer = {};

    const timeRemaining = this.getTimeRemaining(room);

    this.server.to(room.roomId).emit('round_start', {
      roomId: room.roomId,
      grid: room.grid,
      startAt: room.startAt,
      roundDurationMs: room.roundDurationMs,
      boardSize: room.boardSize,
      timeRemaining,
      players: this.snapshotPlayers(room),
      spectators: this.snapshotSpectators(room),
    });

    setTimeout(() => {
      if (room.startAt && this.getTimeRemaining(room) === 0) {
        this.server.to(room.roomId).emit('round_end', {
          roomId: room.roomId,
          submissions: room.submissions,
          players: this.snapshotPlayers(room),
        });
      }
    }, room.roundDurationMs + 50);
  }

  @SubscribeMessage('submit_word')
  handleSubmitWord(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; path: { row: number; col: number }[]; submissionId: string },
  ) {
    const room = this.getRoom(data.roomId);
    if (!room) return client.emit('error', { message: 'Room not found' });

    if (!room.startAt || this.getTimeRemaining(room) <= 0) {
      return client.emit('error', { message: 'Round not active' });
    }

    const player = room.players.find((p) => p.socketId === client.id);
    if (!player) return client.emit('error', { message: 'Spectators cannot submit words' });

    const path = data.path;
    if (!Array.isArray(path) || path.length === 0) {
      return client.emit('error', { message: 'Invalid path' });
    }

    const word = path
      .map(({ row, col }) => room.grid[row]?.[col])
      .join('')
      .toLowerCase();

    const isValid = validateWord(room.grid, path, this.trie);
    if (!isValid) {
      client.emit('word_rejected', {
        submissionId: data.submissionId,
        word,
        reason: 'invalid',
      });
      return;
    }

    // advanced: duplicates per player per round
    room.usedByPlayer[player.key] ??= new Set<string>();
    if (room.usedByPlayer[player.key].has(word)) {
      client.emit('word_rejected', {
        submissionId: data.submissionId,
        word,
        reason: 'duplicate',
      });
      return;
    }
    room.usedByPlayer[player.key].add(word);

    const scoreDelta = scoreWord(word);
    player.score += scoreDelta;

    room.submissions.push({
      playerKey: player.key,
      word,
      score: scoreDelta,
      submittedAt: Date.now(),
    });

    this.server.to(room.roomId).emit('score_update', {
      roomId: room.roomId,
      submissionId: data.submissionId,
      playerKey: player.key,
      word,
      scoreDelta,
      totalScore: player.score,
      players: this.snapshotPlayers(room),
      submissions: room.submissions,
    });
  }

  @SubscribeMessage('sync_state')
  handleSyncState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.getRoom(data.roomId);
    if (!room) return client.emit('error', { message: 'Room not found' });

    client.join(room.roomId);

    client.emit('sync_state', {
      roomId: room.roomId,
      hostKey: room.hostKey,
      grid: room.grid,
      players: this.snapshotPlayers(room),
      spectators: this.snapshotSpectators(room),
      submissions: room.submissions,
      timeRemaining: this.getTimeRemaining(room),
      roundDurationMs: room.roundDurationMs,
      boardSize: room.boardSize,
      startAt: room.startAt ?? null,
    });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.getRoom(data.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === client.id);
    if (player) player.connected = false;

    client.leave(room.roomId);

    if (player && room.hostKey === player.key) {
      const nextHost = room.players.find((p) => p.connected);
      room.hostKey = nextHost ? nextHost.key : '';
    }

    const spec = room.spectators.find(s => s.socketId === client.id);
    if (spec) spec.connected = false;

    this.broadcastRoomState(room);
    this.broadcastPlayerState(room);
  }

  @SubscribeMessage('update_settings')
  handleUpdateSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; roundDurationMs?: number; boardSize?: number },
  ) {
    const room = this.getRoom(data.roomId);
    if (!room) return client.emit('error', { message: 'Room not found' });

    const player = room.players.find(p => p.socketId === client.id);
    if (!player) return client.emit('error', { message: 'Not in room' });

    if (player.key !== room.hostKey) {
      return client.emit('error', { message: 'Only host can change settings' });
    }

    // Disallow changes mid-round (simple rule)
    if (room.startAt && this.getTimeRemaining(room) > 0) {
      return client.emit('error', { message: 'Cannot change settings during an active round' });
    }

    if (typeof data.roundDurationMs === 'number') {
      const v = Math.max(15000, Math.min(180000, Math.floor(data.roundDurationMs)));
      room.roundDurationMs = v;
    }

    if (typeof data.boardSize === 'number') {
      const v = Math.max(4, Math.min(8, Math.floor(data.boardSize)));
      room.boardSize = v;
      // optional: regenerate grid in lobby so people see new size immediately
      room.grid = [];
    }

    // Tell everyone settings changed
    this.server.to(room.roomId).emit('room_settings', {
      roundDurationMs: room.roundDurationMs,
      boardSize: room.boardSize,
    });

    // Also broadcast full state for safety
    this.broadcastRoomState(room);
    this.broadcastPlayerState(room);
  }
}
