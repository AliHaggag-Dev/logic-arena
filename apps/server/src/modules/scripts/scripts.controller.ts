import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { AuthGuard } from '../../common/auth.guard';

@UseGuards(AuthGuard)
@Controller('scripts')
export class ScriptsController {
    constructor(private scriptsService: ScriptsService) { }

    @Post()
    async create(@Req() req, @Body() body: { title: string; content: string }) {
        const userId = req.user.sub; // Assuming 'sub' contains the user ID from the JWT payload
        return this.scriptsService.createScript(userId, body.title, body.content);
    }

    @Get(":id")
    async findOne(@Param("id") id: string, @Req() req) {
        const userId = req.user.sub;
        return this.scriptsService.getScriptById(id, userId);
    }

    @Get()
    async findAll(@Req() req) {
        const userId = req.user.sub;
        return this.scriptsService.getUserScripts(userId);
    }
    @Put(':id')
    async update(@Param('id') id: string, @Req() req, @Body() body: { title: string; content: string }) {
        const userId = req.user.sub;
        return this.scriptsService.updateScript(id, userId, body.title, body.content);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req) {
        const userId = req.user.sub;
        return this.scriptsService.deleteScript(id, userId);
    }
}