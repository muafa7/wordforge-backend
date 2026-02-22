import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsIn,
    MaxLength,
} from 'class-validator';

export class JoinRoomDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    roomId: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(32)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(64)
    playerKey?: string;

    @IsOptional()
    @IsIn(['player', 'spectator'])
    role?: 'player' | 'spectator';
}
