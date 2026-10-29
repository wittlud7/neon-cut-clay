# 霓虹片场：Android / TapTap 发布工程

当前版本：0.4.1，定位为可安装的离线单机测试版。正式商店发布与签名安装包生成是不同的验收步骤。

本版将整体视觉替换为黏土软陶风格：奶油白、薄荷绿和珊瑚色，12 件原创哑光软陶道具图集，统一更新首页、棋盘、图鉴、弹窗、Android 图标与商店封面。旧夜景素材不再进入安装包。手机使用预渲染图片，无实时 3D 引擎依赖。

## 已落实的产品范围

60 个独立可解棋盘、六幕短篇故事、旧物图鉴、胶片结尾收集、10 项成就、每日放映（从已解锁关卡中选定当日重映，不冒充新增随机关卡）、三星追分与本地最佳记录。

首页、暂停、设置、音乐/音效/振动/动效独立控制、道具名称辅助辨识、断点续玩、JSON 存档导入导出、损坏存档校验。原生 Android 提供系统返回键、后台暂停、文件选择器和独立图标。离线包不声明网络或存储读取权限。

## Android 构建

执行 `python scripts/bootstrap-android.py` 下载并校验官方工具，再执行 `pwsh -File scripts/build-android.ps1`。工具下载位于项目上层 `.build-tools`，不会修改系统 Java 或 Android 设置。构建使用官方 JDK、Android API 35 和 Build Tools 35，minSdk 26，纯 Java 外壳，无 Gradle/Maven 运行依赖。

包体输出 `output/android/neon-cut-0.4.1.apk`，包名 `com.neoncut.game`，versionCode 401。需要更新安装时保持原签名；下一版递增 versionCode。仅通过签名/manifest 检查不代表通过设备兼容性测试。

`private/neon-release.p12` 和 `private/signing.json` 是本机自动创建的签名资料，只在本机保留，不放入源码包或发布包。应单独安全备份；丢失原签名将影响以后覆盖安装。不要公开这些文件。

## 上线阶段必须核实

1. 在真实 Android 设备检查安装、首次启动、完整关卡、后台返回、系统返回、文件导入导出、卸载恢复和长时间运行。
2. 由实际发行主体完成 TapTap 开发者认证、游戏创建、商店资料与适用资质；本工程不伪造主体、备案、版号或平台审核结果。
3. 按发行地区和发行形式确定测试/预约/正式下载路径，核验该路径的资质要求。不要把小游戏的要求直接套用到 Android APK。
4. 中国大陆 Android APP 核准需核验游戏名称、包名和主体一致性；无版号的测试路径须按官方当前规则处理。
5. 正式公开发布前，托管与实际版本一致的隐私说明，提供实际主体和有效联系方式，检查商店图片、年龄分级和内容说明，再人工提交审核。

官方依据（2026-10-28 检索，最终以后台要求为准）：

- https://developer.taptap.cn/docs/store/release/publish/create-game/
- https://developer.taptap.cn/docs/en/store/release/policy/filing-faq/
- https://developer.taptap.cn/docs/en/store/standardies-operation/

此处列明实际发行步骤，不代表项目已提交、审核通过或正式上线。
