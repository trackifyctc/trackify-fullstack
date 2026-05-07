import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, LoginDto, ChangePasswordDto, LoginResponseDto } from '@/dtos/auth.dto';
import { User } from '@/entities';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<LoginResponseDto> {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.usersService.create(createUserDto);
    const token = this.jwtService.sign({ sub: user.id });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: '1h',
      user: this.mapUserToResponse(user),
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: '1h',
      user: this.mapUserToResponse(user),
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    if (changePasswordDto.new_password !== changePasswordDto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      changePasswordDto.old_password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    await this.usersService.changePassword(userId, changePasswordDto.new_password);
  }

  private mapUserToResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }
}
