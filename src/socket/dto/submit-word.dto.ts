import {
    IsString,
    IsNotEmpty,
    IsArray,
    ArrayMinSize,
    ValidateNested,
    IsInt,
    Min,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoordDto {
    @IsInt()
    @Min(0)
    row: number;

    @IsInt()
    @Min(0)
    col: number;
}

export class SubmitWordDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    roomId: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(64)
    submissionId: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CoordDto)
    path: CoordDto[];
}
