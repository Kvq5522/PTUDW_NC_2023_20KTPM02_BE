"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const library_1 = require("@prisma/client/runtime/library");
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async signUp(dto) {
        try {
            const hash = await bcrypt.hash(dto.password, 10);
            const user = await this.prisma.user.create({
                data: {
                    ...dto,
                    password: hash,
                },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'User created successfully',
                metadata: user,
            };
        }
        catch (error) {
            if (error instanceof library_1.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return {
                        statusCode: common_1.HttpStatus.CONFLICT,
                        message: 'User already exists',
                        metadata: {},
                    };
                }
            }
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: 'Something went wrong, please try again',
                metadata: {},
            };
        }
    }
    async signIn(dto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email: dto.email,
                },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const match = await bcrypt.compare(dto.password, user.password);
            if (!match)
                throw new common_1.ForbiddenException('Password is wrong');
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'User signed in successfully',
                metadata: {
                    token: await this.signToken(user.id, user.email, user.first_name, user.last_name),
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: error.message,
                    metadata: {},
                };
            }
            if (error instanceof common_1.ForbiddenException) {
                return {
                    statusCode: common_1.HttpStatus.FORBIDDEN,
                    message: error.message,
                    metadata: {},
                };
            }
        }
    }
    signToken(userId, email, first_name, last_name) {
        const payload = { userId, email, first_name, last_name };
        return this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '1d',
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map