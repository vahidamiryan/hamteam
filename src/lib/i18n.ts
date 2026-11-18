/**
 * دوزبانه‌بودن برنامه: هر رشته یک جفت [فارسی، انگلیسی] است تا هر دو زبان
 * کنار هم نگه داشته شوند و از قلم‌افتادن ترجمه جلوگیری شود.
 */

export type Locale = "fa" | "en";
export type Direction = "rtl" | "ltr";

export const LOCALES: readonly Locale[] = ["fa", "en"] as const;
export const DEFAULT_LOCALE: Locale = "fa";

/** کلید ذخیره‌سازی زبان در مرورگر (اسکریپت layout هم از همین کلید می‌خواند). */
export const LOCALE_STORAGE_KEY = "hamteam:locale";

export function dirOf(locale: Locale): Direction {
  return locale === "fa" ? "rtl" : "ltr";
}

export function isLocale(value: unknown): value is Locale {
  return value === "fa" || value === "en";
}

const messages = {
  // ── عمومی
  "app.name": ["هم‌تیم", "HamTeam"],
  "app.tagline": ["مدیریت تسک و همکاری تیمی", "Task and team collaboration"],
  "app.loading": ["در حال بارگذاری فضای کاری…", "Loading workspace…"],
  "app.loadError": ["بارگذاری فضای کاری ناموفق بود", "Could not load the workspace"],
  "app.language": ["زبان", "Language"],
  "app.lastUpdated": ["آخرین تغییر {when}", "Last updated {when}"],
  "app.fa": ["فارسی", "فارسی"],
  "app.en": ["English", "English"],
  "theme.label": ["حالت نمایش", "Theme"],
  "theme.toggle": ["انتخاب تم (روشن / تاریک)", "Toggle theme"],
  "theme.light": ["روشن", "Light"],
  "theme.dark": ["تاریک", "Dark"],
  "theme.system": ["سیستم", "System"],

  // ── ناوبری و نماها
  "nav.views": ["نماها", "Views"],
  "nav.board": ["برد کارها", "Board"],
  "nav.table": ["جدول", "Table"],
  "nav.people": ["افراد", "People"],
  "nav.goals": ["اهداف", "Goals"],

  // ── کنش‌ها
  "action.newTask": ["تسک جدید", "New task"],
  "action.newMember": ["افزودن عضو", "Add member"],
  "action.newGoal": ["هدف جدید", "New goal"],
  "action.createTask": ["ساخت تسک", "Create task"],
  "action.save": ["ذخیره", "Save"],
  "action.cancel": ["انصراف", "Cancel"],
  "action.delete": ["حذف", "Delete"],
  "action.edit": ["ویرایش", "Edit"],
  "action.reset": ["بازنشانی داده‌ها", "Reset data"],
  "action.retry": ["تلاش دوباره", "Try again"],
  "action.send": ["ارسال", "Send"],
  "action.thisIsMe": ["این من هستم", "This is me"],
  "action.filterBoard": ["دیدن تسک‌های این عضو", "See this member's tasks"],
  "action.markAchieved": ["محقق شد", "Mark achieved"],
  "action.viewTasks": ["تسک‌های این عضو", "This member's tasks"],
  "action.addNew": ["افزودن", "Add"],
  "action.clear": ["پاک کردن", "Clear"],
  "action.openTask": ["باز کردن تسک", "Open task"],
  "action.more": ["بیشتر", "More"],

  // ── وضعیت‌ها
  "status.backlog": ["بک‌لاگ", "Backlog"],
  "status.in_progress": ["در حال انجام", "In progress"],
  "status.pending": ["در انتظار", "Pending"],
  "status.blocked": ["مسدود", "Blocked"],
  "status.done": ["انجام‌شده", "Done"],
  "status.backlogHint": ["هنوز شروع نشده", "Not started yet"],
  "status.in_progressHint": ["در دست کار", "Work in progress"],
  "status.pendingHint": ["منتظر عامل بیرونی", "Waiting on someone else"],
  "status.blockedHint": ["جلوی کار گرفته شده", "Cannot move forward"],
  "status.doneHint": ["تمام شده", "Finished"],

  // ── اولویت‌ها
  "priority.low": ["کم", "Low"],
  "priority.medium": ["متوسط", "Medium"],
  "priority.high": ["زیاد", "High"],
  "priority.urgent": ["فوری", "Urgent"],

  // ── اهداف
  "goalStatus.active": ["در جریان", "Active"],
  "goalStatus.achieved": ["محقق‌شده", "Achieved"],
  "goalStatus.paused": ["متوقف", "Paused"],

  // ── آمار
  "stats.total": ["کل تسک‌ها", "Total tasks"],
  "stats.inProgress": ["در حال انجام", "In progress"],
  "stats.blocked": ["مسدود", "Blocked"],
  "stats.overdue": ["سررسید گذشته", "Overdue"],
  "stats.unassigned": ["بدون مسئول", "Unassigned"],
  "stats.open": ["باز", "Open"],
  "stats.late": ["عقب‌افتاده", "Late"],

  // ── فیلترها
  "filter.search": ["جست‌وجو در تسک‌ها", "Search tasks"],
  "filter.all": ["همه", "All"],
  "filter.title": ["فیلترها", "Filters"],
  "filter.assignee": ["مسئول", "Assignee"],
  "filter.onlyMine": ["فقط تسک‌های من", "Only my tasks"],
  "filter.onlyOverdue": ["فقط سررسید گذشته", "Only overdue"],
  "filter.clear": ["پاک کردن فیلترها", "Clear filters"],
  "filter.results": ["{count} تسک", "{count} tasks"],
  "filter.none": ["هیچ تسکی با این فیلترها پیدا نشد", "No tasks match these filters"],
  "filter.noneHint": ["فیلترها را پاک کنید یا تسک تازه بسازید.", "Clear the filters or create a task."],

  // ── برد
  "board.empty": ["ستون خالی است", "Nothing here yet"],
  "board.dropHint": ["کارت‌ها را بکشید و رها کنید", "Drag cards between columns"],
  "board.addTo": ["افزودن به «{status}»", "Add to {status}"],
  "board.columnCount": ["{count} تسک", "{count} tasks"],

  // ── تسک
  "task.title": ["عنوان تسک", "Task title"],
  "task.newDescription": [
    "عنوان، مسئول و سررسید را مشخص کنید؛ بقیه را بعداً هم می‌توانید تغییر دهید.",
    "Set the title, owner and due date. Everything else can change later.",
  ],
  "task.titlePlaceholder": [
    "مثلاً: آماده‌سازی گزارش هفتگی تیم",
    "e.g. Prepare the weekly team report",
  ],
  "task.description": ["توضیحات", "Description"],
  "task.descriptionPlaceholder": [
    "توضیحات، معیار پذیرش یا یادداشت‌های کار را اینجا بنویسید…",
    "Notes, acceptance criteria or context…",
  ],
  "task.assignee": ["مسئول", "Assignee"],
  "task.unassigned": ["بدون مسئول", "Unassigned"],
  "task.status": ["وضعیت", "Status"],
  "task.priority": ["اولویت", "Priority"],
  "task.due": ["سررسید", "Due date"],
  "task.goal": ["هدف", "Goal"],
  "task.noGoal": ["بدون هدف", "No goal"],
  "task.blocker": ["دلیل مسدودی", "Blocked because"],
  "task.blockerPlaceholder": [
    "مثلاً: منتظر پاسخ تیم زیرساخت هستیم…",
    "e.g. Waiting for the infra team…",
  ],
  "task.dueJalali": ["سررسید به تاریخ شمسی: {date}", "Due date: {date}"],
  "task.created": ["ساخته‌شده {when}", "Created {when}"],
  "task.updated": ["آخرین تغییر {when}", "Updated {when}"],
  "task.delete": ["حذف تسک", "Delete task"],
  "task.deleteTitle": ["این تسک حذف شود؟", "Delete this task?"],
  "task.deleteDescription": [
    "تسک و همهٔ گفت‌وگوهای آن برای همیشه پاک می‌شوند.",
    "The task and all of its messages will be deleted permanently.",
  ],
  "task.comments": ["همفکری و کامنت‌ها", "Discussion"],
  "task.commentsCount": ["{count} پیام", "{count} messages"],
  "task.noComments": [
    "هنوز گفت‌وگویی ثبت نشده. اولین پرسش یا تصمیم را بنویسید.",
    "No messages yet. Start with a question or a decision.",
  ],
  "task.commentPlaceholder": [
    "پرسش، پیشنهاد یا تصمیم تیم را بنویسید… (از @ برای منشن استفاده کنید)",
    "Write a question, suggestion or decision… (use @ to mention)",
  ],
  "task.mention": ["منشن عضو", "Mention member"],
  "task.mentionHint": ["تایپ @ برای منشن هم‌تیمی‌ها", "Type @ to mention team members"],
  "task.uploadImage": ["پیوست تصویر", "Attach image"],
  "task.dropImage": ["تصویر را اینجا رها کنید", "Drop image here"],
  "task.pastingImage": ["در حال آماده‌سازی تصویر…", "Processing image…"],
  "task.removeAttachment": ["حذف تصویر", "Remove image"],
  "task.tracking": ["در حال پیگیری", "Tracking"],
  "task.hasChanges": ["تغییر جدید", "New update"],
  "task.mentionedYou": ["منشن شما", "Mentioned you"],
  "task.markAllRead": ["دیدم (علامت‌گذاری همه)", "Mark all as seen"],
  "filter.trackingOnly": ["تغییرات جدید و پیگیری", "Tracking & new updates"],
  "filter.onlyMentioned": ["منشن‌های من", "My mentions"],
  "activity.newUpdates": ["{count} تسک تغییر جدید دارند", "{count} tasks have updates"],
  "task.commentHint": ["برای ارسال سریع", "to send"],
  "task.sendAs": ["ارسال به‌عنوان {name}", "Sending as {name}"],
  "task.pickMember": [
    "برای کامنت نوشتن، عضو فعال را انتخاب کنید.",
    "Pick who you are to post a message.",
  ],
  "task.deletedMember": ["عضو حذف‌شده", "Removed member"],
  "task.blockedBanner": ["این تسک مسدود است", "This task is blocked"],
  "task.panelTitle": ["جزئیات تسک", "Task details"],

  // ── تاریخ‌ها
  "date.none": ["بدون تاریخ", "No date"],
  "date.noneDue": ["بدون سررسید", "No due date"],
  "date.today": ["امروز", "Today"],
  "date.tomorrow": ["فردا", "Tomorrow"],
  "date.nextWeek": ["هفته بعد", "Next week"],
  "date.pick": ["انتخاب تاریخ", "Pick a date"],
  "date.clear": ["حذف تاریخ", "Clear date"],
  "date.prevMonth": ["ماه قبل", "Previous month"],
  "date.nextMonth": ["ماه بعد", "Next month"],
  "due.overdue": ["{count} روز گذشته", "{count} days late"],
  "due.yesterday": ["دیروز گذشته", "Yesterday"],
  "due.today": ["امروز", "Today"],
  "due.tomorrow": ["فردا", "Due tomorrow"],
  "due.inDays": ["{count} روز مانده", "In {count} days"],
  "due.none": ["بدون سررسید", "No due date"],
  "time.justNow": ["چند لحظه پیش", "just now"],
  "time.minutes": ["{count} دقیقه پیش", "{count} min ago"],
  "time.hours": ["{count} ساعت پیش", "{count} h ago"],
  "time.yesterday": ["دیروز", "yesterday"],
  "time.days": ["{count} روز پیش", "{count} days ago"],

  // ── افراد
  "people.heading": ["افراد تیم", "Team members"],
  "people.description": [
    "{count} نفر در تیم. هر تسک می‌تواند به یکی از آن‌ها سپرده شود.",
    "{count} in the team. Any task can be assigned to one of them.",
  ],
  "people.you": ["شما", "You"],
  "people.noOpen": ["تسک باز ندارد", "No open tasks"],
  "people.doneOf": ["{done} تسک تمام‌شده از {total}", "{done} of {total} done"],
  "people.empty": ["هنوز عضوی اضافه نشده", "No members yet"],
  "people.emptyHint": ["اولین هم‌تیمی را اضافه کنید.", "Add your first teammate."],
  "people.addCard": ["افزودن عضو جدید", "Add a new member"],
  "member.name": ["نام", "Name"],
  "member.namePlaceholder": ["مثلاً: سارا محمدی", "e.g. Sara Mohammadi"],
  "member.role": ["نقش", "Role"],
  "member.rolePlaceholder": ["مثلاً: مدیر محصول", "e.g. Product manager"],
  "member.email": ["ایمیل", "Email"],
  "member.avatar": ["آواتار", "Avatar"],
  "member.avatarOption": ["آواتار {count}", "Avatar {count}"],
  "member.emailPlaceholder": ["name@team.com", "name@team.com"],
  "member.editTitle": ["ویرایش عضو", "Edit member"],
  "member.editDescription": [
    "نام، نقش، ایمیل و آواتار این عضو را تغییر دهید.",
    "Change this member's name, role, email and avatar.",
  ],
  "member.newDescription": [
    "هم‌تیمی تازه را با نام و نقشش اضافه کنید.",
    "Add a teammate with a name and a role.",
  ],
  "member.newTitle": ["عضو جدید", "New member"],
  "member.deleteTitle": ["این عضو حذف شود؟", "Remove this member?"],
  "member.deleteDescription": [
    "تسک‌های این عضو بدون مسئول می‌شوند و گفت‌وگوهایش می‌مانند.",
    "Their tasks become unassigned; their messages stay.",
  ],

  // ── اهداف
  "goals.heading": ["اهداف تیمی", "Team goals"],
  "goals.description": [
    "{count} هدف. با اتصال تسک‌ها پیشرفت خودکار محاسبه می‌شود.",
    "{count}. Link tasks to a goal to track progress automatically.",
  ],
  "goals.empty": ["هدفی تعریف نشده", "No goals yet"],
  "goals.emptyHint": ["یک هدف بلندمدت بسازید و تسک‌ها را به آن وصل کنید.", "Create a long-term goal and link tasks to it."],
  "goals.addCard": ["هدف تازه تعریف کنید", "Create a new goal"],
  "goals.progress": ["پیشرفت", "Progress"],
  "goals.doneOf": [
    "{done} از {total} تسک این هدف انجام شده",
    "{done} of {total} tasks done",
  ],
  "goals.noTasks": ["هنوز تسکی به این هدف وصل نشده", "No tasks linked yet"],
  "goals.tasksCount": [
    "{done} انجام‌شده · {total} کل · {blocked} مسدود",
    "{done} done · {total} total · {blocked} blocked",
  ],
  "goals.title": ["عنوان هدف", "Goal title"],
  "goals.titlePlaceholder": ["مثلاً: انتشار نسخه ۱.۰ محصول", "e.g. Ship version 1.0"],
  "goals.descriptionLabel": ["توضیح هدف", "Goal description"],
  "goals.descriptionPlaceholder": ["این هدف چه چیزی را محقق می‌کند؟", "What does this goal achieve?"],
  "goals.owner": ["مالک", "Owner"],
  "goals.target": ["تاریخ هدف", "Target date"],
  "goals.status": ["وضعیت هدف", "Goal status"],
  "goals.newTitle": ["هدف تازه", "New goal"],
  "goals.editTitle": ["ویرایش هدف", "Edit goal"],
  "goals.editDescription": [
    "عنوان، مالک، تاریخ هدف و وضعیت را به‌روز کنید.",
    "Update the title, owner, target date and status.",
  ],
  "goals.newDescription": [
    "یک هدف بلندمدت تیمی و زمان تحقق آن را تعیین کنید.",
    "Set a long-term team goal and when it should land.",
  ],
  "goals.deleteTitle": ["این هدف حذف شود؟", "Delete this goal?"],
  "goals.deleteDescription": [
    "هدف حذف می‌شود؛ تسک‌ها می‌مانند ولی بدون هدف.",
    "The goal is removed; its tasks stay without a goal.",
  ],

  // ── جدول
  "table.task": ["تسک", "Task"],
  "table.commentsShort": ["پیام", "Msgs"],
  "table.selected": ["{count} تسک انتخاب شده", "{count} selected"],
  "table.markDone": ["انجام شد", "Mark done"],
  "table.empty": ["تسکی برای نمایش نیست", "No tasks to show"],
  "table.columns": ["ستون‌ها", "Columns"],

  // ── ذخیره‌سازی
  "storage.label": ["ذخیره‌سازی", "Storage"],
  "storage.mode.file": ["فایل محلی", "Local file"],
  "storage.mode.postgres": ["PostgreSQL", "PostgreSQL"],
  "storage.mode.ephemeral": ["حالت نمایشی", "Demo mode"],
  "storage.ephemeralTitle": ["داده‌ها موقتی هستند", "Data is temporary"],
  "storage.ephemeralBody": [
    "بدون DATABASE_URL داده‌ها در حافظهٔ موقت سرور می‌مانند و با هر ری‌استارت بازنشانی می‌شوند. یک دیتابیس رایگان وصل کنید تا پایدار شود.",
    "Without DATABASE_URL data lives in the server's temp storage and resets on every restart. Connect a database to persist it.",
  ],
  "storage.resetTitle": ["داده‌ها بازنشانی شوند؟", "Reset all data?"],
  "storage.resetDescription": [
    "همهٔ تسک‌ها، اعضا، اهداف و گفت‌وگوها پاک و دادهٔ نمونه جایگزین می‌شود.",
    "All tasks, members, goals and messages will be replaced with the sample data.",
  ],

  // ── پیام‌ها
  "toast.taskCreated": ["تسک ساخته شد", "Task created"],
  "toast.taskUpdated": ["تسک به‌روزرسانی شد", "Task updated"],
  "toast.taskDeleted": ["تسک حذف شد", "Task deleted"],
  "toast.commentAdded": ["پیام ثبت شد", "Message posted"],
  "toast.commentDeleted": ["پیام حذف شد", "Message deleted"],
  "toast.memberCreated": ["عضو اضافه شد", "Member added"],
  "toast.memberUpdated": ["اطلاعات عضو به‌روزرسانی شد", "Member updated"],
  "toast.memberDeleted": ["عضو حذف شد", "Member removed"],
  "toast.goalCreated": ["هدف ساخته شد", "Goal created"],
  "toast.goalUpdated": ["هدف به‌روزرسانی شد", "Goal updated"],
  "toast.goalDeleted": ["هدف حذف شد", "Goal deleted"],
  "toast.reset": ["داده‌ها بازنشانی شد", "Data reset"],
  "toast.bulkDone": ["{count} تسک انجام‌شده شد", "{count} tasks marked done"],
  "toast.error": ["انجام نشد: {message}", "Failed: {message}"],
  "toast.noMember": [
    "اول مشخص کنید شما کدام عضو تیم هستید.",
    "Pick who you are first.",
  ],

  // ── همگام‌سازی زنده
  "realtime.live": ["زنده (WebSocket)", "Live (WebSocket)"],
  "realtime.connectedTitle": [
    "متصل به وب‌سوکت — تغییرات سایر کاربران بدون رفرش بلافاصله نمایش داده می‌شود.",
    "Connected to WebSocket — real-time updates enabled.",
  ],
  "realtime.connecting": ["اتصال زنده...", "Connecting..."],
  "realtime.connectingTitle": [
    "در حال اتصال به سرور همگام‌سازی زنده...",
    "Connecting to real-time sync server...",
  ],

  // ── اعتبارسنجی
  "form.required": ["این فیلد لازم است", "This field is required"],
  "form.invalidEmail": ["ایمیل معتبر نیست", "Enter a valid email"],
} as const;

export type MessageKey = keyof typeof messages;

export type MessageParams = Record<string, string | number>;

function interpolate(template: string, params?: MessageParams) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in params ? String(params[token]) : match,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: MessageParams,
): string {
  const pair = messages[key];
  const template = pair[locale === "fa" ? 0 : 1] ?? pair[0];
  return interpolate(template, params);
}

export type Translator = (key: MessageKey, params?: MessageParams) => string;

export function createTranslator(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}
