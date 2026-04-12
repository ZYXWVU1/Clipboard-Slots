import type { SupportedLocale } from "./types";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "zh-CN"];
export const DEFAULT_LOCALE: SupportedLocale = "en";

export type TranslationKey =
  | "app.title"
  | "history.badge"
  | "history.title"
  | "history.subtitle"
  | "nav.savedSlots"
  | "nav.settings"
  | "action.clearHistory"
  | "history.section.title"
  | "history.section.note"
  | "summary.savedItems"
  | "summary.pinned"
  | "summary.latestSlot"
  | "common.none"
  | "history.empty"
  | "history.live"
  | "history.pinned"
  | "history.unpinned"
  | "history.copyAgain"
  | "history.edit"
  | "history.saveEdit"
  | "history.cancelEdit"
  | "history.editLabel"
  | "history.pin"
  | "history.unpin"
  | "history.delete"
  | "history.slotLabel"
  | "history.charCount"
  | "history.contentType.text"
  | "settings.title"
  | "settings.subtitle"
  | "settings.back"
  | "settings.shortcutMode.title"
  | "settings.shortcutMode.note"
  | "settings.mode.direct.title"
  | "settings.mode.direct.note"
  | "settings.mode.chord.title"
  | "settings.mode.chord.note"
  | "settings.language.label"
  | "settings.language.option.en"
  | "settings.language.option.zh-CN"
  | "settings.chordActivator.label"
  | "settings.chordActivator.placeholder"
  | "settings.chordTimeout.label"
  | "settings.directHotkeys.title"
  | "settings.directHotkeys.note"
  | "settings.behavior.title"
  | "settings.maxHistory.label"
  | "settings.pollInterval.label"
  | "settings.dedupe.title"
  | "settings.dedupe.note"
  | "settings.restore.title"
  | "settings.restore.note"
  | "settings.startOnBoot.title"
  | "settings.startOnBoot.note"
  | "settings.persist.title"
  | "settings.persist.note"
  | "settings.save"
  | "settings.resetShortcuts"
  | "hotkeys.title"
  | "hotkeys.note"
  | "hotkeys.empty"
  | "hotkeys.registered"
  | "hotkeys.registration.slot"
  | "hotkeys.registration.chord"
  | "settings.badge.direct"
  | "settings.badge.chord"
  | "settings.badge.savedSlots"
  | "settings.badge.persistent"
  | "settings.badge.temporary"
  | "settings.badge.restoreOn"
  | "settings.badge.restoreOff"
  | "message.settingsSaved"
  | "message.settingsSaveFailed"
  | "message.shortcutsReset"
  | "message.shortcutsResetFailed"
  | "message.historyCleared"
  | "message.historyClearFailed"
  | "picker.windowTitle"
  | "picker.badge"
  | "picker.title"
  | "picker.subtitle"
  | "picker.slotLabel"
  | "picker.slotPlaceholder"
  | "picker.paste"
  | "picker.cancel"
  | "picker.available"
  | "picker.availableNote"
  | "picker.empty"
  | "picker.ready"
  | "picker.invalidSlot"
  | "picker.pasteSlotButton"
  | "action.itemUnavailable"
  | "action.copiedSlot"
  | "action.updatedSlot"
  | "action.emptyEditedContent"
  | "action.slotEmpty"
  | "action.pasteFailed"
  | "action.pastedSlot"
  | "hotkey.warning.directLimit"
  | "hotkey.warning.chordMode"
  | "hotkey.conflictSlot"
  | "hotkey.registerFailed"
  | "hotkey.invalidSyntax"
  | "tray.openApp"
  | "tray.openSettings"
  | "tray.clearHistory"
  | "tray.quit";

const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  en: {
    "app.title": "CtrlCVTool",
    "history.badge": "Desktop Clipboard Utility",
    "history.title": "CtrlCVTool",
    "history.subtitle":
      "Copy text normally, keep each item in ordered slots, and paste a specific saved slot with global shortcuts or from this window.",
    "nav.savedSlots": "Saved Slots",
    "nav.settings": "Settings",
    "action.clearHistory": "Clear History",
    "history.section.title": "Saved Slots",
    "history.section.note":
      "Slot numbers follow copy order. Slot 1 is the oldest item still retained.",
    "summary.savedItems": "Saved items",
    "summary.pinned": "Pinned",
    "summary.latestSlot": "Latest slot",
    "common.none": "None",
    "history.empty":
      "Nothing has been captured yet. Copy text normally to populate the slot list.",
    "history.live": "Live",
    "history.pinned": "Pinned",
    "history.unpinned": "Unpinned",
    "history.copyAgain": "Copy Again",
    "history.edit": "Edit Text",
    "history.saveEdit": "Save Edit",
    "history.cancelEdit": "Cancel",
    "history.editLabel": "Edit slot text",
    "history.pin": "Pin",
    "history.unpin": "Unpin",
    "history.delete": "Delete",
    "history.slotLabel": "Slot {slot}",
    "history.charCount": "{count} chars",
    "history.contentType.text": "Text",
    "settings.title": "Configure CtrlCVTool",
    "settings.subtitle":
      "Adjust slot shortcuts, history size, startup behavior, and clipboard handling without leaving the main window.",
    "settings.back": "Back To Saved Slots",
    "settings.shortcutMode.title": "Shortcut Mode",
    "settings.shortcutMode.note":
      "Direct mode registers one global shortcut per slot. Chord mode opens a slot picker.",
    "settings.mode.direct.title": "Direct hotkeys",
    "settings.mode.direct.note": "Default: Ctrl+Alt+1 through Ctrl+Alt+9",
    "settings.mode.chord.title": "Chord picker",
    "settings.mode.chord.note":
      "One global shortcut opens the slot picker for any saved slot.",
    "settings.language.label": "Language",
    "settings.language.option.en": "English",
    "settings.language.option.zh-CN": "Chinese (Simplified)",
    "settings.chordActivator.label": "Chord activator",
    "settings.chordActivator.placeholder": "CommandOrControl+Alt+Space",
    "settings.chordTimeout.label": "Chord picker timeout (ms)",
    "settings.directHotkeys.title": "Direct Slot Hotkeys",
    "settings.directHotkeys.note":
      "Direct mode registers the first nine slots. Higher slots stay available in the main window and chord mode.",
    "settings.behavior.title": "Behavior",
    "settings.maxHistory.label": "Max saved items",
    "settings.pollInterval.label": "Clipboard poll interval (ms)",
    "settings.dedupe.title": "Deduplicate consecutive copies",
    "settings.dedupe.note":
      "Skip adding a new slot when the latest saved text already matches.",
    "settings.restore.title": "Restore the user clipboard after paste",
    "settings.restore.note":
      "Temporarily swaps the clipboard, then puts the old value back.",
    "settings.startOnBoot.title": "Launch on system startup",
    "settings.startOnBoot.note":
      "Uses the platform login-item setting when available.",
    "settings.persist.title": "Persist history between restarts",
    "settings.persist.note":
      "Turn this off for temporary, in-memory history only.",
    "settings.save": "Save Settings",
    "settings.resetShortcuts": "Reset Shortcuts",
    "hotkeys.title": "Hotkey Registration",
    "hotkeys.note":
      "Electron reports whether each shortcut could be claimed successfully on the current machine.",
    "hotkeys.empty": "No hotkeys are registered yet.",
    "hotkeys.registered": "Registered successfully.",
    "hotkeys.registration.slot": "Slot {slot}: {accelerator}",
    "hotkeys.registration.chord": "Chord activator: {accelerator}",
    "settings.badge.direct": "Direct hotkeys active",
    "settings.badge.chord": "Chord picker active",
    "settings.badge.savedSlots": "{count} saved slots",
    "settings.badge.persistent": "Persistent history",
    "settings.badge.temporary": "Temporary history",
    "settings.badge.restoreOn": "Clipboard restore on",
    "settings.badge.restoreOff": "Clipboard restore off",
    "message.settingsSaved": "Settings saved.",
    "message.settingsSaveFailed": "Settings could not be saved.",
    "message.shortcutsReset": "Shortcut fields were reset to the defaults.",
    "message.shortcutsResetFailed": "Shortcut reset failed.",
    "message.historyCleared": "Clipboard history cleared.",
    "message.historyClearFailed": "Clipboard history could not be cleared.",
    "picker.windowTitle": "CtrlCVTool Slot Picker",
    "picker.badge": "Chord Mode",
    "picker.title": "Pick a Slot",
    "picker.subtitle":
      "Type a slot number and press Enter, or click an item below to paste it.",
    "picker.slotLabel": "Slot number",
    "picker.slotPlaceholder": "1",
    "picker.paste": "Paste Slot",
    "picker.cancel": "Cancel",
    "picker.available": "Available Slots",
    "picker.availableNote":
      "This list mirrors the current ordered clipboard history.",
    "picker.empty": "No slots are available yet.",
    "picker.ready": "Ready",
    "picker.invalidSlot": "Enter a valid slot number.",
    "picker.pasteSlotButton": "Paste Slot {slot}",
    "action.itemUnavailable": "That clipboard item is no longer available.",
    "action.copiedSlot": "Copied slot {slot} back to the clipboard.",
    "action.updatedSlot": "Updated slot {slot}.",
    "action.emptyEditedContent": "Edited text cannot be empty.",
    "action.slotEmpty": "Slot {slot} is empty right now.",
    "action.pasteFailed":
      "Paste simulation failed. The target app may be blocking synthetic input.",
    "action.pastedSlot": "Pasted slot {slot}.",
    "hotkey.warning.directLimit":
      "Direct mode registers shortcuts for the first {count} slots. Use chord mode or the main window for higher slots.",
    "hotkey.warning.chordMode":
      "Chord mode opens the slot picker, then pastes after you choose a slot.",
    "hotkey.conflictSlot": "Conflicts with slot {slot}.",
    "hotkey.registerFailed": "Electron could not register this shortcut.",
    "hotkey.invalidSyntax": "Invalid accelerator syntax.",
    "tray.openApp": "Open CtrlCVTool",
    "tray.openSettings": "Open Settings",
    "tray.clearHistory": "Clear History",
    "tray.quit": "Quit"
  },
  "zh-CN": {
    "app.title": "CtrlCVTool",
    "history.badge": "桌面剪贴板工具",
    "history.title": "CtrlCVTool",
    "history.subtitle":
      "像平时一样复制文本，应用会按顺序保存到槽位中，你可以通过全局快捷键或当前窗口粘贴指定槽位。",
    "nav.savedSlots": "已保存槽位",
    "nav.settings": "设置",
    "action.clearHistory": "清空历史",
    "history.section.title": "已保存槽位",
    "history.section.note": "槽位编号按照复制顺序排列。槽位 1 是当前仍保留的最早内容。",
    "summary.savedItems": "已保存项目",
    "summary.pinned": "已固定",
    "summary.latestSlot": "最新槽位",
    "common.none": "无",
    "history.empty": "还没有捕获任何内容。请先正常复制文本来填充槽位列表。",
    "history.live": "可用",
    "history.pinned": "已固定",
    "history.unpinned": "未固定",
    "history.copyAgain": "再次复制",
    "history.edit": "编辑文本",
    "history.saveEdit": "保存修改",
    "history.cancelEdit": "取消",
    "history.editLabel": "编辑槽位文本",
    "history.pin": "固定",
    "history.unpin": "取消固定",
    "history.delete": "删除",
    "history.slotLabel": "槽位 {slot}",
    "history.charCount": "{count} 个字符",
    "history.contentType.text": "文本",
    "settings.title": "配置 CtrlCVTool",
    "settings.subtitle":
      "无需离开主窗口即可调整槽位快捷键、历史数量、启动行为和剪贴板处理方式。",
    "settings.back": "返回已保存槽位",
    "settings.shortcutMode.title": "快捷键模式",
    "settings.shortcutMode.note":
      "直接模式会为每个槽位注册一个全局快捷键。和弦模式会打开槽位选择器。",
    "settings.mode.direct.title": "直接快捷键",
    "settings.mode.direct.note": "默认：Ctrl+Alt+1 到 Ctrl+Alt+9",
    "settings.mode.chord.title": "和弦选择器",
    "settings.mode.chord.note": "使用一个全局快捷键打开任意已保存槽位的选择器。",
    "settings.language.label": "语言",
    "settings.language.option.en": "英语",
    "settings.language.option.zh-CN": "简体中文",
    "settings.chordActivator.label": "和弦触发键",
    "settings.chordActivator.placeholder": "CommandOrControl+Alt+Space",
    "settings.chordTimeout.label": "和弦选择器超时（毫秒）",
    "settings.directHotkeys.title": "直接槽位快捷键",
    "settings.directHotkeys.note":
      "直接模式只会为前九个槽位注册快捷键。更多槽位仍可在主窗口和和弦模式中使用。",
    "settings.behavior.title": "行为",
    "settings.maxHistory.label": "最大保存数量",
    "settings.pollInterval.label": "剪贴板轮询间隔（毫秒）",
    "settings.dedupe.title": "跳过连续重复复制",
    "settings.dedupe.note": "如果最新保存的文本与当前内容相同，则不新增槽位。",
    "settings.restore.title": "粘贴后恢复原剪贴板",
    "settings.restore.note": "临时替换剪贴板，粘贴后再恢复原来的内容。",
    "settings.startOnBoot.title": "开机启动",
    "settings.startOnBoot.note": "在支持的平台上使用系统登录项设置。",
    "settings.persist.title": "重启后保留历史",
    "settings.persist.note": "关闭后历史只保存在内存中，重启应用后不会保留。",
    "settings.save": "保存设置",
    "settings.resetShortcuts": "重置快捷键",
    "hotkeys.title": "快捷键注册状态",
    "hotkeys.note": "Electron 会告诉你当前设备上每个快捷键是否注册成功。",
    "hotkeys.empty": "当前还没有已注册的快捷键。",
    "hotkeys.registered": "注册成功。",
    "hotkeys.registration.slot": "槽位 {slot}: {accelerator}",
    "hotkeys.registration.chord": "和弦触发键：{accelerator}",
    "settings.badge.direct": "已启用直接快捷键",
    "settings.badge.chord": "已启用和弦选择器",
    "settings.badge.savedSlots": "已保存 {count} 个槽位",
    "settings.badge.persistent": "持久化历史",
    "settings.badge.temporary": "临时历史",
    "settings.badge.restoreOn": "已开启剪贴板恢复",
    "settings.badge.restoreOff": "已关闭剪贴板恢复",
    "message.settingsSaved": "设置已保存。",
    "message.settingsSaveFailed": "设置保存失败。",
    "message.shortcutsReset": "快捷键字段已重置为默认值。",
    "message.shortcutsResetFailed": "快捷键重置失败。",
    "message.historyCleared": "剪贴板历史已清空。",
    "message.historyClearFailed": "无法清空剪贴板历史。",
    "picker.windowTitle": "CtrlCVTool 槽位选择器",
    "picker.badge": "和弦模式",
    "picker.title": "选择槽位",
    "picker.subtitle": "输入槽位编号后按回车，或者直接点击下面的项目进行粘贴。",
    "picker.slotLabel": "槽位编号",
    "picker.slotPlaceholder": "1",
    "picker.paste": "粘贴槽位",
    "picker.cancel": "取消",
    "picker.available": "可用槽位",
    "picker.availableNote": "这个列表与当前按顺序保存的剪贴板历史一致。",
    "picker.empty": "当前还没有可用槽位。",
    "picker.ready": "可用",
    "picker.invalidSlot": "请输入有效的槽位编号。",
    "picker.pasteSlotButton": "粘贴槽位 {slot}",
    "action.itemUnavailable": "该剪贴板项目已经不可用。",
    "action.copiedSlot": "已将槽位 {slot} 重新复制到剪贴板。",
    "action.updatedSlot": "已更新槽位 {slot}。",
    "action.emptyEditedContent": "编辑后的文本不能为空。",
    "action.slotEmpty": "槽位 {slot} 当前为空。",
    "action.pasteFailed": "模拟粘贴失败，目标应用可能阻止了模拟输入。",
    "action.pastedSlot": "已粘贴槽位 {slot}。",
    "hotkey.warning.directLimit":
      "直接模式只会为前 {count} 个槽位注册快捷键。更多槽位请使用和弦模式或主窗口。",
    "hotkey.warning.chordMode":
      "和弦模式会先打开槽位选择器，然后在你选择后执行粘贴。",
    "hotkey.conflictSlot": "与槽位 {slot} 冲突。",
    "hotkey.registerFailed": "Electron 无法注册这个快捷键。",
    "hotkey.invalidSyntax": "快捷键语法无效。",
    "tray.openApp": "打开 CtrlCVTool",
    "tray.openSettings": "打开设置",
    "tray.clearHistory": "清空历史",
    "tray.quit": "退出"
  }
};

export const isSupportedLocale = (value: unknown): value is SupportedLocale =>
  typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale);

export const t = (
  locale: SupportedLocale,
  key: TranslationKey,
  params: Record<string, string | number> = {}
): string => {
  const dictionary = translations[locale] ?? translations[DEFAULT_LOCALE];
  const template = dictionary[key] ?? translations[DEFAULT_LOCALE][key] ?? key;

  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params[name];
    return value === undefined ? `{${name}}` : String(value);
  });
};
