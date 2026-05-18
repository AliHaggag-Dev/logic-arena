import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/auth.guard';
import { MarketQueryService } from '../queries/market-query.service';
import { MarketCommandService } from '../commands/market-command.service';
import { PurchaseItemDto, EquipItemDto } from '../users.dto';
import { ItemCategory } from '../black-market.constants';

interface AuthenticatedRequest {
  user: { sub: string };
}

@Controller('users')
export class MarketController {
  constructor(
    private readonly marketQuery: MarketQueryService,
    private readonly marketCommand: MarketCommandService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('black-market')
  async getBlackMarket(@Req() req: AuthenticatedRequest) {
    try {
      return await this.marketQuery.getBlackMarket(req.user.sub);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load Black Market data';
      throw new NotFoundException(message);
    }
  }

  @UseGuards(AuthGuard)
  @Post('black-market/purchase')
  async purchaseItem(
    @Req() req: AuthenticatedRequest,
    @Body() body: PurchaseItemDto,
  ) {
    if (!body?.itemId) throw new BadRequestException('itemId is required');
    try {
      await this.marketCommand.purchaseItem(req.user.sub, body.itemId);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      throw new BadRequestException(message);
    }
  }

  @UseGuards(AuthGuard)
  @Post('black-market/equip')
  async equipItem(
    @Req() req: AuthenticatedRequest,
    @Body() body: EquipItemDto,
  ) {
    if (!body?.itemId) throw new BadRequestException('itemId is required');
    if (!body?.category) throw new BadRequestException('category is required');
    const validCategories: ItemCategory[] = ['chassis', 'paint', 'tracer'];
    if (!validCategories.includes(body.category)) {
      throw new BadRequestException(
        'category must be chassis, paint, or tracer',
      );
    }
    try {
      await this.marketCommand.equipItem(
        req.user.sub,
        body.itemId,
        body.category,
      );
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Equip failed';
      throw new BadRequestException(message);
    }
  }
}
