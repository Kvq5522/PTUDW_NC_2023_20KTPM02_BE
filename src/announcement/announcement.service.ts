import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prismaService: PrismaService) {}

  async getClassroomAnnouncements(classroom_id: number, user_id: number) {
    try {
      let classroomAnnouncements =
        await this.prismaService.classroomAnnouncement.findMany({
          where: {
            classroom_id: classroom_id,
            OR: [
              {
                to_members: {
                  startsWith: `${String(user_id)},`,
                },
              },
              {
                to_members: {
                  endsWith: `,${String(user_id)}`,
                },
              },
              {
                to_members: {
                  equals: String(user_id),
                },
              },
              {
                created_by: user_id,
              },
            ],
          },
          select: {
            id: true,
            description: true,
            title: true,
            created_by: true,
            grade_category: true,
            grade_category_fk: {
              select: {
                name: true,
              },
            },
            created_by_fk: {
              select: {
                first_name: true,
                last_name: true,
                avatar: true,
              },
            },
            type: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      const countComments =
        await this.prismaService.announcementComment.groupBy({
          where: {
            announcement_id: {
              in: classroomAnnouncements.map((x) => x.id),
            },
          },
          by: ['announcement_id'],
          _count: {
            announcement_id: true,
          },
        });

      classroomAnnouncements = classroomAnnouncements.map((item) => {
        return {
          ...item,
          comment_count:
            countComments.find((x) => x.announcement_id === item.id)?._count
              ?.announcement_id ?? 0,
        };
      });

      return {
        statusCode: 200,
        message: 'OK',
        metadata: classroomAnnouncements,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async getNotifications(user_id: number) {
    try {
      const announcements = await this.prismaService.notification.findMany({
        where: {
          OR: [
            {
              to_members: {
                startsWith: `${String(user_id)},`,
              },
            },
            {
              to_members: {
                endsWith: `,${String(user_id)}`,
              },
            },
            {
              to_members: {
                equals: String(user_id),
              },
            },
          ],
        },
        select: {
          title: true,
          to_members: true,
          created_at: true,
          updated_at: true,
          classroom_id: true,
          classroom_fk: {
            select: {
              name: true,
            },
          },
          announcement_id: true,
          has_seen: true,
          type: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return {
        statusCode: 200,
        message: 'Successfully fetched notifications.',
        metadata: announcements,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async getAnnouncementDetail(classroom_id: number, announcement_id: number) {
    const announcement =
      await this.prismaService.classroomAnnouncement.findFirst({
        where: {
          id: announcement_id,
          classroom_id: classroom_id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          expected_grade: true,
          grade_category: true,
          grade_category_fk: {
            select: {
              name: true,
            },
          },
          classroom_id: true,
          classroom_id_fk: {
            select: {
              name: true,
            },
          },
          created_by: true,
          created_by_fk: {
            select: {
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
          type: true,
          createdAt: true,
        },
      });

    const requestStudent = await this.prismaService.user.findFirst({
      where: {
        id: announcement.created_by,
      },
    });

    const studentCurrentGrade =
      await this.prismaService.studentGradeDetail.findFirst({
        where: {
          classroom_id: classroom_id,
          grade_category: announcement.grade_category,
          student_id_fk: {
            email: requestStudent.email,
          },
        },
        select: {
          grade: true,
          student_id: true,
          student_id_fk: {
            select: {
              email: true,
            },
          },
        },
      });

    const announcementData = {
      ...announcement,
      current_grade: studentCurrentGrade?.grade ?? 0,
      account_student_id: requestStudent.student_id ?? 0,
      student_id: studentCurrentGrade?.student_id ?? 0,
      student_id_fk: { email: studentCurrentGrade?.student_id_fk?.email ?? '' },
    };

    const comments = await this.prismaService.announcementComment.findMany({
      where: {
        announcement_id: announcement_id,
      },
      select: {
        id: true,
        description: true,
        user_id: true,
        user_id_fk: {
          select: {
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const checkIfUserInClassroom =
      await this.prismaService.classroomMember.findFirst({
        where: {
          classroom_id: classroom_id,
          member_id: announcementData.created_by,
        },
      });

    if (!checkIfUserInClassroom) {
      throw new ForbiddenException('You are not in this classroom');
    }

    return {
      statusCode: 200,
      message: 'OK',
      metadata: {
        detail: announcementData,
        comments: comments,
        role: checkIfUserInClassroom.member_role,
      },
    };
  }

  async createComment(
    announcement_id: number,
    user: User,
    description: string,
  ) {
    try {
      const currentAnnouncement =
        await this.prismaService.classroomAnnouncement.findFirst({
          where: {
            id: announcement_id,
          },
        });

      const newComment = this.prismaService.announcementComment.create({
        data: {
          user_id: user.id,
          description: description,
          announcement_id: announcement_id,
        },
      });

      //create new notification
      const toMembers = currentAnnouncement.to_members;
      const createdBy = currentAnnouncement.created_by;
      let notiToMembers = toMembers.split(',');

      //remove current user from toMembers, and add craetedBy
      notiToMembers.push(String(createdBy));
      const currentUserIndex = notiToMembers.indexOf(String(user.id));

      //Remove current user from toMembers
      if (currentUserIndex > -1) {
        notiToMembers.splice(currentUserIndex, 1);
      }
      notiToMembers = [...new Set(notiToMembers)];

      const newNotification = this.prismaService.notification.create({
        data: {
          title: `${user.first_name} ${user.last_name} replies to the announcement`,
          description: `${user.first_name} ${user.last_name} replies to the announcement`,
          to_members: notiToMembers.join(','),
          classroom_id: currentAnnouncement.classroom_id,
          announcement_id: currentAnnouncement.id,
          has_seen: '',
          type: 'GRADE_REVIEW',
        },
      });

      const transaction = await this.prismaService.$transaction([
        newComment,
        newNotification,
      ]);

      return {
        statusCode: 201,
        message: 'Successfully created comment.',
        metadata: transaction[0],
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async getComments(announcement_id: number) {
    try {
      const comments = await this.prismaService.announcementComment.findMany({
        where: {
          announcement_id: announcement_id,
        },
        select: {
          id: true,
          description: true,
          user_id: true,
          user_id_fk: {
            select: {
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        statusCode: 200,
        message: 'Successfully fetched comments.',
        metadata: comments,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  //check authorization

  async isTeacherAuthorization(classroom_id: number, user_id: number) {
    try {
      const existedTeacher = await this.prismaService.classroomMember.findFirst(
        {
          where: {
            classroom_id: classroom_id,
            member_id: user_id,
          },
        },
      );

      if (!existedTeacher || existedTeacher.member_role < 2)
        throw new Error('Not authorized');

      return true;
    } catch (error) {
      return false;
    }
  }

  async isMemberOfClassroom(classroom_id: number, user_id: number) {
    try {
      const existedMember = await this.prismaService.classroomMember.findFirst({
        where: {
          classroom_id: classroom_id,
          member_id: user_id,
        },
      });

      if (!existedMember) throw new Error('Not a member of this classroom');

      return true;
    } catch (error) {
      return false;
    }
  }

  async isRelatedToAnnouncement(announcement_id: number, user_id: number) {
    try {
      const existedAnnouncement =
        await this.prismaService.classroomAnnouncement.findFirst({
          where: {
            id: announcement_id,
          },
        });

      if (!existedAnnouncement)
        throw new Error("You're not related to this announcement");

      const createdBy = existedAnnouncement.created_by;
      const toMembers = existedAnnouncement.to_members;

      if (createdBy !== user_id && !toMembers.includes(String(user_id)))
        throw new Error("You're not related to this announcement");

      return true;
    } catch (error) {
      return false;
    }
  }
}
