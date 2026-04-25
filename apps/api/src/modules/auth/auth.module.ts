import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Conditionally include GoogleStrategy only when credentials are configured
const optionalProviders = [];
if (process.env.GOOGLE_CLIENT_ID) {
  optionalProviders.push(GoogleStrategy);
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRY', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...optionalProviders, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
