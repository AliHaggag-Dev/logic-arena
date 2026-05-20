import { IsString, IsNumber, MaxLength, Min, MinLength, IsIn } from 'class-validator';

export class CompleteLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  completionToken!: string;

  @IsNumber()
  @Min(0)
  fightDurationTicks!: number;
}

export class RevealHintDto {
  @IsNumber()
  @IsIn([1, 2])
  hintIndex!: 1 | 2;
}
