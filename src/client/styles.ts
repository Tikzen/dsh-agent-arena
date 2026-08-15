export const ARENA_CSS = String.raw`
.arena-home-launch {
  display: none;
  width: min(780px, calc(100% - 32px));
  margin: 10px auto 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
}
[data-phase="hero"] .arena-home-launch { display: flex; }
.arena-home-launch__inner {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border: 1px solid color-mix(in srgb, #7c68ee 38%, var(--dsw-alias-border-l1, #d8d8df));
  border-radius: 16px;
  background: linear-gradient(115deg, color-mix(in srgb, #7c68ee 12%, transparent), color-mix(in srgb, #19b8a4 8%, transparent));
  color: var(--dsw-alias-label-primary, #1f2028);
  cursor: pointer;
  text-align: left;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.arena-home-launch__inner:hover {
  transform: translateY(-1px);
  border-color: #7c68ee;
  box-shadow: 0 10px 32px rgba(86, 68, 196, .12);
}
.arena-home-launch__icon { font-size: 25px; }
.arena-home-launch__copy { flex: 1; min-width: 0; }
.arena-home-launch__title { display: block; font-weight: 680; font-size: 14px; }
.arena-home-launch__hint { display: block; margin-top: 2px; color: var(--dsw-alias-label-caption, #767680); font-size: 12px; }
.arena-home-launch__arrow { color: #7c68ee; font-size: 18px; }

.arena-fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 80;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 15px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  background: linear-gradient(135deg, #6f5ee8, #4b3bbd);
  color: #fff;
  font: 650 13px/1 system-ui, sans-serif;
  cursor: pointer;
  box-shadow: 0 12px 34px rgba(58, 42, 155, .3);
  transition: transform .18s ease, box-shadow .18s ease;
}
.arena-fab:hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(58, 42, 155, .38); }
.arena-fab__live { width: 7px; height: 7px; border-radius: 99px; background: #75f4bc; box-shadow: 0 0 0 4px rgba(117,244,188,.16); }

.arena-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: auto;
  padding: 0;
  background: var(--dsw-alias-bg-base, #fff);
  animation: arena-fade-in .16s ease-out;
}
.arena-backdrop[data-embedded="true"] {
  position: relative;
  inset: auto;
  z-index: auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
  animation: none;
}
.arena-backdrop[data-embedded="true"] .arena-modal { width: 100%; height: 100%; animation: none; }
/* A conversation view owns the session body. Suppress DSH's normal chat composer only while this view is mounted. */
[class*="_scrollBody"]:has(.arena-backdrop[data-embedded="true"]) { overflow: hidden !important; }
[class*="_scrollBody"]:has(.arena-backdrop[data-embedded="true"]) > [class*="_composerSeat"] { display: none !important; }
[class*="_viewArea"]:has(.arena-backdrop[data-embedded="true"]) { flex: 1 1 auto; width: 100%; height: 100% !important; min-height: 0; overflow: hidden; }
.arena-modal {
  width: 100vw;
  height: 100dvh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #20212a);
  box-shadow: none;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  animation: arena-rise .2s ease-out;
}
.arena-header { position: relative; z-index: 5; background: var(--dsw-alias-bg-base, #fff); box-shadow: 0 5px 24px rgba(0,0,0,.045); }
.arena-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 8px 22px;
  background: linear-gradient(100deg, color-mix(in srgb, #7362e6 11%, transparent), transparent 45%);
}
.arena-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.arena-brand__mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: #6f5ee8; color: white; font-size: 17px; }
.arena-brand__text strong { display: block; font-size: 15px; }
.arena-brand__text span { display: block; margin-top: 2px; color: var(--dsw-alias-label-caption, #777883); font-size: 11px; }
.arena-topbar__spacer { flex: 1; }
.arena-running-badge { padding: 5px 9px; border-radius: 999px; background: rgba(44,201,164,.1); color: #159578; font-size: 10px; font-weight: 650; }
.arena-exit { padding: 7px 11px; border: 1px solid var(--dsw-alias-border-l1, #dedee5); border-radius: 9px; background: transparent; color: inherit; font-size: 11px; cursor: pointer; }
.arena-mode-nav { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; padding: 0 22px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5ea); }
.arena-mode-nav button { min-width: 0; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 9px; padding: 10px 14px; border: 1px solid var(--dsw-alias-border-l1, #dedee5); border-radius: 13px; background: transparent; color: inherit; cursor: pointer; text-align: left; transition: border-color .15s ease, background .15s ease, transform .15s ease; }
.arena-mode-nav button:hover { transform: translateY(-1px); border-color: color-mix(in srgb, #7665e8 55%, var(--dsw-alias-border-l1, #ddd)); }
.arena-mode-nav button.is-active { border-color: #7665e8; background: linear-gradient(135deg, rgba(118,101,232,.13), rgba(44,201,164,.05)); box-shadow: inset 0 0 0 1px rgba(118,101,232,.06); }
.arena-mode-nav button > span { grid-row: 1 / 3; align-self: center; font-size: 21px; }
.arena-mode-nav button strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.arena-mode-nav button small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-recent-strip { display: flex; align-items: center; gap: 6px; min-width: 0; overflow-x: auto; padding: 7px 22px 8px; }
.arena-recent-strip > span { flex: none; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; font-weight: 700; letter-spacing: .08em; }
.arena-recent-strip button { flex: none; max-width: 230px; display: flex; align-items: center; gap: 6px; overflow: hidden; padding: 5px 8px; border: 1px solid transparent; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-border-l1, #ddd) 35%, transparent); color: inherit; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.arena-recent-strip button.is-active { border-color: #7665e8; background: rgba(118,101,232,.09); }
.arena-close, .arena-icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--dsw-alias-border-l1, #e0e0e7);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 90%, #858595);
  color: inherit;
  cursor: pointer;
}
.arena-body { min-height: 0; display: block; }
.arena-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1, #dddde5) 75%, #7564e9);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 88%, #7564e9);
  font-size: 16px;
}
.arena-avatar img { width: 100%; height: 100%; object-fit: cover; }
.arena-avatar--brand { box-sizing: border-box; padding: 5px; background: #fff; color: #111; }
.arena-brand-logo { width: 100%; height: 100%; display: grid; place-items: center; line-height: 0; }
.arena-brand-logo svg { display: block; width: 100%; height: 100%; }
.arena-brand-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
.arena-brand-logo--image { background-position: center; background-repeat: no-repeat; background-size: contain; }
.arena-brand-logo[data-brand="kimi"] { box-sizing: border-box; padding: 3px; border-radius: 5px; background: #050505; color: #fff; }
.arena-avatar--medium { width: 38px; height: 38px; border-radius: 12px; font-size: 20px; }
.arena-avatar--large { width: 68px; height: 68px; border-radius: 20px; font-size: 34px; }
.arena-avatar--message { width: 36px; height: 36px; border-radius: 12px; font-size: 20px; }
.arena-sidebar {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  overflow-y: auto;
  border-right: 1px solid var(--dsw-alias-border-l1, #e5e5ea);
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 95%, #7564e9);
}
.arena-new {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 11px;
  background: #6f5ee8;
  color: #fff;
  font-weight: 650;
  cursor: pointer;
}
.arena-profile-link {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--dsw-alias-border-l1, #dcdce4);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}
.arena-profile-link.is-active { border-color: #7665e8; background: rgba(118,101,232,.09); }
.arena-chat-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.arena-chat-actions button { padding: 8px 5px; border: 1px solid var(--dsw-alias-border-l1, #dcdce4); border-radius: 9px; background: transparent; color: inherit; font-size: 10px; cursor: pointer; }
.arena-chat-actions button:hover { border-color: #7665e8; background: rgba(118,101,232,.07); }
.arena-sidebar__label { margin: 5px 3px 0; color: var(--dsw-alias-label-caption, #777883); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
.arena-meeting-link {
  width: 100%;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.arena-meeting-link:hover { background: color-mix(in srgb, #7665e8 7%, transparent); }
.arena-meeting-link.is-active { border-color: color-mix(in srgb, #7665e8 32%, transparent); background: color-mix(in srgb, #7665e8 11%, transparent); }
.arena-meeting-link strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.arena-meeting-link span { display: flex; align-items: center; gap: 6px; margin-top: 5px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; }
.arena-dot { width: 6px; height: 6px; border-radius: 99px; background: #9a9aa4; }
.arena-dot[data-active="true"] { background: #2cc9a4; box-shadow: 0 0 0 3px rgba(44,201,164,.15); }
.arena-main { position: relative; min-width: 0; min-height: 0; height: 100%; overflow: hidden; }
.arena-global-alert { position: absolute; z-index: 20; top: 10px; left: 50%; transform: translateX(-50%); max-width: min(680px, 90vw); padding: 10px 14px; border: 1px solid rgba(235,80,92,.3); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 88%, #e9505c); color: #dc4c5a; box-shadow: 0 8px 28px rgba(0,0,0,.12); font-size: 11px; }

.arena-setup, .arena-profiles, .arena-chat-create { box-sizing: border-box; height: 100%; min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto; overflow: hidden; padding: 0; }
.arena-page-scroll { min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.arena-setup > .arena-page-scroll, .arena-profiles > .arena-page-scroll { padding: 28px max(22px, calc((100vw - 1180px) / 2)) 32px; }
.arena-chat-create > .arena-page-scroll { padding: 30px max(22px, calc((100vw - 980px) / 2)) 32px; }
.arena-kicker { color: #6f5ee8; font-size: 12px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.arena-setup h2 { margin: 8px 0 6px; font-size: clamp(25px, 3vw, 38px); letter-spacing: -.035em; }
.arena-lead { max-width: 650px; margin: 0 0 24px; color: var(--dsw-alias-label-caption, #72737f); font-size: 14px; line-height: 1.65; }
.arena-field { display: block; margin: 18px 0; }
.arena-field > span, .arena-section-title { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 680; }
.arena-field > span b { margin-left: 4px; color: #dc4c5a; font-size: 9px; font-weight: 700; }
.arena-field > span em { margin-left: 4px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; font-style: normal; font-weight: 600; }
.arena-section-title.has-error { color: #dc4c5a; }
.arena-input, .arena-textarea, .arena-select {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid var(--dsw-alias-border-l1, #dcdce4);
  border-radius: 12px;
  outline: none;
  background: var(--dsw-alias-bg-base, #fff);
  color: inherit;
  font: 13px/1.5 inherit;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.arena-input, .arena-select { height: 39px; padding: 0 11px; }
.arena-textarea { min-height: 96px; padding: 11px 12px; resize: vertical; }
.arena-input:focus, .arena-textarea:focus, .arena-select:focus { border-color: #7665e8; box-shadow: 0 0 0 3px rgba(118,101,232,.12); }
.arena-template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.arena-template {
  padding: 12px;
  border: 1px solid var(--dsw-alias-border-l1, #dcdce4);
  border-radius: 13px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.arena-template.is-active { border-color: #7665e8; background: color-mix(in srgb, #7665e8 9%, transparent); }
.arena-template strong { display: block; font-size: 13px; }
.arena-template span { display: block; margin-top: 4px; color: var(--dsw-alias-label-caption, #777883); font-size: 11px; line-height: 1.45; }
.arena-saved-head { display: flex; align-items: center; gap: 12px; margin-top: 19px; }
.arena-saved-head .arena-section-title { margin: 0; }
.arena-saved-head button { margin-left: auto; border: 0; background: transparent; color: #6f5ee8; font-size: 11px; cursor: pointer; }
.arena-selection-help { margin: 6px 0 10px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; line-height: 1.45; }
.arena-user-pills { display: flex; gap: 8px; overflow-x: auto; padding: 2px 0 5px; }
.arena-user-pill { min-width: 178px; display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--dsw-alias-border-l1, #dcdce4); border-radius: 12px; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-user-pill.is-active { border-color: #7665e8; background: rgba(118,101,232,.08); }
.arena-user-pill > span:nth-child(2) { flex: 1; min-width: 0; }
.arena-user-pill strong, .arena-user-pill small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-user-pill strong { font-size: 11px; }
.arena-user-pill small { margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-user-pill i { color: #6f5ee8; font-style: normal; }
.arena-empty-users { width: 100%; padding: 11px; border: 1px dashed color-mix(in srgb, #7665e8 45%, var(--dsw-alias-border-l1, #ddd)); border-radius: 11px; background: rgba(118,101,232,.04); color: #6f5ee8; font-size: 11px; cursor: pointer; }
.arena-setup-row { display: grid; grid-template-columns: 1fr 118px; gap: 14px; align-items: end; margin-top: 16px; }
.arena-setup-row--single { grid-template-columns: 1fr; }
.arena-selected-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.arena-selected-card { min-width: 0; display: flex; align-items: center; gap: 9px; padding: 10px; border: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-radius: 13px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 96%, #7665e8); }
.arena-selected-card__copy { flex: 1; min-width: 0; }
.arena-selected-card__copy strong, .arena-selected-card__copy small, .arena-selected-card__copy em { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-selected-card__copy strong { font-size: 12px; }
.arena-selected-card__copy small { margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-selected-card__copy em { margin-top: 4px; color: #6f5ee8; font-size: 9px; font-style: normal; }
.arena-selected-card > button { flex: none; width: 26px; height: 26px; border: 0; border-radius: 8px; background: rgba(220,76,90,.08); color: #dc4c5a; font-size: 16px; cursor: pointer; }
.arena-launch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  margin-top: 24px;
  padding: 13px 18px;
  border: 0;
  border-radius: 13px;
  background: linear-gradient(135deg, #7564e9, #5140bd);
  color: #fff;
  font-weight: 720;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(81,64,189,.22);
}
.arena-launch:disabled { opacity: .55; cursor: wait; }
.arena-error { margin: 12px 0 0; padding: 9px 11px; border-radius: 9px; background: rgba(235,80,92,.1); color: #dc4c5a; font-size: 12px; }
.arena-field.has-error .arena-input, .arena-field.has-error .arena-textarea, .arena-field.has-error .arena-select { border-color: #dc4c5a; box-shadow: 0 0 0 3px rgba(220,76,90,.09); }
.arena-field-error { display: block; margin-top: 6px; color: #dc4c5a; font-size: 10px; line-height: 1.35; }
.arena-page-alert { margin: 0 0 16px; padding: 11px 13px; border: 1px solid rgba(220,76,90,.25); border-radius: 11px; background: rgba(220,76,90,.08); color: #dc4c5a; font-size: 11px; line-height: 1.5; }
.arena-page-alert.is-success { border-color: rgba(43,155,128,.25); background: rgba(43,155,128,.09); color: #187c65; }
.arena-action-dock { box-sizing: border-box; z-index: 8; width: 100%; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 360px); align-items: center; gap: 14px; margin: 0; padding: 12px max(22px, calc((100vw - 1180px) / 2)) 14px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); background: var(--dsw-alias-bg-base, #fff); box-shadow: 0 -10px 30px rgba(0,0,0,.05); }
.arena-chat-create > .arena-action-dock { padding-inline: max(22px, calc((100vw - 980px) / 2)); }
.arena-action-dock .arena-launch { margin: 0; }
.arena-action-dock__message { min-height: 16px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; line-height: 1.45; }
.arena-action-dock__message[data-error="true"] { color: #dc4c5a; font-weight: 650; }

.arena-profiles h2 { margin: 8px 0 6px; font-size: 30px; letter-spacing: -.03em; }
.arena-profile-section { margin-top: 18px; padding: 16px; border: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-radius: 16px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 96%, #7564e9); }
.arena-profile-section__title { display: flex; align-items: baseline; gap: 9px; margin-bottom: 13px; }
.arena-profile-section__title strong { font-size: 13px; }
.arena-profile-section__title span { color: var(--dsw-alias-label-caption, #777883); font-size: 10px; }
.arena-human-editor { display: grid; grid-template-columns: minmax(220px, auto) minmax(180px, 1fr) auto; gap: 16px; align-items: end; }
.arena-human-editor .arena-field { margin: 0; }
.arena-admin-editor { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 18px; }
.arena-admin-editor .arena-model-picker { grid-template-columns: 1fr 1fr auto; }
.arena-admin-save { min-height: 39px; white-space: nowrap; }
.arena-avatar-editor { display: flex; align-items: center; align-content: flex-start; gap: 11px; flex-wrap: wrap; }
.arena-avatar-upload { display: inline-block; margin-bottom: 6px; padding: 5px 8px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; color: #6f5ee8; font-size: 10px; cursor: pointer; }
.arena-avatar-upload input { display: none; }
.arena-emoji-input { width: 116px; height: 30px; font-size: 11px; }
.arena-inline-error { display: block; max-width: 130px; margin-top: 4px; color: #dc4c5a; font-size: 9px; }
.arena-crop-backdrop { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; padding: 16px; background: rgba(5,6,10,.74); backdrop-filter: blur(8px); }
.arena-crop-dialog { box-sizing: border-box; width: min(94vw, 430px); max-height: calc(100dvh - 32px); overflow-y: auto; padding: 18px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 18px; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary, #20212a); box-shadow: 0 28px 80px rgba(0,0,0,.38); }
.arena-crop-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 15px; }
.arena-crop-head > div { flex: 1; min-width: 0; }
.arena-crop-head strong, .arena-crop-head span { display: block; }
.arena-crop-head strong { font-size: 16px; }
.arena-crop-head span { margin-top: 4px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; line-height: 1.45; }
.arena-crop-head button { width: 28px; height: 28px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: transparent; color: inherit; cursor: pointer; }
.arena-crop-stage { position: relative; width: 240px; height: 240px; margin: 0 auto; overflow: hidden; touch-action: none; cursor: grab; border: 2px solid #7665e8; border-radius: 14px; background: #0d0e12; box-shadow: 0 0 0 5px rgba(118,101,232,.1); }
.arena-crop-stage:active { cursor: grabbing; }
.arena-crop-stage > img { position: absolute; left: 50%; top: 50%; max-width: none; user-select: none; pointer-events: none; }
.arena-crop-grid { position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
.arena-crop-grid i { position: absolute; background: rgba(255,255,255,.32); }
.arena-crop-grid i:nth-child(1), .arena-crop-grid i:nth-child(2) { top: 0; bottom: 0; width: 1px; }
.arena-crop-grid i:nth-child(1) { left: 33.333%; }
.arena-crop-grid i:nth-child(2) { left: 66.666%; }
.arena-crop-grid i:nth-child(3), .arena-crop-grid i:nth-child(4) { left: 0; right: 0; height: 1px; }
.arena-crop-grid i:nth-child(3) { top: 33.333%; }
.arena-crop-grid i:nth-child(4) { top: 66.666%; }
.arena-crop-drag-hint { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); padding: 5px 9px; border-radius: 999px; background: rgba(5,6,10,.68); color: #fff; font-size: 9px; line-height: 1; white-space: nowrap; pointer-events: none; }
.arena-crop-sliders { display: grid; gap: 9px; margin-top: 16px; }
.arena-crop-sliders label { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: center; gap: 10px; font-size: 10px; font-weight: 650; }
.arena-crop-sliders input { width: 100%; accent-color: #7665e8; }
.arena-crop-actions { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 10px; margin-top: 17px; }
.arena-crop-actions .arena-launch { margin: 0; }
.arena-logo-library { flex-basis: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
.arena-logo-library button { min-width: 0; height: 34px; display: flex; align-items: center; gap: 6px; padding: 4px 7px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: #fff; color: #17181c; cursor: pointer; text-align: left; }
.arena-logo-library button:hover { border-color: #7665e8; box-shadow: 0 0 0 2px rgba(118,101,232,.08); }
.arena-logo-library button .arena-brand-logo { flex: none; width: 21px; height: 21px; }
.arena-logo-library button span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 8px; font-weight: 700; }
.arena-ai-library { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.arena-ai-card { display: flex; align-items: stretch; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 12px; overflow: hidden; }
.arena-ai-card.is-active { border-color: #7665e8; background: rgba(118,101,232,.07); }
.arena-ai-card > button:first-child { min-width: 180px; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-ai-card > button:first-child > span:last-child { min-width: 0; }
.arena-ai-card strong, .arena-ai-card small { display: block; max-width: 126px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-ai-card strong { font-size: 11px; }
.arena-ai-card small { margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-ai-delete { width: 28px; border: 0; border-left: 1px solid var(--dsw-alias-border-l1, #dddde5); background: transparent; color: #dc4c5a; cursor: pointer; }
.arena-ai-add { padding: 8px 12px; border: 1px dashed #7665e8; border-radius: 12px; background: transparent; color: #6f5ee8; font-size: 11px; cursor: pointer; }
.arena-ai-editor { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 18px; padding-top: 14px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-ai-form .arena-field { margin: 0 0 10px; }
.arena-ai-form .arena-textarea { min-height: 74px; }
.arena-ai-form .arena-preset-textarea { min-height: 82px; }
.arena-model-picker { display: grid; grid-template-columns: 1fr 1fr 72px; gap: 8px; align-items: end; }
.arena-color-field > span { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 680; }
.arena-color-field input { box-sizing: border-box; width: 100%; height: 39px; padding: 3px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 10px; background: transparent; }
.arena-profile-message { position: sticky; bottom: 0; margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: #2b9b80; color: white; font-size: 11px; }

.arena-history { box-sizing: border-box; height: 100%; min-height: 0; overflow: hidden; }
.arena-history > .arena-page-scroll { height: 100%; box-sizing: border-box; padding: 28px max(22px, calc((100vw - 1080px) / 2)) 40px; }
.arena-history h2 { margin: 8px 0 6px; font-size: clamp(25px, 3vw, 36px); letter-spacing: -.035em; }
.arena-history-tabs { display: flex; gap: 8px; margin: 20px 0 14px; }
.arena-history-tabs button { display: flex; align-items: center; gap: 8px; padding: 9px 13px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 10px; background: transparent; color: inherit; font-size: 11px; font-weight: 680; cursor: pointer; }
.arena-history-tabs button.is-active { border-color: #7665e8; background: rgba(118,101,232,.09); color: #6755d9; }
.arena-history-tabs i { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 3px; border-radius: 99px; background: color-mix(in srgb, var(--dsw-alias-border-l1, #ddd) 55%, transparent); font-size: 8px; font-style: normal; }
.arena-history-list { display: grid; gap: 9px; }
.arena-history-card { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 14px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 97%, #7665e8); }
.arena-history-avatars { min-width: 44px; display: flex; align-items: center; }
.arena-history-avatars span + span { margin-left: -12px; }
.arena-history-open { min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-history-open strong, .arena-history-open span, .arena-history-open small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-history-open strong { font-size: 12px; }
.arena-history-open span { margin-top: 4px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; }
.arena-history-open small { margin-top: 5px; color: #6f5ee8; font-size: 8px; }
.arena-history-actions { display: flex; gap: 6px; }
.arena-history-actions button { padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: transparent; color: inherit; font-size: 9px; cursor: pointer; }
.arena-history-actions button.is-primary { border-color: color-mix(in srgb, #2cc9a4 55%, var(--dsw-alias-border-l1, #ddd)); color: #159578; }
.arena-history-actions button.is-danger { color: #dc4c5a; }
.arena-history-actions button:disabled { opacity: .42; cursor: not-allowed; }
.arena-history-editor { grid-column: 2 / -1; display: flex; gap: 7px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-history-editor .arena-input { min-width: 0; }
.arena-history-editor .arena-send { padding: 0 14px; }
.arena-history-empty { padding: 40px 18px; border: 1px dashed var(--dsw-alias-border-l1, #dddde5); border-radius: 14px; color: var(--dsw-alias-label-caption, #777883); font-size: 11px; text-align: center; }

.arena-chat-create h2 { margin: 8px 0 6px; font-size: clamp(25px, 3vw, 38px); letter-spacing: -.035em; }
.arena-chat-type-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin: 20px 0; }
.arena-chat-type-tabs button { padding: 12px; border: 1px solid var(--dsw-alias-border-l1, #dcdce4); border-radius: 12px; background: transparent; color: inherit; font-weight: 650; cursor: pointer; }
.arena-chat-type-tabs button.is-active { border-color: #7665e8; background: rgba(118,101,232,.09); color: #6552d9; }
.arena-chat-user-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.arena-chat-user { display: flex; align-items: center; gap: 9px; min-width: 0; padding: 11px; border: 1px solid var(--dsw-alias-border-l1, #dcdce4); border-radius: 13px; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-chat-user.is-active { border-color: #7665e8; background: rgba(118,101,232,.08); }
.arena-chat-user > span:nth-child(2) { flex: 1; min-width: 0; }
.arena-chat-user strong, .arena-chat-user small, .arena-chat-user em { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-chat-user strong { font-size: 12px; }
.arena-chat-user small { margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; }
.arena-chat-user em { margin-top: 4px; color: #6f5ee8; font-size: 9px; font-style: normal; }
.arena-chat-user > i { color: #6f5ee8; font-size: 16px; font-style: normal; }

.arena-chat-layout { height: 100%; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 310px; overflow: hidden; }
.arena-chat { position: relative; min-width: 0; height: 100%; min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.arena-chat-side { min-height: 0; overflow-y: auto; border-left: 1px solid var(--dsw-alias-border-l1, #e1e1e7); background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 97%, #7665e8); }
.arena-chat-side > .arena-role-monitor { padding: 14px; }
.arena-chat-head { display: flex; align-items: center; gap: 11px; padding: 12px 17px; border-bottom: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-chat-head > div:nth-child(2) { flex: 1; min-width: 0; }
.arena-chat-head__actions { display: flex; gap: 6px; }
.arena-chat-head strong, .arena-chat-head span { display: block; }
.arena-chat-head strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.arena-chat-head span { margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-chat-stack { display: flex; align-items: center; padding-left: 7px; }
.arena-chat-stack > span { margin-left: -7px; filter: drop-shadow(0 0 2px var(--dsw-alias-bg-base, #fff)); }
.arena-chat-stack--large { justify-content: center; padding-left: 17px; }
.arena-chat-stack--large > span { margin-left: -17px; }
.arena-chat-scroll { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 20px; background: radial-gradient(circle at 50% 0%, rgba(118,101,232,.07), transparent 32%); }
.arena-chat-welcome { min-height: 220px; display: grid; place-content: center; justify-items: center; gap: 9px; color: var(--dsw-alias-label-caption, #777883); text-align: center; }
.arena-chat-welcome strong { color: var(--dsw-alias-label-primary, #20212a); font-size: 15px; }
.arena-chat-welcome > span:last-child { font-size: 11px; }
.arena-chat-system { align-self: center; max-width: 80%; padding: 5px 9px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-border-l1, #ddd) 50%, transparent); color: var(--dsw-alias-label-caption, #777883); font-size: 9px; text-align: center; }
.arena-chat-typing { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; }
.arena-typing-stack { display: flex; align-items: center; padding-left: 6px; }
.arena-typing-stack .arena-avatar { width: 25px; height: 25px; margin-left: -6px; border: 2px solid var(--dsw-alias-bg-base, #fff); font-size: 11px; }
.arena-chat-compose { padding: 10px 14px 13px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); background: var(--dsw-alias-bg-base, #fff); }
.arena-chat-compose > div:last-child { display: flex; gap: 8px; align-items: stretch; }
.arena-chat-retry { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 7px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-chat-retry .arena-control { flex: none; }
.arena-chat-compose .arena-textarea { min-height: 56px; max-height: 120px; resize: none; }
.arena-chat-compose .arena-send { padding: 0 17px; }
.arena-chat-settings { position: absolute; top: 62px; right: 14px; z-index: 20; box-sizing: border-box; width: min(390px, calc(100% - 28px)); max-height: calc(100% - 76px); overflow-y: auto; padding: 15px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 15px; background: var(--dsw-alias-bg-base, #fff); box-shadow: 0 20px 60px rgba(0,0,0,.2); }
.arena-chat-settings__head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.arena-chat-settings__head > div { flex: 1; }
.arena-chat-settings__head strong, .arena-chat-settings__head span { display: block; }
.arena-chat-settings__head strong { font-size: 14px; }
.arena-chat-settings__head span { margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-chat-settings__head > button { width: 26px; height: 26px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: transparent; color: inherit; cursor: pointer; }
.arena-settings-name { display: flex; gap: 7px; }
.arena-settings-name .arena-input { min-width: 0; }
.arena-chat-settings section { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-chat-settings__section { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
.arena-chat-settings__section strong { font-size: 11px; }
.arena-chat-settings__section span { color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-invite-list { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.arena-invite-list button { min-width: 0; display: flex; align-items: center; gap: 7px; padding: 7px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 10px; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-invite-list button.is-active { border-color: #7665e8; background: rgba(118,101,232,.08); }
.arena-invite-list button > span { flex: 1; min-width: 0; }
.arena-invite-list strong, .arena-invite-list small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-invite-list strong { font-size: 9px; }
.arena-invite-list small { margin-top: 2px; color: var(--dsw-alias-label-caption, #777883); font-size: 7px; }
.arena-invite-list i { color: #6f5ee8; font-style: normal; }
.arena-invite-empty { padding: 16px 10px; border: 1px dashed var(--dsw-alias-border-l1, #dddde5); border-radius: 10px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; text-align: center; }
.arena-invite-submit { margin-top: 10px; padding: 9px 12px; font-size: 10px; }
.arena-mention-bar { display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 0 0 8px; }
.arena-mention-bar > span { flex: none; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-mention-bar button { flex: none; display: flex; align-items: center; gap: 4px; padding: 4px 7px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 999px; background: transparent; color: inherit; font-size: 9px; cursor: pointer; }
.arena-mention-bar button:hover, .arena-mention-bar button.is-admin { border-color: #7665e8; background: rgba(118,101,232,.06); }
.arena-mention-bar button.is-muted { border-style: dashed; opacity: .62; }
.arena-mention-bar .arena-avatar { width: 18px; height: 18px; font-size: 10px; }
.arena-preset-chips { display: flex; gap: 6px; overflow-x: auto; padding: 0 0 8px; }
.arena-preset-chips button { flex: none; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 5px 8px; border: 1px solid color-mix(in srgb, #7665e8 32%, var(--dsw-alias-border-l1, #ddd)); border-radius: 999px; background: rgba(118,101,232,.05); color: #6755d9; font-size: 9px; cursor: pointer; }

.arena-watch { position: relative; height: 100%; min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.arena-watch-head { display: flex; align-items: flex-start; gap: 12px; padding: 17px 20px 13px; border-bottom: 1px solid var(--dsw-alias-border-l1, #e5e5ea); }
.arena-watch-head__title { flex: 1; min-width: 0; }
.arena-watch-head__actions { display: flex; align-items: center; gap: 8px; }
.arena-watch-head h2 { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 17px; }
.arena-meta { display: flex; gap: 9px; margin-top: 6px; color: var(--dsw-alias-label-caption, #777883); font-size: 11px; }
.arena-status { padding: 5px 9px; border-radius: 999px; background: color-mix(in srgb, #2cc9a4 14%, transparent); color: #159578; font-size: 11px; font-weight: 700; }
.arena-status[data-status="failed"], .arena-status[data-status="stopped"] { background: rgba(235,80,92,.1); color: #dc4c5a; }
.arena-collab-layout { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 370px; overflow: hidden; }
.arena-stage { min-height: 0; overflow-y: auto; padding: 18px 20px 30px; scroll-behavior: smooth; background: radial-gradient(circle at 50% 0%, color-mix(in srgb, #7766e9 8%, transparent), transparent 34%); }
.arena-speakers { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 18px; }
.arena-speaker { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 94%, #7a68ea); }
.arena-speaker__name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 650; }
.arena-speaker__state { color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-empty { display: grid; place-items: center; min-height: 260px; color: var(--dsw-alias-label-caption, #777883); text-align: center; }
.arena-empty strong { display: block; margin-bottom: 6px; color: inherit; font-size: 15px; }
.arena-transcript { display: grid; gap: 13px; }
.arena-round-label { display: flex; align-items: center; gap: 10px; margin: 7px 0 0; color: var(--dsw-alias-label-caption, #777883); font-size: 10px; }
.arena-round-label::before, .arena-round-label::after { content: ''; height: 1px; flex: 1; background: var(--dsw-alias-border-l1, #e1e1e7); }
.arena-message-row { display: flex; align-items: flex-start; gap: 9px; }
.arena-message-row[data-kind="user"] { flex-direction: row-reverse; }
.arena-message { max-width: min(82%, 720px); padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-radius: 4px 15px 15px 15px; background: var(--dsw-alias-bg-base, #fff); box-shadow: 0 4px 18px rgba(0,0,0,.035); }
.arena-message[data-kind="user"] { border-radius: 15px 4px 15px 15px; border-color: color-mix(in srgb, #7665e8 42%, transparent); background: color-mix(in srgb, #7665e8 9%, var(--dsw-alias-bg-base, #fff)); }
.arena-message[data-kind="judge"] { max-width: 100%; border-radius: 15px; border-color: color-mix(in srgb, #f4b942 55%, transparent); background: color-mix(in srgb, #f4b942 10%, var(--dsw-alias-bg-base, #fff)); }
.arena-message[data-kind="admin"] { border-color: color-mix(in srgb, #f4b942 48%, var(--dsw-alias-border-l1, #ddd)); background: color-mix(in srgb, #f4b942 9%, var(--dsw-alias-bg-base, #fff)); }
.arena-message__head { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; }
.arena-message__head strong { font-size: 12px; }
.arena-message__head span { color: var(--dsw-alias-label-caption, #777883); font-size: 9px; }
.arena-message__text { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.7; }
.arena-vote { margin-left: auto; padding: 3px 7px; border: 1px solid var(--dsw-alias-border-l1, #dedee5); border-radius: 999px; background: transparent; color: inherit; font-size: 10px; cursor: pointer; }
.arena-vote.is-active { border-color: #7665e8; color: #6552da; background: rgba(118,101,232,.08); }
.arena-verdict { margin: 0 0 15px; padding: 14px; border: 1px solid rgba(244,185,66,.45); border-radius: 15px; background: linear-gradient(120deg, rgba(244,185,66,.13), rgba(118,101,232,.07)); }
.arena-verdict__winner { font-size: 16px; font-weight: 760; }
.arena-verdict p { margin: 7px 0 0; color: var(--dsw-alias-label-caption, #666773); font-size: 12px; line-height: 1.6; }
.arena-verdict__open { display: grid; gap: 4px; margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(244,185,66,.3); font-size: 10px; }
.arena-verdict__open span { color: var(--dsw-alias-label-caption, #666773); }
.arena-vote-panel { min-height: 0; overflow-y: auto; padding: 14px; border-left: 1px solid var(--dsw-alias-border-l1, #e1e1e7); background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 97%, #7665e8); }
.arena-vote-panel section + section { margin-top: 18px; padding-top: 15px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-vote-panel h3 { margin: 0 0 9px; font-size: 12px; }
.arena-vote-panel p { margin: -3px 0 9px; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; line-height: 1.5; }
.arena-workspace-panel { min-height: 0; display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; border-left: 1px solid var(--dsw-alias-border-l1, #e1e1e7); background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 97%, #7665e8); }
.arena-workspace-stage { display: flex; align-items: center; gap: 10px; padding: 12px 13px 9px; }
.arena-workspace-stage > span { flex: 1; min-width: 0; }
.arena-workspace-stage small, .arena-workspace-stage strong { display: block; }
.arena-workspace-stage small { color: var(--dsw-alias-label-caption, #777883); font-size: 8px; }
.arena-workspace-stage strong { margin-top: 2px; font-size: 12px; }
.arena-workspace-stage select, .arena-workspace-form select, .arena-task-card select { min-width: 0; padding: 6px 7px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: var(--dsw-alias-bg-base, #fff); color: inherit; font-size: 9px; }
.arena-workspace-tabs { display: grid; grid-template-columns: repeat(4, 1fr); padding: 0 9px 9px; border-bottom: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-workspace-tabs button { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 7px 3px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--dsw-alias-label-caption, #777883); font-size: 9px; cursor: pointer; }
.arena-workspace-tabs button.is-active { border-bottom-color: #7665e8; color: #6755d9; font-weight: 720; }
.arena-workspace-tabs i { min-width: 15px; padding: 1px 4px; border-radius: 99px; background: color-mix(in srgb, var(--dsw-alias-border-l1, #ddd) 50%, transparent); font-size: 7px; font-style: normal; }
.arena-workspace-scroll { min-height: 0; overflow-y: auto; padding: 12px; }
.arena-workspace-scroll > .arena-role-monitor + .arena-workspace-members { margin-top: 17px; padding-top: 13px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-workspace-members h3, .arena-workspace-section h3 { margin: 0; font-size: 12px; }
.arena-workspace-section__head { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
.arena-workspace-section__head > span { flex: 1; min-width: 0; }
.arena-workspace-section__head p { margin: 3px 0 0; color: var(--dsw-alias-label-caption, #777883); font-size: 8px; line-height: 1.4; }
.arena-workspace-section__head > button, .arena-workspace-form button, .arena-card-actions button, .arena-decision-card__head > button, .arena-option__head button { padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: transparent; color: inherit; font-size: 8px; cursor: pointer; }
.arena-workspace-section__head > button, .arena-workspace-form button.is-primary, .arena-option__head button { border-color: color-mix(in srgb, #7665e8 45%, var(--dsw-alias-border-l1, #ddd)); color: #6755d9; }
.arena-workspace-form { display: grid; gap: 7px; margin-bottom: 10px; padding: 9px; border: 1px solid color-mix(in srgb, #7665e8 35%, var(--dsw-alias-border-l1, #ddd)); border-radius: 10px; background: rgba(118,101,232,.045); }
.arena-workspace-form .arena-input, .arena-workspace-form .arena-textarea { width: 100%; min-height: 0; font-size: 9px; }
.arena-workspace-form .arena-textarea { height: 54px; resize: vertical; }
.arena-workspace-form > div:last-child { display: flex; justify-content: flex-end; gap: 6px; }
.arena-form-row { display: grid !important; grid-template-columns: 86px minmax(0, 1fr); justify-content: stretch !important; }
.arena-task-list, .arena-decision-list, .arena-artifact-list { display: grid; gap: 8px; }
.arena-task-card, .arena-decision-card, .arena-artifact-card { padding: 10px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 97%, #7665e8); }
.arena-task-card[data-status="blocked"], .arena-artifact-card[data-status="rejected"] { border-color: rgba(220,76,90,.5); background: rgba(220,76,90,.035); }
.arena-task-card[data-status="done"], .arena-artifact-card[data-status="accepted"] { border-color: rgba(44,201,164,.45); }
.arena-task-card__head, .arena-decision-card__head, .arena-artifact-card__head, .arena-option__head { display: flex; align-items: flex-start; gap: 8px; }
.arena-task-card__head > strong, .arena-decision-card__head > span, .arena-artifact-card__head > div, .arena-option__head > span { flex: 1; min-width: 0; }
.arena-task-card__head strong, .arena-decision-card__head strong, .arena-artifact-card__head strong, .arena-option__head strong { display: block; overflow-wrap: anywhere; font-size: 10px; }
.arena-task-card__head em { flex: none; padding: 3px 6px; border-radius: 99px; background: rgba(118,101,232,.08); color: #6755d9; font-size: 7px; font-style: normal; }
.arena-task-card > p, .arena-decision-card > p, .arena-artifact-card > p { margin: 7px 0; color: var(--dsw-alias-label-caption, #686974); white-space: pre-wrap; overflow-wrap: anywhere; font-size: 8px; line-height: 1.55; }
.arena-task-card__fields { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
.arena-card-actions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.arena-card-actions button.is-danger { margin-left: auto; color: #dc4c5a; }
.arena-decision-card__head small, .arena-artifact-card__head small, .arena-option__head small { display: block; margin-top: 3px; color: var(--dsw-alias-label-caption, #777883); font-size: 7px; }
.arena-option-list { display: grid; gap: 6px; margin-top: 8px; }
.arena-option { padding: 8px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 9px; }
.arena-option.is-selected { border-color: #7665e8; background: rgba(118,101,232,.06); }
.arena-opinion { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px; margin-top: 7px; padding-top: 7px; border-top: 1px dashed var(--dsw-alias-border-l1, #dddde5); }
.arena-opinion .arena-avatar { width: 22px; height: 22px; font-size: 10px; }
.arena-opinion strong, .arena-opinion p, .arena-opinion small { display: block; margin: 0; font-size: 7px; line-height: 1.45; }
.arena-opinion p, .arena-opinion small { margin-top: 2px; color: var(--dsw-alias-label-caption, #777883); overflow-wrap: anywhere; }
.arena-artifact-card__head > span { font-size: 17px; }
.arena-artifact-card > a, .arena-artifact-card > code { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 7px; padding: 6px 7px; border-radius: 7px; background: rgba(118,101,232,.06); color: #6755d9; font-size: 7px; }
.arena-workspace-empty { padding: 22px 12px; border: 1px dashed var(--dsw-alias-border-l1, #dddde5); border-radius: 10px; color: var(--dsw-alias-label-caption, #777883); font-size: 8px; line-height: 1.6; text-align: center; }
.arena-workspace-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 9px 11px 11px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); }
.arena-workspace-quick button { padding: 6px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 8px; background: transparent; color: inherit; font-size: 8px; cursor: pointer; }
.arena-workspace-quick button { grid-column: 1 / -1; }
.arena-workspace-quick button:first-child { border-color: color-mix(in srgb, #7665e8 45%, var(--dsw-alias-border-l1, #ddd)); color: #6755d9; }
.arena-workspace-panel button:disabled, .arena-workspace-panel select:disabled { cursor: not-allowed; opacity: .5; }
.arena-role-monitor__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 9px; }
.arena-role-monitor__head h3 { margin: 0; font-size: 12px; }
.arena-role-monitor__head p { margin: 3px 0 0; color: var(--dsw-alias-label-caption, #777883); font-size: 8px; line-height: 1.4; }
.arena-role-monitor__head > span { flex: none; padding: 4px 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-border-l1, #ddd) 45%, transparent); color: var(--dsw-alias-label-caption, #777883); font-size: 8px; font-weight: 700; }
.arena-role-monitor__head > span[data-active="true"] { background: rgba(44,201,164,.13); color: #159b7f; }
.arena-role-monitor__list { display: grid; gap: 7px; margin-top: 10px; }
.arena-role-activity { overflow: hidden; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 96%, #7665e8); }
.arena-role-activity[data-status="error"] { border-color: rgba(220,76,90,.45); }
.arena-role-activity[data-status="waiting"] { border-color: rgba(244,185,66,.55); }
.arena-role-activity__toggle { width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: 7px; padding: 8px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-role-activity__toggle > span { min-width: 0; }
.arena-role-activity__toggle strong, .arena-role-activity__toggle small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-role-activity__toggle strong { font-size: 10px; }
.arena-role-activity__toggle small { margin-top: 2px; color: var(--dsw-alias-label-caption, #777883); font-size: 8px; }
.arena-role-activity__toggle > em { color: var(--dsw-alias-label-caption, #777883); font-size: 14px; font-style: normal; }
.arena-role-activity__status { display: inline-flex; align-items: center; gap: 4px; color: var(--dsw-alias-label-caption, #777883); font-size: 7px; font-style: normal; white-space: nowrap; }
.arena-role-activity__status b { width: 6px; height: 6px; border-radius: 99px; background: #9a9aa4; }
.arena-role-activity[data-status="acknowledging"] .arena-role-activity__status b,
.arena-role-activity[data-status="thinking"] .arena-role-activity__status b,
.arena-role-activity[data-status="working"] .arena-role-activity__status b,
.arena-role-activity[data-status="tool"] .arena-role-activity__status b,
.arena-role-activity[data-status="editing"] .arena-role-activity__status b,
.arena-role-activity[data-status="testing"] .arena-role-activity__status b,
.arena-role-activity[data-status="researching"] .arena-role-activity__status b,
.arena-role-activity[data-status="delegating"] .arena-role-activity__status b { background: #2cc9a4; box-shadow: 0 0 0 3px rgba(44,201,164,.13); animation: arena-pulse 1.1s infinite alternate; }
.arena-role-activity[data-status="waiting"] .arena-role-activity__status b { background: #f4b942; }
.arena-role-activity[data-status="error"] .arena-role-activity__status b { background: #dc4c5a; }
.arena-role-activity__body { padding: 0 9px 9px 46px; }
.arena-role-activity__body > p { margin: 0 0 7px; color: var(--dsw-alias-label-primary, #30313a); font-size: 9px; line-height: 1.5; overflow-wrap: anywhere; }
.arena-role-activity__body > p.is-muted { color: var(--dsw-alias-label-caption, #777883); }
.arena-role-tool, .arena-role-files, .arena-role-events { display: grid; gap: 4px; margin-top: 7px; }
.arena-role-tool > span, .arena-role-files > span, .arena-role-events > span { color: var(--dsw-alias-label-caption, #777883); font-size: 7px; font-weight: 700; letter-spacing: .06em; }
.arena-role-tool code, .arena-role-files code { overflow: hidden; padding: 4px 5px; border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-border-l1, #ddd) 45%, transparent); color: inherit; font: 8px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
.arena-role-events > div { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: 5px; }
.arena-role-events > div > i { width: 5px; height: 5px; margin-top: 4px; border-radius: 99px; background: #7665e8; }
.arena-role-events > div[data-kind="success"] > i { background: #2cc9a4; }
.arena-role-events > div[data-kind="error"] > i, .arena-role-events > div[data-kind="warning"] > i { background: #dc4c5a; }
.arena-role-events p { margin: 0; overflow-wrap: anywhere; font-size: 8px; line-height: 1.4; }
.arena-role-events time, .arena-role-updated { color: var(--dsw-alias-label-caption, #777883); font-size: 7px; white-space: nowrap; }
.arena-role-updated { margin-top: 8px; text-align: right; }
.arena-role-monitor__empty, .arena-role-monitor__note { color: var(--dsw-alias-label-caption, #777883); font-size: 8px; line-height: 1.5; }
.arena-role-monitor__empty { padding: 12px; border: 1px dashed var(--dsw-alias-border-l1, #dddde5); border-radius: 9px; text-align: center; }
.arena-role-monitor__note { margin-top: 9px; padding: 7px 8px; border-radius: 8px; background: rgba(118,101,232,.06); }
.arena-member { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 5px 0; }
.arena-member > span { min-width: 0; }
.arena-member strong, .arena-member small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arena-member strong { font-size: 10px; }
.arena-member small { margin-top: 2px; color: var(--dsw-alias-label-caption, #777883); font-size: 8px; }
.arena-member[data-muted="true"] { opacity: .62; }
.arena-vote-list { display: grid; gap: 6px; }
.arena-vote-list button { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 7px; padding: 7px; border: 1px solid var(--dsw-alias-border-l1, #dddde5); border-radius: 10px; background: transparent; color: inherit; cursor: pointer; text-align: left; }
.arena-vote-list button span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; font-weight: 650; }
.arena-vote-list button i { color: #6f5ee8; font-size: 8px; font-style: normal; }
.arena-vote-list button.is-active { border-color: #7665e8; background: rgba(118,101,232,.09); }
.arena-admin-commands { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.arena-admin-commands button { padding: 7px; border: 1px solid color-mix(in srgb, #f4b942 48%, var(--dsw-alias-border-l1, #ddd)); border-radius: 9px; background: rgba(244,185,66,.07); color: inherit; font-size: 9px; cursor: pointer; }
.arena-controls { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--dsw-alias-border-l1, #e5e5ea); background: var(--dsw-alias-bg-base, #fff); }
.arena-control { padding: 8px 11px; border: 1px solid var(--dsw-alias-border-l1, #dcdce4); border-radius: 9px; background: transparent; color: inherit; font-size: 11px; cursor: pointer; }
.arena-control:hover { border-color: #7665e8; }
.arena-control--primary { border-color: #7665e8; background: rgba(118,101,232,.09); color: #6755d9; font-weight: 700; }
.arena-control--danger { color: #dc4c5a; }
.arena-intervene { display: flex; gap: 7px; flex: 1; min-width: 0; }
.arena-intervene .arena-input { min-width: 0; }
.arena-intervene--chat { display: grid; gap: 0; }
.arena-intervene--chat > div:last-child { display: flex; align-items: stretch; gap: 7px; min-width: 0; }
.arena-intervene--chat .arena-textarea { min-width: 0; min-height: 54px; max-height: 130px; resize: none; }
.arena-send { flex: none; padding: 0 12px; border: 0; border-radius: 9px; background: #6f5ee8; color: white; cursor: pointer; }
.arena-working { display: inline-flex; gap: 3px; align-items: center; }
.arena-working i { width: 4px; height: 4px; border-radius: 99px; background: currentColor; animation: arena-bounce .9s infinite alternate; }
.arena-working i:nth-child(2) { animation-delay: .2s; }
.arena-working i:nth-child(3) { animation-delay: .4s; }
@keyframes arena-bounce { to { transform: translateY(-4px); opacity: .45; } }
@keyframes arena-pulse { to { opacity: .45; transform: scale(.78); } }
@keyframes arena-fade-in { from { opacity: 0; } }
@keyframes arena-rise { from { transform: translateY(10px) scale(.99); opacity: .8; } }

@media (max-width: 760px) {
  .arena-backdrop { padding: 0; }
  .arena-modal { width: 100vw; height: 100dvh; border: 0; border-radius: 0; }
  .arena-body { grid-template-columns: 1fr; }
  .arena-sidebar { display: none; }
  .arena-topbar { padding: 7px 12px; }
  .arena-brand__text span, .arena-running-badge { display: none; }
  .arena-mode-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 0 12px 8px; }
  .arena-mode-nav button { padding: 8px 10px; }
  .arena-mode-nav button small { display: none; }
  .arena-recent-strip { padding: 6px 12px; }
  .arena-setup > .arena-page-scroll, .arena-profiles > .arena-page-scroll, .arena-chat-create > .arena-page-scroll { padding: 22px 16px 28px; }
  .arena-history > .arena-page-scroll { padding: 22px 16px 28px; }
  .arena-action-dock, .arena-chat-create > .arena-action-dock { grid-template-columns: 1fr; gap: 8px; padding: 10px 16px 14px; }
  .arena-template-grid { grid-template-columns: 1fr; }
  .arena-chat-user-grid { grid-template-columns: 1fr; }
  .arena-chat-head__actions .arena-control--danger { display: none; }
  .arena-chat-settings { top: 58px; right: 8px; width: calc(100% - 16px); max-height: calc(100% - 68px); }
  .arena-invite-list { grid-template-columns: 1fr; }
  .arena-setup-row { grid-template-columns: 1fr; }
  .arena-selected-grid { grid-template-columns: 1fr; }
  .arena-human-editor, .arena-ai-editor, .arena-admin-editor { grid-template-columns: 1fr; }
  .arena-model-picker { grid-template-columns: 1fr; }
  .arena-crop-dialog { padding: 14px; }
  .arena-fab { right: 14px; bottom: 14px; }
  .arena-fab__label { display: none; }
  .arena-message { max-width: 94%; }
  .arena-history-card { grid-template-columns: auto minmax(0, 1fr); }
  .arena-history-actions { grid-column: 1 / -1; justify-content: flex-end; }
  .arena-history-editor { grid-column: 1 / -1; }
  .arena-chat-layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) minmax(150px, 32%); overflow-y: hidden; }
  .arena-chat-side { border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-left: 0; }
  .arena-collab-layout { grid-template-columns: minmax(0, 1fr); overflow-y: auto; }
  .arena-collab-layout .arena-stage { overflow: visible; }
  .arena-vote-panel { max-height: 210px; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-left: 0; }
  .arena-workspace-panel { min-height: 270px; max-height: 42vh; border-top: 1px solid var(--dsw-alias-border-l1, #e1e1e7); border-left: 0; }
  .arena-controls { flex-wrap: wrap; }
  .arena-intervene { order: -1; flex-basis: 100%; }
}
@media (max-height: 520px) {
  .arena-backdrop[data-embedded="true"] .arena-topbar,
  .arena-backdrop[data-embedded="true"] .arena-recent-strip { display: none; }
  .arena-backdrop[data-embedded="true"] .arena-mode-nav { gap: 6px; padding: 5px 12px; }
  .arena-backdrop[data-embedded="true"] .arena-mode-nav button { grid-template-rows: auto; padding: 6px 9px; border-radius: 10px; }
  .arena-backdrop[data-embedded="true"] .arena-mode-nav button > span { grid-row: 1; font-size: 16px; }
  .arena-backdrop[data-embedded="true"] .arena-mode-nav button small { display: none; }
  .arena-backdrop[data-embedded="true"] .arena-watch-head { padding: 7px 14px 6px; }
  .arena-backdrop[data-embedded="true"] .arena-watch-head h2 { font-size: 14px; }
  .arena-backdrop[data-embedded="true"] .arena-meta { margin-top: 3px; font-size: 9px; }
  .arena-backdrop[data-embedded="true"] .arena-stage { padding: 9px 14px 14px; }
  .arena-backdrop[data-embedded="true"] .arena-controls { padding: 6px 10px; }
  .arena-backdrop[data-embedded="true"] .arena-intervene--chat .arena-textarea { min-height: 38px; max-height: 58px; }
  .arena-backdrop[data-embedded="true"] .arena-mention-bar { padding-bottom: 4px; }
  .arena-backdrop[data-embedded="true"] .arena-control { padding: 6px 8px; font-size: 9px; }
}
`
