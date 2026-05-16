#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
整合宠物成长、相性、天生技能数据，输出 pet_reference.json 和 pet_reference.md。
数据来源：src/game/battle/petGrowthTable.js + monsterProfiles.js + wendaoMapsConfig.js
"""

import json, os, sys

if hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass

INNATE_NAMES = {
    'bamiaozhuzhang': '拔苗助长',
    'fangweidujian': '防微杜渐',
    'youshuozhishe': '游说之舌',
    'tianshenshenli': '天生神力',
    'fanzhuanqiankun': '翻转乾坤',
    'shemingyiji': '舍命一击',
    'bianchangmoji': '鞭长莫及',
    'siwangchanmian': '死亡缠绵',
    'shenlongzhao': '神龙罩',
    'qiankunzhao': '乾坤罩',
    'ruyiquan': '如意圈',
    'mantianxuewu': '漫天血舞',
    'shiwanhuoji': '十万火急',
    'shenshengzenguang': '神圣之光',
}

INNATE_DESC = {
    '拔苗助长': '战斗中提升己方宠物成长，使下次升级获得更多成长点',
    '防微杜渐': '被攻击时有概率免疫负面状态（遗忘/中毒/冰冻/昏睡/混乱）',
    '游说之舌': '降低敌方宠物一项随机属性，持续数回合',
    '天生神力': '提高物理攻击，攻击时额外造成固定伤害',
    '翻转乾坤': '将己方与敌方气血/法力差值的一部分转移给自己',
    '舍命一击': '牺牲自身气血发动必杀，伤害与当前气血损失量成正比',
    '鞭长莫及': '对远程/法系敌方造成额外伤害，近战攻击无效果',
    '死亡缠绵': '战斗结束时若宠物被击倒，对击倒者持续造成伤害',
    '神龙罩': '为己方全体施加防护罩，降低所承受的伤害',
    '乾坤罩': '为全体友方宠物回复气血，回复量与宠物法力成正比',
    '如意圈': '降低敌方宠物速度，延迟其行动',
    '漫天血舞': '对全体敌方造成范围伤害',
    '十万火急': '极大提升己方速度，本回合必先手行动',
    '神圣之光': '驱散敌方宠物的增益状态，并短暂封印其天生技能',
}

PETS = [
    # 兰仙外 Lv1-18
    {'key':'qingwa','name':'青蛙','level':2,'map':'兰仙外','affinity':'水',
     'g':{'total':[135,225],'hp':[50,70],'mp':[50,70],'spd':[25,35],'pAtk':[-10,10],'mAtk':[20,40]},
     'innate':[]},
    {'key':'songshu','name':'松鼠','level':3,'map':'兰仙外','affinity':None,
     'g':{'total':[135,225],'hp':[40,60],'mp':[25,45],'spd':[35,45],'pAtk':[45,65],'mAtk':[-10,10]},
     'innate':[]},
    {'key':'tuzi','name':'兔子','level':6,'map':'兰仙外','affinity':'木',
     'g':{'total':[140,230],'hp':[55,75],'mp':[50,70],'spd':[25,35],'pAtk':[-10,10],'mAtk':[20,40]},
     'innate':[]},
    {'key':'she','name':'蛇','level':8,'map':'兰仙外','affinity':None,
     'g':{'total':[140,230],'hp':[40,60],'mp':[30,50],'spd':[35,45],'pAtk':[45,65],'mAtk':[-10,10]},
     'innate':[]},
    {'key':'houzi','name':'猴子','level':10,'map':'兰仙外','affinity':None,
     'g':{'total':[150,240],'hp':[40,60],'mp':[30,50],'spd':[40,50],'pAtk':[50,70],'mAtk':[-10,10]},
     'innate':[]},
    {'key':'shanmao','name':'山猫','level':11,'map':'兰仙外','affinity':'土',
     'g':{'total':[150,240],'hp':[45,65],'mp':[40,60],'spd':[35,45],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':[]},
    # 官道 Lv13-14
    {'key':'huli_guandao','name':'狐狸','level':13,'map':'官道','affinity':'木',
     'g':{'total':[150,240],'hp':[40,60],'mp':[40,60],'spd':[40,50],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':[]},
    {'key':'yegou','name':'野狗','level':14,'map':'官道','affinity':None,
     'g':{'total':[150,240],'hp':[45,65],'mp':[30,50],'spd':[35,45],'pAtk':[50,70],'mAtk':[-10,10]},
     'innate':[]},
    # 卧龙坡 Lv17-38
    {'key':'taojing','name':'桃精','level':17,'map':'卧龙坡','affinity':'木',
     'g':{'total':[160,250],'hp':[40,60],'mp':[60,80],'spd':[40,50],'pAtk':[-10,10],'mAtk':[30,50]},
     'innate':['bamiaozhuzhang']},
    {'key':'liugui','name':'柳鬼','level':18,'map':'卧龙坡','affinity':'木',
     'g':{'total':[160,250],'hp':[40,60],'mp':[60,80],'spd':[40,50],'pAtk':[-10,10],'mAtk':[30,50]},
     'innate':['bamiaozhuzhang']},
    {'key':'baiyuan','name':'白猿','level':22,'map':'卧龙坡','affinity':None,
     'g':{'total':[170,260],'hp':[65,85],'mp':[30,50],'spd':[25,35],'pAtk':[60,80],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun']},
    {'key':'ying','name':'鹰','level':23,'map':'卧龙坡','affinity':'金',
     'g':{'total':[170,260],'hp':[35,55],'mp':[60,80],'spd':[45,55],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':['tianshenshenli']},
    {'key':'haigui','name':'海龟','level':25,'map':'卧龙坡','affinity':'水',
     'g':{'total':[170,260],'hp':[80,100],'mp':[55,75],'spd':[15,25],'pAtk':[-10,10],'mAtk':[30,50]},
     'innate':['fangweidujian','youshuozhishe']},
    {'key':'bianfu','name':'蝙蝠','level':27,'map':'卧龙坡','affinity':'水',
     'g':{'total':[175,265],'hp':[40,60],'mp':[65,85],'spd':[40,50],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':['fangweidujian','mantianxuewu']},
    {'key':'mang','name':'蟒','level':30,'map':'卧龙坡','affinity':'火',
     'g':{'total':[185,275],'hp':[55,75],'mp':[60,80],'spd':[40,50],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':['shiwanhuoji','siwangchanmian']},
    {'key':'jiangshi','name':'僵尸','level':33,'map':'卧龙坡','affinity':None,
     'g':{'total':[185,275],'hp':[65,85],'mp':[30,50],'spd':[40,50],'pAtk':[60,80],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shemingyiji']},
    {'key':'guihuoying','name':'鬼火萤','level':38,'map':'卧龙坡','affinity':'木',
     'g':{'total':[190,280],'hp':[40,60],'mp':[65,85],'spd':[55,65],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':['bamiaozhuzhang','shenshengzenguang']},
    # 十里坡 Lv30-35
    {'key':'lang_slp','name':'狼（十里坡）','level':30,'map':'十里坡','affinity':None,
     'g':{'total':[190,280],'hp':[55,75],'mp':[30,50],'spd':[50,60],'pAtk':[65,85],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','siwangchanmian']},
    {'key':'laohu','name':'老虎（十里坡）','level':32,'map':'十里坡','affinity':None,
     'g':{'total':[190,280],'hp':[75,95],'mp':[30,50],'spd':[30,40],'pAtk':[65,85],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shemingyiji']},
    # 五派山头 Lv35
    {'key':'lang_wp','name':'狼（五派山头）','level':35,'map':'五派山头','affinity':None,
     'g':{'total':[190,280],'hp':[55,75],'mp':[30,50],'spd':[50,60],'pAtk':[65,85],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','siwangchanmian']},
    {'key':'laohu_wp','name':'老虎（五派山头）','level':35,'map':'五派山头','affinity':None,
     'g':{'total':[190,280],'hp':[75,95],'mp':[30,50],'spd':[30,40],'pAtk':[65,85],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shemingyiji']},
    # 五龙窟 Lv42-54
    {'key':'huayao','name':'花妖','level':42,'map':'五龙窟','affinity':'木',
     'g':{'total':[200,290],'hp':[55,75],'mp':[60,80],'spd':[50,60],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['bamiaozhuzhang','mantianxuewu','qiankunzhao']},
    {'key':'yuren','name':'鱼人','level':45,'map':'五龙窟','affinity':'水',
     'g':{'total':[200,290],'hp':[55,75],'mp':[65,85],'spd':[45,55],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['fangweidujian','youshuozhishe','siwangchanmian']},
    {'key':'wulong','name':'乌龙','level':42,'map':'五龙窟','affinity':'土',
     'g':{'total':[210,300],'hp':[60,80],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['bianchangmoji','shemingyiji','shenlongzhao']},
    {'key':'yanlong','name':'炎龙','level':45,'map':'五龙窟','affinity':'火',
     'g':{'total':[210,300],'hp':[60,80],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['shiwanhuoji','mantianxuewu','shenlongzhao']},
    {'key':'binglong','name':'冰龙','level':48,'map':'五龙窟','affinity':'水',
     'g':{'total':[210,300],'hp':[60,80],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['fangweidujian','youshuozhishe','shenlongzhao']},
    {'key':'dilieshou','name':'地裂兽','level':48,'map':'五龙窟','affinity':'土',
     'g':{'total':[205,295],'hp':[65,85],'mp':[60,80],'spd':[45,55],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['bianchangmoji','siwangchanmian','shemingyiji']},
    {'key':'qinglong','name':'青龙','level':51,'map':'五龙窟','affinity':'木',
     'g':{'total':[210,300],'hp':[60,80],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['bamiaozhuzhang','shenshengzenguang','shenlongzhao']},
    {'key':'jintoutuo','name':'金头陀','level':51,'map':'五龙窟','affinity':None,
     'g':{'total':[205,295],'hp':[60,80],'mp':[30,50],'spd':[45,55],'pAtk':[80,100],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shemingyiji','siwangchanmian']},
    {'key':'huanglong','name':'黄龙','level':54,'map':'五龙窟','affinity':'金',
     'g':{'total':[210,300],'hp':[60,80],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[45,65]},
     'innate':['tianshenshenli','shemingyiji','shenlongzhao']},
    {'key':'huoya','name':'火鸦','level':54,'map':'五龙窟','affinity':'火',
     'g':{'total':[210,300],'hp':[50,70],'mp':[65,85],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['shiwanhuoji','mantianxuewu','shenshengzenguang']},
    # 蓬莱岛 Lv50-52
    {'key':'juxi','name':'巨蜥','level':50,'map':'蓬莱岛','affinity':'火',
     'g':{'total':[215,305],'hp':[90,110],'mp':[65,85],'spd':[25,35],'pAtk':[0,20],'mAtk':[35,55]},
     'innate':['shiwanhuoji','youshuozhishe','shemingyiji']},
    {'key':'shimo','name':'石魔','level':52,'map':'蓬莱岛','affinity':None,
     'g':{'total':[215,305],'hp':[85,105],'mp':[30,50],'spd':[35,45],'pAtk':[75,95],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','siwangchanmian','ruyiquan']},
    # 幽冥涧 Lv57-58
    {'key':'quhun','name':'屈魂','level':57,'map':'幽冥涧','affinity':'木',
     'g':{'total':[220,310],'hp':[65,85],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['bamiaozhuzhang','siwangchanmian','ruyiquan']},
    {'key':'yuangui','name':'怨鬼','level':58,'map':'幽冥涧','affinity':'水',
     'g':{'total':[220,310],'hp':[65,85],'mp':[65,85],'spd':[50,60],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['fangweidujian','youshuozhishe','qiankunzhao']},
    # 百花谷 Lv62-81
    {'key':'fengyi','name':'粉衣仙子','level':62,'map':'百花谷','affinity':None,
     'g':{'total':[225,315],'hp':[80,100],'mp':[30,50],'spd':[45,55],'pAtk':[80,100],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shemingyiji','shenlongzhao']},
    {'key':'dianjing','name':'电精','level':63,'map':'百花谷','affinity':'火',
     'g':{'total':[230,320],'hp':[75,95],'mp':[50,70],'spd':[65,75],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['shiwanhuoji','mantianxuewu','ruyiquan']},
    {'key':'qingyi','name':'青衣仙子','level':65,'map':'百花谷','affinity':'木',
     'g':{'total':[225,315],'hp':[60,80],'mp':[70,90],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['bamiaozhuzhang','shenshengzenguang','mantianxuewu']},
    {'key':'yushou','name':'雨兽','level':66,'map':'百花谷','affinity':'水',
     'g':{'total':[230,320],'hp':[80,100],'mp':[55,75],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['fangweidujian','mantianxuewu','qiankunzhao']},
    {'key':'huangyi','name':'黄衣仙子','level':68,'map':'百花谷','affinity':'金',
     'g':{'total':[225,315],'hp':[60,80],'mp':[70,90],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['tianshenshenli','shenshengzenguang','shemingyiji']},
    {'key':'fengguai','name':'风怪','level':69,'map':'百花谷','affinity':'土',
     'g':{'total':[230,320],'hp':[75,95],'mp':[50,70],'spd':[60,70],'pAtk':[-10,10],'mAtk':[55,75]},
     'innate':['bianchangmoji','siwangchanmian','shenshengzenguang']},
    {'key':'hongyi','name':'红衣仙子','level':71,'map':'百花谷','affinity':'火',
     'g':{'total':[225,315],'hp':[60,80],'mp':[70,90],'spd':[60,80],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['shiwanhuoji','youshuozhishe','siwangchanmian']},
    {'key':'hongyao','name':'虹妖','level':72,'map':'百花谷','affinity':None,
     'g':{'total':[230,320],'hp':[70,90],'mp':[30,50],'spd':[60,70],'pAtk':[80,100],'mAtk':[-10,10]},
     'innate':['shenshengzenguang','qiankunzhao','siwangchanmian']},
    {'key':'ziyi','name':'紫衣仙子','level':74,'map':'百花谷','affinity':'土',
     'g':{'total':[225,315],'hp':[60,80],'mp':[70,90],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['bianchangmoji','shenshengzenguang','ruyiquan']},
    {'key':'xuenv','name':'雪女','level':75,'map':'百花谷','affinity':'水',
     'g':{'total':[230,320],'hp':[80,100],'mp':[55,75],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['fangweidujian','ruyiquan','shenshengzenguang']},
    {'key':'lanyi','name':'蓝衣仙子','level':77,'map':'百花谷','affinity':'水',
     'g':{'total':[225,315],'hp':[60,80],'mp':[70,90],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['fangweidujian','youshuozhishe','mantianxuewu']},
    {'key':'yunshou','name':'云兽','level':78,'map':'百花谷','affinity':None,
     'g':{'total':[230,320],'hp':[90,110],'mp':[30,50],'spd':[40,50],'pAtk':[80,100],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','mantianxuewu','qiankunzhao']},
    {'key':'baiyi','name':'白衣仙子','level':80,'map':'百花谷','affinity':None,
     'g':{'total':[225,315],'hp':[70,90],'mp':[30,50],'spd':[55,65],'pAtk':[80,100],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shemingyiji','siwangchanmian']},
    {'key':'leiguai','name':'雷怪','level':81,'map':'百花谷','affinity':'金',
     'g':{'total':[230,320],'hp':[75,95],'mp':[45,65],'spd':[60,70],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['tianshenshenli','shenshengzenguang','shenlongzhao']},
    # 绝人阵 Lv82-83
    {'key':'shiniuyao','name':'石牛妖','level':82,'map':'绝人阵','affinity':'土',
     'g':{'total':[235,325],'hp':[75,95],'mp':[75,95],'spd':[45,55],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['bianchangmoji','shemingyiji','siwangchanmian']},
    {'key':'kulou_zhanjiang','name':'骷髅战将','level':83,'map':'绝人阵','affinity':'木',
     'g':{'total':[235,325],'hp':[65,85],'mp':[70,90],'spd':[60,70],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['shenshengzenguang','siwangchanmian']},
    # 绝仙阵 Lv87-88
    {'key':'lanmaojushou','name':'蓝毛巨兽','level':87,'map':'绝仙阵','affinity':'水',
     'g':{'total':[235,325],'hp':[65,85],'mp':[75,95],'spd':[55,65],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['fangweidujian','youshuozhishe','shemingyiji']},
    {'key':'tanglangguai','name':'螳螂怪','level':88,'map':'绝仙阵','affinity':None,
     'g':{'total':[235,325],'hp':[65,85],'mp':[30,50],'spd':[60,70],'pAtk':[90,110],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','shenshengzenguang','ruyiquan']},
    # 地绝阵 Lv92-93
    {'key':'santouquanan','name':'三头巨犬','level':92,'map':'地绝阵','affinity':None,
     'g':{'total':[240,330],'hp':[80,100],'mp':[30,50],'spd':[65,75],'pAtk':[75,95],'mAtk':[-10,10]},
     'innate':['fanzhuanqiankun','youshuozhishe','qiankunzhao']},
    {'key':'shixuejuren','name':'嗜血巨人','level':93,'map':'地绝阵','affinity':'金',
     'g':{'total':[240,330],'hp':[65,85],'mp':[70,90],'spd':[60,70],'pAtk':[-10,10],'mAtk':[55,75]},
     'innate':['tianshenshenli','youshuozhishe','shiwanhuoji']},
    # 天绝阵 Lv97-98
    {'key':'lianmo','name':'炼魔','level':97,'map':'天绝阵','affinity':'火',
     'g':{'total':[245,335],'hp':[65,85],'mp':[75,95],'spd':[65,75],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['shiwanhuoji','shenshengzenguang','mantianxuewu']},
    {'key':'hanbingguai','name':'寒冰怪','level':98,'map':'天绝阵','affinity':'水',
     'g':{'total':[245,335],'hp':[75,95],'mp':[80,100],'spd':[45,55],'pAtk':[-10,10],'mAtk':[55,75]},
     'innate':['fangweidujian','shenshengzenguang','siwangchanmian']},
    # 海底迷宫 Lv102-103
    {'key':'xiabing','name':'虾兵','level':102,'map':'海底迷宫','affinity':'水',
     'g':{'total':[245,335],'hp':[70,90],'mp':[75,95],'spd':[60,70],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['shenshengzenguang','shenlongzhao','mantianxuewu']},
    {'key':'xiejiang','name':'蟹将','level':103,'map':'海底迷宫','affinity':None,
     'g':{'total':[245,335],'hp':[80,100],'mp':[30,50],'spd':[55,65],'pAtk':[90,110],'mAtk':[-10,10]},
     'innate':['shemingyiji','shenlongzhao','fangweidujian']},
    # 昆仑云海 Lv107-108
    {'key':'bingjinglonglinshou','name':'冰晶龙鳞兽','level':107,'map':'昆仑云海','affinity':'水',
     'g':{'total':[250,340],'hp':[90,110],'mp':[55,75],'spd':[55,65],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['mantianxuewu','fanzhuanqiankun']},
    {'key':'jinchiyuan','name':'金翅鸢','level':108,'map':'昆仑云海','affinity':'金',
     'g':{'total':[250,340],'hp':[80,100],'mp':[45,65],'spd':[70,80],'pAtk':[-10,10],'mAtk':[65,85]},
     'innate':['tianshenshenli','qiankunzhao','shenshengzenguang']},
    # 雪域冰原 Lv112-113
    {'key':'xuehu','name':'雪狐','level':112,'map':'雪域冰原','affinity':'木',
     'g':{'total':[250,340],'hp':[90,110],'mp':[50,70],'spd':[70,80],'pAtk':[-10,10],'mAtk':[50,70]},
     'innate':['bamiaozhuzhang','shenshengzenguang','ruyiquan']},
    {'key':'jianhun','name':'剑魂','level':113,'map':'雪域冰原','affinity':None,
     'g':{'total':[250,340],'hp':[80,100],'mp':[30,50],'spd':[70,80],'pAtk':[80,100],'mAtk':[-10,10]},
     'innate':['mantianxuewu','shenlongzhao','siwangchanmian']},
    # 稀有/高级宠物（特殊副本或任务）
    {'key':'huoguangshu','name':'火光鼠','level':None,'map':'特殊副本','affinity':'火',
     'g':{'total':[235,325],'hp':[75,95],'mp':[55,75],'spd':[60,70],'pAtk':[-10,10],'mAtk':[55,75]},
     'innate':['shiwanhuoji','youshuozhishe','ruyiquan']},
    {'key':'ziyan','name':'紫焰','level':None,'map':'特殊副本','affinity':'土',
     'g':{'total':[235,325],'hp':[70,90],'mp':[60,80],'spd':[55,65],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['bianchangmoji','shemingyiji','siwangchanmian']},
    {'key':'zhengshou','name':'狰兽','level':None,'map':'特殊副本','affinity':None,
     'g':{'total':[255,345],'hp':[90,110],'mp':[30,50],'spd':[50,60],'pAtk':[95,115],'mAtk':[-10,10]},
     'innate':['mantianxuewu','shenshengzenguang','qiankunzhao']},
    {'key':'diexian','name':'蝶仙','level':None,'map':'特殊副本','affinity':'火',
     'g':{'total':[255,345],'hp':[85,105],'mp':[50,70],'spd':[65,75],'pAtk':[-10,10],'mAtk':[65,85]},
     'innate':['shiwanhuoji','fanzhuanqiankun','ruyiquan']},
    {'key':'bangji','name':'蚌姬','level':None,'map':'特殊副本','affinity':'水',
     'g':{'total':[255,345],'hp':[95,115],'mp':[55,75],'spd':[55,65],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['fangweidujian','shenshengzenguang','qiankunzhao']},
    {'key':'shuimoshen','name':'水魔神','level':None,'map':'特殊副本','affinity':'水',
     'g':{'total':[255,345],'hp':[90,110],'mp':[45,65],'spd':[60,70],'pAtk':[-10,10],'mAtk':[70,90]},
     'innate':['fangweidujian','fanzhuanqiankun','ruyiquan']},
    {'key':'jinjiexie','name':'金甲蟹','level':None,'map':'特殊副本','affinity':'金',
     'g':{'total':[260,350],'hp':[90,110],'mp':[50,70],'spd':[75,85],'pAtk':[-10,10],'mAtk':[55,75]},
     'innate':['tianshenshenli','shenlongzhao','youshuozhishe']},
    {'key':'doumoxi','name':'斗魔蜥','level':None,'map':'特殊副本','affinity':'火',
     'g':{'total':[260,350],'hp':[100,120],'mp':[50,70],'spd':[55,65],'pAtk':[-10,10],'mAtk':[65,85]},
     'innate':['shiwanhuoji','mantianxuewu','qiankunzhao']},
    {'key':'huasheshou','name':'花蛇兽','level':None,'map':'特殊副本','affinity':None,
     'g':{'total':[260,350],'hp':[95,115],'mp':[50,70],'spd':[70,80],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['mantianxuewu','shenlongzhao','fanzhuanqiankun']},
    {'key':'huling','name':'狐灵','level':None,'map':'特殊副本','affinity':'土',
     'g':{'total':[260,350],'hp':[90,110],'mp':[50,70],'spd':[70,80],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['bianchangmoji','ruyiquan','youshuozhishe']},
    {'key':'zhenshuiguai','name':'镇水怪','level':None,'map':'特殊副本','affinity':'水',
     'g':{'total':[255,345],'hp':[90,110],'mp':[45,65],'spd':[60,70],'pAtk':[-10,10],'mAtk':[65,85]},
     'innate':['fangweidujian','shenlongzhao','siwangchanmian']},
    {'key':'qiutangxianzi','name':'丘塘仙子','level':None,'map':'特殊副本','affinity':'木',
     'g':{'total':[255,345],'hp':[85,105],'mp':[55,75],'spd':[55,65],'pAtk':[-10,10],'mAtk':[62,82]},
     'innate':['bamiaozhuzhang','ruyiquan','mantianxuewu']},
    {'key':'keyao','name':'蝌妖','level':None,'map':'特殊副本','affinity':'水',
     'g':{'total':[255,345],'hp':[92,112],'mp':[50,70],'spd':[58,68],'pAtk':[-10,10],'mAtk':[60,80]},
     'innate':['fangweidujian','youshuozhishe','shenlongzhao']},
    {'key':'fuling','name':'浮灵','level':None,'map':'特殊副本','affinity':'木',
     'g':{'total':[255,345],'hp':[60,80],'mp':[70,90],'spd':[55,65],'pAtk':[-10,10],'mAtk':[52,72]},
     'innate':['bamiaozhuzhang','shenshengzenguang','qiankunzhao']},
    {'key':'ying_bh','name':'鹰（百花谷）','level':None,'map':'百花谷','affinity':'金',
     'g':{'total':[170,260],'hp':[35,55],'mp':[60,80],'spd':[45,55],'pAtk':[-10,10],'mAtk':[40,60]},
     'innate':['tianshenshenli']},
]

GHOST_PETS = [
    # 炼狱 total=320
    {'key':'ghost_lianyu_xuemoa','name':'炼狱血魔','tier':'炼狱','role':'血族','tier_num':1,
     'g':{'total':320,'hp':110,'mp':70,'spd':65,'pAtk':10,'mAtk':65}},
    {'key':'ghost_lianyu_kuangmo','name':'炼狱狂魔','tier':'炼狱','role':'狂族','tier_num':1,
     'g':{'total':320,'hp':100,'mp':50,'spd':60,'pAtk':100,'mAtk':10}},
    {'key':'ghost_lianyu_lingmo','name':'炼狱灵魔','tier':'炼狱','role':'灵族','tier_num':1,
     'g':{'total':320,'hp':100,'mp':70,'spd':65,'pAtk':10,'mAtk':75}},
    {'key':'ghost_lianyu_fengmo','name':'炼狱风魔','tier':'炼狱','role':'风族','tier_num':1,
     'g':{'total':320,'hp':100,'mp':70,'spd':75,'pAtk':10,'mAtk':65}},
    # 雪傲 total=330
    {'key':'ghost_xueao','name':'雪傲血魔','tier':'雪傲','role':'血族','tier_num':2,
     'g':{'total':330,'hp':115,'mp':70,'spd':65,'pAtk':10,'mAtk':70}},
    {'key':'ghost_li_ao','name':'雪傲狂魔','tier':'雪傲','role':'狂族','tier_num':2,
     'g':{'total':330,'hp':100,'mp':50,'spd':60,'pAtk':110,'mAtk':10}},
    {'key':'ghost_ling_ao','name':'雪傲灵魔','tier':'雪傲','role':'灵族','tier_num':2,
     'g':{'total':330,'hp':100,'mp':70,'spd':65,'pAtk':10,'mAtk':85}},
    {'key':'ghost_feng_ao','name':'雪傲风魔','tier':'雪傲','role':'风族','tier_num':2,
     'g':{'total':330,'hp':100,'mp':70,'spd':80,'pAtk':10,'mAtk':70}},
    # 魅魂 total=345
    {'key':'ghost_xuemei','name':'魅魂血魂','tier':'魅魂','role':'血族','tier_num':3,
     'g':{'total':345,'hp':120,'mp':75,'spd':70,'pAtk':10,'mAtk':70}},
    {'key':'ghost_meihun','name':'魅魂狂魂','tier':'魅魂','role':'狂族','tier_num':3,
     'g':{'total':345,'hp':100,'mp':50,'spd':70,'pAtk':115,'mAtk':10}},
    {'key':'ghost_meiling','name':'魅魂灵魂','tier':'魅魂','role':'灵族','tier_num':3,
     'g':{'total':345,'hp':105,'mp':70,'spd':70,'pAtk':10,'mAtk':90}},
    {'key':'ghost_guimei','name':'魅魂风魂','tier':'魅魂','role':'风族','tier_num':3,
     'g':{'total':345,'hp':105,'mp':70,'spd':85,'pAtk':10,'mAtk':75}},
    # 阴阳 total=355
    {'key':'ghost_yinyang_xueshi','name':'阴阳血师','tier':'阴阳','role':'血族','tier_num':4,
     'g':{'total':355,'hp':125,'mp':70,'spd':75,'pAtk':10,'mAtk':75}},
    {'key':'ghost_yinyang_kuangshi','name':'阴阳狂师','tier':'阴阳','role':'狂族','tier_num':4,
     'g':{'total':355,'hp':105,'mp':50,'spd':70,'pAtk':120,'mAtk':10}},
    {'key':'ghost_yinyang_moshi','name':'阴阳魔师','tier':'阴阳','role':'灵族','tier_num':4,
     'g':{'total':355,'hp':105,'mp':70,'spd':75,'pAtk':10,'mAtk':95}},
    {'key':'ghost_yinyang_qishi','name':'阴阳奇师','tier':'阴阳','role':'风族','tier_num':4,
     'g':{'total':355,'hp':110,'mp':70,'spd':90,'pAtk':10,'mAtk':75}},
]

SCHOOL_SKILLS = {
    '金': {
        'B': ['金光乍现','金戈纵横','万箭穿心','霸道横推','逆天残刃'],
        'C': ['遗忘'],
        'D': ['提高物攻'],
    },
    '木': {
        'B': ['摘叶飞花','枝繁叶茂','落叶归根','百草缠身','鬼舞枯藤'],
        'C': ['中毒'],
        'D': ['回复气血'],
    },
    '水': {
        'B': ['滴水穿石','寒冰锥刺','冰雪飞舞','冰封千里','搅海翻江'],
        'C': ['冰冻'],
        'D': ['提高防御'],
    },
    '火': {
        'B': ['举火焚天','烈焰灼身','火龙缠绕','赤焰燃空','炼狱火海'],
        'C': ['昏睡'],
        'D': ['提高速度'],
    },
    '土': {
        'B': ['落土飞岩','岩石重压','黄沙蔽日','山崩地裂','石破天惊'],
        'C': ['混乱'],
        'D': ['提高躲闪'],
    },
}


def build_pet_json_record(p):
    innate_zh = [INNATE_NAMES.get(i, i) for i in p['innate']]
    return {
        'key': p['key'],
        'name': p['name'],
        'spawn_level': p['level'],
        'spawn_map': p['map'],
        'affinity': p['affinity'],
        'growth': {
            'total_min': p['g']['total'][0],
            'total_max': p['g']['total'][1],
            'hp_min': p['g']['hp'][0], 'hp_max': p['g']['hp'][1],
            'mp_min': p['g']['mp'][0], 'mp_max': p['g']['mp'][1],
            'spd_min': p['g']['spd'][0], 'spd_max': p['g']['spd'][1],
            'patk_min': p['g']['pAtk'][0], 'patk_max': p['g']['pAtk'][1],
            'matk_min': p['g']['mAtk'][0], 'matk_max': p['g']['mAtk'][1],
        },
        'innate_pool_ids': p['innate'],
        'innate_pool_zh': innate_zh,
        'school_skills': SCHOOL_SKILLS.get(p['affinity'], None),
        'ghost': False,
    }


def build_ghost_json_record(g):
    return {
        'key': g['key'],
        'name': g['name'],
        'ghost': True,
        'ghost_tier': g['tier'],
        'ghost_tier_num': g['tier_num'],
        'ghost_role': g['role'],
        'affinity': None,
        'growth': {
            'total': g['g']['total'],
            'hp': g['g']['hp'], 'mp': g['g']['mp'],
            'spd': g['g']['spd'],
            'patk': g['g']['pAtk'], 'matk': g['g']['mAtk'],
        },
        'innate_pool_ids': [],
        'innate_pool_zh': [],
        'school_skills': None,
    }


def fmt_range(lo, hi):
    if lo == hi:
        return str(lo)
    return f'{lo}~{hi}'


def make_markdown(pets, ghosts):
    lines = []
    lines.append('# 问道端游 宠物属性总览')
    lines.append('')
    lines.append('> 数据来源：游戏代码（petGrowthTable.js / monsterProfiles.js / wendaoMapsConfig.js）')
    lines.append('> 天生技能携带概率：普通宠 34%/技能，BOSS 48%/技能')
    lines.append('')

    lines.append('## 一、普通宠物')
    lines.append('')
    lines.append('### 成长说明')
    lines.append('- **总成长**：决定宠物整体强度档位，数值越高越强')
    lines.append('- **气血/法力**：影响 maxHp / maxMp 成长速率')
    lines.append('- **速度**：影响先手顺序')
    lines.append('- **物攻**：负数表示该宠物走法攻路线，物攻成长极低')
    lines.append('- **法攻**：负数同理，走物攻路线时法攻为负')
    lines.append('')

    header = '| 名称 | 地图 | 等级 | 五行 | 总成长 | 气血 | 法力 | 速度 | 物攻 | 法攻 | 天生技能池 |'
    sep    = '|------|------|------|------|--------|------|------|------|------|------|-----------|'
    lines.append(header)
    lines.append(sep)

    for p in pets:
        g = p['g']
        lv = str(p['level']) if p['level'] else '—'
        af = p['affinity'] or '无'
        innate_zh = '、'.join(INNATE_NAMES.get(i, i) for i in p['innate']) or '无'
        row = (f"| {p['name']} | {p['map']} | {lv} | {af} "
               f"| {fmt_range(*g['total'])} "
               f"| {fmt_range(*g['hp'])} "
               f"| {fmt_range(*g['mp'])} "
               f"| {fmt_range(*g['spd'])} "
               f"| {fmt_range(*g['pAtk'])} "
               f"| {fmt_range(*g['mAtk'])} "
               f"| {innate_zh} |")
        lines.append(row)

    lines.append('')
    lines.append('## 二、鬼宠（固定成长，无随机区间）')
    lines.append('')
    lines.append('鬼宠成长为固定值（不随机），共 4 档 × 4 族 = 16 种。')
    lines.append('四族定位：**血族**（高气血）、**狂族**（高物攻）、**灵族**（高法攻）、**风族**（高速度）')
    lines.append('')

    ghost_header = '| 名称 | 档位 | 族别 | 总成长 | 气血 | 法力 | 速度 | 物攻 | 法攻 |'
    ghost_sep    = '|------|------|------|--------|------|------|------|------|------|'
    lines.append(ghost_header)
    lines.append(ghost_sep)

    for gh in ghosts:
        g = gh['g']
        lines.append(f"| {gh['name']} | {gh['tier']} | {gh['role']} "
                     f"| {g['total']} | {g['hp']} | {g['mp']} "
                     f"| {g['spd']} | {g['pAtk']} | {g['mAtk']} |")

    lines.append('')
    lines.append('## 三、五行门派技能（宠物学习资格）')
    lines.append('')
    lines.append('宠物只能学习与自身**五行相性**相同的门派技能。无相性宠物无法学习门派技能。')
    lines.append('')
    lines.append('| 五行 | B系（攻击，5阶） | C系（控制） | D系（辅助） |')
    lines.append('|------|-----------------|------------|------------|')
    for el, sk in SCHOOL_SKILLS.items():
        b = ' → '.join(sk['B'])
        c = sk['C'][0]
        d = sk['D'][0]
        lines.append(f'| {el} | {b} | {c} | {d} |')

    lines.append('')
    lines.append('## 四、天生技能说明（共14种）')
    lines.append('')
    lines.append('| 技能名 | 说明 |')
    lines.append('|--------|------|')
    for kid, kzh in INNATE_NAMES.items():
        desc = INNATE_DESC.get(kzh, '')
        lines.append(f'| {kzh} | {desc} |')

    lines.append('')
    lines.append('## 五、成长档位速查')
    lines.append('')
    lines.append('| 档位 | 总成长范围 | 代表宠物 |')
    lines.append('|------|-----------|---------|')
    tiers = [
        ('入门', '135~230', '青蛙、松鼠、兔子、蛇'),
        ('初级', '150~270', '猴子、山猫、狐狸、野狗、桃精、柳鬼、白猿、鹰、海龟'),
        ('中级', '175~305', '蝙蝠、蟒、僵尸、鬼火萤、狼、老虎、五龙窟系列'),
        ('中高级', '220~325', '幽冥涧、百花谷全系列、绝人阵、绝仙阵'),
        ('高级', '240~340', '地绝阵、天绝阵、海底迷宫、昆仑云海、雪域冰原'),
        ('顶级', '255~350', '特殊副本稀有宠（蝶仙、斗魔蜥、水魔神等）'),
        ('鬼宠炼狱', '320（固定）', '炼狱血魔/狂魔/灵魔/风魔'),
        ('鬼宠雪傲', '330（固定）', '雪傲四族'),
        ('鬼宠魅魂', '345（固定）', '魅魂四族'),
        ('鬼宠阴阳', '355（固定）', '阴阳四师'),
    ]
    for tier_name, rng, reps in tiers:
        lines.append(f'| {tier_name} | {rng} | {reps} |')

    return '\n'.join(lines)


def main():
    here = os.path.dirname(os.path.abspath(__file__))

    json_records = [build_pet_json_record(p) for p in PETS]
    json_records += [build_ghost_json_record(g) for g in GHOST_PETS]

    out_json = os.path.join(here, 'pet_reference.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(json_records, f, ensure_ascii=False, indent=2)

    md = make_markdown(PETS, GHOST_PETS)
    out_md = os.path.join(here, 'pet_reference.md')
    with open(out_md, 'w', encoding='utf-8') as f:
        f.write(md)

    print(f'已写入 {len(PETS)} 种普通宠物 + {len(GHOST_PETS)} 种鬼宠')
    print(f'  JSON -> {out_json}')
    print(f'  MD   -> {out_md}')


if __name__ == '__main__':
    main()
