# NoteFlow 登录配置：Google + 邮箱验证码

NoteFlow 使用 Supabase Auth 识别用户，但不把产品数据放进 Supabase 数据库：

- Supabase Auth：Google 登录、邮箱验证码、会话与用户 ID
- Cloudflare D1：笔记、目标、Skill State、卡片记忆状态、学习记录
- 浏览器 localStorage：按用户 ID 隔离的离线缓存

## 1. 创建 Supabase 项目

1. 在 Supabase Dashboard 创建一个项目。
2. 打开项目的 API Keys 页面。
3. 复制 Project URL 和 Publishable Key。不要使用 `service_role` 或 Secret Key。
4. 在项目根目录新建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

`.env.local` 已被 Git 忽略，不会提交到仓库。Publishable Key 本来就用于浏览器；Google Client Secret 只填写在 Supabase Dashboard，不放进 NoteFlow。

## 2. 启用邮箱数字验证码

1. 在 Supabase Dashboard 打开 Authentication → Email Templates。
2. 编辑登录用的 Magic Link 模板。
3. 在正文中使用 `{{ .Token }}`，不要只放 `{{ .ConfirmationURL }}`。例如：

```html
<h2>你的 NoteFlow 验证码</h2>
<p style="font-size: 28px; letter-spacing: 6px">{{ .Token }}</p>
<p>如果不是你本人操作，可以忽略这封邮件。</p>
```

NoteFlow 会先调用 `signInWithOtp` 发送邮件，再让用户输入数字并调用 `verifyOtp`。生产使用前建议在 Supabase 中配置自己的 SMTP 发件服务和品牌域名。

## 3. 启用 Google 登录

1. 在 Google Auth Platform 创建 OAuth Client，应用类型选择 Web application。
2. Authorized JavaScript origins 添加：
   - `http://localhost:3001`
   - 将来正式部署的 NoteFlow 域名
3. Authorized redirect URIs 添加 Supabase Google Provider 页面显示的 callback URL，格式通常是：
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. 回到 Supabase Dashboard → Authentication → Providers → Google。
5. 启用 Google，并填入 Google Client ID 和 Client Secret。

Google Client Secret 只保存在 Supabase，不进入本仓库，也不进入浏览器。

## 4. 配置允许返回的地址

在 Supabase Dashboard → Authentication → URL Configuration：

- Site URL：本地测试时可设为 `http://localhost:3001`
- Redirect URLs 添加：
  - `http://localhost:3001/**`
  - 正式部署域名对应的 `https://.../**`

## 5. 本地验证

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3001`。可以分别检查：

- Google 登录后进入私人空间
- 邮箱收到数字验证码，输入后进入私人空间
- 退出后回到登录页
- 两个不同账号看不到彼此的笔记和学习记录

## 6. 正式部署

在部署环境中添加与 `.env.local` 同名的两个环境变量。部署后，把正式域名补到 Google Authorized JavaScript origins 和 Supabase Redirect URLs，再完成一次 Google 与邮箱验证码的真实登录测试。
