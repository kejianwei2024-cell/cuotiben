# 初二错题本（手机 APP + 网页）

适合初二的**语数外、历史道法、物理**错题管理，支持**AI 错题解析**（DeepSeek / 豆包）、按学科分类、艾宾浩斯复习和统计。可做成 **Android 手机 APP** 安装使用。

## 功能

- **记错题**：学科、章节、题目、错因类型、知识点、错因简述、正确思路、难度
- **错题列表**：按学科、错因筛选，点击可看详情
- **今日复习**：按 1→3→7→15→30 天间隔提醒，点进去可「标记已复习」
- **统计**：各科错题数、错因分布、最近错题
- **🤖 AI 解析**：在错题详情里点「AI 解析」，调用 **DeepSeek** 或 **豆包** 大模型，自动给出知识点、错因分析、正确思路和巩固建议（需在「设置」里填 API Key）
- **数据**：全部保存在本机，不上传

---

## 一、做成手机 APP（Android）

### 1. 安装依赖并生成 Android 工程

在**命令提示符**或 **PowerShell** 里进入错题本文件夹，执行：

```powershell
cd "c:\Users\kjw20\Desktop\新建文件夹\错题本"
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/http --save
npx cap add android
npx cap sync
```

或直接双击运行 **`build-android.bat`**（会依次执行上述命令）。

### 2. 编译 APK

- 安装 [Android Studio](https://developer.android.com/studio)。
- 用 Android Studio 打开错题本里的 **`android`** 文件夹。
- 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**，等编译完成。
- APK 在 `android/app/build/outputs/apk/debug/` 下，传到手机安装即可。

**说明**：APP 内使用「AI 解析」时不会受浏览器跨域限制，推荐在 APP 里填好 API Key 使用。

---

## 二、AI 解析（DeepSeek / 豆包）

1. 在 APP 或网页里打开 **「设置」** 标签。
2. 选择 **AI 解析服务**：**DeepSeek** 或 **豆包**。
3. 填写 **API Key**：
   - **DeepSeek**：打开 [platform.deepseek.com](https://platform.deepseek.com) 注册并创建 API Key。
   - **豆包**：使用豆包开放平台或 [火山引擎](https://www.volcengine.com) 控制台获取 API Key；模型名可填 `doubao-pro-32k`（默认）或 `doubao-lite-32k` 等。
4. 保存后，在任意错题**详情页**点击 **「🤖 AI 解析」**，即可得到该题的解析（知识点、错因、正确思路、巩固建议）。

**注意**：在**手机浏览器**里打开网页版时，部分环境可能因跨域无法直连 API，建议用 **Android APP** 使用 AI 解析。

---

## 三、仅用网页（不装 APP）

### 在手机上用

- 让手机通过**网址**打开本页面（见下文「方式一」或「方式二」），数据会保存在该浏览器里。
- 添加到主屏幕：浏览器菜单 → 「添加到主屏幕」/「安装应用」，即可像 APP 一样打开。

**方式一：电脑起服务，手机同 WiFi 访问**

1. 电脑进入错题本目录，执行：`python -m http.server 8080`
2. 查电脑 IP（如 `ipconfig` 里的 IPv4），手机浏览器打开：`http://电脑IP:8080`

**方式二：部署到网上**

- 把整个 `错题本` 文件夹部署到 **GitHub Pages**、**Vercel** 或 **Netlify**，用生成的 https 地址在手机浏览器打开。

### 在电脑上预览

- 直接双击 **`index.html`** 用浏览器打开即可；或在该目录执行 `python -m http.server 8080` 后访问 `http://localhost:8080`。

---

## 四、数据与复习节奏

- 数据存在浏览器 / APP 的 **localStorage**，不会上传到任何服务器。
- 复习节奏：新题 **1 天**后第一次复习，之后为 **3 → 7 → 15 → 30** 天；「今日复习」里显示到期题目，做完点「标记已复习」即可。

---

## 五、文件说明

| 文件/夹 | 说明 |
|--------|------|
| `index.html` | 主页面 |
| `css/style.css` | 样式 |
| `js/app.js` | 逻辑（含 AI 解析与复习计划） |
| `manifest.json` | PWA / 主屏幕图标用 |
| `capacitor.config.json` | Capacitor APP 配置 |
| `package.json` | 依赖（Capacitor 等） |
| `build-android.bat` | 一键安装依赖并生成 Android 工程 |
