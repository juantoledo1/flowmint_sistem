import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

export interface AIProvider {
  generateResponse(userMessage: string, systemMessage?: string): Promise<string>;
  generateStream(userMessage: string, systemMessage?: string): AsyncGenerator<string>;
}

@Injectable()
export class CerebrasService implements AIProvider {
  private readonly logger = new Logger(CerebrasService.name);
  private cerebras: Cerebras;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('CEREBRAS_API_KEY');
    if (!apiKey) {
      this.logger.warn('CEREBRAS_API_KEY is not configured');
    }
    
    this.cerebras = new Cerebras({
      apiKey: apiKey
    });
  }

  async generateResponse(userMessage: string, systemMessage?: string): Promise<string> {
    try {
      const response = await this.cerebras.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemMessage || "Eres un asistente útil para FlowMint, un sistema de gestión de turnos. Ayuda a los usuarios con preguntas sobre cómo usar la aplicación, gestionar turnos, clientes, empleados, servicios y reportes de ganancias. Responde en español de forma clara, directa y concisa."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        model: 'gpt-oss-120b',
        max_completion_tokens: 32768,
        temperature: 1,
        top_p: 1,
        reasoning_effort: "medium"
      });

      // Type assertion to handle the unknown type
      const responseAny: any = response;
      return responseAny.choices[0]?.message?.content || "Lo siento, no pude procesar tu solicitud en este momento.";
    } catch (error) {
      this.logger.error(`Error calling Cerebras API: ${error.message}`);
      throw error;
    }
  }

  async *generateStream(userMessage: string, systemMessage?: string): AsyncGenerator<string> {
    try {
      const stream = await this.cerebras.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemMessage || "Eres un asistente útil para FlowMint, un sistema de gestión de turnos. Ayuda a los usuarios con preguntas sobre cómo usar la aplicación, gestionar turnos, clientes, empleados, servicios y reportes de ganancias. Responde en español de forma clara, directa y concisa."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        model: 'gpt-oss-120b',
        stream: true,
        max_completion_tokens: 32768,
        temperature: 1,
        top_p: 1,
        reasoning_effort: "medium"
      });

      for await (const chunk of stream) {
        // Type assertion to handle the unknown type
        const chunkAny: any = chunk;
        const content = chunkAny.choices[0]?.delta?.content || '';
        yield content;
      }
    } catch (error) {
      this.logger.error(`Error streaming from Cerebras API: ${error.message}`);
      throw error;
    }
  }
}