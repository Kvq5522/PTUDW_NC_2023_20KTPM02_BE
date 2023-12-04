import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddMemberDto, CreateDTO, DeleteMemberDTO } from './dto';

enum roles {
  STUDENT = 1,
  TEACHER = 2,
  OWNER = 3,
  ADMIN = 4,
}

@Injectable()
export class ClassroomService {
  constructor(private prismaService: PrismaService) {}

  async createClassroom(dto: CreateDTO) {
    try {
      const existedInviteCode =
        await this.prismaService.classroomInvitation.findMany({
          select: {
            student_invite_code: true,
            teacher_invite_code: true,
            student_invite_uri_code: true,
            teacher_invite_uri_code: true,
          },
        });

      let newInviteCode = {
        student_invite_code: this.generateRandomString(6),
        teacher_invite_code: this.generateRandomString(6),
        student_invite_uri_code: this.generateRandomString(16),
        teacher_invite_uri_code: this.generateRandomString(16),
      };

      const checkExistedInviteCode = (inviteCode) => {
        return existedInviteCode.some((code) => {
          return (
            code.student_invite_code === inviteCode.student_invite_code ||
            code.teacher_invite_code === inviteCode.teacher_invite_code ||
            code.student_invite_uri_code ===
              inviteCode.student_invite_uri_code ||
            code.teacher_invite_uri_code === inviteCode.teacher_invite_uri_code
          );
        });
      };

      while (checkExistedInviteCode(newInviteCode)) {
        newInviteCode = {
          student_invite_code: this.generateRandomString(6),
          teacher_invite_code: this.generateRandomString(6),
          student_invite_uri_code: this.generateRandomString(16),
          teacher_invite_uri_code: this.generateRandomString(16),
        };
      }

      const classroom = await this.prismaService.classroom.create({
        data: {
          name: dto.classname,
          owner_id: dto.userId,
        },
      });

      const classroomInvitation =
        await this.prismaService.classroomInvitation.create({
          data: {
            classroom_id: classroom.id,
            student_invite_code: newInviteCode.student_invite_code,
            teacher_invite_code: newInviteCode.teacher_invite_code,
            student_invite_uri_code: newInviteCode.student_invite_uri_code,
            teacher_invite_uri_code: newInviteCode.teacher_invite_uri_code,
          },
        });

      if (!classroom || !classroomInvitation) {
        await this.prismaService.classroom.delete({
          where: {
            id: classroom.id,
          },
        });

        throw new ForbiddenException('Cannot create classroom');
      }

      const classroomOwner = await this.prismaService.classroomMember.create({
        data: {
          classroom_id: classroom.id,
          member_id: dto.userId,
          member_role: roles.OWNER,
        },
      });

      if (!classroomOwner) {
        await this.prismaService.classroom.delete({
          where: {
            id: classroom.id,
          },
        });

        throw new ForbiddenException('Cannot create classroom');
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Create classroom successfully',
        metadata: {
          classroom,
          classroomOwner,
          classroomInvitation,
        },
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async getClassroomList(user_id: number) {
    try {
      const classroomList = await this.prismaService.classroomMember.findMany({
        where: {
          member_id: user_id,
        },
        select: {
          classroom_id: true,
          classroom_id_fk: {
            select: {
              name: true,
              owner_id: true,
              owner_fk: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Get classroom list successfully',
        metadata: classroomList,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async getClassroomMember(classroom_id: number) {
    try {
      const classroomMembers =
        await this.prismaService.classroomMember.findMany({
          where: {
            classroom_id: classroom_id,
          },
          select: {
            member_id: true,
            member_role: true,
            member_id_fk: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                avatar: true,
              },
            },
            member_role_fk: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            member_role: 'desc',
          },
        });

      if (!classroomMembers) throw new Error('Cannot get classroom members');

      return {
        statusCode: HttpStatus.OK,
        message: 'Get classroom members successfully',
        metadata: classroomMembers,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async getClassroomInvitationInfo(user_id: number, classroom_id: number) {
    try {
      const classroomInvitation =
        await this.prismaService.classroomInvitation.findFirst({
          where: {
            classroom_id: classroom_id,
          },
        });

      if (!classroomInvitation)
        throw new BadRequestException('Classroom does not exist');

      const classroomMember =
        await this.prismaService.classroomMember.findFirst({
          where: {
            AND: [
              {
                classroom_id: classroom_id,
              },
              {
                member_id: user_id,
              },
            ],
          },
        });

      if (!classroomMember)
        throw new BadRequestException("You're not in this classroom");

      if (classroomMember.member_role < 2) {
        delete classroomInvitation.teacher_invite_code;
        delete classroomInvitation.teacher_invite_uri_code;
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Get classroom invitation info successfully',
        metadata: classroomInvitation,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async joinClassroomByInviteCode(invite_code: string, user_id: number) {
    try {
      const classroomInvitation =
        await this.prismaService.classroomInvitation.findFirst({
          where: {
            OR: [
              {
                student_invite_code: invite_code,
              },
              {
                teacher_invite_code: invite_code,
              },
            ],
          },
        });

      if (!classroomInvitation)
        throw new ForbiddenException('Invite code is invalid');

      const checkExistedMember =
        await this.prismaService.classroomMember.findFirst({
          where: {
            AND: [
              {
                classroom_id: classroomInvitation.classroom_id,
              },
              {
                member_id: user_id,
              },
            ],
          },
        });

      if (checkExistedMember)
        throw new BadRequestException('Already joined classroom');

      const newClassroomMember =
        await this.prismaService.classroomMember.create({
          data: {
            classroom_id: classroomInvitation.classroom_id,
            member_id: user_id,
            member_role:
              classroomInvitation.student_invite_code === invite_code
                ? roles.STUDENT
                : roles.TEACHER,
          },
        });

      if (!newClassroomMember)
        throw new InternalServerErrorException('Cannot join classroom');

      return newClassroomMember;
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async joinClassroomByInviteUri(invite_uri: string, user_id: number) {
    try {
      const classroomInvitation =
        await this.prismaService.classroomInvitation.findFirst({
          where: {
            OR: [
              {
                student_invite_uri_code: invite_uri,
              },
              {
                teacher_invite_uri_code: invite_uri,
              },
            ],
          },
        });

      if (!classroomInvitation)
        throw new ForbiddenException('Invite uri is invalid');

      const checkExistedMember =
        await this.prismaService.classroomMember.findFirst({
          where: {
            AND: [
              {
                classroom_id: classroomInvitation.classroom_id,
              },
              {
                member_id: user_id,
              },
            ],
          },
        });

      if (checkExistedMember)
        throw new BadRequestException('Already joined classroom');

      const newClassroomMember =
        await this.prismaService.classroomMember.create({
          data: {
            classroom_id: classroomInvitation.classroom_id,
            member_id: user_id,
            member_role:
              classroomInvitation.student_invite_uri_code === invite_uri
                ? roles.STUDENT
                : roles.TEACHER,
          },
        });

      if (!newClassroomMember)
        throw new InternalServerErrorException('Cannot join classroom');

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Join classroom successfully',
        metadata: newClassroomMember,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async leaveClassroom(classroom_id: number, user_id: number) {
    try {
      const classroomMember =
        await this.prismaService.classroomMember.findFirst({
          where: {
            AND: [
              {
                classroom_id: classroom_id,
              },
              {
                member_id: user_id,
              },
            ],
          },
        });

      if (!classroomMember)
        throw new BadRequestException('You are not in this classroom');

      const deletedClassroomMember =
        await this.prismaService.classroomMember.delete({
          where: {
            id: classroomMember.id,
          },
        });

      if (classroomMember.member_role === roles.OWNER) {
        const newOwner = await this.prismaService.classroomMember.findFirst({
          where: {
            classroom_id: classroom_id,
          },
          orderBy: {
            member_role: 'desc',
          },
        });

        if (!newOwner)
          throw new InternalServerErrorException('Cannot leave classroom');

        await this.prismaService.classroomMember.update({
          where: {
            id: newOwner.id,
          },
          data: {
            member_role: roles.OWNER,
          },
        });
      }

      if (!deletedClassroomMember)
        throw new InternalServerErrorException('Cannot leave classroom');

      return {
        statusCode: HttpStatus.OK,
        message: 'Leave classroom successfully',
        metadata: deletedClassroomMember,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async addMember(addMemberDTO: AddMemberDto, user_id: number) {
    try {
      // Check if user is existed
      const emails = addMemberDTO.members.map((member) => member.member_email);
      const isExsistedUser = await this.prismaService.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true },
      });

      // Map legal, illegal member to array
      const legalMember = [];
      const illegalMember = addMemberDTO.members
        .map((member) => {
          const existedUser = isExsistedUser.find(
            (user) => user.email === member.member_email,
          );
          if (existedUser) {
            legalMember.push({
              member_id: existedUser.id,
              member_email: member.member_email,
              member_role: member.role_id,
            });
            return null;
          } else {
            return {
              member_email: member.member_email,
              member_role: member.role_id,
              error: 'User does not exist',
            };
          }
        })
        .filter((member) => member !== null);

      //Check if user is in this classroom
      const memberIds = legalMember.map((member) => member.member_id);
      const checkExistedClassMember =
        await this.prismaService.classroomMember.findMany({
          where: {
            classroom_id: addMemberDTO.classroom_id,
            member_id: { in: [...memberIds, user_id] },
          },
        });

      // Check if person who add member is in this classroom
      const personWhoAddMember = checkExistedClassMember.find(
        (member) => member.member_id === user_id,
      );
      if (!personWhoAddMember)
        throw new BadRequestException("You're not in this classroom");

      for (let i = 0; i < legalMember.length; i++) {
        const curMember = legalMember[i];
        const existedMember = checkExistedClassMember.find(
          (member) => member.member_id === curMember.member_id,
        );
        const notPermitted =
          personWhoAddMember.member_role < 2 && curMember.member_role >= 2;

        //Check permission and existed member
        if (existedMember || notPermitted) {
          illegalMember.push({
            member_email: isExsistedUser.find(
              (user) => user.id === curMember.member_id,
            ).email,
            member_role: curMember.member_role,
            error: 'User already in this classroom',
          });

          legalMember.splice(i, 1);
          i--;
        } else {
          await this.prismaService.classroomMember.create({
            data: {
              classroom_id: addMemberDTO.classroom_id,
              member_id: curMember.member_id,
              member_role: curMember.member_role,
            },
          });
        }
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Add member successfully',
        metadata: {
          addedMember: legalMember,
          illegalMember,
        },
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  async deleteMember(dto: DeleteMemberDTO, user_id: number) {
    try {
      const isExsistedUser = await this.prismaService.user.findMany({
        where: { email: { in: dto.member_emails } },
        select: { id: true, email: true },
      });

      const legalMember = [];
      const illegalMember = dto.member_emails
        .map((member) => {
          const existedUser = isExsistedUser.find(
            (user) => user.email === member,
          );
          if (existedUser) {
            legalMember.push({
              member_id: existedUser.id,
              member_email: member,
            });
            return null;
          } else {
            return {
              member_email: member,
              error: 'User does not exist',
            };
          }
        })
        .filter((member) => member !== null);

      const memberIds = legalMember.map((member) => member.member_id);

      const checkExistedClassMember =
        await this.prismaService.classroomMember.findMany({
          where: {
            classroom_id: dto.classroom_id,
            member_id: { in: [...memberIds, user_id] },
          },
        });

      const personWhoDeleteMember = checkExistedClassMember.find(
        (member) => member.member_id === user_id,
      );

      if (!personWhoDeleteMember)
        throw new BadRequestException("You're not in this classroom");

      if (personWhoDeleteMember.member_role < 3)
        throw new ForbiddenException('You cannot delete member');

      for (let i = 0; i < legalMember.length; i++) {
        const curMember = legalMember[i];
        const existedMember = checkExistedClassMember.find(
          (member) => member.member_id === curMember.member_id,
        );

        if (!existedMember) {
          illegalMember.push({
            member_email: isExsistedUser.find(
              (user) => user.id === curMember.member_id,
            ).email,
            error: 'User not in this classroom',
          });

          legalMember.splice(i, 1);
          i--;
        } else {
          await this.prismaService.classroomMember.delete({
            where: {
              id: existedMember.id,
            },
          });
        }
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Delete member successfully',
        metadata: {
          deletedMember: legalMember,
          illegalMember,
        },
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }
      return error;
    }
  }

  generateRandomString(length: number) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }
}
