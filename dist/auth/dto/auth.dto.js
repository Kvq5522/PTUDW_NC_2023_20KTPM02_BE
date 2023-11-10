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
exports.AuthDto = void 0;
const class_validator_1 = require("class-validator");
class AuthDto {
}
exports.AuthDto = AuthDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ groups: ['sign-up', 'sign-in'] }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AuthDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ groups: ['sign-up', 'sign-in'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ groups: ['sign-up'] }),
    (0, class_validator_1.ValidateIf)((o) => o.first_name !== undefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ groups: ['sign-up'] }),
    (0, class_validator_1.ValidateIf)((o) => o.last_name !== undefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.phone_number !== undefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthDto.prototype, "phone_number", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.address !== undefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.age !== undefined),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AuthDto.prototype, "age", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.gender !== undefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthDto.prototype, "gender", void 0);
//# sourceMappingURL=auth.dto.js.map