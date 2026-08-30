# ADR-0014: 默认主题跟随系统

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia

## 背景

StudySolo 令牌是日夜双套。产品默认若写死暗色，会在浅色系统上刺眼；写死浅色则反之。

## 面临的选项

A. 默认暗色（旧 tokens `:root`）；B. 默认浅色；C. **默认 `prefers-color-scheme`，设置页可强制 light/dark**。

## 决定

**C**。`localStorage['classolo-theme']` = `system`（缺省）| `light` | `dark`。首屏前内联脚本给 `<html>` 打 `.light` / `.dark`。颜色变量只挂在这两个 class 上。

## 理由

桌面课堂软件应尊重 OS；用户仍可在设置里锁定。

## 放弃了什么

`:root` 即暗色的 StudySolo 默认（令牌值仍沿用，只改挂载方式）。

## 何时重审

若课堂投影场景需要「强制浅色以免投影机偏色」，在设置增加「授课模式」即可，不必改默认。
