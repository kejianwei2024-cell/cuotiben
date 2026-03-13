# 如何拿到错题本 APK 安装包（拷到手机安装）

我这边**不能直接发给你一个现成的 APK 文件**，必须通过「在你电脑或云端做一次编译」才能生成。下面两种方式任选一种，都能得到 `app-debug.apk`，再拷到手机安装即可。

---

## 方式一：用 GitHub 自动构建（推荐，不用装 Android Studio）

适合：愿意用 GitHub，想**不用在本地装 Android Studio** 就拿到 APK。

### 步骤

1. **注册 GitHub**  
   打开 https://github.com ，注册/登录。

2. **建一个仓库并上传错题本**  
   - 点 **New repository**，名字随便（如 `cuotiben`），**不要**勾选 “Add a README”，创建空仓库。  
   - 在本地：把整个 **「错题本」文件夹里的所有内容**（包括 `.github`、`index.html`、`js`、`css`、`package.json`、`capacitor.config.json` 等）复制到一个新文件夹，然后在该文件夹里打开命令行，执行：
     ```bash
     git init
     git add .
     git commit -m "错题本"
     git branch -M main
     git remote add origin https://github.com/你的用户名/cuotiben.git
     git push -u origin main
     ```
   - 若你已有 Git，也可以直接用 GitHub 桌面版或 VS Code 的 Git 把「错题本」整个目录推到一个新仓库。

3. **等自动构建并下载 APK**  
   - 推送完成后，打开该仓库网页，点顶栏 **Actions**。  
   - 会看到名为 **Build Android APK** 的 workflow，点进去看最新一次运行。  
   - 跑完后（约几分钟），在同一页的 **Artifacts** 里会出现 **错题本-APP**，点它即可下载一个 zip，解压后里面有 **app-debug.apk**。

4. **拷到手机安装**  
   - 把 **app-debug.apk** 用数据线、微信、网盘等方式传到手机。  
   - 在手机上允许「未知来源」安装后，安装即可。

若 Actions 里某一步报错，把**红色报错的那几行**发给我，我可以帮你改 workflow 或步骤。

---

## 方式二：在自己电脑上打 APK（需要 Node + Android Studio）

适合：不想用 GitHub，愿意在本地装软件。

1. 把「错题本」**整个文件夹**复制到**纯英文路径**，例如 `C:\cuotiben`。  
2. 安装 **Node.js**（https://nodejs.org）。  
3. 双击运行错题本里的 **「复制到英文路径并构建.bat」**（或按《做APP-请读我.txt》里步骤在 `C:\cuotiben` 里执行 `npm install`、`npx cap add android`、`npx cap sync`）。  
4. 安装 **Android Studio**，用其打开 `C:\cuotiben\android`，菜单 **Build → Build APK(s)**。  
5. 在 `android\app\build\outputs\apk\debug\` 里找到 **app-debug.apk**，拷到手机安装。

---

**总结**：我无法直接给你一个现成的 APK 文件，只能给你**项目 + 自动/本地构建方式**。用方式一可以从 GitHub Actions 直接下载到 APK，再拷到手机安装；用方式二则在自己电脑上打一次 APK，同样得到可安装的文件。
