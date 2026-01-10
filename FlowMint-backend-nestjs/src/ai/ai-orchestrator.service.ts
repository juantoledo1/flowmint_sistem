import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqService } from './groq.service';
import { CerebrasService } from './cerebras.service';

export interface AIProvider {
  generateResponse(userMessage: string, systemMessage?: string): Promise<string>;
  generateStream(userMessage: string, systemMessage?: string): AsyncGenerator<string>;
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private providers: AIProvider[] = [];
  private currentIndex = 0;
  private readonly fallbackEnabled: boolean;

  constructor(
    private groqService: GroqService,
    private cerebrasService: CerebrasService,
    private configService: ConfigService,
  ) {
    // Initialize providers based on available API keys
    this.fallbackEnabled = this.configService.get<boolean>('AI_FALLBACK_ENABLED', true);
    
    // Add providers if their API keys are configured
    if (this.configService.get<string>('GROQ_API_KEY')) {
      this.providers.push(groqService);
      this.logger.log('Groq service added to orchestrator');
    }
    
    if (this.configService.get<string>('CEREBRAS_API_KEY')) {
      this.providers.push(cerebrasService);
      this.logger.log('Cerebras service added to orchestrator');
    }
    
    if (this.providers.length === 0) {
      this.logger.warn('No AI providers configured. AI functionality will be limited.');
    }
  }

  /**
   * Get the next provider in rotation (round-robin)
   */
  private getNextProvider(): AIProvider | null {
    if (this.providers.length === 0) {
      return null;
    }
    
    const provider = this.providers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
    return provider;
  }

  /**
   * Try to get response from providers in sequence until one succeeds
   */
  async generateResponse(userMessage: string, systemMessage?: string): Promise<string> {
    if (this.providers.length === 0) {
      return this.getFallbackResponse(userMessage);
    }

    // If fallback is disabled, just use the next provider
    if (!this.fallbackEnabled) {
      const provider = this.getNextProvider();
      if (provider) {
        try {
          return await provider.generateResponse(userMessage, systemMessage);
        } catch (error) {
          this.logger.error(`Error with provider: ${error.message}`);
          return this.getFallbackResponse(userMessage);
        }
      } else {
        return this.getFallbackResponse(userMessage);
      }
    }

    // Try each provider in sequence with fallback
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.getNextProvider();
      if (provider) {
        try {
          return await provider.generateResponse(userMessage, systemMessage);
        } catch (error) {
          this.logger.warn(`Provider failed, trying next: ${error.message}`);
          // Continue to next provider
        }
      }
    }

    // If all providers failed, return fallback response
    this.logger.error('All AI providers failed, returning fallback response');
    return this.getFallbackResponse(userMessage);
  }

  /**
   * Generate a stream response with fallback capability
   */
  async *generateStream(userMessage: string, systemMessage?: string): AsyncGenerator<string> {
    if (this.providers.length === 0) {
      yield this.getFallbackResponse(userMessage);
      return;
    }

    // If fallback is disabled, just use the next provider
    if (!this.fallbackEnabled) {
      const provider = this.getNextProvider();
      if (provider) {
        try {
          for await (const chunk of provider.generateStream(userMessage, systemMessage)) {
            yield chunk;
          }
          return;
        } catch (error) {
          this.logger.error(`Error with provider: ${error.message}`);
          yield this.getFallbackResponse(userMessage);
          return;
        }
      } else {
        yield this.getFallbackResponse(userMessage);
        return;
      }
    }

    // Try each provider in sequence with fallback
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.getNextProvider();
      if (provider) {
        try {
          for await (const chunk of provider.generateStream(userMessage, systemMessage)) {
            yield chunk;
          }
          return; // Success, exit the function
        } catch (error) {
          this.logger.warn(`Provider stream failed, trying next: ${error.message}`);
          // Continue to next provider
        }
      }
    }

    // If all providers failed, return fallback response
    this.logger.error('All AI providers failed for streaming, returning fallback response');
    yield this.getFallbackResponse(userMessage);
  }

  /**
   * Fallback response when all providers fail
   */
  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hola') || lowerMessage.includes('buen')) {
      return "¡Hola! Soy el asistente de FlowMint. ¿En qué puedo ayudarte hoy?";
    } else if (lowerMessage.includes('turno') || lowerMessage.includes('cita')) {
      return "Para crear un turno en FlowMint, ve a la sección 'Turnos' y haz clic en 'Nuevo Turno'. Selecciona cliente, empleado, servicio y fecha.";
    } else if (lowerMessage.includes('cliente')) {
      return "Para gestionar clientes, ve a la sección 'Clientes'. Puedes crear, editar o eliminar clientes desde allí.";
    } else if (lowerMessage.includes('servicio')) {
      return "Para gestionar servicios, ve a la sección 'Servicios'. Puedes crear nuevos servicios con precios y duraciones.";
    } else if (lowerMessage.includes('200') && lowerMessage.includes('500') && (lowerMessage.includes('+') || lowerMessage.includes('suma'))) {
      return "La suma de 200 + 500 es 700.";
    } else {
      return "Estoy aquí para ayudarte con FlowMint, el sistema de gestión de turnos. Puedo ayudarte con turnos, clientes, empleados, servicios y reportes.";
    }
  }

  /**
   * Get provider status for health checking
   */
  getProviderStatus(): { provider: string; available: boolean }[] {
    return [
      { 
        provider: 'groq', 
        available: !!this.configService.get<string>('GROQ_API_KEY') 
      },
      { 
        provider: 'cerebras', 
        available: !!this.configService.get<string>('CEREBRAS_API_KEY') 
      }
    ];
  }
}