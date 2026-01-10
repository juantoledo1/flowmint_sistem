import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';

export interface AIProvider {
  generateResponse(userMessage: string, systemMessage?: string): Promise<string>;
  generateStream(userMessage: string, systemMessage?: string): AsyncGenerator<string>;
}

@Injectable()
export class GroqService implements AIProvider {
  private readonly logger = new Logger(GroqService.name);
  private groq: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY is not configured');
    }
    
    this.groq = new Groq({
      apiKey: apiKey,
    });
  }

  async generateResponse(userMessage: string, systemMessage?: string): Promise<string> {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
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
        model: "moonshotai/kimi-k2-instruct-0905",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: false
      });

      return chatCompletion.choices[0]?.message?.content || "Lo siento, no pude procesar tu solicitud en este momento.";
    } catch (error) {
      this.logger.error(`Error calling Groq API: ${error.message}`);
      throw error;
    }
  }

  async *generateStream(userMessage: string, systemMessage?: string): AsyncGenerator<string> {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
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
        model: "moonshotai/kimi-k2-instruct-0905",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: true
      });

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        yield content;
      }
    } catch (error) {
      this.logger.error(`Error streaming from Groq API: ${error.message}`);
      throw error;
    }
  }
}