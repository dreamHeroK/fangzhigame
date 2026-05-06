/*-------------------------------------------------------------------------
 * 2017-2-27 by ligen
 * 独立道具xml解析
 -------------------------------------------------------------------------*/

(function () {
    var _num = 0;
    window.Xmlequip = {
        equipCallBack: function (data, par, suitpolarArr, polarArr) {
            var addDivDom = document.createElement('div');
            addDivDom.className = "daojuShowDetailInfo";
            addDivDom.style.display = "none";
            par.appendChild(addDivDom);
            var daojuShowDetailInfo = gy.getByClass("daojuShowDetailInfo", par)[0];
            //4：装备(其中不包括法宝 首饰 娃娃)
            //data为请求成功后返回的xml文档
            //执行getInnerNodeText方法 取得xml信息并返回json对象
            var JSONdata = getInnerNodeText(data);
            //执行compiled方法 传入json以及模板 执行拼接字符串方法
            compiled(JSONdata);

            //传一个参数最外层dom节点对象main，获取文档中所有节点的值 返回一个JSON对象
            function getInnerNodeText(main) {
                var htmlObjVal = {};
                eachInnerNode(arguments[0], htmlObjVal);
                _num = 0;
                return htmlObjVal;
            }

            //查找对象main下的所有元素节点对象
            //参数①：最外层节点对象main1
            //参数②：一个空对象，用来存放innerHTML
            function eachInnerNode(main1, obj1) {
                var main = arguments[0]; //保存第一个参数
                var obj = arguments[1];  //保存第二个参数
                obj["holes"] = {};
                var attribInfo = main.getElementsByTagName("attribs")[0];
                var main_children = gy.getChildren(attribInfo); //获取最外层节点的所有子节点
                var aLength = main_children.length; //当前子节点的长度
                var i = 0;
                var namecol = "";//装备名称颜色
                //遍历所有的子代元素，看其还有没有子代，如果有的话继续遍历子代，没有的话就返回当前元素的innerHTML
                for (i; i < aLength; i++) {
                    //nowEle 遍历中当前的节点
                    var nowEle = main_children[i];
                    //当前节点的子节点长度
                    var bLength = gy.getChildren(nowEle).length;
                    //根据当前节点的子节点长度判断，如果子节点长度大于0 就继续遍历，没有子节点的话 就获取他的innerHTML
                    if (bLength > 0) {
                        arguments.callee(nowEle, obj); //继续执行当前函数
                    } else {
                        var frorebuildLevel;
                        //nowEleNodeName 当前节点的名称
                        var nowEleNodeName = nowEle.nodeName.toLowerCase();
                        if (nowEleNodeName == "color") {
                            obj[nowEle.nodeName.toLowerCase()] = gy.getColor(gy.getxmlnodeText(nowEle));
                            namecol = gy.getColor(gy.getxmlnodeText(nowEle));

                        } else if (nowEleNodeName == "name") {
                            if (gy.getxmlnodeText(nowEle) == "银镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>普通银镯，质地良好，镯身刻<br />有几朵小花，用于娃娃练习时<br />使用娃娃装备技巧</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "祥云手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>镯身刻有几朵祥云，另配一根<br />红绳，通身祥瑞之气</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "心铃手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>银质手镯，镯身挂有两个心形<br />铃铛，铃响镯落，妖魔斩尽</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "镶金银镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>银镯上用金镶上祥云似的图案<br />，披金戴银，令娃娃战斗起来<br />勇气十足</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "双铃嵌玉银镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>镯身使用上等银材制成，在<br />镯身上嵌有4颗珍贵的蓝宝石<br />，娃娃有此装备，必定勇往直<br />前</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "玉镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>精美玉镯，玉质良好，娃娃使<br />用如鱼得水</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "翡翠手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>用翡翠制成的手镯，娃娃使用<br />起来一定得心应手</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "红玉手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>带有灵性的红玉制作而成的娃<br />娃手镯，能增加各项属性</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "琉璃手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>通灵的琉璃水晶，用此制作的<br />手镯必定不同凡响</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "镶金玉镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>上等的玉石配合手镯周身的镶<br />金，使得此手镯贵气十足</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "金铃手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此手镯为纯金打造，灵气十足<br />，攻击防御样样精通</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "双翼金镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此金镯附带两片金叶子，好似<br />双翼蓄势待飞</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "宝玉金镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>镶嵌着宝石的金制手镯，镯身<br />还挂有两颗带有灵气的金珠，<br />令使用者战无不胜</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "红宝炫铃镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>两颗金制铃铛挂在金镯左右，<br />镯身镶嵌着珍贵的红宝石，耀<br />眼夺目，令使用者攻无不破</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "幻影手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>幻影者，依光而存，因光而消。<br />此手镯能捕捉光影，产生如梦<br />如幻的效果，令对手不知所措</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "寒玉手镯") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>选用上古寒玉打造而成，为施<br />法者提供无穷的力量，令对手<br />心惊胆寒</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "粗布肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>比较粗糙的布料做成的肚兜，<br />可以用来抵御风寒</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "青花肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>绣着青花的肚兜，可以抵御一<br />定的攻击</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "蓝花肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>肚兜上绣着蓝色的花朵，可躲<br />避一定的攻击</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "逢缘肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>相逢是缘，故有此名。绿色的<br />布料穿起来甚为舒适，防护效<br />果不错</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "绣花白布肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>洁白的布料绣上美丽的花案，<br />再配以绿色的镶边，一看就非<br />同寻常</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "碎花肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>粉红色的布料，再绣上一些碎<br />花，令此肚兜光彩夺目，能抵<br />挡一定的伤害</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "水莲肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此肚兜上绣有栩栩如生的莲花<br />，水灵水灵的，具有一定的防<br />护能力</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "福慧肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>一个大大的福字绣在肚兜上，<br />令娃娃福德和智慧都达到一定<br />的境界</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "金边肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>肚兜以红色为底，金色为边，<br />中间绣字，灵性十足，让娃娃<br />穿上后必能水火不侵</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "赤焰肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此肚兜色彩鲜艳，好似红红的<br />火焰，兜上配以精美的花纹，<br />有防身护体之功效</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "紫衣青玉肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>这是稀有的紫色肚兜，胸前挂<br />有一块青玉，看似柔弱却防御<br />极佳</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "锦銮肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>金黄的底色配以一块青玉，看<br />似简单却不一般，有很强的防<br />护能力</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "金丝良玉肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>金丝制成的精美肚兜，周身配<br />有优良的玉石，其强大法力可<br />护佑主人毫发不伤</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "翡翠金甲肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>玄幻的紫色底布上配有镶嵌着<br />精美翡翠的金甲，非富贵豪门<br />不可拥有，使用此肚兜者可得<br />到无穷的法力</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "玄冥肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>玄冥者，所以名无而非无。似<br />有似无，拟虚拟幻，此肚兜周<br />围充满玄冥之气，令对手捉摸<br />不定</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "金蚕寒玉肚兜") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>选用罕见的金蚕丝为底布，再<br />镶嵌上充满灵气的北冥寒玉，<br />娃娃穿上后刀枪不入</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "银脚环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>普通的脚环，用于练习脚环的<br />基本技巧</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "双珠脚环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>脚环上粘有两颗银珠，可以增<br />加一定的属性</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "流云脚环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>简单的脚环上飘有一朵祥云，<br />拥有一定的攻击力</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "辟邪银环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>脚环上带有常人难以理解的形<br />状，相传具有辟邪功能</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "象牙脚环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>金丝绳上挂有几颗象牙和一块<br />美玉，穿上必能增强法力</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "水晶红环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>精美的红绳上串有几颗不规则<br />的水晶，拥有一定的法力</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "六福祥瑞环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>环身挂有六个金制福瑞之物，<br />可驱邪护身</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "青藤金铃环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>青藤制成的脚环，韧性十足，<br />再配以几个金铃，斩妖除魔，<br />轻而易举</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "赤金祥云脚环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>虽说金无足赤，但此金制脚<br />环却拥有极强的法力，再配以<br />祥云的色彩，戴之幸之</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "月影霜天") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>聚千年寒阴之气铸成，乃降妖<br />伏魔的利器</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "风清紫翼") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此脚环上带有几片类似翅膀的<br />东西，被击中者非死即残</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "精金紫水") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>金制的脚环上镶嵌着三颗精美<br />的紫水晶，唯大仁义者方可使<br />用自如</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "凤凰羽翼") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>相传为凤凰涅槃时掉落下来的<br />一片羽翼，再经过了七七四十<br />九天炼化而成，带有极强的灵<br />气</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "在天飞龙环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此环为上古龙鳞经过千年寒冰<br />之气铸成，使用者戴上后如飞<br />龙在天，左右逢源，战无不胜<br />，攻无不破</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "冰晶脚环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此环为上古冰川中沉睡亿万年的<br />晶体打磨而成，散发阵阵寒气<br />，预热而不化，令对手不寒而栗</span>";
                            } else if (gy.getxmlnodeText(nowEle) == "凤舞九天环") {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style='color:" + namecol + "; width:100%; display: block;'>" + gy.getxmlnodeText(nowEle) + "</span><span  style=' width:100%; display: block; text-align: left;'>此环由上古玄石千锤百炼打造<br />而成，取凤舞九天之形状，通<br />体环绕着炙热的火焰，令妖魔<br />鬼怪瞬间化为灰烬</span>";
                            } else {
                                obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + namecol + ">" + gy.getxmlnodeText(nowEle) + "</span>";
                            }

                        } else if (nowEleNodeName == "req_level") {
                            obj[nowEle.nodeName.toLowerCase()] = "要求等级：" + gy.getxmlnodeText(nowEle) + "<span style='display:block; color:#fff;'>角色要求：男/女娃娃</span>";
                        } else if (nowEleNodeName == "polar") {
                            obj[nowEle.nodeName.toLowerCase()] = polarArr[gy.getxmlnodeText(nowEle)];
                        } else if (nowEleNodeName == "source") {
                            obj[nowEle.nodeName.toLowerCase()] = gy.getxmlnodeText(nowEle) + "出品";
                        } else if (nowEleNodeName == "icon") {
                            obj[nowEle.nodeName.toLowerCase()] = gy.getxmlnodeText(nowEle);
                        } else if (nowEleNodeName == "seal_icon") {
                            obj[nowEle.nodeName.toLowerCase()] = '&nbsp;<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/4575.png" alt=""/>';
                        } else if (nowEleNodeName == "seal_pet_name") {
                            obj[nowEle.nodeName.toLowerCase()] = "封印魂魄：" + gy.getxmlnodeText(nowEle);
                        } else if (nowEleNodeName == "suit_polar") {
                            obj[nowEle.nodeName.toLowerCase()] = '&nbsp;<img src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/' + suitpolarArr[gy.getxmlnodeText(nowEle)] + '.png" alt=""/ style="width:12px;">';
                        } else if (nowEleNodeName == "holes") {
                            if (nowEle.getAttribute("color")) {//根据样式把镶嵌的宝石变灰去色
                                obj[nowEle.nodeName.toLowerCase()]["hole" + nowEle.getAttribute("pos")] = gy.getxmlnodeText(nowEle) + "_";
                            } else {
                                obj[nowEle.nodeName.toLowerCase()]["hole" + nowEle.getAttribute("pos")] = gy.getxmlnodeText(nowEle);
                            }
                        } else if (nowEleNodeName == "frozen_rebuild_level") {

                            frorebuildLevel = gy.getxmlnodeText(nowEle);

                        } else if (nowEleNodeName == "rebuild_level") {
                            if (frorebuildLevel > 0) {
                                if (gy.getxmlnodeText(nowEle) >= frorebuildLevel) {
                                    obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + namecol + ">(" + gy.getxmlnodeText(nowEle) + ")</span><span style=color:#7D7D7D>（改造冻结）</span>"
                                } else {//（frozen_rebuild_level·改造）”，比如“（7·冻结）
                                    obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + namecol + ">(" + gy.getxmlnodeText(nowEle) + ")</span><span style=color:#7D7D7D>（" + frorebuildLevel + "·冻结）</span>"
                                }
                            }else{
                                obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + namecol + ">(" + gy.getxmlnodeText(nowEle) + ")</span>";
                            }
                        } else if (nowEleNodeName == "super_evolve_level" || nowEleNodeName == "evolve_level") {
                            _num += parseInt(gy.getxmlnodeText(nowEle));
                            if (_num > 200) {
                                _num = 200;
                            }
                            if (_num > 0) {
                                var moon = parseInt(_num / 10); //商为月亮
                                var star = _num % 10; //余数为星星
                                obj["isevolvelevel"] = '&nbsp;' + gy.getStarMoon(moon, star);

                            } else {
                                obj["isevolvelevel"] = "";
                            }

                        } else if (nowEleNodeName == "property_bind_attrib") {
                            //装备专有图标(1、认主绑定 2、解绑中 3、临时解绑 4、永久绑定)
                            if (gy.getxmlnodeText(nowEle) == "1") {
                                obj[nowEle.nodeName.toLowerCase()] = '<br><img width="16" src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/6117.png" style="margin-left:100px; width:16px;">';
                            } else if (gy.getxmlnodeText(nowEle) == "2") {
                                obj[nowEle.nodeName.toLowerCase()] = '<br><img width="16" src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/6115.png" style="margin-left:100px; width:16px;">';
                            } else if (gy.getxmlnodeText(nowEle) == "3") {
                                obj[nowEle.nodeName.toLowerCase()] = '<br><img width="16" src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/6113.jpg" style="margin-left:100px; width:16px;">';
                            } else if (gy.getxmlnodeText(nowEle) == "4") {
                                obj[nowEle.nodeName.toLowerCase()] = '<br><img width="16" src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/6111.png" style="margin-left:100px; width:16px;">';
                            }
                        } else if (nowEleNodeName == "important_item") {
                            if (gy.getxmlnodeText(nowEle) == 1) {
                                obj[nowEle.nodeName.toLowerCase()] = '<img width="22" src="http://img.gyyxcdn.cn/qibao/Images/FlashImages/iptitem.png" class="iptimgs">';
                            }
                        } else if (nowEleNodeName == "fairy_class") {
                            if (gy.getxmlnodeText(nowEle) == 0) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span></span>'
                            } else if (gy.getxmlnodeText(nowEle) == 1) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>使用境界：天仙</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 2) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>使用境界：真仙</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 3) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>使用境界：金仙</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 4) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>使用境界：太乙金仙</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 5) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>使用境界：大罗金仙</span>'
                            }
                        } else if (nowEleNodeName == "fairy_layer") {
                            if (gy.getxmlnodeText(nowEle) == 0) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span></span>'
                            } else if (gy.getxmlnodeText(nowEle) == 1) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(一重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 2) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(二重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 3) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(三重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 4) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(四重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 5) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(五重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 6) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(六重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 7) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(七重)</span>'
                            } else if (gy.getxmlnodeText(nowEle) == 8) {
                                obj[nowEle.nodeName.toLowerCase()] = '<span>(八重)</span>'
                            }
                        } else if (nowEleNodeName == "limit_exchange_left_time") {
                            var limitTime = gy.getxmlnodeText(nowEle);
                            if (limitTime <= 60 * 60 * 23) {
                                limitTime = Math.ceil(limitTime / 3600) + "小时";
                            } else if (limitTime > 60 * 60 * 23 && limitTime <= 60 * 60 * 24) {
                                limitTime = Math.ceil(limitTime / 3600 / 24) + "天";
                            } else if (limitTime > 60 * 60 * 24) {
                                limitTime = Math.ceil(limitTime / 3600 / 24) + "天";
                            }
                            obj[nowEle.nodeName.toLowerCase()] = "<span style='color:red;'>" + limitTime + "</span>后解除限制交易";
                        }else if( nowEleNodeName == "shuxxls_times"){
                            console.log(gy.getxmlnodeText(nowEle))
                            if( gy.getxmlnodeText(nowEle) >= 1){
                                obj[nowEle.nodeName.toLowerCase()] = "无法洗练"
                            }else{
                                obj[nowEle.nodeName.toLowerCase()] = ""
                            }

                        } else {
                            //标签里面存在颜色信息的时候 给他套上一个标签定义样式
                            if (nowEle.getAttribute('color') && nowEle.getAttribute('color') != "") {

                                var color = gy.getColor(nowEle.getAttribute('color'));

                                if (obj.hasOwnProperty(nowEleNodeName)) {
                                    //console.log(nowEle.getAttribute('type')+'---'+gy.getxmlnodeText(nowEle));
                                    //nowEle.getAttribute('type') 看有没有type属性，部分存在type属性，其中存放的文字信息
                                    if (gy.getxmlnodeText(nowEle).indexOf(",") != -1) {//处理“所有相性 4 增加 (+1.02%)”这种格式，进行两次替换
                                        var index = gy.getxmlnodeText(nowEle).lastIndexOf(',');
                                        obj[nowEle.nodeName.toLowerCase()] += "<br/><span style=color:" + color + ">" + nowEle.getAttribute('type').replace(/%s%|%s/, gy.getxmlnodeText(nowEle).substring(0, index)).replace(/[(]%s[)]/, "") + "&nbsp;<span style='color:#ff2020'>(" + gy.getxmlnodeText(nowEle).substring((index + 1), gy.getxmlnodeText(nowEle).length) + ")</span></span>";
                                    } else {
                                        if (nowEleNodeName == "basic_attrib") {
                                            var idx = nowEle.getAttribute('type').lastIndexOf('：');
                                            obj[nowEle.nodeName.toLowerCase()] += "<br/><span>" + nowEle.getAttribute('type').substring(0, (idx + 1)) + "</span>" + "<span style=color:" + color + ">" + nowEle.getAttribute('type').substring((idx + 1), gy.getxmlnodeText(nowEle)).replace(/%s%|%s/, gy.getxmlnodeText(nowEle)) + "</span>";
                                        } else {
                                            nowEle.getAttribute('type') ? obj[nowEle.nodeName.toLowerCase()] += "<br/><span style=color:" + color + ">" + nowEle.getAttribute('type').replace(/%s%|%s/, gy.getxmlnodeText(nowEle)) + "</span>" : obj[nowEle.nodeName.toLowerCase()] += "<span style=color:" + color + ">" + gy.getxmlnodeText(nowEle) + "</span>";
                                        }
                                    }
                                } else {
                                    if (gy.getxmlnodeText(nowEle).indexOf(",") != -1) {//处理“所有相性 4 增加 (+1.02%)”这种格式，进行两次替换
                                        var inx = gy.getxmlnodeText(nowEle).lastIndexOf(',');
                                        obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + color + ">" + nowEle.getAttribute('type').replace(/%s%|%s/, gy.getxmlnodeText(nowEle).substring(0, inx)).replace(/[(]%s[)]/, "") + "&nbsp;<span style='color:#ff2020'>(" + gy.getxmlnodeText(nowEle).substring((inx + 1), gy.getxmlnodeText(nowEle).length) + ")</span></span>";
                                    } else {
                                        if (nowEleNodeName == "basic_attrib") {
                                            var _index = nowEle.getAttribute('type').lastIndexOf('：');
                                            obj[nowEle.nodeName.toLowerCase()] = "<span>" + nowEle.getAttribute('type').substring(0, (_index + 1)) + "</span>" + "<span style=color:" + color + ">" + nowEle.getAttribute('type').substring((_index + 1), gy.getxmlnodeText(nowEle)).replace(/%s%|%s/, gy.getxmlnodeText(nowEle)) + "</span>";
                                        } else {
                                            nowEle.getAttribute('type') ? obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + color + ">" + nowEle.getAttribute('type').replace(/%s%|%s/, gy.getxmlnodeText(nowEle)) + "</span>" : obj[nowEle.nodeName.toLowerCase()] = "<span style=color:" + color + ">" + gy.getxmlnodeText(nowEle) + "</span>";
                                        }
                                    }
                                }
                            } else { //不存在的时候
                                if (obj.hasOwnProperty(nowEleNodeName)) {
                                    //nowEle.getAttribute('type') 看有没有type属性，部分存在type属性，其中存放的文字信息
                                    nowEle.getAttribute('type') ? obj[nowEle.nodeName.toLowerCase()] += "<br/>" + nowEle.getAttribute('type').replace(/%s%|%s/, gy.getxmlnodeText(nowEle)) : obj[nowEle.nodeName.toLowerCase()] += gy.getxmlnodeText(nowEle);
                                } else {
                                    nowEle.getAttribute('type') ? obj[nowEle.nodeName.toLowerCase()] = nowEle.getAttribute('type').replace(/%s%|%s/, gy.getxmlnodeText(nowEle)) : obj[nowEle.nodeName.toLowerCase()] = gy.getxmlnodeText(nowEle);

                                }
                            }
                        }


                    }
                }
            }

            //传入两个参数 ①一个json数据 ②一个html模板结构  绑定json数据到模板上然后返回一个jquery对象
            function compiled(JSONdata) {

                //var hasNoneArr = [];
                //匹配模板
                var tempString = templateString.equip;
                var compiledString = tempString.replace(/@([\w_-]*)@/g, function (a, b) {
                    //如果json存在当前数据就返回这个数据，没有就返回空值并且把这个值放进数组
                    if (b == "hole1" || b == "hole2" || b == "hole3") {
                        if (JSONdata["holes"][b] != undefined) {
                            return JSONdata["holes"][b];
                        } else {
                            return "undefined";//如果没有hole属性，图片用undefined.png代替
                        }
                    }
                    if (JSONdata.hasOwnProperty(b)) {
                        return JSONdata[b];
                    } else {
                        if (b == "color" || b == "icon" || b == "exp_to_next_level" || b == "max_durability" || b == "suit_polar" || b == "seal_pet_name") {
                            return "";
                        }
                        //hasNoneArr.push(b);
                        return "";
                    }
                });

                //调用gy.parseHTML方法，将匹配好的html字符串转换为html文档对象
                var domCompiledString = gy.parseHTML(compiledString);

                daojuShowDetailInfo.appendChild(domCompiledString); //添加到dom中
                eqdatalist = domCompiledString;
                par.setAttribute("isGetXmlAjax", "true");//加载成功后 给他一个自定义属性，根据这个属性判断第二次就不需要加载ajax了
                // }

            }
        }
    }
})();
