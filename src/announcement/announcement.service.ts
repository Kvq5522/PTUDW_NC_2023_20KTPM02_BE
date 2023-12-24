import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
                  contains: String(user_id),
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
          OR: [{ to_members: { contains: String(user_id) } }],
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
      });

      return {
        statusCode: 200,
        message: 'Successfully fetched notifications.',
        metadata: announcements,
      };
    } catch (error) {
      console.log(error);
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
      });

    const announcementData = {
      ...announcement,
      current_grade: studentCurrentGrade?.grade ?? 0,
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
        createdAt: 'desc',
      },
    });

    return {
      statusCode: 200,
      message: 'OK',
      metadata: {
        detail: announcementData,
        comments: comments,
      },
    };
  }

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
}
