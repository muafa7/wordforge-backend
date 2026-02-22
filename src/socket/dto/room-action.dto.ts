import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Shared DTO for events that only require a roomId.
 * Used by: sync_state, leave_room
 */
export class RoomActionDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    roomId: string;
}
