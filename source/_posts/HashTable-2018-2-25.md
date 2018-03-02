---
title: 再剖析数据结构与算法javascript描述--散列（HashTable）
comments: true
toc: true
date: 2018-02-25 20:00:30
tags:
    - 'javascript'
    - 'ECMAScript 6'
    - 'algorithm'
---

### 散列的介绍

散列使用的数据 结构叫做散列表。在散列表上插入、删除和取用数据都非常快，但是查找操作效率底下。

使用散列表存储数据时，通过一个散列函数将键映射为一个数 字，这个数字的范围是 0 到散列表的长度。当出现两个键映射同一个值的时候，这种现象称为 碰撞(collision)，可以通过定义一个固定的质数，开链法以及线性探测法来解决冲突问题。

<!-- more -->

### 散列类的简单实现

属性/方法 | 描述 
- | :-: 
table(属性) | 定义散列表数据存放
simpleHash(属性) | 创建散列表中数据对应的散列值
showDistro(属性) | 显示散列表中的数据
put(方法) | 将数据存入散列表

完整代码如下：
``` javascript
class HashTable {
  constructor() {
    this.table = new Array(137)
  }

  // 创建散列表中数据对应的散列值
  simpleHash(data) {
    let total = 0;
    for (let i = 0; i < data.length; ++i) {
      total += data.charCodeAt(i)
    }
    console.log("Hash value: " + data + " -> " + total)
    return total % this.table.length
  }

  // 显示散列表中的数据
  showDistro() {
    for (let i = 0; i < this.table.length; ++i) {
      if (this.table[i] != undefined) {
        console.log(i + ": " + this.table[i])
      }
    }
  }

  // 将数据存入散列表
  put(data) {
    let pos = this.simpleHash(data)
    this.table[pos] = data
  }
}

// 测试
let someNames = ["David", "Jennifer", "Donnie", "Raymond", "Cynthia", "Mike", "Clayton", "Danny", "Jonathan"]
let hTable = new HashTable();
for (let i = 0; i < someNames.length; ++i) {
  hTable.put(someNames[i]);
}
hTable.showDistro()

// Hash value: David -> 488
// Hash value: Jennifer -> 817
// Hash value: Donnie -> 605
// Hash value: Raymond -> 730
// Hash value: Cynthia -> 720
// Hash value: Mike -> 390
// Hash value: Clayton -> 730
// Hash value: Danny -> 506
// Hash value: Jonathan -> 819
```

通过以上代码测试，发现通过`simpleHash`生成的值可能会有相同的情况，这个时候就说明发生了碰撞，因此对该方法做一定的修改，通过定义一个固定的质数解决，基本代码如下：
``` javascript
// 避免碰撞的创建散列的方法
  betterHash(string) {
    const H = 37;
    let total = 0;
    for (let i = 0; i < string.length; ++i) {
      total += H * total + string.charCodeAt(i);
    }
    total = total % this.table.length;
    if (total < 0) {
      total += this.table.length - 1;
    }
    return parseInt(total);
  }
```

#### 新增散列表取值方法

片段代码如下：
``` javascript
  get(key) {
    return this.table[this.betterHash(key)];
  }
```

### 碰撞处理

当散列函数对于多个输入产生同样的输出时，就产生了碰撞。

#### 开链法

将原先的散列值存放在一个二维数组中，即使两个键散列后的值相同，依然被保存在同样的位置，只不过它们在第二个数组中的位 置不一样罢了。完整代码如下：
``` javascript
class HashTable {
  constructor() {
    this.table = new Array(137)
  }

  // 创建二维数组
  buildChains() {
    for (let i = 0; i < this.table.length; ++i) {
      this.table[i] = new Array();
    }
  }

  // 显示散列表中的数据
  showDistro() {
    for (let i = 0; i < this.table.length; ++i) {
      if (this.table[i][0] !== undefined) {
        console.log(i + ": " + this.table[i]);
      }
    }
  }
  // 避免碰撞的创建散列的方法
  betterHash(string) {
    const H = 37;
    let total = 0;
    for (let i = 0; i < string.length; ++i) {
      total += H * total + string.charCodeAt(i);
    }
    total = total % this.table.length;
    if (total < 0) {
      total += this.table.length - 1;
    }
    return parseInt(total);
  }

  // 将数据存入散列表
  put(data) {
    let index = 0
    let pos = this.betterHash(data);
    if (this.table[pos][index] === undefined) {
      this.table[pos][index] = data;
    } else {
      while (this.table[pos][index] !== undefined) {
        ++index;
      }
      this.table[pos][index] = data;
    }
  }

  get(key) {
    let index = 0
    let pos = this.betterHash(key);
    if (this.table[pos][index] === key) {
      return {
        elm: this.table[pos][index],
        key: pos
      };
    } else {
      while (this.table[pos][index] !== key) {
        index += 1;
      }
      return {
        elm: this.table[pos][index],
        key: pos
      };
    }
    return undefined;
  }

}

// 测试
let hTable = new HashTable();
hTable.buildChains();
let someNames = ["David", "Jennifer", "Donnie", "Raymond",
  "Cynthia", "Mike", "Clayton", "Danny", "Jonathan"
];
for (let i = 0; i < someNames.length; ++i) {
  hTable.put(someNames[i]);
}
hTable.showDistro();
// 12: Jennifer
// 22: Raymond
// 55: Donnie
// 58: Clayton
// 80: David,Jonathan
// 82: Mike
// 103: Cynthia
// 110: Danny

hTable.get('David')

// {elm: "David", key: 80}
```

#### 线性探测法

当发生碰撞时，线性探测法检查散列表中的下一个位置是否为空。如果为空， 就将数据存入该位置;如果不为空，则继续检查下一个位置，直到找到一个空的位置为 止。该技术是基于这样一个事实:每个散列表都会有很多空的单元格，可以使用它们来存 储数据。

> 如果数组的大小是待存储数据个数的 1.5 倍， 那么使用开链法;如果数组的大小是待存储数据的两倍及两倍以上时，那么使用线性探 测法。

根据`开链法`只需要对`put`和`get`做一下更改即可，修改之后的完整代码如下：
``` javascript
class HashTable {
  constructor() {
    this.table = new Array(137)
    this.values = []
  }

  // 显示散列表中的数据
  showDistro() {
    for (let i = 0; i < this.table.length; ++i) {
      if (this.table[i] !== undefined) {
        console.log(i + ": " + this.table[i]);
      }
    }
  }
  // 避免碰撞的创建散列的方法
  betterHash(string) {
    const H = 37;
    let total = 0;
    for (let i = 0; i < string.length; ++i) {
      total += H * total + string.charCodeAt(i);
    }
    total = total % this.table.length;
    if (total < 0) {
      total += this.table.length - 1;
    }
    return parseInt(total);
  }

  // 将数据存入散列表
  put(data) {
    let pos = this.betterHash(data);
    if (this.table[pos] === undefined) {
      this.table[pos] = data;
      this.values[pos] = data
    } else {
      while (this.table[pos] !== undefined) {
        pos++
      }
      this.table[pos] = data;
      this.values[pos] = data
    }
  }

  get(key) {
    let hash = -1;
    hash = this.betterHash(key);
    if (hash > -1) {
      for (let i = hash; this.table[hash] !== undefined; i++) {
        if (this.table[hash] == key) {
          return {
            elm: this.values[hash],
            key: hash
          };
        }
      }
    }
    return undefined;
  }

}

// 测试
let hTable = new HashTable();
let someNames = ["David", "Jennifer", "Donnie", "Raymond",
  "Cynthia", "Mike", "Clayton", "Danny", "Jonathan"
];
for (let i = 0; i < someNames.length; ++i) {
  hTable.put(someNames[i]);
}
hTable.showDistro();
// 12: Jennifer
// 22: Raymond
// 55: Donnie
// 58: Clayton
// 80: David,Jonathan
// 82: Mike
// 103: Cynthia
// 110: Danny

hTable.get('David')

// {elm: "David", key: 80}
```
