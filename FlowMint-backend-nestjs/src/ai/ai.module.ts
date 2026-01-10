import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GroqService } from './groq.service';
import { CerebrasService } from './cerebras.service';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    GroqService,
    CerebrasService,
    AiOrchestratorService,
  ],
  exports: [
    AiService,
    GroqService,
    CerebrasService,
    AiOrchestratorService,
  ],
})
export class AiModule {}