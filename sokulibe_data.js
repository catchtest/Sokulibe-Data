"use strict"
var db;
var localized = {};
var enums;
var skipDirty = true;
var dataTableOption = {
    "autoWidth": false,
    "order": [],
    "paging": false,
    "info": false,
    "language": {
        "search": "",
        "searchPlaceholder": "快速搜尋",
        "zeroRecords": "找不到符合的資料",
        "emptyTable": "無資料",
    }
};

(function($) {
	// 讀取Json
	var loadCount = 0;
	var loadSuccess = function() {
		if (++loadCount >= 3) {
			$(".loader").hide();
		}
	};
	
    $.getJSON('sokulibe_data.json', function(data) {
        db = data;
        loadSuccess();
    });

    $.getJSON('localize.zh-TW.json', function(data) {
        localized = data;
		loadSuccess();
    });
	
    $.getJSON('enums.zh-TW.json', function(data) {
        enums = data;
		loadSuccess();
    });

	// 綁定initial事件
    $("a[href='#unit']").one("click", initUnit);
    $("a[href='#accessory']").one("click", initAccessory);
    $("a[href='#weapon']").one("click", initWeapon);
    $("a[href='#event']").one("click", initEvent);
    $("a[href='#achievement']").one("click", initAchievement);
    $("a[href='#icons']").one("click", initIcons);
    $("a[href='#items']").one("click", initItems);
    $("a[href='#rune']").one("click", initRune);
    $("a[href='#expTab']").one("click", initExp);
    $("a[href='#tearsTab']").one("click", initTears);
    $("a[href='#unitListTab']").one("click", initUnitList);
    $("a[href='#accessoryListTab']").one("click", initAccessoryList);
    $("a[href='#weaponListTab']").one("click", initWeaponList);
    $("a[href='#abilityListTab']").one("click", initAbilityList);
	$("a[href='#limitbreakTab']").one("click", initLimitbreak);
	$("a[href='#monsterListTab']").one("click", initMonsterList);

    $("#monsterSkill > tbody, #skillBase > tbody").on("click", "a", function() {
        $(this).closest("table").find(".active").removeClass("active");
        $(this).closest("tr").addClass("active");
    });

    // 鍵盤事件
    $('.list-group').keydown(function(e) {
        var $items = $(this).find(".list-group-item");
        var $select = $items.filter(".active");
        if (!$select.length) return;
        switch (e.which) {
            case 37: // left
            case 38: // up
                e.preventDefault();
                $select.prev().click().focus();
                break;
            case 39: // right
            case 40: // down
                e.preventDefault();
                $select.next().click().focus();
                break;
            case 36: // home
                e.preventDefault();
                $items.first().click().focus();
                break;
            case 35: // end
                e.preventDefault();
                $items.last().click().focus();
                break;
            case 33: // pageup
                e.preventDefault();
                $select.prevAll("*:lt(27)").last().click().focus();
                break;
            case 34: // pagedown
                e.preventDefault();
                $select.nextAll("*:lt(27)").last().click().focus();
                break;
        }
    });

    $('.nav li').keydown(function(e) {
        switch (e.which) {
            case 37: // left
                e.preventDefault();
                $(this).prev().children('a').click().focus();
                break;
            case 39: // right
                e.preventDefault();
                $(this).next().children('a').click().focus();
                break;
        }
    });
}(jQuery));

// 初始化角色列表
function initUnit() {
    var htmls = [null, '', '', '', ''];
    for (var id in db.unit) {
        var data = db.unit[id];

        if (skipDirty && isDirtyUnit(data)) continue;

        var name = getUnitName(data);
        var job = getUnitJob(data);

        var itemHtml = listItemHtml(id, name, job, "loadUnitData(" + id + ");", '');
        htmls[data.rarity] += itemHtml;
    }
    for (var i = 1; i <= 4; i++) {
        $("#unitR" + i + " > .list-group").html(htmls[i]);
    }

    var $levelSelect = $("#unitLevelSelect");
    var html = '';
    for (var i = 1; i <= 200; i++) {
        html = "<option>" + i + "</option>" + html;
    }
    $levelSelect.html(html).val(200).change(function() {
        var id = current_unit;
        var level = this.value;
        var unitPower = calculateUnit(id, this.value);
        $("#hp_rate").progressRate(unitPower.hp, 15000);
        $("#atk_rate").progressRate(unitPower.atk, 10000);
        $("#agi_rate").progressRate(unitPower.agi, 1000);
        $("#knock_rate").progressRate(unitPower.knockback, 15000);
    });
}

// 初始化裝備列表
function initAccessory() {
    var htmls = ['', '', ''];

    for (var id in db.accessory) {
        // 隱藏未設定好的裝備
        if (skipDirty && isDirtyAccessory(id)) continue;

        var data = db.accessory[id];

        var name = getAccessoryName(id);
        var job = enums.weapon_job[data.job] + ' <div class="rarity">' + enums.rarity[data.rarity] + '</div>';
        var itemHtml = listItemHtml(id, name, job, "loadAccessoryData(" + id + ");");

        if (data.category == 1) { // 戒指
            if (data.rarity >= 4) {
                htmls[0] += itemHtml;
            } else {
                htmls[1] += itemHtml;
            }
        } else if (data.category == 2) { // 護符
            htmls[2] += itemHtml;
        }
    }
    $("#ringSR > .list-group").html(htmls[0]);
    $("#ringR > .list-group").html(htmls[1]);
    $("#talisman > .list-group").html(htmls[2]);
}

// 初始化武器列表
function initWeapon() {
    var htmls = ['', '', '', ''];
    for (var id in db.weapon) {
        var data = db.weapon[id];

        if (skipDirty && isDirtyWeapon(data)) continue;

        var name = data.name;
        // 不能裝備的武器
        if (data.job == -1) {
            var itemHtml = listItemHtml(id, name, enums.rarity[data.rarity], '');
            htmls[3] += itemHtml;
            continue;
        }
        var job = enums.weapon_job[data.job];
        var itemHtml = listItemHtml(id, name, job, "loadWeaponData(" + id + ");");

        if (data.rarity == 4) {
            htmls[0] += itemHtml;
        } else if (data.rarity == 3) {
            htmls[1] += itemHtml;
        } else if (data.rarity == 2) {
            htmls[2] += itemHtml;
        }
    }
    $("#weaponSR > .list-group").html(htmls[0]);
    $("#weaponHR > .list-group").html(htmls[1]);
    $("#weaponR > .list-group").html(htmls[2]);
    $("#weaponOther > .list-group").html(htmls[3]);

    var $levelSelect = $("#weaponLevelSelect");
    var $awakeningSelect = $("#weaponAwakeningSelect");
    var contentHtml = ''
    for (var i = 10; i >= 1; i--) {
        contentHtml += "<option>" + i + "</option>";
    }
    $levelSelect.html(contentHtml);
    contentHtml = ''
    for (var i = 4; i >= 0; i--) {
        contentHtml += "<option>" + i + "</option>";
    }
    $awakeningSelect.html(contentHtml);

    // 計算武器能力值
    $levelSelect.add($awakeningSelect).change(function() {
        var id = current_weapon;
        var level = $levelSelect.val();
        var awaken = $awakeningSelect.val();
        var weaponPower = calculateWeapon(id, level, awaken);
        $("#weaponHP_rate").progressRate(weaponPower.hp, 1000);
        $("#weaponATK_rate").progressRate(weaponPower.atk, 4000);
        $("#weaponAGI_rate").progressRate(weaponPower.agi, 1000);
    });
}

// 初始化關卡列表
function initEvent() {
    // 活動
    var $list = $("#eventTab > .list-group");
    var html = '';

    for (var id in db.event) {
		// 底下沒有任何一關，不要顯示
		if (!(id in db.event_multi_quest)) continue;
		
        var data = db.event[id];

        var name = data.name;
        var job = '';
        var itemHtml = listItemHtml(id, name, job, "loadEventData(" + id + ");");

        // 越後面的關卡排越前
        html = itemHtml + html;
    }
    $list.html(html);

    // 共鬥
    $list = $("#multiTab > .list-group");
    html = '';

    for (var mrcate in db.multi_quest) {
        for (var id in db.multi_quest[mrcate]) {
            var data = db.multi_quest[mrcate][id];

            var name = 'MR' + data.required_lv + '&nbsp;&nbsp;' + data.name;
            var job = String.Format("體力 {0}", data.stamina);
            var itemHtml = listItemHtml(id, name, job, "loadMultiData(" + id + ", " + mrcate + ");");

            // 越後面的關卡排越前
            html = itemHtml + html;
        }
    }
    $list.html(html);

    // 主線
    $list = $("#zoneTab > .list-group");
    html = '';
    for (var chapter in db.zone) {
        for (var id in db.zone[chapter]) {
            // 不知道為什麼第二章的內容跟第一章完全一樣，可能是copy，先隱藏
            if (chapter == 2) continue;

            var data = db.zone[chapter][id];

            var name = getStoryName(id);
            var job = String.Format("體力 {0}", data.stamina);
            var itemHtml = listItemHtml(id, name, job, "loadZoneData(" + id + ", " + chapter + ");");

            html += itemHtml;
        }
    }
    $list.html(html);

    // 支路
    $list = $("#battleStepTab > .list-group");
    html = '';

    for (var chapter in db.battle_step_difficulty) {
        for (var id in db.battle_step_difficulty[chapter]) {
            var data = db.battle_step_difficulty[chapter][id];

            var name = data.name;
            var job = String.Format("體力 {0}", data.stamina);
            var itemHtml = listItemHtml(id, name, job, "loadBattleStepData(" + id + ", " + chapter + ");");

            html += itemHtml;
        }
    }
    $list.html(html);

    // 單人經驗關
    $list = $("#expZoneTab > .list-group");
    html = '';

    for (var id in db.experience_zone) {
        var data = db.experience_zone[id];

        var name = data.name;
        var job = String.Format("體力 {0}", data.stamina);
        var itemHtml = listItemHtml(id, name, job, "loadExpZoneData(" + id + ");");

        html += itemHtml;
    }
    $list.html(html);
}

var storyNames;

function getStoryName(id) {
    if (storyNames == null) {
        // 修改原始資料結構變成單一物件，比較好處理
        storyNames = {};
        for (var story_id in db.quest) {
            for (var quest_id in db.quest[story_id]) {
                storyNames[quest_id] = db.quest[story_id][quest_id].name;
            }
        }
    }
    return storyNames[id];
}

// 初始化成就列表
function initAchievement() {
    var html = '';
    for (var id in db.mission) {
        var data = db.mission[id];

        var title = data.title;
        var comment = data.comment;
        var asset = getAsset(data.asset_type, data.asset_id, data.asset_value);

        html += tableRow([title, comment, asset]);
    }
    renderTable("achievementTable", html);
}

// 初始化徽章列表
function initIcons() {
    var html = '';
    for (var id in db.icons) {
        var data = db.icons[id];

        var name = data.name;
        var comment = data.comment;

        html += tableRow([name, comment]);
    }
    renderTable("iconsTable", html);
}

// 初始化道具列表
function initItems() {
    var html = '';
    for (var id in db.items) {
        var data = db.items[id];

        var name = data.name;
        var comment = data.comment.replaceAll('\n', '');

        html += tableRow([name, comment]);
    }
    renderTable("itemsTable", html);
}

// 初始化素材列表
function initRune() {
    var html = '';
    for (var id in db.rune) {
        var data = db.rune[id];

        var name = data.name;
        var comment = data.tips.replaceAll('\n', '');

        html += tableRow([name, comment]);
    }
    renderTable("runeTable", html);
}

// 初始化經驗列表
function initExp() {
    $("#mrExpTable > tbody").html(createExpTable(db.multi_rank, "point"));
    $("#unitExpTable > tbody").html(createExpTable(db.unit_exp, "exp"));
    $("#jobExpTable > tbody").html(createExpTable(db.job_lv, "exp"));
}

function createExpTable(data, attrName) {
    var html = '';
    var accumulate = 0;
    for (var level in data) {
        var value = data[level][attrName];
        accumulate += value;

        html += tableRow([level, value, accumulate]);
    }
    return html;
}

function listItemHtml(id, name, sub, onclick, cssClass) {
    if (cssClass == null) cssClass = '';
    return String.Format('<a href="#" data-id="{0}" onclick="{3}" class="list-group-item clearfix {4}">{1}<span class="pull-right">{2}</span></a>',
        id, name, sub, onclick, cssClass);
}

// 初始化妖精之淚交換所
function initTears() {
    var html = '';
    for (var id in db.tears_exchange) {
        var data = db.tears_exchange[id];

        var items = [];
        // 原始結構購買的物品可以多種，所以另外處理
        for (var i = 1; i <= 5; i++) {
            var prefix = "item" + i + "_";
            var type = data[prefix + "type"];
            if (type == 0) continue;
            items.push(getAsset(type, data[prefix + "id"], data[prefix + "value"]));
        }

        var name = items.join('<br />');
        var tears = data.price;
        var limit = parseInt(data.purchase_limit);

        html += tableRow([name, tears, limit]);
    }
    renderTable("tearsTable", html);
}

// 初始化角色一覽
function initUnitList() {
    var itemList = [];
    for (var id in db.unit) {
        var data = db.unit[id];

        if (skipDirty && isDirtyUnit(data)) continue;
        itemList.push(data);
    }

    // 以星數排序
    itemList = itemList.sort(function(a, b) {
        return b.rarity - a.rarity;
    });

    var html = '';
    for (var i = 0, len = itemList.length; i < len; i++) {
        var data = itemList[i];
        var maxLevel = enums.max_level[data.rarity];
        var unitPower = calculateUnit(data.id, maxLevel);
        var partner = '無';
        if (data.partner_id > 0) {
            var partnerData = db.unit[data.partner_id];
            partner = String.Format("<a href='#' onclick='showUnit({0});'>{1}</a>",
                partnerData.id,
                getUnitName(partnerData));
        }

        var list = [
            anchor(getUnitName(data), "showUnit(" + data.id + ")"),
            partner,
            anchor(data.cv, "quickSearch('" + data.cv + "')"),
            data.rarity,
            elementHtml(data.use_element),
            enums.job[data.job_id],
            unitPower.hp,
            unitPower.atk,
            unitPower.agi,
        ];
        html += tableRow(list);
    }
    renderTable("unitListTable", html);
}

function quickSearch(text) {
    var $input = $(".dataTables_filter:visible input");
    if ($input.val() == text) {
        text = '';
    }
    $input.val(text).keyup();
}

// 初始化裝備一覽
function initAccessoryList() {
    var itemList = [];
    for (var id in db.accessory) {
        var data = db.accessory[id];

        if (skipDirty && isDirtyAccessory(id)) continue;
        itemList.push(data);
    }

    // 以裝備種類、稀有度排序
    itemList = itemList.sort(function(a, b) {
        if (b.category > a.category) return -1;
        if (b.category < a.category) return 1;
        if (b.rarity > a.rarity) return 1;
        if (b.rarity < a.rarity) return -1;
        return 0;
    });

    var category = [null, '戒指', '護符'];
    var html = '';
    for (var index = 0, len = itemList.length; index < len; index++) {
        var data = itemList[index];

        var name = getAccessoryFirstName(data.id);
        if (name == null) {
            // 沒有滿前的名字，只顯示滿後的
            name = getAccessoryLastName(data.id)
        } else {
            name += '<br />' + getAccessoryLastName(data.id);
        }
        var list = [
            category[data.category],
            name,
            enums.rarity[data.rarity],
            enums.weapon_job[data.job],
        ];

        for (var i = 1; i <= 4; i++) {
            var magicID = data["magic" + i];
            var content = '';
            if (magicID > 0) {
                content = db.enchant_master[magicID].enchant_comment.i18n().replaceAll('\n', '<br />');
            }
            list.push(content);
        }

        html += tableRow(list);
    }
    renderTable("accessoryListTable", html);
}

// 初始化武器一覽
function initWeaponList() {
    var itemList = [];
    for (var id in db.weapon) {
        var data = db.weapon[id];

        if (skipDirty && isDirtyWeapon(data)) continue;
        if (data.job == -1) continue; // 不顯示武煉石等無法裝備的武器
        itemList.push(data);
    }

    // 以裝備職業、稀有度排序
    itemList = itemList.sort(function(a, b) {
        if (b.job > a.job) return -1;
        if (b.job < a.job) return 1;
        if (b.rarity > a.rarity) return 1;
        if (b.rarity < a.rarity) return -1;
        return 0;
    });
    var html = '';
    for (var index = 0, len = itemList.length; index < len; index++) {
        var data = itemList[index];
        var weaponMainSkill = db.weapon_mainskillbase[data.main_weapon_skill_id] || {};
        var weaponSubSkill = db.weapon_subskill[data.sub_weapon_skill_id] || {};
        var weaponPower = calculateWeapon(data.id, 10, 4);

        var list = [
            data.name,
            enums.rarity[data.rarity],
            enums.weapon_job[data.job],
            weaponPower.hp,
            weaponPower.atk,
            weaponPower.agi,
            weaponMainSkill.dmg,
            weaponMainSkill.break_,
            weaponSubSkill[1] == null ? '' : weaponSubSkill[1].comment.pre(),
            weaponSubSkill[5] == null ? '' : weaponSubSkill[5].comment.pre()
        ];

        html += tableRow(list);
    }
    renderTable("weaponListTable", html);
}

// 初始化特性一覽
function initAbilityList() {
    var unitAbility = {};

    for (var id in db.unit) {
        var data = db.unit[id];

        if (skipDirty && isDirtyUnit(data)) continue;

        for (var i = 1; i <= 4; i++) {
            var typeId = data['ability0' + i];
            if (typeId == 0) continue;

            var obj = unitAbility[typeId];
            if (obj == null) {
                unitAbility[typeId] = [];
                obj = unitAbility[typeId];
            }
            obj.push(anchor(getUnitName(data), "showUnit(" + id + ")"));
        }
    }

    var ability = [];
    var html = '';
    for (var id in db.ability) {
        var data = db.ability[id];
        var unitText = unitAbility[id] != null ? unitAbility[id].join('<br />') : '';
        var list = [
            data.name.replaceAll('\n', ''),
            data.comment.pre(),
            unitText,
        ];

        html += tableRow(list);
    }
    renderTable("abilityTable", html);
}

// 初始化突破一覽
function initLimitbreak() {
	for (var r = 1; r <= 4; r++) {
		// 因為倒算關係，先計算總和
		var data = enums.limitbreak[r];
		var startLevel = enums.max_level[r] / 2;
		var sum = 0;
		data.forEach(function (val) {
			sum += val;
		});
		
		var html = '';
		var tears = 0;
		
		html += tableRow([startLevel, '---', tears, sum]);
		
		data.forEach(function (val, index) {
			tears += val;
			sum -= val;
			html += tableRow([startLevel + (index + 1) * 5, val, tears, sum]);
		});
		
		$("#limitbreakR" + r + "Table > tbody").html(html);
	}
}

// 初始化怪物一覽
function initMonsterList() {
	var html = '';
    for (var id in db.monster) {
        var data = db.monster[id];
		var base = db.monster_base[data.base_id];
		
		var list = [base.name, data.hp, data.atk, data.agi];
		html += tableRow(list);
    }
	$("#monsterListTable > tbody").html(html);
}

// 判斷是否為尚未完成的裝備
function isDirtyAccessory(id) {
    var item = db.accessory_upgrade[id];
    var keys = Object.keys(item);
    // 因為出現了直接強化完成的武器，所以不能只判斷編號為1的了
    var first = db.accessory_upgrade[id][keys[0]];
    return first == null || first.flavor == null || first.flavor.length <= 4;
}

// 判斷是否為未完成的角色
function isDirtyUnit(data) {
    // 排除無法取得的一星無屬性角色
    if (data.rarity == 1 && data.use_element == 0) return true;
	// 排除沒有技能資料的角色
	if (db.unit_command[data.id] == null) return true;
	// 排除未設定對話的角色
	if (db.unit_comment[data.id].comment1 == 'ゲーム起動後初回遷移時　朝') return true;
    return false;
}

// 判斷是否為未完成的武器
function isDirtyWeapon(data) {
    // 隱藏未設定的武器
    if (data.hp == 1 && data.atk == 1 && data.agi == 1) return true;
    return false;
}

function getAccessoryName(id) {
    return getAccessoryFirstName(id) || getAccessoryLastName(id);
}

function getAccessoryFirstName(id) {
    var first = db.accessory_upgrade[id]["1"];
    if (first != null) {
        return first.name;
    }
    return null;
}

function getAccessoryLastName(id) {
    var item = db.accessory_upgrade[id];
    var keys = Object.keys(item);
    var last = db.accessory_upgrade[id][keys[keys.length - 1]];
    if (last != null) {
        return last.name;
    }
    return null;
}

function getUnitName(data) {
    return data.nickname + data.name;
}

function getUnitJob(data) {
    var elementText = data.use_element == 0 ? '　' : enums.element[data.use_element];
    return enums.unit_rarity[data.rarity] + ' ' + elementText + enums.job[data.job_id];
}

function getUnitJobComment(data) {
    return String.Format("<span class='comment'>（{0}）</span>", getUnitJob(data))
}

function getSkill(id, star) {
    for (var prop in db.skill) {
        if (db.skill[prop].base_id == id) {
            if (!star) return db.skill[prop]; // 一般技能
            else return db.skill[parseInt(prop) + 1]; // 星級技能
        }
    }
    return null;
}

function getSkillDesc(data) {
    return data.name + '<br />' + data.skill_tips.pre();
}

function getOugiDesc(data) {
    return data.name + '<br />' + data.ougi_tips.pre();
}

function loadDataEvent(id) {
    var $list = $(".list-group:visible");
    $list.parents(".row").find(".col-sm-9").show();
    setActive($list, id);
}

function setActive($list, id) {
    $list.children(".active").removeClass("active");
    $list.children("[data-id=" + id + "]").addClass("active");
}

function setTitle(main, sub) {
    $("h3.name:visible").html(String.Format("{0} <small>{1}</small>", main, sub));
}

function showUnit(id) {
    $("a[href='#unit']").click();
    var item = $("#unit").find("[data-id='" + id + "']");
    var list_id = item.parents(".tab-pane").first().attr("id");
    $("a[href='#" + list_id + "']").click();
    item.click().focus();
}

// 讀取角色資料
function loadUnitData(id) {
    loadDataEvent(id);
    current_unit = id;

    // 讀取故事
    $("#storyBlock").html(db.unit_story[id].story);

    var data = db.unit[id];
    setTitle(getUnitName(data), getUnitJob(data));
    $("#cv").html(data.cv);
    var partnerData = db.unit[data.partner_id];
    if (partnerData != null) {
        $("#partner").html(String.Format("<a href='#' onclick='showUnit({0});'>{1}</a>{2}",
            partnerData.id,
            getUnitName(partnerData),
            getUnitJobComment(partnerData)));
    } else {
        $("#partner").html('無');
    }

    $("#gender").html(
        data.gender == 1 ? '男' :
        data.gender == 2 ? '女' : '未設定');
    var sizeDesc =
        data.size == 1 ? "正常" :
        data.size > 1 ? "高大" :
        data.size >= 0.9 ? "稍矮" : "年幼";
    $("#unitSize").html(String.Format("{0} （{1}）", data.size, sizeDesc));
    $("#use_debuff").html(displayDebuff(data.use_debuff));

    var maxLevel = enums.max_level[data.rarity];
    var unitPower = calculateUnit(data.id, maxLevel);

    $("#max_level").html(String.Format("(Lv{0})", maxLevel));

    $("#hp").html(data.hp);
    $("#hp_grow").html(data.hp_grow);
    $("#hp_max").html(unitPower.hp);

    $("#atk").html(data.atk);
    $("#atk_grow").html(data.atk_grow);
    $("#atk_max").html(unitPower.atk);

    $("#agi").html(data.agi);
    $("#agi_max").html(unitPower.agi);

    $("#knock").html(data.knock_back_regist);
    $("#knock_grow").html(data.knock_back_grow);
    $("#knock_max").html(unitPower.knockback);

    $("#unitLevelSelect").change();

    for (var i = 1; i <= 4; i++) {
        var abilityHtml = '&nbsp;';
        var abilityID = data["ability0" + i];
        if (abilityID != 0) {
            var abilityData = db.ability[abilityID];
            abilityHtml = abilityData.name.replaceAll('\n', '') + '<br />' + abilityData.comment.pre();
        }
        $("#ability0" + i).html(abilityHtml);
    }

    for (var i = 1; i <= 3; i++) {
        var content = data["Characteristic" + i];
        if (!content.length) content = '&nbsp;';
        $("#characteristic" + i).html(content);
    }

    // 對話
    for (var i = 1; i <= 11; i++) {
        $("#comment" + i).html(db.unit_comment[id]["comment" + i].pre());
    }

    // 技能說明列表
    var command = db.unit_command[id];
    var $skillDesc = $("#skillDesc > tbody");
    $skillDesc.find("td").empty();

    // 技能能力列表
    var $skillBase = $("#skillBase > tbody");
    $skillBase.find("td").remove();
    $skillBase.children(".active").removeClass("active");

    for (var i = 0; i <= 6; i++) {
        if (command == null || command[i] == null) continue;

        var skill_base_id = command[i].skill_id;
        var skillData = getSkill(skill_base_id, false);
        $skillDesc.children("tr").eq(i).children("td").eq(0).html(getSkillDesc(skillData));
        $skillBase.children("tr").eq(i).append(getSkillTd(skill_base_id));

        skillData = getSkill(skill_base_id, true);
        $skillDesc.children("tr").eq(i).children("td").eq(1).html(getSkillDesc(skillData));
    }

    // 每次切換時清除項目
    $("#skillAtk").hide();

    // 奧義
    var ougiData = db.ougi[data.ougi_id];
    $skillDesc.children("tr").eq(7).children("td").eq(0).html(getOugiDesc(ougiData));
    $skillBase.children("tr").eq(7).append(getOugiTd(data.ougi_id));

    // 增加連結圖示，避免有人看不出有連結
    $skillBase.find("a").append("<i class='glyphicon glyphicon-link'></i>");

    // 技能強化素材
    var $skillRune = $("#skillRune > tbody");
    var $skillUpgrade = $("#skillUpgrade > tbody");
    var skillTotalRune = {};

    $skillRune.find("td").empty();
    for (var i = 0; i <= 7; i++) {
        if (command == null || command[i] == null) {
            continue;
        }
        var skill_id = command[i].skill_id;
        upgradeTotalRunes = {};

        for (var rankID in db.skill_upgrade[skill_id]) {
            if (rankID == 1) continue; // 原始狀態不用升級跟提升能力

            // 素材需求
            var rank = parseInt(rankID);
            var data_upgrade = db.skill_upgrade[skill_id][rankID];
            var html = getUpgradeRune(data_upgrade);
            $skillRune.children("tr").eq(i).children("td").eq(rank - 2).html(html);

            // 強化效果
            html = getUpgradeType(data_upgrade);
            $skillUpgrade.children("tr").eq(i).children("td").eq(rank - 2).html(html);
        }
        // 素材總和
        $skillRune.children("tr").eq(i).children("td").eq(3).html(displayTotalRune(upgradeTotalRunes));

        for (var rune_id in upgradeTotalRunes) {
            var prevCount = skillTotalRune[rune_id] || 0;
            skillTotalRune[rune_id] = prevCount + upgradeTotalRunes[rune_id];
        }
    }
    $("#skillTotalRune").html(displayTotalRune(skillTotalRune));

    // 抗性
    var data_resist = db.unit_resist[id];
    var $resistTable = $("#unitResist");
    for (var prop in data_resist) {
        if (prop == 'id') continue; // 跳過這個屬性
        var value = data_resist[prop];
        if (value > 0) {
            value = '<span class="strong">' + value + '</span>';
        } else if (value < 0) {
            value = '<span class="weak">' + value + '</span>';
        }
        $resistTable.find("." + prop).html(value);
    }
}

// 產生技能資料
function getSkillTd(base_id) {
    var data = db.skill_base[base_id];
    var skill_data = getSkill(base_id, false);
    var skill_star_data = getSkill(base_id, true);
    var name = anchor(skill_data.name, "loadSkillAtk(" + skill_data.id + ")") + "<br />" +
        anchor(skill_star_data.name, "loadSkillAtk(" + skill_star_data.id + ")")
    var list = [name,
        data.name,
        enums.skill_type[data.skill_type],
        data.dmg,
        data.cd,
        data.break_,
        data.hate,
        data.casttime,
        data.min_range + '-' + data.max_range
    ];
    return '<td>' + list.join('</td><td>') + '</td>';
}

// 產生奧義資料
function getOugiTd(id) {
    var data = db.ougi[id];
    var name = anchor(data.name, "loadOugiAtk(" + id + ")");
    var target = ['攻擊', '回復', '回復<br />攻擊'][data.target];
    var list = [name, '---', target, data.dmg, data.cd, data.break_, '---', '---', '---'];
    return '<td>' + list.join('</td><td>') + '</td>';
}

function loadSkillAtk(id) {
    var $table = $("#skillAtk");
    var data = db.skill_atk[id];
    commonLoadAtk($table, data);
}

function loadOugiAtk(id) {
    var $table = $("#skillAtk");
    var data = db.ougi_atk[id];
    commonLoadAtk($table, data);
}

function loadMonsterSkillAtk(id) {
    var $table = $("#monsterSkillAtk");
    var data = db.monster_skill_atk[id];
    commonLoadAtk($table, data);
	$table.find("tbody > tr, tfoot > tr").each(function(){
		$(this).children("td").last().hide();
	});
}

function commonLoadAtk($table, data) {
    var obj = getSkillAtkTd(data);
    $table.children("tbody").html(obj.body);
    $table.children("tfoot").html(obj.foot);
    $table.show();
}

function getSkillAtkTd(data) {
    var html = '';
    var sum_hit = 0;
    var sum_dmg = 0;
    var sum_gravity = 0;
    var sum_hate = 0;
    var sum_break = 0;
    var sum_knockback = 0;
    var sum_huge_knockback = 0;
    var sum_atk_type = '';
    var sum_element = '';
    var sum_effects = [];
    var sum_debuff = {};

    for (var id in data) {
        var hit = data[id];
        var effects = [];
        if (hit.air > 0) effects.push("擊飛");
        if (hit.down_atk > 0) effects.push("挖地");
        if (hit.g_bound > 0) effects.push("扣殺");
        if (hit.kirimomi > 0) effects.push("kirimomi"); // 大車輪的另一個讀法，幾乎沒技能用他，感覺像是廢棄欄位
        if (hit.daisharin > 0) effects.push("大車輪");
        if (hit.haritsuke > 0) effects.push("定身");
        if (hit.huge_knockback > 0) effects.push("擊退");

        var atkType = enums.atk_type[hit.atk_type];
        var elementType = elementHtml(hit.element);

        var hitType = hit.hit_type;
        if (hitType == null) { // 奧義的情形
            hitType = enums.skill_type[hit.skill_type + 1];
        } else {
            hitType = hit.hit_type == 0 ? '攻擊' :
                hit.hit_type == 1 ? '回復' : hit.hit_type;
        }

        if (hitType == '攻擊' || hitType == 3) {
            // 似乎是遊戲為了修正問題作的假frame，所以直接跳過
            if (hit.dmg == 0) continue;

            sum_dmg += hit.dmg;
            sum_hit++;
            sum_gravity += hit.gravity;
            sum_hate += hit.hate;
            sum_break += hit.break_;
            sum_knockback += hit.knockback;
            sum_huge_knockback += hit.huge_knockback;
            if (!sum_atk_type.length) {
                sum_atk_type = atkType;
            }
            if (!sum_element.length) {
                sum_element = elementType;
            }
            effects.forEach(function(text) {
                if (sum_effects.indexOf(text) < 0) {
                    sum_effects.push(text);
                }
            });
        }

        var hold_effect = [];
        for (var i = 1; i <= 3; i++) {
            var type = hit['hold_type' + i];
            if (type == null || type == 0) {
                continue;
            }
            var value = hit['hold_value' + i];
            var text = '';
            switch (type) {
                case 1:
                    text = atkUp("傷害", value);
                    break;
                case 8:
                    text = atkUp("破盾值", value);
                    break;
                case 16:
                    text = "大車輪";
                    break;
                default:
                    text = String.Format("type:{0} value:{1}", type, value);
                    break;
            }
            hold_effect.push(text);
        }
        // 計算debuff總和，雖然一招大概只有一種負面狀態
        // 但為了擴充方便還是設計成允許多種負面狀態
        if (hit.debuff > 0) {
            var prevValue = sum_debuff[hit.debuff] || 0;
            sum_debuff[hit.debuff] = prevValue + hit.debuff_value;
        }

        var list = [hit.hit_num,
            hitType,
            hit.dmg,
            hit.recovery_debuff_id == 0 ? '' : debuffHtml(hit.recovery_debuff_id),
            displaySkillBuff(hit.buff, hit.buff_value, hit.buff_time),
            displaySkillDebuff(hit.debuff, hit.debuff_value, hit.debuff_time),
            atkType,
            elementType,
            hit.gravity,
            hit.hate,
            hit.break_,
            effects.join('<br />'),
            hit.knockback,
            hit.huge_knockback,
			hit.power_x + ', ' + hit.power_y,
            hold_effect.join('<br />'),
        ];
        html += tableRow(list);
    }
    // 都是空的會讓樣式錯誤，給一個空的tr
    if (!html.length) {
        html = '<tr></tr>';
    }

    var footer = '';
    if (sum_hit > 0) { // 有攻擊才計算總合
        var html_debuff = '';
        for (var debuff_id in sum_debuff) {
            if (html_debuff.length) html_debuff += '<br />';
            html_debuff += displaySkillDebuff(debuff_id, sum_debuff[debuff_id], 0);
        }

        var footerList = [
            String.Format("{0} Hits", sum_hit),
            '',
            sum_dmg,
            '',
            '',
            html_debuff,
            sum_atk_type,
            sum_element,
            sum_gravity,
            sum_hate,
            sum_break,
            sum_effects.join('<br />'),
            isNaN(sum_knockback) ? '' : sum_knockback,
            isNaN(sum_huge_knockback) ? '' : sum_huge_knockback,
			'',
            '',
        ];
        footer = tableRow(footerList);
    }

    return {
        body: html,
        foot: footer
    };
}

function displaySkillBuff(buff, value, time) {
    var text;
    switch (buff) {
        case 0:
            return '';
        case 1:
            text = atkUp("速度", value);
            break;
        case 2:
            text = String.Format("冷卻時間 - {0}%", 100 - value);
            break;
        case 3:
            text = "無敵";
            break;
        case 4:
            text = atkUp("火屬性攻擊", value);
            break;
        case 5:
            text = atkUp("水屬性攻擊", value);
            break;
        case 6:
            text = atkUp("地屬性攻擊", value);
            break;
        case 7:
            text = atkUp("光屬性攻擊", value);
            break;
        case 8:
            text = atkUp("暗屬性攻擊", value);
            break;
        case 9:
            text = defUp("火屬性耐性", value);
            break;
        case 10:
            text = defUp("水屬性耐性", value);
            break;
        case 11:
            text = defUp("地屬性耐性", value);
            break;
        case 12:
            text = defUp("光屬性耐性", value);
            break;
        case 13:
            text = defUp("暗屬性耐性", value);
            break;
        case 14:
            text = "毒武器化 + " + value;
            break;
        case 15:
            text = "麻痺武器化 + " + value;
            break;
        case 16:
            text = "腐蝕武器化 + " + value;
            break;
        case 17:
            text = defUp("緩慢回復", value);
            break;
        case 20:
            text = "擊倒無效";
            break;
        case 23:
            text = "毒無效";
            break;
        case 24:
            text = "麻痺無效";
            break;
        case 25:
            text = "冰結無效";
            break;
        case 26:
            text = "火傷無效";
            break;
        case 27:
            text = "浮遊無效";
            break;
        case 28:
            text = "詛咒無效";
            break;
        case 29:
            text = "沉默無效";
            break;
        case 30:
            text = atkUp("攻擊", value);
            break;
        case 31:
            text = String.Format("受到傷害 - {1}%", text, 100 - value);
            break;
        default:
            return String.Format("{0} {1} {2}", buff, value, time);
    }
    return text + timeFormat(time);
}

function atkUp(text, value) {
    return String.Format("{0} + {1}%", text, value - 100);
}

function defUp(text, value) {
    return String.Format("{0} + {1}%", text, value);
}

function timeFormat(time) {
    return String.Format('<div class="duration">持續時間：{0}</div>', time);
}

function displaySkillDebuff(debuff, value, time) {
    if (debuff == 0) return '';
    return debuffHtml(debuff) + ' ' + value; // 時間因為沒技能用到就不顯示了
}

// 讀取裝備資料
function loadAccessoryData(id) {
    loadDataEvent(id);

    $(".table:visible tbody td").empty();

    var data = db.accessory[id];

    // 效果
    for (var i = 1; i <= 4; i++) {
        var magicID = data["magic" + i];
        var content = '&nbsp;';
        if (magicID > 0) {
            content = db.enchant_master[magicID].enchant_comment.i18n().replaceAll('\n', '<br />');
        }
        $("#magic" + i).html(content);
    }

    // 說明跟強化素材
    setTitle(getAccessoryName(id), enums.rarity[data.rarity]);

    upgradeTotalRunes = {};
    for (var rank in db.accessory_upgrade[id]) {
        var u = db.accessory_upgrade[id][rank];
        $("#rank" + rank).html(u.name + u.flavor.pre());
        $("#rune" + rank).html(getUpgradeRune(u));
    }
    $("#runeTotal").html(displayTotalRune(upgradeTotalRunes));
}

function displayTotalRune(obj) {
    var runeList = [];
    for (var id in obj) {
        runeList.push(db.rune[id].name + obj[id].display());
    }
    return runeList.join('<br />');
}

// 取得裝備或技能的強化素材清單
function getUpgradeRune(data) {
    var runes = {};
    for (var j = 1; j <= 3; j++) {
        var runeID = data["upgrade_rune" + j];
        if (runeID == 0) continue;

        var count = data["upgrade_rune_value" + j];
        runes[runeID] = count;

        var prevCount = upgradeTotalRunes[runeID] || 0;
        upgradeTotalRunes[runeID] = prevCount + count;
    }
    return displayTotalRune(runes);
}

// 強化素材加總
var upgradeTotalRunes = {};

// 取得技能強化效果
function getUpgradeType(data) {
    var list = [];
    for (var j = 1; j <= 3; j++) {
        var type = data["upgrade_type" + j];
        if (type == 0) continue;
        var value = data["upgrade_value" + j];

        var text = '';
        switch (type) {
            case 1:
                text = effectIncrease("傷害", value);
                break;
            case 2:
                text = effectDecrease("技能冷卻時間", value);
                break;
            case 3:
                text = effectIncrease("強化效果持續時間", value);
                break;
            case 4:
                text = effectIncrease("強化效果增加量", value);
                break;
            case 5:
                text = effectIncrease("狀態異常積蓄量", value);
                break;
            case 6:
                text = effectDecrease("技能命中時，敵方重力", value);
                break;
            case 7:
                text = effectIncrease("破盾值", value);
                break;
            case 8:
                text = effectIncrease("技能命中時，浮空值", value);
                break;
            case 9:
                text = effectIncrease("敵人攻擊時推力", value);
                break;
            case 10:
                text = effectDecrease("詠唱時間", value);
                break;
            case 11:
                text = effectDecrease("蓄力時間", value);
                break;
            case 12:
                text = effectIncrease("敵人仇恨值", value);
                break;
            default:
                text = String.Format("type: {0} value: {1}", type, value);
                break;
        }
        if (!!text) {
            list.push(text);
        }
    }
    if (list.length) {
        return list.join("<br />");
    }
}

function effectIncrease(text, value) {
    return String.Format("{0} + {1}%", text, value - 100);
}

function effectDecrease(text, value) {
    return String.Format("{0} - {1}%", text, 100 - value);
}

// 讀取武器資料
function loadWeaponData(id) {
    loadDataEvent(id);
    current_weapon = id;

    var data = db.weapon[id];
    setTitle(data.name, enums.rarity[data.rarity]);

    ['HP', 'ATK', 'AGI'].forEach(function(e) {
        var e1 = e.toLowerCase();

        var base = data[e1];
        var grow = data[e1 + "_grow"];
        var awakening = data[e1 + "_awakening_rate"];
        $("#weapon" + e).html(base);
        $("#weapon" + e + "_grow").html(grow);
        $("#weapon" + e + "_awakening").html(awakening);
        var maxValue = calculateWeaponProperty(base, grow, awakening, 10, 4);
        $("#weaponMax" + e).html(maxValue);
    });
    $("#weaponLevelSelect").change();

    // 武器主技能
    if (data.main_weapon_skill_id != 0) {
        var weaponMainSkill = db.weapon_mainskillbase[data.main_weapon_skill_id];
		var upgrade = db.weapon_mainskill_upgrade[data.main_weapon_skill_id];
		
        $("#weaponMainSkill").html(weaponMainSkill.name + '<br />' + upgrade["1"].skill_tips.pre());

        ['dmg', 'cd', 'break_', 'hate', 'casttime'].forEach(function(name) {
            $("#weaponMainSkill_" + name).html(weaponMainSkill[name]);
        });
        $("#weaponMainSkill_range").html(weaponMainSkill.min_range + '-' + weaponMainSkill.max_range);
        $("#weaponMainSkillType").html(enums.skill_type[weaponMainSkill.skill_type]);
        $("#weaponMainSkillCount").html(data.normal_mws_value + "（最大：" + data.awakening_mws_value + "）");
		
		// 計算武器技威力帳面數值
		// 威力好像固定是1.1/1.2/1.3/1.5
		// 暗狂斧紀錄的是增加破盾威力但帳面威力仍然遵照規則，所以先寫死
		var powerList = [];
		[100, 110, 120, 130, 150].forEach(function(ratio){
			powerList.push((weaponMainSkill.dmg * ratio).toFixed(0));
		});
		$("#weaponMainSkillPower").html(powerList.join('→'));
		
        commonLoadAtk($("#weaponSkillAtk"), db.weapon_mainskill_atk[data.main_weapon_skill_id]);

    } else {
        $("[id^=weaponMainSkill]").empty();
        $("#weaponMainSkill").html('無');
        $("#weaponSkillAtk").hide();
    }

    // 武器副技能
    if (data.sub_weapon_skill_id != 0) {
        var data_sub = db.weapon_subskill[data.sub_weapon_skill_id];
        for (var i in data_sub) {
            $("#weaponSubSkill" + i).html(data_sub[i].name + '<br />' + data_sub[i].comment.pre());
        }
    } else {
        $("[id^=weaponSubSkill]").empty();
    }
}

// 讀取活動資料
function loadEventData(id) {
    loadDataEvent(id);

    var data = db.event[id];
    var data_quest = db.event_multi_quest[id];
    setTitle(data.name, '');

    var $list = $("#questList");
    var html = '';

    for (var questID in data_quest) {
        var quest = data_quest[questID];
        var sub = String.Format('WAVE {0}&nbsp;&nbsp;體力 {1}', Object.keys(db.event_quest_wave[questID]).length, quest.stamina);
        var itemHtml = listItemHtml(quest.id, quest.name, sub, "loadQuestData(" + id + ", " + quest.id + ");");
        html = itemHtml + html; // 難度越高排越上面
    }
    $list.html(html);

    var item = $list.find(".list-group-item").first();
    if (item.length) {
        item.click();
    } else {
        // 清空原有資料
        $(".table:visible").find("tbody td").empty();
    }

}

// 讀取共鬥資料
function loadMultiData(id, mrcate) {
    loadDataEvent(id);

    var baseData = db.multi_quest[mrcate][id];
    var missionData = db.multi_quest_mission[id];
    var dropData = db.multi_quest_drop[id];
    var waveData = db.multi_quest_wave[id];

    loadCommonQuestData(baseData, missionData, dropData, waveData);

    setTitle(String.Format("MR{0} {1}", baseData.required_lv, baseData.name), '');
    $("#Recom_lv, #first_clear_bonus, #continue_limit, #required_lv").closest("tr").show();
    $("#raid_point").closest("tr").hide();
    $("#questTab").hide().find("a:first").tab('show');
    $("#questList").hide();
}

// 讀取主線資料
function loadZoneData(id, chapter) {
    loadDataEvent(id);

    var baseData = db.zone[chapter][id];
    var missionData = db.zone_mission[id];
    var dropData = db.zone_drop[id];
    var waveData = db.zone_wave[id];

    loadCommonQuestData(baseData, missionData, dropData, waveData);

    setTitle(getStoryName(id), '');
    singleQuestField();
}

// 讀取支路資料
function loadBattleStepData(id, chapter) {
    loadDataEvent(id);

    var baseData = db.battle_step_difficulty[chapter][id];
    var missionData = null;
    var dropData = db.battle_step_drop[id];
    var waveData = db.battle_step_wave[id];

    loadCommonQuestData(baseData, missionData, dropData, waveData);

    setTitle(baseData.name, '');
    singleQuestField();
}

// 讀取單人經驗關資料
function loadExpZoneData(id) {
    loadDataEvent(id);

    var baseData = db.experience_zone[id];
    var missionData = db.experience_zone_mission[id];
    var dropData = db.experience_zone_drop[id];
    var waveData = db.experience_zone_wave[id];

    loadCommonQuestData(baseData, missionData, dropData, waveData);

    setTitle(baseData.name, '');
    singleQuestField();
}

function singleQuestField() {
    $("#Recom_lv").closest("tr").show();
    $("#raid_point, #first_clear_bonus, #multi_exp, #continue_limit, #required_lv").closest("tr").hide();
    $("#questTab").hide().find("a:first").tab('show');
    $("#questList").hide();
}

var current_unit;
var current_quest;
var current_weapon;

// 讀取活動某關卡資料
function loadQuestData(eventID, questID) {
    setActive($("#questList"), questID);

    var baseData = db.event_multi_quest[eventID][questID];
    var missionData = db.event_quest_mission[questID];
    var dropData = db.event_quest_drop[eventID][questID];
    var waveData = db.event_quest_wave[questID];

    loadCommonQuestData(baseData, missionData, dropData, waveData);

    // 任務
    var $missionTable = $("#missionTable > tbody");
    var html = '';

    for (var missionID in db.event_mission) {
        var data_mission = db.event_mission[missionID];

        if (data_mission.event_id != eventID) continue;

        var title = data_mission.title;
        var comment = data_mission.comment;
        var asset = getAsset(data_mission.asset_type, data_mission.asset_id, data_mission.asset_value);

        html += tableRow([title, comment, asset]);
    }
    $missionTable.html(html);

    // 交換所
    var $exchangeTable = $("#exchangeTable > tbody");
    html = '';
    var raid_id = db.event[eventID].raid_id;

    var data_points = raid_id > 0 ? db.raid_event_point[raid_id] : db.event_point[eventID];
    if (data_points != null) {
        for (var pid in data_points) {
            var data_point = data_points[pid];

            var asset = getAsset(data_point.item_type, data_point.item_id, data_point.item_value);
            var exchange_limit = raid_id > 0 ? 1 : data_point.exchange_limit
            html += tableRow([asset, data_point.points, exchange_limit, data_point.points * exchange_limit]);
        }
    }

    $exchangeTable.html(html);

    $("#Recom_lv, #first_clear_bonus, #multi_exp").closest("tr").hide();
    $("#raid_point, #continue_limit, #required_lv").closest("tr").show();
    $("#questTab").show();
    $("#questList").show();
}

// 共通關卡資料讀取
function loadCommonQuestData(baseData, missionData, dropData, waveData) {
    current_quest = baseData;

    // 基本資料
    var attrs = ['exp', 'crystal', 'multi_exp', 'job_exp', 'required_lv', 'raid_point', 'Recom_lv', 'first_clear_bonus'];

    attrs.forEach(function(name) {
        $("#" + name).html(baseData[name]);
    });

    $("#continue_limit").html((baseData["continue_limit"] == -1).display());
    $("#bg_location").html(db.bg_location[baseData.bg_id].name);
    $("#boss1_name").html(getMonsterName(baseData.boss01_id));
    $("#boss2_name").html(getMonsterName(baseData.boss02_id));

    // 三冠條件
    if (missionData != null) {
        var i = 1;
        for (var missionID in missionData) {
            $("#mission" + i).html(missionData[missionID].summery.i18n());
            i++;
        }
        // 三冠獎勵
        $("#mission_bonus").html(getAsset(baseData.mission_bonus_type, baseData.mission_bonus_id, baseData.mission_bonus_value));
    }
    $("#mission1, #mission2, #mission3, #mission_bonus").closest("tr").toggle(missionData != null);

    // 掉落率
    for (var prop in dropData) {
        if (prop == 'id' || prop == 'event_id') continue;
        if ($("#" + prop).length == 0) continue;

        var value = dropData[prop];

        if (prop.indexOf('_id') > 0) {
            if (value == 0) {
                value = '無';
            } else {
                value = '看不懂';
                //var itemType = dropData[prop.replace('_id', '_type')];
                //value = getAsset(itemType, value, 1);
            }
        } else if (prop.indexOf('_bonus') > 0) {
            if (value == 0) {
                value = '無';
            } else {
                value = '看不懂';
                //var itemType = dropData[prop.replace('_bonus', '_type')];
                //value = getAsset(itemType, value, 1);
            }
        }
        $("#" + prop).html(value);
    }

    ratioModify(["nocon_clear_rate1", "nocon_clear_rate2", "nocon_clear_rate3"], "nocon_clear_progress");
    ratioModify(["speed_clear_rate1", "speed_clear_rate2", "speed_clear_rate3"], "speed_clear_progress");
    ratioModify(["boss_drop1", "boss_drop2", "boss_drop3"], "boss_drop_progress");
    ratioModify(["mid_drop1", "mid_drop2"], "mid_drop_progress");
    ratioModify(["zako_drop1", "zako_drop2"], "zako_drop_progress");

    // 分布資訊
    var $waveTable = $("#waveData table > tbody");
    var html = '';
	var monsterExist = [[], [], []];

    var wave_count = 0;
    for (var wave in waveData) {
        var this_wave = waveData[wave];
        for (var i = 1; i <= 10; i++) {
            var value = this_wave["zako" + i];
            if (value == 0) continue;
            var monster_id = baseData["zako0" + value + "_id"];
			monsterExist[2].add(monster_id);

            var name = getMonsterLink(monster_id, 2);
            html += tableRow([wave, name]);
        }
        for (var i = 1; i <= 3; i++) {
            var value = this_wave["midboss" + i];
            if (value == 0) continue;
            var monster_id = baseData["mid0" + value + "_id"];
			monsterExist[1].add(monster_id);

            var name = getMonsterLink(monster_id, 1);
            html += tableRow([wave, name]);
        }
        for (var i = 1; i <= 2; i++) {
            var value = this_wave["boss" + i];
            if (value == 0) continue;
            var monster_id = baseData["boss0" + value + "_id"];
			monsterExist[0].add(monster_id);

            var name = getMonsterLink(monster_id, 0);
            html += tableRow([wave, name]);
        }
        wave_count++;
    }
    $waveTable.html(html);

    // 初始化該關卡怪物列表
	// 怪物資料改從波數資料而來，因為有些關卡有設定小王實際沒出現
	// 此處列出的怪物不重複顯示
    $monsterList = $("#monsterList");
	html = '';
	for (var m_type = 0; m_type < monsterExist.length; m_type++) {
		for (var j = 0; j < monsterExist[m_type].length; j++) {
			var monster_id = monsterExist[m_type][j];
			var monster_name = getMonsterPrefix(m_type) + getMonsterName(monster_id);
			var onclick = String.Format("loadMonsterData({0}, {1});", monster_id, m_type);
			html += listItemHtml(monster_id, monster_name, '', onclick);
		}
	}
	$monsterList.html(html).find(".list-group-item").first().click();
	
    // 合併前方的波數
    for (var i = 1; i <= wave_count; i++) {
        var waveTd = $waveTable.find("tr > td").filter(function() {
            return $(this).text() == i;
        });

        for (var j in waveTd) {
            if (j == 0) {
                waveTd.eq(j).attr("rowspan", waveTd.length);
            } else {
                waveTd.eq(j).remove();
            }
        }
    }
}

function getMonsterLink(monster_id, prefix) {
    return String.Format("{1}<a href='#' onclick='goMonsterList({0})'>{2}</a>", monster_id, getMonsterPrefix(prefix), getMonsterName(monster_id));
}

function goMonsterList(id) {
    var item = $("#monsterList [data-id=" + id + "]");
    if (item.length) {
        item.click();
        $("a[href='#monsterData']").click(); // 跳到該分頁
    }
}

// 將原有數值轉換成百分比的形式
// 後面加上百分比條
function ratioModify(array, progress) {
    var sum = 0;
    array.forEach(function(id) {
        var value = $("#" + id).text();
        sum += parseInt(value);
    });
	var $progress = $("#" + progress);
	var html = '';
	
    var ratio = 100 / sum;
	var pass = ratio === 1;   // 原始總和即為100%就不用再修改文字
	
        array.forEach(function(id, index) {
            var value = $("#" + id).text();
			var pct = parseFloat((value * ratio).toFixed(1));
			if (!pass) {
				$("#" + id).html(pct);
			}
			
			var className = ["progress-bar-wood", "progress-bar-info", "progress-bar-warning"][index];
			html += $("<div></div>", {
				'class': "progress-bar progress-bar-striped " + className,
				style: "width: " + pct + "%"
			})[0].outerHTML;
        });
		$progress.html(html);
}

var $monsterList;

function getMonsterName(id) {
    if (id == 0) return '&nbsp;';
    return db.monster_base[db.monster[id].base_id].name;
}

function getMonsterPrefix(type) {
    var array = ["m-boss", "m-mid", "m-zako"];
    return '<span class="' + array[type] + '"></span>';
}

// 讀取怪物列表
function loadMonsterData(id, m_type) {
    setActive($monsterList, id);

    var data = db.monster[id];
    var base = db.monster_base[data.base_id];
    var data_aibase = db.monster_ai_base[data.monster_ai_id];

    // 由關卡定義的HP/ATK/BREAK計算真實血量
	// monster本身定義的是百分比，幾乎都是hp:10000 atk:100
	// 當參戰人數增加，HP會乘上特定比例作為最終血量
    if (m_type == 0) {
        setMonValue("hp", current_quest.boss_hp * (data.hp / 100));
        setMonValue("atk", current_quest.boss_atk * (data.atk / 100));
        setMonValue("break", current_quest.boss_break);
    } else if (m_type == 1) {
        setMonValue("hp", current_quest.mid_hp * (data.hp / 100));
        setMonValue("atk", current_quest.mid_atk * (data.atk / 100));
        setMonValue("break", current_quest.mid_break);
    } else if (m_type == 2) {
        setMonValue("hp", current_quest.zako_hp * (data.hp / 100));
        setMonValue("atk", current_quest.zako_atk * (data.atk / 100));
        setMonValue("break", 0);
    }

    // 基本資料
    setMonValue("name", base.name);
	setMonValue("agi", data.agi);
	setMonValue("barrier", data.barrier);
    setMonValue("gravity", data.gravity);
    setMonValue("mass", data.mass);
    setMonValue("floating", (data.floating == 1).display());
    setMonValue("through", (data.through == 0).display());
    setMonValue("use_element", displayElement(data.use_element1, data.use_element2));
    setMonValue("use_debuff", displayDebuff(data.use_debuff1, data.use_debuff2));
    setMonValue("weak_element", displayElement(data.weak_element1, data.weak_element2));
    setMonValue("weak_debuff", displayDebuff(data.weak_debuff1, data.weak_debuff2));
    setMonValue("monster_category", db.monster_category[base.category].name);
    setMonValue("monster_size", base.size);

    if (data_aibase.dying_rage_value > 0) {
        setMonValue("rage", String.Format("HP≦{0}%（持續時間 {1}）", data_aibase.dying_rage_value, data_aibase.dying_rage_time));
    } else {
        setMonValue("rage", "無");
    }

    // 抗性
    var data_resist = db.monster_resist[data.base_id];
    for (var prop in data_resist) {
        if (prop == 'id' || prop == 'break_flag') continue; // 跳過這兩個屬性
        var value = data_resist[prop];
        if (value > 0) {
            value = '<span class="strong">' + value + '</span>';
        } else if (value < 0) {
            value = '<span class="weak">' + value + '</span>';
        }
        setMonValue(prop, value);
    }

    // 使用技能
    var html = ''
    for (var command_id in db.monster_command[id]) {
        var command = db.monster_command[id][command_id];
        var skill = db.monster_skill[command.skill_id];

        var special = [];
        if (skill.summon01_id > 0) {
            special.push('召喚怪物');
        }
        if (command.rage_flag > 0) {
            special.push('狂暴');
        }
        var list = [
            anchor(skill.name, "loadMonsterSkillAtk(" + skill.id + ")"),
            skill.dmg,
            skill.cd,
            skill.min_range + '-' + skill.max_range,
            special.join('<br />')
        ]
        html += tableRow(list);
    }
    $("#monsterSkill > tbody").html(html).find("a").append("<i class='glyphicon glyphicon-link'></i>");;

	// 部位
	html = '';
    for (var part_id in db.monster_parts[data.base_id]) {
		var part = db.monster_parts[data.base_id][part_id];
		var list = [part.parts_id, 
					part.hitpoint,
					enums.weakness[part.weakness],
					part.damage,
					part.break_];
		
        html += tableRow(list);
    }
	
	$("#monsterPartsTable > tbody").html(html);
	
	
    // 清除前次資料
    $("#monsterSkillAtk").hide();
}

function setMonValue(className, content) {
    $("#monsterData ." + className).html(content);
}

function displayElement(value1, value2) {
    var value = elementHtml(value1);
    if (value2 > 0) {
        value += elementHtml(value2);
    }
    return value;
}

function elementHtml(value) {
    if (value == 0) return enums.element[value];
    return String.Format("<kbd class='elem-{1}'>{0}</kbd>", enums.element[value], value);
}

function displayDebuff(value1, value2) {
    if (value1 == 0) return '無';
    var value = debuffHtml(value1);
    if (value2 > 0) {
        value += debuffHtml(value2);
    }
    return value;
}

function debuffHtml(value) {
    return String.Format("<kbd class='debuff-{1}'>{0}</kbd>", enums.debuff[value], value);
}

// 回傳獎勵名稱
function getAsset(type, id, value) {
    var name = '';
    switch (type) {
        case 1:
            if (id == 1) name = '鑽石'
            break;
        case 2: // 道具
            name = db.items[id] != null ? db.items[id].name : '';

            // 不知為何有些道具沒有寫在裡面，只好自己定義
            switch (id) {
                case 22:
                    name = 'HR確定 武器ガチャチケット';
                    break;
                case 23:
                    name = 'HR以上確定 武器ガチャチケット';
                    break;
                case 24:
                    name = 'SR確定 武器ガチャチケット';
                    break;
                case 27:
                    name = '武器ガチャチケット';
                    break;
            }
            break;
        case 3: // 材料
            name = '<span class="type-rune"></span>' + db.rune[id].name;
            break;
        case 4: // 裝備
            name = '<span class="type-accessory"></span>' + getAssessoryNameByUpgradeID(id);
            break;
        case 5:
            name = '經驗水晶';
            break;
        case 6:
            if (id == 1) name = '妖精之淚'
            break;
        case 7: // 角色
            name = '<span class="type-unit"></span>' + anchor(db.unit[id].name, "showUnit(" + id + ")") + getUnitJobComment(db.unit[id]);
            break;
        case 10: // 徽章
            name = '<span class="type-icons"></span>' + db.icons[id].name;
            break;
        case 12: // 武器
            name = '<span class="type-weapon"></span>' + db.weapon[id].name;
            break;
    }
    if (!name) {
        return "type:" + type + " id:" + id + " value:" + value;
    } else {
        return name + value.display();
    }
}

var assessoryNames;

function getAssessoryNameByUpgradeID(id) {
    if (assessoryNames == null) {
        // 修改原始資料結構變成單一物件，比較好處理
        assessoryNames = {};
        for (var a in db.accessory_upgrade) {
            for (var b in db.accessory_upgrade[a]) {
                var item = db.accessory_upgrade[a][b];
                assessoryNames[item.id] = item.name;
            }
        }
    }
    return assessoryNames[id];
}

// 計算武器能力值
function calculateWeapon(id, level, awaken) {
    var data = db.weapon[id];
    return {
        hp: calculateWeaponProperty(data.hp, data.hp_grow, data.hp_awakening_rate, level, awaken),
        atk: calculateWeaponProperty(data.atk, data.atk_grow, data.atk_awakening_rate, level, awaken),
        agi: calculateWeaponProperty(data.agi, data.agi_grow, data.agi_awakening_rate, level, awaken)
    }
}

function calculateWeaponProperty(base, grow, awakening_rate, level, awaken) {
    var value = base + grow * (level - 1);
    while (awaken > 0) {
        value = Math.ceil(value * awakening_rate / 100);
        awaken--;
    }
    return value;
}

// 計算角色能力值
function calculateUnit(id, level) {
    var data = db.unit[id];
    return {
        hp: calculateUnitProperty(data.hp, data.hp_grow, level),
        atk: calculateUnitProperty(data.atk, data.atk_grow, level),
        agi: data.agi,
        knockback: calculateUnitProperty(data.knock_back_regist, data.knock_back_grow, level)
    };
}

function calculateUnitProperty(base, grow, level) {
    var value = base;
    for (var i = 1; i < level; i++) {
        var growValue;
        if (i < 30) {
            growValue = Math.floor(grow * 1);
        } else if (i < 50) {
            growValue = Math.floor(grow * 1.02);
        } else if (i < 80) {
            growValue = Math.floor(grow * 1.04);
        } else if (i < 100) {
            growValue = Math.floor(grow * 1.06);
        } else if (i < 150) {
            growValue = Math.floor(grow * 1.08);
        } else {
            growValue = Math.floor(grow * 1.1);
        }
        value += growValue;
    }
    return value;
}

function tableRow(array) {
    if (array.length == 0) return '';
    return '<tr><td>' + array.join('</td><td>') + '</td></tr>'
}

function anchor(text, onclick) {
    return String.Format('<a href="#" onclick="{1}; return false;">{0}</a>', text, onclick);
}

function renderTable(id, html) {
    var $table = $("#" + id);
    $table.children("tbody").html(html)
    $table.DataTable(dataTableOption);
    $table.wrap("<div class='table-responsive'></div>"); // 增加響應div
}

function showStory(sender) {
    $(sender).closest("div").hide();
    $("#storyBlock").show();
}

// 擴充方法
String.Format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ?
            args[number] :
            match;
    });
};

String.prototype.i18n = function() {
    // 直接搜尋key
    var value = localized[this];
    if (value != null) return value;

    // 如果找不到key，找regex的內容
    var patterns = localized.regex;
    for (var pattern in patterns) {
        var re = new RegExp('^' + pattern + '$');
        if (this.match(re)) {
            value = this.replace(re, patterns[pattern]);

            // 修改特殊style
            var reStyle = new RegExp('附加(\\S+)的BUFF');
            if (value.match(reStyle)) {
                value = value.replace(reStyle, '附加<span class="buff-name">$1</span>的BUFF');
            }

            return value;
        }
    }

    return this;
}

String.prototype.pre = function() {
    return '<pre class="comment">' + this + '</pre>';
}

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

Number.prototype.display = function() {
    return (this.valueOf() > 1 ? ' x' + this.valueOf() : '');
};

Boolean.prototype.display = function() {
    return this.valueOf() ? 'O' : 'X'
}

Array.prototype.add = function(value) {
	if (this.indexOf(value) < 0) this.push(value);
}

jQuery.fn.extend({
    progressRate: function(value, max) {
        return this.each(function() {
            $(this).width(Math.min(value * 100 / max, 100) + '%').html(value);
        });
    },
});

window.onerror = function(errorMsg, url, lineNumber, column, errorObj) {
    alert('Error: ' + errorMsg + '\nScript: ' + url + '\nLine: ' + lineNumber +
        '\nColumn: ' + column + '\nStackTrace: ' + errorObj);
}