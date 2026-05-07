import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;
}

export class CompleteTournamentMatchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  winnerId!: string;
}
