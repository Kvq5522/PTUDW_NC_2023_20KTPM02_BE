import { HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    signUp(dto: AuthDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        metadata: {
            id: number;
            created_at: Date;
            updated_at: Date;
            email: string;
            first_name: string;
            last_name: string;
        };
    } | {
        statusCode: HttpStatus;
        message: string;
        metadata: {};
    }>;
    signIn(dto: AuthDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        metadata: {
            token: string;
        };
    } | {
        statusCode: HttpStatus;
        message: string;
        metadata: {
            token?: undefined;
        };
    }>;
    signToken(userId: number, email: string, first_name: string, last_name: string): Promise<string>;
}
