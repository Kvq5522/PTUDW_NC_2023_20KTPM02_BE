import { AuthService } from './auth.service';
import { AuthDto } from './dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(dto: AuthDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
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
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
        metadata: {};
    }>;
    signIn(dto: AuthDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
        metadata: {
            token: string;
        };
    } | {
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
        metadata: {
            token?: undefined;
        };
    }>;
}
