import { IsString, IsNumber, MaxLength, Min, MinLength } from 'class-validator';

export class CompleteLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  completionToken!: string;

  @IsNumber()
  @Min(0)
  fightDurationTicks!: number;
}
