# 快速开始 {#getting-started}

## 安装 {#installation}

```sh [npm]
npm add imsure
```

## 马上学会 {#got-it}

我们先做一个美丽的梦，假设程序是一个 JSON 结构，只有字段，虽然没有函数，但是有神奇力量，让字段不停变化，让程序始终正确地运行，绝不出错。

我们玩一玩多米诺骨牌，就能掌握如何做到。  
摆 3 个骨牌，然后推倒第一个。

<!-- prettier-ignore-start -->
```ts{7-9,11-13}
const Domino = typedef({
    board1: string,
    board2: string,
    board3: string,
})

ruledef(Domino, 'board2', { board1: true }, (self) => {
    self.board2 = 'push'
})

ruledef(Domino, 'board3', { board2: true }, (self) => {
    self.board3 = 'push'
})

const domino = typeinit(Domino)
domino.board1 = 'push'
```
<!-- prettier-ignore-end -->

恭喜！你已经学会了。

写法就这么简单，要想更好掌握，你还得了解一点新思想，跳出传统的思维方式。  
打个比方，我们都受孔子的影响，但是孔子并没亲自教我们，而是我们自己接受孔子的影响，因为孔子根本就不知道我们是谁，他也不需要知道啊，你琢磨琢磨对不对。  
回来看上面多米诺的例子，你也应该这么想：不是第一个骨牌推倒的第二个，而是第二个观察到第一个倒了之后，自己主动倒的，第三个也是如此。这样，每个只做好自己就行，根本不用关心会影响到谁，那是他们自己的事。

理解了上述之后，是不是豁然开朗了。觉醒吧，朋友！
