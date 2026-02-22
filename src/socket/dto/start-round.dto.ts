import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class StartRoundDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    roomId: string;
}
