import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { FriendsService } from './friends.service';
import {
  SearchUsersSchema,
  SearchUsersDto,
  SendFriendRequestSchema,
  SendFriendRequestDto,
} from './dto/friends.dto';
import {
  FriendEntry,
  FriendRequestEntry,
  FriendSuggestion,
  UserSearchResult,
} from './types';

interface AuthenticatedRequest {
  user: { sub: string };
}

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

@SkipThrottle({ auth: true })
@UseGuards(AuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  async listFriends(@Req() req: AuthenticatedRequest): Promise<FriendEntry[]> {
    return this.friends.listFriends(req.user.sub);
  }

  @Get('requests')
  async listIncomingRequests(
    @Req() req: AuthenticatedRequest,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<{ items: FriendRequestEntry[]; total: number }> {
    return this.friends.listIncomingRequests(
      req.user.sub,
      Number.parseInt(skip, 10) || 0,
      Number.parseInt(take, 10) || 20,
    );
  }

  @Get('requests/sent')
  async listOutgoingRequests(
    @Req() req: AuthenticatedRequest,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<FriendRequestEntry[]> {
    return this.friends.listOutgoingRequests(
      req.user.sub,
      Number.parseInt(skip, 10) || 0,
      Number.parseInt(take, 10) || 20,
    );
  }

  @Post('requests')
  @UsePipes(new ZodValidationPipe(SendFriendRequestSchema))
  async sendRequest(
    @Req() req: AuthenticatedRequest,
    @Body() body: SendFriendRequestDto,
  ): Promise<FriendRequestEntry> {
    return this.friends.sendRequest(
      req.user.sub,
      body.receiverUsername,
      body.message ?? null,
    );
  }

  @Post('requests/:requestId/accept')
  async acceptRequest(
    @Req() req: AuthenticatedRequest,
    @Param('requestId') requestId: string,
  ): Promise<FriendRequestEntry> {
    if (!isUuid(requestId)) {
      throw new BadRequestException('Invalid request id');
    }
    return this.friends.acceptRequest(req.user.sub, requestId);
  }

  @Post('requests/:requestId/decline')
  async declineRequest(
    @Req() req: AuthenticatedRequest,
    @Param('requestId') requestId: string,
  ): Promise<{ success: true }> {
    if (!isUuid(requestId)) {
      throw new BadRequestException('Invalid request id');
    }
    return this.friends.declineRequest(req.user.sub, requestId);
  }

  @Delete(':friendId')
  async unfriend(
    @Req() req: AuthenticatedRequest,
    @Param('friendId') friendId: string,
  ): Promise<{ success: true }> {
    if (!isUuid(friendId)) {
      throw new BadRequestException('Invalid friend id');
    }
    return this.friends.unfriend(req.user.sub, friendId);
  }

  @Get('suggestions')
  async suggestions(
    @Req() req: AuthenticatedRequest,
  ): Promise<FriendSuggestion[]> {
    return this.friends.getSuggestions(req.user.sub);
  }
}

@SkipThrottle({ auth: true })
@UseGuards(AuthGuard)
@Controller('users')
export class UserSearchController {
  constructor(private readonly friends: FriendsService) {}

  @Get('search')
  @UsePipes(new ZodValidationPipe(SearchUsersSchema))
  async search(
    @Req() req: AuthenticatedRequest,
    @Query() query: SearchUsersDto,
  ): Promise<UserSearchResult[]> {
    return this.friends.searchUsers(req.user.sub, query.q);
  }
}
