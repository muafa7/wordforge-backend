import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomGateway } from './socket/room.gateway';
import { WORD_LIST } from './config/word-list.token';
import { readFileSync } from 'node:fs';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    RoomGateway,
    {
      provide: WORD_LIST,
      useFactory: (): string[] => {
        // require.resolve works in both CJS (Jest) and NestJS runtime
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const wordsPath: string = require.resolve('word-list');
        const text = readFileSync(wordsPath, 'utf8');
        return text
          .split('\n')
          .filter((w) => w.length >= 3 && w.length <= 5 && /^[a-z]+$/.test(w));
      },

    },
  ],
})
export class AppModule { }


