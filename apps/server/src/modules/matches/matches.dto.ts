import { IsString, MaxLength, MinLength } from 'class-validator';

export class CampaignFightDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  levelId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  userScript!: string;
}
