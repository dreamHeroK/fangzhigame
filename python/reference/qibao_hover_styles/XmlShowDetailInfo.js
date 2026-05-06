/* Created by Administrator on 2016/1/6.*/
/* Update by ligen at 2016/2/26.*/
/*======================================参数说明======================================*/
/* getColor            由于xml中返回的颜色值是中文名称，这里需要改成十六进制颜色值    */
/* daojuCallBack       道具 执行ajax请求xml成功后的回调函数                           */
/* roleCallBack        人物 执行ajax请求xml成功后的回调函数                           */
/* petCallBack         宠物 执行ajax请求xml成功后的回调函数                           */
/* equipCallBack       装备(其中不包括法宝 首饰 娃娃)                                 */
/* bagCallBack         背包(包括装备、法宝、首饰)                                     */
/* equipOtherCallBack  装备(法宝 娃娃 首饰)  执行ajax请求xml成功后的回调函数          */
/* wendaoMoneyCallBack 问道币 执行ajax请求xml成功后的回调函数                         */
/* roleviewCallBack    角色详情 执行ajax请求xml成功后的回调函数                       */
/* bagCallBack         包裹详情 执行ajax请求xml成功后的回调函数                       */
/*====================================================================================*/

(function (window, params) {

    //由于xml中返回的颜色值是中文名称，这里需要改成十六进制颜色值
    function getColor(str) {
        switch (str) {
            case "金色":
            case "golden":
                return "#ffff00";
                break;

            case "蓝色":
            case "blue":
                return "#9090ff";
                break;

            case "白色":
            case "white":
                return "#f5f5f5";
                break;

            case "粉色":
            case "pink":
                return "#ff00ff";
                break;

            case "绿色":
            case "green":
                return "#00ff00";
                break;
            case "红色":
            case "red":
                return "#ff2020";
                break;

            case "灰色":
            case "gray":
                return "#7D7D7D";
                break;
            case "cyan":
                return "#00FFFF";
                break;
            case "darkgolden":
                return "#ff6600";
                break;
        }
    }
    //向window对象暴露一个showDaojuDetailInfo
    /**qibaoShowDetailInfo方法　发送ajax请求得到xml
     * 然后根据我们自己的需求将得到的xml数据转换成我们想要的json数据
     * 最后进行数据绑定（将json数据绑定到我们的html模版中）
     * */
    //方法需要传入三个参数 ①xml文档的地址 ②添加hover事件的对象 ③type值 为当前的是什么类型 道具 人物 宠物 装备 问道币
    window.qibaoShowDetailInfo = function (url, par, type, view) {
        var addDivDom = document.createElement('div');
        addDivDom.className = "daojuShowDetailInfo";
        addDivDom.style.display = "none";
        par.appendChild(addDivDom);
        var daojuShowDetailInfo = gy.getByClass("daojuShowDetailInfo", par)[0];

        //以上4步 可能需要写在html中(ajax请求后我们可以控制这个容器的显示和隐藏，
        // 由于ajax的请求的需要时间，这样处理的话可以避免显示隐藏的错乱)
        /*===========================================================================================*/

        //polar相性数值类型 1 金 2 木 3 水 4 火 5 土
        var polarArr = ["无", "金", "木", "水", "火", "土"];
        //suit_polar套装的相性（装备名称后面的图片文字金木水火土）
        var suitpolarArr = { "0": "", "1": "3543", "2": "3544", "4": "3545", "8": "3546", "16": "3547" }
        var petpolarArr = ["0", "3543", "3544", "3545", "3546", "3547"];
        //upgrade_type道具绑定位置[1、武器 2、头盔 3、衣服 4、鞋子 5、娃娃手镯 6、娃娃肚兜 7、娃娃脚环]
        var upgradetypeArr = ["", "武器", "头盔", "衣服", "鞋子", "娃娃手镯", "娃娃肚兜", "娃娃脚环"];
        var stoneslot = []; //宠物魂兽石空槽位
        //zhanli_lv角色、宠物战力等级图标
        var zhanliArr = ["", "11451", "11452", "11453", "11454", "11455", "11456", "11457", "11458", "11459", "11460"];
       var cardZhanliArr = ["", "17340", "17341", "17342", "17343", "17344", "17345", "17346", "17347", "17348", "17349"];
        var eqarrda;//人物详情中获取equip标签里面的item
        var bagarrda;//人物详情中获取bag标签里面的item
        var wwequipda;//人物详情中获取children标签里面的item
        var eqdatalist;//获取html文档对象
        var ispetseals = 0;
        /*===========================================================================================*/
        /**
         * 由于xml的格式不一样以及展示的数据(html模版)不一样，需要分开单独处理xml文档 绑定数据
         * 将xml以及html分为六大类 1：道具  2：人物  3：宠物  4：装备(不包括法宝 首饰 娃娃)
         *                       5：装备(法宝 娃娃 首饰)  6：问道币
         * */
        //下面是针对不同类别的方法,这些方法都是ajax请求xml地址得到数据后执行(ajax的回调方法)
        //ajax调用在下面绑定事件里面，ajax方法写在common.js(公共方法)里面，请求成功会返回一个xml文档 然后执行回调函数
        //中文验证码接口
        function loginAjax() {
            $.ajax({
                url: "/Buy/ItemDetailVerifyCaptcha",
                type: "get",
                dataType: "json",
                data: {
                    verifyCaptcha: $(":input[data-id=txtCaptchaCode]").val(),
                    type: $("#formrefresh").attr("data-type"),
                    r: Math.random()
                },
                beforeSend: function () { $("#formmima").find(":submit").attr("disabled", "disabled").val("正在登录..."); },
                success: function (d) {
                    $("#formmima").find(":submit").removeAttr("disabled").val("登  录");
                    if (d.IsSuccess) {
                        window.location.reload(true);
                    } else {
                        if (d.Data == "unauthorized") {
                            QiBao.TimeOutDiv();
                        } else if (d.Data == "JsonException") {
                            window.location.href = d.ReturnUrl;
                        } else {
                            chinaCaptcha.refreshCaptcha();
                            QiBao.ShowMessageDiv({
                                Content: "<p style='font-size:14px;'>" + d.Message + "</p>"
                            });
                        }
                    }
                },
                error: function () {
                    $("#formmima").find(":submit").removeAttr("disabled").val("登  录");
                    $("#formmima").find(".js_pass_err").show().html("登录失败，请稍后重试。");
                }
            });
        }
        function getServerTypeByItemIdFn(itemcode) {
            var itemId = itemcode;
            var serverType = "";
            $.ajax({
                url: "/ItemInfo/GetServerTypeByItemId",
                type: "get",
                async: false,
                data: {
                    itemId: itemId,
                    r: Math.random()
                },
                success: function (d) {
                    serverType= d.ServerType;
                }
            })
            return serverType;
        }
        ChinaCaptcha.prototype.subFn = loginAjax;
        /*===========================================================================================*/
        //绑定事件
        //这一部分在应用的时候可能要单独拿出来（页面的的详情列表是ajax动态加载出来的，所以这个地方绑定事件 无效）
        //把这部分提出来，然后整个函数需要部分调整
        if (!view) {//物品列表页面鼠标经过显示
            //解决ie浏览器划过时闪动问题
            $(function () {
                $(par).mouseenter(function () {
                    daojuShowDetailInfo.style.display = "block";
                    var itemcode = $(par).find(".js_flashimg").attr("data-code")
                    //如果不存在isGetXmlAjax属性就调用ajax方法请求数据（isGetXmlAjax属性是ajax请求完成之后绑定的）
                    if (!par.getAttribute("isGetXmlAjax")) {
                        gy.getXmlHttpRequest(url, function (data) {
                            var nowtype = type.toString();
                            if (data === "moreRefresh") {
                                //IE6下默认不缓存背景图片，CSS里每次更改图片的位置时都会重新发起请求，用这个方法告诉IE6缓存背景图片
                                var isIE6 = /msie 6/i.test(navigator.userAgent);
                                if (isIE6) {
                                    try { document.execCommand('BackgroundImageCache', false, true); } catch (e) { }
                                }
                                var chinaCaptcha = new ChinaCaptcha($("#formrefresh"), {
                                    bid: "ybtvat"
                                });
                                chinaCaptcha.init();
                                chinaCaptcha.createCaptchaPop();
                                $("#formrefresh").attr("data-type", "itemXML");
                            } else if (data === "moreFreshDisabled") {
                                var timeoutlayer = document.createElement('div');
                                timeoutlayer.innerHTML = '<div class="templateString-border" id="templateString_role"><div><div class="name">操作过去频繁，请10分钟后刷新再试</div></div></div>';
                                daojuShowDetailInfo.appendChild(timeoutlayer);
                                par.setAttribute("isGetXmlAjax", "true");
                            } else if (data === "disabledLogin") {
                                QiBao.DisLoginDiv();
                            } else {
                                switch (nowtype) {
                                    case "1":
                                        XmlMoney.wendaoMoneyCallBack(data, par);
                                        break;
                                    case "2":
                                        Xmlequip.equipCallBack(data, par, suitpolarArr, polarArr);
                                        break;
                                    case "3":
                                         var serverType = getServerTypeByItemIdFn(itemcode);
                                         if (serverType == "1" || serverType == "3") {//经典和情怀区
                                             Xmlpet.petCallBack(data, par, ispetseals, zhanliArr, petpolarArr, polarArr);
                                            $(".petzlimg,.pet_classicHidden").hide();
                                         } else if (serverType == "0") {//公测

                                             Xmlpet.petCallBack(data, par, ispetseals, zhanliArr, petpolarArr, polarArr);
                                         } else if (serverType == "2") { //点卡

                                             Xmlpet.petCallBack(data, par, ispetseals, cardZhanliArr, petpolarArr, polarArr);

                                         }
                                        break;
                                    case "4":
                                        Xmldaoju.daojuCallBack(data, par);
                                        break;
                                    case "5":
                                        Xmlrole.roleCallBack(data, par);
                                        break;
                                    case "205":
                                        XmlequipOther.XmlepOtherCallBack(data, par, polarArr);
                                        break;
                                    case "206":
                                        XmlequipOther.XmlepOtherCallBack(data, par, polarArr);
                                        break;
                                    case "207":
                                        XmlequipOther.XmlepOtherCallBack(data, par, polarArr);
                                        break;
                                    case "209":
                                        Xmlsuit.suitListCallBack(data, "0", par, suitpolarArr, polarArr, nowtype);
                                        daojuShowDetailInfo.style.width = "40%";
                                        daojuShowDetailInfo.style.background = "none";
                                        break;
                                    case "211":
                                        Xmlsuit.suitListCallBack(data, "0", par, suitpolarArr, polarArr, nowtype);
                                        daojuShowDetailInfo.style.width = "40%";
                                        daojuShowDetailInfo.style.background = "none";
                                        break;
                                }
                            }
                            //var height = $('.daojuShowDetailInfo').height();
                            //$('.hidHei').val(height)
                            //console.log(height)
                        });
                    }
                    //var height = $(this).children('.daojuShowDetailInfo').height();
                    //$('.hidHei').val(height)
                    //console.log($('.hidHei').val())
                    //console.log(height)
                });
                $(par).mouseleave(function () {
                    daojuShowDetailInfo.style.display = "none";
                });
            });
        } else {//物品查看详情页加载时显示
            daojuShowDetailInfo.style.display = "block";
            daojuShowDetailInfo.style.position = "relative";
            daojuShowDetailInfo.style.left = "0";
            daojuShowDetailInfo.style.fontSize = "14px";
            //如果不存在isGetXmlAjax属性就调用ajax方法请求数据（isGetXmlAjax属性是ajax请求完成之后绑定的）
            if (!par.getAttribute("isGetXmlAjax")) {
                gy.getXmlHttpRequest(url, function (data) {
                    var nowtype = type.toString();
                    if (data === "moreRefresh") {
                        //IE6下默认不缓存背景图片，CSS里每次更改图片的位置时都会重新发起请求，用这个方法告诉IE6缓存背景图片
                        var isIE6 = /msie 6/i.test(navigator.userAgent);
                        if (isIE6) {
                            try { document.execCommand('BackgroundImageCache', false, true); } catch (e) { }
                        }
                        chinaCaptcha = new ChinaCaptcha($("#formrefresh"), {
                            bid: "ybtvat"
                        });
                        chinaCaptcha.init();
                        chinaCaptcha.createCaptchaPop();
                        $("#formrefresh").attr("data-type", "itemXML");
                    } else if (data === "moreFreshDisabled") {
                        var timeoutlayer = document.createElement('div');
                        timeoutlayer.innerHTML = '<div class="templateString-border" id="templateString_role"><div><div class="name">操作过去频繁，请10分钟后刷新再试</div></div></div>';
                        daojuShowDetailInfo.appendChild(timeoutlayer);
                        par.setAttribute("isGetXmlAjax", "true");
                    } else if (data === "disabledLogin") {
                        QiBao.DisLoginDiv();
                    } else {
                        switch (nowtype) {
                            case "1":
                                XmlMoney.wendaoMoneyCallBack(data, par);
                                daojuShowDetailInfo.style.width = "40%";
                                break;
                            case "2":
                                Xmlequip.equipCallBack(data, par, suitpolarArr, polarArr);
                                daojuShowDetailInfo.style.width = "50%";
                                break;
                            case "3":
                                Xmlpet.petCallBack(data, par, ispetseals, zhanliArr, petpolarArr, polarArr);
                                daojuShowDetailInfo.style.width = "60%";
                                break;
                            case "4":
                                Xmldaoju.daojuCallBack(data, par);
                                daojuShowDetailInfo.style.width = "45%";
                                break;
                            case "5":
                                Xmlroleview.roleviewCallBack(data, par, zhanliArr, stoneslot, polarArr, suitpolarArr);
                                daojuShowDetailInfo.style.width = "100%";
                                daojuShowDetailInfo.style.background = "none";
                                break;
                            case "205":                               
                            case "206":
                            case "207":
                                XmlequipOther.XmlepOtherCallBack(data, par, polarArr);
                                daojuShowDetailInfo.style.width = "45%";
                                break;
                            case "209":
                                Xmlsuit.suitListCallBack(data, "1", par, suitpolarArr, polarArr, nowtype);
                                daojuShowDetailInfo.style.width = "40%";
                                daojuShowDetailInfo.style.background = "none";
                                document.getElementById("suittip").style.display = "block";
                                break;
                            case "211":
                                Xmlsuit.suitListCallBack(data, "1", par, suitpolarArr, polarArr, nowtype);
                                daojuShowDetailInfo.style.width = "40%";
                                daojuShowDetailInfo.style.background = "none";
                                document.getElementById("suittip").style.display = "block";
                                break;
                        }
                    }
                });
            }
        }

        //选择我方阵型
        $('#js_zxSpanFir').off('click').on('click', function () {
            gy.getzxStyle($('.zxUlFir'), $('.zxUlSec'), $('.downArrLef'), $('.downArrRig'))
        });
        $('.downArrLef').off('click').on('click', function () {
            gy.getzxStyle($('.zxUlFir'), $('.zxUlSec'), $('.downArrLef'), $('.downArrRig'))
            $('#js_zxSpanFir').css('color', '#a8a8a8');
        });
        $('.js_zxUlFir li').off('click').on('click', function () {
            gy.getzxStyleCon(this, $('#js_zxSpanFir'), $('.zxUlFir'), $('.zxUlSec'), $('#js_zxSpanSec'), $('.query'), $('#formationleftbg .zxdiv .imgA'))
            $('#js_zxSpanFir').css('color', '#a8a8a8');
        });
        //选择敌方阵型
        $('#js_zxSpanSec').off('click').on('click', function () {
            gy.getzxStyle($('.zxUlSec'), $('.zxUlFir'), $('.downArrRig'), $('.downArrLef'))
        });
        $('.downArrRig').off('click').on('click', function () {
            gy.getzxStyle($('.zxUlSec'), $('.zxUlFir'), $('.downArrRig'), $('.downArrLef'))
        });
        $('.js_zxUlSec li').off('click').on('click', function () {
            gy.getzxStyleCon(this, $('#js_zxSpanSec'), $('.zxUlFir'), $('.zxUlSec'), $('#js_zxSpanFir'), $('.query'), $('#formationleftbg .zxdiv .imgA'))
        });
        //点击重置
        $('.reset').off('click').on("click", function () {
            $('.zxSpan').html("请选择");
            $('.js_zxSpanFir').css('color', '#a8a8a8');
            $(".query").attr("disabled", true);
            $(".query").css('background', "url(http://img.gyyxcdn.cn/qibao/Images/querybtn.png)");
            $('.contrastRes').html('');
        });
        //点击查询按钮
        $(".query").click(function () {
            var FirString = $('#js_zxSpanFir').html();
            var SecString = $('#js_zxSpanSec').html();
            if (FirString == SecString) {
                $('.contrastRes').html("当前阵型配置，无克制或被克效果。").css('color', '#ffffff');
            } else if (FirString == '混元一气阵') {
                switch (SecString) {
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "天地三才阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "五行本源阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "太极八卦阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                }
            } else if (FirString == '阴阳两仪阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "天地三才阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "五行本源阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "太极八卦阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                }
            } else if (FirString == '天地三才阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "五行本源阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "太极八卦阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                }
            } else if (FirString == '四象玄黄阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "天地三才阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "五行本源阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "太极八卦阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                }
            } else if (FirString == '五行本源阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "天地三才阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "太极八卦阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                }
            } else if (FirString == '乾坤六合阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "天地三才阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "五行本源阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "太极八卦阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                }
            }else if (FirString == '七曜冲煞阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "天地三才阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "五行本源阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "太极八卦阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                }
            } else if (FirString == '太极八卦阵') {
                switch (SecString) {
                    case "混元一气阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "阴阳两仪阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "天地三才阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "四象玄黄阵":
                        return $('.contrastRes').html("被克，PVP战斗中敌方阵型技能效果翻倍").css('color', '#ad2028');
                    case "五行本源阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "乾坤六合阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                    case "七曜冲煞阵":
                        return $('.contrastRes').html("克制，PVP战斗中我方阵型技能效果翻倍").css('color', '#40fc40');
                }
            }
        });
        //轮询阵型图，改变背景颜色start
        var ul = document.getElementById('js_zxUl');
        try {
            var li = ul.children;
            for (var i = 0; i < li.length; i++) {
                li[i].style.background = i % 2 ? "#0f1112" : "#191d1e"
            }
        } catch (e) {
        }
      
       
        //轮询阵型图，改变背景颜色end

        //鼠标经过阵型图弹出悬浮框
        var floatFrame =
        '<div class="floatCon">' +
        '   <p class="floatFir">' +
        '       <span>满<c style="color:#ad2028">5</c>人队伍中即可生效。该阵所</span>' +
        '       <span>需伏羲铭文如下：</span>' +
        '   </p>' +
        '   <ul class="floatSec">' +
        '   </ul>' +
        '   <p class="floatThr">' +
        '       <span class="floatThrFir">基础属性：</span>' +
        '       <span>攻击+20%基础数值</span>' +
        '       <span>攻击+20%基础数值</span>' +
        '   </p>' +
        '   <p class="floatFou">' +
        '       <span class="floatCol">阵型技能：</span>' +
        '       <span>触发时扣除地方所有</span>' +
        '       <span>成员一定量的气血值，如果本方</span>' +
        '       <span>阵型克制敌方阵型，则扣除的气</span>' +
        '       <span>血值翻倍，仅在PVP战斗中生效</span>' +
        '   </p>' +
        '   <p class="floatFiv">' +
        '       <span class="floatCol">触发时机：</span>' +
        '       <span>怒气满的下回合触发</span>' +
        '   </p>' +
        '   <p class="floatSix">' +
        '       <span>说明：基础数值由铭文和角色等</span>' +
        '       <span>级决定</span>' +
        '   </p>' +
        '   <span class="top_left"></span>' +
        '   <span class="top_right"></span>' +
        '   <span class="bottom_left"></span>' +
        '   <span class="bottom_right"></span>' +
        '</div>';
        var Firstring = "", Secstring = "", Firstrings = "", Secstrings = "";
        //鼠标划入
        $('#templateString_role #js_zxUl li .formationImg').mouseenter("on", function () {
            Firstring = $(this).siblings('p').children('span').eq(0).html();
            Firstrings = Firstring.substring(0, Firstring.length - 1);
            Secstring = $(this).siblings('p').children('span').eq(1).html();
            Secstrings = Secstring.substring(0, Secstring.length - 1);
           
            var hidstring = $(this).parent().find('.HidArea').html();

            if ($(this).parents('#formationleftbg').attr("data-hover") != "1") {
                //$(this).parents('#js_zxUl').append(floatFrame);
                $(this).parents('#formationleftbg #js_zxUl').after(floatFrame);
            }
            $(this).parents('#formationleftbg').find('.floatCon .floatThr span:eq(1)').html(Firstrings);
            $(this).parents('#formationleftbg').find('.floatCon .floatThr span:eq(2)').html(Secstrings);
            //添加号门
            $(this).parents('#formationleftbg').find('.floatCon .floatSec ').html(hidstring);
            $(this).parents('#formationleftbg').find('.floatCon').show();
            $(this).parents('#formationleftbg').attr("data-hover", "1");
        });
        //鼠标移开
        $('#templateString_role #js_zxUl li .formationImg').mouseleave("on", function () {
            $('.floatCon').hide();
        });

        //判断相同名字的颜色变为白色
        for (var i = 0; i < $('.js_zxUlFir li').length; i++) {
            for (var j = 0; j < $('#js_zxUl li').length; j++) {
                if ($('.js_zxUlFir li').eq(i).text() == $('#js_zxUl li').eq(j).children('.formationName').text()) {
                    $('.js_zxUlFir li').eq(i).css('color', '#ffffff');
                }
            }
        }
        //判断相同名字的颜色变为白色end

        //判断伏羲阵型开始哪个被选中
        $('.othertab').off('click').on('click', function () {
            if ($("#b3 li").find('a').hasClass("on")) {
                if($("#b3 li").eq(0).find("span.kname").html()!="伏羲铭文" || $(".fuxi_durability").find("span").eq(0).html()=="" || $(".fuxi_durability").find("span").eq(1).html()==""){
                    $(".fuxi_durability").hide();
                }else{
                    $(".fuxi_durability").show();
                }
                
                if($("#b3 li").eq(0).find("span.kname").html()!="伏羲铭文" || $(".fuxi_exp").find("span").eq(0).html()==""){
                    $(".fuxi_exp").hide();
                }else{
                    $(".fuxi_exp").show();
                }
                var liLen = $("#b3 li").length;
                for (var i = 0; i < liLen; i++) {
                    if ($("#b3 li").eq(i).find('a').hasClass("on")) {
                        $('.fuxijianjie .firText').html($("#b3 li").eq(i).find('p').children('span:eq(0)').html());
                        $('.fuxijianjie .secText').html($("#b3 li").eq(i).find('p').children('span:eq(1)').html());
                    }
                }
            }
        });
        //判断伏羲阵型开始哪个被选中end
        //点击阵型中的某一个
        $("#b3 li").off('click').on('click', function () {
            if ($(this).find('a').hasClass("on")) {
                if($(this).find("span.kname").html()=="伏羲铭文" && $(".fuxi_durability").find("span").eq(0).html()!="" && $(".fuxi_durability").find("span").eq(1).html()!=""){
                     $('.fuxi_durability').css("display","block");
                }else{
                    $('.fuxi_durability').css("display","none");
                }
                if($(this).find("span.kname").html()=="伏羲铭文" && $(".fuxi_exp").find("span").eq(0).html()!=""){
                     $('.fuxi_exp').css("display","block");
                }else{
                     $('.fuxi_exp').css("display","none");
                }
                $('.fuxijianjie .firText').html($(this).find('p').find('span:eq(0)').html());
                $('.fuxijianjie .secText').html($(this).find('p').find('span:eq(1)').html());
               
            }
        });
        //点击阵型中的某一个end
    }
})(window);
