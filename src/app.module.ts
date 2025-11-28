import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomGateway } from './socket/room.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RoomGateway],
})
export class AppModule {}
