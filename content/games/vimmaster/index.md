+++
title = "VIM Master"
description = "用 Vim 指令完成关卡，把快捷键练成肌肉记忆。"
layout = "embedded-game"
kicker = "Keyboard Training"
game_src = "/games/vendor/vimmaster/"
source_url = "https://github.com/renzorlive/vimmaster"
demo_url = "https://renzorlive.github.io/vimmaster/"
+++

这是一个浏览器里的 Vim 操作训练游戏。移动、删除、搜索、撤销等动作都要靠 Vim 指令完成，比单纯背快捷键更容易形成手感。

### 中文入门教程

Vim 的门槛主要不是英文，而是“模式”。先记住这几件事：

1. 普通模式负责移动和发命令，插入模式负责打字。
2. 按 `i` 进入插入模式，按 `Esc` 回到普通模式。
3. `h j k l` 分别是左、下、上、右，前几关先把移动练顺。
4. `w` 跳到下一个单词，`b` 回到上一个单词，`dd` 删除整行，`u` 撤销。

### 第一局建议

- 不要一开始追求速度，先看关卡目标里要求你按哪个键。
- 如果输入字母后发现不移动了，大概率是进了插入模式，按 `Esc` 回普通模式。
- 把每关当成一个小动作练习，通关之后再追求连贯操作。
