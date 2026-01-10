import { Injectable } from '@nestjs/common';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Injectable()
export class AiService {
  constructor(private aiOrchestratorService: AiOrchestratorService) {}

  async getAIResponse(userMessage: string): Promise<string> {
    return await this.aiOrchestratorService.generateResponse(
      userMessage,
      "Eres un asistente útil para FlowMint, un sistema de gestión de turnos. Ayuda a los usuarios con preguntas sobre cómo usar la aplicación, gestionar turnos, clientes, empleados, servicios y reportes de ganancias. Responde en español de forma clara, directa y concisa. No proporciones análisis interno ni expliques tu proceso de pensamiento. Para preguntas simples, responde directamente sin rodeos."
    );
  }
}