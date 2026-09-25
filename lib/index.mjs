import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
//#region src/locales/zh.mjs
var zh_default = {
	"chat.socialChat": "AI 社交",
	"chat.renameAndInvite": "修改名称并邀请新的 AI 用户",
	"permissions.readOnly": "只读",
	"permissions.workspaceWrite": "工作区写入",
	"permissions.fullAccess": "完全访问",
	"activity.toolCompleted": "{p0} 已完成",
	"activity.toolFailed": "{p0} 执行失败",
	"counts.selectedParticipants": "选择参会 AI 用户 · 已选 {count}/4",
	"counts.selectedUsers": "选择 AI 用户 · 已选 {count}",
	"counts.members": "{count} 位群成员",
	"counts.messages": "{count} 条消息",
	"counts.inviteCapacity": "当前 {count}/12 位 AI",
	"counts.inviteMeetingCapacity": "当前 {count}/12 位；加入后可以被 @，也会参与后续全员讨论",
	"counts.activeMeetings": "{count} 场会议进行中",
	"history.emptyDirect": "还没有私聊记录。",
	"history.emptyGroup": "还没有群聊记录。",
	"fallback_templates.roundtable": "圆桌会议",
	"fallback_templates.discuss.architecture.risks.and.user.experience": "架构、风险和用户体验三方讨论。",
	"fallback_templates.ai.courtroom": "AI 法庭",
	"fallback_templates.debate.both.sides.and.have.an.evidence.reviewer.check": "正反双方辩论，证据官检查论据。",
	"fallback_templates.code.review": "代码评审会",
	"fallback_templates.review.together.from.implementation.review.and.security.perspectives": "实现、审查和安全角色共同评审。",
	"fallback_templates.roast.session": "吐槽大会",
	"fallback_templates.mix.thoughtful.analysis.with.a.little.entertainment": "认真分析里掺一点节目效果。",
	"status.queued": "排队中",
	"status.collaborating": "协作中",
	"status.pausing.after.this.message": "本条后暂停",
	"status.waiting.for.a.new.message": "等待新消息",
	"meeting_stage.discussion": "讨论",
	"meeting_stage.planning": "规划",
	"meeting_stage.parallel.execution": "并行执行",
	"meeting_stage.peer.review": "交叉评审",
	"meeting_stage.awaiting.your.decision": "等待你决定",
	"meeting_stage.completed": "已完成",
	"task_status.not.started": "待开始",
	"task_status.in.progress": "进行中",
	"task_status.awaiting.review": "待评审",
	"task_status.blocked": "受阻",
	"task_status.paused": "已暂停",
	"logo.qwen": "通义千问",
	"logo.doubao": "豆包",
	"avatar.value.s.avatar": "{p0} 的头像",
	"avatar.please.select.an.image.file": "请选择图片文件",
	"avatar.the.image.must.not.exceed.12.mb": "图片不能超过 12 MB",
	"avatar.unable.to.read.this.image": "无法读取这张图片",
	"avatar.your.browser.does.not.support.avatar.processing": "浏览器不支持头像处理",
	"avatar.upload.and.crop": "上传并裁剪",
	"avatar.or.enter.an.emoji": "或输入 emoji",
	"avatar.ai.brand.avatars": "AI 品牌预设头像",
	"avatar.use.the.official.value.brand.icon": "使用 {p0} 官方品牌图标",
	"avatar.crop.avatar": "裁剪头像",
	"avatar.drag.the.image.to.position.it.and.scroll.to": "拖动图片调整位置，滚动鼠标滚轮缩放；也可以继续使用下方滑块",
	"avatar.close.crop.editor": "关闭裁剪",
	"avatar.draggable.avatar.crop.area": "可拖动的头像裁剪区域",
	"avatar.image.to.crop": "待裁剪头像",
	"avatar.drag.to.move.scroll.to.zoom": "拖动图片 · 滚轮缩放",
	"avatar.zoom": "缩放",
	"avatar.horizontal.position": "水平位置",
	"avatar.vertical.position": "垂直位置",
	"avatar.cancel": "取消",
	"avatar.use.cropped.image": "使用裁剪结果",
	"home.enter.ai.collaboration": "进入 AI 协作群",
	"home.ongoing.multi.ai.discussion.and.work.tasks.decisions.and": "多 AI 持续讨论与工作 · 支持任务分工、方案决策、成果验收",
	"activity.thinking": "思考中",
	"meeting.a.meeting.can.start.with.up.to.4.ai": "一场会议最多选择 4 位 AI 用户。",
	"meeting.the.limit.is.4.remove.a.participant.before.adding": "已达到 4 位上限；请先移除一位再选择。",
	"meeting.please.enter.a.meeting.topic.with.at.least.2": "请填写至少 2 个字的会议主题。",
	"meeting.select.value.more.participants.from.the.ai.user.library": "请从 AI 用户库中再选择 {p0} 位参会者。",
	"meeting.select.value.more.ai.users.to.start.the.meeting": "还需选择 {p0} 位 AI 用户才能开始会议。",
	"meeting.value.ai.users.selected.each.will.use.the.model": "已选择 {p0} 位 AI；模型将直接使用各自用户资料中的配置。",
	"meeting.create.an.ai.collaboration.group": "创建 AI 协作群",
	"meeting.discuss.and.work.together.in.an.ongoing.group.chat": "像 QQ 群聊一样持续讨论和工作：你可以随时发言、@ 指定 AI 回答，在协作控制台分工、决策并验收成果。会议不会按轮数自动结束。",
	"meeting.unable.to.start.meeting": "无法开始会议：",
	"meeting.what.should.they.discuss": "他们要讨论什么？",
	"meeting.for.example.how.can.this.multi.ai.meeting.plugin": "例如：这个多 AI 会议插件怎样设计，才既好玩又真的有用？",
	"meeting.meeting.format": "会议形式",
	"meeting.choose.ai.participants.selected": "选择参会 AI 用户 · 已选",
	"meeting.manage.create.users": "管理 / 创建用户 →",
	"meeting.choose.users.directly.each.ai.uses.the.provider.and": "直接选择用户即可。供应商和模型沿用该 AI 用户在用户中心保存的配置，这里不需要再次填写。",
	"meeting.no.ai.users.yet.create.at.least.2.first": "还没有 AI 用户，请先创建至少 2 个 →",
	"meeting.meeting.participants": "本场参会阵容",
	"meeting.remove.value": "移除 {p0}",
	"meeting.choose.ai.users.above.or.create.some.first": "请从上方选择 AI 用户；没有用户时先去创建 →",
	"meeting.gathering.participants": "正在召集",
	"meeting.start.meeting": "⚔️ 开始会议",
	"users.you": "你",
	"users.administrator": "管理员",
	"users.please.enter.your.display.name": "请填写你在聊天中显示的名称。",
	"users.please.complete.the.required.fields.highlighted.in.red": "请先补全标红的必填项。",
	"users.your.profile.has.been.saved": "你的人类用户资料已保存。",
	"users.please.enter.the.administrator.s.display.name": "请填写管理员显示名称。",
	"users.please.choose.a.provider.for.the.administrator": "请选择管理员供应商。",
	"users.please.choose.a.model.for.the.administrator": "请选择管理员模型。",
	"users.the.administrator.configuration.is.incomplete": "管理员配置还不完整。",
	"users.administrator.saved.it.will.automatically.join.new.meetings.and": "管理员资料已保存，新建会议和群聊会自动加入它。",
	"users.please.enter.a.display.name.for.this.ai": "请给这个 AI 填写显示名称。",
	"users.please.choose.a.provider": "请选择供应商。",
	"users.no.providers.are.available.in.dsh.configure.a.model": "DSH 中还没有可用供应商，请先前往系统设置配置模型。",
	"users.please.choose.a.model": "请选择模型。",
	"users.configure.a.provider.before.choosing.a.model": "配置供应商后才能选择模型。",
	"users.the.ai.user.cannot.be.created.yet.complete.the": "AI 用户还不能创建，请先补全标红的必填项。",
	"users.value.has.been.saved.to.the.ai.user.library": "{p0} 已保存到 AI 用户库。",
	"users.delete.ai.user.value.existing.meeting.records.will.not": "删除 AI 用户“{p0}”？已有会议记录不会被删除。",
	"users.users.and.avatars": "用户与头像",
	"users.an.ai.user.is.a.reusable.character.profile.containing": "这里的“AI 用户”是可重复使用的角色账号。它保存显示名称、头像、角色设定以及 DSH 中已启用的供应商和模型。",
	"users.my.human.profile": "我的人类用户",
	"users.your.messages.will.use.this.name.and.avatar": "你的现场插话会使用这套名称和头像",
	"users.display.name": "显示名称",
	"users.required": "必填",
	"users.saving": "保存中…",
	"users.save.my.profile": "保存我的资料",
	"users.group.administrator": "群管理员",
	"users.automatically.joins.new.meetings.and.group.chats.mention.it": "每个新会议和群聊都会自动加入；在聊天里 @它即可管理话题、协作阶段和决策状态",
	"users.administrator.responsibilities": "管理员职责",
	"users.automatic.follow.up.replies": "自动接话总开关",
	"users.when.enabled.the.original.allocation.flow.is.used.ai": "开启后沿用旧版分配模式：AI 先判断是否接话，再由管理员选择下一位发言者。",
	"users.turning.this.off.stops.automatic.ai.to.ai.follow": "关闭后停止 AI 之间的自动接话，但不影响人类发言和明确 @AI。",
	"users.provider": "供应商",
	"users.model": "模型",
	"users.save.administrator": "保存管理员",
	"users.ai.user.library": "AI 用户库",
	"users.select.an.existing.user.to.edit.it.then.choose": "点击已有用户可编辑，开会时可直接选择",
	"users.delete.value": "删除 {p0}",
	"users.create.ai.user": "＋ 创建新 AI 用户",
	"users.for.example.a.blunt.product.manager": "例如：毒舌产品经理",
	"users.custom.persona": "自定义人格",
	"users.optional.up.to.16.000.characters": "选填，最多 16000 字",
	"users.optional.persona.cards.with.user.and.char.placeholders.are": "可留空；支持导入含 {{user}}、{{char}} 的人格卡",
	"users.quick.conversation.starters.one.per.line.up.to.8": "预设快捷对话（每行一条，最多 8 条）",
	"users.help.me.analyze.this.idea.roast.it.in.your": "帮我分析这个想法\n用你的风格吐槽一下\n给我三个行动建议",
	"users.disable.this.ai.s.independent.follow.up.check": "关闭此 AI 的自动接话判断",
	"users.this.ai.can.still.reply.automatically.but.the.administrator": "仍可自动接话，但不再自行判断是否接话，改由管理员统一分配。",
	"users.disabling.this.check.can.save.tokens": "关闭此功能可节省 Token。",
	"users.no.providers.available": "暂无可用供应商",
	"users.no.models.available": "暂无可用模型",
	"users.accent.color": "主题色",
	"users.dsh.has.not.reported.any.enabled.model.providers.configure": "DSH 暂未报告已启用的模型供应商，请先在 DSH 设置中配置模型。",
	"users.complete.the.required.fields.highlighted.in.red": "请补全标红的必填项。",
	"users.editing.value": "正在编辑 {p0}。",
	"users.this.ai.user": "这个 AI 用户",
	"users.enter.a.name.provider.and.model.to.create.the": "名称、供应商和模型填写完整后即可创建；人格可以留空。",
	"users.save.ai.user.changes": "保存 AI 用户修改",
	"users.create.ai.user.2": "创建 AI 用户",
	"settings.enter.an.http.status.code.between.100.and.599": "请输入 100–599 之间的 HTTP 错误码。",
	"settings.collaboration.settings.saved": "协作行为设置已保存。",
	"settings.collaboration.settings": "协作行为设置",
	"settings.configure.shared.channel.protection.for.all.model.requests.in": "统一配置 Arena 中所有模型请求的共享渠道保护策略。",
	"settings.channel.protection": "渠道保护",
	"settings.shared.by.provider.configuration": "按供应商配置共享计算",
	"settings.rate.limit.cooldown": "渠道限流冷却",
	"settings.when.a.provider.configuration.hits.a.rate.limit.all": "同一供应商配置触发限流后，所有共享角色一起等待；失败请求也计入渠道次数。",
	"settings.status.codes.that.trigger.cooldown": "触发冷却的错误码",
	"settings.defaults.429.and.500.removing.a.code.means.that": "默认 429、500；删除某个错误码后，该状态码将不再触发渠道冷却。",
	"settings.remove.status.code.value": "删除错误码 {p0}",
	"settings.no.status.codes.configured": "未配置错误码",
	"settings.for.example.503": "例如 503",
	"settings.add": "添加",
	"settings.shared.channel.request.queue": "同渠道请求队列",
	"settings.replies.tool.continuations.subagents.and.follow.up.checks.using": "同一供应商下的正式发言、工具续跑、子 Agent 和接话判断统一排队；回复速度可能降低。",
	"settings.requests.allowed.per.minute": "每分钟放行次数",
	"settings.applies.to.each.shared.provider.queue.enter.1.10": "作用于每个供应商共享队列，可填写 1–10000；保存后从下一次请求开始生效。",
	"settings.why.group.by.provider.configuration": "为什么按供应商配置计算？",
	"settings.arena.does.not.read.or.store.api.keys.from": "Arena 不读取或保存 DSH 中的 API Key，无法按密钥精确分组，因此将同一供应商配置下的不同模型视为共享渠道。",
	"settings.note": "说明",
	"settings.automatic.reply.settings.are.in.users.group.administrator": "自动接话设置位于用户中心的群管理员面板",
	"settings.save.collaboration.settings": "保存协作行为设置",
	"chat.please.select.1.ai.user": "请选择 1 位 AI 用户。",
	"chat.select.2.12.ai.users.for.a.group.chat": "群聊请选择 2–12 位 AI 用户。",
	"chat.start.a.direct.chat": "发起私聊",
	"chat.create.group.chat": "创建群聊",
	"chat.choose.people.from.the.ai.user.library.group.chats": "从 AI 用户库中选择聊天对象。群聊会自动加入管理员；发送消息时可用 @ 精确点名某个 AI。",
	"chat.direct.chat": "💬 一对一私聊",
	"chat.multi.ai.group.chat": "👥 多 AI 群聊",
	"chat.group.name.optional": "群聊名称（可选）",
	"chat.for.example.friday.brainstorming": "例如：周五灵感局",
	"chat.choose.ai.users.selected": "选择 AI 用户 · 已选",
	"chat.general.assistant.no.custom.persona": "通用助手（未设置人格）",
	"chat.create.an.ai.user.first": "需要先创建 AI 用户 →",
	"chat.select.1.ai.user.to.start.a.direct.chat": "选择 1 位 AI，即可开始一对一私聊。",
	"chat.select.2.12.ai.users.to.create.a.group": "选择 2–12 位 AI，即可创建群聊，之后还可以继续邀请。",
	"chat.creating": "创建中…",
	"chat.start.direct.chat": "开始私聊",
	"role_activity.idle": "空闲",
	"role_activity.acknowledging": "确认消息",
	"role_activity.working": "工作中",
	"role_activity.using.tools": "使用工具",
	"role_activity.editing.files": "编辑文件",
	"role_activity.testing": "测试中",
	"role_activity.researching": "查阅中",
	"role_activity.delegating.to.subagents": "调度子 Agent",
	"role_activity.waiting.for.collaboration": "等待协作",
	"role_activity.error": "发生错误",
	"role_activity.muted": "已静默",
	"activity.role.activity": "角色动态",
	"activity.live.collaboration.board.visible.to.other.roles": "实时协作板 · 角色之间可互相查看",
	"activity.value.errors": "{p0} 个错误",
	"activity.value.working": "{p0} 工作中",
	"activity.all.idle": "均空闲",
	"activity.value.s.agent.permissions": "{p0} 的 Agent 权限",
	"activity.save.failed": "设置失败",
	"activity.no.further.details": "暂无更多细节。",
	"activity.current.tool": "当前工具",
	"activity.locked.files": "已锁定文件",
	"activity.recent.actions": "最近动作",
	"activity.view.action.history": "查看动作记录",
	"activity.last.updated": "最后更新",
	"activity.no.role.activity.yet": "尚无角色运行数据。",
	"activity.file.edits.use.per.role.locks.conflicting.edits.are": "文件编辑采用角色锁；冲突文件会在工具执行前被阻止。",
	"activity.value.s.action.history": "{p0} 的动作记录",
	"activity.action.history": "· 动作记录",
	"activity.earlier.actions.are.retained.instead.of.being.replaced.by": "完整保留，不再用新动作覆盖旧记录",
	"activity.no.recorded.actions": "暂无动作记录。",
	"approval.permission.review": "🛡️ 权限审计",
	"approval.awaiting.your.decision": "· 等待你的决定",
	"approval.allowed.once": "已允许一次",
	"approval.rejected": "已拒绝",
	"approval.canceled": "已取消",
	"approval.allow.once": "允许一次",
	"approval.reject": "拒绝",
	"approval.optionally.enter.a.note.or.execution.requirements": "也可以输入备注或执行要求",
	"approval.allow.with.a.note": "允许并附加说明",
	"workspace.working.directory": "工作区目录",
	"workspace.leave.blank.to.use.the.startup.directory": "留空使用启动目录",
	"workspace.save.working.directory": "保存工作区",
	"workspace.saved": "已保存",
	"workspace.use.an.existing.absolute.directory.changes.apply.to.the": "仅限已存在的绝对路径。下一批工作生效，当前任务保持原目录。",
	"chat.the.chat.name.cannot.be.empty": "聊天名称不能为空。",
	"chat.select.at.least.one.ai.user.to.invite": "请至少选择一位要邀请的 AI 用户。",
	"chat.direct.chat.2": "私聊",
	"chat.value.ai.users.administrator": "{p0} 个 AI + 管理员",
	"chat.close.settings": "关闭设置",
	"chat.group.settings": "群设置",
	"chat.chat.settings": "聊天设置",
	"chat.dissolve.group.value.all.messages.in.this.group.will": "解散群聊“{p0}”？全部群聊记录将被删除。",
	"chat.delete.chat.value": "删除聊天“{p0}”？",
	"chat.dissolve.group": "解散群聊",
	"chat.delete.chat": "删除聊天",
	"chat.rename": "修改名称",
	"chat.and.invite.new.ai.users": "并邀请新的 AI 用户",
	"chat.group.name": "群聊名称",
	"chat.chat.name": "聊天名称",
	"chat.save.name": "保存名称",
	"chat.invite.ai.users": "邀请 AI 用户",
	"chat.current": "当前",
	"chat.12.ai.users": "/12 位 AI",
	"chat.there.are.no.more.ai.users.available.to.invite": "AI 用户库中没有可邀请的新成员。",
	"chat.processing": "处理中…",
	"chat.invite.value.selected.members": "邀请选中的 {p0} 位成员",
	"chat.agent.permissions.for.this.chat": "本聊天的 Agent 权限",
	"chat.per.conversation.defaults.to.full.access": "每个对话单独生效；默认 Full access",
	"chat.your.direct.chat.with.value": "你和 {p0} 的私聊",
	"chat.send.a.message.to.start.each.ai.will.reply": "发一条消息开始聊天，AI 会按自己的自定义人格回复。",
	"chat.getting.started": " · 开始处理",
	"chat.are.processing.in.parallel": "正在同时处理",
	"chat.no.reply.to.your.last.message.or.want.to": "上一条没有收到回复或想重新请求？",
	"chat.retry.last.message": "↻ 重试上一条",
	"chat.mention": "点名：",
	"chat.value.is.muted.click.to.draft.an.unmute.command": "{p0} 已静默，点击生成恢复指令",
	"chat.you.can.speak.again": "可以继续说话了 ",
	"chat.muted": " · 静默",
	"chat.value.are.working.in.parallel.you.can.still.speak": "{p0} 正在并行处理，你仍可继续发言或 @其他成员…",
	"chat.send.a.message.without.mentions.all.unmuted.ai.users": "发送消息；不 @ 时所有未静默的 AI 会同时回应；也可说“某某别说话”",
	"chat.send": "发送",
	"chat.resize.the.right.activity.panel": "调整右侧状态栏宽度",
	"history.the.name.cannot.be.empty": "名称不能为空。",
	"history.ai.users.are.working.stop.the.current.work.before": "AI 正在工作，请先停止当前工作再删除会议。",
	"history.permanently.delete.meeting.value.this.cannot.be.undone": "永久删除会议记录“{p0}”？此操作无法撤销。",
	"history.permanently.delete.value.value.and.all.its.messages.this": "永久删除{p0}“{p1}”及全部消息？此操作无法撤销。",
	"history.group.chat": "群聊",
	"history.history": "历史记录管理",
	"history.meeting.names.are.stored.separately.from.discussion.topics.renaming": "会议名称与实际讨论主题分开保存。你可以放心重命名记录，不会改变会议内容。",
	"history.meetings": "协作会议",
	"history.ai.direct.chats": "AI 私聊",
	"history.ai.group.chats": "AI 群聊",
	"history.original.topic.value": "原主题：{p0}",
	"history.messages": "条消息",
	"history.rename": "重命名",
	"history.stop.the.current.ai.work.first": "请先停止当前 AI 工作",
	"history.delete.meeting": "删除会议",
	"history.delete": "删除",
	"history.save": "保存",
	"history.direct.chat.with.value": "与 {p0} 的私聊",
	"history.value.ai.users.administrator": "{p0} 位 AI + 管理员",
	"history.responding": "回复中",
	"history.no.meetings.yet": "还没有会议记录。",
	"history.no": "还没有",
	"history.records.yet": "记录。",
	"board.unassigned": "未分配",
	"board.meeting.stage": "会议阶段",
	"board.collaboration.panel": "协作控制台",
	"board.activity": "动态",
	"board.tasks": "任务",
	"board.decisions": "决策",
	"board.deliverables": "成果",
	"board.task.board": "任务板",
	"board.value.blocked.tasks.need.attention": "{p0} 项受阻，需要处理",
	"board.assign.owners.and.track.delivery": "分配负责人并跟踪交付状态",
	"board.new": "＋ 新建",
	"board.task.title": "任务标题",
	"board.acceptance.criteria.dependencies.or.notes.optional": "完成标准、依赖或补充说明（可选）",
	"board.create.task": "创建任务",
	"board.task.owner": "任务负责人",
	"board.task.status": "任务状态",
	"board.start.task": "▶ 开始任务",
	"board.continue.task": "▶ 继续任务",
	"board.pause.task": "Ⅱ 暂停任务",
	"board.rework": "↻ 重新处理",
	"board.blocked.task.value": "受阻任务“{p0}”",
	"board.request.review": "发起复核",
	"board.delete.task.value": "删除任务“{p0}”？",
	"board.no.tasks.yet.you.and.the.ai.users.can": "还没有任务。人类或 AI 都可以把工作拆到这里。",
	"board.resize.the.task.board": "调整任务板高度",
	"board.decision.board": "决策板",
	"board.compare.options.and.risks.you.make.the.final.decision": "比较方案与风险，由你做最终选择",
	"board.what.needs.to.be.decided": "要决定什么？",
	"board.background.and.constraints.optional": "背景和约束（可选）",
	"board.one.option.per.line.at.least.two.option.a": "每行一个方案，至少两行\n方案 A\n方案 B",
	"board.create.decision": "创建决策",
	"board.decided": "已决定",
	"board.awaiting.your.choice": "等待你选择",
	"board.reopen.discussion": "重开讨论",
	"board.selected": "✓ 已选择",
	"board.change.choice": "改选",
	"board.choose.option": "选择方案",
	"board.support": "支持",
	"board.oppose": "反对",
	"board.neutral": "中立",
	"board.confidence": "· 信心",
	"board.no.reason.provided": "未填写理由",
	"board.risks": "风险：",
	"board.decision.value": "决策“{p0}”",
	"board.request.evidence": "要求证据",
	"board.delete.decision.value": "删除决策“{p0}”？",
	"board.when.several.options.are.viable.compare.their.reasoning.risks": "出现多个可行方案时，把它们放到这里比较理由、风险与可行性。",
	"board.resize.the.decision.board": "调整决策板高度",
	"board.deliverable.library": "成果库",
	"board.files.links.conclusions.and.progress.summaries": "文件、链接、结论与阶段总结",
	"board.add": "＋ 添加",
	"board.deliverable.title": "成果标题",
	"board.content.or.review.notes": "内容或验收说明",
	"board.conclusion": "结论",
	"board.file": "文件",
	"board.link": "链接",
	"board.summary": "总结",
	"board.file.path.or.url.optional": "文件路径或 URL（可选）",
	"board.register.deliverable": "登记成果",
	"board.accepted": "已验收",
	"board.rejected": "已驳回",
	"board.awaiting.review": "待验收",
	"board.accept": "验收",
	"board.reject.result": "驳回结果",
	"board.deliverable.value": "成果“{p0}”",
	"board.delete.deliverable.value": "删除成果“{p0}”？",
	"board.completed.files.research.links.and.conclusions.appear.here.for": "AI 完成文件、调研、链接或结论后，会沉淀在这里等待你验收。",
	"board.resize.the.deliverable.library": "调整成果库高度",
	"board.current.proposals.and.deliverables": "当前方案与成果",
	"board.ask.everyone.for.evidence": "🔎 要求全员补证据",
	"board.value.change.the.topic.to": "@{p0} 把话题改为：",
	"board.change.topic": "✎ 更换话题",
	"meeting.group.members": "位群成员",
	"meeting.ongoing.collaboration.continue.anytime": "长期协作 · 随时继续",
	"meeting.meeting.settings": "会议设置",
	"meeting.close.invitations": "关闭邀请",
	"meeting.invite.members": "＋ 邀请成员",
	"meeting.resize.the.meeting.header": "调整会议顶部区域高度",
	"meeting.close.meeting.settings": "关闭会议设置",
	"meeting.invite.meeting.members": "邀请会议成员",
	"meeting.12.members.new.members.can.be.mentioned.and.will": "/12 位；加入后可以被 @，也会参与后续全员讨论",
	"meeting.waiting.to.join": "正在等候入群",
	"meeting.ai.members.are.preparing.to.speak": "AI 成员正在准备发言",
	"meeting.me": "我",
	"meeting.are.working.in.parallel": "正在并行处理",
	"meeting.nobody.is.speaking.right.now.but.the.meeting.is": "当前无人发言，会议仍在。你可以发送消息、@成员，或点击“让全员继续”。",
	"meeting.resize.the.right.collaboration.panel": "调整右侧协作栏宽度",
	"meeting.speak.freely.without.mentions.unmuted.ai.users.work.together": "自由发言；不 @ 时未静默的 AI 会同时工作；也可说“某某别说话”…",
	"meeting.continue.with.everyone": "▶ 让全员继续",
	"meeting.pause.after.this.turn": "Ⅱ 本轮后暂停",
	"meeting.summarize.progress": "📋 生成阶段总结",
	"meeting.stop.current.work": "■ 停止当前工作",
	"arena.select.a.chat.first": "请先选择聊天",
	"arena.select.a.meeting.first": "请先选择会议",
	"arena.ai.social.and.multi.model.collaboration": "AI 社交与多模型会议模式",
	"arena.meetings.active": "场会议进行中",
	"arena.exit.arena": "退出 Arena",
	"arena.arena.modes": "Arena 模式切换",
	"arena.multi.ai.discussion.and.work": "多 AI 讨论与工作",
	"arena.talk.to.one.character": "与一个角色对话",
	"arena.2.12.ai.users.together": "2–12 个 AI 同场",
	"arena.users": "用户中心",
	"arena.avatars.personas.and.models": "头像、人格与模型",
	"arena.settings": "协作设置",
	"arena.rate.limits.and.automatic.replies": "限流与自动接话",
	"arena.history": "历史管理",
	"arena.rename.and.delete": "重命名与删除",
	"arena.recent": "最近",
	"arena.unable.to.connect.to.arena": "连接 Arena 服务失败：",
	"arena.ai.collaboration": "AI 协作",
	"readjsonbody.the.request.body.must.not.exceed.256.kb": "请求体不能超过 256 KB",
	"readjsonbody.the.request.body.is.not.valid.json": "请求体不是有效的 JSON",
	"ensureactivitymonitor.waiting.for.a.task": "等待任务",
	"workspaceassignee.the.assignee.is.not.a.member.of.this.meeting": "负责人不在本场会议中",
	"createworkspacetask.the.task.title.cannot.be.empty": "任务标题不能为空",
	"updateworkspacetask.this.task.was.not.found": "没有找到这个任务",
	"updateworkspacetask.invalid.task.status": "任务状态无效",
	"normalizedecisionoptions.a.decision.requires.at.least.two.valid.options": "决策至少需要两个有效选项",
	"createworkspacedecision.the.decision.title.cannot.be.empty": "决策标题不能为空",
	"adddecisionopinion.this.decision.was.not.found": "没有找到这个决策",
	"adddecisionopinion.this.decision.option.was.not.found": "没有找到这个决策选项",
	"chooseworkspacedecision.invalid.decision.option": "决策选项无效",
	"createworkspaceartifact.the.deliverable.title.cannot.be.empty": "成果标题不能为空",
	"updateworkspaceartifact.this.deliverable.was.not.found": "没有找到这个成果",
	"updateworkspaceartifact.invalid.deliverable.status": "成果状态无效",
	"claimrolefiles.files.locked.preparing.to.edit": "已锁定文件，准备编辑",
	"claimrolefiles.locked.value.files": "锁定 {p0} 个文件",
	"coordinationtool.working.on.the.task": "正在推进任务",
	"coordinationtool.updated.work.status": "更新了工作状态",
	"coordinationtool.waiting.for.file.locks": "等待文件锁",
	"coordinationtool.value.is.editing.conflicting.files": "{p0} 正在编辑冲突文件",
	"coordinationtool.file.conflict.detected.value": "检测到文件冲突：{p0}",
	"coordinationtool.file.locks.released": "已释放文件锁",
	"coordinationtool.released.file.locks": "释放了文件锁",
	"coordinationtool.task.created.value": "已创建任务：{p0}",
	"coordinationtool.created.task.value": "创建任务：{p0}",
	"coordinationtool.task.value.value": "任务“{p0}”：{p1}",
	"coordinationtool.updated.task.value.value": "更新任务：{p0} → {p1}",
	"coordinationtool.deliverable.registered.value": "已登记成果：{p0}",
	"coordinationtool.registered.deliverable.value": "登记成果：{p0}",
	"coordinationtool.viewing.collaboration.activity": "查看协作动态",
	"autonomousmessagetool.sent.a.message.continuing.work": "已发送一条消息，仍在继续处理",
	"autonomousmessagetool.sent.a.public.message": "自主发送了一条公开消息",
	"installcoordinationplane.editing.conflict.detected": "检测到编辑冲突",
	"installcoordinationplane.value.is.editing.value": "{p0} 正在编辑 {p1}",
	"installcoordinationplane.blocked.a.conflicting.edit.value": "阻止了冲突编辑：{p0}",
	"apply.system": "系统",
	"apply.the.previous.reply.was.interrupted.by.a.dsh.restart": "DSH 重启中断了上次回复，请重新发送消息。",
	"validateprofilebase.the.user.profile.must.be.a.json.object": "用户资料必须是 JSON 对象",
	"validateprofilebase.the.display.name.cannot.be.empty": "显示名称不能为空",
	"validatemodel.please.select.a.provider.and.model": "请选择供应商和模型",
	"validatemodel.the.selected.provider.is.not.currently.enabled.in.dsh": "所选供应商当前未在 DSH 中启用",
	"savesettings.settings.must.be.a.json.object": "设置必须是 JSON 对象",
	"deleteaiprofile.this.ai.user.was.not.found": "没有找到这个 AI 用户",
	"approvalmessage.please.review.value.s.operation.valuevalue": "需要你审计 {p0} 的操作：{p1}{p2}",
	"approvalmessage.permission.review": "权限审计",
	"resolvearenaapproval.no.pending.operation.was.found.for.review": "没有找到待审计的操作",
	"resolvearenaapproval.invalid.approval.result": "审批结果无效",
	"waitforchannel.the.task.was.stopped": "任务已终止",
	"summarizeagentturn.agent.execution.failed": "Agent 运行失败",
	"toolactivity.sending.a.group.message": "正在发送群消息",
	"toolactivity.send.message": "发送消息",
	"toolactivity.synchronizing.collaboration.status": "同步协作状态",
	"toolactivity.collaboration.board": "协作板",
	"toolactivity.delegating.to.subagents": "正在调度子 Agent",
	"toolactivity.editing.files": "正在编辑文件",
	"toolactivity.running.checks.or.tests": "正在运行检查或测试",
	"toolactivity.reading.reference.material.or.code": "正在查看资料或代码",
	"toolactivity.browsing.external.sources": "正在浏览外部资料",
	"toolactivity.running.commands.or.code": "正在执行命令或代码",
	"toolactivity.using.value": "正在使用 {p0}",
	"observeagentevents.thinking.and.composing.a.reply": "正在思考并组织回复",
	"observeagentevents.value.failed": "{p0} 执行失败",
	"observeagentevents.analyzing.the.result.of.value": "正在分析 {p0} 的结果",
	"observeagentevents.failed": " 执行失败",
	"observeagentevents.completed": " 已完成",
	"observeagentevents.generated.an.interim.reply": "已生成阶段回复",
	"observeagentevents.generated.an.interim.reply.2": "生成了一条阶段回复",
	"runfullagentturnonce.acknowledging.a.new.message": "正在确认新消息",
	"runfullagentturnonce.understanding.the.task.and.planning": "正在理解任务并规划",
	"runfullagentturnonce.started.acknowledging.a.new.message": "开始确认新消息",
	"runfullagentturnonce.started.working.on.the.task": "开始处理任务",
	"runfullagentturnonce.this.turn.failed": "本轮运行失败",
	"runfullagentturnonce.acknowledged.preparing.to.work": "已确认，准备正式工作",
	"runfullagentturnonce.work.for.this.turn.is.complete": "本轮工作已完成",
	"runfullagentturn.empty.response.retrying.automatically": "本轮返回为空，正在自动重试",
	"runfullagentturn.detected.an.empty.response.retrying.once": "检测到空响应，自动重试一次",
	"applyspeechcontrols.muted.by.the.human.user": "被人类用户设为静默",
	"applyspeechcontrols.unmuted.waiting.for.a.message": "已恢复，等待消息",
	"applyspeechcontrols.unmuted": "恢复发言",
	"applyspeechcontrols.value.has.been.muted.no.further.requests.or.in": "{p0} 已静默；在恢复发言前不会再被请求，也不会发送正在进行任务的结果。",
	"applyspeechcontrols.value.has.been.unmuted": "{p0} 已恢复发言。",
	"applymeetingadminaction.the.administrator.could.not.identify.a.new.topic.try": "管理员没有识别到有效的新话题，请用“把话题改为：……”再试一次。",
	"applymeetingadminaction.the.administrator.changed.the.topic.to.value": "管理员已将话题更改为：{p0}",
	"applymeetingadminaction.the.administrator.reopened.decision.value": "管理员已重开决策“{p0}”。",
	"applymeetingadminaction.there.are.no.completed.decisions.to.reopen": "当前没有可以重开的已决策事项。",
	"applymeetingadminaction.the.administrator.changed.the.collaboration.stage.to.value": "管理员已将协作阶段切换为：{p0}",
	"runmeetingadmin.handling.an.administrator.command": "正在处理管理指令",
	"runmeetingadmin.started.handling.an.administrator.command": "开始处理管理指令",
	"runmeetingadmin.the.administrator.command.failed": "管理指令处理失败",
	"runmeetingadmin.waiting.for.an.administrator.command": "等待管理指令",
	"checkpoint.meeting.execution.was.stopped": "会议运行已停止",
	"runone.value.produced.no.displayable.text.stop.reason.value": "（{p0} 没有产生可展示文本，结束原因：{p1}）",
	"runone.work.failed.for.this.turn": "本轮工作失败",
	"runone.waiting.for.follow.up.messages": "等待后续消息",
	"collectreplyintents.checking.whether.to.reply": "正在判断是否需要接话",
	"collectreplyintents.follow.up.check.failed": "接话判断失败",
	"collectreplyintents.check.failed.value": "判断失败：{p0}",
	"guardcontinuation.checking.for.off.topic.replies.and.flooding": "正在检查跑题与刷屏风险",
	"guardcontinuation.reviewing.follow.up.intentions": "复核角色接话意愿",
	"guardcontinuation.follow.up.review.failed": "接话复核失败",
	"guardcontinuation.administrator.review.failed.using.the.first.role.s.independent": "管理员复核失败，采用首位角色的独立判断：{p0}",
	"evaluatemeetingcontinuation.waiting.for.follow.up.checks": "等待各角色判断是否接话",
	"evaluatemeetingcontinuation.started.per.role.follow.up.checks": "启动逐角色接话判断",
	"evaluatemeetingcontinuation.the.current.task.has.reached.a.natural.stopping.point": "当前任务已自然告一段落，AI 成员正在等待你的新消息。",
	"evaluatemeetingcontinuation.automatic.follow.ups.were.stopped.because.they.were.moving": "接话方向开始偏离人类当前焦点，已停止 AI 自动接话并等待你的下一步指示。",
	"evaluatemeetingcontinuation.the.follow.up.check.process.failed": "接话判断流程失败",
	"runstagesummary.preparing.a.progress.summary": "正在整理阶段总结",
	"runstagesummary.started.preparing.a.progress.summary": "开始整理阶段总结",
	"runstagesummary.progress.summary.ready.waiting.for.follow.up.messages": "阶段总结已生成，等待后续消息",
	"runstagesummary.completed.the.progress.summary": "完成阶段总结",
	"runmeeting.progress.summary.failed": "阶段总结失败",
	"runmeeting.meeting.execution.failed": "会议运行流程失败",
	"addmeetingmembers.select.ai.users.who.have.not.joined.this.meeting": "请选择尚未加入会议的 AI 用户",
	"addmeetingmembers.a.meeting.can.have.up.to.12.ai.users": "一场会议最多允许 12 位 AI 用户",
	"addmeetingmembers.the.invitation.list.includes.ai.users.that.no.longer": "邀请列表中包含已不存在的 AI 用户",
	"addmeetingmembers.value.joined.the.meeting": "{p0} 加入了会议。",
	"setcontainerpermission.the.permission.target.is.not.a.member.of.this": "权限目标不是当前对话成员",
	"setcontainerpermission.value.s.permissions.have.been.set.to.value": "{p0} 的权限已设置为 {p1}。",
	"actonmeeting.no.ai.reply.is.currently.in.progress": "当前没有正在进行的 AI 发言",
	"actonmeeting.there.is.no.ai.work.to.stop": "当前没有需要停止的 AI 工作",
	"actonmeeting.the.work.state.has.changed.please.try.again": "当前工作状态已经变化，请稍后重试",
	"actonmeeting.the.human.user.stopped.the.current.ai.work.the": "人类用户停止了当前 AI 工作；会议仍然保留，可以随时发送下一条消息。",
	"actonmeeting.the.message.cannot.be.empty": "消息不能为空",
	"actonmeeting.invalid.collaboration.stage": "协作阶段无效",
	"actonmeeting.the.human.user.chose.an.option.for.value.value": "人类用户为“{p0}”选择了方案：{p1}。",
	"actonmeeting.unknown.option": "未知方案",
	"actonmeeting.the.human.user.reopened.decision.value": "人类用户重开了决策“{p0}”。",
	"actonmeeting.the.human.user.rejected.deliverable.value.further.changes.are": "人类用户驳回了成果“{p0}”，需要继续修改。",
	"actonmeeting.invalid.vote.target": "投票目标无效",
	"actonmeeting.unknown.action": "未知操作",
	"roomorthrow.this.chat.was.not.found": "没有找到这个聊天",
	"runroomai.this.turn.produced.no.displayable.text.stop.reason.value": "本轮没有产生可展示文本，结束原因：{p0}",
	"runroomai.the.reply.failed.for.this.turn": "本轮回复失败",
	"runroomadmin.the.administrator.changed.the.group.topic.to.value": "管理员已将群聊话题更改为：{p0}",
	"evaluateroomcontinuation.automatic.ai.follow.ups.stopped.because.the.discussion.was": "接话方向开始偏离人类当前焦点，AI 已停止自动接话。",
	"runroomreplies.chat.execution.failed": "聊天运行流程失败",
	"createroom.the.chat.configuration.must.be.a.json.object": "聊天配置必须是 JSON 对象",
	"createroom.select.exactly.1.ai.user.for.a.direct.chat": "私聊必须选择 1 个 AI 用户",
	"createroom.select.2.12.ai.users.for.a.group.chat": "群聊必须选择 2 到 12 个 AI 用户",
	"createroom.the.chat.includes.ai.users.that.no.longer.exist": "聊天中包含已不存在的 AI 用户",
	"retryroommessage.ai.users.are.processing.the.current.message.please.wait": "AI 正在处理当前消息，请稍候",
	"retryroommessage.there.are.no.human.messages.to.retry.in.this": "这个聊天里还没有可重试的人类消息",
	"retryroommessage.the.last.message.was.only.a.speaking.control.command": "上一条消息只是发言控制指令，不需要重试",
	"retryroommessage.retrying.the.last.message": "正在重新请求上一条消息。",
	"addroommembers.only.group.chats.support.inviting.new.members": "只有群聊可以邀请新成员",
	"addroommembers.select.ai.users.who.have.not.joined.this.group": "请选择尚未加入群聊的 AI 用户",
	"addroommembers.a.group.chat.can.have.up.to.12.ai": "一个群聊最多允许 12 位 AI 用户",
	"addroommembers.value.joined.the.group": "{p0} 加入了群聊。",
	"deletemeeting.ai.users.are.working.stop.the.current.work.before": "AI 正在工作，请先停止当前工作再删除会议",
	"meetingorthrow.this.meeting.was.not.found": "没有找到这场会议",
	"apply.unknown.chat.action": "未知聊天操作",
	"apply.this.endpoint.does.not.exist": "接口不存在",
	"system.discuss.architecture.risks.and.user.experience.from.three.perspectives": "从架构、风险和用户体验三个角度讨论。",
	"system.debate.both.sides.while.an.evidence.reviewer.checks.the": "正反双方辩论，由证据官检查论据质量。",
	"system.review.a.technical.proposal.from.implementation.review.and.security": "实现、审查和安全三个角色共同评审技术方案。",
	"system.mix.serious.analysis.with.entertainment.for.product.ideas.and": "认真分析里掺一点节目效果，适合产品点子和脑暴。",
	"validatemeetinginput.the.request.body.must.be.a.json.object": "请求体必须是 JSON 对象",
	"validatemeetinginput.the.meeting.topic.must.contain.at.least.2.characters": "会议主题至少需要 2 个字符",
	"validatemeetinginput.a.meeting.must.start.with.2.4.ai.participants": "参会 AI 数量必须在 2 到 4 个之间",
	"validatemeetinginput.participant.names.must.be.unique.value": "参会者名称不能重复：{p0}",
	"workspace.the.working.directory.must.be.text": "工作区目录必须是文本",
	"workspace.use.a.fully.qualified.absolute.directory.such.as.d": "工作区必须是完整的绝对路径，例如 D:\\projects\\my-project",
	"workspace.the.working.directory.does.not.exist.or.cannot.be": "工作区目录不存在或不可访问：{p0}",
	"workspace.the.working.directory.is.not.a.directory.value": "工作区不是目录：{p0}",
	"workspace.the.meeting.name.cannot.be.empty": "会议名称不能为空",
	"workspace.the.chat.name.cannot.be.empty": "聊天名称不能为空",
	"workspace.provide.a.name.or.working.directory": "请提供名称或工作区目录"
};
//#endregion
//#region src/locales/en.mjs
var en_default = {
	"chat.socialChat": "Social chat",
	"chat.renameAndInvite": "Rename this group and invite new AI users",
	"permissions.readOnly": "Read only",
	"permissions.workspaceWrite": "Workspace write",
	"permissions.fullAccess": "Full access",
	"activity.toolCompleted": "{p0} completed",
	"activity.toolFailed": "{p0} failed",
	"counts.selectedParticipants": "Choose AI participants · {count}/4 selected",
	"counts.selectedUsers": "Choose AI users · {count} selected",
	"counts.members": "{count} group members",
	"counts.messages": "{count} messages",
	"counts.inviteCapacity": "{count}/12 AI users",
	"counts.inviteMeetingCapacity": "{count}/12 members; new members can be @mentioned and join subsequent discussions.",
	"counts.activeMeetings": "{count} active meetings",
	"history.emptyDirect": "No direct chats yet.",
	"history.emptyGroup": "No group chats yet.",
	"fallback_templates.roundtable": "Roundtable",
	"fallback_templates.discuss.architecture.risks.and.user.experience": "Discuss architecture, risks, and user experience.",
	"fallback_templates.ai.courtroom": "AI Courtroom",
	"fallback_templates.debate.both.sides.and.have.an.evidence.reviewer.check": "Debate both sides and have an evidence reviewer check the arguments.",
	"fallback_templates.code.review": "Code Review",
	"fallback_templates.review.together.from.implementation.review.and.security.perspectives": "Review together from implementation, review, and security perspectives.",
	"fallback_templates.roast.session": "Roast Session",
	"fallback_templates.mix.thoughtful.analysis.with.a.little.entertainment": "Mix thoughtful analysis with a little entertainment.",
	"status.queued": "Queued",
	"status.collaborating": "Collaborating",
	"status.pausing.after.this.message": "Pausing after this message",
	"status.waiting.for.a.new.message": "Waiting for a new message",
	"meeting_stage.discussion": "Discussion",
	"meeting_stage.planning": "Planning",
	"meeting_stage.parallel.execution": "Parallel execution",
	"meeting_stage.peer.review": "Peer review",
	"meeting_stage.awaiting.your.decision": "Awaiting your decision",
	"meeting_stage.completed": "Completed",
	"task_status.not.started": "Not started",
	"task_status.in.progress": "In progress",
	"task_status.awaiting.review": "Awaiting review",
	"task_status.blocked": "Blocked",
	"task_status.paused": "Paused",
	"logo.qwen": "Qwen",
	"logo.doubao": "Doubao",
	"avatar.value.s.avatar": "{p0}'s avatar",
	"avatar.please.select.an.image.file": "Please select an image file.",
	"avatar.the.image.must.not.exceed.12.mb": "The image must not exceed 12 MB.",
	"avatar.unable.to.read.this.image": "Unable to read this image.",
	"avatar.your.browser.does.not.support.avatar.processing": "Your browser does not support avatar processing.",
	"avatar.upload.and.crop": "Upload and crop",
	"avatar.or.enter.an.emoji": "Or enter an emoji",
	"avatar.ai.brand.avatars": "AI brand avatars",
	"avatar.use.the.official.value.brand.icon": "Use the official {p0} brand icon",
	"avatar.crop.avatar": "Crop avatar",
	"avatar.drag.the.image.to.position.it.and.scroll.to": "Drag the image to position it and scroll to zoom, or use the sliders below.",
	"avatar.close.crop.editor": "Close crop editor",
	"avatar.draggable.avatar.crop.area": "Draggable avatar crop area",
	"avatar.image.to.crop": "Image to crop",
	"avatar.drag.to.move.scroll.to.zoom": "Drag to move · Scroll to zoom",
	"avatar.zoom": "Zoom",
	"avatar.horizontal.position": "Horizontal position",
	"avatar.vertical.position": "Vertical position",
	"avatar.cancel": "Cancel",
	"avatar.use.cropped.image": "Use cropped image",
	"home.enter.ai.collaboration": "Enter AI collaboration",
	"home.ongoing.multi.ai.discussion.and.work.tasks.decisions.and": "Ongoing multi-AI discussion and work · Tasks, decisions, and deliverable review",
	"activity.thinking": "Thinking",
	"meeting.a.meeting.can.start.with.up.to.4.ai": "A meeting can start with up to 4 AI users.",
	"meeting.the.limit.is.4.remove.a.participant.before.adding": "The limit is 4. Remove a participant before adding another.",
	"meeting.please.enter.a.meeting.topic.with.at.least.2": "Please enter a meeting topic with at least 2 characters.",
	"meeting.select.value.more.participants.from.the.ai.user.library": "Select {p0} more participants from the AI user library.",
	"meeting.select.value.more.ai.users.to.start.the.meeting": "Select {p0} more AI users to start the meeting.",
	"meeting.value.ai.users.selected.each.will.use.the.model": "{p0} AI users selected. Each will use the model configured in their profile.",
	"meeting.create.an.ai.collaboration.group": "Create an AI collaboration group",
	"meeting.discuss.and.work.together.in.an.ongoing.group.chat": "Discuss and work together in an ongoing group chat. Speak at any time, @mention an AI, and use the collaboration panel to assign tasks, compare options, and review deliverables. Meetings do not end after a fixed number of rounds.",
	"meeting.unable.to.start.meeting": "Unable to start meeting:",
	"meeting.what.should.they.discuss": "What should they discuss?",
	"meeting.for.example.how.can.this.multi.ai.meeting.plugin": "For example: How can this multi-AI meeting plugin be both fun and genuinely useful?",
	"meeting.meeting.format": "Meeting format",
	"meeting.choose.ai.participants.selected": "Choose AI participants · Selected",
	"meeting.manage.create.users": "Manage / create users →",
	"meeting.choose.users.directly.each.ai.uses.the.provider.and": "Choose users directly. Each AI uses the provider and model saved in its profile; there is no need to enter them again.",
	"meeting.no.ai.users.yet.create.at.least.2.first": "No AI users yet. Create at least 2 first →",
	"meeting.meeting.participants": "Meeting participants",
	"meeting.remove.value": "Remove {p0}",
	"meeting.choose.ai.users.above.or.create.some.first": "Choose AI users above, or create some first →",
	"meeting.gathering.participants": "Gathering participants",
	"meeting.start.meeting": "⚔️ Start meeting",
	"users.you": "You",
	"users.administrator": "Administrator",
	"users.please.enter.your.display.name": "Please enter your display name.",
	"users.please.complete.the.required.fields.highlighted.in.red": "Please complete the required fields highlighted in red.",
	"users.your.profile.has.been.saved": "Your profile has been saved.",
	"users.please.enter.the.administrator.s.display.name": "Please enter the administrator's display name.",
	"users.please.choose.a.provider.for.the.administrator": "Please choose a provider for the administrator.",
	"users.please.choose.a.model.for.the.administrator": "Please choose a model for the administrator.",
	"users.the.administrator.configuration.is.incomplete": "The administrator configuration is incomplete.",
	"users.administrator.saved.it.will.automatically.join.new.meetings.and": "Administrator saved. It will automatically join new meetings and group chats.",
	"users.please.enter.a.display.name.for.this.ai": "Please enter a display name for this AI.",
	"users.please.choose.a.provider": "Please choose a provider.",
	"users.no.providers.are.available.in.dsh.configure.a.model": "No providers are available in DSH. Configure a model in DSH settings first.",
	"users.please.choose.a.model": "Please choose a model.",
	"users.configure.a.provider.before.choosing.a.model": "Configure a provider before choosing a model.",
	"users.the.ai.user.cannot.be.created.yet.complete.the": "The AI user cannot be created yet. Complete the required fields highlighted in red.",
	"users.value.has.been.saved.to.the.ai.user.library": "{p0} has been saved to the AI user library.",
	"users.delete.ai.user.value.existing.meeting.records.will.not": "Delete AI user “{p0}”? Existing meeting records will not be deleted.",
	"users.users.and.avatars": "Users and avatars",
	"users.an.ai.user.is.a.reusable.character.profile.containing": "An AI user is a reusable character profile containing a display name, avatar, persona, and an enabled DSH provider and model.",
	"users.my.human.profile": "My human profile",
	"users.your.messages.will.use.this.name.and.avatar": "Your messages will use this name and avatar.",
	"users.display.name": "Display name",
	"users.required": "Required",
	"users.saving": "Saving…",
	"users.save.my.profile": "Save my profile",
	"users.group.administrator": "Group administrator",
	"users.automatically.joins.new.meetings.and.group.chats.mention.it": "Automatically joins new meetings and group chats. @mention it to manage the topic, collaboration stage, and decisions.",
	"users.administrator.responsibilities": "Administrator responsibilities",
	"users.automatic.follow.up.replies": "Automatic follow-up replies",
	"users.when.enabled.the.original.allocation.flow.is.used.ai": "When enabled, the original allocation flow is used: AI users assess whether to reply, then the administrator selects the next speaker.",
	"users.turning.this.off.stops.automatic.ai.to.ai.follow": "Turning this off stops automatic AI-to-AI follow-ups, but does not affect human messages or explicit @mentions.",
	"users.provider": "Provider",
	"users.model": "Model",
	"users.save.administrator": "Save administrator",
	"users.ai.user.library": "AI user library",
	"users.select.an.existing.user.to.edit.it.then.choose": "Select an existing user to edit it, then choose it directly when starting a meeting.",
	"users.delete.value": "Delete {p0}",
	"users.create.ai.user": "＋ Create AI user",
	"users.for.example.a.blunt.product.manager": "For example: a blunt product manager",
	"users.custom.persona": "Custom persona",
	"users.optional.up.to.16.000.characters": "Optional, up to 16,000 characters",
	"users.optional.persona.cards.with.user.and.char.placeholders.are": "Optional; persona cards with {{user}} and {{char}} placeholders are supported.",
	"users.quick.conversation.starters.one.per.line.up.to.8": "Quick conversation starters (one per line, up to 8)",
	"users.help.me.analyze.this.idea.roast.it.in.your": "Help me analyze this idea\nRoast it in your own style\nGive me three action items",
	"users.disable.this.ai.s.independent.follow.up.check": "Disable this AI's independent follow-up check",
	"users.this.ai.can.still.reply.automatically.but.the.administrator": "This AI can still reply automatically, but the administrator will decide when it speaks instead of the AI making its own check.",
	"users.disabling.this.check.can.save.tokens": "Disabling this check can save tokens.",
	"users.no.providers.available": "No providers available",
	"users.no.models.available": "No models available",
	"users.accent.color": "Accent color",
	"users.dsh.has.not.reported.any.enabled.model.providers.configure": "DSH has not reported any enabled model providers. Configure a model in DSH settings first.",
	"users.complete.the.required.fields.highlighted.in.red": "Complete the required fields highlighted in red.",
	"users.editing.value": "Editing {p0}.",
	"users.this.ai.user": "this AI user",
	"users.enter.a.name.provider.and.model.to.create.the": "Enter a name, provider, and model to create the user. The persona is optional.",
	"users.save.ai.user.changes": "Save AI user changes",
	"users.create.ai.user.2": "Create AI user",
	"settings.enter.an.http.status.code.between.100.and.599": "Enter an HTTP status code between 100 and 599.",
	"settings.collaboration.settings.saved": "Collaboration settings saved.",
	"settings.collaboration.settings": "Collaboration settings",
	"settings.configure.shared.channel.protection.for.all.model.requests.in": "Configure shared-channel protection for all model requests in Arena.",
	"settings.channel.protection": "Channel protection",
	"settings.shared.by.provider.configuration": "Shared by provider configuration",
	"settings.rate.limit.cooldown": "Rate-limit cooldown",
	"settings.when.a.provider.configuration.hits.a.rate.limit.all": "When a provider configuration hits a rate limit, all roles sharing it wait together. Failed requests also count toward the channel limit.",
	"settings.status.codes.that.trigger.cooldown": "Status codes that trigger cooldown",
	"settings.defaults.429.and.500.removing.a.code.means.that": "Defaults: 429 and 500. Removing a code means that status will no longer trigger channel cooldown.",
	"settings.remove.status.code.value": "Remove status code {p0}",
	"settings.no.status.codes.configured": "No status codes configured",
	"settings.for.example.503": "For example, 503",
	"settings.add": "Add",
	"settings.shared.channel.request.queue": "Shared-channel request queue",
	"settings.replies.tool.continuations.subagents.and.follow.up.checks.using": "Replies, tool continuations, subagents, and follow-up checks using the same provider share one queue. Responses may take longer.",
	"settings.requests.allowed.per.minute": "Requests allowed per minute",
	"settings.applies.to.each.shared.provider.queue.enter.1.10": "Applies to each shared provider queue. Enter 1–10,000. Changes take effect from the next request after saving.",
	"settings.why.group.by.provider.configuration": "Why group by provider configuration?",
	"settings.arena.does.not.read.or.store.api.keys.from": "Arena does not read or store API keys from DSH and cannot group requests by exact key. Models under the same provider configuration are therefore treated as one shared channel.",
	"settings.note": "Note",
	"settings.automatic.reply.settings.are.in.users.group.administrator": "Automatic reply settings are in Users → Group administrator.",
	"settings.save.collaboration.settings": "Save collaboration settings",
	"chat.please.select.1.ai.user": "Please select 1 AI user.",
	"chat.select.2.12.ai.users.for.a.group.chat": "Select 2–12 AI users for a group chat.",
	"chat.start.a.direct.chat": "Start a direct chat",
	"chat.create.group.chat": "Create group chat",
	"chat.choose.people.from.the.ai.user.library.group.chats": "Choose people from the AI user library. Group chats include the administrator automatically. Use @mentions to address a specific AI.",
	"chat.direct.chat": "💬 Direct chat",
	"chat.multi.ai.group.chat": "👥 Multi-AI group chat",
	"chat.group.name.optional": "Group name (optional)",
	"chat.for.example.friday.brainstorming": "For example: Friday brainstorming",
	"chat.choose.ai.users.selected": "Choose AI users · Selected",
	"chat.general.assistant.no.custom.persona": "General assistant (no custom persona)",
	"chat.create.an.ai.user.first": "Create an AI user first →",
	"chat.select.1.ai.user.to.start.a.direct.chat": "Select 1 AI user to start a direct chat.",
	"chat.select.2.12.ai.users.to.create.a.group": "Select 2–12 AI users to create a group. You can invite more members later.",
	"chat.creating": "Creating…",
	"chat.start.direct.chat": "Start direct chat",
	"role_activity.idle": "Idle",
	"role_activity.acknowledging": "Acknowledging",
	"role_activity.working": "Working",
	"role_activity.using.tools": "Using tools",
	"role_activity.editing.files": "Editing files",
	"role_activity.testing": "Testing",
	"role_activity.researching": "Researching",
	"role_activity.delegating.to.subagents": "Delegating to subagents",
	"role_activity.waiting.for.collaboration": "Waiting for collaboration",
	"role_activity.error": "Error",
	"role_activity.muted": "Muted",
	"activity.role.activity": "Role activity",
	"activity.live.collaboration.board.visible.to.other.roles": "Live collaboration board · Visible to other roles",
	"activity.value.errors": "{p0} errors",
	"activity.value.working": "{p0} working",
	"activity.all.idle": "All idle",
	"activity.value.s.agent.permissions": "{p0}'s agent permissions",
	"activity.save.failed": "Save failed",
	"activity.no.further.details": "No further details.",
	"activity.current.tool": "Current tool",
	"activity.locked.files": "Locked files",
	"activity.recent.actions": "Recent actions",
	"activity.view.action.history": "View action history",
	"activity.last.updated": "Last updated",
	"activity.no.role.activity.yet": "No role activity yet.",
	"activity.file.edits.use.per.role.locks.conflicting.edits.are": "File edits use per-role locks. Conflicting edits are blocked before the tool runs.",
	"activity.value.s.action.history": "{p0}'s action history",
	"activity.action.history": "· Action history",
	"activity.earlier.actions.are.retained.instead.of.being.replaced.by": "Earlier actions are retained instead of being replaced by the latest one.",
	"activity.no.recorded.actions": "No recorded actions.",
	"approval.permission.review": "🛡️ Permission review",
	"approval.awaiting.your.decision": "· Awaiting your decision",
	"approval.allowed.once": "Allowed once",
	"approval.rejected": "Rejected",
	"approval.canceled": "Canceled",
	"approval.allow.once": "Allow once",
	"approval.reject": "Reject",
	"approval.optionally.enter.a.note.or.execution.requirements": "Optionally enter a note or execution requirements",
	"approval.allow.with.a.note": "Allow with a note",
	"workspace.working.directory": "Working directory",
	"workspace.leave.blank.to.use.the.startup.directory": "Leave blank to use the startup directory",
	"workspace.save.working.directory": "Save working directory",
	"workspace.saved": "Saved",
	"workspace.use.an.existing.absolute.directory.changes.apply.to.the": "Use an existing absolute directory. Changes apply to the next batch; current tasks keep their existing directory.",
	"chat.the.chat.name.cannot.be.empty": "The chat name cannot be empty.",
	"chat.select.at.least.one.ai.user.to.invite": "Select at least one AI user to invite.",
	"chat.direct.chat.2": "Direct chat",
	"chat.value.ai.users.administrator": "{p0} AI users + administrator",
	"chat.close.settings": "Close settings",
	"chat.group.settings": "Group settings",
	"chat.chat.settings": "Chat settings",
	"chat.dissolve.group.value.all.messages.in.this.group.will": "Dissolve group “{p0}”? All messages in this group will be deleted.",
	"chat.delete.chat.value": "Delete chat “{p0}”?",
	"chat.dissolve.group": "Dissolve group",
	"chat.delete.chat": "Delete chat",
	"chat.rename": "Rename",
	"chat.and.invite.new.ai.users": " and invite new AI users",
	"chat.group.name": "Group name",
	"chat.chat.name": "Chat name",
	"chat.save.name": "Save name",
	"chat.invite.ai.users": "Invite AI users",
	"chat.current": "Current",
	"chat.12.ai.users": "/12 AI users",
	"chat.there.are.no.more.ai.users.available.to.invite": "There are no more AI users available to invite.",
	"chat.processing": "Processing…",
	"chat.invite.value.selected.members": "Invite {p0} selected members",
	"chat.agent.permissions.for.this.chat": "Agent permissions for this chat",
	"chat.per.conversation.defaults.to.full.access": "Per conversation; defaults to Full access",
	"chat.your.direct.chat.with.value": "Your direct chat with {p0}",
	"chat.send.a.message.to.start.each.ai.will.reply": "Send a message to start. Each AI will reply according to its own persona.",
	"chat.getting.started": " · Getting started",
	"chat.are.processing.in.parallel": "are processing in parallel",
	"chat.no.reply.to.your.last.message.or.want.to": "No reply to your last message, or want to try again?",
	"chat.retry.last.message": "↻ Retry last message",
	"chat.mention": "Mention:",
	"chat.value.is.muted.click.to.draft.an.unmute.command": "{p0} is muted. Click to draft an unmute command.",
	"chat.you.can.speak.again": "you can speak again ",
	"chat.muted": " · Muted",
	"chat.value.are.working.in.parallel.you.can.still.speak": "{p0} are working in parallel. You can still speak or @mention other members…",
	"chat.send.a.message.without.mentions.all.unmuted.ai.users": "Send a message. Without @mentions, all unmuted AI users respond together. You can also say “Name, stop talking”.",
	"chat.send": "Send",
	"chat.resize.the.right.activity.panel": "Resize the right activity panel",
	"history.the.name.cannot.be.empty": "The name cannot be empty.",
	"history.ai.users.are.working.stop.the.current.work.before": "AI users are working. Stop the current work before deleting this meeting.",
	"history.permanently.delete.meeting.value.this.cannot.be.undone": "Permanently delete meeting “{p0}”? This cannot be undone.",
	"history.permanently.delete.value.value.and.all.its.messages.this": "Permanently delete {p0} “{p1}” and all its messages? This cannot be undone.",
	"history.group.chat": "Group chat",
	"history.history": "History",
	"history.meeting.names.are.stored.separately.from.discussion.topics.renaming": "Meeting names are stored separately from discussion topics. Renaming a record does not change its content.",
	"history.meetings": "Meetings",
	"history.ai.direct.chats": "AI direct chats",
	"history.ai.group.chats": "AI group chats",
	"history.original.topic.value": "Original topic: {p0}",
	"history.messages": "messages",
	"history.rename": "Rename",
	"history.stop.the.current.ai.work.first": "Stop the current AI work first",
	"history.delete.meeting": "Delete meeting",
	"history.delete": "Delete",
	"history.save": "Save",
	"history.direct.chat.with.value": "Direct chat with {p0}",
	"history.value.ai.users.administrator": "{p0} AI users + administrator",
	"history.responding": "Responding",
	"history.no.meetings.yet": "No meetings yet.",
	"history.no": "No",
	"history.records.yet": "records yet.",
	"board.unassigned": "Unassigned",
	"board.meeting.stage": "Meeting stage",
	"board.collaboration.panel": "Collaboration panel",
	"board.activity": "Activity",
	"board.tasks": "Tasks",
	"board.decisions": "Decisions",
	"board.deliverables": "Deliverables",
	"board.task.board": "Task board",
	"board.value.blocked.tasks.need.attention": "{p0} blocked tasks need attention",
	"board.assign.owners.and.track.delivery": "Assign owners and track delivery",
	"board.new": "＋ New",
	"board.task.title": "Task title",
	"board.acceptance.criteria.dependencies.or.notes.optional": "Acceptance criteria, dependencies, or notes (optional)",
	"board.create.task": "Create task",
	"board.task.owner": "Task owner",
	"board.task.status": "Task status",
	"board.start.task": "▶ Start task",
	"board.continue.task": "▶ Continue task",
	"board.pause.task": "Ⅱ Pause task",
	"board.rework": "↻ Rework",
	"board.blocked.task.value": "blocked task “{p0}”",
	"board.request.review": "Request review",
	"board.delete.task.value": "Delete task “{p0}”?",
	"board.no.tasks.yet.you.and.the.ai.users.can": "No tasks yet. You and the AI users can break work down here.",
	"board.resize.the.task.board": "Resize the task board",
	"board.decision.board": "Decision board",
	"board.compare.options.and.risks.you.make.the.final.decision": "Compare options and risks. You make the final decision.",
	"board.what.needs.to.be.decided": "What needs to be decided?",
	"board.background.and.constraints.optional": "Background and constraints (optional)",
	"board.one.option.per.line.at.least.two.option.a": "One option per line, at least two\nOption A\nOption B",
	"board.create.decision": "Create decision",
	"board.decided": "Decided",
	"board.awaiting.your.choice": "Awaiting your choice",
	"board.reopen.discussion": "Reopen discussion",
	"board.selected": "✓ Selected",
	"board.change.choice": "Change choice",
	"board.choose.option": "Choose option",
	"board.support": "Support",
	"board.oppose": "Oppose",
	"board.neutral": "Neutral",
	"board.confidence": "· Confidence",
	"board.no.reason.provided": "No reason provided",
	"board.risks": "Risks:",
	"board.decision.value": "decision “{p0}”",
	"board.request.evidence": "Request evidence",
	"board.delete.decision.value": "Delete decision “{p0}”?",
	"board.when.several.options.are.viable.compare.their.reasoning.risks": "When several options are viable, compare their reasoning, risks, and feasibility here.",
	"board.resize.the.decision.board": "Resize the decision board",
	"board.deliverable.library": "Deliverable library",
	"board.files.links.conclusions.and.progress.summaries": "Files, links, conclusions, and progress summaries",
	"board.add": "＋ Add",
	"board.deliverable.title": "Deliverable title",
	"board.content.or.review.notes": "Content or review notes",
	"board.conclusion": "Conclusion",
	"board.file": "File",
	"board.link": "Link",
	"board.summary": "Summary",
	"board.file.path.or.url.optional": "File path or URL (optional)",
	"board.register.deliverable": "Register deliverable",
	"board.accepted": "Accepted",
	"board.rejected": "Rejected",
	"board.awaiting.review": "Awaiting review",
	"board.accept": "Accept",
	"board.reject.result": "Reject result",
	"board.deliverable.value": "deliverable “{p0}”",
	"board.delete.deliverable.value": "Delete deliverable “{p0}”?",
	"board.completed.files.research.links.and.conclusions.appear.here.for": "Completed files, research, links, and conclusions appear here for your review.",
	"board.resize.the.deliverable.library": "Resize the deliverable library",
	"board.current.proposals.and.deliverables": "current proposals and deliverables",
	"board.ask.everyone.for.evidence": "🔎 Ask everyone for evidence",
	"board.value.change.the.topic.to": "@{p0} Change the topic to: ",
	"board.change.topic": "✎ Change topic",
	"meeting.group.members": "group members",
	"meeting.ongoing.collaboration.continue.anytime": "Ongoing collaboration · Continue anytime",
	"meeting.meeting.settings": "Meeting settings",
	"meeting.close.invitations": "Close invitations",
	"meeting.invite.members": "＋ Invite members",
	"meeting.resize.the.meeting.header": "Resize the meeting header",
	"meeting.close.meeting.settings": "Close meeting settings",
	"meeting.invite.meeting.members": "Invite meeting members",
	"meeting.12.members.new.members.can.be.mentioned.and.will": "/12 members; new members can be @mentioned and will join subsequent group discussions.",
	"meeting.waiting.to.join": "Waiting to join",
	"meeting.ai.members.are.preparing.to.speak": "AI members are preparing to speak",
	"meeting.me": "Me",
	"meeting.are.working.in.parallel": "are working in parallel",
	"meeting.nobody.is.speaking.right.now.but.the.meeting.is": "Nobody is speaking right now, but the meeting is still open. Send a message, @mention a member, or choose “Continue with everyone”.",
	"meeting.resize.the.right.collaboration.panel": "Resize the right collaboration panel",
	"meeting.speak.freely.without.mentions.unmuted.ai.users.work.together": "Speak freely. Without @mentions, unmuted AI users work together. You can also say “Name, stop talking”…",
	"meeting.continue.with.everyone": "▶ Continue with everyone",
	"meeting.pause.after.this.turn": "Ⅱ Pause after this turn",
	"meeting.summarize.progress": "📋 Summarize progress",
	"meeting.stop.current.work": "■ Stop current work",
	"arena.select.a.chat.first": "Select a chat first.",
	"arena.select.a.meeting.first": "Select a meeting first.",
	"arena.ai.social.and.multi.model.collaboration": "AI social and multi-model collaboration",
	"arena.meetings.active": "meetings active",
	"arena.exit.arena": "Exit Arena",
	"arena.arena.modes": "Arena modes",
	"arena.multi.ai.discussion.and.work": "Multi-AI discussion and work",
	"arena.talk.to.one.character": "Talk to one character",
	"arena.2.12.ai.users.together": "2–12 AI users together",
	"arena.users": "Users",
	"arena.avatars.personas.and.models": "Avatars, personas, and models",
	"arena.settings": "Settings",
	"arena.rate.limits.and.automatic.replies": "Rate limits and automatic replies",
	"arena.history": "History",
	"arena.rename.and.delete": "Rename and delete",
	"arena.recent": "Recent",
	"arena.unable.to.connect.to.arena": "Unable to connect to Arena:",
	"arena.ai.collaboration": "AI collaboration",
	"readjsonbody.the.request.body.must.not.exceed.256.kb": "The request body must not exceed 256 KB.",
	"readjsonbody.the.request.body.is.not.valid.json": "The request body is not valid JSON.",
	"ensureactivitymonitor.waiting.for.a.task": "Waiting for a task",
	"workspaceassignee.the.assignee.is.not.a.member.of.this.meeting": "The assignee is not a member of this meeting.",
	"createworkspacetask.the.task.title.cannot.be.empty": "The task title cannot be empty.",
	"updateworkspacetask.this.task.was.not.found": "This task was not found.",
	"updateworkspacetask.invalid.task.status": "Invalid task status.",
	"normalizedecisionoptions.a.decision.requires.at.least.two.valid.options": "A decision requires at least two valid options.",
	"createworkspacedecision.the.decision.title.cannot.be.empty": "The decision title cannot be empty.",
	"adddecisionopinion.this.decision.was.not.found": "This decision was not found.",
	"adddecisionopinion.this.decision.option.was.not.found": "This decision option was not found.",
	"chooseworkspacedecision.invalid.decision.option": "Invalid decision option.",
	"createworkspaceartifact.the.deliverable.title.cannot.be.empty": "The deliverable title cannot be empty.",
	"updateworkspaceartifact.this.deliverable.was.not.found": "This deliverable was not found.",
	"updateworkspaceartifact.invalid.deliverable.status": "Invalid deliverable status.",
	"claimrolefiles.files.locked.preparing.to.edit": "Files locked; preparing to edit",
	"claimrolefiles.locked.value.files": "Locked {p0} files",
	"coordinationtool.working.on.the.task": "Working on the task",
	"coordinationtool.updated.work.status": "Updated work status",
	"coordinationtool.waiting.for.file.locks": "Waiting for file locks",
	"coordinationtool.value.is.editing.conflicting.files": "{p0} is editing conflicting files",
	"coordinationtool.file.conflict.detected.value": "File conflict detected: {p0}",
	"coordinationtool.file.locks.released": "File locks released",
	"coordinationtool.released.file.locks": "Released file locks",
	"coordinationtool.task.created.value": "Task created: {p0}",
	"coordinationtool.created.task.value": "Created task: {p0}",
	"coordinationtool.task.value.value": "Task “{p0}”: {p1}",
	"coordinationtool.updated.task.value.value": "Updated task: {p0} → {p1}",
	"coordinationtool.deliverable.registered.value": "Deliverable registered: {p0}",
	"coordinationtool.registered.deliverable.value": "Registered deliverable: {p0}",
	"coordinationtool.viewing.collaboration.activity": "Viewing collaboration activity",
	"autonomousmessagetool.sent.a.message.continuing.work": "Sent a message; continuing work",
	"autonomousmessagetool.sent.a.public.message": "Sent a public message",
	"installcoordinationplane.editing.conflict.detected": "Editing conflict detected",
	"installcoordinationplane.value.is.editing.value": "{p0} is editing {p1}",
	"installcoordinationplane.blocked.a.conflicting.edit.value": "Blocked a conflicting edit: {p0}",
	"apply.system": "System",
	"apply.the.previous.reply.was.interrupted.by.a.dsh.restart": "The previous reply was interrupted by a DSH restart. Please send your message again.",
	"validateprofilebase.the.user.profile.must.be.a.json.object": "The user profile must be a JSON object.",
	"validateprofilebase.the.display.name.cannot.be.empty": "The display name cannot be empty.",
	"validatemodel.please.select.a.provider.and.model": "Please select a provider and model.",
	"validatemodel.the.selected.provider.is.not.currently.enabled.in.dsh": "The selected provider is not currently enabled in DSH.",
	"savesettings.settings.must.be.a.json.object": "Settings must be a JSON object.",
	"deleteaiprofile.this.ai.user.was.not.found": "This AI user was not found.",
	"approvalmessage.please.review.value.s.operation.valuevalue": "Please review {p0}'s operation: {p1}{p2}",
	"approvalmessage.permission.review": "Permission review",
	"resolvearenaapproval.no.pending.operation.was.found.for.review": "No pending operation was found for review.",
	"resolvearenaapproval.invalid.approval.result": "Invalid approval result.",
	"waitforchannel.the.task.was.stopped": "The task was stopped.",
	"summarizeagentturn.agent.execution.failed": "Agent execution failed",
	"toolactivity.sending.a.group.message": "Sending a group message",
	"toolactivity.send.message": "Send message",
	"toolactivity.synchronizing.collaboration.status": "Synchronizing collaboration status",
	"toolactivity.collaboration.board": "Collaboration board",
	"toolactivity.delegating.to.subagents": "Delegating to subagents",
	"toolactivity.editing.files": "Editing files",
	"toolactivity.running.checks.or.tests": "Running checks or tests",
	"toolactivity.reading.reference.material.or.code": "Reading reference material or code",
	"toolactivity.browsing.external.sources": "Browsing external sources",
	"toolactivity.running.commands.or.code": "Running commands or code",
	"toolactivity.using.value": "Using {p0}",
	"observeagentevents.thinking.and.composing.a.reply": "Thinking and composing a reply",
	"observeagentevents.value.failed": "{p0} failed",
	"observeagentevents.analyzing.the.result.of.value": "Analyzing the result of {p0}",
	"observeagentevents.failed": " failed",
	"observeagentevents.completed": " completed",
	"observeagentevents.generated.an.interim.reply": "Generated an interim reply",
	"observeagentevents.generated.an.interim.reply.2": "Generated an interim reply",
	"runfullagentturnonce.acknowledging.a.new.message": "Acknowledging a new message",
	"runfullagentturnonce.understanding.the.task.and.planning": "Understanding the task and planning",
	"runfullagentturnonce.started.acknowledging.a.new.message": "Started acknowledging a new message",
	"runfullagentturnonce.started.working.on.the.task": "Started working on the task",
	"runfullagentturnonce.this.turn.failed": "This turn failed",
	"runfullagentturnonce.acknowledged.preparing.to.work": "Acknowledged; preparing to work",
	"runfullagentturnonce.work.for.this.turn.is.complete": "Work for this turn is complete",
	"runfullagentturn.empty.response.retrying.automatically": "Empty response; retrying automatically",
	"runfullagentturn.detected.an.empty.response.retrying.once": "Detected an empty response; retrying once",
	"applyspeechcontrols.muted.by.the.human.user": "Muted by the human user",
	"applyspeechcontrols.unmuted.waiting.for.a.message": "Unmuted; waiting for a message",
	"applyspeechcontrols.unmuted": "Unmuted",
	"applyspeechcontrols.value.has.been.muted.no.further.requests.or.in": "{p0} has been muted. No further requests or in-flight results will be sent until unmuted.",
	"applyspeechcontrols.value.has.been.unmuted": "{p0} has been unmuted.",
	"applymeetingadminaction.the.administrator.could.not.identify.a.new.topic.try": "The administrator could not identify a new topic. Try “Change the topic to: …”.",
	"applymeetingadminaction.the.administrator.changed.the.topic.to.value": "The administrator changed the topic to: {p0}",
	"applymeetingadminaction.the.administrator.reopened.decision.value": "The administrator reopened decision “{p0}”.",
	"applymeetingadminaction.there.are.no.completed.decisions.to.reopen": "There are no completed decisions to reopen.",
	"applymeetingadminaction.the.administrator.changed.the.collaboration.stage.to.value": "The administrator changed the collaboration stage to: {p0}",
	"runmeetingadmin.handling.an.administrator.command": "Handling an administrator command",
	"runmeetingadmin.started.handling.an.administrator.command": "Started handling an administrator command",
	"runmeetingadmin.the.administrator.command.failed": "The administrator command failed",
	"runmeetingadmin.waiting.for.an.administrator.command": "Waiting for an administrator command",
	"checkpoint.meeting.execution.was.stopped": "Meeting execution was stopped.",
	"runone.value.produced.no.displayable.text.stop.reason.value": "({p0} produced no displayable text; stop reason: {p1})",
	"runone.work.failed.for.this.turn": "Work failed for this turn",
	"runone.waiting.for.follow.up.messages": "Waiting for follow-up messages",
	"collectreplyintents.checking.whether.to.reply": "Checking whether to reply",
	"collectreplyintents.follow.up.check.failed": "Follow-up check failed",
	"collectreplyintents.check.failed.value": "Check failed: {p0}",
	"guardcontinuation.checking.for.off.topic.replies.and.flooding": "Checking for off-topic replies and flooding",
	"guardcontinuation.reviewing.follow.up.intentions": "Reviewing follow-up intentions",
	"guardcontinuation.follow.up.review.failed": "Follow-up review failed",
	"guardcontinuation.administrator.review.failed.using.the.first.role.s.independent": "Administrator review failed; using the first role's independent check: {p0}",
	"evaluatemeetingcontinuation.waiting.for.follow.up.checks": "Waiting for follow-up checks",
	"evaluatemeetingcontinuation.started.per.role.follow.up.checks": "Started per-role follow-up checks",
	"evaluatemeetingcontinuation.the.current.task.has.reached.a.natural.stopping.point": "The current task has reached a natural stopping point. AI members are waiting for your next message.",
	"evaluatemeetingcontinuation.automatic.follow.ups.were.stopped.because.they.were.moving": "Automatic follow-ups were stopped because they were moving away from your topic. Waiting for your next instruction.",
	"evaluatemeetingcontinuation.the.follow.up.check.process.failed": "The follow-up check process failed",
	"runstagesummary.preparing.a.progress.summary": "Preparing a progress summary",
	"runstagesummary.started.preparing.a.progress.summary": "Started preparing a progress summary",
	"runstagesummary.progress.summary.ready.waiting.for.follow.up.messages": "Progress summary ready; waiting for follow-up messages",
	"runstagesummary.completed.the.progress.summary": "Completed the progress summary",
	"runmeeting.progress.summary.failed": "Progress summary failed",
	"runmeeting.meeting.execution.failed": "Meeting execution failed",
	"addmeetingmembers.select.ai.users.who.have.not.joined.this.meeting": "Select AI users who have not joined this meeting.",
	"addmeetingmembers.a.meeting.can.have.up.to.12.ai.users": "A meeting can have up to 12 AI users.",
	"addmeetingmembers.the.invitation.list.includes.ai.users.that.no.longer": "The invitation list includes AI users that no longer exist.",
	"addmeetingmembers.value.joined.the.meeting": "{p0} joined the meeting.",
	"setcontainerpermission.the.permission.target.is.not.a.member.of.this": "The permission target is not a member of this conversation.",
	"setcontainerpermission.value.s.permissions.have.been.set.to.value": "{p0}'s permissions have been set to {p1}.",
	"actonmeeting.no.ai.reply.is.currently.in.progress": "No AI reply is currently in progress.",
	"actonmeeting.there.is.no.ai.work.to.stop": "There is no AI work to stop.",
	"actonmeeting.the.work.state.has.changed.please.try.again": "The work state has changed. Please try again.",
	"actonmeeting.the.human.user.stopped.the.current.ai.work.the": "The human user stopped the current AI work. The meeting remains available; send another message at any time.",
	"actonmeeting.the.message.cannot.be.empty": "The message cannot be empty.",
	"actonmeeting.invalid.collaboration.stage": "Invalid collaboration stage.",
	"actonmeeting.the.human.user.chose.an.option.for.value.value": "The human user chose an option for “{p0}”: {p1}.",
	"actonmeeting.unknown.option": "Unknown option",
	"actonmeeting.the.human.user.reopened.decision.value": "The human user reopened decision “{p0}”.",
	"actonmeeting.the.human.user.rejected.deliverable.value.further.changes.are": "The human user rejected deliverable “{p0}”; further changes are needed.",
	"actonmeeting.invalid.vote.target": "Invalid vote target.",
	"actonmeeting.unknown.action": "Unknown action.",
	"roomorthrow.this.chat.was.not.found": "This chat was not found.",
	"runroomai.this.turn.produced.no.displayable.text.stop.reason.value": "This turn produced no displayable text; stop reason: {p0}",
	"runroomai.the.reply.failed.for.this.turn": "The reply failed for this turn",
	"runroomadmin.the.administrator.changed.the.group.topic.to.value": "The administrator changed the group topic to: {p0}",
	"evaluateroomcontinuation.automatic.ai.follow.ups.stopped.because.the.discussion.was": "Automatic AI follow-ups stopped because the discussion was moving away from your topic.",
	"runroomreplies.chat.execution.failed": "Chat execution failed",
	"createroom.the.chat.configuration.must.be.a.json.object": "The chat configuration must be a JSON object.",
	"createroom.select.exactly.1.ai.user.for.a.direct.chat": "Select exactly 1 AI user for a direct chat.",
	"createroom.select.2.12.ai.users.for.a.group.chat": "Select 2–12 AI users for a group chat.",
	"createroom.the.chat.includes.ai.users.that.no.longer.exist": "The chat includes AI users that no longer exist.",
	"retryroommessage.ai.users.are.processing.the.current.message.please.wait": "AI users are processing the current message. Please wait.",
	"retryroommessage.there.are.no.human.messages.to.retry.in.this": "There are no human messages to retry in this chat.",
	"retryroommessage.the.last.message.was.only.a.speaking.control.command": "The last message was only a speaking-control command and does not need to be retried.",
	"retryroommessage.retrying.the.last.message": "Retrying the last message.",
	"addroommembers.only.group.chats.support.inviting.new.members": "Only group chats support inviting new members.",
	"addroommembers.select.ai.users.who.have.not.joined.this.group": "Select AI users who have not joined this group.",
	"addroommembers.a.group.chat.can.have.up.to.12.ai": "A group chat can have up to 12 AI users.",
	"addroommembers.value.joined.the.group": "{p0} joined the group.",
	"deletemeeting.ai.users.are.working.stop.the.current.work.before": "AI users are working. Stop the current work before deleting this meeting.",
	"meetingorthrow.this.meeting.was.not.found": "This meeting was not found.",
	"apply.unknown.chat.action": "Unknown chat action.",
	"apply.this.endpoint.does.not.exist": "This endpoint does not exist.",
	"system.discuss.architecture.risks.and.user.experience.from.three.perspectives": "Discuss architecture, risks, and user experience from three perspectives.",
	"system.debate.both.sides.while.an.evidence.reviewer.checks.the": "Debate both sides while an evidence reviewer checks the arguments.",
	"system.review.a.technical.proposal.from.implementation.review.and.security": "Review a technical proposal from implementation, review, and security perspectives.",
	"system.mix.serious.analysis.with.entertainment.for.product.ideas.and": "Mix serious analysis with entertainment for product ideas and brainstorming.",
	"validatemeetinginput.the.request.body.must.be.a.json.object": "The request body must be a JSON object.",
	"validatemeetinginput.the.meeting.topic.must.contain.at.least.2.characters": "The meeting topic must contain at least 2 characters.",
	"validatemeetinginput.a.meeting.must.start.with.2.4.ai.participants": "A meeting must start with 2–4 AI participants.",
	"validatemeetinginput.participant.names.must.be.unique.value": "Participant names must be unique: {p0}",
	"workspace.the.working.directory.must.be.text": "The working directory must be text.",
	"workspace.use.a.fully.qualified.absolute.directory.such.as.d": "Use a fully qualified absolute directory, such as D:\\projects\\my-project.",
	"workspace.the.working.directory.does.not.exist.or.cannot.be": "The working directory does not exist or cannot be accessed: {p0}",
	"workspace.the.working.directory.is.not.a.directory.value": "The working directory is not a directory: {p0}",
	"workspace.the.meeting.name.cannot.be.empty": "The meeting name cannot be empty.",
	"workspace.the.chat.name.cannot.be.empty": "The chat name cannot be empty.",
	"workspace.provide.a.name.or.working.directory": "Provide a name or working directory."
};
//#endregion
//#region src/localization.mjs
const dictionaries = {
	zh: zh_default,
	en: en_default
};
function normalizeLocale(value) {
	return String(value || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}
function formatMessage(key, params = {}, locale = "zh") {
	return (dictionaries[normalizeLocale(locale)][key] ?? en_default[key] ?? zh_default[key] ?? key).replace(/\{(\w+)\}/g, (token, name) => Object.hasOwn(params, name) ? String(params[name] ?? "") : token);
}
/** A descriptor is stored alongside the original text, never in place of user data. */
function uiMessage(key, params = {}) {
	return {
		key,
		params,
		text: formatMessage(key, params, "zh")
	};
}
function messageText$1(value) {
	return value && typeof value === "object" && typeof value.key === "string" ? value.text + (value.suffix || "") : String(value ?? "");
}
function messageDescriptor(value) {
	return value && typeof value === "object" && Object.hasOwn(zh_default, value.key) ? {
		key: value.key,
		params: value.params ?? {},
		...value.suffix ? { suffix: value.suffix } : {}
	} : void 0;
}
function uiError(message, status, ErrorType = Error) {
	const error = new ErrorType(messageText$1(message));
	const descriptor = messageDescriptor(message);
	if (descriptor) error.i18n = descriptor;
	if (status != null) error.status = status;
	return error;
}
function withMessageDetail(value, detail) {
	const descriptor = messageDescriptor(value);
	return descriptor ? {
		...uiMessage(descriptor.key, descriptor.params),
		suffix: detail ? `：${detail}` : ""
	} : `${messageText$1(value)}${detail ? `：${detail}` : ""}`;
}
new Map(Object.entries(zh_default).map(([key, text]) => [text, key]));
//#endregion
//#region src/workspace.mjs
function invalid(message) {
	return uiError(message, 400);
}
async function normalizeRoomWorkdir(value) {
	if (value != null && typeof value !== "string") throw invalid(uiMessage("workspace.the.working.directory.must.be.text"));
	const text = (value ?? "").trim();
	if (!text) return "";
	if (!isAbsolute(text) || process.platform === "win32" && /^[\\/](?![\\/])/.test(text)) throw invalid(uiMessage("workspace.use.a.fully.qualified.absolute.directory.such.as.d"));
	const absolute = resolve(text);
	let info;
	try {
		info = await stat(absolute);
	} catch {
		throw invalid(uiMessage("workspace.the.working.directory.does.not.exist.or.cannot.be", { p0: absolute }));
	}
	if (!info.isDirectory()) throw invalid(uiMessage("workspace.the.working.directory.is.not.a.directory.value", { p0: absolute }));
	return absolute;
}
async function conversationSettingsPatch(raw, nameKey = "name") {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw invalid(uiMessage("savesettings.settings.must.be.a.json.object"));
	const patch = {};
	if (Object.hasOwn(raw, "name")) {
		const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 80) : "";
		if (!name) throw invalid(nameKey === "displayName" ? uiMessage("workspace.the.meeting.name.cannot.be.empty") : uiMessage("workspace.the.chat.name.cannot.be.empty"));
		patch[nameKey] = name;
	}
	if (Object.hasOwn(raw, "workdir")) patch.workdir = await normalizeRoomWorkdir(raw.workdir);
	if (!Object.keys(patch).length) throw invalid(uiMessage("workspace.provide.a.name.or.working.directory"));
	return patch;
}
function runtimeWorkdir(container) {
	return typeof container?.workdir === "string" && container.workdir.trim() ? container.workdir.trim() : process.cwd();
}
function normalizeCoordinationFile(value, cwd) {
	const text = String(value ?? "").trim();
	if (!text || text.length > 1e3) return null;
	const absolute = resolve(cwd, text);
	return {
		key: process.platform === "win32" ? absolute.toLowerCase() : absolute,
		path: absolute
	};
}
//#endregion
//#region src/shared.mjs
const API_ROOT = "/api/plugins/dsh-agent-arena";
const MEETING_STAGES = [
	"discussion",
	"planning",
	"execution",
	"review",
	"waiting-human",
	"completed"
];
const TASK_STATUSES = [
	"todo",
	"in-progress",
	"review",
	"done",
	"blocked",
	"paused"
];
/** Add the collaborative-workspace fields introduced after the first release.
* Mutating in place keeps old persisted meetings compatible without rewriting
* their transcript or participant snapshots. */
function ensureMeetingWorkspace(meeting) {
	if (!meeting || typeof meeting !== "object") return meeting;
	const fallbackStage = meeting.status === "completed" ? "completed" : "discussion";
	if (!MEETING_STAGES.includes(meeting.collaborationStage)) meeting.collaborationStage = fallbackStage;
	if (!Array.isArray(meeting.tasks)) meeting.tasks = [];
	if (!Array.isArray(meeting.decisions)) meeting.decisions = [];
	if (!Array.isArray(meeting.artifacts)) meeting.artifacts = [];
	return meeting;
}
const ARENA_TEMPLATES = [
	{
		id: "roundtable",
		name: "圆桌会议",
		description: "从架构、风险和用户体验三个角度讨论。",
		participants: [
			{
				name: "蓝图",
				avatar: "🏗️",
				role: "系统架构师：拆解约束，提出可落地的整体方案。",
				color: "#5b8cff"
			},
			{
				name: "逆鳞",
				avatar: "🦔",
				role: "怀疑论者：主动寻找漏洞、反例、成本和隐藏风险。",
				color: "#ff6b7a"
			},
			{
				name: "小满",
				avatar: "🧑‍💻",
				role: "用户代表：关注易用性、真实需求、学习成本和体验。",
				color: "#2cc9a4"
			}
		]
	},
	{
		id: "courtroom",
		name: "AI 法庭",
		description: "正反双方辩论，由证据官检查论据质量。",
		participants: [
			{
				name: "正方",
				avatar: "🟦",
				role: "支持方律师：给出最强支持论证与具体证据。",
				color: "#5b8cff"
			},
			{
				name: "反方",
				avatar: "🟥",
				role: "反对方律师：给出最强反驳、失败案例和替代解释。",
				color: "#ff6b7a"
			},
			{
				name: "证据官",
				avatar: "⚖️",
				role: "中立证据官：检查事实、假设、逻辑跳跃与可验证性。",
				color: "#f4b942"
			}
		]
	},
	{
		id: "code-review",
		name: "代码评审会",
		description: "实现、审查和安全三个角色共同评审技术方案。",
		participants: [
			{
				name: "Builder",
				avatar: "🔨",
				role: "实现者：给出最小可行实现、模块边界和验证步骤。",
				color: "#5b8cff"
			},
			{
				name: "Reviewer",
				avatar: "🔍",
				role: "高级审查员：检查正确性、维护性、边界条件和复杂度。",
				color: "#b482ff"
			},
			{
				name: "Breaker",
				avatar: "🧨",
				role: "安全与测试工程师：寻找攻击面、故障路径和可复现测试。",
				color: "#ff6b7a"
			}
		]
	},
	{
		id: "roast",
		name: "吐槽大会",
		description: "认真分析里掺一点节目效果，适合产品点子和脑暴。",
		participants: [
			{
				name: "夸夸",
				avatar: "🌈",
				role: "乐观派产品经理：发现亮点、传播点和增长机会。",
				color: "#2cc9a4"
			},
			{
				name: "毒舌",
				avatar: "🌶️",
				role: "尖锐评论员：用风趣但不人身攻击的方式指出尴尬和硬伤。",
				color: "#ff6b7a"
			},
			{
				name: "混沌",
				avatar: "🌀",
				role: "混沌工程师：提出意外用法、极端场景和荒诞但有启发的实验。",
				color: "#f4b942"
			}
		]
	}
];
function templateById(id) {
	return ARENA_TEMPLATES.find((item) => item.id === id) ?? ARENA_TEMPLATES[0];
}
function cleanString(value, maxLength) {
	return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
function cleanAvatar(value, fallback = "🤖") {
	const avatar = typeof value === "string" ? value.trim() : "";
	if (/^logo:(?:deepseek|openai|claude|gemini|qwen|kimi|grok|doubao|metaai|mistral)$/.test(avatar)) return avatar;
	if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(avatar) && avatar.length <= 18e4) return avatar;
	return avatar && avatar.length <= 16 ? avatar : fallback;
}
function validateMeetingInput(raw) {
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw uiError(uiMessage("validatemeetinginput.the.request.body.must.be.a.json.object"), 400, TypeError);
	const topic = cleanString(raw.topic, 2e3);
	if (topic.length < 2) throw uiError(uiMessage("validatemeetinginput.the.meeting.topic.must.contain.at.least.2.characters"), 400, TypeError);
	const template = templateById(cleanString(raw.template, 40));
	const sourceParticipants = Array.isArray(raw.participants) ? raw.participants : template.participants;
	if (sourceParticipants.length < 2 || sourceParticipants.length > 4) throw uiError(uiMessage("validatemeetinginput.a.meeting.must.start.with.2.4.ai.participants"), 400, TypeError);
	const names = /* @__PURE__ */ new Set();
	const participants = sourceParticipants.map((source, index) => {
		const fallback = template.participants[index % template.participants.length];
		const name = cleanString(source?.name, 24) || fallback.name;
		const key = name.toLocaleLowerCase();
		if (names.has(key)) throw uiError(uiMessage("validatemeetinginput.participant.names.must.be.unique.value", { p0: name }), 400, TypeError);
		names.add(key);
		const role = cleanString(source?.role, 16e3) || fallback.role;
		const provider = cleanString(source?.provider, 100);
		const model = cleanString(source?.model, 160);
		const color = /^#[0-9a-f]{6}$/i.test(String(source?.color ?? "")) ? String(source.color) : fallback.color;
		return {
			id: cleanString(source?.profileId, 80) || `speaker-${index + 1}`,
			...cleanString(source?.profileId, 80) ? { profileId: cleanString(source.profileId, 80) } : {},
			name,
			avatar: cleanAvatar(source?.avatar, fallback.avatar),
			role,
			color,
			...provider ? { provider } : {},
			...model ? { model } : {}
		};
	});
	return {
		topic,
		template: template.id,
		participants
	};
}
function mentionedProfileIds(text, profiles) {
	const source = String(text ?? "").toLocaleLowerCase();
	return profiles.filter((profile) => profile?.id && profile?.name).filter((profile) => source.includes(`@${String(profile.name).toLocaleLowerCase()}`)).map((profile) => profile.id);
}
function mentionsAdministrator(text, administratorName = "管理员") {
	const source = String(text ?? "").toLocaleLowerCase();
	return source.includes("@管理员") || source.includes("@admin") || administratorName && source.includes(`@${String(administratorName).toLocaleLowerCase()}`);
}
/** Resolve common role-card placeholders before text enters DSH's strict
* system-prompt renderer. Unknown placeholders are kept as readable labels
* without template braces, so imported character cards cannot break a turn. */
function renderPersonaTemplate(value, profileName, humanName = "用户") {
	return String(value ?? "").replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, rawName) => {
		const name = String(rawName).trim();
		const key = name.toLocaleLowerCase();
		if (/(?:user|human|player|用户|玩家|主人)/i.test(key)) return humanName;
		if (/(?:char|character|assistant|bot|role|角色|助手)/i.test(key)) return profileName;
		return name;
	}).replaceAll("{{", "{ {").replaceAll("}}", "} }");
}
/** Normalize only for exact-repeat protection. Message length and punctuation
* are deliberately preserved for display; the Agent decides its own message
* boundaries instead of the plugin slicing prose mechanically. */
function autonomousMessageFingerprint(value) {
	return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function isDuplicateAutonomousMessage(value, previousValues = []) {
	const fingerprint = autonomousMessageFingerprint(value);
	if (!fingerprint) return true;
	return previousValues.some((previous) => autonomousMessageFingerprint(previous) === fingerprint);
}
/** A batch answering one human message runs concurrently, so those agents may
* not see one another's same-batch replies. Schedule a semantic peer-reaction
* check before allowing the conversation to become idle. */
function shouldRequirePeerReaction(triggerSource, participantCount) {
	return triggerSource !== "auto" && Number(participantCount) > 1;
}
/** Identify prompts written by older Agent Arena builds before their DSH
* sessions were automatically archived. Keep this deliberately specific so a
* one-time migration cannot hide an ordinary user conversation by accident. */
function isArenaSessionPrompt(value) {
	const text = String(value ?? "");
	return text.startsWith("你正在“") && text.includes("协作群中，显示名称是") || text.startsWith("你正在社交群聊“") && text.includes("显示名称是") || text.startsWith("你刚在") && text.includes("里收到一条新消息：") || text.startsWith("你是群管理员 ") && (text.includes("人类用户刚刚对你说：") || text.includes("角色已经各自判断是否接话"));
}
const MUTE_PHRASES = [
	"stop talking",
	"stop replying",
	"stay quiet",
	"be quiet",
	"mute",
	"不要再说话",
	"不要说话",
	"先别说话",
	"别说话",
	"不要再回复",
	"不要回复",
	"先别回复",
	"别回复",
	"暂停发言",
	"停止发言",
	"保持安静",
	"闭嘴"
];
const UNMUTE_PHRASES = [
	"you can speak again",
	"resume speaking",
	"resume replying",
	"unmute",
	"可以继续说话了",
	"可以说话了",
	"继续说话",
	"恢复说话",
	"可以继续回复了",
	"可以回复了",
	"继续回复",
	"恢复回复",
	"恢复发言",
	"解除静默",
	"取消静默"
];
function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function phrasePattern(phrases) {
	return phrases.map(escapeRegExp).join("|");
}
/**
* Parse human-friendly speech controls such as “小王先别说话” and
* “@小王 可以继续回复了”.  Unmute wins if one message contains both forms.
*/
function parseSpeechDirectives(text, profiles) {
	const source = String(text ?? "").trim();
	const muteIds = /* @__PURE__ */ new Set();
	const unmuteIds = /* @__PURE__ */ new Set();
	const mutePattern = phrasePattern(MUTE_PHRASES);
	const unmutePattern = phrasePattern(UNMUTE_PHRASES);
	const allNames = "(?:大家|所有人|所有AI|全部AI|你们|全员|everyone|all AI users|all members)";
	const muteAll = new RegExp(`${allNames}.{0,8}(?:${mutePattern})|(?:${mutePattern}).{0,8}${allNames}`, "i").test(source);
	const unmuteAll = new RegExp(`${allNames}.{0,8}(?:${unmutePattern})|(?:${unmutePattern}).{0,8}${allNames}`, "i").test(source);
	const ordered = [...profiles].filter((profile) => profile?.id && profile?.name).sort((a, b) => String(b.name).length - String(a.name).length);
	for (const profile of ordered) {
		const name = `@?${escapeRegExp(profile.name)}`;
		if (new RegExp(`(?:${name}).{0,10}(?:${mutePattern})|(?:${mutePattern}).{0,10}(?:${name})`, "i").test(source)) muteIds.add(profile.id);
		if (new RegExp(`(?:${name}).{0,10}(?:${unmutePattern})|(?:${unmutePattern}).{0,10}(?:${name})`, "i").test(source)) unmuteIds.add(profile.id);
	}
	if (muteAll) ordered.forEach((profile) => muteIds.add(profile.id));
	if (unmuteAll) ordered.forEach((profile) => unmuteIds.add(profile.id));
	unmuteIds.forEach((id) => muteIds.delete(id));
	const hasDirective = muteIds.size > 0 || unmuteIds.size > 0;
	let remainder = source;
	for (const profile of ordered) remainder = remainder.replace(new RegExp(`@?${escapeRegExp(profile.name)}`, "gi"), "");
	for (const phrase of [...UNMUTE_PHRASES, ...MUTE_PHRASES]) remainder = remainder.replace(new RegExp(escapeRegExp(phrase), "gi"), "");
	remainder = remainder.replace(/大家|所有人|所有AI|全部AI|你们|全员/gi, "").replace(/\b(?:everyone|all AI users|all members|please)\b/gi, "").replace(/请|麻烦|让|叫|我|你|他|她|它|就|也|再|先|一下|暂时|现在|已经|了|吧|哦|哈/g, "").replace(/[\s，。！？、,.!?:：；;~～“”"'（）()]+/g, "");
	return {
		muteIds: profiles.filter((profile) => muteIds.has(profile?.id)).map((profile) => profile.id),
		unmuteIds: profiles.filter((profile) => unmuteIds.has(profile?.id)).map((profile) => profile.id),
		hasDirective,
		commandOnly: hasDirective && remainder.length === 0
	};
}
function publicMeeting(meeting) {
	return JSON.parse(JSON.stringify(meeting));
}
//#endregion
//#region src/index.mjs
const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store"
};
const BUSY_MEETING_STATUSES = /* @__PURE__ */ new Set([
	"queued",
	"running",
	"pausing"
]);
const LEGACY_TERMINAL_STATUSES = /* @__PURE__ */ new Set([
	"completed",
	"stopped",
	"failed",
	"interrupted"
]);
var HttpError = class extends Error {
	constructor(status, message) {
		super(messageText$1(message));
		this.status = status;
		this.i18n = messageDescriptor(message);
	}
};
const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
const safeError = (error) => error instanceof Error ? error.message : String(error);
const COOLDOWN_MS = 6e4;
const CHANNEL_WINDOW_MS = 6e4;
const DEFAULT_CHANNEL_REQUEST_LIMIT = 55;
const DEFAULT_COOLDOWN_ERROR_STATUSES = Object.freeze([429, 500]);
const AGENT_PERMISSION_MODES = Object.freeze([
	"read-only",
	"workspace-write",
	"danger-full-access"
]);
const AGENT_PERMISSION_LABELS = Object.freeze({
	"read-only": "Read Only",
	"workspace-write": "Workspace Write",
	"danger-full-access": "Full access"
});
const RATE_LIMIT_RE = /(?:429|rate.?limit|too many requests|频率|限流|请求过于频繁)/i;
const RETRY_CHANNEL_EXHAUSTED_RE = /(?:get_channel_failed|可用渠道不存在[（(]retry[）)]|upstream rate limit exceeded)/i;
const EMPTY_RESPONSE_RE = /(?:EMPTY_RESPONSE|returned a completed response with no content)/i;
function arenaChannelKey(selection) {
	return String(selection?.provider || "default");
}
function normalizeArenaRequestLimit(value) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1e4 ? parsed : DEFAULT_CHANNEL_REQUEST_LIMIT;
}
function normalizeArenaCooldownStatuses(value) {
	if (!Array.isArray(value)) return [...DEFAULT_COOLDOWN_ERROR_STATUSES];
	return [...new Set(value.map(Number).filter((status) => Number.isInteger(status) && status >= 100 && status <= 599))].slice(0, 20);
}
function arenaFailureStatus(value) {
	const failure = value?.failure && typeof value.failure === "object" ? value.failure : value;
	const description = `${String(failure?.code || "")} ${String(failure?.message || safeError(value))}`;
	const explicit = Number(failure?.status ?? failure?.statusCode ?? failure?.status_code);
	if (Number.isInteger(explicit) && explicit >= 100 && explicit <= 599) return explicit;
	const embedded = description.match(/(?:^|\D)([1-5]\d{2})(?=\D|$)/);
	if (embedded) return Number(embedded[1]);
	if (RATE_LIMIT_RE.test(description)) return 429;
	if (RETRY_CHANNEL_EXHAUSTED_RE.test(description)) return 500;
	return 0;
}
function isArenaRateLimitFailure(value, configuredStatuses = DEFAULT_COOLDOWN_ERROR_STATUSES) {
	return normalizeArenaCooldownStatuses(configuredStatuses).includes(arenaFailureStatus(value));
}
function isArenaEmptyResponseFailure(value) {
	const failure = value?.failure && typeof value.failure === "object" ? value.failure : value;
	return EMPTY_RESPONSE_RE.test(`${String(failure?.code || "")} ${String(failure?.message || safeError(value))}`);
}
function createArenaUserMessage(text) {
	return Object.freeze({
		id: randomUUID(),
		role: "user",
		content: Object.freeze([Object.freeze({
			type: "text",
			text
		})]),
		source: Object.freeze({
			kind: "plugin",
			plugin: "agent-arena"
		})
	});
}
function installArenaModelSelection(agentCtx, selectionOrProvider) {
	const resolveSelection = () => typeof selectionOrProvider === "function" ? selectionOrProvider() : selectionOrProvider;
	const state = { assembled: void 0 };
	const disposeAssembly = agentCtx.on("system-prompt/assemble", async (_assembly, _context, next) => {
		const selected = resolveSelection();
		const assembled = await next();
		state.assembled = selected;
		return {
			...assembled,
			variables: {
				...assembled.variables,
				provider: selected.provider,
				model: selected.model
			}
		};
	});
	const disposeRequest = agentCtx.on("agent/request", async (_payload, next) => {
		const resolved = await next();
		const selected = state.assembled;
		if (!selected) return resolved;
		const { reasoningEffort: _inheritedEffort, ...base } = resolved;
		return {
			...base,
			provider: selected.provider,
			model: selected.model,
			...selected.reasoningEffort === void 0 ? {} : { reasoningEffort: selected.reasoningEffort }
		};
	});
	return () => {
		disposeAssembly();
		disposeRequest();
	};
}
function messageText(output = []) {
	return output.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text.trim()).filter(Boolean).join("\n\n");
}
async function readJsonBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > 256 * 1024) throw new HttpError(413, uiMessage("readjsonbody.the.request.body.must.not.exceed.256.kb"));
		chunks.push(buffer);
	}
	if (!chunks.length) return {};
	try {
		return JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new HttpError(400, uiMessage("readjsonbody.the.request.body.is.not.valid.json"));
	}
}
function respond(res, status, body) {
	res.writeHead(status, JSON_HEADERS);
	res.end(JSON.stringify(body));
}
function transcriptText(items, emptyText = "（还没有消息）") {
	const text = items.filter((item) => item.kind !== "system").map((item) => `${item.speaker ?? item.senderName}: ${item.text}`).join("\n\n");
	return text.length > 24e3 ? text.slice(-24e3) : text || emptyText;
}
function meetingWorkspaceText(meeting) {
	ensureMeetingWorkspace(meeting);
	const participantName = (id) => meeting.participants?.find((item) => item.id === id)?.name || (id === "administrator" ? meeting.administratorProfile?.name : "") || "未分配";
	const tasks = meeting.tasks.length ? meeting.tasks.map((item) => `- [${item.status}] ${item.title}；负责人：${participantName(item.assigneeId)}${item.description ? `；${item.description}` : ""}`).join("\n") : "（暂无任务）";
	const decisions = meeting.decisions.length ? meeting.decisions.map((item) => `- [${item.status}] ${item.title}：${item.options.map((option) => `${option.id}=${option.label}`).join(" / ")}${item.selectedOptionId ? `；已选 ${item.selectedOptionId}` : ""}`).join("\n") : "（暂无待决策项）";
	const artifacts = meeting.artifacts.length ? meeting.artifacts.map((item) => `- [${item.status}] ${item.title}${item.location ? `；${item.location}` : ""}${item.description ? `；${item.description}` : ""}`).join("\n") : "（暂无成果）";
	return [
		`当前协作阶段：${meeting.collaborationStage}`,
		"任务板：",
		tasks,
		"决策板：",
		decisions,
		"成果板：",
		artifacts
	].join("\n");
}
function participantPrompt(meeting, participant, coordinationText = "") {
	return [
		`你正在“${meeting.topic}”协作群中，显示名称是 ${participant.name}。`,
		`你的人格与职责：${participant.role || "独立思考，主动推进问题并给出有依据的建议。"}`,
		"这不是表演式辩论，而是多位 AI 与人类共同讨论并完成工作的长期群聊。完整阅读其他成员的新发言，再决定是回应其具体观点、追问、反驳、补充、交接任务还是继续执行；不要把每次发言都写成互不相干的一次性答案。",
		"如果最近一条实质消息来自另一位 AI，请优先接住其中尚未解决的内容并可直接 @对方；有可执行工作时使用 DSH 提供的工具。不要复述已经说过的内容，也不要为了刷存在感而附和。",
		"你拥有当前 DSH Agent Preset 的完整能力，可按任务需要使用工具、技能和子 Agent。只报告真正完成的操作，不虚构调查、文件修改或外部结果。不要披露隐藏思维过程。",
		"公开发言时使用 arena_send_message。发一条还是多条、每条多长，都由你结合人格、语义和任务自然决定：能一条说清就发一条，需要自然分步、报告真实进度或补交最终结果时可以连续发送。绝对不要按字数、句号或固定模板机械切分。",
		"每次 arena_send_message 调用都会立刻显示在群聊中；调用过后不要在最终回答中重复这些公开内容。不要添加自己的姓名前缀，插件不限制输出 token。",
		"会议右侧有共享协作控制台。需要拆分或认领工作时更新任务板；出现多个可选方案时创建决策并留下理由、风险和信心；产出文件、链接或结论后登记到成果板。不要把这些结构化更新只写在聊天气泡里。",
		coordinationText,
		"",
		"当前协作控制台：",
		meetingWorkspaceText(meeting),
		"",
		"当前群聊记录：",
		transcriptText(meeting.transcript)
	].join("\n");
}
function chatPrompt(room, profile, coordinationText = "") {
	const otherNames = room.participants.filter((item) => item.id !== profile.id).map((item) => item.name);
	return [
		`你正在社交群聊“${room.name}”中，显示名称是 ${profile.name}。`,
		`你的人格设定：${profile.role || "自然、友善、清晰地交流，并主动提供有帮助的结果。"}`,
		room.type === "group" ? `群成员还有：${[
			room.humanProfile.name,
			...otherNames,
			room.administratorProfile?.name
		].filter(Boolean).join("、")}。` : `你正在和 ${room.humanProfile.name} 私聊。`,
		"完整阅读最近的人类与 AI 消息，像真实群友一样判断并回应具体话头；可以点名追问、反驳、补充或承接工作，不要只给与其他成员互不相干的一次性答案。你拥有当前 DSH Agent Preset 的完整能力，可以使用工具、技能和子 Agent 完成用户交办的工作。只报告真实完成的操作，不披露隐藏思维过程。",
		"公开发言时使用 arena_send_message。发一条还是多条、每条多长，都由你结合人格、语义和任务自然决定：能一条说清就发一条，需要自然分步、报告真实进度或补交最终结果时可以连续发送。绝对不要按字数、句号或固定模板机械切分。",
		"每次 arena_send_message 调用都会立刻显示在聊天中；调用过后不要在最终回答中重复这些公开内容。不要添加姓名前缀，插件不限制输出 token。",
		coordinationText,
		"",
		"聊天记录：",
		transcriptText(room.messages)
	].join("\n");
}
function inferAdminCommand(text) {
	const source = String(text ?? "");
	if (/(重开|重新|撤销).{0,6}(决策|方案|选择)/.test(source)) return {
		action: "reopen-decision",
		topic: "",
		stage: ""
	};
	if (/(暂停|先停一下|停止发言)/.test(source)) return {
		action: "pause",
		topic: "",
		stage: ""
	};
	if (/(总结并结束|结束会议|收尾|形成总结)/.test(source)) return {
		action: "finish",
		topic: "",
		stage: ""
	};
	if (/(继续讨论|继续发言|让大家继续|全员回答)/.test(source)) return {
		action: "continue",
		topic: "",
		stage: ""
	};
	const stageMatch = source.match(/(?:进入|切换到|改为)(讨论|规划|执行|评审|等待)(?:阶段)?/);
	if (stageMatch) return {
		action: "set-stage",
		topic: "",
		stage: {
			讨论: "discussion",
			规划: "planning",
			执行: "execution",
			评审: "review",
			等待: "waiting-human"
		}[stageMatch[1]]
	};
	if (/(?:更换|修改|切换|改变).{0,4}(?:话题|主题)|(?:话题|主题).{0,4}(?:改为|换成|切换为)/.test(source)) return {
		action: "change-topic",
		topic: source.match(/(?:话题|主题)(?:改为|修改为|换成|切换为|是|为|：|:)?\s*[“"]?([^”"\n]+)[”"]?$/)?.[1]?.trim() ?? "",
		stage: ""
	};
	return {
		action: "none",
		topic: "",
		stage: ""
	};
}
function adminSchema() {
	return {
		type: "object",
		properties: {
			reply: { type: "string" },
			action: {
				type: "string",
				enum: [
					"none",
					"change-topic",
					"reopen-decision",
					"continue",
					"pause",
					"finish",
					"set-stage"
				]
			},
			topic: { type: "string" },
			stage: {
				type: "string",
				enum: ["", ...MEETING_STAGES.filter((item) => item !== "completed")]
			}
		},
		required: [
			"reply",
			"action",
			"topic",
			"stage"
		],
		additionalProperties: false
	};
}
function finalSummarySchema() {
	return {
		type: "object",
		properties: {
			summary: { type: "string" },
			rationale: { type: "string" },
			openItems: {
				type: "array",
				items: { type: "string" }
			}
		},
		required: [
			"summary",
			"rationale",
			"openItems"
		],
		additionalProperties: false
	};
}
function replyIntentSchema() {
	return {
		type: "object",
		properties: {
			shouldSpeak: { type: "boolean" },
			reason: { type: "string" }
		},
		required: ["shouldSpeak", "reason"],
		additionalProperties: false
	};
}
function continuationGuardSchema(container) {
	return {
		type: "object",
		properties: {
			onTopic: { type: "boolean" },
			complete: { type: "boolean" },
			approvedSpeakerIds: {
				type: "array",
				items: {
					type: "string",
					enum: container.participants.map((item) => item.id)
				}
			},
			reason: { type: "string" }
		},
		required: [
			"onTopic",
			"complete",
			"approvedSpeakerIds",
			"reason"
		],
		additionalProperties: false
	};
}
const inject = [
	"agents",
	"agentPresets",
	"subagents",
	"systemPrompt",
	"tools",
	"webServer",
	"agentDefaultModel",
	"llm",
	"sessionPersistence",
	"workspaceRegistry"
];
function apply(ctx, config = {}) {
	const stateDir = resolve(String(config.stateDir || join(process.cwd(), ".dsh-agent-arena")));
	const stateFile = join(stateDir, "meetings.json");
	const maxConcurrentMeetings = Math.max(1, Math.min(3, Number(config.maxConcurrentMeetings) || 1));
	const meetings = /* @__PURE__ */ new Map();
	const rooms = /* @__PURE__ */ new Map();
	const profiles = {
		human: {
			id: "human",
			name: "你",
			avatar: "🧑"
		},
		settings: {
			rateLimitCooldownEnabled: false,
			channelQueueEnabled: false,
			channelRequestsPerMinute: DEFAULT_CHANNEL_REQUEST_LIMIT,
			cooldownErrorStatuses: [...DEFAULT_COOLDOWN_ERROR_STATUSES],
			autoReplyEnabled: true
		},
		administrator: {
			id: "administrator",
			name: "管理员",
			avatar: "🛡️",
			role: "维护协作秩序，并按人类用户的要求安全地调整话题、协作阶段与决策状态。",
			provider: "",
			model: ""
		},
		aiUsers: []
	};
	const queue = [];
	const runtimes = /* @__PURE__ */ new Map();
	const pendingMeetingStarts = /* @__PURE__ */ new Map();
	const roomRuntimes = /* @__PURE__ */ new Map();
	const channelQueues = /* @__PURE__ */ new Map();
	const channelCooldowns = /* @__PURE__ */ new Map();
	const channelRequestTimes = /* @__PURE__ */ new Map();
	const arenaSessionIds = /* @__PURE__ */ new Set();
	const arenaSessionContexts = /* @__PURE__ */ new Map();
	const pendingApprovals = /* @__PURE__ */ new Map();
	let activeCount = 0;
	let disposed = false;
	let persistChain = Promise.resolve();
	let catalogCache = {
		expiresAt: 0,
		value: []
	};
	const migrations = { archivedLegacyArenaSessions: false };
	function monitorProfiles(container) {
		return [...container.administratorProfile ? [container.administratorProfile] : [], ...Array.isArray(container.participants) ? container.participants : []].filter((profile) => profile?.id && profile?.name);
	}
	function ensureActivityMonitor(container) {
		const previous = new Map((container.activityMonitor?.roles ?? []).map((role) => [role.profileId, role]));
		const muted = new Set(Array.isArray(container.mutedParticipantIds) ? container.mutedParticipantIds : []);
		const roles = monitorProfiles(container).map((profile) => {
			const current = previous.get(profile.id);
			return {
				profileId: profile.id,
				name: profile.name,
				avatar: profile.avatar,
				model: profile.model || "",
				status: current?.status || (muted.has(profile.id) ? "muted" : "idle"),
				stage: current?.stage || (muted.has(profile.id) ? "已静默" : "等待任务"),
				stageI18n: current?.stageI18n,
				detailI18n: current?.detailI18n,
				currentToolI18n: current?.currentToolI18n,
				detail: current?.detail || "",
				currentTool: current?.currentTool || "",
				claimedFiles: Array.isArray(current?.claimedFiles) ? current.claimedFiles.slice(0, 20) : [],
				history: Array.isArray(current?.history) ? current.history.slice(-2e3) : Array.isArray(current?.recent) ? current.recent.slice(-10) : [],
				recent: Array.isArray(current?.history) ? current.history.slice(-10) : Array.isArray(current?.recent) ? current.recent.slice(-10) : [],
				updatedAt: current?.updatedAt || nowIso()
			};
		});
		container.activityMonitor = {
			updatedAt: container.activityMonitor?.updatedAt || nowIso(),
			roles
		};
		return container.activityMonitor;
	}
	function workspaceSnapshot(meeting) {
		ensureMeetingWorkspace(meeting);
		return {
			stage: meeting.collaborationStage,
			tasks: meeting.tasks,
			decisions: meeting.decisions,
			artifacts: meeting.artifacts
		};
	}
	function workspaceText(value, maxLength = 1200) {
		return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
	}
	function workspaceAssignee(meeting, value, allowEmpty = true) {
		const id = workspaceText(value, 80);
		if (!id && allowEmpty) return null;
		if (!meeting.participants.some((item) => item.id === id) && id !== "administrator") throw new HttpError(400, uiMessage("workspaceassignee.the.assignee.is.not.a.member.of.this.meeting"));
		return id;
	}
	function createWorkspaceTask(meeting, raw, createdBy = "human") {
		ensureMeetingWorkspace(meeting);
		const title = workspaceText(raw?.title, 160);
		if (!title) throw new HttpError(400, uiMessage("createworkspacetask.the.task.title.cannot.be.empty"));
		const timestamp = nowIso();
		const task = {
			id: randomUUID(),
			title,
			description: workspaceText(raw?.description, 1600),
			assigneeId: workspaceAssignee(meeting, raw?.assigneeId),
			status: "todo",
			createdBy,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		meeting.tasks.push(task);
		if (meeting.collaborationStage === "discussion") meeting.collaborationStage = "planning";
		return task;
	}
	function updateWorkspaceTask(meeting, raw) {
		ensureMeetingWorkspace(meeting);
		const task = meeting.tasks.find((item) => item.id === String(raw?.taskId ?? ""));
		if (!task) throw new HttpError(404, uiMessage("updateworkspacetask.this.task.was.not.found"));
		if (Object.hasOwn(raw ?? {}, "title")) {
			const title = workspaceText(raw.title, 160);
			if (!title) throw new HttpError(400, uiMessage("createworkspacetask.the.task.title.cannot.be.empty"));
			task.title = title;
		}
		if (Object.hasOwn(raw ?? {}, "description")) task.description = workspaceText(raw.description, 1600);
		if (Object.hasOwn(raw ?? {}, "assigneeId")) task.assigneeId = workspaceAssignee(meeting, raw.assigneeId);
		if (Object.hasOwn(raw ?? {}, "status")) {
			const status = String(raw.status ?? "");
			if (!TASK_STATUSES.includes(status)) throw new HttpError(400, uiMessage("updateworkspacetask.invalid.task.status"));
			task.status = status;
			if (status === "in-progress") meeting.collaborationStage = "execution";
			else if (status === "review") meeting.collaborationStage = "review";
		}
		task.updatedAt = nowIso();
		return task;
	}
	function deleteWorkspaceTask(meeting, raw) {
		ensureMeetingWorkspace(meeting);
		const index = meeting.tasks.findIndex((item) => item.id === String(raw?.taskId ?? ""));
		if (index < 0) throw new HttpError(404, uiMessage("updateworkspacetask.this.task.was.not.found"));
		return meeting.tasks.splice(index, 1)[0];
	}
	function normalizeDecisionOptions(rawOptions) {
		const options = (Array.isArray(rawOptions) ? rawOptions : []).map((value) => {
			const label = workspaceText(typeof value === "string" ? value : value?.label, 160);
			const description = workspaceText(typeof value === "object" ? value?.description : "", 1e3);
			return label ? {
				id: randomUUID(),
				label,
				description,
				opinions: []
			} : null;
		}).filter(Boolean).slice(0, 6);
		if (options.length < 2) throw new HttpError(400, uiMessage("normalizedecisionoptions.a.decision.requires.at.least.two.valid.options"));
		return options;
	}
	function createWorkspaceDecision(meeting, raw, createdBy = "human") {
		ensureMeetingWorkspace(meeting);
		const title = workspaceText(raw?.title, 160);
		if (!title) throw new HttpError(400, uiMessage("createworkspacedecision.the.decision.title.cannot.be.empty"));
		const timestamp = nowIso();
		const decision = {
			id: randomUUID(),
			title,
			description: workspaceText(raw?.description, 1600),
			options: normalizeDecisionOptions(raw?.options),
			status: "open",
			selectedOptionId: null,
			selectedBy: null,
			createdBy,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		meeting.decisions.push(decision);
		if (meeting.collaborationStage === "discussion") meeting.collaborationStage = "planning";
		return decision;
	}
	function addDecisionOpinion(meeting, raw, profile) {
		ensureMeetingWorkspace(meeting);
		const decision = meeting.decisions.find((item) => item.id === String(raw?.decisionId ?? ""));
		if (!decision) throw new HttpError(404, uiMessage("adddecisionopinion.this.decision.was.not.found"));
		const option = decision.options.find((item) => item.id === String(raw?.optionId ?? ""));
		if (!option) throw new HttpError(404, uiMessage("adddecisionopinion.this.decision.option.was.not.found"));
		const stance = [
			"support",
			"oppose",
			"neutral"
		].includes(String(raw?.stance)) ? String(raw.stance) : "neutral";
		const confidence = Math.max(0, Math.min(100, Number(raw?.confidence) || 0));
		const opinion = {
			profileId: profile.id,
			name: profile.name,
			avatar: profile.avatar,
			stance,
			reason: workspaceText(raw?.description ?? raw?.reason, 1200),
			risk: workspaceText(raw?.risk, 800),
			confidence,
			updatedAt: nowIso()
		};
		option.opinions = Array.isArray(option.opinions) ? option.opinions : [];
		const previous = option.opinions.findIndex((item) => item.profileId === profile.id);
		if (previous >= 0) option.opinions.splice(previous, 1, opinion);
		else option.opinions.push(opinion);
		decision.updatedAt = nowIso();
		return opinion;
	}
	function chooseWorkspaceDecision(meeting, raw, selectedBy = "human") {
		ensureMeetingWorkspace(meeting);
		const decision = meeting.decisions.find((item) => item.id === String(raw?.decisionId ?? ""));
		if (!decision) throw new HttpError(404, uiMessage("adddecisionopinion.this.decision.was.not.found"));
		const optionId = String(raw?.optionId ?? "");
		if (!decision.options.some((item) => item.id === optionId)) throw new HttpError(400, uiMessage("chooseworkspacedecision.invalid.decision.option"));
		decision.selectedOptionId = optionId;
		decision.selectedBy = selectedBy;
		decision.status = "decided";
		decision.updatedAt = nowIso();
		meeting.collaborationStage = "execution";
		return decision;
	}
	function reopenWorkspaceDecision(meeting, raw) {
		ensureMeetingWorkspace(meeting);
		const decision = meeting.decisions.find((item) => item.id === String(raw?.decisionId ?? ""));
		if (!decision) throw new HttpError(404, uiMessage("adddecisionopinion.this.decision.was.not.found"));
		decision.selectedOptionId = null;
		decision.selectedBy = null;
		decision.status = "open";
		decision.updatedAt = nowIso();
		meeting.collaborationStage = "discussion";
		return decision;
	}
	function deleteWorkspaceDecision(meeting, raw) {
		ensureMeetingWorkspace(meeting);
		const index = meeting.decisions.findIndex((item) => item.id === String(raw?.decisionId ?? ""));
		if (index < 0) throw new HttpError(404, uiMessage("adddecisionopinion.this.decision.was.not.found"));
		return meeting.decisions.splice(index, 1)[0];
	}
	function createWorkspaceArtifact(meeting, raw, createdBy = "human") {
		ensureMeetingWorkspace(meeting);
		const title = workspaceText(raw?.title, 160);
		if (!title) throw new HttpError(400, uiMessage("createworkspaceartifact.the.deliverable.title.cannot.be.empty"));
		const artifactType = [
			"file",
			"link",
			"note",
			"summary"
		].includes(String(raw?.artifactType)) ? String(raw.artifactType) : "note";
		const timestamp = nowIso();
		const artifact = {
			id: randomUUID(),
			title,
			description: workspaceText(raw?.description, 2400),
			artifactType,
			location: workspaceText(raw?.location, 1600),
			ownerId: workspaceAssignee(meeting, raw?.ownerId),
			status: "draft",
			createdBy,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		meeting.artifacts.push(artifact);
		meeting.collaborationStage = "review";
		return artifact;
	}
	function updateWorkspaceArtifact(meeting, raw) {
		ensureMeetingWorkspace(meeting);
		const artifact = meeting.artifacts.find((item) => item.id === String(raw?.artifactId ?? ""));
		if (!artifact) throw new HttpError(404, uiMessage("updateworkspaceartifact.this.deliverable.was.not.found"));
		if (Object.hasOwn(raw ?? {}, "status")) {
			const status = String(raw.status ?? "");
			if (![
				"draft",
				"accepted",
				"rejected"
			].includes(status)) throw new HttpError(400, uiMessage("updateworkspaceartifact.invalid.deliverable.status"));
			artifact.status = status;
		}
		if (Object.hasOwn(raw ?? {}, "title")) artifact.title = workspaceText(raw.title, 160) || artifact.title;
		if (Object.hasOwn(raw ?? {}, "description")) artifact.description = workspaceText(raw.description, 2400);
		if (Object.hasOwn(raw ?? {}, "location")) artifact.location = workspaceText(raw.location, 1600);
		artifact.updatedAt = nowIso();
		return artifact;
	}
	function deleteWorkspaceArtifact(meeting, raw) {
		ensureMeetingWorkspace(meeting);
		const index = meeting.artifacts.findIndex((item) => item.id === String(raw?.artifactId ?? ""));
		if (index < 0) throw new HttpError(404, uiMessage("updateworkspaceartifact.this.deliverable.was.not.found"));
		return meeting.artifacts.splice(index, 1)[0];
	}
	function roleActivity(container, profile) {
		const monitor = ensureActivityMonitor(container);
		let role = monitor.roles.find((item) => item.profileId === profile.id);
		if (!role) {
			role = {
				profileId: profile.id,
				name: profile.name,
				avatar: profile.avatar,
				model: profile.model || "",
				status: "idle",
				stage: "等待任务",
				detail: "",
				currentTool: "",
				claimedFiles: [],
				history: [],
				recent: [],
				updatedAt: nowIso()
			};
			monitor.roles.push(role);
		}
		return role;
	}
	function setRoleActivity(container, profile, patch = {}, eventText = "", eventKind = "info", eventTime) {
		if (!container || !profile?.id) return;
		const role = roleActivity(container, profile);
		const timestamp = eventTime ? new Date(eventTime).toISOString() : nowIso();
		const localizedPatch = { ...patch };
		for (const field of [
			"stage",
			"detail",
			"currentTool"
		]) {
			if (!Object.hasOwn(patch, field)) continue;
			localizedPatch[field] = messageText$1(patch[field]);
			localizedPatch[`${field}I18n`] = messageDescriptor(patch[field]) ?? null;
		}
		Object.assign(role, localizedPatch, {
			name: profile.name,
			avatar: profile.avatar,
			model: profile.model || role.model || "",
			updatedAt: timestamp
		});
		if (eventText) {
			const text = messageText$1(eventText).trim().slice(0, 320);
			const last = role.history.at(-1) || role.recent.at(-1);
			if (!last || last.text !== text || last.kind !== eventKind) {
				role.history ??= [];
				role.history.push({
					id: randomUUID(),
					kind: eventKind,
					text,
					i18n: messageDescriptor(eventText) ?? null,
					createdAt: timestamp
				});
				role.history = role.history.slice(-2e3);
				role.recent = role.history.slice(-10);
			}
		}
		container.activityMonitor.updatedAt = timestamp;
	}
	function coordinationBoard(runtime, selfId) {
		return ensureActivityMonitor(runtime.container).roles.map((role) => ({
			profileId: role.profileId,
			name: role.name,
			status: role.status,
			stage: role.stage,
			detail: role.detail,
			currentTool: role.currentTool,
			claimedFiles: role.claimedFiles,
			isSelf: role.profileId === selfId
		}));
	}
	function releaseRoleClaims(runtime, profileId, requestedFiles = []) {
		runtime.fileClaims ??= /* @__PURE__ */ new Map();
		const requested = requestedFiles.map((file) => normalizeCoordinationFile(file, runtime.workdir)).filter(Boolean);
		const keys = requested.length ? new Set(requested.map((item) => item.key)) : null;
		for (const [key, claim] of runtime.fileClaims) if (claim.ownerId === profileId && (!keys || keys.has(key))) runtime.fileClaims.delete(key);
		const profile = monitorProfiles(runtime.container).find((item) => item.id === profileId);
		if (profile) {
			const claimedFiles = [...runtime.fileClaims.values()].filter((claim) => claim.ownerId === profileId).map((claim) => claim.path);
			setRoleActivity(runtime.container, profile, { claimedFiles });
		}
	}
	function claimRoleFiles(runtime, profile, requestedFiles) {
		runtime.fileClaims ??= /* @__PURE__ */ new Map();
		const files = [...new Map(requestedFiles.map((file) => normalizeCoordinationFile(file, runtime.workdir)).filter(Boolean).map((item) => [item.key, item])).values()].slice(0, 20);
		const conflicts = files.flatMap((file) => {
			const claim = runtime.fileClaims.get(file.key);
			if (!claim || claim.ownerId === profile.id) return [];
			return [{
				file: file.path,
				ownerId: claim.ownerId,
				ownerName: claim.ownerName
			}];
		});
		if (conflicts.length) return {
			ok: false,
			files,
			conflicts
		};
		for (const file of files) runtime.fileClaims.set(file.key, {
			ownerId: profile.id,
			ownerName: profile.name,
			path: file.path
		});
		const claimedFiles = [...runtime.fileClaims.values()].filter((claim) => claim.ownerId === profile.id).map((claim) => claim.path);
		setRoleActivity(runtime.container, profile, {
			status: "editing",
			stage: uiMessage("claimrolefiles.files.locked.preparing.to.edit"),
			claimedFiles
		}, files.length ? uiMessage("claimrolefiles.locked.value.files", { p0: files.length }) : "");
		return {
			ok: true,
			files,
			conflicts: []
		};
	}
	function mutationTargets(toolName, rawArguments) {
		const name = String(toolName || "").toLocaleLowerCase();
		const args = rawArguments && typeof rawArguments === "object" ? rawArguments : {};
		if (name === "write" || name === "edit") return [args.file_path];
		if (name === "str_replace_editor" && args.command !== "view") return [args.path];
		if (name === "apply_patch") return [...String(args.patch ?? args.input ?? "").matchAll(/^\*\*\* (?:Update|Add|Delete) File:\s*(.+)$/gm)].map((match) => match[1]);
		return [];
	}
	function coordinationTool(runtime, profile) {
		return {
			name: "arena_coordination",
			description: "查看其他角色动态与会议协作控制台；更新自己的状态；创建或推进任务；提出决策、对方案发表意见；登记成果；编辑前原子锁定文件。",
			parameters: {
				type: "object",
				additionalProperties: false,
				properties: {
					action: {
						type: "string",
						enum: [
							"view",
							"update",
							"claim",
							"release",
							"task-create",
							"task-update",
							"decision-create",
							"decision-opinion",
							"artifact-add"
						]
					},
					summary: {
						type: "string",
						description: "正在做什么，简短说明。"
					},
					files: {
						type: "array",
						items: { type: "string" },
						description: "需要锁定或释放的文件路径。"
					},
					taskId: {
						type: "string",
						description: "要更新的任务 ID。"
					},
					decisionId: {
						type: "string",
						description: "要评论的决策 ID。"
					},
					optionId: {
						type: "string",
						description: "要评论的方案 ID。"
					},
					title: {
						type: "string",
						description: "任务、决策或成果标题。"
					},
					description: {
						type: "string",
						description: "详细说明或方案理由。"
					},
					assigneeId: {
						type: "string",
						description: "负责人 ID；留空表示未分配。"
					},
					status: {
						type: "string",
						enum: TASK_STATUSES
					},
					options: {
						type: "array",
						items: { type: "string" },
						description: "创建决策时的 2 到 6 个候选方案。"
					},
					stance: {
						type: "string",
						enum: [
							"support",
							"oppose",
							"neutral"
						]
					},
					risk: {
						type: "string",
						description: "方案风险。"
					},
					confidence: {
						type: "number",
						description: "对该判断的信心，0 到 100。"
					},
					artifactType: {
						type: "string",
						enum: [
							"file",
							"link",
							"note",
							"summary"
						]
					},
					location: {
						type: "string",
						description: "文件路径或链接。"
					}
				},
				required: ["action"]
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						ok: { type: "boolean" },
						message: { type: "string" },
						conflicts: {
							type: "array",
							items: {
								type: "object",
								additionalProperties: false,
								properties: {
									file: { type: "string" },
									ownerId: { type: "string" },
									ownerName: { type: "string" }
								},
								required: [
									"file",
									"ownerId",
									"ownerName"
								]
							}
						},
						workspaceJson: {
							type: "string",
							description: "当前会议任务、决策、成果和阶段的 JSON 快照；普通聊天中为空对象。"
						},
						roles: {
							type: "array",
							items: {
								type: "object",
								additionalProperties: false,
								properties: {
									profileId: { type: "string" },
									name: { type: "string" },
									status: { type: "string" },
									stage: { type: "string" },
									detail: { type: "string" },
									currentTool: { type: "string" },
									claimedFiles: {
										type: "array",
										items: { type: "string" }
									},
									isSelf: { type: "boolean" }
								},
								required: [
									"profileId",
									"name",
									"status",
									"stage",
									"detail",
									"currentTool",
									"claimedFiles",
									"isSelf"
								]
							}
						}
					},
					required: [
						"ok",
						"message",
						"conflicts",
						"roles",
						"workspaceJson"
					]
				},
				render: (_args, value) => [{
					type: "text",
					text: JSON.stringify(value, null, 2)
				}]
			},
			async execute(raw) {
				const action = String(raw?.action || "view");
				const summary = String(raw?.summary || "").trim().slice(0, 280);
				const files = Array.isArray(raw?.files) ? raw.files.map(String).slice(0, 20) : [];
				let ok = true;
				let message = "已返回实时协作板。";
				let conflicts = [];
				if (action === "update") {
					setRoleActivity(runtime.container, profile, {
						status: "working",
						stage: summary || uiMessage("coordinationtool.working.on.the.task"),
						detail: summary
					}, summary || uiMessage("coordinationtool.updated.work.status"));
					message = "工作状态已更新。";
				} else if (action === "claim") {
					const result = claimRoleFiles(runtime, profile, files);
					ok = result.ok;
					conflicts = result.conflicts;
					if (ok) {
						if (summary) setRoleActivity(runtime.container, profile, {
							detail: summary,
							stage: summary
						});
						message = files.length ? "文件已锁定；完成编辑后请 release。" : "没有提供可锁定的文件。";
					} else {
						const owners = [...new Set(conflicts.map((item) => item.ownerName))].join("、");
						setRoleActivity(runtime.container, profile, {
							status: "waiting",
							stage: uiMessage("coordinationtool.waiting.for.file.locks"),
							detail: uiMessage("coordinationtool.value.is.editing.conflicting.files", { p0: owners })
						}, uiMessage("coordinationtool.file.conflict.detected.value", { p0: owners }), "warning");
						message = `锁定失败：${owners} 正在编辑这些文件。不要修改冲突文件；请等待、换任务或与对方协调。`;
					}
				} else if (action === "release") {
					releaseRoleClaims(runtime, profile.id, files);
					setRoleActivity(runtime.container, profile, {
						status: "working",
						stage: summary || uiMessage("coordinationtool.file.locks.released"),
						detail: summary
					}, uiMessage("coordinationtool.released.file.locks"));
					message = "文件锁已释放。";
				} else if (action === "task-create" && runtime.isMeeting) {
					const task = createWorkspaceTask(runtime.container, raw, profile.id);
					setRoleActivity(runtime.container, profile, {
						status: "working",
						stage: uiMessage("coordinationtool.task.created.value", { p0: task.title }),
						detail: task.description
					}, uiMessage("coordinationtool.created.task.value", { p0: task.title }));
					message = `任务已创建，ID：${task.id}`;
				} else if (action === "task-update" && runtime.isMeeting) {
					const task = updateWorkspaceTask(runtime.container, raw);
					setRoleActivity(runtime.container, profile, {
						status: task.status === "blocked" ? "waiting" : "working",
						stage: uiMessage("coordinationtool.task.value.value", {
							p0: task.title,
							p1: task.status
						}),
						detail: task.description
					}, uiMessage("coordinationtool.updated.task.value.value", {
						p0: task.title,
						p1: task.status
					}), task.status === "blocked" ? "warning" : "info");
					message = `任务已更新：${task.title}`;
				} else if (action === "decision-create" && runtime.isMeeting) message = `决策已创建，ID：${createWorkspaceDecision(runtime.container, raw, profile.id).id}；请相关成员用 decision-opinion 对具体方案留下理由、风险与信心。`;
				else if (action === "decision-opinion" && runtime.isMeeting) {
					addDecisionOpinion(runtime.container, raw, profile);
					message = "方案意见已记录，最终方案由人类用户选择。";
				} else if (action === "artifact-add" && runtime.isMeeting) {
					const artifact = createWorkspaceArtifact(runtime.container, {
						...raw,
						ownerId: profile.id
					}, profile.id);
					setRoleActivity(runtime.container, profile, {
						status: "working",
						stage: uiMessage("coordinationtool.deliverable.registered.value", { p0: artifact.title }),
						detail: artifact.location || artifact.description
					}, uiMessage("coordinationtool.registered.deliverable.value", { p0: artifact.title }), "success");
					message = `成果已登记，ID：${artifact.id}`;
				} else if (![
					"view",
					"update",
					"claim",
					"release"
				].includes(action)) {
					ok = false;
					message = runtime.isMeeting ? "协作控制台操作参数无效。" : "任务、决策和成果只在协作会议中可用。";
				} else setRoleActivity(runtime.container, profile, {
					stage: summary || uiMessage("coordinationtool.viewing.collaboration.activity"),
					detail: summary
				});
				return {
					ok,
					message,
					conflicts,
					roles: coordinationBoard(runtime, profile.id),
					workspaceJson: JSON.stringify(runtime.isMeeting ? workspaceSnapshot(runtime.container) : {})
				};
			}
		};
	}
	function autonomousMessageTool(runtime, profile) {
		return {
			name: "arena_send_message",
			description: "立即向当前 Agent Arena 会议、群聊或私聊发送一条公开消息。你自己决定是否调用、调用几次以及每条多长；不要按字数机械切分。适合自然回应、阶段性进度和最终结果。",
			parameters: {
				type: "object",
				additionalProperties: false,
				properties: { text: {
					type: "string",
					description: "现在要公开发送的完整消息。不要添加自己的姓名前缀。"
				} },
				required: ["text"]
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						ok: { type: "boolean" },
						message: { type: "string" },
						messageId: { type: "string" }
					},
					required: [
						"ok",
						"message",
						"messageId"
					]
				},
				render: (_args, value) => [{
					type: "text",
					text: JSON.stringify(value, null, 2)
				}]
			},
			async execute(raw) {
				const turn = runtime.messageTurns?.get(profile.id);
				if (!turn || turn.phase !== "work") return {
					ok: false,
					message: "当前不在公开发言阶段；不要在确认或内部判断阶段发送群消息。",
					messageId: ""
				};
				if (runtime.abort.signal.aborted || runtime.cancelCurrentWork || isMuted(runtime.container, profile.id)) return {
					ok: false,
					message: "本轮已停止或你已被静默，消息没有发送。",
					messageId: ""
				};
				const text = typeof raw?.text === "string" ? raw.text.trim() : "";
				if (!text) return {
					ok: false,
					message: "空消息不会发送。",
					messageId: ""
				};
				if (isDuplicateAutonomousMessage(text, turn.sentTexts)) return {
					ok: false,
					message: "这条内容在本轮已经发送过，请不要重复；继续工作或发送真正的新内容。",
					messageId: ""
				};
				const message = appendAutonomousMessage(runtime.container, profile, runtime, text, turn);
				turn.sentTexts.push(text);
				turn.messageIds.push(message.id);
				setRoleActivity(runtime.container, profile, {
					status: "working",
					stage: uiMessage("autonomousmessagetool.sent.a.message.continuing.work"),
					detail: text.slice(0, 180),
					currentTool: ""
				}, uiMessage("autonomousmessagetool.sent.a.public.message"), "message");
				await persist();
				return {
					ok: true,
					message: "消息已立即显示。需要继续工作就继续；有新的自然内容或最终结果时可以再次调用，不要重复已发送内容。",
					messageId: message.id
				};
			}
		};
	}
	function installCoordinationPlane(agentCtx, runtime, profile) {
		agentCtx.tools.register(coordinationTool(runtime, profile));
		agentCtx.tools.register(autonomousMessageTool(runtime, profile));
		agentCtx.tools.guard((exec) => {
			const files = mutationTargets(exec.name, exec.arguments).map((file) => normalizeCoordinationFile(file, runtime.workdir)).filter(Boolean);
			if (!files.length) return void 0;
			runtime.fileClaims ??= /* @__PURE__ */ new Map();
			for (const file of files) {
				const claim = runtime.fileClaims.get(file.key);
				if (claim?.ownerId === profile.id) continue;
				if (claim) {
					setRoleActivity(runtime.container, profile, {
						status: "waiting",
						stage: uiMessage("installcoordinationplane.editing.conflict.detected"),
						detail: uiMessage("installcoordinationplane.value.is.editing.value", {
							p0: claim.ownerName,
							p1: file.path
						})
					}, uiMessage("installcoordinationplane.blocked.a.conflicting.edit.value", { p0: file.path }), "warning");
					return `Agent Arena 已阻止编辑冲突：${claim.ownerName} 正在编辑 ${file.path}。请通过 arena_coordination 查看协作板并等待或改做其他任务。`;
				}
				return `为避免多角色编辑冲突，请先调用 arena_coordination，action=claim，files 包含 ${file.path}；锁定成功后再编辑。`;
			}
		});
	}
	function coordinationPrompt(runtime, selfId) {
		return [
			"",
			"实时协作规则：你可以使用 arena_coordination 查看其他角色和协作控制台。开始实质工作时先 update；可用 task-create/task-update 拆分、认领和推进任务，用 decision-create 提出备选方案，用 decision-opinion 写明立场、理由、风险和信心，用 artifact-add 登记真实成果。修改文件前必须先用 claim 原子锁定目标文件，发生冲突时不得覆盖对方修改；完成后 release。不得用 Shell 写入命令绕过文件锁。公开聊天使用 arena_send_message，由你按人格和实际语义决定自然的消息边界，不要机械切分，也不要每轮都先发套话确认。",
			"其他角色当前动态（开始本轮时的快照，随时用 arena_coordination view 刷新）：",
			coordinationBoard(runtime, selfId).filter((role) => !role.isSelf).map((role) => `${role.name}：${role.stage}${role.claimedFiles.length ? `；已锁定 ${role.claimedFiles.join("、")}` : ""}`).join("\n") || "当前没有其他 AI 角色。"
		].join("\n");
	}
	const persist = () => {
		const payload = JSON.stringify({
			version: 4,
			meetings: [...meetings.values()],
			rooms: [...rooms.values()],
			profiles,
			migrations
		}, null, 2);
		persistChain = persistChain.catch(() => void 0).then(async () => {
			await mkdir(stateDir, { recursive: true });
			await writeFile(stateFile, `${payload}\n`, "utf8");
		});
		return persistChain;
	};
	async function archiveArenaAgent(handle) {
		try {
			await ctx.workspaceRegistry.archiveSession(handle.agent.id);
			return handle;
		} catch (error) {
			await handle.dispose().catch(() => void 0);
			throw error;
		}
	}
	async function archiveLegacyArenaSessions() {
		const archived = new Set(ctx.workspaceRegistry.archivedSessionIds);
		const headers = await ctx.sessionPersistence.list();
		let complete = true;
		for (const header of headers) {
			if (header.origin === "subagent" || archived.has(header.id)) continue;
			if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(header.id))) continue;
			try {
				if (!(await ctx.sessionPersistence.inspect(header.id)).events.some((event) => event.type === "user/message" && isArenaSessionPrompt(messageText(event.data?.content)))) continue;
				await ctx.workspaceRegistry.archiveSession(header.id);
				archived.add(header.id);
			} catch {
				complete = false;
			}
		}
		return complete;
	}
	function defaultModel() {
		return ctx.agentDefaultModel.currentSelection();
	}
	function administratorSnapshot() {
		const selection = defaultModel();
		return {
			...profiles.administrator,
			provider: profiles.administrator.provider || selection.provider,
			model: profiles.administrator.model || selection.model
		};
	}
	const hydrated = (async () => {
		await mkdir(stateDir, { recursive: true });
		let recovered = false;
		try {
			const stored = JSON.parse(await readFile(stateFile, "utf8"));
			migrations.archivedLegacyArenaSessions = stored?.migrations?.archivedLegacyArenaSessions === true;
			if (stored?.profiles?.human) profiles.human = {
				id: "human",
				name: String(stored.profiles.human.name || "你").slice(0, 24),
				avatar: cleanAvatar(stored.profiles.human.avatar, "🧑")
			};
			if (stored?.profiles?.settings) profiles.settings = {
				...profiles.settings,
				rateLimitCooldownEnabled: stored.profiles.settings.rateLimitCooldownEnabled === true,
				channelQueueEnabled: stored.profiles.settings.channelQueueEnabled === true,
				channelRequestsPerMinute: normalizeArenaRequestLimit(stored.profiles.settings.channelRequestsPerMinute),
				cooldownErrorStatuses: normalizeArenaCooldownStatuses(stored.profiles.settings.cooldownErrorStatuses),
				autoReplyEnabled: stored.profiles.settings.autoReplyEnabled !== false
			};
			if (stored?.profiles?.administrator) profiles.administrator = {
				...profiles.administrator,
				...stored.profiles.administrator,
				id: "administrator"
			};
			if (Array.isArray(stored?.profiles?.aiUsers)) profiles.aiUsers = stored.profiles.aiUsers.filter((item) => item?.id && item?.name && item?.provider && item?.model).map((item) => ({
				...item,
				autoReplyDisabled: item.autoReplyDisabled === true
			}));
			for (const room of Array.isArray(stored?.rooms) ? stored.rooms : []) {
				if (!room?.id) continue;
				if (room.type === "group" && !room.administratorProfile) {
					recovered = true;
					room.administratorProfile = administratorSnapshot();
				}
				if (room.status === "responding") {
					recovered = true;
					room.status = "idle";
					room.respondingProfileId = null;
					room.respondingProfileIds = [];
					room.messages = Array.isArray(room.messages) ? room.messages : [];
					room.messages.push({
						id: randomUUID(),
						kind: "system",
						senderId: "system",
						senderName: "系统",
						avatar: "ℹ️",
						text: "DSH 重启中断了上次回复，请重新发送消息。",
						createdAt: nowIso()
					});
				}
				room.mutedParticipantIds = Array.isArray(room.mutedParticipantIds) ? room.mutedParticipantIds : [];
				room.permissions = room.permissions && typeof room.permissions === "object" ? room.permissions : {};
				room.workdir = typeof room.workdir === "string" ? room.workdir.trim() : "";
				for (const participant of permissionProfiles(room)) room.permissions[participant.id] = normalizePermissionMode(room.permissions[participant.id]);
				for (const message of room.messages ?? []) if (message.approval?.status === "pending") message.approval.status = "cancelled";
				room.respondingProfileIds = Array.isArray(room.respondingProfileIds) ? room.respondingProfileIds : [];
				const roomMonitor = ensureActivityMonitor(room);
				for (const role of roomMonitor.roles) {
					role.status = room.mutedParticipantIds.includes(role.profileId) ? "muted" : "idle";
					role.stage = role.status === "muted" ? "已静默" : "等待任务";
					role.stageI18n = messageDescriptor(uiMessage(role.status === "muted" ? "role_activity.muted" : "roleactivity.waiting.for.a.task"));
					role.currentTool = "";
					role.currentToolI18n = null;
					role.claimedFiles = [];
				}
				rooms.set(room.id, room);
			}
			for (const meeting of Array.isArray(stored?.meetings) ? stored.meetings : []) {
				if (!meeting?.id) continue;
				if (!Array.isArray(meeting.tasks) || !Array.isArray(meeting.decisions) || !Array.isArray(meeting.artifacts) || !MEETING_STAGES.includes(meeting.collaborationStage)) recovered = true;
				ensureMeetingWorkspace(meeting);
				if (BUSY_MEETING_STATUSES.has(meeting.status) || LEGACY_TERMINAL_STATUSES.has(meeting.status)) {
					recovered = true;
					meeting.status = "paused";
					meeting.error = null;
					if (meeting.collaborationStage === "completed") meeting.collaborationStage = "waiting-human";
					meeting.updatedAt = nowIso();
					meeting.participants = (meeting.participants ?? []).map((item) => ({
						...item,
						status: "idle"
					}));
				}
				meeting.mutedParticipantIds = Array.isArray(meeting.mutedParticipantIds) ? meeting.mutedParticipantIds : [];
				meeting.permissions = meeting.permissions && typeof meeting.permissions === "object" ? meeting.permissions : {};
				meeting.workdir = typeof meeting.workdir === "string" ? meeting.workdir.trim() : "";
				for (const participant of permissionProfiles(meeting)) meeting.permissions[participant.id] = normalizePermissionMode(meeting.permissions[participant.id]);
				for (const message of meeting.transcript ?? []) if (message.approval?.status === "pending") message.approval.status = "cancelled";
				const meetingMonitor = ensureActivityMonitor(meeting);
				for (const role of meetingMonitor.roles) {
					role.status = meeting.mutedParticipantIds.includes(role.profileId) ? "muted" : "idle";
					role.stage = role.status === "muted" ? "已静默" : "等待任务";
					role.stageI18n = messageDescriptor(uiMessage(role.status === "muted" ? "role_activity.muted" : "roleactivity.waiting.for.a.task"));
					role.currentTool = "";
					role.currentToolI18n = null;
					role.claimedFiles = [];
				}
				meetings.set(meeting.id, meeting);
			}
		} catch (error) {
			if (error?.code !== "ENOENT") throw error;
		}
		if (!migrations.archivedLegacyArenaSessions && await archiveLegacyArenaSessions()) {
			migrations.archivedLegacyArenaSessions = true;
			recovered = true;
		}
		if (recovered) await persist();
	})();
	async function modelCatalog() {
		if (catalogCache.expiresAt > Date.now()) return catalogCache.value;
		const selection = defaultModel();
		const value = await Promise.all(ctx.llm.listProviders().map(async (provider) => {
			let models = [];
			try {
				models = await ctx.llm.listModels(provider.id);
			} catch {
				models = [];
			}
			if (provider.id === selection.provider && !models.some((model) => model.id === selection.model)) models.unshift({
				provider: provider.id,
				id: selection.model,
				name: selection.model
			});
			return {
				id: provider.id,
				name: provider.name,
				models: models.map((model) => ({
					id: model.id,
					name: model.name,
					description: model.description
				}))
			};
		}));
		catalogCache = {
			expiresAt: Date.now() + 1e4,
			value
		};
		return value;
	}
	function validateProfileBase(raw, fallbackAvatar) {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new HttpError(400, uiMessage("validateprofilebase.the.user.profile.must.be.a.json.object"));
		const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 24) : "";
		if (!name) throw new HttpError(400, uiMessage("validateprofilebase.the.display.name.cannot.be.empty"));
		return {
			name,
			avatar: cleanAvatar(raw.avatar, fallbackAvatar)
		};
	}
	function validateModel(raw) {
		const provider = typeof raw.provider === "string" ? raw.provider.trim().slice(0, 100) : "";
		const model = typeof raw.model === "string" ? raw.model.trim().slice(0, 160) : "";
		if (!provider || !model) throw new HttpError(400, uiMessage("validatemodel.please.select.a.provider.and.model"));
		if (!ctx.llm.listProviders().some((item) => item.id === provider)) throw new HttpError(400, uiMessage("validatemodel.the.selected.provider.is.not.currently.enabled.in.dsh"));
		return {
			provider,
			model
		};
	}
	async function saveHumanProfile(raw) {
		profiles.human = {
			id: "human",
			...validateProfileBase(raw, "🧑")
		};
		await persist();
		return profiles.human;
	}
	async function saveAdministratorProfile(raw) {
		const base = validateProfileBase(raw, "🛡️");
		const model = validateModel(raw);
		profiles.administrator = {
			id: "administrator",
			...base,
			...model,
			role: typeof raw.role === "string" ? raw.role.trim().slice(0, 16e3) : "",
			updatedAt: nowIso()
		};
		for (const meeting of meetings.values()) {
			meeting.administratorProfile = { ...administratorSnapshot() };
			ensureActivityMonitor(meeting);
			meeting.updatedAt = nowIso();
		}
		for (const room of rooms.values()) {
			if (!room.administratorProfile) continue;
			room.administratorProfile = { ...administratorSnapshot() };
			ensureActivityMonitor(room);
			room.updatedAt = nowIso();
		}
		await persist();
		return profiles.administrator;
	}
	async function saveSettings(raw) {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new HttpError(400, uiMessage("savesettings.settings.must.be.a.json.object"));
		profiles.settings = {
			...profiles.settings,
			rateLimitCooldownEnabled: raw.rateLimitCooldownEnabled === true,
			channelQueueEnabled: raw.channelQueueEnabled === true,
			channelRequestsPerMinute: normalizeArenaRequestLimit(raw.channelRequestsPerMinute),
			cooldownErrorStatuses: normalizeArenaCooldownStatuses(raw.cooldownErrorStatuses),
			autoReplyEnabled: raw.autoReplyEnabled !== false
		};
		await persist();
		return profiles.settings;
	}
	async function saveAiProfile(raw) {
		const base = validateProfileBase(raw, "🤖");
		const model = validateModel(raw);
		const requestedId = typeof raw.id === "string" ? raw.id.trim() : "";
		const existingIndex = profiles.aiUsers.findIndex((item) => item.id === requestedId);
		const profile = {
			id: existingIndex >= 0 ? requestedId : randomUUID(),
			...base,
			...model,
			role: typeof raw.role === "string" ? raw.role.trim().slice(0, 16e3) : "",
			presetPrompts: (Array.isArray(raw.presetPrompts) ? raw.presetPrompts : []).map((item) => typeof item === "string" ? item.trim().slice(0, 240) : "").filter(Boolean).slice(0, 8),
			autoReplyDisabled: raw.autoReplyDisabled === true,
			color: /^#[0-9a-f]{6}$/i.test(String(raw.color ?? "")) ? String(raw.color) : "#6f5ee8",
			updatedAt: nowIso()
		};
		if (existingIndex >= 0) profiles.aiUsers.splice(existingIndex, 1, profile);
		else profiles.aiUsers.push(profile);
		for (const room of rooms.values()) {
			const participantIndex = room.participants.findIndex((item) => item.id === profile.id);
			if (participantIndex < 0) continue;
			room.participants.splice(participantIndex, 1, { ...profile });
			ensureActivityMonitor(room);
			room.updatedAt = nowIso();
		}
		for (const meeting of meetings.values()) {
			const participantIndex = meeting.participants.findIndex((item) => item.id === profile.id);
			if (participantIndex < 0) continue;
			const previous = meeting.participants[participantIndex];
			meeting.participants.splice(participantIndex, 1, {
				...profile,
				status: previous.status
			});
			ensureActivityMonitor(meeting);
			meeting.updatedAt = nowIso();
		}
		await persist();
		return profile;
	}
	async function deleteAiProfile(id) {
		const index = profiles.aiUsers.findIndex((item) => item.id === id);
		if (index < 0) throw new HttpError(404, uiMessage("deleteaiprofile.this.ai.user.was.not.found"));
		profiles.aiUsers.splice(index, 1);
		await persist();
	}
	async function resolveAgentPreset() {
		const presets = ctx.get("agentPresets");
		if (!presets) return {
			presets: void 0,
			id: void 0
		};
		return {
			presets,
			id: (await presets.resolve()).id
		};
	}
	function modelSelection(profile) {
		return {
			...defaultModel(),
			...profile?.provider ? { provider: profile.provider } : {},
			...profile?.model ? { model: profile.model } : {}
		};
	}
	function liveModelSelection(profile) {
		return modelSelection(profile?.id === "administrator" ? profiles.administrator : profiles.aiUsers.find((item) => item.id === profile?.id) || profile);
	}
	function normalizePermissionMode(value) {
		const mode = String(value || "");
		return AGENT_PERMISSION_MODES.includes(mode) ? mode : "danger-full-access";
	}
	function permissionFor(container, profileId) {
		return normalizePermissionMode(container?.permissions?.[profileId]);
	}
	function permissionProfiles(container) {
		const items = [...container?.participants ?? []];
		const administrator = container?.administratorProfile;
		if (administrator?.id && !items.some((item) => item.id === administrator.id)) items.unshift(administrator);
		return items;
	}
	function permissionSpec(mode) {
		const normalized = normalizePermissionMode(mode);
		return {
			mode: normalized,
			label: AGENT_PERMISSION_LABELS[normalized],
			sandbox: normalized,
			approval: normalized === "danger-full-access" ? "never" : "ask"
		};
	}
	function applyAgentPermission(handle, mode) {
		if (!handle?.agent?.session) return;
		const spec = permissionSpec(mode);
		const session = handle.agent.session;
		try {
			session.append("sandbox/mode", { mode: spec.sandbox });
		} catch {}
		try {
			session.append("approval/policy", { policy: spec.approval });
		} catch {}
		try {
			ctx.get("approval")?.setPolicy(handle.agent, spec.approval);
		} catch {}
	}
	function containerForApproval(agent) {
		return arenaSessionContexts.get(String(agent?.id || ""));
	}
	function approvalIdForRequest(req) {
		const events = req?.agent?.session?.events || [];
		const decided = /* @__PURE__ */ new Set();
		for (let index = events.length - 1; index >= 0; index -= 1) {
			const event = events[index];
			if (event.type === "approval/decided") {
				decided.add(event.data.id);
				continue;
			}
			if (event.type !== "approval/asked" || decided.has(event.data.id)) continue;
			if ((req.callId ?? null) !== (event.data.callId ?? null)) continue;
			if ([...pendingApprovals.values()].some((item) => item.approvalId === event.data.id)) continue;
			return String(event.data.id);
		}
		return "";
	}
	function approvalMessage(container, approvalId, req, profile) {
		const message = uiMessage("approvalmessage.please.review.value.s.operation.valuevalue", {
			p0: profile?.name || "AI",
			p1: req.toolName,
			p2: req.reason ? `\n${req.reason}` : ""
		});
		const text = messageText$1(message);
		const base = {
			id: randomUUID(),
			kind: container.type === "meeting" ? "system" : "system",
			senderId: "system",
			senderName: "权限审计",
			avatar: "🛡️",
			text,
			i18n: messageDescriptor(message),
			createdAt: nowIso(),
			approval: {
				id: approvalId,
				toolName: req.toolName,
				reason: req.reason || "",
				status: "pending",
				options: [
					"allow-once",
					"reject",
					"manual"
				]
			}
		};
		if (Array.isArray(container.transcript)) container.transcript.push(base);
		else if (Array.isArray(container.messages)) container.messages.push(base);
		return base;
	}
	function approvalContainerMessage(entry) {
		return Array.isArray(entry.container?.transcript) ? entry.container.transcript.find((item) => item.approval?.id === entry.approvalId) : entry.container?.messages?.find((item) => item.approval?.id === entry.approvalId);
	}
	async function resolveArenaApproval(container, raw) {
		const approvalId = String(raw?.approvalId || "");
		const entry = pendingApprovals.get(approvalId);
		if (!entry || entry.container !== container) throw new HttpError(404, uiMessage("resolvearenaapproval.no.pending.operation.was.found.for.review"));
		const choice = String(raw?.outcome || "");
		if (!["allowed-once", "rejected"].includes(choice)) throw new HttpError(400, uiMessage("resolvearenaapproval.invalid.approval.result"));
		const note = typeof raw?.note === "string" ? raw.note.trim().slice(0, 2e3) : "";
		const message = approvalContainerMessage(entry);
		if (message?.approval) Object.assign(message.approval, {
			status: choice === "allowed-once" ? "approved" : "rejected",
			note
		});
		if (note) (Array.isArray(container.transcript) ? container.transcript : container.messages).push({
			id: randomUUID(),
			kind: "human",
			senderId: "human",
			senderName: profiles.human.name,
			avatar: profiles.human.avatar,
			text: `审计备注：${note}`,
			createdAt: nowIso()
		});
		pendingApprovals.delete(approvalId);
		entry.resolve(choice);
		await persist();
		return container;
	}
	async function createParent(label, signal, cwd) {
		const composition = await resolveAgentPreset();
		const selection = modelSelection();
		const sessionId = randomUUID();
		arenaSessionIds.add(sessionId);
		return archiveArenaAgent(await ctx.agents.create({
			sessionId,
			meta: {
				cwd,
				...composition.id ? { agentPreset: composition.id } : {}
			},
			agentOptions: selection,
			signal,
			async setup(agentCtx) {
				installArenaModelSelection(agentCtx, selection);
				agentCtx.systemPrompt.section({
					name: "deployment:persona",
					order: 0,
					text: `You coordinate ${label}. Use the mounted DSH Agent Preset and its complete capabilities when needed.`
				});
				if (composition.presets) await composition.presets.mount(agentCtx, composition.id);
			}
		}));
	}
	function cooldownInfo(selection) {
		const key = arenaChannelKey(selection);
		const until = channelCooldowns.get(key) || 0;
		if (until <= Date.now()) {
			channelCooldowns.delete(key);
			return null;
		}
		return {
			key,
			until,
			remainingMs: until - Date.now()
		};
	}
	function markChannelFailure(selection, error) {
		if (!profiles.settings.rateLimitCooldownEnabled) return;
		if (!isArenaRateLimitFailure(error, profiles.settings.cooldownErrorStatuses)) return;
		const retryAfterMs = Number(error?.providerRetryAfterMs ?? error?.failure?.providerRetryAfterMs);
		const delayMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0 ? Math.max(COOLDOWN_MS, retryAfterMs) : COOLDOWN_MS;
		channelCooldowns.set(arenaChannelKey(selection), Date.now() + delayMs);
	}
	function waitForChannel(ms, signal) {
		if (!(ms > 0)) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const timer = setTimeout(done, ms);
			const abort = () => {
				clearTimeout(timer);
				signal?.removeEventListener("abort", abort);
				reject(signal?.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("任务已终止"));
			};
			function done() {
				signal?.removeEventListener("abort", abort);
				resolve();
			}
			if (signal?.aborted) abort();
			else signal?.addEventListener("abort", abort, { once: true });
		});
	}
	async function waitForChannelCooldown(selection, signal) {
		while (profiles.settings.rateLimitCooldownEnabled) {
			const cooldown = cooldownInfo(selection);
			if (!cooldown) return;
			await waitForChannel(cooldown.remainingMs, signal);
		}
	}
	async function acquireChannel(selection, signal) {
		if (!profiles.settings.channelQueueEnabled) return () => void 0;
		const key = arenaChannelKey(selection);
		const previous = channelQueues.get(key) || Promise.resolve();
		let unlock;
		const gate = new Promise((resolve) => {
			unlock = resolve;
		});
		channelQueues.set(key, gate);
		await previous.catch(() => void 0);
		if (signal?.aborted) {
			unlock();
			if (channelQueues.get(key) === gate) channelQueues.delete(key);
			throw signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("任务已终止");
		}
		return () => {
			unlock();
			if (channelQueues.get(key) === gate) channelQueues.delete(key);
		};
	}
	async function reserveChannelRequest(selection, signal) {
		if (!profiles.settings.channelQueueEnabled) return;
		const key = arenaChannelKey(selection);
		while (true) {
			const now = Date.now();
			const recent = (channelRequestTimes.get(key) || []).filter((timestamp) => timestamp > now - CHANNEL_WINDOW_MS);
			const requestLimit = normalizeArenaRequestLimit(profiles.settings.channelRequestsPerMinute);
			if (recent.length < requestLimit) {
				recent.push(now);
				channelRequestTimes.set(key, recent);
				return;
			}
			channelRequestTimes.set(key, recent);
			await waitForChannel(Math.max(1, recent[0] + CHANNEL_WINDOW_MS - now), signal);
		}
	}
	function guardedArenaStream(options, next) {
		const selection = {
			provider: options.provider,
			model: options.model
		};
		return (async function* () {
			await waitForChannelCooldown(selection, options.signal);
			const release = await acquireChannel(selection, options.signal);
			try {
				await waitForChannelCooldown(selection, options.signal);
				await reserveChannelRequest(selection, options.signal);
				for await (const chunk of next()) {
					if (chunk?.type === "finish" && chunk.reason?.kind === "error") markChannelFailure(selection, chunk.reason.failure);
					yield chunk;
				}
			} catch (error) {
				markChannelFailure(selection, error);
				throw error;
			} finally {
				release();
			}
		})();
	}
	ctx.effect(() => {
		const disposeRequest = ctx.on("agent/request", async ({ agent }, next) => {
			const header = agent?.session?.header || {};
			const sessionId = String(agent?.id || header.id || "");
			const parentSessionId = String(header.parentSession || "");
			if (arenaSessionIds.has(sessionId) || arenaSessionIds.has(parentSessionId)) arenaSessionIds.add(sessionId);
			return next();
		});
		const disposeStream = ctx.on("llm/stream", (options, next) => {
			if (!arenaSessionIds.has(String(options.sessionId || ""))) return next();
			return guardedArenaStream(options, next);
		});
		const disposeApproval = ctx.on("approval/request", (req, next) => {
			const context = containerForApproval(req?.agent);
			if (!context) return next();
			const approvalId = approvalIdForRequest(req);
			if (!approvalId) return next();
			const { container, profile } = context;
			const message = approvalMessage(container, approvalId, req, profile);
			container.updatedAt = nowIso();
			persist();
			return new Promise((resolve) => {
				pendingApprovals.set(approvalId, {
					approvalId,
					container,
					runtime: context.runtime,
					profile,
					resolve,
					message
				});
				req.signal?.addEventListener("abort", () => {
					if (!pendingApprovals.get(approvalId)) return;
					pendingApprovals.delete(approvalId);
					if (message.approval) message.approval.status = "cancelled";
					resolve("cancelled");
					persist();
				}, { once: true });
			});
		}, true);
		return () => {
			disposeRequest();
			disposeStream();
			disposeApproval();
			for (const pending of pendingApprovals.values()) pending.resolve("cancelled");
			pendingApprovals.clear();
			arenaSessionContexts.clear();
			channelQueues.clear();
			channelCooldowns.clear();
			channelRequestTimes.clear();
			arenaSessionIds.clear();
		};
	}, "agent-arena: shared provider queue and cooldown");
	async function startRoleRun({ label, prompt, persona, profile, parent, runtime, outputSchema }) {
		const selection = modelSelection(profile);
		const run = await ctx.subagents.start("spawn", {
			label,
			prompt: [{
				type: "text",
				text: prompt
			}],
			parent: parent.agent,
			signal: runtime.abort.signal,
			persona: renderPersonaTemplate(persona, profile?.name || label, profiles.human.name),
			...outputSchema ? { outputSchema } : {},
			agentOptions: selection
		});
		runtime.activeRuns.add(run);
		try {
			return await run.result;
		} finally {
			runtime.activeRuns.delete(run);
			await run.dispose().catch(() => void 0);
		}
	}
	function summarizeAgentTurn(events, firstSeq) {
		let text = "";
		let stopReason = "completed";
		let error = "";
		for (const event of events) {
			if (event.seq < firstSeq) continue;
			if (event.type === "assistant/message") {
				const joined = messageText(event.data?.message?.content);
				if (joined) text = joined;
			} else if (event.type === "turn/end") {
				stopReason = String(event.data?.reason?.kind || event.data?.reason || "completed");
				if (event.data?.reason?.kind === "error") error = String(event.data.reason.error?.message || "Agent 运行失败");
			}
		}
		return {
			text,
			stopReason,
			error
		};
	}
	async function createFullRoleAgent({ label, profile, runtime }) {
		const composition = await resolveAgentPreset();
		const selection = modelSelection(profile);
		const sessionId = randomUUID();
		arenaSessionIds.add(sessionId);
		const handle = await ctx.agents.create({
			sessionId,
			meta: {
				cwd: runtime.workdir,
				...composition.id ? { agentPreset: composition.id } : {}
			},
			agentOptions: selection,
			signal: runtime.abort.signal,
			async setup(agentCtx) {
				installArenaModelSelection(agentCtx, () => liveModelSelection(profile));
				agentCtx.systemPrompt.section({
					name: "agent-arena:identity",
					order: -20,
					text: [
						`你是 Agent Arena 中的独立 AI 用户 ${profile.name}。`,
						profile.role ? `你的人格、说话方式与长期职责：${renderPersonaTemplate(profile.role, profile.name, profiles.human.name)}` : "用户没有指定固定人格，请自然、独立地交流和工作。",
						"你是完整的 DSH Agent：可以按任务需要使用当前 Agent Preset 提供的工具、技能和子 Agent。只汇报真实完成的操作，不要把工具调用伪装成普通文本。",
						"你和其他角色共享 Agent Arena 实时协作控制台。开始工作时使用 arena_coordination 更新动态和任务；比较方案时留下结构化意见；完成文件、链接或结论后登记成果。编辑文件前必须先原子锁定文件，遇到其他角色占用时等待、换任务或协调，绝不能覆盖对方修改，也不得用 Shell 写入命令绕过文件锁。",
						"公开聊天使用 arena_send_message。发一条还是多条、每条长短都由你结合人格、话题和任务自然决定；能一条说清就不要拆，需要自然分步、真实进度或最终结果时可以继续发送。不要按长度、句号或固定节奏机械切分，也不要每轮都先说“收到”或“我开始了”。",
						"每次 arena_send_message 都会立即对人类和其他成员可见。调用过后不要在最终回答中重复已发送内容；公开回复不要添加自己的姓名前缀，也不要泄露隐藏思维过程。"
					].join("\n")
				});
				if (composition.presets) await composition.presets.mount(agentCtx, composition.id);
				installCoordinationPlane(agentCtx, runtime, profile);
			}
		});
		applyAgentPermission(handle, permissionFor(runtime.container, profile.id));
		await archiveArenaAgent(handle);
		runtime.agentHandles.add(handle);
		arenaSessionContexts.set(String(handle.agent.id), {
			container: runtime.container,
			runtime,
			profile
		});
		runtime.abort.signal.addEventListener("abort", () => handle.agent.cancel({ kind: "user" }), { once: true });
		return handle;
	}
	async function roleAgent(runtime, key, label, profile) {
		let pending = runtime.roleAgents.get(key);
		if (!pending) {
			pending = createFullRoleAgent({
				label,
				profile,
				runtime
			});
			runtime.roleAgents.set(key, pending);
		}
		return pending;
	}
	function parsedToolArguments(value) {
		if (value && typeof value === "object") return value;
		if (typeof value !== "string") return {};
		try {
			const parsed = JSON.parse(value);
			return parsed && typeof parsed === "object" ? parsed : {};
		} catch {
			return { input: value };
		}
	}
	function toolActivity(toolName, rawArguments) {
		const name = String(toolName || "tool");
		const lower = name.toLocaleLowerCase();
		const args = parsedToolArguments(rawArguments);
		const detailValue = args.file_path ?? args.path ?? args.query ?? args.url ?? args.task ?? args.action ?? args.cmd ?? args.command ?? "";
		const detail = String(detailValue || "").replace(/\s+/g, " ").trim().slice(0, 180);
		if (name === "arena_send_message") return {
			status: "working",
			stage: uiMessage("toolactivity.sending.a.group.message"),
			label: "发送消息",
			detail: String(args.text || "").replace(/\s+/g, " ").trim().slice(0, 180)
		};
		if (name === "arena_coordination") return {
			status: "working",
			stage: uiMessage("toolactivity.synchronizing.collaboration.status"),
			label: "协作板",
			detail
		};
		if (/subagent|spawn_agent|create_thread|workflow/.test(lower)) return {
			status: "delegating",
			stage: uiMessage("toolactivity.delegating.to.subagents"),
			label: name,
			detail
		};
		if (mutationTargets(name, args).length) return {
			status: "editing",
			stage: uiMessage("toolactivity.editing.files"),
			label: name,
			detail
		};
		if (/test|check|lint|build/.test(lower) || /(?:npm|pnpm|yarn).{0,12}(?:test|check|build)|pytest|vitest|jest/.test(String(args.cmd ?? ""))) return {
			status: "testing",
			stage: uiMessage("toolactivity.running.checks.or.tests"),
			label: name,
			detail
		};
		if (/read|search|find|grep|glob|list|view/.test(lower)) return {
			status: "researching",
			stage: uiMessage("toolactivity.reading.reference.material.or.code"),
			label: name,
			detail
		};
		if (/web|browser|fetch|open_url/.test(lower)) return {
			status: "researching",
			stage: uiMessage("toolactivity.browsing.external.sources"),
			label: name,
			detail
		};
		if (/run_code|exec|bash|pwsh|command|terminal/.test(lower)) return {
			status: "tool",
			stage: uiMessage("toolactivity.running.commands.or.code"),
			label: name,
			detail
		};
		return {
			status: "tool",
			stage: uiMessage("toolactivity.using.value", { p0: name }),
			label: name,
			detail
		};
	}
	function observeAgentEvents(handle, firstSeq, runtime, profile) {
		let lastSeq = firstSeq - 1;
		const calls = /* @__PURE__ */ new Map();
		const scan = () => {
			for (const event of handle.agent.session.events) {
				if (event.seq < firstSeq || event.seq <= lastSeq) continue;
				lastSeq = Math.max(lastSeq, event.seq);
				if (event.type === "assistant/chunk") {
					if (event.data?.chunk?.type === "reasoning-delta" || event.data?.chunk?.type === "text-delta") setRoleActivity(runtime.container, profile, {
						status: "thinking",
						stage: uiMessage("observeagentevents.thinking.and.composing.a.reply"),
						currentTool: ""
					});
				} else if (event.type === "tool/call") {
					const activity = toolActivity(event.data?.name, event.data?.arguments);
					calls.set(String(event.data?.callId || ""), activity);
					setRoleActivity(runtime.container, profile, {
						status: activity.status,
						stage: activity.stage,
						detail: activity.detail,
						currentTool: activity.label
					}, withMessageDetail(activity.stage, activity.detail), "tool", event.time);
				} else if (event.type === "tool/code-dispatch-start") {
					const activity = toolActivity(event.data?.name, event.data?.arguments);
					calls.set(String(event.data?.subCallId || ""), activity);
					setRoleActivity(runtime.container, profile, {
						status: activity.status,
						stage: activity.stage,
						detail: activity.detail,
						currentTool: activity.label
					}, withMessageDetail(activity.stage, activity.detail), "tool", event.time);
				} else if (event.type === "tool/result") {
					const activity = calls.get(String(event.data?.message?.callId || ""));
					if (activity) setRoleActivity(runtime.container, profile, {
						status: "working",
						stage: event.data?.message?.isError ? uiMessage("observeagentevents.value.failed", { p0: activity.label }) : uiMessage("observeagentevents.analyzing.the.result.of.value", { p0: activity.label }),
						currentTool: ""
					}, uiMessage(event.data?.message?.isError ? "activity.toolFailed" : "activity.toolCompleted", { p0: activity.label }), event.data?.message?.isError ? "error" : "success", event.time);
				} else if (event.type === "tool/code-dispatch") {
					const activity = calls.get(String(event.data?.subCallId || "")) || toolActivity(event.data?.name, event.data?.arguments);
					setRoleActivity(runtime.container, profile, {
						status: "working",
						stage: event.data?.isError ? uiMessage("observeagentevents.value.failed", { p0: activity.label }) : uiMessage("observeagentevents.analyzing.the.result.of.value", { p0: activity.label }),
						currentTool: ""
					}, uiMessage(event.data?.isError ? "activity.toolFailed" : "activity.toolCompleted", { p0: activity.label }), event.data?.isError ? "error" : "success", event.time);
				} else if (event.type === "assistant/message") setRoleActivity(runtime.container, profile, {
					status: "working",
					stage: uiMessage("observeagentevents.generated.an.interim.reply"),
					currentTool: ""
				}, uiMessage("observeagentevents.generated.an.interim.reply.2"), "message", event.time);
			}
		};
		scan();
		const timer = setInterval(scan, 240);
		timer.unref?.();
		return () => {
			clearInterval(timer);
			scan();
		};
	}
	async function runFullAgentTurnOnce(handle, prompt, runtime, profile, phase = "work") {
		if (runtime.abort.signal.aborted) throw new Error("任务已终止");
		await handle.agent.whenIdle();
		const firstSeq = handle.agent.session.seq;
		const messageTurn = phase === "work" ? {
			id: randomUUID(),
			phase,
			sentTexts: [],
			messageIds: []
		} : null;
		if (messageTurn) {
			runtime.messageTurns ??= /* @__PURE__ */ new Map();
			runtime.messageTurns.set(profile.id, messageTurn);
		}
		setRoleActivity(runtime.container, profile, {
			status: phase === "ack" ? "acknowledging" : "thinking",
			stage: phase === "ack" ? uiMessage("runfullagentturnonce.acknowledging.a.new.message") : uiMessage("runfullagentturnonce.understanding.the.task.and.planning"),
			detail: "",
			currentTool: ""
		}, phase === "ack" ? uiMessage("runfullagentturnonce.started.acknowledging.a.new.message") : uiMessage("runfullagentturnonce.started.working.on.the.task"));
		handle.agent.followup(createArenaUserMessage(prompt));
		const stopObserving = observeAgentEvents(handle, firstSeq, runtime, profile);
		try {
			await handle.agent.whenIdle();
		} finally {
			stopObserving();
			if (messageTurn && runtime.messageTurns?.get(profile.id) === messageTurn) runtime.messageTurns.delete(profile.id);
		}
		const outcome = summarizeAgentTurn(handle.agent.session.events, firstSeq);
		if (outcome.error) {
			const failure = new Error(outcome.error);
			failure.autonomousMessageIds = [...messageTurn?.messageIds ?? []];
			if (!isArenaEmptyResponseFailure(failure)) setRoleActivity(runtime.container, profile, {
				status: "error",
				stage: uiMessage("runfullagentturnonce.this.turn.failed"),
				detail: outcome.error,
				currentTool: ""
			}, outcome.error, "error");
			throw failure;
		}
		setRoleActivity(runtime.container, profile, {
			status: "working",
			stage: phase === "ack" ? uiMessage("runfullagentturnonce.acknowledged.preparing.to.work") : uiMessage("runfullagentturnonce.work.for.this.turn.is.complete"),
			currentTool: ""
		});
		return {
			...outcome,
			autonomousMessageIds: [...messageTurn?.messageIds ?? []]
		};
	}
	async function runFullAgentTurn(handle, prompt, runtime, profile, phase = "work") {
		try {
			return await runFullAgentTurnOnce(handle, prompt, runtime, profile, phase);
		} catch (error) {
			if (!isArenaEmptyResponseFailure(error) || runtime.abort.signal.aborted || runtime.cancelCurrentWork) throw error;
			const firstMessageIds = Array.isArray(error?.autonomousMessageIds) ? error.autonomousMessageIds : [];
			if (firstMessageIds.length) return {
				text: "",
				stopReason: "empty-response",
				error: "",
				autonomousMessageIds: firstMessageIds,
				silent: true
			};
			setRoleActivity(runtime.container, profile, {
				status: "thinking",
				stage: uiMessage("runfullagentturn.empty.response.retrying.automatically"),
				detail: "",
				currentTool: ""
			}, uiMessage("runfullagentturn.detected.an.empty.response.retrying.once"));
			try {
				return await runFullAgentTurnOnce(handle, prompt, runtime, profile, phase);
			} catch (retryError) {
				if (!isArenaEmptyResponseFailure(retryError) || runtime.abort.signal.aborted || runtime.cancelCurrentWork) throw retryError;
				return {
					text: "",
					stopReason: "empty-response",
					error: "",
					autonomousMessageIds: Array.isArray(retryError?.autonomousMessageIds) ? retryError.autonomousMessageIds : [],
					silent: true
				};
			}
		}
	}
	function latestHumanRequest(container, isMeeting) {
		return [...isMeeting ? container.transcript : container.messages].reverse().find((item) => item.kind === "user" || item.kind === "human")?.text || (isMeeting ? container.topic : "");
	}
	function adminPrompt(container, command, isMeeting) {
		const admin = container.administratorProfile;
		return [
			`你是群管理员 ${admin.name}。人类用户刚刚对你说：${command}`,
			`你的职责：${admin.role || "维护秩序，并按人类授权调整当前协作。"}`,
			isMeeting ? `当前会议话题：${container.topic}` : `当前群聊：${container.name}`,
			"判断是否执行一个安全的管理动作。action 只能是 none、change-topic、reopen-decision、continue、pause、finish、set-stage。finish 表示生成阶段总结并继续保留会议，不会关闭输入；change-topic 时 topic 填新话题；set-stage 时 stage 选择 discussion、planning、execution、review、waiting-human；其他字段为空。",
			"只响应人类明确要求。不得修改模型、密钥、权限或文件。reply 是要在群里公开显示的简洁确认。",
			"",
			"最近记录：",
			transcriptText(isMeeting ? container.transcript : container.messages)
		].join("\n");
	}
	async function askAdministrator(container, command, parent, runtime, isMeeting) {
		const admin = container.administratorProfile;
		const hint = inferAdminCommand(command);
		const result = await startRoleRun({
			label: `arena:${container.id}:administrator`,
			prompt: adminPrompt(container, command, isMeeting),
			persona: `你是 ${admin.name}，只执行人类用户明确授权的安全群管理操作。`,
			profile: admin,
			parent,
			runtime,
			outputSchema: adminSchema()
		});
		const structured = result.structured && typeof result.structured === "object" ? result.structured : {};
		return {
			reply: String(structured.reply || messageText(result.output) || "管理员已收到。"),
			action: hint.action !== "none" ? hint.action : String(structured.action || "none"),
			topic: hint.topic || String(structured.topic || "").trim(),
			stage: hint.stage || String(structured.stage || "")
		};
	}
	function appendSystem(container, text, isMeeting) {
		const item = {
			id: randomUUID(),
			kind: "system",
			text: messageText$1(text),
			i18n: messageDescriptor(text),
			createdAt: nowIso()
		};
		if (isMeeting) container.transcript.push({
			...item,
			speakerId: "system",
			speaker: "系统"
		});
		else container.messages.push({
			...item,
			senderId: "system",
			senderName: "系统",
			avatar: "ℹ️"
		});
	}
	function appendAutonomousMessage(container, profile, runtime, text, turn) {
		const common = {
			id: randomUUID(),
			text,
			avatar: profile.avatar,
			createdAt: nowIso(),
			model: profile.model || defaultModel().model,
			phase: "live",
			streamId: turn.id,
			sequence: turn.messageIds.length + 1
		};
		if (runtime.isMeeting) {
			const item = {
				...common,
				kind: "participant",
				turn: container.turnCount,
				speakerId: profile.id,
				speaker: profile.name
			};
			container.transcript.push(item);
			container.updatedAt = common.createdAt;
			return item;
		}
		const item = {
			...common,
			kind: "ai",
			senderId: profile.id,
			senderName: profile.name
		};
		container.messages.push(item);
		container.updatedAt = common.createdAt;
		return item;
	}
	function mutedSet(container) {
		return new Set(Array.isArray(container.mutedParticipantIds) ? container.mutedParticipantIds : []);
	}
	function isMuted(container, id) {
		return mutedSet(container).has(id);
	}
	function applySpeechControls(container, text, runtime, isMeeting) {
		const directives = parseSpeechDirectives(text, container.participants);
		if (!directives.hasDirective) return directives;
		const muted = mutedSet(container);
		const newlyMuted = [];
		const newlyUnmuted = [];
		for (const id of directives.muteIds) {
			if (!muted.has(id)) newlyMuted.push(id);
			muted.add(id);
			const pending = runtime?.roleAgents?.get(id);
			if (pending) pending.then((handle) => handle.agent.cancel({ kind: "user" }, { keepInbox: true })).catch(() => void 0);
			runtime?.targetIds?.delete(id);
		}
		for (const id of directives.unmuteIds) if (muted.delete(id)) newlyUnmuted.push(id);
		container.mutedParticipantIds = [...muted];
		const names = (ids) => ids.map((id) => container.participants.find((item) => item.id === id)?.name).filter(Boolean).join("、");
		for (const id of newlyMuted) {
			const profile = container.participants.find((item) => item.id === id);
			if (profile) setRoleActivity(container, profile, {
				status: "muted",
				stage: uiMessage("role_activity.muted"),
				detail: "",
				currentTool: "",
				claimedFiles: []
			}, uiMessage("applyspeechcontrols.muted.by.the.human.user"));
			if (runtime) releaseRoleClaims(runtime, id);
		}
		for (const id of newlyUnmuted) {
			const profile = container.participants.find((item) => item.id === id);
			if (profile) setRoleActivity(container, profile, {
				status: "idle",
				stage: uiMessage("applyspeechcontrols.unmuted.waiting.for.a.message"),
				detail: "",
				currentTool: ""
			}, uiMessage("applyspeechcontrols.unmuted"));
		}
		if (newlyMuted.length) appendSystem(container, uiMessage("applyspeechcontrols.value.has.been.muted.no.further.requests.or.in", { p0: names(newlyMuted) }), isMeeting);
		if (newlyUnmuted.length) appendSystem(container, uiMessage("applyspeechcontrols.value.has.been.unmuted", { p0: names(newlyUnmuted) }), isMeeting);
		if (runtime) runtime.skipAutoContinuation = directives.commandOnly;
		return directives;
	}
	function wakeRuntime(container, runtime) {
		if (!runtime) return;
		runtime.pauseRequested = false;
		if (container.status === "paused" || container.status === "pausing") container.status = "running";
	}
	async function applyMeetingAdminAction(meeting, runtime, result) {
		if (result.action === "change-topic") if (result.topic.length < 2) appendSystem(meeting, uiMessage("applymeetingadminaction.the.administrator.could.not.identify.a.new.topic.try"), true);
		else {
			meeting.topic = result.topic.slice(0, 2e3);
			runtime.targetIds = new Set(meeting.participants.map((item) => item.id));
			appendSystem(meeting, uiMessage("applymeetingadminaction.the.administrator.changed.the.topic.to.value", { p0: meeting.topic }), true);
		}
		else if (result.action === "reopen-decision") {
			ensureMeetingWorkspace(meeting);
			const latest = [...meeting.decisions].reverse().find((item) => item.status === "decided");
			if (latest) {
				reopenWorkspaceDecision(meeting, { decisionId: latest.id });
				appendSystem(meeting, uiMessage("applymeetingadminaction.the.administrator.reopened.decision.value", { p0: latest.title }), true);
			} else appendSystem(meeting, uiMessage("applymeetingadminaction.there.are.no.completed.decisions.to.reopen"), true);
		} else if (result.action === "continue") meeting.participants.filter((item) => !isMuted(meeting, item.id)).forEach((item) => runtime.targetIds.add(item.id));
		else if (result.action === "pause") runtime.pauseRequested = true;
		else if (result.action === "finish") runtime.summaryRequested = true;
		else if (result.action === "set-stage" && MEETING_STAGES.includes(result.stage) && result.stage !== "completed") {
			meeting.collaborationStage = result.stage;
			appendSystem(meeting, uiMessage("applymeetingadminaction.the.administrator.changed.the.collaboration.stage.to.value", { p0: result.stage }), true);
		}
	}
	async function runMeetingAdmin(meeting, command, runtime) {
		const admin = meeting.administratorProfile;
		let failed = false;
		setRoleActivity(meeting, admin, {
			status: "working",
			stage: uiMessage("runmeetingadmin.handling.an.administrator.command"),
			detail: command.slice(0, 240),
			currentTool: ""
		}, uiMessage("runmeetingadmin.started.handling.an.administrator.command"));
		try {
			const result = await askAdministrator(meeting, command, runtime.parent, runtime, true);
			meeting.transcript.push({
				id: randomUUID(),
				kind: "admin",
				speakerId: "administrator",
				speaker: meeting.administratorProfile.name,
				avatar: meeting.administratorProfile.avatar,
				text: result.reply,
				createdAt: nowIso(),
				model: meeting.administratorProfile.model
			});
			await applyMeetingAdminAction(meeting, runtime, result);
		} catch (error) {
			failed = true;
			setRoleActivity(meeting, admin, {
				status: "error",
				stage: uiMessage("runmeetingadmin.the.administrator.command.failed"),
				detail: safeError(error)
			}, safeError(error), "error");
		} finally {
			if (!failed) setRoleActivity(meeting, admin, {
				status: "idle",
				stage: uiMessage("runmeetingadmin.waiting.for.an.administrator.command"),
				currentTool: ""
			});
		}
	}
	async function checkpoint(meeting, runtime) {
		if (runtime.abort.signal.aborted) throw new Error("会议运行已停止");
		if (!runtime.pauseRequested) return true;
		meeting.status = "paused";
		meeting.updatedAt = nowIso();
		await persist();
		return false;
	}
	async function runOne(meeting, participant, runtime) {
		if (isMuted(meeting, participant.id)) return;
		let failed = false;
		participant.status = "working";
		meeting.updatedAt = nowIso();
		await persist();
		try {
			const handle = await roleAgent(runtime, participant.id, `arena:${meeting.id}:${participant.name}`, participant);
			if (runtime.abort.signal.aborted || runtime.cancelCurrentWork || isMuted(meeting, participant.id)) return;
			participant.status = "working";
			meeting.updatedAt = nowIso();
			await persist();
			const result = await runFullAgentTurn(handle, participantPrompt(meeting, participant, coordinationPrompt(runtime, participant.id)), runtime, participant, "work");
			if (runtime.abort.signal.aborted || runtime.cancelCurrentWork) return;
			if (isMuted(meeting, participant.id)) return;
			if (result.silent && !result.autonomousMessageIds.length) return;
			if (!result.autonomousMessageIds.length) meeting.transcript.push({
				id: randomUUID(),
				kind: "participant",
				phase: "result",
				turn: meeting.turnCount,
				speakerId: participant.id,
				speaker: participant.name,
				avatar: participant.avatar,
				text: result.text || `（${participant.name} 没有产生可展示文本，结束原因：${result.stopReason}）`,
				createdAt: nowIso(),
				model: participant.model || defaultModel().model,
				stopReason: result.stopReason
			});
		} catch (error) {
			if (runtime.cancelCurrentWork || runtime.abort.signal.aborted) return;
			failed = true;
			setRoleActivity(meeting, participant, {
				status: "error",
				stage: uiMessage("runone.work.failed.for.this.turn"),
				detail: safeError(error),
				currentTool: ""
			}, safeError(error), "error");
		} finally {
			releaseRoleClaims(runtime, participant.id);
			participant.status = "idle";
			if (isMuted(meeting, participant.id)) setRoleActivity(meeting, participant, {
				status: "muted",
				stage: uiMessage("role_activity.muted"),
				detail: "",
				currentTool: "",
				claimedFiles: []
			});
			else if (!failed) setRoleActivity(meeting, participant, {
				status: "idle",
				stage: uiMessage("runone.waiting.for.follow.up.messages"),
				detail: "",
				currentTool: "",
				claimedFiles: []
			});
			meeting.updatedAt = nowIso();
			await persist().catch(() => void 0);
		}
	}
	async function collectReplyIntents(container, completedIds, runtime, isMeeting, requirePeerReaction) {
		const records = isMeeting ? container.transcript : container.messages;
		const focus = latestHumanRequest(container, isMeeting);
		const completedNames = completedIds.map((id) => container.participants.find((item) => item.id === id)?.name).filter(Boolean).join("、");
		if (!profiles.settings.autoReplyEnabled) return [];
		const available = container.participants.filter((item) => !isMuted(container, item.id));
		return Promise.all(available.map(async (profile) => {
			if (profile.autoReplyDisabled) return {
				profile,
				shouldSpeak: true,
				reason: "此角色已关闭独立判断，请管理员直接判断它是否适合接话。"
			};
			let failed = false;
			setRoleActivity(container, profile, {
				status: "thinking",
				stage: uiMessage("collectreplyintents.checking.whether.to.reply"),
				detail: "",
				currentTool: ""
			});
			try {
				const result = await startRoleRun({
					label: `arena:${container.id}:reply-intent:${profile.id}`,
					prompt: [
						`你是群聊中的 ${profile.name}。你的人格与职责：${profile.role || "自然、独立地交流并推进问题。"}`,
						`当前由人类确定的讨论焦点：${focus}`,
						`刚刚产生新消息的成员：${completedNames || "人类用户"}`,
						requirePeerReaction ? "这些 AI 消息刚才是并发产生的，同批成员回复时看不到彼此。现在你已经能看到全部内容，请认真检查是否有一个具体观点、遗漏、分歧、问题、玩笑或工作衔接值得你继续回应。不要因为自己刚说过一次就自动选择沉默。" : "现在请结合新消息、你自己已经说过的话和你的人格，判断你是否还应该自然接话。每批新发言后都要重新独立判断。",
						"shouldSpeak=true 仅限：有人点名/询问你；你能回应一条具体新观点；需要纠错、反驳、补充关键遗漏；你有真实进度/结果；或你能明确推进尚未完成的协作。",
						"shouldSpeak=false：你的观点已经说过；只能礼貌附和或重复；必须等待人类提供信息；话头已经收束；或准备说的内容偏离人类当前焦点。尤其不要为了热闹而继续。",
						"连续自己接自己的话只在补交真实工作进度或结果时合理。reason 只写一句内部判断依据，不要在这里生成真正的群聊回复。",
						...isMeeting ? [
							"",
							"协作控制台：",
							meetingWorkspaceText(container)
						] : [],
						"",
						"完整群聊记录：",
						transcriptText(records)
					].join("\n"),
					persona: `你是 ${profile.name}。${profile.role || "保持自然，并只在有实质内容时继续发言。"}`,
					profile,
					parent: runtime.parent,
					runtime,
					outputSchema: replyIntentSchema()
				});
				const intent = result.structured && typeof result.structured === "object" ? result.structured : {};
				return {
					profile,
					shouldSpeak: intent.shouldSpeak === true,
					reason: String(intent.reason || "").trim().slice(0, 500)
				};
			} catch (error) {
				failed = true;
				setRoleActivity(container, profile, {
					status: "error",
					stage: uiMessage("collectreplyintents.follow.up.check.failed"),
					detail: safeError(error),
					currentTool: ""
				}, safeError(error), "error");
				return {
					profile,
					shouldSpeak: false,
					reason: `判断失败：${safeError(error)}`
				};
			} finally {
				if (!failed) setRoleActivity(container, profile, {
					status: "idle",
					stage: uiMessage("runone.waiting.for.follow.up.messages"),
					detail: "",
					currentTool: ""
				});
			}
		}));
	}
	async function guardContinuation(container, intents, runtime, isMeeting) {
		if (!intents.length) return {
			onTopic: true,
			complete: true,
			approvedSpeakerIds: [],
			reason: "没有角色希望继续接话。"
		};
		const admin = container.administratorProfile;
		let failed = false;
		const focus = latestHumanRequest(container, isMeeting);
		setRoleActivity(container, admin, {
			status: "working",
			stage: uiMessage("guardcontinuation.checking.for.off.topic.replies.and.flooding"),
			detail: "",
			currentTool: ""
		}, uiMessage("guardcontinuation.reviewing.follow.up.intentions"));
		try {
			const result = await startRoleRun({
				label: `arena:${container.id}:continuation-guard`,
				prompt: [
					`你是群管理员 ${admin.name}。通常角色会先判断是否接话；关闭独立判断的角色则由你直接判断。你负责选择下一位发言者，并防止跑题、重复和刷屏。`,
					`人类当前讨论焦点：${focus}`,
					...isMeeting ? [`会议主题：${container.topic}`] : [`群聊名称：${container.name}`],
					"候选角色及其判断或分配说明：",
					intents.map((item) => `- ${item.profile.name} (${item.profile.id})：${item.reason || "未说明"}`).join("\n"),
					"如果候选发言会明显偏离人类最近的焦点，onTopic=false、complete=true、approvedSpeakerIds=[]，停止本次自动接话并等待人类。相关子问题、必要的澄清和任务执行不算跑题。",
					"如果只是重复、附和、抢话或没有实际推进，也应 complete=true。否则 onTopic=true、complete=false，并且只批准最适合接下一句话的 1 位。这样该角色发言后，所有角色会基于这条新消息再次独立判断。",
					"approvedSpeakerIds 只能来自上面的候选角色。",
					"",
					"完整群聊记录：",
					transcriptText(isMeeting ? container.transcript : container.messages)
				].join("\n"),
				persona: `你是 ${admin.name}。${admin.role || "负责让群聊保持聚焦、自然且不刷屏。"}`,
				profile: admin,
				parent: runtime.parent,
				runtime,
				outputSchema: continuationGuardSchema(container)
			});
			const decision = result.structured && typeof result.structured === "object" ? result.structured : {};
			return {
				onTopic: decision.onTopic !== false,
				complete: decision.complete !== false,
				approvedSpeakerIds: Array.isArray(decision.approvedSpeakerIds) ? decision.approvedSpeakerIds.map(String) : [],
				reason: String(decision.reason || "").trim()
			};
		} catch (error) {
			failed = true;
			setRoleActivity(container, admin, {
				status: "error",
				stage: uiMessage("guardcontinuation.follow.up.review.failed"),
				detail: safeError(error),
				currentTool: ""
			}, safeError(error), "error");
			return {
				onTopic: true,
				complete: false,
				approvedSpeakerIds: [intents[0].profile.id],
				reason: `管理员复核失败，采用首位角色的独立判断：${safeError(error)}`
			};
		} finally {
			if (!failed) setRoleActivity(container, admin, {
				status: "idle",
				stage: uiMessage("runmeetingadmin.waiting.for.an.administrator.command"),
				detail: "",
				currentTool: ""
			});
		}
	}
	async function evaluateMeetingContinuation(meeting, completedIds, runtime, requirePeerReaction = false) {
		if (runtime.summaryRequested || runtime.pauseRequested || runtime.cancelCurrentWork || runtime.abort.signal.aborted) return;
		const admin = meeting.administratorProfile;
		setRoleActivity(meeting, admin, {
			status: "working",
			stage: uiMessage("evaluatemeetingcontinuation.waiting.for.follow.up.checks"),
			detail: "",
			currentTool: ""
		}, uiMessage("evaluatemeetingcontinuation.started.per.role.follow.up.checks"));
		try {
			if (!profiles.settings.autoReplyEnabled) return;
			const intents = (await collectReplyIntents(meeting, completedIds, runtime, true, requirePeerReaction)).filter((item) => item.shouldSpeak);
			const decision = await guardContinuation(meeting, intents, runtime, true);
			if (decision.complete || !decision.onTopic) {
				appendSystem(meeting, decision.onTopic ? uiMessage("evaluatemeetingcontinuation.the.current.task.has.reached.a.natural.stopping.point") : uiMessage("evaluatemeetingcontinuation.automatic.follow.ups.were.stopped.because.they.were.moving"), true);
				return;
			}
			const candidates = new Set(intents.map((item) => item.profile.id));
			const next = decision.approvedSpeakerIds.filter((id) => candidates.has(id) && !isMuted(meeting, id)).slice(0, 1);
			for (const id of next.length ? next : intents.slice(0, 1).map((item) => item.profile.id)) runtime.targetIds.add(id);
			runtime.triggerSource = "auto";
		} catch (error) {
			setRoleActivity(meeting, admin, {
				status: "error",
				stage: uiMessage("evaluatemeetingcontinuation.the.follow.up.check.process.failed"),
				detail: safeError(error),
				currentTool: ""
			}, safeError(error), "error");
		} finally {
			if (roleActivity(meeting, admin).status !== "error") setRoleActivity(meeting, admin, {
				status: "idle",
				stage: uiMessage("runmeetingadmin.waiting.for.an.administrator.command"),
				detail: "",
				currentTool: ""
			});
		}
	}
	async function runStageSummary(meeting, runtime) {
		const admin = meeting.administratorProfile;
		setRoleActivity(meeting, admin, {
			status: "working",
			stage: uiMessage("runstagesummary.preparing.a.progress.summary"),
			detail: "",
			currentTool: ""
		}, uiMessage("runstagesummary.started.preparing.a.progress.summary"));
		const result = await startRoleRun({
			label: `arena:${meeting.id}:stage-summary`,
			prompt: [
				`你是 ${admin.name}，请为仍将继续的协作会议生成一份阶段总结。话题：${meeting.topic}`,
				"summary 总结截至目前已经达成的共识、完成的工作和可直接使用的成果；rationale 写清关键依据、风险和取舍；openItems 列出仍需人类决定或后续处理的事项。不要宣告会议结束，不要评选获胜角色。",
				"",
				"协作控制台：",
				meetingWorkspaceText(meeting),
				"",
				"完整公开记录：",
				transcriptText(meeting.transcript)
			].join("\n"),
			persona: `你是中立的会议管理员 ${admin.name}。`,
			profile: admin,
			parent: runtime.parent,
			runtime,
			outputSchema: finalSummarySchema()
		});
		const fallback = messageText(result.output);
		const summary = result.structured && typeof result.structured === "object" ? result.structured : {
			summary: fallback || "当前阶段暂时没有可总结的内容。",
			rationale: "",
			openItems: []
		};
		meeting.summaryCount = Number(meeting.summaryCount || 0) + 1;
		const summaryText = [
			summary.summary,
			summary.rationale,
			Array.isArray(summary.openItems) && summary.openItems.length ? `仍需处理：\n${summary.openItems.map((item) => `- ${item}`).join("\n")}` : ""
		].filter(Boolean).join("\n\n");
		meeting.transcript.push({
			id: randomUUID(),
			kind: "admin",
			speakerId: "administrator",
			speaker: admin.name,
			avatar: admin.avatar,
			text: summaryText,
			phase: "summary",
			createdAt: nowIso(),
			model: admin.model
		});
		createWorkspaceArtifact(meeting, {
			title: `阶段总结 ${meeting.summaryCount}`,
			description: summaryText,
			artifactType: "summary",
			ownerId: "administrator"
		}, "administrator").status = "accepted";
		meeting.collaborationStage = "waiting-human";
		setRoleActivity(meeting, admin, {
			status: "idle",
			stage: uiMessage("runstagesummary.progress.summary.ready.waiting.for.follow.up.messages"),
			detail: "",
			currentTool: ""
		}, uiMessage("runstagesummary.completed.the.progress.summary"), "success");
	}
	async function runMeeting(meeting) {
		const pending = pendingMeetingStarts.get(meeting.id);
		pendingMeetingStarts.delete(meeting.id);
		const initialTargets = pending ? pending.targetIds : meeting.participants.filter((item) => !isMuted(meeting, item.id)).map((item) => item.id);
		const runtime = {
			abort: new AbortController(),
			activeRuns: /* @__PURE__ */ new Set(),
			pauseRequested: false,
			cancelCurrentWork: false,
			summaryRequested: pending?.summaryRequested === true,
			targetIds: new Set(initialTargets),
			adminCommands: [...pending?.adminCommands ?? []],
			parent: void 0,
			roleAgents: /* @__PURE__ */ new Map(),
			agentHandles: /* @__PURE__ */ new Set(),
			skipAutoContinuation: false,
			triggerSource: pending?.triggerSource || "initial",
			container: meeting,
			isMeeting: true,
			fileClaims: /* @__PURE__ */ new Map(),
			workdir: runtimeWorkdir(meeting)
		};
		runtimes.set(meeting.id, runtime);
		ensureActivityMonitor(meeting);
		meeting.status = "running";
		meeting.updatedAt = nowIso();
		await persist();
		try {
			await normalizeRoomWorkdir(runtime.workdir);
			runtime.parent = await createParent("Agent Arena collaborative meeting", runtime.abort.signal, runtime.workdir);
			while (!runtime.abort.signal.aborted) {
				if (!await checkpoint(meeting, runtime)) break;
				while (runtime.adminCommands.length) {
					await runMeetingAdmin(meeting, runtime.adminCommands.shift(), runtime);
					await persist();
					if (runtime.pauseRequested) break;
				}
				if (runtime.pauseRequested) continue;
				if (runtime.summaryRequested && !runtime.targetIds.size) {
					runtime.summaryRequested = false;
					await runStageSummary(meeting, runtime).catch((error) => {
						setRoleActivity(meeting, meeting.administratorProfile, {
							status: "error",
							stage: uiMessage("runmeeting.progress.summary.failed"),
							detail: safeError(error),
							currentTool: ""
						}, safeError(error), "error");
					});
					await persist();
					runtime.pauseRequested = true;
					continue;
				}
				const ids = [...runtime.targetIds].filter((id) => !isMuted(meeting, id));
				runtime.targetIds.clear();
				if (!ids.length) {
					runtime.pauseRequested = true;
					continue;
				}
				meeting.turnCount = Number(meeting.turnCount || 0) + 1;
				const triggerSource = runtime.triggerSource;
				runtime.triggerSource = "auto";
				await Promise.all(ids.map(async (id) => {
					const participant = meeting.participants.find((item) => item.id === id);
					if (participant) await runOne(meeting, participant, runtime);
				}));
				if (runtime.cancelCurrentWork) {
					runtime.cancelCurrentWork = false;
					runtime.pauseRequested = true;
					continue;
				}
				if (!runtime.summaryRequested && !runtime.pauseRequested && !runtime.targetIds.size && !runtime.adminCommands.length) if (runtime.skipAutoContinuation) runtime.skipAutoContinuation = false;
				else await evaluateMeetingContinuation(meeting, ids, runtime, shouldRequirePeerReaction(triggerSource, ids.length));
			}
		} catch (error) {
			meeting.error = runtime.abort.signal.aborted ? null : safeError(error);
			if (!runtime.abort.signal.aborted) setRoleActivity(meeting, meeting.administratorProfile, {
				status: "error",
				stage: uiMessage("runmeeting.meeting.execution.failed"),
				detail: safeError(error),
				currentTool: ""
			}, safeError(error), "error");
		} finally {
			const restartRequest = !runtime.abort.signal.aborted && !runtime.pauseRequested && (runtime.targetIds.size || runtime.adminCommands.length || runtime.summaryRequested) ? {
				targetIds: [...runtime.targetIds],
				adminCommands: [...runtime.adminCommands],
				summaryRequested: runtime.summaryRequested,
				triggerSource: runtime.triggerSource || "human"
			} : null;
			await Promise.allSettled([...runtime.activeRuns].map((run) => run.dispose()));
			await Promise.allSettled([...runtime.agentHandles].map((handle) => handle.dispose()));
			if (runtime.parent) await runtime.parent.dispose().catch(() => void 0);
			runtimes.delete(meeting.id);
			if (restartRequest) enqueueMeetingRun(meeting, restartRequest);
			else meeting.status = "paused";
			meeting.participants = meeting.participants.map((item) => ({
				...item,
				status: "idle"
			}));
			meeting.updatedAt = nowIso();
			await persist().catch(() => void 0);
			if (restartRequest) pumpQueue();
		}
	}
	function pumpQueue() {
		if (disposed) return;
		while (activeCount < maxConcurrentMeetings && queue.length) {
			const meeting = meetings.get(queue.shift());
			if (!meeting || meeting.status !== "queued") continue;
			activeCount += 1;
			runMeeting(meeting).finally(() => {
				activeCount -= 1;
				pumpQueue();
			});
		}
	}
	function enqueueMeetingRun(meeting, request = {}) {
		const previous = pendingMeetingStarts.get(meeting.id);
		const targetIds = /* @__PURE__ */ new Set([...previous?.targetIds ?? [], ...request.targetIds ?? []]);
		const adminCommands = [...previous?.adminCommands ?? [], ...request.adminCommands ?? []];
		pendingMeetingStarts.set(meeting.id, {
			targetIds: [...targetIds],
			adminCommands,
			summaryRequested: previous?.summaryRequested === true || request.summaryRequested === true,
			triggerSource: request.triggerSource || previous?.triggerSource || "human"
		});
		meeting.status = "queued";
		meeting.error = null;
		if (meeting.collaborationStage === "completed") meeting.collaborationStage = "waiting-human";
		if (!queue.includes(meeting.id)) queue.push(meeting.id);
	}
	async function createMeeting(raw) {
		let input;
		try {
			input = validateMeetingInput(raw);
		} catch (error) {
			throw new HttpError(400, error.i18n ? uiMessage(error.i18n.key, error.i18n.params) : safeError(error));
		}
		const workdir = await normalizeRoomWorkdir(raw?.workdir);
		const createdAt = nowIso();
		const meeting = {
			id: randomUUID(),
			...input,
			participants: input.participants.map((item) => ({
				...item,
				status: "idle"
			})),
			administratorProfile: administratorSnapshot(),
			humanProfile: { ...profiles.human },
			status: "queued",
			turnCount: 0,
			createdAt,
			updatedAt: createdAt,
			transcript: [],
			mutedParticipantIds: [],
			userVote: null,
			verdict: null,
			error: null,
			collaborationStage: "discussion",
			tasks: [],
			decisions: [],
			artifacts: [],
			workdir,
			permissions: Object.fromEntries([["administrator", "danger-full-access"], ...input.participants.map((item) => [item.id, "danger-full-access"])])
		};
		ensureActivityMonitor(meeting);
		meetings.set(meeting.id, meeting);
		queue.push(meeting.id);
		await persist();
		pumpQueue();
		return meeting;
	}
	function addMeetingMembers(meeting, raw) {
		const requestedIds = [...new Set(Array.isArray(raw?.profileIds) ? raw.profileIds.map(String) : [])];
		const existingIds = new Set(meeting.participants.map((item) => item.id));
		const newIds = requestedIds.filter((id) => !existingIds.has(id));
		if (!newIds.length) throw new HttpError(400, uiMessage("addmeetingmembers.select.ai.users.who.have.not.joined.this.meeting"));
		if (meeting.participants.length + newIds.length > 12) throw new HttpError(400, uiMessage("addmeetingmembers.a.meeting.can.have.up.to.12.ai.users"));
		const invited = newIds.map((id) => profiles.aiUsers.find((item) => item.id === id));
		if (invited.some((item) => !item)) throw new HttpError(400, uiMessage("addmeetingmembers.the.invitation.list.includes.ai.users.that.no.longer"));
		meeting.participants.push(...invited.map((item) => ({
			...item,
			status: "idle"
		})));
		meeting.permissions ??= {};
		for (const item of invited) meeting.permissions[item.id] = "danger-full-access";
		ensureActivityMonitor(meeting);
		appendSystem(meeting, uiMessage("addmeetingmembers.value.joined.the.meeting", { p0: invited.map((item) => item.name).join("、") }), true);
		return meeting;
	}
	async function setContainerPermission(container, raw) {
		const profileId = String(raw?.profileId || "");
		const target = permissionProfiles(container).find((item) => item.id === profileId);
		if (!target) throw new HttpError(400, uiMessage("setcontainerpermission.the.permission.target.is.not.a.member.of.this"));
		const mode = normalizePermissionMode(raw?.mode);
		container.permissions ??= {};
		container.permissions[profileId] = mode;
		const pending = (runtimes.get(container.id) || roomRuntimes.get(container.id))?.roleAgents?.get(profileId);
		if (pending) try {
			applyAgentPermission(await pending, mode);
		} catch {}
		appendSystem(container, uiMessage("setcontainerpermission.value.s.permissions.have.been.set.to.value", {
			p0: target.name || "AI",
			p1: AGENT_PERMISSION_LABELS[mode]
		}), Boolean(container.topic));
		container.updatedAt = nowIso();
		await persist();
		return container;
	}
	async function actOnMeeting(meeting, body) {
		const action = String(body?.action ?? "");
		const runtime = runtimes.get(meeting.id);
		let shouldPump = false;
		if (action === "pause") {
			if (!runtime || meeting.status !== "running") throw new HttpError(409, uiMessage("actonmeeting.no.ai.reply.is.currently.in.progress"));
			runtime.pauseRequested = true;
			meeting.status = "pausing";
		} else if (action === "resume" || action === "reopen") {
			const targets = meeting.participants.filter((item) => !isMuted(meeting, item.id)).map((item) => item.id);
			if (runtime) {
				runtime.triggerSource = "human";
				targets.forEach((id) => runtime.targetIds.add(id));
				wakeRuntime(meeting, runtime);
			} else {
				enqueueMeetingRun(meeting, {
					targetIds: targets,
					triggerSource: "human"
				});
				shouldPump = true;
			}
		} else if (action === "finish" || action === "summarize") if (runtime) {
			runtime.summaryRequested = true;
			wakeRuntime(meeting, runtime);
		} else {
			enqueueMeetingRun(meeting, {
				summaryRequested: true,
				triggerSource: "human"
			});
			shouldPump = true;
		}
		else if (action === "stop") {
			if (!BUSY_MEETING_STATUSES.has(meeting.status)) throw new HttpError(409, uiMessage("actonmeeting.there.is.no.ai.work.to.stop"));
			if (!runtime && meeting.status === "queued") {
				pendingMeetingStarts.delete(meeting.id);
				for (let index = queue.length - 1; index >= 0; index -= 1) if (queue[index] === meeting.id) queue.splice(index, 1);
				meeting.status = "paused";
			} else if (runtime) {
				runtime.cancelCurrentWork = true;
				runtime.pauseRequested = true;
				runtime.summaryRequested = false;
				runtime.targetIds.clear();
				runtime.adminCommands.length = 0;
				meeting.status = "pausing";
				for (const run of runtime.activeRuns) run.dispose().catch(() => void 0);
				for (const pending of runtime.roleAgents.values()) pending.then((handle) => handle.agent.cancel({ kind: "user" }, { keepInbox: false })).catch(() => void 0);
			} else throw new HttpError(409, uiMessage("actonmeeting.the.work.state.has.changed.please.try.again"));
			appendSystem(meeting, uiMessage("actonmeeting.the.human.user.stopped.the.current.ai.work.the"), true);
		} else if (action === "intervene" || action === "send") {
			const text = typeof body.text === "string" ? body.text.trim().slice(0, 4e3) : "";
			if (!text) throw new HttpError(400, uiMessage("actonmeeting.the.message.cannot.be.empty"));
			meeting.transcript.push({
				id: randomUUID(),
				kind: "user",
				speakerId: "human",
				speaker: profiles.human.name,
				avatar: profiles.human.avatar,
				text,
				createdAt: nowIso()
			});
			meeting.humanProfile = { ...profiles.human };
			const directives = applySpeechControls(meeting, text, runtime, true);
			const targets = mentionedProfileIds(text, meeting.participants);
			const adminMentioned = mentionsAdministrator(text, meeting.administratorProfile?.name);
			const availableTargets = targets.filter((id) => !isMuted(meeting, id));
			const requestedTargets = directives.commandOnly ? [] : availableTargets.length ? availableTargets : adminMentioned ? [] : meeting.participants.filter((item) => !isMuted(meeting, item.id)).map((item) => item.id);
			if (runtime) {
				runtime.triggerSource = "human";
				if (adminMentioned) runtime.adminCommands.push(text);
				requestedTargets.forEach((id) => runtime.targetIds.add(id));
				if (runtime.targetIds.size || runtime.adminCommands.length) wakeRuntime(meeting, runtime);
			} else if (requestedTargets.length || adminMentioned) {
				enqueueMeetingRun(meeting, {
					targetIds: requestedTargets,
					adminCommands: adminMentioned ? [text] : [],
					triggerSource: "human"
				});
				shouldPump = true;
			} else meeting.status = "paused";
		} else if (action === "invite-members") addMeetingMembers(meeting, body);
		else if (action === "set-permission") await setContainerPermission(meeting, body);
		else if (action === "set-stage") {
			const stage = String(body.stage ?? "");
			if (!MEETING_STAGES.includes(stage) || stage === "completed") throw new HttpError(400, uiMessage("actonmeeting.invalid.collaboration.stage"));
			meeting.collaborationStage = stage;
		} else if (action === "approval") await resolveArenaApproval(meeting, body);
		else if (action === "task-create") createWorkspaceTask(meeting, body, "human");
		else if (action === "task-update") updateWorkspaceTask(meeting, body);
		else if (action === "task-delete") deleteWorkspaceTask(meeting, body);
		else if (action === "decision-create") createWorkspaceDecision(meeting, body, "human");
		else if (action === "decision-choose") {
			const decision = chooseWorkspaceDecision(meeting, body, "human");
			const selected = decision.options.find((item) => item.id === decision.selectedOptionId);
			appendSystem(meeting, uiMessage("actonmeeting.the.human.user.chose.an.option.for.value.value", {
				p0: decision.title,
				p1: selected?.label || "未知方案"
			}), true);
		} else if (action === "decision-reopen") appendSystem(meeting, uiMessage("actonmeeting.the.human.user.reopened.decision.value", { p0: reopenWorkspaceDecision(meeting, body).title }), true);
		else if (action === "decision-delete") deleteWorkspaceDecision(meeting, body);
		else if (action === "artifact-create") createWorkspaceArtifact(meeting, body, "human");
		else if (action === "artifact-update") {
			const artifact = updateWorkspaceArtifact(meeting, body);
			if (artifact.status === "rejected") appendSystem(meeting, uiMessage("actonmeeting.the.human.user.rejected.deliverable.value.further.changes.are", { p0: artifact.title }), true);
		} else if (action === "artifact-delete") deleteWorkspaceArtifact(meeting, body);
		else if (action === "request-evidence") {
			const text = `请为${workspaceText(body.subject, 240) || "当前方案与成果"}补充可核查的证据、来源、测试结果或文件位置；不确定的内容请明确说明。`;
			meeting.transcript.push({
				id: randomUUID(),
				kind: "user",
				speakerId: "human",
				speaker: profiles.human.name,
				avatar: profiles.human.avatar,
				text,
				createdAt: nowIso()
			});
			if (runtime) {
				runtime.triggerSource = "human";
				meeting.participants.filter((item) => !isMuted(meeting, item.id)).forEach((item) => runtime.targetIds.add(item.id));
				wakeRuntime(meeting, runtime);
			} else {
				enqueueMeetingRun(meeting, {
					targetIds: meeting.participants.filter((item) => !isMuted(meeting, item.id)).map((item) => item.id),
					triggerSource: "human"
				});
				shouldPump = true;
			}
		} else if (action === "vote") {
			const participantId = String(body.participantId ?? "");
			if (!meeting.participants.some((item) => item.id === participantId)) throw new HttpError(400, uiMessage("actonmeeting.invalid.vote.target"));
			meeting.userVote = participantId;
		} else throw new HttpError(400, uiMessage("actonmeeting.unknown.action"));
		meeting.updatedAt = nowIso();
		await persist();
		if (shouldPump) pumpQueue();
		return meeting;
	}
	function roomOrThrow(id) {
		const room = rooms.get(id);
		if (!room) throw new HttpError(404, uiMessage("roomorthrow.this.chat.was.not.found"));
		return room;
	}
	async function runRoomAi(room, profile, runtime) {
		if (isMuted(room, profile.id)) return;
		let failed = false;
		room.respondingProfileIds = [.../* @__PURE__ */ new Set([...room.respondingProfileIds ?? [], profile.id])];
		room.respondingProfileId = room.respondingProfileIds[0] ?? null;
		await persist();
		try {
			const handle = await roleAgent(runtime, profile.id, `arena-chat:${room.id}:${profile.name}`, profile);
			if (runtime.abort.signal.aborted || isMuted(room, profile.id)) return;
			await persist();
			const result = await runFullAgentTurn(handle, chatPrompt(room, profile, coordinationPrompt(runtime, profile.id)), runtime, profile, "work");
			if (!runtime.abort.signal.aborted && !isMuted(room, profile.id)) {
				if (result.silent && !result.autonomousMessageIds.length) return;
				if (!result.autonomousMessageIds.length) {
					if (!result.text) throw new Error(`本轮没有产生可展示文本，结束原因：${result.stopReason}`);
					room.messages.push({
						id: randomUUID(),
						kind: "ai",
						senderId: profile.id,
						senderName: profile.name,
						avatar: profile.avatar,
						text: result.text,
						phase: "result",
						createdAt: nowIso(),
						model: profile.model
					});
				}
			}
		} catch (error) {
			failed = true;
			setRoleActivity(room, profile, {
				status: "error",
				stage: uiMessage("runroomai.the.reply.failed.for.this.turn"),
				detail: safeError(error),
				currentTool: ""
			}, safeError(error), "error");
		} finally {
			releaseRoleClaims(runtime, profile.id);
			if (isMuted(room, profile.id)) setRoleActivity(room, profile, {
				status: "muted",
				stage: uiMessage("role_activity.muted"),
				detail: "",
				currentTool: "",
				claimedFiles: []
			});
			else if (!failed) setRoleActivity(room, profile, {
				status: "idle",
				stage: uiMessage("runone.waiting.for.follow.up.messages"),
				detail: "",
				currentTool: "",
				claimedFiles: []
			});
			room.respondingProfileIds = (room.respondingProfileIds ?? []).filter((id) => id !== profile.id);
			room.respondingProfileId = room.respondingProfileIds[0] ?? null;
			room.updatedAt = nowIso();
			await persist().catch(() => void 0);
		}
	}
	async function runRoomAdmin(room, command, runtime) {
		const admin = room.administratorProfile;
		let failed = false;
		setRoleActivity(room, admin, {
			status: "working",
			stage: uiMessage("runmeetingadmin.handling.an.administrator.command"),
			detail: command.slice(0, 240),
			currentTool: ""
		}, uiMessage("runmeetingadmin.started.handling.an.administrator.command"));
		try {
			const result = await askAdministrator(room, command, runtime.parent, runtime, false);
			room.messages.push({
				id: randomUUID(),
				kind: "admin",
				senderId: "administrator",
				senderName: room.administratorProfile.name,
				avatar: room.administratorProfile.avatar,
				text: result.reply,
				createdAt: nowIso(),
				model: room.administratorProfile.model
			});
			if (result.action === "change-topic" && result.topic.length >= 2) {
				room.name = result.topic.slice(0, 60);
				appendSystem(room, uiMessage("runroomadmin.the.administrator.changed.the.group.topic.to.value", { p0: room.name }), false);
			} else if (result.action === "continue") room.participants.filter((item) => !isMuted(room, item.id)).forEach((item) => runtime.targetIds.add(item.id));
		} catch (error) {
			failed = true;
			setRoleActivity(room, admin, {
				status: "error",
				stage: uiMessage("runmeetingadmin.the.administrator.command.failed"),
				detail: safeError(error)
			}, safeError(error), "error");
		} finally {
			if (!failed) setRoleActivity(room, admin, {
				status: "idle",
				stage: uiMessage("runmeetingadmin.waiting.for.an.administrator.command"),
				detail: "",
				currentTool: ""
			});
		}
	}
	async function evaluateRoomContinuation(room, completedIds, runtime, requirePeerReaction = false) {
		if (room.type !== "group" || runtime.abort.signal.aborted) return;
		const admin = room.administratorProfile;
		setRoleActivity(room, admin, {
			status: "working",
			stage: uiMessage("evaluatemeetingcontinuation.waiting.for.follow.up.checks"),
			detail: "",
			currentTool: ""
		}, uiMessage("evaluatemeetingcontinuation.started.per.role.follow.up.checks"));
		try {
			if (!profiles.settings.autoReplyEnabled) return;
			const intents = (await collectReplyIntents(room, completedIds, runtime, false, requirePeerReaction)).filter((item) => item.shouldSpeak);
			const decision = await guardContinuation(room, intents, runtime, false);
			if (decision.complete || !decision.onTopic) {
				if (!decision.onTopic) appendSystem(room, uiMessage("evaluateroomcontinuation.automatic.ai.follow.ups.stopped.because.the.discussion.was"), false);
				return;
			}
			const candidates = new Set(intents.map((item) => item.profile.id));
			const next = decision.approvedSpeakerIds.filter((id) => candidates.has(id) && !isMuted(room, id)).slice(0, 1);
			for (const id of next.length ? next : intents.slice(0, 1).map((item) => item.profile.id)) runtime.targetIds.add(id);
		} catch (error) {
			setRoleActivity(room, admin, {
				status: "error",
				stage: uiMessage("evaluatemeetingcontinuation.the.follow.up.check.process.failed"),
				detail: safeError(error),
				currentTool: ""
			}, safeError(error), "error");
		} finally {
			if (roleActivity(room, admin).status !== "error") setRoleActivity(room, admin, {
				status: "idle",
				stage: uiMessage("runmeetingadmin.waiting.for.an.administrator.command"),
				detail: "",
				currentTool: ""
			});
		}
	}
	async function runRoomReplies(room, runtime) {
		runtime.running = true;
		room.status = "responding";
		room.updatedAt = nowIso();
		await persist();
		try {
			await normalizeRoomWorkdir(runtime.workdir);
			runtime.parent = await createParent("Agent Arena social chat", runtime.abort.signal, runtime.workdir);
			while (!runtime.abort.signal.aborted) {
				while (runtime.adminCommands.length) await runRoomAdmin(room, runtime.adminCommands.shift(), runtime);
				const ids = [...runtime.targetIds].filter((id) => !isMuted(room, id));
				runtime.targetIds.clear();
				if (!ids.length) break;
				const triggerSource = runtime.triggerSource || "auto";
				runtime.triggerSource = "auto";
				await Promise.all(ids.map(async (id) => {
					const profile = room.participants.find((item) => item.id === id);
					if (profile) await runRoomAi(room, profile, runtime);
				}));
				if (room.type === "group" && !runtime.targetIds.size && !runtime.adminCommands.length) if (runtime.skipAutoContinuation) runtime.skipAutoContinuation = false;
				else await evaluateRoomContinuation(room, ids, runtime, shouldRequirePeerReaction(triggerSource, ids.length));
			}
		} catch (error) {
			if (!runtime.abort.signal.aborted) {
				const owner = room.administratorProfile || room.participants[0];
				if (owner) setRoleActivity(room, owner, {
					status: "error",
					stage: uiMessage("runroomreplies.chat.execution.failed"),
					detail: safeError(error),
					currentTool: ""
				}, safeError(error), "error");
			}
		} finally {
			room.status = "idle";
			room.respondingProfileId = null;
			room.respondingProfileIds = [];
			room.updatedAt = nowIso();
			await persist().catch(() => void 0);
			await Promise.allSettled([...runtime.activeRuns].map((run) => run.dispose()));
			await Promise.allSettled([...runtime.agentHandles].map((handle) => handle.dispose()));
			if (runtime.parent) await runtime.parent.dispose().catch(() => void 0);
			runtime.running = false;
			if (runtime.targetIds.size || runtime.adminCommands.length) {
				const nextRuntime = {
					abort: new AbortController(),
					activeRuns: /* @__PURE__ */ new Set(),
					targetIds: new Set(runtime.targetIds),
					adminCommands: [...runtime.adminCommands],
					parent: void 0,
					running: false,
					roleAgents: /* @__PURE__ */ new Map(),
					agentHandles: /* @__PURE__ */ new Set(),
					skipAutoContinuation: false,
					container: room,
					isMeeting: false,
					fileClaims: /* @__PURE__ */ new Map(),
					triggerSource: runtime.triggerSource || "auto",
					workdir: runtimeWorkdir(room)
				};
				roomRuntimes.set(room.id, nextRuntime);
				runRoomReplies(room, nextRuntime);
			} else roomRuntimes.delete(room.id);
		}
	}
	function queueRoomReplies(room, text, directives) {
		if (directives?.commandOnly) return;
		let runtime = roomRuntimes.get(room.id);
		if (!runtime) {
			runtime = {
				abort: new AbortController(),
				activeRuns: /* @__PURE__ */ new Set(),
				targetIds: /* @__PURE__ */ new Set(),
				adminCommands: [],
				parent: void 0,
				running: false,
				roleAgents: /* @__PURE__ */ new Map(),
				agentHandles: /* @__PURE__ */ new Set(),
				skipAutoContinuation: false,
				container: room,
				isMeeting: false,
				fileClaims: /* @__PURE__ */ new Map(),
				triggerSource: "human",
				workdir: runtimeWorkdir(room)
			};
			roomRuntimes.set(room.id, runtime);
		}
		runtime.triggerSource = "human";
		const targets = mentionedProfileIds(text, room.participants);
		const adminMentioned = room.type === "group" && mentionsAdministrator(text, room.administratorProfile?.name);
		if (adminMentioned) runtime.adminCommands.push(text);
		const availableTargets = targets.filter((id) => !isMuted(room, id));
		if (availableTargets.length) availableTargets.forEach((id) => runtime.targetIds.add(id));
		else if (!adminMentioned) room.participants.filter((item) => !isMuted(room, item.id)).forEach((item) => runtime.targetIds.add(item.id));
		if (!runtime.running) runRoomReplies(room, runtime);
	}
	async function createRoom(raw) {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new HttpError(400, uiMessage("createroom.the.chat.configuration.must.be.a.json.object"));
		const workdir = await normalizeRoomWorkdir(raw.workdir);
		const type = raw.type === "group" ? "group" : "direct";
		const profileIds = [...new Set(Array.isArray(raw.profileIds) ? raw.profileIds.map(String) : [])];
		if (type === "direct" && profileIds.length !== 1 || type === "group" && (profileIds.length < 2 || profileIds.length > 12)) throw new HttpError(400, type === "direct" ? uiMessage("createroom.select.exactly.1.ai.user.for.a.direct.chat") : uiMessage("createroom.select.2.12.ai.users.for.a.group.chat"));
		const participants = profileIds.map((id) => profiles.aiUsers.find((item) => item.id === id));
		if (participants.some((item) => !item)) throw new HttpError(400, uiMessage("createroom.the.chat.includes.ai.users.that.no.longer.exist"));
		const nameInput = typeof raw.name === "string" ? raw.name.trim().slice(0, 60) : "";
		const createdAt = nowIso();
		const room = {
			id: randomUUID(),
			type,
			name: nameInput || (type === "direct" ? participants[0].name : `${participants.map((item) => item.name).join("、")}的小群`),
			participants: participants.map((item) => ({ ...item })),
			humanProfile: { ...profiles.human },
			administratorProfile: type === "group" ? administratorSnapshot() : null,
			messages: [],
			workdir,
			mutedParticipantIds: [],
			permissions: Object.fromEntries([...type === "group" ? [["administrator", "danger-full-access"]] : [], ...participants.map((item) => [item.id, "danger-full-access"])]),
			status: "idle",
			respondingProfileId: null,
			respondingProfileIds: [],
			createdAt,
			updatedAt: createdAt
		};
		ensureActivityMonitor(room);
		rooms.set(room.id, room);
		await persist();
		return room;
	}
	async function sendRoomMessage(room, raw) {
		const text = typeof raw?.text === "string" ? raw.text.trim().slice(0, 4e3) : "";
		if (!text) throw new HttpError(400, uiMessage("actonmeeting.the.message.cannot.be.empty"));
		room.messages.push({
			id: randomUUID(),
			kind: "human",
			senderId: "human",
			senderName: profiles.human.name,
			avatar: profiles.human.avatar,
			text,
			createdAt: nowIso()
		});
		room.humanProfile = { ...profiles.human };
		const directives = applySpeechControls(room, text, roomRuntimes.get(room.id), false);
		room.updatedAt = nowIso();
		await persist();
		queueRoomReplies(room, text, directives);
		return room;
	}
	async function retryRoomMessage(room) {
		if (roomRuntimes.has(room.id) || room.status === "responding") throw new HttpError(409, uiMessage("retryroommessage.ai.users.are.processing.the.current.message.please.wait"));
		const latest = [...room.messages].reverse().find((item) => item.kind === "human");
		if (!latest) throw new HttpError(400, uiMessage("retryroommessage.there.are.no.human.messages.to.retry.in.this"));
		const directives = parseSpeechDirectives(latest.text, room.participants);
		if (directives.commandOnly) throw new HttpError(400, uiMessage("retryroommessage.the.last.message.was.only.a.speaking.control.command"));
		appendSystem(room, uiMessage("retryroommessage.retrying.the.last.message"), false);
		room.updatedAt = nowIso();
		await persist();
		queueRoomReplies(room, latest.text, directives);
		return room;
	}
	async function renameRoom(room, raw) {
		const patch = await conversationSettingsPatch(raw);
		Object.assign(room, patch);
		room.updatedAt = nowIso();
		await persist();
		return room;
	}
	async function addRoomMembers(room, raw) {
		if (room.type !== "group") throw new HttpError(409, uiMessage("addroommembers.only.group.chats.support.inviting.new.members"));
		const requestedIds = [...new Set(Array.isArray(raw?.profileIds) ? raw.profileIds.map(String) : [])];
		const existingIds = new Set(room.participants.map((item) => item.id));
		const newIds = requestedIds.filter((id) => !existingIds.has(id));
		if (!newIds.length) throw new HttpError(400, uiMessage("addroommembers.select.ai.users.who.have.not.joined.this.group"));
		if (room.participants.length + newIds.length > 12) throw new HttpError(400, uiMessage("addroommembers.a.group.chat.can.have.up.to.12.ai"));
		const invited = newIds.map((id) => profiles.aiUsers.find((item) => item.id === id));
		if (invited.some((item) => !item)) throw new HttpError(400, uiMessage("addmeetingmembers.the.invitation.list.includes.ai.users.that.no.longer"));
		room.participants.push(...invited.map((item) => ({ ...item })));
		room.permissions ??= {};
		for (const item of invited) room.permissions[item.id] = "danger-full-access";
		ensureActivityMonitor(room);
		appendSystem(room, uiMessage("addroommembers.value.joined.the.group", { p0: invited.map((item) => item.name).join("、") }), false);
		room.updatedAt = nowIso();
		await persist();
		return room;
	}
	async function renameMeeting(meeting, raw) {
		const patch = await conversationSettingsPatch(raw, "displayName");
		Object.assign(meeting, patch);
		meeting.updatedAt = nowIso();
		await persist();
		return meeting;
	}
	async function deleteMeeting(meeting) {
		if (BUSY_MEETING_STATUSES.has(meeting.status) || runtimes.has(meeting.id)) throw new HttpError(409, uiMessage("deletemeeting.ai.users.are.working.stop.the.current.work.before"));
		pendingMeetingStarts.delete(meeting.id);
		meetings.delete(meeting.id);
		await persist();
	}
	function meetingOrThrow(id) {
		const meeting = meetings.get(id);
		if (!meeting) throw new HttpError(404, uiMessage("meetingorthrow.this.meeting.was.not.found"));
		return meeting;
	}
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: API_ROOT,
		handler: async (req, res) => {
			try {
				await hydrated;
				const url = new URL(req.url ?? "/", "http://dsh.internal");
				const method = String(req.method ?? "GET").toUpperCase();
				const suffix = url.pathname.slice(28) || "/";
				if (method === "GET" && suffix === "/state") {
					respond(res, 200, {
						meetings: [...meetings.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(publicMeeting),
						rooms: [...rooms.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map(publicMeeting),
						templates: ARENA_TEMPLATES,
						profiles: publicMeeting({
							...profiles,
							administrator: administratorSnapshot()
						}),
						settings: publicMeeting(profiles.settings),
						cooldowns: [...channelCooldowns.entries()].filter(([, until]) => until > Date.now()).map(([key, until]) => ({
							key,
							until,
							remainingMs: until - Date.now()
						})),
						modelCatalog: await modelCatalog(),
						defaultModel: defaultModel(),
						limits: { maxConcurrentMeetings }
					});
					return;
				}
				if (method === "PATCH" && suffix === "/settings") {
					respond(res, 200, { settings: publicMeeting(await saveSettings(await readJsonBody(req))) });
					return;
				}
				if (method === "POST" && suffix === "/profiles/human") {
					respond(res, 200, { profile: publicMeeting(await saveHumanProfile(await readJsonBody(req))) });
					return;
				}
				if (method === "POST" && suffix === "/profiles/administrator") {
					respond(res, 200, { profile: publicMeeting(await saveAdministratorProfile(await readJsonBody(req))) });
					return;
				}
				if (method === "POST" && suffix === "/profiles/ai") {
					respond(res, 200, { profile: publicMeeting(await saveAiProfile(await readJsonBody(req))) });
					return;
				}
				const profileMatch = /^\/profiles\/ai\/([^/]+)$/.exec(suffix);
				if (method === "DELETE" && profileMatch) {
					await deleteAiProfile(decodeURIComponent(profileMatch[1]));
					respond(res, 200, { ok: true });
					return;
				}
				if (method === "POST" && suffix === "/meetings") {
					respond(res, 201, { meeting: publicMeeting(await createMeeting(await readJsonBody(req))) });
					return;
				}
				if (method === "POST" && suffix === "/rooms") {
					respond(res, 201, { room: publicMeeting(await createRoom(await readJsonBody(req))) });
					return;
				}
				const roomMatch = /^\/rooms\/([^/]+)(?:\/(messages|members|retry|actions))?$/.exec(suffix);
				if (roomMatch) {
					const room = roomOrThrow(decodeURIComponent(roomMatch[1]));
					if (method === "GET" && !roomMatch[2]) {
						respond(res, 200, { room: publicMeeting(room) });
						return;
					}
					if (method === "PATCH" && !roomMatch[2]) {
						respond(res, 200, { room: publicMeeting(await renameRoom(room, await readJsonBody(req))) });
						return;
					}
					if (method === "POST" && suffix.endsWith("/messages")) {
						respond(res, 202, { room: publicMeeting(await sendRoomMessage(room, await readJsonBody(req))) });
						return;
					}
					if (method === "POST" && suffix.endsWith("/members")) {
						respond(res, 200, { room: publicMeeting(await addRoomMembers(room, await readJsonBody(req))) });
						return;
					}
					if (method === "POST" && suffix.endsWith("/retry")) {
						respond(res, 202, { room: publicMeeting(await retryRoomMessage(room)) });
						return;
					}
					if (method === "POST" && suffix.endsWith("/actions")) {
						const body = await readJsonBody(req);
						if (String(body?.action || "") === "set-permission") await setContainerPermission(room, body);
						else if (String(body?.action || "") === "approval") await resolveArenaApproval(room, body);
						else throw new HttpError(400, uiMessage("apply.unknown.chat.action"));
						respond(res, 200, { room: publicMeeting(room) });
						return;
					}
					if (method === "DELETE" && !roomMatch[2]) {
						const runtime = roomRuntimes.get(room.id);
						if (runtime) runtime.abort.abort(/* @__PURE__ */ new Error("Deleted by user"));
						rooms.delete(room.id);
						await persist();
						respond(res, 200, { ok: true });
						return;
					}
				}
				const match = /^\/meetings\/([^/]+)(?:\/actions)?$/.exec(suffix);
				if (match) {
					const meeting = meetingOrThrow(decodeURIComponent(match[1]));
					if (method === "GET" && !suffix.endsWith("/actions")) {
						respond(res, 200, { meeting: publicMeeting(meeting) });
						return;
					}
					if (method === "PATCH" && !suffix.endsWith("/actions")) {
						respond(res, 200, { meeting: publicMeeting(await renameMeeting(meeting, await readJsonBody(req))) });
						return;
					}
					if (method === "DELETE" && !suffix.endsWith("/actions")) {
						await deleteMeeting(meeting);
						respond(res, 200, { ok: true });
						return;
					}
					if (method === "POST" && suffix.endsWith("/actions")) {
						respond(res, 200, { meeting: publicMeeting(await actOnMeeting(meeting, await readJsonBody(req))) });
						return;
					}
				}
				throw new HttpError(404, uiMessage("apply.this.endpoint.does.not.exist"));
			} catch (error) {
				respond(res, Number(error?.status) || 500, {
					error: safeError(error),
					...error?.i18n ? { errorI18n: error.i18n } : {}
				});
			}
		}
	}), "agent-arena: HTTP API");
	ctx.effect(() => () => {
		disposed = true;
		for (const runtime of runtimes.values()) runtime.abort.abort(/* @__PURE__ */ new Error("Agent Arena plugin disposed"));
		for (const runtime of roomRuntimes.values()) runtime.abort.abort(/* @__PURE__ */ new Error("Agent Arena plugin disposed"));
	}, "agent-arena: stop active meetings");
}
var src_default = {
	name: "agent-arena",
	inject,
	apply
};
//#endregion
export { apply, arenaChannelKey, src_default as default, inject, installArenaModelSelection, isArenaEmptyResponseFailure, isArenaRateLimitFailure, normalizeArenaCooldownStatuses, normalizeArenaRequestLimit };
