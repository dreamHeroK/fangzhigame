/*Created by Administrator on 2016/1/7.*/
/* Update by ligen at 2016/2/26.*/
/*====================================================参数说明====================================================*/
/* strLength              返回字符串字节的长度 英文字符为一个字节 汉字为两字节                                    */
/* addHandler             js添加绑定方法 三个参数①绑定事件的对象 ② 事件类型 ③事件处理函数                      */
/* removeHandler          js移除绑定方法                                                                          */
/* getChildren            获取所有子元素节点 返回节点的集合                                                       */
/* getById                通过ID名找元素                                                                          */
/* getByClass             通过类名找元素 返回元素集合  传两个参数 ①要查找的类名 ②obj就是找的标签范围（父级元素）*/
/* removeYinhao           去掉字符串前后的引号                                                                    */
/* getInnerText           封装innerText方法                                                                       */
/* parseXML               将xml字符串转换为xml文档 返回xml文档                                                    */
/* parseHTML              将html字符串转换为html文档 返回html文档                                                 */
/* getxmlnodeText         获取xml文档指定节点的文本 返回文本   只适用xml文档                                      */
/* getxmlnodeattribute    获取xml文档指定节点的属性值  只适用xml文档                                              */
/* is_IE                  判断是不是IE浏览器 是返回true 不是返回false                                             */
/* getXmlHttpRequest      封装ajax请求方法  两个参数①url地址 ②请求成功后的回调函数                              */
/* trimAll                清除字符串前后空格                                                                      */
/* getEvent               获得事件对象                                                                            */
/* getTarget              获取事件目标                                                                            */
/* stopPropagation        阻止事件冒泡                                                                            */
/* stopDefault            阻止浏览器默认行为                                                                      */
/* getCookie              获取cookie                                                                              */
/* setCookie              设置cookies 使用方法：setCookie('username','Darren',30)                                 */
/* getStar                装备等级评星                                                                            */
/* gettab                 选项卡方法                                                                              */
/* showdiv                隐藏显示层方法                                                                          */
/* ylfskill               引灵幡技能方法                                                                          */
/* mouselist              鼠标悬停查看引灵幡技能方法                                                              */
/* mousewwattr            鼠标悬停查看娃娃头像属性方法                                                            */
/* mouseattr              鼠标悬停查看人物头像技能方法                                                            */
/* skilllist              技能选择高亮方法                                                                        */
/* gettabspan             查看宠物技能选项卡方法                                                                  */
/* mousestonename         鼠标悬停查看魂兽石名称方法                                                              */
/* stonenone              宠物魂兽石空槽获取方法                                                                  */
/* stonelvs               宠物天赋技能遍历方法                                                                    */
/* unique                 宠物天赋技等级                                                                          */
/* getColor               获取颜色名称，返回颜色数值                                                              */
/*================================================================================================================*/
(function (window, Array, undefined) {

    //添加删除数组中某一个值的方法
    Array.prototype.removeFromArr = function (val) {
        var index = this.indexOf(val);
        //index不等于-1 说明数组中存在这一项
        if (index > -1) {
            this.splice(index, 1);
        }
    }
    //数组去重
    Array.prototype.unique = function () {
        var res = [];
        var json = {};
        for (var i = 0; i < this.length; i++) {
            if (!json[this[i]]) {
                res.push(this[i]);
                json[this[i]] = 1;
            }
        }
        return res;
    }
    //处理IE低版本浏览器不兼容数组indexOf方法
    if (!Array.indexOf) {
        Array.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        }
    }
    //定义gy对象
    var Common = {};
    window.gy = Common;//向window暴露Common对象
    //返回字符串字节的长度 英文字符为一个字节 汉字为两字节
    Common.strLength = function (str) {
        if (str == null) return 0;
        if (typeof str != "string") {
            str += "";
        }
        //这里是将双字节的字符替换成“01” 然后获取字符串的长度
        return str.replace(/[^x00-xff]/g, "01").length;
    }
    //js事件绑定方法
    //三个参数①绑定事件的对象 ② 事件类型 ③事件处理函数
    Common.addHandler = function (obj, type, handler) {
        if (obj.addEventListener) {  //标准浏览器
            obj.addEventListener(type, handler, false);

        } else if (obj.attachEvent) { //IE低版本浏览器
            obj.attachEvent("on" + type, handler);

        } else { //不支持以上两种的浏览器
            obj["on" + type] = handler;
        }
    }
    //js移除绑定方法
    Common.removeHandler = function (obj, type, handler) {

        if (obj.addEventListener) {  //标准浏览器
            obj.removeEventListener(type, handler, false);

        } else if (obj.attachEvent) { //IE低版本浏览器
            obj.detachEvent("on" + type, handler);

        } else { //不支持以上两种的浏览器
            obj["on" + type] = null;
        }
    }
    //获取所有子元素节点 返回节点的集合
    Common.getChildren = function (oParent) {
        var aResult = []; //存放查找的节点
        var aChild = oParent ? oParent.childNodes : []; //获取所有的节点 包括 元素节点 属性节点 文本节点
        var i = 0;
        var alength = aChild.length;
        for (i; i < alength; i++) {

            if (aChild[i].nodeType === 1) { //节点类型为1的话就是元素节点
                aResult.push(aChild[i]);
            }
        }
        return aResult; //返回元素节点的集合
    }
    //通过ID名找元素
    Common.getById = function (id) {
        return document.getElementById(id);
    }
    //通过类名找元素 返回元素集合
    //传两个参数 ①要查找的类名 ②obj就是找的标签范围（父级元素）;
    Common.getByClass = function (sClass, obj) {
        //如果obj没有参数传进来的话就为假,就返回document;
        var obj = obj || document;
        var arr = [];//设置一个数组来存要查找类名的元素;

        //判断浏览器有没有getElementsByClassName方法
        if (obj.getElementsByClassName) {
            return obj.getElementsByClassName(sClass) //存在就直接调用此方法
        } else {
            var alls = obj.getElementsByTagName("*");//首先找到页面所有的标签;
            for (var i = 0; i < alls.length; i++) {
                if (checkclass(alls[i].className, sClass)) {//回调函数判断类名,因为同一标签可能有多个类名;
                    arr.push(alls[i])//如果是真的,就把这个元素推进数组里面;
                }
            }
            return arr;
        }

        //类名有多个的情况下 判断其中有没有要找的类名
        function checkclass(startclass, endclass) {//判断类名
            var arr = startclass.split(" ");//多个类名用空格分隔成不同元素的数组;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == endclass) {//被分割的数组元素里面如果有一个等于classname就返回真;
                    return true;
                }
            }
            return false;
        }
    }
    //去掉字符串前后的引号
    Common.removeYinhao = function (str) {
        return str.replace(/^\"|\"$/g, "");
    }
    //封装innerText方法
    Common.getInnerText = function (element) {
        return (typeof element.textContent == "string") ? element.textContent : element.innerText;
    }
    //将xml字符串转换为xml文档 返回xml文档
    Common.parseXML = function (data) {
        var xml, tmp;
        try {
            if (window.DOMParser) { // 标准浏览器
                tmp = new DOMParser();
                xml = tmp.parseFromString(data, "text/xml");
            } else { // IE
                xml = new ActiveXObject("Microsoft.XMLDOM");
                xml.async = "false";
                xml.loadXML(data);
            }
        } catch (e) {
            xml = undefined;
        }
        if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
            throw new Error("Invalid XML: " + data);
        }
        return xml;
    }
    //将html字符串转换为html文档 返回html文档
    Common.parseHTML = function (data) {
        var htmlString;
        //创建div
        var oDiv = document.createElement('div');
        //把字符串添加到oDiv里这样就成dom对象了
        oDiv.innerHTML = data;
        //然后获取到添加进去的文档
        htmlString = this.getChildren(oDiv)[0];
        //删除没用的oDiv对象
        oDiv = null;
        delete oDiv;
        //返回转换之后的dom对象
        return htmlString;
    }
    //获取xml文档指定节点的文本 返回文本
    //只适用xml文档
    Common.getxmlnodeText = function (oNode) {
        if (this.is_IE()) {
            var _IE = (function () {
                var v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i');
                while (
                    div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
                    all[0]
                );
                return v > 4 ? v : false;
            }());
            if (_IE) {
                if (_IE != 9) {
                    return this.removeYinhao(oNode.text);  //并且移除前后的引号
                } else {
                    return this.removeYinhao(oNode.textContent);  //并且移除前后的引号
                }
            } else {
                return this.removeYinhao(oNode.textContent);  //并且移除前后的引号
            }


            //if ((navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/6./i) == "6.") ||( navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/7./i) == "7.") ||( navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i) == "8.")) {
            //    return this.removeYinhao(oNode.text);  //并且移除前后的引号
            //} else {
            //    return this.removeYinhao(oNode.textContent);  //并且移除前后的引号
            //}
        } else {
            if (oNode.nodeType == 1)
                return this.removeYinhao(oNode.textContent);
        }
    }
    //获取xml文档指定节点的属性值
    //只适用xml文档
    Common.getxmlnodeattribute = function (oNode, attrName) {
        if (this.is_IE()) {
            return oNode.getAttribute(attrName);
        } else {
            if (oNode.nodeType == 1 || oNode.nodeType == "1")
                return oNode.attributes[attrName].value;
            return "undefined";
        }
    }
    //判断是不是IE浏览器 是返回true 不是返回false
    Common.is_IE = function () {
        if (window.ActiveXObject) { //ActiveXObject对象为IE独有
            return true;
        }
        return false;
    }
    //封装ajax请求方法
    //两个参数①url地址 ②请求成功后的回调函数
    Common.getXmlHttpRequest = function (url, callback) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }
        else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        //注册回调函数
        xmlhttp.onreadystatechange = function () {
            //接收响应数据
            //判断对象状态是否交互完成，如果为4则交互完成
            if (xmlhttp.readyState == 4) {
                //判断对象状态是否交互成功,如果成功则为200
                if (xmlhttp.status == 200) {
                    //接收数据,得到服务器输出的纯文本数据
                    var response = xmlhttp.responseText;
                    //得到的response为字符串
                    //将得到的xmlDoc转换为xml文档
                    if (response == "moreRefresh" || response == "disabledLogin" || response == "moreFreshDisabled") {
                        var xmlDoc = response
                    } else {
                        var xmlDoc = gy.parseXML(response);
                    }
                    //执行回调函数
                    callback(xmlDoc);

                }
            }
        };
        //1.是http请求的方式
        //2.是服务器的地址
        //3.是采用同步还是异步，true为异步
        //xmlhttp.open("GET",url,true);
        //post请求与get请求的区别
        //第一个参数设置成post第二个只写url地址，第三个不变
        xmlhttp.open("GET", url, false);
        //post请求要自己设置请求头
        //xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        //发送数据，开始与服务器进行交互
        //post发送请求
        xmlhttp.send(null);
    }
    //清除字符串前后空格
    Common.trimAll = function (str) {
        return str.replace(/(^\s+)|(\S+$)/g, "");
    }
    //获得事件对象
    Common.getEvent = function (e) {
        return e || window.event;
    }
    //获取事件目标
    Common.getTarget = function (e) {
        return this.getEvent(e).target || this.getEvent(e).srcElement;
    }
    //阻止事件冒泡
    Common.stopPropagation = function (e) {
        if (window.event) {
            return this.getEvent(e).cancelBubble = true;
        } else {
            return arguments.callee.caller.arguments[0].stopPropagation();
        }
    }
    //阻止浏览器默认行为
    Common.stopDefault = function (e) {
        if (window.event) {
            return this.getEvent().returnValue = false;
        } else {
            return arguments.callee.caller.arguments[0].preventDefault();
        }
    }
    //获取cookie
    Common.getCookie = function (c_name) {
        if (document.cookie.length > 0) {　　//先查询cookie是否为空，为空就return ""
            c_start = document.cookie.indexOf(c_name + "=")　　//通过String对象的indexOf()来检查这个cookie是否存在，不存在就为 -1　　
            if (c_start != -1) {
                c_start = c_start + c_name.length + 1　　//最后这个+1其实就是表示"="号啦，这样就获取到了cookie值的开始位置
                c_end = document.cookie.indexOf(";", c_start)　　//其实我刚看见indexOf()第二个参数的时候猛然有点晕，后来想起来表示指定的开始索引的位置...这句是为了得到值的结束位置。因为需要考虑是否是最后一项，所以通过";"号是否存在来判断
                if (c_end == -1) c_end = document.cookie.length
                return unescape(document.cookie.substring(c_start, c_end))　　//通过substring()得到了值。想了解unescape()得先知道escape()是做什么的，都是很重要的基础，想了解的可以搜索下，在文章结尾处也会进行讲解cookie编码细节
            }
        }
        return ""
    }
    //设置cookies
    //使用方法：setCookie('username','Darren',30)
    Common.setCookie = function (c_name, value, expiredays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + expiredays);
        document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";SameSite=Lax;expires=" + exdate.toGMTString());
    }
    //装备等级评星
    Common.getStar = function (isstar) {
        //这里处理物品等级制度！！！！！！
        isstar = parseInt(isstar);
        var star = Math.round(isstar / 2);
        var halfstar = (isstar - 1) % 2;
        var emptystar = 10 - (star + halfstar);
        var stars = "";
        // alert("start" + isstar + "---整星" + star + "---半星" + halfstar + "---空星" + emptystar);
        for (var i = 0; i < star; i++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/7596.png" alt=""/>';
        }
        for (var j = 0; j < halfstar; j++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/7597.png" alt=""/>';
        }
        for (var k = 0; k < emptystar; k++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/7598.png" alt=""/>';
        }
        return stars;
    };
    //装备等级评级月亮星
    Common.getStarMoon = function (moon,star) {
        star = parseInt(star);
        moon = parseInt(moon);
        var fullstar = Math.round(star / 2);
        var halfstar = star == 0?1:(star - 1) % 2;
        var emptystar = 5 - (fullstar + halfstar);
        var fullmoon = parseInt(moon / 2);
        var halfmoon = moon % 2;
        var stars = "";
        for (var i = 0; i < fullmoon; i++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/11390.png" alt=""/>';
        }
        for (var j = 0; j < halfmoon; j++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/11391.png" alt=""/>';
        }
        for (var k = 0; k < fullstar; k++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/11448.png" alt=""/>';
        }
        for (var m = 0; m < halfstar; m++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/11449.png" alt=""/>';
        }
        for (var n = 0; n < emptystar; n++) {
            stars += '<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/11450.png" alt=""/>';
        }
        return stars;
    };
    //获取节点
    Common.tag = function (name, elem) {
        return (elem || document).getElementsByTagName(name);
    }
    //获得相应ID的元素
    Common.id = function (name) {
        return document.getElementById(name);
    }
    //查看角色详情tab
    Common.gettab = function (elemId, tabId, classs) {
        function tag(name, elem) {
            return (elem || document).getElementsByTagName(name);
        }
        function tagclass(oParent, sClass) {
            var oReasult = [];
            var oEle = oParent.getElementsByTagName("*");
            for (i = 0; i < oEle.length; i++) {
                if (oEle[i].className == sClass) {
                    oReasult.push(oEle[i])
                }
            };
            return oReasult;
        }
        //获得相应ID的元素
        function id(name) {
            return document.getElementById(name);
        }
        function first(elem) {
            elem = elem.firstChild;
            return elem && elem.nodeType == 1 ? elem : next(elem);
        }
        function next(elem) {
            do {
                elem = elem.nextSibling;
            } while (
                elem && elem.nodeType != 1
            )
            return elem;
        }
        var elem = tag("li", id(elemId));
        var tabs = tagclass(id(tabId), classs);
        var petattrtab = tag("div", id("cwzizhibg"));
        var listpettabNum = petattrtab.length;
        var petskilltab = tag("div", id("cwskillbg"));
        var listpetskilltabNum = petskilltab.length;
        
        var petnaturetab = tag("div", id("cwnaturebg")); // 宠物天性面板
        var listpetnaturetabNum = petnaturetab.length;

        var wwskilltab = tag("div", id("wwskillbg"));
        var listwwskilltabNum = wwskilltab.length;
        var pettalenttab = tag("div", id("cwtalentbg"));
        var listpettalenttabNum = pettalenttab.length;
        var petstonetab = tag("div", id("cwtstonebg"));
        var listpetstonetabNum = petstonetab.length;
        var listNum = elem.length;
        var tabNum = tabs.length;
        var cwsk = tag("li", id("b8"));
        var cwskNum = cwsk.length;
        var wwsk = tag("li", id("b9"));
        var wwskNum = wwsk.length;
        var wwequiptab = tag("div", id("wwequipbg"));
        var wwcheatstab = tag("div", id("wwcheatsbg"));
        var stonetabs = tag("div", id("cwtstonebg"));
        var stonetabNum = stonetabs.length;
        gy.mousestonename("cwtstonebg", "cwcolimg");//显示人物相性药属性
        if($("#hidclassicOrderType").val()=="公测区" ) {
            $('#yytab').hide();
        }
        for (var i = 0; i < listNum; i++) {
            if (listNum > 1) {//选项卡大于一个时
                tabs[0].style.display = "block";
                tabs[i].style.display = "none";
            }
            elem[0].firstChild.className = "on";
            elem[0].firstChild.click();
            elem[i].onclick = (function (i) {
                return function () {
                    for (var j = 0; j < tabNum; j++) {
                        if (i == j) {
                            
                            tabs[j].style.display = "block";
                            elem[j].firstChild.className = "on";
                            
                            if (listNum <= listpettabNum) {//防止数量过多导致undefined
                                petattrtab[j].style.display = "block";//宠物右侧面板显示
                                petskilltab[j].style.display = "block";//宠物技能面板显示
                                pettalenttab[j].style.display = "block";//宠物天赋技面板显示
                                petstonetab[j].style.display = "block";//宠物魂兽石面板显示
                                petnaturetab[j].style.display = "block"; //宠物天性面板
                            }
                            if (listNum <= listwwskilltabNum) {//防止数量过多导致undefined
                                wwskilltab[j].style.display = "block";//娃娃技能面板显示
                                wwequiptab[j].style.display = "block";//娃娃装备面板显示
                                wwcheatstab[j].style.display = "block";//娃娃装备面板显示
                            }
                            if (document.getElementById("cwtb" + i) && document.getElementById("cwtb" + i).innerHTML != "") {//宠物没有天赋技，取消天赋技按钮高亮
                                document.getElementById("talentbtn").className = "rd4sp talent on"
                                document.getElementById("cwtalentbg").style.display = "none";//隐藏宠物天赋技面板
                                gy.showdiv("talentbgclose", "cwtalentbg");//关闭宠物天赋技面板
                                gy.showdiv("talentbtn", "cwtalentbg", i);//点击控制宠物天赋技面板隐藏显示
                            } else {
                                document.getElementById("talentbtn").className = "rd4sp talent";
                                document.getElementById("cwtalentbg").style.display = "none";//隐藏宠物天赋技面板
                                gy.removeshowdiv("talentbtn", "cwtalentbg", i);//点击控制宠物天赋技面板隐藏
                            }
                            if (document.getElementById("cwstone" + i) && document.getElementById("cwstone" + i).innerHTML != "") {//宠物没有魂兽石，取消魂兽石按钮高亮
                                document.getElementById("stonebtn").className = "rd4sp stone on"
                                gy.showdiv("cwtstoneclose", "cwtstonebg");//关闭宠物魂兽石面板
                                gy.showdiv("stonebtn", "cwtstonebg");//点击控制宠物魂兽石面板隐藏显示
                            } else {
                                document.getElementById("stonebtn").className = "rd4sp stone";
                                document.getElementById("cwtstonebg").style.display = "none";//隐藏宠物天赋技面板
                                gy.removeshowdiv("stonebtn", "cwtalentbg", i);//点击控制宠物魂兽石面板隐藏
                            }

                            if (document.getElementById("cwnature" + i) && document.getElementById("cwnature" + i).innerHTML != "") {//宠物没有天性，取消宠物按钮高亮
                                document.getElementById("naturebtn").className = "rd4sp nature on"
                                gy.showdiv("cwnatureclose", "cwnaturebg");//关闭宠物天性面板
                                gy.showdiv("naturebtn", "cwnaturebg");//点击控制宠物天性面板隐藏显示
                            } else {
                                document.getElementById("naturebtn").className = "rd4sp nature";
                                document.getElementById("cwnaturebg").style.display = "none";//隐藏宠物天赋技面板
                                gy.removeshowdiv("naturebtn", "cwnaturebg", i);//点击控制宠物宠物天赋技面板
                            }
                            // 御灵丹
                            if (document.getElementById("cwyld" + i) && document.getElementById("cwyld" + i).innerHTML != "") {
                                //宠物没有御灵丹，取消御灵丹按钮高亮
                                document.getElementById("yldbtn").className = "rd4sp yld on"
                                gy.showdiv("cwyldclose", "cwyldbg");//关闭御灵丹面板
                                gy.showdiv("yldbtn", "cwyldbg");//点击控制宠物御灵丹面板隐藏显示
                            } else {
                                document.getElementById("yldbtn").className = "rd4sp yld";
                                document.getElementById("cwyldbg").style.display = "none";//隐藏宠物御灵丹面板
                                gy.removeshowdiv("yldbtn", "cwyldbg", i);//点击控制宠物御灵丹面板
                            }

                            if (i != 0 && i < cwskNum && this.parentNode.id == "b8") {
                                document.getElementById("cwskillnav" + i).firstChild.firstChild.click();
                                new ScrollBar('cwd' + i, 'cwc' + i, 'cwa' + i, 'cwb' + i);//宠物技能滚动条
                            }
                            //当点击宠物b8里面的每一项时，重置按钮
                            if (i == 0 &&  this.parentNode.id == "b8") {
                                document.getElementById("cwskillnav" + i).firstChild.firstChild.click();
                            }
                            if (this.className == "othertab") {
                                new ScrollBar('d3', 'c3', 'a3', 'b3');//角色其它技能
                            }
                            if (this.className == "othertabyy") {
                                new ScrollBar('d6', 'c6', 'a6', 'b6');//元婴其它技能滚动条
                            }
                            if (this.className == "" && i < wwskNum && this.parentNode.id == "b9") {
                                new ScrollBar('wwd' + i, 'wwc' + i, 'wwa' + i, 'wwb' + i);//娃娃技能滚动条
                            }
                            //更换标签背景图片roleleftbg(角色、元婴)、petleftbg(宠物)、guardleftbg(守护)、equipleftbg(装备)、dollleftbg(娃娃)
                            $("#hidclassicOrderType").val()
                            switch (elem[j].className) {
                                case "roletab":
                                     if($("#hidclassicOrderType").val()=="点卡区"){
                                        var monthType = document.getElementById("month_card_type").innerHTML;
                                        var monthTime = document.getElementById("month_card_time").innerText;
                                        if(monthType === '1') {
                                            document.getElementById("roleleftbg").className = "roleleftbg roleleftbg_normal";
                                            document.getElementById("card_point").innerText = monthTime;
                                        } else if(monthType === '2') {
                                            document.getElementById("roleleftbg").className = "roleleftbg roleleftbg_super";
                                            document.getElementById("card_point").innerText = monthTime;
                                        } else {
                                            document.getElementById("roleleftbg").className = "roleleftbg roleleftbg_dianka";
                                        }
                                     }else{
                                        document.getElementById("roleleftbg").className = "roleleftbg";
                                     }
                                    document.getElementById("skillcenterbg").style.display = "block";//显示角色技能面板
                                    document.getElementById("yyskillcenterbg").style.visibility = "hidden";//隐藏元婴技能面板
                                    document.getElementById("cwtalentbg").style.display = "none";//隐藏宠物天赋技面板
                                    document.getElementById("danfurnacebg").style.display = "none";//隐藏装备丹炉面板
                                    gy.gettab("skillnav", "skill_con", "tag")//执行角色技能tab
                                    break;
                                case "pettab":
                                    //宠物没有天赋技，取消天赋技按钮高亮
                                    if (document.getElementById("cwtb0") && document.getElementById("cwtb0").innerHTML != "") {
                                        document.getElementById("talentbtn").className = "rd4sp talent on"
                                        gy.showdiv("talentbgclose", "cwtalentbg");//关闭宠物天赋技面板
                                        gy.showdiv("talentbtn", "cwtalentbg", 0);//点击控制宠物天赋技面板隐藏显示
                                    } else {
                                        document.getElementById("talentbtn").className = "rd4sp talent";
                                    }
                                    //宠物没有魂兽石，取消魂兽石按钮高亮
                                    if (document.getElementById("cwstone0") && document.getElementById("cwstone0").innerHTML != "") {
                                        document.getElementById("stonebtn").className = "rd4sp stone on"
                                        gy.showdiv("cwtstoneclose", "cwtstonebg");//关闭宠物魂兽石面板
                                        gy.showdiv("stonebtn", "cwtstonebg", 0);//点击控制宠物魂兽石面板隐藏显示
                                    } else {
                                        document.getElementById("stonebtn").className = "rd4sp stone";
                                    }
                                    //宠物天赋技滚动条绑定
                                    document.getElementById("roleleftbg").className = "petleftbg";
                                    document.getElementById("cwzizhibg").style.display = "block";//显示宠物资质面板
                                    document.getElementById("cwskillbg").style.display = "block";//显示宠物技能面板
                                    document.getElementById("yyskillcenterbg").style.visibility = "hidden";//隐藏元婴技能面板
                                    document.getElementById("skillcenterbg").style.display = "none";//隐藏角色技能面板
                                    document.getElementById("ylfleftbg").style.display = "none";//隐藏角色引灵幡面板
                                    document.getElementById("wudaoleftbg").style.display = "none";//隐藏角色悟道技能面板
                                    document.getElementById("lifeRecordbg").style.display = "none";//隐藏角色浮生录面板
                                    document.getElementById("formationleftbg").style.display = "none";//隐藏角色阵型面板
                                    document.getElementById("danfurnacebg").style.display = "none";//隐藏装备丹炉面板

                                    if (cwskNum > 0) {
                                        document.getElementById("cwskillnav0").firstChild.firstChild.click();
                                        new ScrollBar('d8', 'c8', 'a8', 'b8');//宠物列表滚动条
                                        gy.gettab("b8", "menu_cw", "tag2")//执行宠物tab
                                        new ScrollBar('cwd0', 'cwc0', 'cwa0', 'cwb0');//宠物技能滚动条
                                    }
                                    if (cwskNum == 0) {
                                        document.getElementById("c8").style.display = "none";
                                    }

                                    //宠物技能滚动条绑定
                                    for (var v = 0; v < cwskNum; v++) {
                                        new ScrollBar('cwtd' + v, 'cwtc' + v, 'cwta' + v, 'cwtb' + v);//宠物天赋技能滚动条
                                        new ScrollBar('cwbookd' + v, 'cwbookc' + v, 'cwbooka' + v, 'cwbookb' + v);//宠物天书滚动条
                                        new ScrollBar('cwdwd' + v, 'cwdwc' + v, 'cwdwa' + v, 'cwdwb' + v);//宠物顿悟滚动条
                                    }

                                    //for (var k = 0; k < listpettabNum; k++) {//初始化宠物属性面板
                                    //    if (listpettabNum > 1) {//选项卡大于一个时
                                    //        petattrtab[0].style.display = "block";
                                    //        petattrtab[k].style.display = "none";
                                    //    }
                                    //}
                                    //for (var o = 0; o < listpetskilltabNum; o++) {//初始化宠物属性面板
                                    //    if (listpetskilltabNum > 1) {//选项卡大于一个时
                                    //        petskilltab[0].style.display = "block";
                                    //        petskilltab[o].style.display = "none";
                                    //    }
                                    //}
                                    //for (var b = 0; b < listpettalenttabNum; b++) {//初始化宠物天赋面板
                                    //    if (listpettalenttabNum > 1) {//选项卡大于一个时
                                    //        pettalenttab[0].style.display = "block";
                                    //        pettalenttab[b].style.display = "none";
                                    //    }
                                    //}
                                    //for (var b = 0; b < listpetstonetabNum; b++) {//初始化宠物魂兽石面板
                                    //    if (listpetstonetabNum > 1) {//选项卡大于一个时
                                    //        petstonetab[0].style.display = "block";
                                    //        petstonetab[b].style.display = "none";
                                    //    }
                                    //}
                                    break;
                                case "guardtab":
                                    document.getElementById("roleleftbg").className = "guardleftbg";
                                    document.getElementById("yyskillcenterbg").style.visibility = "hidden";//隐藏元婴技能面板
                                    document.getElementById("skillcenterbg").style.display = "none";//隐藏角色技能面板
                                    document.getElementById("ylfleftbg").style.display = "none";//隐藏角色引灵幡面板
                                    document.getElementById("wudaoleftbg").style.display = "none";//隐藏角色悟道技能面板
                                    document.getElementById("lifeRecordbg").style.display = "none";//隐藏角色浮生录面板
                                    document.getElementById("cwtalentbg").style.display = "none";//隐藏宠物天赋技面板
                                    document.getElementById("formationleftbg").style.display = "none";//隐藏角色阵型面板
                                    document.getElementById("danfurnacebg").style.display = "none";//隐藏装备丹炉面板
                                    new ScrollBar('d7', 'c7', 'a7', 'b7');//守护列表滚动条
                                    gy.gettab("b7", "menu_sh", "tag1")//执行守护tab
                                    break;
                                case "yytab":
                                    document.getElementById("roleleftbg").className = "yyleftbg";
                                    document.getElementById("skillcenterbg").style.display = "none";//隐藏角色技能面板
                                    document.getElementById("ylfleftbg").style.display = "none";//隐藏角色引灵幡面板
                                    document.getElementById("wudaoleftbg").style.display = "none";//隐藏角色悟道技能面板
                                    document.getElementById("lifeRecordbg").style.display = "none";//隐藏角色浮生录面板
                                    document.getElementById("yyskillcenterbg").style.visibility = "visible";//显示元婴技能面板
                                    document.getElementById("cwtalentbg").style.display = "none";//隐藏宠物天赋技面板
                                    document.getElementById("formationleftbg").style.display = "none";//隐藏角色阵型面板
                                    document.getElementById("danfurnacebg").style.display = "none";//隐藏装备丹炉面板
                                    gy.gettab("yyskillnav", "yyskill_con", "tag2")//执行元婴角色技能tab
                                    break;
                                case "equiptab":
                                    if($("#hidclassicOrderType").val()=="经典区" || $("#hidclassicOrderType").val()=="点卡区"){
                                        document.getElementById("roleleftbg").className = "equipleftbg class_equipbg";
                                    } else if($("#hidclassicOrderType").val()=="情怀区") {
                                        document.getElementById("roleleftbg").className = "equipleftbg class_qhuipbg";
                                    }else {
                                        document.getElementById("roleleftbg").className = "equipleftbg";
                                    }
                                    document.getElementById("yyskillcenterbg").style.visibility = "hidden";//隐藏元婴技能面板
                                    document.getElementById("skillcenterbg").style.display = "none";//隐藏角色技能面板
                                    document.getElementById("ylfleftbg").style.display = "none";//隐藏角色引灵幡面板
                                    document.getElementById("wudaoleftbg").style.display = "none";//隐藏角色悟道技能面板
                                    document.getElementById("lifeRecordbg").style.display = "none";//隐藏角色浮生录面板
                                    document.getElementById("cwtalentbg").style.display = "none";//隐藏宠物天赋技面板
                                    document.getElementById("formationleftbg").style.display = "none";//隐藏角色阵型面板
                                    gy.gettab("equipnav", "equip_con", "tag4")//执行装备tab
                                    break;
                                case "dolltab":
                                    document.getElementById("roleleftbg").className = "dollleftbg";
                                    document.getElementById("yyskillcenterbg").style.visibility = "hidden";//隐藏元婴技能面板
                                    document.getElementById("skillcenterbg").style.display = "none";//隐藏角色技能面板
                                    document.getElementById("ylfleftbg").style.display = "none";//隐藏角色引灵幡面板
                                    document.getElementById("wudaoleftbg").style.display = "none";//隐藏角色悟道技能面板
                                    document.getElementById("lifeRecordbg").style.display = "none";//隐藏角色浮生录面板
                                    document.getElementById("formationleftbg").style.display = "none";//隐藏角色阵型面板
                                    document.getElementById("danfurnacebg").style.display = "none";//隐藏装备丹炉面板
                                    if (wwskNum > 0) {
                                        new ScrollBar('d9', 'c9', 'a9', 'b9');//娃娃列表滚动条
                                    }
                                    gy.gettab("b9", "menu_ww", "tag3")//娃娃宠物tab
                                    //娃娃鼠标经过显示绑定
                                    if (wwskNum > 0) {
                                        new ScrollBar('wwd0', 'wwc0', 'wwa0', 'wwb0');//娃娃技能滚动条
                                    }
                                    if (wwskNum == 0) {
                                        document.getElementById("c9").style.display = "none";
                                    }
                                    for (var ww = 0; ww < wwskNum; ww++) {
                                        gy.mousewwattr("wwimgshow" + ww + "", "wwattrs" + ww + "");//显示人物相性药属性
                                        gy.skilllist('wwb' + ww);//娃娃技能选中状态
                                        if (wwskNum > 1) {//选项卡大于一个时
                                            wwequiptab[0].style.display = "block";
                                            wwequiptab[ww].style.display = "none";
                                        }
                                    }
                                    break;
                            }
                        }
                        else {
                            tabs[j].style.display = "none";
                            if (listNum <= listpettabNum) {//防止数量过多导致undefined
                                petattrtab[j].style.display = "none";//宠物右侧面板隐藏
                                petskilltab[j].style.display = "none";//宠物技能面板隐藏
                                pettalenttab[j].style.display = "none";//宠物天赋技面板隐藏
                                petstonetab[j].style.display = "none";//宠物魂兽石面板隐藏
                                petnaturetab[j].style.display = "none";//宠物天性面板隐藏
                            }
                            if (listNum <= listwwskilltabNum) {//防止数量过多导致undefined
                                wwskilltab[j].style.display = "none";//娃娃技能面板隐藏
                                wwequiptab[j].style.display = "none";//娃娃装备面板隐藏
                                wwcheatstab[j].style.display = "none";//娃娃装备面板隐藏
                            }
                            elem[j].firstChild.className = "";
                        }
                    }
                }
            })(i)
        }
    }
    //点击控制隐藏显示层
    Common.showdiv = function (cele, elem, codes) {
        document.getElementById(cele).onclick = function () {
            if (cele == "talentbtn") {//控制宠物天赋技能滚动条
                if (document.getElementById("cwtb" + codes).children.length > 7) {
                    document.getElementById("cwtc" + codes).style.display = "block";
                }
                document.getElementById(elem).style.display = document.getElementById(elem).style.display == "none" ? "block" : "none";
            } else {
                document.getElementById(elem).style.display = document.getElementById(elem).style.display == "none" ? "block" : "none";
            }

        };
    }
    //解除绑定
    Common.removeshowdiv = function (cele, elem, codes) {
        document.getElementById(cele).onclick = function () {
            if (cele == "talentbtn") {//控制宠物天赋技能滚动条
                if (document.getElementById("cwtb" + codes).children.length > 7) {
                    document.getElementById("cwtc" + codes).style.display = "block";
                }
                document.getElementById(elem).style.display = "none";
            } else {
                document.getElementById(elem).style.display = "none";
            }

        };
    }
    //引灵幡技能
    Common.ylfskill = function (nodename, nowNode) {
        switch (nodename) {
            case "药王神鼎":
                return '<span class="ylficon ywsd">&nbsp;</span><dl class="ylftip ywsdtip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引西方药仙的灵幡，使用后战斗中可使你使用气血的效果得到提升，但减少5%伤害。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "五行相生":
                return '<span class="ylficon wxxs">&nbsp;</span><dl class="ylftip wxxstip"><dt>' + nodename + '</dt><br/>被动奇术，对本方生效。在回合之初召引五行之神的灵幡，使用后战斗中若队伍中有五行相生系别的队友，能提升少量气血和法力上限的效果。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "天机神甲":
                return '<span class="ylficon tjsj">&nbsp;</span><dl class="ylftip tjsjtip"><dt>' + nodename + '</dt><br/>被动奇术，对本方生效。在回合之初召引琅琊仙人的灵幡，使用后战斗中可提升少量的防御力。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "玉露还元":
                return '<span class="ylficon ylhy">&nbsp;</span><dl class="ylftip ylhytip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引神农后人的灵幡，使用后战斗中每回合回复少量气血。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "五行相辅":
                return '<span class="ylficon wxxf">&nbsp;</span><dl class="ylftip wxxftip"><dt>' + nodename + '</dt><br/>被动奇术，对本方生效。在回合之初召引五行之神的灵幡，使用后战斗中若队伍中有五行相生系别的队友，能提升少量攻击力。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "料敌先机":
                return '<span class="ylficon ldxj">&nbsp;</span><dl class="ylftip ldxjtip"><dt>' + nodename + '</dt><br/>被动奇术，对敌方生效。在回合之初召引三十六天将的灵幡，使用后战斗中可削弱对方抗玩家自身系别的能力，此技能对pvp战斗无效。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "以牙还牙":
                return '<span class="ylficon yyhy">&nbsp;</span><dl class="ylftip yyhytip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引蛇怪的灵幡，使用后战斗中可使你受到的伤害有少量反射给攻击者；要求药王神鼎达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "势不可挡":
                return '<span class="ylficon sbkd">&nbsp;</span><dl class="ylftip sbkdtip"><dt>' + nodename + '</dt><br/>可增加物理技能主目标的破防率及破防度。提高的数值与自身分配的力量加点占可分配属性点的比例关系，与装备等附加的属性点数无关。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "大道轮回":
                return '<span class="ylficon ddlh">&nbsp;</span><dl class="ylftip ddlhtip"><dt>' + nodename + '</dt><br/>积蓄自身及队友所受伤害、控制效果，附加在自身招式上对单一目标造成额外伤害和控制效果。提高的数值与自身分配的体制加点占可分配属性点的比例有关，与装备等附加的属性点无关。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "邪灵附体":
                return '<span class="ylficon xlft">&nbsp;</span><dl class="ylftip xlfttip"><dt>' + nodename + '</dt><br/>可使用奇术邪灵附体，能使多名目标的伤害降低（防御降低、速度变慢、生命/蓝上限减少、闪避能力下降）；技能提升到1级、200级、240级之后，可攻击的对象分别为3个、4个、5个。性点数无关<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "嗜血狂乱":
                return '<span class="ylficon sxkl">&nbsp;</span><dl class="ylftip sxkltip"><dt>' + nodename + '</dt><br/>召引鬼畜道万年僵尸的灵幡，可使用奇术嗜血狂乱，在战斗中失去一部分生命值，加强伤害；要求玉露还元达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "法力无边":
                return '<span class="ylficon flwb">&nbsp;</span><dl class="ylftip flwbtip"><dt>' + nodename + '</dt><br/>每次被物理攻击时均使敌方受到的法术伤害增加，同时每攻击到一个目标都能增加自身的物理闪避几率。提高的数值与自身分配的灵力加点占可分配属性点的比例有关，与装备等附加的属性点数无关，要求五行相辅、玉露还元达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "如有神助":
                return '<span class="ylficon rysz">&nbsp;</span><dl class="ylftip rysztip"><dt>' + nodename + '</dt><br/>辅助技能附带较高的五行抗性。提高的数值与自身分配的敏捷加点占可分配属性点的比例有关，与装备等附加的属性点无关，要求五行相辅、料敌先机达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "灵力增幅":
                return '<span class="ylficon llzf">&nbsp;</span><dl class="ylftip llzftip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引五界仙灵的灵幡，使用后战斗中你的五阶辅助技能可以附带增加必杀效果（金）、附带增加抗性效果（水）、附带提升法力值效果（木）、附带加速时不乱敏效果（火）、附带有几率闪避对方诅咒效果（土）；要求料敌先机达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "渡化成空":
                return '<span class="ylficon dhck">&nbsp;</span><dl class="ylftip dhcktip"><dt>' + nodename + '</dt><br/>召引地藏王的灵幡，可使用奇术渡化成空，在战斗中牺牲自己大量的气血，加倍恢复目标的气血和法力值；要求以牙还牙、势不可挡达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "有仇必报":
                return '<span class="ylficon ycbb">&nbsp;</span><dl class="ylftip ycbbtip"><dt>' + nodename + '</dt><br/>召引蝎精的灵幡，可使用奇术有仇必报，在一定回合内，你所受到伤害会使制定目标也同时受到一定伤害；要求以牙还牙、势不可挡达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "天将下凡":
                return '<span class="ylficon tjxf">&nbsp;</span><dl class="ylftip tjxftip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引三十六天将的灵幡，使用后战斗中若参战以及掠阵宠物死亡后，会得到天神下凡的帮助；要求邪灵附体、大道轮回达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "三元归一":
                return '<span class="ylficon sygy">&nbsp;</span><dl class="ylftip sygytip"><dt>' + nodename + '</dt><br/>召引元始天尊的灵幡，可使用奇术三元归一，在战斗中可使队友伤害平摊至其他两名队友；要求邪灵附体、大道轮回达到80级才能学习。技能提升到120级、180级、240级之后，可持续的回合分别为2、3、4。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "褪灵血咒":
                return '<span class="ylficon tlxz">&nbsp;</span><dl class="ylftip tlxztip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引阴司无常的灵幡，使用后战斗中的攻击技能能减少敌方的法力值；要求嗜血狂乱、法力无边达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "金刚之躯":
                return '<span class="ylficon jgzq">&nbsp;</span><dl class="ylftip jgzqtip"><dt>' + nodename + '</dt><br/>召引韦陀菩萨的灵幡，可使用奇术金刚之躯，战斗中能降低本方宠物受到的伤害，此技能最多生效三回合或五次伤害后失效；要求如有神助达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "后发制人":
                return '<span class="ylficon hfzr">&nbsp;</span><dl class="ylftip hfzrtip"><dt>' + nodename + '</dt><br/>召引张天师的灵幡，可使用奇术后发制人，使用后在战斗中本回合不攻击，下回合以更强的伤害攻击目标；要求灵力增幅达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "共工灭世":
                return '<span class="ylficon ggms">&nbsp;</span><dl class="ylftip ggmstip"><dt>' + nodename + '</dt><br/>召引共工的灵幡，可使用奇术共工灭世，牺牲自身大量气血对对手造成致命伤害。技能提升到160级、200级、240级之后，可攻击的对象分别为2、3、4；要求渡化成空、有仇必报80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "金身不灭":
                return '<span class="ylficon jsbm">&nbsp;</span><dl class="ylftip jsbmtip"><dt>' + nodename + '</dt><br/>召引佛陀的灵幡，可使用奇术金身不灭，给予队友免受任何攻击伤害的保护，可免除大量伤害（技能施法间隔6回合）；要求天将下凡、三元归一达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "渴血奇术":
                return '<span class="ylficon hxqs">&nbsp;</span><dl class="ylftip hxqstip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引地狱道血魔的灵幡，使用后战斗中的攻击能吸取目标气血；要求褪灵血咒达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "如幻似梦":
                return '<span class="ylficon rhsm">&nbsp;</span><dl class="ylftip rhsmtip"><dt>' + nodename + '</dt><br/>召引万年琵琶精的灵幡，可使用奇术如幻似梦，战斗中将你的宠物虚化，减弱敌人的攻击，但你的宠物也无法除使用道具外的任何操作，否则法术失败；要求金刚之躯达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
            case "怒蛟连斩":
                return '<span class="ylficon njlz">&nbsp;</span><dl class="ylftip njlztip"><dt>' + nodename + '</dt><br/>被动奇术，仅对自己生效。在回合之初召引北海怒蛟的灵幡，使用后战斗中可使你的五阶攻击技能和力魄千钧技能可以连续攻击两次；要求后发制人达到80级才可学习。<br/><dt>技能等级:&nbsp;<span>' + nowNode + '</span></dt></dl>';
        }
    };
    //查看引灵幡说明
    Common.mouselist = function (elemId) {
        function tag(name, elem) {
            return (elem || document).getElementsByTagName(name);
        }
        // 获得相应ID的元素
        function id(name) {
            return document.getElementById(name);
        }
        var elem = tag("span", id(elemId));
        var listNum = elem.length;
        for (var i = 0; i < listNum; i++) {
            elem[i].onmouseover = (function (i) {
                return function () {
                    elem[i].nextSibling.style.display = "block";
                }
            })(i)
            elem[i].onmouseout = (function (i) {
                return function () {
                    elem[i].nextSibling.style.display = "none";
                }
            })(i)
        }
    }
    //人物头像悬停显示属性
    Common.mouseattr = function (elemId, attrele) {
        function id(name) {
            return document.getElementById(name);
        }
        id(elemId).onmouseover = (function () {
            if (id("rd1attrlist").children.length > 0) {//如果人物没有此项就不显示
                id(attrele).style.display = "block";
            }
        })
        id(elemId).onmouseout = (function (i) {
            id(attrele).style.display = "none";
        });
    };
    //娃娃头像悬停显示属性
    Common.mousewwattr = function (elemId, attrele) {
        function id(name) {
            return document.getElementById(name);
        }
        id(elemId).onmouseover = (function () {
            id(attrele).style.display = "block";
        })
        id(attrele).onmouseout = (function (i) {
            id(attrele).style.display = "none";
        });
    };
    //转化次数头像悬停显示属性
    Common.mousezhuanhuaattr = function (elemId, attrele) {
        function id(name) {
            return document.getElementById(name);
        }
        id(elemId).onmouseover = (function () {
            id(attrele).style.display = "block";
        })
        id(elemId).onmouseout = (function (i) {
            id(attrele).style.display = "none";
        });
    };
    //选择技能
    Common.skilllist = function (elemId) {
        function tag(name, elem) {
            return (elem || document).getElementsByTagName(name);
        }
        // 获得相应ID的元素
        function id(name) {
            return document.getElementById(name);
        }
        var elem = tag("li", id(elemId));
        var listNum = elem.length;
        for (var i = 0; i < listNum; i++) {
            elem[0].firstChild.className = "on";
            elem[0].firstChild.click();
            elem[i].onclick = (function (i) {
                return function () {
                    for (var j = 0; j < listNum; j++) {
                        if (i == j) {
                            elem[j].firstChild.className = "on";
                        } else {
                            elem[j].firstChild.className = "";
                        }
                    }
                }
            })(i)
        }
    }
    //查看宠物技能tab
    Common.gettabspan = function (elemId, tabId, classs) {
        function tag(name, elem) {
            return (elem || document).getElementsByTagName(name);
        }
        function tagclass(oParent, sClass) {
            var oReasult = [];
            var oEle = oParent.getElementsByTagName("*");
            for (i = 0; i < oEle.length; i++) {
                if (oEle[i].className == sClass) {
                    oReasult.push(oEle[i])
                }
            };
            return oReasult;
        }
        //获得相应ID的元素
        function id(name) {
            return document.getElementById(name);
        }
        function first(elem) {
            elem = elem.firstChild;
            return elem && elem.nodeType == 1 ? elem : next(elem);
        }
        function next(elem) {
            do {
                elem = elem.nextSibling;
            } while (
                elem && elem.nodeType != 1
            )
            return elem;
        }
        var elem = tag("span", id(elemId));
        var tbook = tag("li", id("b8"));
        var tabs = tagclass(id(tabId), classs);
        var listNum = elem.length;
        var tabNum = tabs.length;
        var liNum = tbook.length;
        var isno = 0;
        for (var i = 0; i < listNum; i++) {
            if (listNum > 1) {//选项卡大于一个时
                tabs[0].style.display = "block";
                tabs[i].style.display = "none";
            }
            elem[0].firstChild.className = "on";
            elem[0].firstChild.click();
            elem[i].onclick = (function (i) {
                return function () {
                    for (var j = 0; j < tabNum; j++) {
                        if (i == j) {
                            tabs[j].style.display = "block";
                            if(elem[i].className=="heartmethod"){
                                 for (var bye = 0; bye < liNum; bye++) {
                               new ScrollBar('cwheartmethodd' + bye, 'cwheartmethodc' + bye, 'cwheartmethoda' + bye, 'cwheartmethodb' + bye);//宠物心法滚动条      
                                 }
                            }
                            elem[j].firstChild.className = "on";
                            if (elem[j].className == "lifetabbook") {//当点击宠物天书时，替换标题title
                                isno = this.attributes["type"].value;
                                document.getElementById("changetitle" + isno + "").innerHTML = "<span class='skilltitles'>技能名称</span><span class='skilltitles sed'>技能等级</span><span class='skilltitles sed'>灵气</span>";
                            }else if( elem[j].className == "petBlood"){//当点击宠物血脉时，替换标题title
                                document.getElementById("changetitle" + isno + "").innerHTML = "<span class='skilltitle'>血脉名称</span><span class='skilltitle sed'>等阶</span>";                          
                            } else {
                                document.getElementById("changetitle" + isno + "").innerHTML = "<span class='skilltitle'>技能名称</span><span class='skilltitle sed'>技能等级</span>";
                            }
                            
                        }
                        else {
                            tabs[j].style.display = "none";
                            elem[j].firstChild.className = "";
                        }
                    }
                }
            })(i)
        }
    }
    //人物头像悬停显示属性
    Common.mousestonename = function (elemId, attrele) {
        function tagclass(oParent, sClass) {
            var oReasult = [];
            var oEle = oParent.getElementsByTagName("*");
            for (i = 0; i < oEle.length; i++) {
                if (oEle[i].getAttribute('type') == sClass) {
                    oReasult.push(oEle[i])
                }
            };
            return oReasult;
        }
        var taaa = tagclass(id(elemId), attrele)
        function id(name) {
            return document.getElementById(name);
        }
        for (var i = 0; i < taaa.length; i++) {
            taaa[i].onmouseover = (function () {
                this.lastChild.style.display = "block";
            })
            taaa[i].onmouseout = (function (i) {
                this.lastChild.style.display = "none";
            });
        }
    };
    //娃娃等级评星
    Common.getwwStar = function (iswwstar) {
        iswwstar = parseInt(iswwstar);
        var wwstarts = "<span class='wwstart'>";
        if (0 <= iswwstar && iswwstar < 50) {
            wwstarts += "<span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (50 <= iswwstar && iswwstar < 100) {
            wwstarts += "<span class='wstr wsfhalf'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (100 <= iswwstar && iswwstar < 200) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (200 <= iswwstar && iswwstar < 300) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfhalf'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (300 <= iswwstar && iswwstar < 400) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (400 <= iswwstar && iswwstar < 500) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfhalf'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (500 <= iswwstar && iswwstar < 600) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (600 <= iswwstar && iswwstar < 700) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfhalf'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (700 <= iswwstar && iswwstar < 800) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsnone'>&nbsp;</span>";
        } else if (800 <= iswwstar && iswwstar < 900) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfhalf'>&nbsp;</span>";
        } else if (900 <= iswwstar && iswwstar <= 1000) {
            wwstarts += "<span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span><span class='wstr wsfull'>&nbsp;</span>";
        }
        wwstarts += '</span>';
        return wwstarts;
    }
    //宠物魂兽石空槽
    Common.stonenone = function (stonearr) {
        for (var i = 0; i < stonearr.length; i++) {
            var newNode = document.createElement("span");
            var newcut = (parseInt(stonearr[i].split(":")[0]) + 1);
            var htmls = "";
            for (var j = 0; j < parseInt(stonearr[i].split(":")[1]) ; j++) {
                htmls += '<i class="colnone cwcolimgnone cwcimgs' + j + '"></i>';
            }
            newNode.innerHTML = htmls;
            document.getElementById("cwtstonebg").children[newcut].appendChild(newNode);
        }

    };
    //宠物天赋技魂兽石等级数组遍历
    var stonearr = [];
    Common.stonelvs = function (istonearr, stonename, stonelv) {
        for (var i = 0; i < istonearr.length; i++) {
            if (istonearr[i].split("|")[0] == stonename) {
                istonearr[i] = istonearr[i] + '|' + stonelv;
            }
        }
        return istonearr;
    };
    //宠物天赋技魂兽石等级
    Common.unique = function (array) {
        var stonehtml = "";
        var stonhmllv = 0;
        for (var i = 0; i < array.length; i++) {
            if (!(array[i].split("|")[2])) {
                stonhmllv = 0;
            } else {
                stonhmllv = array[i].split("|")[2];
            }
            stonehtml += "<li><a href='javascript:;'><span class='cwtalentimg'>&nbsp;</span><span class='cwtalentname'>" + array[i].split("|")[0] + "</span><span class='cwtalentlv'>" + array[i].split("|")[1] + "</span><span class='cwtalentstone'>" + stonhmllv + "</span></a></li>";
        }

        return stonehtml;
    }
    //颜色控制
    Common.getColor = function (str) {
        switch (str) {
            case "金色":
            case "golden":
                return "#ffff00";

            case "蓝色":
            case "blue":
                return "#9090ff";

            case "白色":
            case "white":
                return "#f5f5f5";

            case "粉色":
            case "pink":
                return "#ff00ff";

            case "绿色":
            case "green":
                return "#00ff00";
            case "红色":
            case "red":
                return "#ff2020";

            case "灰色":
            case "gray":
                return "#7D7D7D";
            case "cyan":
                return "#00FFFF";
            case "darkgolden":
                return "#ff6600";
            case "purple":
                return "#800080";
        }
    };


    //法宝主技能描述
    Common.getFbDescription = function (type, percentage, level) {
        var percentageNum = percentage / 100;
        switch (type) {
            case '番天印':
                return percentageNum + '%概率法术连击';
            case '阴阳镜':
                return percentageNum + '%概率将以自己为主目标的师门法术攻击和物理攻击，转移到己方或己方宠物身上（自己仍有可能作为附加目标受到伤害，伤害不能转移到攻击者身上）';
            case '定海珠':
                var num2 = Math.floor((level - 1) /5) + 1;
                return percentageNum + '%概率免除当前回合任何伤害（特殊伤害除外），等级越高，免除的伤害次数越多（当前'+ num2 +'次）';
            case '混元金斗':
                return percentageNum + '%概率出现物理攻击力提升至2.5倍';
            case '金蛟剪':
                return percentageNum + '%物理攻击目标或力破千钧技能主目标死亡后，'+ percentageNum +'%概率随机从剩余活着的敌方对象中选择一个追加一次最佳师门攻击技能攻击';
            case '九龙神火罩':
                return '全面提升自身抗障碍属性，提升比例为' + percentageNum + '%';
            case '卸甲金葫':
                return percentageNum + '%概率使主目标所携带的法宝在当前回合失效';
            case '混沌钟':
                return percentageNum + '%概率增加法术伤害，目标数越少增加的伤害越多，最多增加至2.5倍';
            case '七宝妙树':
                return '被攻击时有'+ percentageNum +'%概率使攻击者被藤蔓捆住，并且造成持续伤害';
            case '十二品莲台':
                return '物理攻击与法术攻击时有' + percentageNum + '%概率触发破防30%的效果，同时必定命中';
        }
    },
    //法宝副技能及转世后技能描述
    Common.getNewFbDescription = function (type, percentage, level) {
        var percentageNum = percentage / 100;
        switch (type) {
            case '番天印':
                return percentageNum + '%概率法术连击，连击的法术与施法的法术阶数相同或比之低一阶';
            case '阴阳镜':
                return percentageNum + '%概率将以自己为主目标的师门法术攻击和物理攻击，转移到己方或对方身上（自己仍有可能作为附加目标受到伤害，伤害不能转移到攻击者身上）';
            case '定海珠':
                var num2 = Math.floor((level - 1) / 5 + 1) * 2;
                return percentageNum + '%概率免除当前回合任何伤害（特殊伤害除外），免除的伤害次数比未转世法宝多一倍（当前'+ num2 +'次）';
            case '混元金斗':
                return percentageNum + '%概率出现物理攻击力提升至2.5倍，力破千钧、落羽飞翎的辅目标伤害也提升至2.5倍。孔雀除落羽飞翎外的其余门派物攻技能后续2次伤害也提升至2.5倍';
            case '金蛟剪':
                return '物理攻击或使用力破千钧技能时有' + percentageNum + '%概率选择一个敌方对象追加一次师门攻击技能或力破千钧攻击（追加的攻击不消耗法力），并优先使用力破千钧技能（孔雀优先触发相同类型的技能）';
            case '九龙神火罩':
                return '全面提升自身抗障碍属性和防御，提升比例为' + percentageNum + '%';
            case '卸甲金葫':
                return percentageNum + '%概率使主目标所携带的法宝在当前回合失效，并降低敌方所有法术抗性';
            case '混沌钟':
                return percentageNum + '%概率增加法术伤害，目标数越少增加的伤害越多，最多增加至3倍';
            case '七宝妙树':
                return '被攻击时有' + percentageNum + '%概率使攻击者被藤蔓捆住，并且造成持续伤害，若目标被藤蔓伤害致死，则缠绕效果蔓延至周围目标';
            case '十二品莲台':
                return '物理攻击与法术攻击时有' + percentageNum + '%概率触发破防60%的效果，同时必定命中';
        }
    },
    
    //阵型选择
    Common.getzxStyle = function (Firname, Secname,FirImgbac,SecImgbac) {
        if (Firname.css("display") == "block") {
            Firname.css("display", "none")
            FirImgbac.css('background', "url(http://img.gyyxcdn.cn/qibao/Images/downArrow.png)")
        } else {
            Firname.css("display", "block");
            FirImgbac.css('background', "url(http://img.gyyxcdn.cn/qibao/Images/downArrowON.png)")
        }
        Secname.css("display", "none");
        SecImgbac.css('background', "url(http://img.gyyxcdn.cn/qibao/Images/downArrow.png)")
    };
    //阵型选择完毕
    Common.getzxStyleCon = function (liName,spanName,ulFirName,ulSecName,spanSecName,selectName,imgName) {
        var liName = liName.innerText;
        spanName.html(liName);
        ulFirName.css("display", "none");
        ulSecName.css("display", "none");
        imgName.css('background', 'url(http://img.gyyxcdn.cn/qibao/Images/downArrow.png)');
        if (spanName.html() != "请选择" && spanSecName.html() != "请选择") {
            selectName.css('background', "url(http://img.gyyxcdn.cn/qibao/Images/queryOn_btn.png)")
            selectName.attr("disabled",false)
        }
    }




})(window, Array);