import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ItemCategory } from './black-market.constants';
import { ALLOWED_ROBOT_IDS } from './types';

export class UpdateProfileDto {
  @IsString()
  @IsIn(ALLOWED_ROBOT_IDS)
  @MaxLength(20)
  robotId!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^(DEFAULT|#[0-9a-fA-F]{6})$/)
  color!: string;
}

export class UpdateIdentityDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class UpdateArenaPreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_ROBOT_IDS)
  @MaxLength(20)
  defaultRobot?: string;

  @IsOptional()
  @IsBoolean()
  soundFx?: boolean;

  @IsOptional()
  @IsBoolean()
  music?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  @MaxLength(10)
  graphicsQuality?: string;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  challengeReqs?: boolean;

  @IsOptional()
  @IsBoolean()
  tournamentAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  matchResults?: boolean;
}

export class PurchaseItemDto {
  @IsString()
  @MaxLength(80)
  itemId!: string;
}

export class EquipItemDto {
  @IsString()
  @MaxLength(80)
  itemId!: string;

  @IsEnum({ chassis: 'chassis', paint: 'paint', tracer: 'tracer' })
  category!: ItemCategory;
}
