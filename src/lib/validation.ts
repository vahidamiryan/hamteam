import { z } from "zod";
import { GOAL_STATUSES, PRIORITIES, TASK_STATUSES } from "./types";

const title = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} نمی‌تواند خالی باشد.`)
    .max(max, `${label} حداکثر ${max} کاراکتر است.`);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به شکل YYYY-MM-DD باشد.");

const nullableIsoDate = isoDate.nullable();

const email = z
  .string()
  .trim()
  .max(120, "ایمیل طولانی است.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "ایمیل معتبر نیست.")
  .or(z.literal(""));

/** فیلدهای انگلیسی اختیاری‌اند؛ محتوا در هر دو زبان نگه داشته می‌شود. */
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const taskCreateSchema = z.object({
  title: title(160, "عنوان تسک"),
  titleEn: optionalText(160),
  description: z.string().max(4000, "توضیحات حداکثر ۴۰۰۰ کاراکتر است.").optional(),
  descriptionEn: optionalText(4000),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().trim().min(1).nullable().optional(),
  goalId: z.string().trim().min(1).nullable().optional(),
  dueDate: nullableIsoDate.optional(),
  blockedReason: z.string().trim().max(300, "دلیل مسدودی طولانی است.").nullable().optional(),
  blockedReasonEn: optionalText(300),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const commentCreateSchema = z
  .object({
    authorId: z.string().trim().min(1, "نویسنده‌ی کامنت مشخص نیست."),
    body: z.string().trim().max(4000, "کامنت حداکثر ۴۰۰۰ کاراکتر است.").default(""),
    bodyEn: optionalText(4000),
    attachments: z
      .array(z.string())
      .max(6, "حداکثر ۶ تصویر هم‌زمان قابل پیوست است.")
      .optional(),
  })
  .refine(
    (data) => data.body.length > 0 || (data.attachments && data.attachments.length > 0),
    {
      message: "متن کامنت یا حداقل یک تصویر باید ارسال شود.",
    },
  );

export const memberCreateSchema = z.object({
  name: title(80, "نام عضو"),
  nameEn: optionalText(80),
  role: z.string().trim().max(60, "عنوان نقش حداکثر ۶۰ کاراکتر است.").optional(),
  roleEn: optionalText(60),
  email: email.optional(),
  avatarIndex: z.number().int().min(0).max(11).optional(),
});

export const memberUpdateSchema = memberCreateSchema.partial();

export const goalCreateSchema = z.object({
  title: title(140, "عنوان هدف"),
  titleEn: optionalText(140),
  description: z.string().max(2000, "توضیحات حداکثر ۲۰۰۰ کاراکتر است.").optional(),
  descriptionEn: optionalText(2000),
  ownerId: z.string().trim().min(1).nullable().optional(),
  targetDate: nullableIsoDate.optional(),
  status: z.enum(GOAL_STATUSES).optional(),
});

export const goalUpdateSchema = goalCreateSchema.partial();

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type GoalCreateInput = z.infer<typeof goalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
