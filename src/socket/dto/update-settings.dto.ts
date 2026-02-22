import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    Max,
    MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    roomId: string;

    @IsOptional()
    @IsInt()
    @Min(15000)
    @Max(180000)
    roundDurationMs?: number;

    @IsOptional()
    @IsInt()
    @Min(4)
    @Max(8)
    boardSize?: number;
}
