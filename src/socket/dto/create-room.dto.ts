import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  Min,
  Max,
  IsAlphanumeric,
} from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @MaxLength(20)
  roomId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  playerKey: string;

  @IsOptional()
  @IsNumber()
  @Min(15000)
  @Max(180000)
  roundDurationMs?: number;
}
