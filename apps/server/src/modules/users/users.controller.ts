import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Controller('users')
export class UsersController {
    constructor(private prisma: PrismaService) { }

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
}
