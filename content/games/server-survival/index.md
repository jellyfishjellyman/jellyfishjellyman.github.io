+++
title = "SERVER: Survival Protocol"
description = "把服务器、负载均衡和流量洪峰做成塔防的云计算学习游戏。"
layout = "embedded-game"
kicker = "Cloud Tower Defense"
game_src = "/games/vendor/server-survival/"
source_url = "https://github.com/pshenok/server-survival"
demo_url = "https://pshenok.github.io/server-survival/"
+++

这是一款把云架构概念游戏化的塔防：你需要部署服务、处理不同类型的请求流量，并在压力上升时调整系统。

### 中文入门教程

先把它当成“网站流量防守”游戏，不要急着理解所有英文按钮。

1. 先看请求颜色和类型，把恶意流量交给防火墙，把静态资源和上传尽量交给存储服务。
2. 流量变大时，优先补负载均衡、缓存和队列，避免后端服务被瞬间打满。
3. 某个服务变红或响应变慢时，不要只加机器，先看是不是请求类型路由错了。
4. 前几局目标不是高分，而是理解“缓存减压、队列削峰、网关限流、数据库分工”。

### 第一局建议

- 开局先暂停观察界面，把服务区和请求入口的位置记住。
- 只追一个目标：让请求走到合适的服务，不要让明显错误的流量进入数据库。
- 输掉也没关系，结束面板通常会告诉你哪里掉分。
