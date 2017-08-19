---
title: ajax如何截取302响应
comments: true
categories: "javascript"
tags: 
    - 'javascript'
    - 'ajax'
    - '302'
---
在ajax请求中，如果服务器端的响应是302 Found，在ajax的回调函数中能够获取这个状态码吗？能够从Response Headers中得到Location的值进行重定向吗？让我们来一起看看实际情况。

##### 使用jQuery的$.ajax()发起ajax请求的JavaScript代码如下：

``` javascript
$.ajax({
url: '/oauth/respond',
type: 'post',
data: data,
complete: function(jqXHR){
    console.log(jqXHR.status);
},
error: function (xhr) {
    console.log(xhr.status);
}
});
```
<!-- more -->

##### 当服务器端返回302 Found的响应时，浏览器中的运行结果如下：
![111](ajax/111.png)

在ajax的complete()与error()回调函数中得到的状态码都是404，而不是302。 
为什么呢？在stackoverflow上找到了答案：

原来，当服务器将302响应发给浏览器时，浏览器并不是直接进行ajax回调处理，而是先执行302重定向——从Response Headers中读取Location信息，然后向Location中的Url发出请求，在收到这个请求的响应后才会进行ajax回调处理。大致流程如下：

ajax -> browser -> server -> 302 -> browser(redirect) -> server -> browser -> ajax callback

而在我们的测试程序中，由于302返回的重定向URL在服务器上没有相应的处理程序，所以在ajax回调函数中得到的是404状态码；如果存在对应的URL，得到的状态码就是200。

所以，如果你想在ajax请求中根据302响应通过location.href进行重定向是不可行的。

#### 如何解决？

#### 【方法一】

继续用ajax，修改服务器端代码，将原来的302响应改为json响应，比如下面的ASP.NET MVC示例代码：

``` javascript
return Json(new { status = 302, location = "/oauth/respond" });

ajax代码稍作修改即可：

$.ajax({
    url: '/oauth/respond',
    type: 'post',
    data: data,
    dataType: 'json',
    success: function (data) {
        if (data.status == 302) {
            location.href = data.location;
        }
    }
}); 
```
#### 【方法二】

不用ajax，改用form。

``` javascript

<form method="post" action="/oauth/respond"></form>

```
