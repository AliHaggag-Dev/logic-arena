import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const ALLOWED_ROBOT_IDS = ['unit-01', 'unit-02'];
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, username: true, rank: true, createdAt: true }, // Exclude passwordHash
        });
    }

    async findOneByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
            select: { id: true, email: true, username: true, rank: true, createdAt: true }, // Exclude passwordHash
        });
    }

    async updateLoadout(userId: string, robotId: string, color: string): Promise<void> {
        if (!ALLOWED_ROBOT_IDS.includes(robotId)) {
            throw new Error(`Invalid robotId "${robotId}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`);
        }
        if (!COLOR_REGEX.test(color)) {
            throw new Error(`Invalid color "${color}". Must match #rrggbb format.`);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { selectedRobotId: robotId, selectedColor: color },
        });
    }
}