# X-clone Project

基本说明：

我想做一个类似于X/Twitter的论坛网站(英文版)，可以支持基本的发帖、点赞、评论等功能。

## 项目基本要求

创建AGENTS.md文件，其中定义项目的基本要求，包括（1）在修改代码前必须修改代码；（2）项目整体应模块化、易维护；（3）尽量不要有fallback和兼容，尽量保持统一的来源，注重single source of truth；（4）创建docs/文件夹，其中是文档部分，其中docs/architecture.md为本项目的文档架构；（5）创建README.md文件，并填写相应内容；（6）应有测试代码等等要求。

根据以下的功能要求，分成合理的阶段phase进行开发，各个阶段开发的内容可以放在docs/文件夹下，如docs/dev-phase.md中详细规定开发内容和需要达成的验收条件。可以按照功能要求的1,2,3等顺序进行开发顺序编排。后续会有进阶功能要求开发，请先重点满足基本功能要求的开发要求。

本项目如有需要用户自己操作完成的，比如Oauth认证github/Google、vercel部署、pusher、mongodb、CDN服务等，需要在docs/下写清楚用户需要操作的内容，每个步骤需要非常详细，以及需要获取什么token或者projectID等内容，并指明填写在哪些文件，比如.env中，并留好相应的字段如GOOGLE_TOKEN="YOUR TOKEN"。 

## 基本功能要求

1. 注册和登录
   1. 用户可以通过Goolge/Github的OAuth进行注册与登录
   2. 注册时需要输入一个userID(string)， 下次登录时可以使用这个userID登入。你可以限制这个userID的要求，比如长度和字符要求等。如果同一个人用不同的OAuth providers，那么需要注册不同的userID。
   3. 登录后应该给一个session，下次登入时如果session没有expire，则可以直接登录。
2. 项目主菜单
   1. 主菜单可以设计可以参考X的设计，主要是左侧的菜单栏，包括：
      1. Home - 回到X的Home
      2. Profile - 进入个人首页
      3. Post - 发帖
      4. 用户的头像与姓名、UserID，点击后会pop up "logout"的选项
      5. 左上角的X图案请替换成别的logo/icon，请你设计
      6. 每个功能，如Home，Profile前的icon不需要和X一样
      7. Post的按钮应该为明亮底色，其他功能的按钮与背景一致，当mouse hover时会微微highlight
3. X编辑/浏览个人首页功能
   1. 在主菜单点击"Profile"可以编辑修改个人资料，可以修改姓名和头像个人介绍等，userID应该不能修改。
   2. 从上到下应显示如下信息：
      1. 姓名（从Google/Github）注册时获取到的姓名。
      2. Number of posts
      3. 退回到Home的左箭头
      4. 背景图
      5. 点击背景图右下方"Edit Profile"按钮则会跳出界面编辑个人资料
      6. 大头照(Avatar)，中间对齐背景图的底部
      7. 姓名，again（从Google/Github）注册时获取到的姓名。
      8. @注册时的userD (e.g. ric2k1)
      9. Brief description of the user
      10. Posts - 用户posts或者repost的帖文(public to all)
      11. Likes - 用户点赞的帖文(only private to you)
      12. 在帖文中点击userID，则会在中间栏显示该用户的个人资料(READ only)
      13. 和编辑个人档案不同的是：
          1. "Edit Profile"变成"Follow" （尚未follow）or “Following”
          2. Posts显示该用户所有 post/repost的帖文
          3. 无法看到别人点赞的内容，也就是没有"Likes"的选项
4. 发表帖文
   1. 在主菜单选择"Post"按钮，会pop up一个小窗口(modal)，用来发帖
   2. 点击右下Post发表帖文
   3. 点击左上x则放弃发表帖文，会弹出小窗口询问是否放弃编辑
      1. 选择Save，则存成Draft
      2. 选择Discard，则真的放弃，无法undo
   4. 点击右上角的"Drafts"显示之前放弃的草稿列表
   5. 帖文规范如下：
      1. 帖文长度为280字符，超过则无法继续输入（除非在进阶功能中我要求了支持“长帖文”的功能，所以在初期阶段不用考虑这个功能）
      2. 如果帖文中有链接，那么不管链接有多长，均占用23个字符，文字输入应该能自动识别链接并建立hyperlink
      3. #HashTag和@mention不算在字符长度中，且无上限
      4. 长帖文、影音功能为进阶功能，可以在初期阶段不考虑
5. 阅读帖文
   1. 在主菜单点击"Home"则在中间栏显示帖文列表
   2. 将原来X中间栏上方菜单"For you"改成"All",且只需要保留"All"和"Following"即可。其中"All"显示所有帖文，"Following"显示用户follow的人的post和repost的帖文
   3. 帖文的排序都是从新到老
   4. 帖文中如果有@mentionSomeone的链接，那么点击后会进入该mentionSomeone的个人profile
   5. 在"All"和"Following"的下方，以及显示帖文的上方为用户可以inline发表post的地方，一旦点击输入文字框，则展开跟主菜单的"Post"发推文类似的layout。由于是inline发表帖文，所以可以没有x符号或者"Drafts"的功能
   6. 每一篇帖文都应该包含以下的信息：
      1. 作者头像
      2. 发帖时间（几秒以前、几分钟以前、几小时以前、几天前、几月几日、或几年几月几日）
      3. 帖文内容均完整展示（除了长帖文）
      4. 下方显示（从左至右）：评论数、转发数、点赞数，不需要支持quote
      5. 点击评论数、转发数、点赞数可以分别评论、转发、点赞
   7. 删除帖文，如果是自己发帖，则在右上角的"..."打开选项，可以有"Delete"删除帖文的选项，需要注意repost的帖文不能删除
   8. 帖文/评论都是recursive的，也就是说，如果用户点击一篇帖文，那么画面中间栏会route到该帖文，然后改成显示该帖文以及所有的评论。如果点击的是某个评论，则中间栏会route到该评论，然后该评论像是一则帖文显示在最上方，底下则是该评论的评论。继续点击下方的评论又会route进下一级的画面
   9. 当我们点击进入某个帖文或者评论时，最上方会有一个左箭头 + Post，让你可以点击后回到上一级的帖文列表/评论
6. 即时互动：使用Pusher技术来形成互动的及时通知
   1. 点赞和评论会使用Pusher即时更新，比如（自己测试法），使用2个不同的账号分别登录时（i.e.,使用两个不同的userID绑定不同的OAuth providers账号），其中一方点赞了某个帖文，另外一个账号会即时看到这个帖文的点赞数增加了。Note：帖文的即时更新可能会有一些extra UI/UX的考量，例如：不能影响/打断别人目前的阅读，而是主动地显示在帖文的最上面，可参考进阶功能的"New post notice"
7. 其他UI/UX设计
   1. 右边栏可以整个省略
8. 部署要求
   1. 将该app deploy到vercel，并确保可以注册和登录



## 进阶功能要求

进阶功能选择1-2项最容易完成的：

1. 主菜单 ｜ Explore功能 - 请参考X或自己发挥，可能需要配合推荐引擎
2. 主餐单 ｜ Notification功能 - 有多人少repost你的帖文、like你的post或者评论，数字代表有多少新的notifications
3. New post notice - 当你follow的人有post/repost的帖文，则在中间栏的上方显示前3个人的avatars followed by “posted”
4. Hashtag的完整支持 - 在点击帖文中的#hashtag后，会跳转到有该标记的所有帖文列表，一样是从新到旧排列
5. 帖文的多媒体、长帖文支持，多媒体支持请使用Vercel的edge network或者其他CDN服务，确保效能
6. 手机版的合理显示
7. 其他X的features



## 技术栈要求

以下提到的技术必须使用，未提及的请自行使用

1. Nextjs全栈框架
2. NextAuth for OAuth in Next.js
3. PostgreSQL or MongoDB选择一种或者混用
4. RESTful APIs
5. Pusher
6. Vercel for deploymnet
