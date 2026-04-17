import { Controller, Get, Patch, Body, NotFoundException, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuthGuard } from '../../common/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
    ) { }

    @Get('leaderboard')
    async getLeaderboard() {
        return this.prisma.user.findMany({
            orderBy: { rank: 'desc' },
            take: 10,
            select: {
                id: true,
                username: true,
                rank: true,
                _count: {
                    select: { wonMatches: true },
                },
            },
        });
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    async getProfile(@Req() req: any) {
        const userId: string = req.user.sub;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                username: true,
                rank: true,
                createdAt: true,
                selectedRobotId: true,
                selectedColor: true,
                Match: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        type: true,
                        winnerId: true,
                        duration: true,
                        createdAt: true,
                        participants: {
                            select: { id: true, username: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return { username: 'UNKNOWN', totalMatches: 0, wins: 0, losses: 0, winRate: 0, rank: 0, matchHistory: [] };
        }

        const totalMatches = user.Match.length;
        const wins = user.Match.filter((m) => m.winnerId === userId).length;
        const losses = totalMatches - wins;
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        const matchHistory = user.Match.map((m) => {
            const opponent = m.participants.find((p) => p.id !== userId);
            return {
                id: m.id,
                date: m.createdAt,
                type: m.type,
                opponent: opponent?.username ?? 'N/A',
                result: m.winnerId === userId ? 'WIN' : 'LOSS',
                duration: m.duration,
            };
        });

        return {
            username: user.username,
            rank: user.rank,
            memberSince: user.createdAt,
            selectedRobotId: user.selectedRobotId,
            selectedColor: user.selectedColor,
            totalMatches,
            wins,
            losses,
            winRate,
            matchHistory,
        };
    }

    @UseGuards(AuthGuard)
    @Patch('profile')
    async updateProfile(
        @Req() req: any,
        @Body() body: { robotId: string; color: string },
    ) {
        try {
            await this.usersService.updateLoadout(req.user.sub, body.robotId, body.color);
            return { success: true };
        } catch (err: any) {
            throw new BadRequestException(err.message);
        }
    }

    @UseGuards(AuthGuard)
    @Get('matches/:matchId/replay')
    async getReplay(@Param('matchId') matchId: string, @Req() _req: any) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                replayData: true,
                winnerId: true,
                duration: true,
                createdAt: true,
            },
        });
        if (!match) throw new NotFoundException('Match not found');
        return match;
    }
}
