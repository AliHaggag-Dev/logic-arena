import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompleteLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  completionToken!: string;
}
