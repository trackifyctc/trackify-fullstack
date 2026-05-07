import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // In a real application, you'd validate this against the database
    // For now, we'll just check if it's a non-empty string
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Store the API key in the request for later use
    request['apiKey'] = apiKey;
    return true;
  }
}
