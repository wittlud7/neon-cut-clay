# 原创资源

`midnight.wav`：由 `scripts/make-audio.py` 确定性合成的 24 秒电钢琴与雨声循环。无外部采样、无演员声音、无引用现有歌曲。音符与噪声由代码产生。

`toy/props-atlas.png`：12 件原创软陶道具的透明 3D 渲染图集，使用哑光材质、细微颗粒凹凸、平滑不规则轮廓。建模代码在 `tools/toy-models.js`，浏览器打开 `tools/toy-studio.html` 可重新渲染。Three.js 仅用于制作素材，手机运行时使用 PNG 图集，不加载 Three.js。MIT 许可在 `tools/vendor/THREE-LICENSE.txt`。

图标与指定尺寸的商店封面使用这些原创模型的渲染图组合，脚本为 `scripts/render-materials.js`。未使用电影人物、剧照或现成歌曲。

`art/keyart-wide-v1.png` 是旧版原创港风背景的设计归档，提示词见 `art/PROMPTS.md`，0.4.0 已不在游戏中引用，也不进入 APK。运行资源由 `assets-manifest.json` 明确列出。
