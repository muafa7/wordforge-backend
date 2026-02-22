import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomGateway } from './socket/room.gateway';
import { WORD_LIST } from './config/word-list.token';
import { readFileSync } from 'node:fs';
import words from 'word-list';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    RoomGateway,
    {
      provide: WORD_LIST,
      useFactory: (): string[] => {
        const text = readFileSync(words, 'utf8');
        return text
          .split('\n')
          .filter((w) => w.length >= 3 && w.length <= 5 && /^[a-z]+$/.test(w));
      },
    },
  ],
})
export class AppModule { }

