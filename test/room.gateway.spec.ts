import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { AddressInfo } from 'net';

describe('RoomGateway (WebSocket)', () => {
  let app: INestApplication;
  let port: number;

  let client1: ClientSocket;
  let client2: ClientSocket;

  beforeAll(async () => {

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    const server = await app.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    client1?.connected && client1.disconnect();
    client2?.connected && client2.disconnect();
  });

  function createClient(name: string): Promise<ClientSocket> {
    return new Promise((resolve) => {
        const client = Client(`http://localhost:${port}/rooms`, {
        transports: ['websocket'],
        auth: { playerName: name },
        });
        client.on('connect', () => resolve(client));
    });
  }  


  // Test 1: clients receive identical grid
  it('two clients join same room and get identical grid', async () => {
    client1 = await createClient('Alice');
    client2 = await createClient('Bob');

    const roomId = 'ROOMTEST1';

    await new Promise<void>((resolve, reject) => {
      client1.emit('create_room', { roomId, name: 'Alice' });

      client1.once('room_created', () => {
        client2.emit('join_room', { roomId, name: 'Bob' });

        client2.once('joined_room', () => {
          client1.emit('start_round', { roomId });

          let grid1: string[][] | null = null;
          let grid2: string[][] | null = null;

          const check = () => {
            if (grid1 && grid2) {
              expect(grid1).toEqual(grid2);
              resolve();
            }
          };

          client1.on('round_start', (data) => {
            grid1 = data.grid;
            check();
          });

          client2.on('round_start', (data) => {
            grid2 = data.grid;
            check();
          });
        });
      });

      setTimeout(() => reject(new Error('timeout')), 6000);
    });
  });

  // Test 2: path submission triggers score_update on both clients
    it('submitting a valid path results in score_update for both clients', async () => {
        client1 = await createClient('Alice');
        client2 = await createClient('Bob');

        const roomId = 'ROOMTEST2';

        await new Promise<void>((resolve, reject) => {
            client1.emit('create_room', { roomId, name: 'Alice' });

            client1.once('room_created', () => {
            client2.emit('join_room', { roomId, name: 'Bob' });

            client2.once('joined_room', () => {
                client1.emit('start_round', { roomId });

                client1.once('round_start', () => {

                const path = [
                    { row: 0, col: 0 },
                    { row: 0, col: 1 },
                    { row: 0, col: 2 },
                ];

                let updates = 0;

                const handler = (data: any) => {
                    updates++;
                    if (updates >= 2) {
                    const alice = data.players.find((p: any) => p.name === 'Alice');
                    expect(alice.score).toBe(3);
                    resolve();
                    }
                };

                client1.on('score_update', handler);
                client2.on('score_update', handler);

                client1.emit('submit_word', { roomId, path });
                });
            });
            });

            setTimeout(() => reject(new Error('timeout')), 8000);
        });
    });

  // Test 3: sync_state after reconnect
  it('sync_state restores current round state', async () => {
    client1 = await createClient('Alice');
    const roomId = 'ROOMTEST3';

    await new Promise<void>((resolve, reject) => {
      client1.emit('create_room', { roomId, name: 'Alice' });

      client1.once('room_created', () => {
        client1.emit('start_round', { roomId });

        client1.once('round_start', async (data) => {
          const originalGrid = data.grid;

          client2 = await createClient('Bob');

          client2.emit('sync_state', { roomId });

          client2.once('sync_state', (state) => {
            expect(state.roomId).toBe(roomId);
            expect(state.grid).toEqual(originalGrid);
            expect(state.timeRemaining).toBeGreaterThan(0);
            expect(state.players.length).toBe(1);
            resolve();
          });
        });
      });

      setTimeout(() => reject(new Error('timeout')), 6000);
    });
  });
});
