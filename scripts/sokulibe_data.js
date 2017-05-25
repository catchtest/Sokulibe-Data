"use strict"
var db;
var localized = {};
var enums;
var main_story;
var event_story;
var skipDirty = true;
var dirtyPrefix = '× ';
var disableTranslate = false;
var showImage = null;
var defaultDataTablesOption = {
    "autoWidth": false,
    "order": [],
    "paging": false,
    "info": false,
    "language": {
        "search": "",
        "searchPlaceholder": "快速搜尋",
        "zeroRecords": "找不到符合的資料",
        "emptyTable": "無資料",
    },
    "columnDefs": [{
        targets: 'no-sort',
        orderable: false
    }, {
        targets: 'job',
        orderDataType: "img-src"
    }]
};
var path = {
    "icon": "images/Icon/pe{0}_tex.png",
    "item": "images/Item/ci{0}_tex.png",
    "rune": "images/Rune/ru{0}_tex.png",
    "unit_mini": "images/Mini/un{0}_mini_tex.png",
    "unit_up": "images/Portrait/un{0}_up.png",
    "unit_full": "images/Full/un{0}_full.png",
	"unit_awaken_mini": "images/Mini/un{0}_s{1}_mini_tex.png",
	"unit_awaken_up": "images/Portrait/un{0}_s{1}_up.png",
	"unit_awaken_full": "images/Full/un{0}_s{1}_full.png",
    "accessory": "images/Accessory/eq{0}_tex.png",
    "weapon": "images/Weapon/wi{0}_tex.png",
    "event_item": "images/EventItem/ei{0}_tex.png",
    "monster": "images/Monster/mm{0}_tex.png",
	"guild_icon": "images/GuildIcon/ig{0}_tex.png",
	"stack": "images/Stack/gs{0}_tex.png",
	"awaken_item": "images/AwakeningItem/ia{0}_tex.png",
	"buff": "images/Buff/ib{0}_tex.png",
	"debuff": "images/Debuff/id{0}_tex.png",
	"job": "images/Job/jo{0}_mini_tex.png",
	"key": "images/Item/pg{0}_raid_tex.png",
	"gimmick": function(id) {
		// 關卡特性圖片並非跟ID相同，故需做轉換
		var cate = db.gimmick[id].gimmick_category_id;
		var subId = (cate === 1) ? id : (id - 12) % 6;
		var myPath = String.Format("images/Gimmick/gm{0}_{1}_tex.png", padLeft(cate, 4), padLeft(subId, 4));
		return myPath;
	}
};

$(function() {
    // 顯示讀取資料錯誤訊息
    $.ajaxSetup({
        "error": function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status == 404) {
                alert("File not found.");
            } else {
                alert("Error: " + textStatus + ": " + errorThrown);
            }
        }
    });
    var showFavoriteUnit = function() {
        if (showImage === false) return;
        // 隨機選擇一個角色
        var unitIdList = Object.keys(db.unit);
        var unitId;
        do {
            var randIndex = randInt(0, unitIdList.length - 1);
            unitId = unitIdList[randIndex];
        } while (isDirtyUnit(db.unit[unitId]));
        var $img = $("<img></img>", {
            src: String.Format(path.unit_up, padLeft(unitId.toString(), 4)),
            style: "width: 100%; cursor: pointer;"
        });
        $img.click(function() {
            alert(db.unit_comment[unitId]['comment' + randInt(5, 7)]);
        });
        $("#favoriteDiv").append($img);
    };
    // 讀取Json
	$.when($.getJSON('data/sokulibe_data.json'), $.getJSON('data/localize.json'), $.getJSON('data/enums.json')).done(function(a1, a2, a3) {
		$(".loader").hide();
	
		db = a1[0];
		localized = a2[0];
		enums = a3[0];
		
		showFavoriteUnit();
    });


	var generateImageItem = function(img, name, title, onclick) {
		title = title || name;
		var html = String.Format('<a href="#" onclick="{3}"><div class="col-md-2 col-sm-3 col-xs-4 text-center" title="{2}">{0}<br />{1}</div></a>', 
			img, name, title, onclick);
		return html;
	}
	
	var renderImageList = function(id, html) {
		$("#" + id + " > .row").html(html).find("[title]").tooltip();
	}
	
    // 綁定initial事件
    $("a[href='#unit']").one("click", initUnit);
    $("a[href='#accessory']").one("click", initAccessory);
    $("a[href='#weapon']").one("click", initWeapon);
    $("a[href='#battleTab']").one("click", initBattle);
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
    $("a[href='#craftBoardTab']").one("click", initCraftBoard);
    $("a[href='#tearsComputeTab']").one("click", initTearsCompute);
    $("a[href='#loginBonusTab']").one("click", initLoginBonus);
    $("a[href='#enchantTab']").one("click", initEnchant);
    $("a[href='#eventItemsTab']").one("click", function() {
		// 活動道具
		var html = '';
		for (var id in db.event_item) {
			html += generateImageItem(imgHtml(path.event_item, id, true), db.event_item[id].name);
		}
		renderImageList("eventItemsTab", html);
	});
    $("a[href='#weaponExchangeTab']").one("click", function() {
		// 武器交換一覽
		var html = '';
		for (var id in db.weapon) {
			var data = db.weapon[id];
			if (data.exchange_flag !== 1) continue;
			html += generateImageItem(imgHtml(path.weapon, id, true), data.name, null, 'showWeapon(' + id + ')');
		}
		renderImageList("weaponExchangeTab", html);
	});
    $("a[href='#lotteryTab']").one("click", initLottery);
    $("a[href='#storyTab']").one("click", initStory);
    $("a[href='#treasureTab']").one("click", initTreasure);
	$("a[href='#guildIconTab']").one("click", function() {
		// 公會徽章一覽
		var html = '';
		for (var id in db.guild_icon) {
			var data = db.guild_icon[id];
			html += generateImageItem(imgHtml(path.guild_icon, id, true), data.name, data.unlock_comment);
		}
		renderImageList("guildIconTab", html);
	});
	
	$("a[href='#stackTab']").one("click", function() {
		// Stack一覽
		var tmpl = Template7.compile($('#stackRowTmpl').html());
		
		var html = '';
		for (var id in db.stack) {
			var data = db.stack[id];

			// 列出所有持有該Stack的角色或武器
			var list = [];
			for (var wid in db.weapon) {
				var data_weapon = db.weapon[wid];
				if (skipDirty && isDirtyWeapon(data_weapon)) continue;
				if (data_weapon.job == -1) continue; // 不顯示武煉石等無法裝備的武器
				
				if (data_weapon.stack_id == id) {
					list.push(getAsset(12, wid, 1));
				}
			}
			for (var uid in db.unit_awakening) {
				var data_awaken = db.unit_awakening[uid];
				var keys = Object.keys(data_awaken);
				var last = data_awaken[keys[keys.length - 1]];
				
				for (var s = 1 ; s <= 2; s++) {
					var sid = last['stack0' + s + '_id'];
					if (sid == id) {
						list.push(imgXs(path.unit_mini, uid) + '<span class="type-awaken"></span>' + anchor(getUnitName(db.unit[uid]), "showUnit(" + uid + ")"));
					}
				}
			}
			var ownerBlock = list.join('<br />');
			
			var item = {
				stack_name: data.stack_name,
				stack_icon: imgHtml(path.stack, id),
				owner: ownerBlock,
				count: Object.keys(db.stack_ability[id]).length,
				first_stack: {},
				stacks: []
			};
			
			var first = true;
			for (var sid in db.stack_ability[id]) {
				var data_sa = db.stack_ability[id][sid];
				var ability = { 
					stack_ability_name: data_sa.stack_ability_name, 
					stack_effect: displayStackEffect(data_sa).join('<br />'),
					stack_count: sid
				};
				
				if (first) {
					first = false;
					item.first_stack = ability;
				} else {
					item.stacks.push(ability);
				}
			}
		
			html += tmpl(item);
		}
		$("#stackTable > tbody").html(html);
		//renderTable("stackTable", html);
	});
	
	$("a[href='#gimmickTab']").one("click", function() {
		// 關卡特性一覽
		var html = '';
		for (var id in db.gimmick) {
			var data = db.gimmick[id];
			var list = [
				imgHtml(path.gimmick(id), null),
				data.gimmick_category_name,
				data.gimmick_name,
				data.gimmick_comment.pre(),
			];
			html += tableRow(list);
		}
		renderTable("gimmickTable", html);
	});
	
	$("a[href='#awakenItemTab']").one("click", function() {
		// 覺醒道具
		var html = '';
		for (var id in db.awakening_item) {
			var data = db.awakening_item[id];
			html += generateImageItem(imgHtml(path.awaken_item, id, true), data.name, data.comment);
		}
		renderImageList("awakenItemTab", html);
	});
	
	$("a[href='#skinListTab']").one("click", function() {
		// 覺醒道具
		var html = '';
		var addValue = function(type, value) {
			if (type === 0) return value;
			else if (type === 1) return (value - 100) + '%';
		}

		for (var id in db.skin) {
			var data = db.skin[id];
			var unitId = data.chara_id;
			
			var changes = [];
			for (var i = 1; i <= 7; i++) {
				if (data['change_fx_flag_com0' + i] > 0) {
					changes.push(enums.skill_abbr[i] + '改變');
				}
			}
			if (data['change_fx_flag_ougi'] > 0) {
				changes.push('奧義改變');
			}
			
			var list = [
				imgHtml(String.Format(path.unit_awaken_mini, padLeft(unitId, 4), padLeft(id, 4))),
				anchor(getUnitName(db.unit[unitId]), "showUnit(" + unitId + ")"),
				data.skin_name,
				data.skin_txt.pre(),
				addValue(data.hp_type, data.hp),
				addValue(data.atk_type, data.atk),
				addValue(data.agi_type, data.agi),
				changes.join('<br />')
			];
			html += tableRow(list);
		}
		renderTable("skinListTable", html);
	});
	
    $("#monsterSkill > tbody, #skillBase > tbody").on("click", "a", function() {
        $(this).closest("table").find(".active").removeClass("active");
        $(this).closest("tr").addClass("active");
    }).on("keydown", "a", function(e) {
        var $this = $(this);
        switch (e.which) {
            case 38: // up
            case 40: // down
                e.preventDefault();
                var $anchors = $this.closest("tbody").find("a");
                var index = $anchors.index($this);
                var value = e.which === 38 ? -1 : 1;
                var len = $anchors.length;
                var newIndex = (index + len + value) % len;
                $anchors.eq(newIndex).click().focus();
                break;
        }
    });
    // 鍵盤事件
    $('.list-group').keydown(function(e) {
        var $items = $(this).find(".list-group-item");
        var $select = $items.filter(".active");
        if (!$select.length) return;
        var commonEvent = function($s, $t) {
            if ($t.length) {
                $s.removeClass("active");
                $t.addClass("active").focus();
            }
        }
        switch (e.which) {
            case 37: // left
            case 38: // up
                e.preventDefault();
                commonEvent($select, $select.prevAll().not(".hidden").first());
                break;
            case 39: // right
            case 40: // down
                e.preventDefault();
                commonEvent($select, $select.nextAll().not(".hidden").first());
                break;
            case 36: // home
                e.preventDefault();
                commonEvent($select, $items.prevAll().not(".hidden").last());
                break;
            case 35: // end
                e.preventDefault();
                commonEvent($select, $items.nextAll().not(".hidden").last());
                break;
            case 33: // pageup
                e.preventDefault();
                commonEvent($select, $select.prevAll("*:lt(27):not(.hidden)").last());
                break;
            case 34: // pagedown
                e.preventDefault();
                commonEvent($select, $select.nextAll("*:lt(27):not(.hidden)").last());
                break;
        }
    }).keyup(function(e) {
        if (e.which >= 33 && e.which <= 40) {
            $(this).find(".list-group-item.active").click().focus();
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
    $('.navbar-collapse a').click(function() {
        $(".navbar-collapse").collapse('hide');
    });
    $("#showDirty").change(function() {
        skipDirty = !this.checked;
        if (skipDirty) {
            $(".dirty").addClass("hidden");
        } else {
            $(".dirty").removeClass("hidden");
        }
    });
    $("#disableTranslate").click(function() {
        if (confirm("裝備、武器效果將以原文顯示，確定嗎？\n（進入頁面前必須先點擊此按鈕才會生效）")) {
            disableTranslate = true;
            $(this).hide();
        }
    });
    $("#alwaysShowImage").click(function() {
        showImage = true;
        $(this).closest(".btn-group").hide();
    });
    $("#disableImage").click(function() {
        showImage = false;
        $(this).closest(".btn-group").hide();
    });

    // 捲到最上方
    var $backToTop = $('#backToTop');
    if ($backToTop.length) {
        var scrollTrigger = 100, // px
            backToTop = function() {
                var scrollTop = $(window).scrollTop();
                if (scrollTop > scrollTrigger) {
                    $backToTop.addClass('show');
                } else {
                    $backToTop.removeClass('show');
                }
            };
        backToTop();
        $(window).on('scroll', backToTop);
        $backToTop.on('click', function(e) {
            e.preventDefault();
            $('html,body').animate({
                scrollTop: 0
            }, 700);
        });
    }
	
	$.fn.dataTable.ext.order['img-src'] = function(settings, col) {
	    return this.api().column(col, {
	        order: 'index'
	    }).nodes().map(function(td, i) {
			var src = $('img', td).attr("src");
			var value = parseInt(src.match(/\d{4}/g)[0]);
	        return value;
	    });
	}
});

function displayStackEffect(data) {
	var list = [];
	for (var a = 1; a <= 3; a++) {
		var magicID = data['ability' + a];
		if (magicID > 0) {
			list.push(displayEffect(magicID).replaceAll('<br />', ''));
		}
	}
	return list;
}

// 初始化角色列表
function initUnit() {
	// 因為加上圖片導致傳輸時間大增，改成點選tab時才產生列表
	var generate = function(rarity) {
		var html = '';
		for (var id in db.unit) {
			var data = db.unit[id];
			if (data.rarity != rarity) continue;
			
			var cssClass = '';
			var prefix = '';
			if (isDirtyUnit(data)) {
				cssClass = setDirtyClass();
				prefix = dirtyPrefix;
			}
			var name = prefix + getUnitName(data);
			var job = getUnitJob(data);
			var itemHtml = listItemHtml(id, imgXs(path.unit_mini, id) + name, job, "loadUnitData(" + id + ");", cssClass);
			html += itemHtml;
		}
		insertToList("unitR" + rarity, html);
	}
	for (var r = 1; r <= 3; r++) {
		$("a[href='#unitR" + r + "']").one("click", { rarity: r }, function(event) { 
			generate(event.data.rarity); 
		});
	}
	generate(4);
	
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
	// 因為加上圖片導致傳輸時間大增，改成點選tab時才產生列表
	var generate = function(type, listId) {
		var html = '';
		for (var id in db.accessory) {
			var cssClass = '';
			var prefix = '';
			if (isDirtyAccessory(id)) {
				cssClass = setDirtyClass();
				prefix = dirtyPrefix;
			}
			var data = db.accessory[id];
			var name = imgXs(path.accessory, getAccessoryFirstId(id)) + prefix + getAccessoryName(id);
			var job = enums.equip_job[data.job] + ' <div class="rarity">' + enums.rarity[data.rarity] + '</div>';
			var itemHtml = listItemHtml(id, name, job, "loadAccessoryData(" + id + ");", cssClass);
			
			switch (type) {
				case 1:   // SR戒指
					if (data.category === 1 && data.rarity >= 4) html += itemHtml;
					break;
				case 2:   // 低階戒指
					if (data.category === 1 && data.rarity < 4) html += itemHtml;
					break;
				case 3:   // 護符
					if (data.category === 2) html += itemHtml;
					break;
			}
		}
		insertToList(listId, html);
	}
	
	$("a[href='#ringR']").one("click", function() { 
		generate(2, 'ringR'); 
	});
	$("a[href='#talisman']").one("click", function() { 
		generate(3, 'talisman'); 
	});
	generate(1, 'ringSR');
}
// 初始化武器列表
function initWeapon() {
	var generate = function(rarity, listId) {
		var html = '';
		for (var id in db.weapon) {
			var data = db.weapon[id];
			var cssClass = '';
			var prefix = '';
			if (isDirtyWeapon(data)) {
				cssClass = setDirtyClass();
				prefix = dirtyPrefix;
			}
			var name = imgXs(path.weapon, id) + prefix + data.name;
			// 不能裝備的武器
			if (data.job == -1) {
				if (rarity === 1) {
					name = String.Format("<span title='{1}'>{0}</span>", name, data.material_comment);
					var itemHtml = listItemHtml(id, name, enums.rarity[data.rarity], cssClass);
					html += itemHtml;
				}
				continue;
			}
			if (data.rarity === rarity) {
				var job = enums.equip_job[data.job];
				var itemHtml = listItemHtml(id, name, job, "loadWeaponData(" + id + ");", cssClass);
				html += itemHtml;
			}
		}
		insertToList(listId, html);
	}
	
	$("a[href='#weaponHR']").one("click", function(event) { 
		generate(3, 'weaponHR'); 
	});
	$("a[href='#weaponR']").one("click", function(event) { 
		generate(2, 'weaponR'); 
	});
	$("a[href='#weaponOther']").one("click", function(event) { 
		generate(1, 'weaponOther'); 
	});
	generate(4, 'weaponSR');

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
		$("#weaponCurrentLight").html(weaponPower.light);
    });
}
// 初始化關卡列表
function initBattle() {
	$(".loader").show();
	$.getJSON('data/sokulibe_battle_data.json', function(data) {
		$.extend(db, data);
		
		// 活動
		var html = '';
		for (var id in db.event) {
			// 底下沒有任何一關，不要顯示
			if (!(id in db.event_multi_quest) && !(id in db.event_point)) continue;
			var data = db.event[id];
			var event_flag = [];
			if (data.multi_flag === 1 || data.event_type === 5 || data.event_type === 9) {
				event_flag.push("<單刷>");
			}
			if (data.ranking_flag === 1) {
				event_flag.push("<排名>");
			}
			var name = data.name;
			var job = event_flag.join(' ');
			var itemHtml = listItemHtml(id, name, job, "loadEventData(" + id + ");");
			// 越後面的關卡排越前
			html = itemHtml + html;
		}
		insertToList("eventTab", html);
		
		// 共鬥
		html = '';
		for (var mrcate in db.multi_quest) {
			for (var id in db.multi_quest[mrcate]) {
				var data = db.multi_quest[mrcate][id];
				var name = 'MR' + data.required_lv + '&nbsp;&nbsp;' + data.name;
				var job = String.Format('總合力 {1}&nbsp;&nbsp;體力 {0}', data.stamina, displayLight(data.required_light));
				var itemHtml = listItemHtml(id, name, job, "loadMultiData(" + id + ", " + mrcate + ");");
				// 越後面的關卡排越前
				html = itemHtml + html;
			}
		}
		insertToList("multiTab", html);
		
		// 主線
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
		insertToList("zoneTab", html);
		
		// 支路
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
		
		// 單人經驗關 (併到支路顯示)
		for (var id in db.experience_zone) {
			var data = db.experience_zone[id];
			var name = data.name;
			var job = String.Format("體力 {0}", data.stamina);
			var itemHtml = listItemHtml(id, '[經驗] ' + name, job, "loadExpZoneData(" + id + ");");
			html += itemHtml;
		}
		insertToList("battleStepTab", html);
		
		// 次元之門
		html = '';
		for (var id in db.dimension_category) {
			var data = db.dimension_category[id];
			var name = data.name;
			var subText = '';
			var itemHtml = listItemHtml(id, name, subText, "loadDimensionData(" + id + ");");
			html += itemHtml;
		}
		insertToList("dimensionTab", html);
		
		$(".loader").hide();
	});
}

function insertToList(id, html) {
	$("#" + id + " > .list-group").html(html);
}

function displayLight(value, showZero) {
	if (value > 0 || showZero) {
		return '<span class="light">' + value + '</span>';
	} else {
		return '---'
	}
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
        var img = imgHtml(path.icon, id);
        var name = data.name;
        var comment = data.comment;
        html += tableRow([img, name, comment]);
    }
    renderTable("iconsTable", html);
}

function padLeft(str, length) {
    if (str.length >= length)
        return str;
    else
        return padLeft("0" + str, length);
}
// 初始化道具列表
function initItems() {
    var html = '';
    for (var id in db.items) {
        var data = db.items[id];
        var img = imgHtml(path.item, id);
        var name = data.name;
        var comment = data.comment.replaceAll('\n', '');
        html += tableRow([img, name, comment]);
    }
    for (var id = 21; id <= 27; id++) {
        var img = imgHtml(path.item, id);
        html += tableRow([img, extendItemName(id), '']);
    }
    renderTable("itemsTable", html);
}
// 初始化素材列表
function initRune() {
    var html = '';
    for (var id in db.rune) {
        var data = db.rune[id];
        var img = imgHtml(path.rune, id);
        var name = data.name;
        var comment = data.tips.replaceAll('\n', '');
        html += tableRow([img, name, comment]);
    }
    renderTable("runeTable", html);
}
// 初始化經驗列表
function initExp() {
    $("#mrExpTable > tbody").html(createExpTable(db.multi_rank, "point"));
    $("#unitExpTable > tbody").html(createExpTable(db.unit_exp, "exp", "add_light_lv"));
    $("#jobExpTable > tbody").html(createExpTable(db.job_lv, "exp"));
}

function createExpTable(data, attrName, attrName2) {
    var html = '';
    var accumulate = 0;
	var accumulate2 = 0;
    for (var level in data) {
        var value = data[level][attrName];
        accumulate += value;
		var list = [level, value, accumulate];
		// 為了總合力的例外處理
		if (!!attrName2) {
			accumulate2 += data[level][attrName2];
			list.push(displayLight(accumulate2, true))
		}
        html += tableRow(list);
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
    var itemList = getUnitSortList();
    var html = '';
    for (var i = 0, len = itemList.length; i < len; i++) {
        var data = itemList[i];
        var maxLevel = enums.max_level[data.rarity];
        var unitPower = calculateUnit(data.id, maxLevel);
        // 顯示抵抗異常狀態
        var resist = db.unit_resist[data.id];
		var resistItems = [];
		var strongHtml = '';
		var weakHtml = '';
		if (!!resist) {
			enums.debuff_param.forEach(function(name, index) {
				var value = resist[name + '_resist'];
				if (value > 0) {
					resistItems.push(debuffKbd(index) + ' ' + value);
				}
			});
			
			// 抗性
			var elemNames = ['slash', 'smash', 'shot', 'sorcery', 'fire', 'water', 'earth', 'light', 'dark'];
			elemNames.forEach(function(name, index) {
				var value = resist[name + '_resist'];
				if (value > 0) {
					if (index >= 4) {
						strongHtml += elementHtml(index - 3, value) + ' ' + value;
					} else {
						strongHtml += enums.atk_type[elemNames];
					}
				} else if (value < 0) {
					if (index >= 4) {
						weakHtml += elementHtml(index - 3, value) + ' ' + value;
					} else {
						weakHtml += enums.atk_type[elemNames];
					}
				}
			});
		}
		// 覺醒次數
		var data_awaken = db.unit_awakening[data.id];
		var awakening = 0;
		var stackHtml = '';
		if (data_awaken != null) {
			var keys = Object.keys(data_awaken);
			var last = data_awaken[keys[keys.length - 1]];
			awakening = last.awakening;
			
			for (var s = 1 ; s <= 2; s++) {
				var sid = last['stack0' + s + '_id'];
				if (sid > 0) {
					stackHtml += displayStack(sid, false, false);
				}
			}
		}
		
        var list = [
            imgHtml(path.unit_mini, data.id),
            anchor(getUnitName(data), "showUnit(" + data.id + ")"),
            getUnitPartner(data, false),
            anchor(data.cv, "quickSearch('" + data.cv + "')"),
            data.rarity,
            elementHtml(data.use_element),
            imgXs(path.job, data.job_id),
            unitPower.hp,
            unitPower.atk,
            unitPower.agi,
            unitPower.knockback,
			awakening,
            displayDebuff(data.use_debuff),
            strongHtml,
            weakHtml,
            resistItems.join('<br />'),
			stackHtml			
        ];
        html += tableRow(list);
    }
    renderTable("unitListTable", html);
}

function getUnitSortList(forceAll) {
    var itemList = [];
    for (var id in db.unit) {
        var data = db.unit[id];
        if (!forceAll && skipDirty && isDirtyUnit(data)) continue;
        itemList.push(data);
    }
    // 以星數排序
    itemList = itemList.sort(function(a, b) {
        return b.rarity - a.rarity;
    });
    return itemList;
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
    var html = '';
    for (var index = 0, len = itemList.length; index < len; index++) {
        var list = renderAccessory(itemList[index]);
        html += tableRow(list);
    }
    renderTable("accessoryListTable", html);
}

function renderAccessory(data) {
    var name = getAccessoryFirstName(data.id);
    if (name == null) {
        // 沒有滿前的名字，只顯示滿後的
        name = getAccessoryLastName(data.id)
    } else {
        name += '<br />' + getAccessoryLastName(data.id);
    }
    var list = [
        imgHtml(path.accessory, getAccessoryFirstId(data.id)),
        enums.accessory_category[data.category],
        anchor(name, "showAccessory(" + data.id + ")"),
        enums.rarity[data.rarity],
        enums.equip_job[data.job],
    ];
    for (var i = 1; i <= 4; i++) {
        var magicID = data["magic" + i];
        var content = displayEffect(magicID);
        list.push(content);
    }
    return list;
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
        var list = renderWeapon(itemList[index]);
        html += tableRow(list);
    }
    renderTable("weaponListTable", html);
}

function renderWeapon(data) {
    var weaponMainSkill = db.weapon_mainskillbase[data.main_weapon_skill_id] || {};
    var weaponSubSkill = db.weapon_subskill[data.sub_weapon_skill_id] || {};
    var weaponPower = calculateWeapon(data.id, 10, 4);
    var list = [
        imgHtml(path.weapon, data.id),
        anchor(data.name, "showWeapon(" + data.id + ")"),
        enums.rarity[data.rarity],
        enums.equip_job[data.job],
        weaponPower.hp,
        weaponPower.atk,
        weaponPower.agi,
        weaponMainSkill.dmg,
        weaponMainSkill.break_,
        weaponSubSkill[1] == null ? '' : weaponSubSkill[1].comment.i18n().pre(),
        weaponSubSkill[5] == null ? '' : weaponSubSkill[5].comment.i18n().pre(),
		displayStack(data.stack_id, false, false)
    ];
    return list;
}
// 初始化特性一覽
function initAbilityList() {
    var unitAbility = {};
	
	// 檢查所有角色被動技能
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
			
            obj.push(anchor(imgXs(path.unit_mini, id) + getUnitName(data), "showUnit(" + id + ")"));
        }
    }
	
	// 檢查所有角色覺醒後的被動
    for (var id in db.unit_awakening) {
        var data = db.unit[id];
		for (var a in db.unit_awakening[id]) {
			for (var i = 1; i <= 4; i++) {
				var typeId = db.unit_awakening[id][a]['ability0' + i];
				if (typeId == 0) continue;
				var obj = unitAbility[typeId];
				if (obj == null) {
					unitAbility[typeId] = [];
					obj = unitAbility[typeId];
				}
				var content = imgXs(path.unit_mini, id) + '<span class="type-awaken"></span>' + anchor(getUnitName(data), "showUnit(" + id + ")");
				if (obj.indexOf(content) < 0) {   // 不重複放
					obj.push(content);
				}
			}
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
        data.forEach(function(val) {
            sum += val;
        });
        var html = '';
        var tears = 0;
        html += tableRow([startLevel, '---', tears, sum]);
        data.forEach(function(val, index) {
            tears += val;
            sum -= val;
            html += tableRow([startLevel + (index + 1) * 5, val, tears, sum]);
        });
        $("#limitbreakR" + r + "Table > tbody").html(html);
    }
}
// 初始化星盤一覽
function initCraftBoard() {
    var html = '';
    for (var id in db.craft_board) {
        var data = db.craft_board[id];
        var itemHtml = listItemHtml(id, data.name, '', "loadCraftBoardData(" + id + ");", '');
        html += itemHtml;
    }
    // 自動產生星盤總和的項目
    var keys = Object.keys(db.craft_board);
    for (var i = 1; i <= keys.length; i++) {
        html += listItemHtml(-i, '星盤1~' + i + ' 總和', '', "loadCraftBoardData(-" + i + ");", '');
    }
    $("#craftBoardList").html(html);
}
var tears;
// 初始化眼淚計算
function initTearsCompute() {
    tears = new TearsComputeModel();
    tears.initial();
}

function initLoginBonus() {
    var html = '';
    var count = 0;
    var list = [];
    for (var day in db.login_bonus) {
        var data = db.login_bonus[day];
        list.push(data.login_count);
        list.push(getAsset(data.asset_type_id, data.asset_id, data.asset_count));
        if (++count >= 7) {
            html += tableRow(list);
            count = 0;
            list = [];
        }
    }
    if (list.length) {
        html += tableRow(list);
    }
    $("#loginBonusTable > tbody").html(html);
}
// 初始化效果一覽
function initEnchant() {
    var html = '';
    for (var id in db.enchant_master) {
        var data = db.enchant_master[id];
        var comment = data.enchant_comment;
        comment += '<div class="text-warning">' + displayEffect(id) /*.replaceAll('<br />', '')*/ + '</div>';
        var list = [
            comment,
            getEnchantFrom(id).join('<br />')
        ];
        html += tableRow(list);
    }
    renderTable("enchantTable", html);
}

function getEnchantFrom(enchantId) {
    var result = [];
    // 找尋擁有此效果的被動
    var abilities = [];
    for (var id in db.ability) {
        for (var i = 1; i <= 3; i++) {
            if (db.ability[id]['ability' + i] == enchantId) {
                abilities.push(db.ability[id].id);
                break;
            }
        }
    }
    // 由被動尋找角色
    if (abilities.length) {
        var unitList = getUnitSortList();
        for (var i = 0; i < unitList.length; i++) {
            var data = unitList[i];
            for (var j = 1; j <= 4; j++) {
                var abilityId = data['ability0' + j];
                if (abilityId == 0) continue;
                if (abilities.indexOf(abilityId) >= 0) {
                    result.push(getAsset(7, data.id, 1));
                    break;
                }
            }
        }
    }
    // 找尋擁有此效果的裝備
    for (var id in db.accessory) {
        var data = db.accessory[id];
        if (isDirtyAccessory(data.id)) continue; // 強制跳過假資料
        for (var j = 1; j <= 5; j++) {
            var abilityId = data['magic' + j];
            if (abilityId == 0) continue;
            if (abilityId == enchantId) {
                result.push(getAsset(4, getAccessoryFirstId(data.id), 1));
                break;
            }
        }
    }
    // 找尋擁有此效果的武器
    var subskills = [];
    for (var id in db.weapon_subskill) {
        for (var upgrade in db.weapon_subskill[id]) {
            var data = db.weapon_subskill[id][upgrade];
            for (var j = 1; j <= 3; j++) {
                var abilityId = data['ability' + j];
                if (abilityId == 0) continue;
                if (abilityId == enchantId) {
                    subskills.push(data.id);
                    break;
                }
            }
        }
    }
    if (subskills.length) {
        for (var id in db.weapon) {
            if (isDirtyWeapon(id)) continue; // 強制跳過假資料
            var data = db.weapon[id];
            if (subskills.indexOf(data.sub_weapon_skill_id) >= 0) {
                result.push(getAsset(12, data.id, 1));
            }
        }
    }
    return result;
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
    if (data.hp === 1 && data.atk === 1 && data.agi === 1) return true;
	if (data.id >= 7100) return true;   // 官方自己多複製的重複資料
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

function getAccessoryFirstId(id) {
    var item = db.accessory_upgrade[id];
    var keys = Object.keys(item);
    var first = db.accessory_upgrade[id][keys[0]];
    return first.id;
}

function getUnitName(data) {
    return data.nickname + data.name;
}

function getUnitJob(data) {
    var elementText = data.use_element == 0 ? '' : enums.element[data.use_element];
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
    showEvent("unit", id);
}

function showAccessory(id) {
    showEvent("accessory", id);
}

function showWeapon(id) {
    showEvent("weapon", id);
}

function showEvent(name, id) {
    $("a[href='#" + name + "']").click();
    var item = $("#" + name).find("[data-id='" + id + "']");
    if (item.length == 0) {
        alert('Data not found.');
        return;
    }
    var list_id = item.closest(".tab-pane").attr("id");
    $("a[href='#" + list_id + "']").click();
    item.click().focus();
}
// 取得對應角
function getUnitPartner(data, showJob) {
    var html = '';
    var partnerData = db.unit[db.unit_base[data.base_id].partner_id];
    if (partnerData != null) {
        html = String.Format("<a href='#' onclick='showUnit({0});'>{2}{1}</a>",
            partnerData.id,
            getUnitName(partnerData),
			imgXs(path.unit_mini, partnerData.id));
        if (showJob) {
            html += getUnitJobComment(partnerData);
        }
    }
    return html;
}
// 讀取角色資料
function loadUnitData(id) {
    loadDataEvent(id);
    current_unit = id;

	loadUnitStory();
	
    var data = db.unit[id];
    setTitle(getUnitName(data), getUnitJob(data));
    $("#cv").html(data.cv);
    $("#partner").html(getUnitPartner(data, true));
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
    var getAbilityDesc = function(abilityID) {
        var abilityHtml = '&nbsp;';
        if (abilityID === 0) return abilityHtml;
        var abilityData = db.ability[abilityID];
        abilityHtml = abilityData.name.replaceAll('\n', '') + '<br />' + abilityData.comment.pre();
        var converts = [];
        for (var a = 1; a <= 4; a++) {
            var magicID = abilityData['ability' + a];
            if (magicID > 0) {
                converts.push(displayEffect(magicID).replaceAll('<br />', ''));
            }
        }
        if (converts.length) {
            abilityHtml += '<div class="text-warning">' + converts.join('<br />') + '</div>';
        }
        return abilityHtml;
    };
    // 被動
    for (var i = 1; i <= 4; i++) {
        var abilityID = data["ability0" + i];
        $("#ability0" + i).html(getAbilityDesc(abilityID));
    }
    // 職業被動
    var job_rowspan = 0;
    for (var i = 1; i <= 4; i++) {
        var abilityID = db.job[data.job_id]["ability0" + i];
        var abilityExist = abilityID > 0;
        $("#job_ability0" + i).html(getAbilityDesc(abilityID)).closest("tr").toggle(abilityExist);
        if (abilityExist) {
            job_rowspan++;
        }
    }
    $("#job_th").attr("rowspan", job_rowspan);
    // 特性
    for (var i = 1; i <= 3; i++) {
        var content = data["Characteristic" + i];
        if (!content.length) content = '&nbsp;';
        $("#characteristic" + i).html(content);
    }
    // 對話
    if (db.unit_comment[id] != null) {
        for (var i = 1; i <= 11; i++) {
            $("#comment" + i).html(db.unit_comment[id]["comment" + i].pre());
        }
    } else {
        $("#unitCommentTab td").html('');
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
    $("#skillAtkExt").hide();
    // 職業特殊技
    var specialHtml = '';
    if (data.trap_id > 0) {
        // 陷阱
        specialHtml = getTrapSkillTd(data.trap_id);
    } else {
        var specialTds;
        switch (data.job_id) {
            case 1:
                // name, ---, 特殊, 傷害, CD, Break, Hate, Cast, Range
                specialTds = ['クリティカルアッパー', '---', '攻擊', 1, cdFormat(1800), 20, 10, 0, '0-200'];
                break;
            case 2:
                specialTds = ['回避', '---', '特殊', 0, cdFormat(600), 0, 0, 0, '---'];
                break;
            case 3:
                specialTds = ['トルネード', '---', '特殊', 0, cdFormat(400), 0, 0, 20, '0-10000'];
                break;
            case 4:
                specialTds = ['バーサーク', '---', '特殊', 0, cdFormat(3600), 0, 0, 0, '---'];
                break;
            case 5:
                specialTds = ['タウント', '---', '特殊', 0, cdFormat(600), 0, 700, 0, '0-500'];
                break;
            case 6:
                specialTds = ['エリアシールド', '---', '特殊', 0, '動態', 0, 0, 0, '---'];
                break;
            case 7:
                specialTds = ['スナイプモード', '---', '特殊', 0, 0, 0, 0, 0, '---'];
                break;
            case 9:
                specialTds = ['コンセントレート', '---', '特殊', 0, cdFormat(2700), 0, 0, 0, '---'];
                break;
            case 10:
                specialTds = ['スポットヒール', '---', '回復', 1, cdFormat(1200), 0, 0, 0, '---'];
                break;
            default:
                specialTds = ['', '', '', '', '', '', '', ''];
                break;
        }
        specialHtml = '<td>' + specialTds.join('</td><td>') + '</td>';
    }
    $skillBase.children("tr").eq(7).append(specialHtml);
    $skillDesc.children("tr").eq(7).children("td").eq(0).html(db.job[data.job_id].special_tips.pre());
    // 奧義
    var ougiData = db.ougi[data.ougi_id];
    $skillDesc.children("tr").eq(8).children("td").eq(0).html(getOugiDesc(ougiData));
    $skillBase.children("tr").eq(8).append(getOugiTd(data.ougi_id));
    // 增加連結圖示，避免有人看不出有連結
    $skillBase.find("a").append("<i class='glyphicon glyphicon-link'></i>");
    // 技能強化素材
    var $skillRune = $("#skillRune > tbody");
    var $skillUpgrade = $("#skillUpgrade > tbody");
	var $skillLight = $("#skillLight > tbody");
    var skillTotalRune = {};
    $skillRune.find("td").empty();
    for (var i = 0; i <= 7; i++) {
        if (command == null || command[i] == null) {
            continue;
        }
        var skill_id = command[i].skill_id;
        upgradeTotalRunes = {};
        for (var rankID in db.skill_upgrade[skill_id]) {
			var data_upgrade = db.skill_upgrade[skill_id][rankID];
			var rank = data_upgrade.rank;
			
			// 總合力 (需要寫入Lv1的值)
			$skillLight.children("tr").eq(i).children("td").eq(rank - 1).html(displayLight(data_upgrade.light_lv, true));
			
            if (rankID == 1) continue; // 原始狀態不用升級跟提升能力
            // 素材需求
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
            value = '<span class="text-info">' + value + '</span>';
        } else if (value < 0) {
            value = '<span class="text-danger">' + value + '</span>';
        }
        $resistTable.find("." + prop).html(value);
    }
    // 圖片
    $("#unitProtraitImage").html(imgHtml(path.unit_up, data.id, true));
    $("#unitFullImageTab").html(imgHtml(path.unit_full, data.id, true));
    //$("#unitMiniImage").html(imgHtml(path.unit_mini, data.id, true));
    // 裝備一覽
    var allowJob = enums.job_equip_map[data.job_id];
    var itemList = [];
    for (var aid in db.accessory) {
        var data1 = db.accessory[aid];
        if (isDirtyAccessory(aid)) continue; // 強制跳過假資料
        if (allowJob.indexOf(data1.job) < 0) continue; // 必須是該職業可以裝備
        if (data1.category === 1 && data1.rarity <= 3) continue; // 戒指沒有SR都不要顯示
        if (data1.category === 2 && data1.rarity <= 2) continue; // 護符沒有HR都不要顯示
        itemList.push(data1);
    }
    // 以裝備稀有度排序
    itemList = itemList.sort(function(a, b) {
        if (b.category > a.category) return -1;
        if (b.category < a.category) return 1;
        if (b.rarity > a.rarity) return 1;
        if (b.rarity < a.rarity) return -1;
        return 0;
    });
    var html = '';
    var html2 = '';
    for (var index = 0, len = itemList.length; index < len; index++) {
        var list = renderAccessory(itemList[index]);
        if (isOtherElement(list, data.use_element, false)) continue; // 不顯示非本系戒指
        list.splice(1, 1); // 去掉類型，分成兩張表
        if (itemList[index].category == 1) {
            html += tableRow(list);
        } else if (itemList[index].category == 2) {
            html2 += tableRow(list);
        }
    }
    $("#unitRingTable > tbody").html(html);
    $("#unitTalismanTable > tbody").html(html2);
    // 武器一覽
    var itemList = [];
    for (var wid in db.weapon) {
        var data1 = db.weapon[wid];
        if (isDirtyWeapon(data1)) continue; // 強制跳過假資料
        if (allowJob.indexOf(data1.job) < 0) continue; // 必須是該職業可以裝備
        itemList.push(data1);
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
        var list = renderWeapon(itemList[index]);
        if (isOtherElement(list, data.use_element, true)) continue; // 不顯示非本系戒指
        list.splice(3, 1); // 去掉可裝備職業，基本上只會是一種
        html += tableRow(list);
    }
    $("#unitWeaponTable > tbody").html(html).find("[title]").tooltip();
	
	// 覺醒資料
	html = '';
	var data_awaken = db.unit_awakening[id];
	if (data_awaken != null) {

		for (var time in data_awaken) {
			var dat = data_awaken[time];
			var items = [];
			for (var i = 1; i <= 4; i++) {
				items.push(getAsset(dat['required_item_type_' + i], dat['required_item_id_' + i], dat['required_item_value_' + i]));
			}
			var stack = [];
			for (var i = 1; i <= 2; i++) {
				var sid = dat['stack0' + i + '_id'];
				if (sid > 0) {
					var num = dat['stack0' + i + '_number'];
					stack.push(displayStack(sid, true, false) + num);
				}
			}
			// 被動改變
			var changes = [];
			for (var i = 1; i <= 4; i++) {
				var aid = dat['ability0' + i];
				if (aid <= 0) continue;
				var data_ability = db.ability[aid];
				
				changes.push(String.Format('<span class="text-info">[被動{0}]</span> <span title="{2}">{1}</span>', i, data_ability.name, data_ability.comment));
			}
			// 主動改變
			for (var i = 1; i <= 7; i++) {
				var aid = dat['command0' + i];
				if (aid <= 0) continue;
				var data_skill = db.skill_base[aid];
				
				changes.push(String.Format('<span class="text-warning">[技能{0}]</span> {1}', enums.skill_abbr[i], data_skill.name));
			}
			
			// 抗性改變
			var resists = [];
			var resistMap = {
				"slash": "斬",
				"smash": "碎",
				"shot": "射",
				"sorcery": "魔",
				"fire": "火",
				"water": "水",
				"earth": "地",
				"light": "光",
				"dark": "暗",
				"poison": "毒",
				"paralysis": "麻痺",
				"freeze": "冰結",
				"burn": "火傷",
				"feather": "浮遊",
				"curse": "詛咒",
				"silence": "沉默",
				"darkness": "暗黑",
				"death": "即死",
				"confusion": "混亂",
				"charm": "魅惑"
			};
			for (var key in resistMap) {
				var value = dat[key + '_resist'];
				if (value <= 0) continue;
				changes.push(String.Format('{0}耐性 + {1}', resistMap[key], value));
			}
			// 得到衣服
			if (dat.get_skin_id > 0) {
				var data_skin = db.skin[dat.get_skin_id];
				changes.push(String.Format('<span class="text-danger">[衣服]</span> <span title="{1}">{0}</span>', data_skin.skin_name, data_skin.skin_txt));
			}
			
			var list = [
				dat.awakening + (dat.super_awakening_flag > 0 ? '<div class="text-info">(超)</div>' : ''),
				dat.required_lv,
				dat.required_skill_upgrade,
				items.join('<br />'),
				String.Format("<div class='text-success'>{1}</div>(+{0})", dat.hp, unitPower.hp + dat.hp),
				String.Format("<div class='text-danger'>{1}</div>(+{0})", dat.atk, unitPower.atk + dat.atk),
				String.Format("<div class='text-info'>{1}</div>(+{0})", dat.agi, unitPower.agi + dat.agi),
				String.Format("<div class='text-warning'>{1}</div>(+{0})", dat.knock_back_regist, unitPower.knockback + dat.knock_back_regist),
				'<span class="light">' + dat.light_lv + '<span>',
				stack.join('<br />'),
				changes.join('<br />')
			];
			html += tableRow(list);
		}
	} else {
		html = '<tr><td colspan="100" class="text-center">無法覺醒</td></tr>';
	}
	$("#unitAwakeningTable > tbody").html(html);
	$("#unitAwakeningTable [title]").tooltip();
	
	var addValue = function(type, value) {
		if (type === 0) return value;
		else if (type === 1) return (value - 100) + '%';
	}
	
	// 衣服
	html = '';
	for (var sid in db.skin) {
		var data_skin = db.skin[sid];
		if (data_skin.chara_id === id) {
			html += String.Format($("#unitSkinTmpl").html(), 
				path2(path.unit_awaken_up, id, sid),
				path2(path.unit_awaken_full, id, sid),
				data_skin.skin_name, data_skin.skin_txt.pre(),
				addValue(data_skin.hp_type, data_skin.hp),
				addValue(data_skin.atk_type, data_skin.atk),
				addValue(data_skin.agi_type, data_skin.agi));
		}
	}
	$("#unitSkinTab > .row").html(html);
	
}

// 讀取故事 (現在可能有多個index)
function loadUnitStory(id) {
	if (db.unit_story == null) return;

    var story = '';
	id = id || current_unit;
    for (var index in db.unit_story[id]) {
        story += db.unit_story[id][index].story;
    }
    $("#storyBlock").html(story);
}

function isOtherElement(list, element, isWeapon) {
    // 搜尋是否有提升非自己屬性攻擊力的文字
    // 例如自身火屬性，但裝備有水屬性攻擊力字樣，就回傳true
    var queries = disableTranslate ? ["火属性攻撃力", "水属性攻撃力", "地属性攻撃力", "光属性攻撃力", "闇属性攻撃力"] : ["火屬性攻擊力", "水屬性攻擊力", "地屬性攻擊力", "光屬性攻擊力", "闇屬性攻擊力"];
    if (element > 0) {
        queries.splice(element - 1, 1);
    }
    var lastIndex = isWeapon ? 2 : 4;
    for (var len = list.length, index = len - lastIndex; index < len; index++) {
        var content = list[index];
        for (var q = 0; q < queries.length; q++) {
            if (content.indexOf(queries[q]) >= 0) {
                return true;
            }
        }
    }
    return false;
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
        cdFormat(data.cd),
        data.break_,
        data.hate,
        data.casttime,
        data.min_range + '-' + data.max_range
    ];
    return '<td>' + list.join('</td><td>') + '</td>';
}

function getTrapSkillTd(trap_id) {
    var data = db.trap_skill[trap_id];
    var name = anchor(data.name, "loadTrapSkillAtk(" + data.id + ")")
    var list = [name,
        data.name,
        '攻擊',
        data.dmg,
        cdFormat(data.cd),
        data.break_,
        '---',
        '---',
        data.min_range + '-' + data.max_range
    ];
    return '<td>' + list.join('</td><td>') + '</td>';
}
// 產生奧義資料
function getOugiTd(id) {
    var data = db.ougi[id];
    var name = anchor(data.name, "loadOugiAtk(" + id + ")");
    var target = ['攻擊', '回復', '回復<br />攻擊'][data.target];
    var list = [name, '---', target, data.dmg, cdFormat(data.cd), data.break_, '---', '---', '---'];
    return '<td>' + list.join('</td><td>') + '</td>';
}

function loadSkillAtk(id) {
    var $table = $("#skillAtk");
    var data = db.skill_atk[id];
    var ext;
    if (id in enums.skill_ext_mapping) {
        ext = enums.skill_ext[enums.skill_ext_mapping[id]];
        $("#skillAtkExt").html(ext.comment).show();
    } else {
        $("#skillAtkExt").hide();
    }
    commonLoadAtk($table, data, ext);
}

function loadTrapSkillAtk(id) {
    var $table = $("#skillAtk");
    var data = db.trap_skill_atk[id];
    commonLoadAtk($table, data);
    $("#skillAtkExt").hide();
}

function loadOugiAtk(id) {
    var $table = $("#skillAtk");
    var data = db.ougi_atk[id];
    commonLoadAtk($table, data);
    $("#skillAtkExt").hide();
}

function loadMonsterSkillAtk(id) {
    var $table = $("#monsterSkillAtk");
    var data = db.monster_skill_atk[id];
    commonLoadAtk($table, data);
}

function commonLoadAtk($table, data, ext) {
    var obj = getSkillAtkTd(data, ext);
    $table.children("tbody").html(obj.body);
    $table.children("tfoot").html(obj.foot);
    $table.show();
}

function getSkillAtkTd(data, ext) {
    var item = getSkillAtkItemList(data, ext);
    var bodyHtml = '';
    var footHtml = '';
    item.body.forEach(function(obj) {
        bodyHtml += tableRow(obj);
    });
    // 都是空的會讓樣式錯誤，給一個空的tr
    if (!bodyHtml.length) {
        bodyHtml = '<tr></tr>';
    }
    item.foot.forEach(function(obj) {
        footHtml += tableRow(obj);
    });
    return {
        body: bodyHtml,
        foot: footHtml
    };
}

function getSkillAtkItemList(data, ext) {
    var bodyList = [];
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
        if (hit.kirimomi > 0) effects.push("大車輪２"); // 大車輪斜飛，像暗重S3最後一下
        if (hit.daisharin > 0) effects.push("大車輪");
        if (hit.haritsuke > 0) effects.push("定身");
        if (hit.huge_knockback > 0) effects.push("擊退");
        var atkType = enums.atk_type[hit.atk_type];
        var elementType = elementHtml(hit.element);
        var hitType = hit.hit_type;
        if (hitType == null) { // 奧義的情形
            hitType = enums.skill_type[hit.skill_type + 1];
        } else {
            hitType =
                hit.hit_type == 0 ? '攻擊' :
                hit.hit_type == 1 ? '回復' :
                hit.hit_type == 3 ? '直接攻擊' :
                hit.hit_type == 4 ? '全體回復' :
                hit.hit_type == 5 ? '自身' : hit.hit_type;
        }
        if (hitType == '攻擊' || hitType == '直接攻擊') {
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
        var effect = [];
		
        if (hit.recovery_debuff_id > 0) {
			effect.push('回復 ' + debuffHtml(hit.recovery_debuff_id));
		}
		if (hit.buff > 0) {
			effect.push('附加 ' + displaySkillBuff(hit.buff, hit.buff_value, hit.buff_time));
		}
		
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
                case 2:
                    text = atkUp("增益效果", value);
                    break;
                case 3:
                    text = atkUp("增益時間", value);
                    break;
                case 4:
                    text = atkUp("減益效果", value);
                    break;
                case 5:
                    text = atkUp("增益時間", value);
                    break;
                case 6:
                    text = atkUp("重力值", value);
                    break;
                case 7:
                    text = atkUp("仇恨值", value);
                    break;
                case 8:
                    text = atkUp("破盾值", value);
                    break;
                case 9:
                    text = atkUp("打擊停頓", value);
                    break;
                case 10:
                    text = atkUp("PowerX", value);
                    break;
                case 11:
                    text = atkUp("PowerY", value);
                    break;
                case 12:
                    text = "擊飛";
                    break;
                case 13:
                    text = "挖地";
                    break;
                case 14:
                    text = "扣殺";
                    break;
                case 15:
                    text = "大車輪２";
                    break;
                case 16:
                    text = "大車輪";
                    break;
                case 17:
                    text = "定身";
                    break;
                case 18:
                    text = atkUp("擊倒值", value);
                    break;
                case 19:
                    text = atkUp("擊退值", value);
                    break;
                default:
                    text = String.Format("type:{0} value:{1}", type, value);
                    break;
            }
            effect.push('蓄力時 ' + text);
        }
        // 計算debuff總和，雖然一招大概只有一種負面狀態
        // 但為了擴充方便還是設計成允許多種負面狀態
        if (hit.debuff > 0) {
            var prevValue = sum_debuff[hit.debuff] || 0;
            sum_debuff[hit.debuff] = prevValue + hit.debuff_value;
        }
        var ani_xy = hit.power_x + ', ' + hit.power_y;
        if (hit.centerflag === 1) {
            ani_xy += '<br />(中心)';
        }
        var hit_num = ext != null && ext.type === 2 ? 1 : hit.hit_num;
        var list = [
            hit_num,
            hitType,
            hit.dmg > 0 ? hit.dmg : '',
            displaySkillDebuff(hit.debuff, hit.debuff_value, hit.debuff_time),
            atkType,
            elementType,
            hit.gravity,
            hit.hate,
            hit.break_,
            effects.join('<br />'),
            hit.knockback,
            hit.huge_knockback,
            hit.hitstop,
            ani_xy,
            effect.join('<br />'),
        ];
        bodyList.push(list);
    }
    var footList = [];
    if (sum_hit > 0) { // 有攻擊才計算總合
        var html_debuff = '';
        for (var debuff_id in sum_debuff) {
            if (html_debuff.length) html_debuff += '<br />';
            html_debuff += displaySkillDebuff(debuff_id, sum_debuff[debuff_id], 0);
        }
        if (ext != null) {
            if (ext.type === 1) { // 多段攻擊
                var multiple = ext.value;
                sum_hit * multiple;
                sum_dmg *= multiple;
                sum_gravity *= multiple;
                sum_hate *= multiple;
                sum_break *= multiple;
            } else if (ext.type === 2) { // 貓弓S3例外處理
                // 找出第一個值跟最後一個值顯示
                var atk_id_array = Object.keys(data);
                var firstHit = data[atk_id_array[0]];
                var lastHit = data[atk_id_array[atk_id_array.length - 1]];
                sum_hit = 1;
                sum_dmg = firstHit.dmg + '-' + lastHit.dmg;
                sum_gravity = firstHit.gravity + '-' + lastHit.gravity;
                sum_hate = firstHit.hate + '-' + lastHit.hate;
                sum_break = firstHit.break_ + '-' + lastHit.break_;
                sum_knockback = firstHit.knockback;
            }
        }
        var list = [
            String.Format("{0} Hits", sum_hit),
			'',
            sum_dmg,
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
			''
        ];
        footList.push(list);
    }
    return {
        body: bodyList,
        foot: footList
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
        case 21:
            text = "護盾";
            break;
        case 22:
            text = "嘲諷";
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
        case 32:
            text = atkUp("破盾值", value);
            break;
        case 33:
            text = "根性";
            break;
        case 34:
            text = "技能無冷卻";
            break;
        case 35:
            text = "技能無詠唱";
            break;
        case 37:
            text = "狂戰";
            break;
        case 36: // モーションが早くなる強化効果を付与
			text = "加速";
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
    var sec = time / 30;
    return String.Format('<div class="duration">持續時間：{0} ({1}秒)</div>', time, sec);
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
        var content = displayEffect(magicID);
        $("#magic" + i).html(content);
    }
    // 說明跟強化素材
    setTitle(getAccessoryName(id), enums.rarity[data.rarity]);
    upgradeTotalRunes = {};
    var imgList = [];
    for (var rank in db.accessory_upgrade[id]) {
        var u = db.accessory_upgrade[id][rank];
        $("#rank" + rank).html(u.name + u.flavor.pre());
        $("#rune" + rank).html(getUpgradeRune(u));
        imgList.push(imgHtml(path.accessory, u.id, true));
    }
    $("#runeTotal").html(displayTotalRune(upgradeTotalRunes));
    $("#accessoryImage").html('<div>' + imgList.join('</div><div>') + '</div>'); // 修正chrome無法直接用image作flex
}

function displayEffect(id) {
    if (id <= 0) return '&nbsp;';
    var enchant = db.enchant_master[id];
    var content = enchant.enchant_comment.i18n().replaceAll('\n', '<br />');
    if (content.endsWith('秒') || content.endsWith('秒間付与')) {
        // 已經寫上時間的不處理
    } else if (enchant.enchant_id === 41) { // BUFF類
        if ((enchant.requirement_id === 1 || enchant.requirement_id === 2) && enchant.requirement_value1 === 1) {
            // HP限制類，條件達到就會常時發動因此不計
        } else if (enchant.enchant_target_id === 4) {
            // 裝甲士特殊技發動，只加到護罩持續時間的一秒
        } else {
            content += cdTime(enchant.enchant_value2) + '秒';
        }
    }
    return content;
}

function cdTime(value) {
    var time = value / 30;
    if (time % 1 !== 0) {
        time = time.toFixed(1); // 小數時間只顯示後一位
    }
    return time;
}

function cdFormat(value) {
    return String.Format("{0} ({1}秒)", value, cdTime(value));
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
    $("#weaponImgBlock").html(imgHtml(path.weapon, data.id, true));
    ['HP', 'ATK', 'AGI'].forEach(function(e) {
        var e1 = e.toLowerCase();
        var base = data[e1];
        var grow = data[e1 + "_grow"];
        var awakening = data[e1 + "_awakening_rate"];
        $("#weapon" + e).html(base);
        $("#weapon" + e + "_grow").html(grow);
        $("#weapon" + e + "_awakening").html(awakening);
    });
    var maxValue = calculateWeapon(id, 10, 4);
    $("#weaponMaxHP").html(maxValue.hp);
    $("#weaponMaxATK").html(maxValue.atk);
    $("#weaponMaxAGI").html(maxValue.agi);
    $("#weaponLevelSelect").change();
    // 武器主技能
    if (data.main_weapon_skill_id != 0) {
        var weaponMainSkill = db.weapon_mainskillbase[data.main_weapon_skill_id];
        var upgrade = db.weapon_mainskill_upgrade[data.main_weapon_skill_id];
        $("#weaponMainSkill").html(weaponMainSkill.name + '<br />' + upgrade["1"].skill_tips.pre());
        ['dmg', 'break_', 'hate', 'casttime'].forEach(function(name) {
            $("#weaponMainSkill_" + name).html(weaponMainSkill[name]);
        });
		$("#weaponMainSkill_cd").html(cdFormat(weaponMainSkill['cd']));
        $("#weaponMainSkill_range").html(weaponMainSkill.min_range + '-' + weaponMainSkill.max_range);
        $("#weaponMainSkillType").html(enums.skill_type[weaponMainSkill.skill_type]);
        $("#weaponMainSkillCount").html(data.normal_mws_value + "（最大：" + data.awakening_mws_value + "）");
        commonLoadAtk($("#weaponSkillAtk"), db.weapon_mainskill_atk[data.main_weapon_skill_id]);
    } else {
        $("[id^=weaponMainSkill]").empty();
        $("#weaponMainSkill").html('無');
        $("#weaponSkillAtk").hide();
    }
	$("#weaponEventFlag").html((data.event_ === 1).display());
	$("#weaponStack").html(displayStack(data.stack_id, true, true));
	
	// 計算武器技威力帳面數值
	// 威力好像固定是1.1/1.2/1.3/1.5
	// 暗狂斧紀錄的是增加破盾威力但帳面威力仍然遵照規則，所以先寫死
	var powerList = [];
	[100, 110, 120, 130, 150].forEach(function(ratio) {
		powerList.push((weaponMainSkill.dmg * ratio).toFixed(0));
	});
	console.log(powerList);
	
    // 武器副技能
	$("#weaponAwakenTable > tbody td").remove();
	for (var i = 0; i < 5; i++) {
		var subskillComment = '';
		if (data.sub_weapon_skill_id > 0) {
			var data_sub = db.weapon_subskill[data.sub_weapon_skill_id][i + 1];
			subskillComment = data_sub.name + '<br />' + data_sub.comment.i18n().pre();
		}
		var mainSkillPower = powerList[i];
		
		var html = String.Format('<td>{0}</td><td>{1}</td>', subskillComment, mainSkillPower);
		$("#weaponAwakenTable > tbody > tr").eq(i).append(html);
	}
	
	// 計算武器總合力
	if ($("#weaponLightTmpl").length) {
		// 先產生相關表格
		var tmpl = $("#weaponLightTmpl").html();
		var html = '';

		for (var r = 2; r <= 5; r++) {
			for (var e = 0; e <= 1; e++) {
				var content = '';
				for (var lv = 1; lv <= 10; lv++) {
					var tds = [];
					for (var a = 0; a <= 4; a++) {
						var light = db.weapn_light_lv[r][a][lv][e].light_lv;
						tds.push(displayLight(light, true));
					}
					content += String.Format('<tr><th>Lv{0}</th><td>{1}</td></tr>', lv, tds.join('</td><td>'));
				}
				html += String.Format(tmpl, r, e, content);
			}
		}
		$("#weaponLightTab").html(html);
	}
	// 只顯示符合武器能力的總合力表格
	$("#weaponLightTab table").hide();
	$(String.Format("#weaponLightR{0}E{1}", data.rarity, data.event_)).show();

	$("#weapon").find("[title]").tooltip();
}

function displayStack(id, imgSmallSize, showName) {
	if (id <= 0) return '';
	
	var html = '';
	// 顯示大圖或小圖或不顯示
	if (imgSmallSize === true) {
		html += imgXs(path.stack, id);
	} else if (imgSmallSize === false) {
		html += imgHtml(path.stack, id, true);
	}
	if (showName) {
		html += db.stack[id].stack_name;
	}
	
	var contents = [];
	for (var sid in db.stack_ability[id]) {
		var data_sa = db.stack_ability[id][sid];
		contents.push('Lv' + data_sa.stack)
		contents.push(displayStackEffect(data_sa).join('\n'));
	}
	var title = contents.join('\n');
	
	return String.Format("<span title='{1}'>{0}</span>", html, title);
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
        var sub = String.Format('總合力 {2}&nbsp;&nbsp;WAVE {0}&nbsp;&nbsp;體力 {1}', 
			Object.keys(db.event_quest_wave[questID]).length, quest.stamina, displayLight(quest.required_light));
        var itemHtml = listItemHtml(quest.id, quest.name, sub, "loadQuestData(" + id + ", " + quest.id + ");");
        html = itemHtml + html; // 難度越高排越上面
    }
    $list.html(html);
	// 有關卡資料時，自動點選第一筆
    var item = $list.find(".list-group-item").first();
    if (item.length) {
        item.click();
        $("#quest").removeClass('hidden');
    } else {
        $("#quest").addClass('hidden');
    }
    // 任務
    var html = '';
    itemSummary.reset();
    for (var missionID in db.event_mission) {
        var data_mission = db.event_mission[missionID];
        if (data_mission.event_id != id) continue;
        var title = data_mission.title;
        var comment = data_mission.comment;
        var asset = getAsset(data_mission.asset_type, data_mission.asset_id, data_mission.asset_value);
        html += tableRow([title, comment, asset]);
        // 統計可換物品總和
        itemSummary.add(data_mission.asset_type, data_mission.asset_id, data_mission.asset_value);
    }
    $("#missionTable > tbody").html(html);
    if (!!html) {
        $("#missionTable > tfoot").html(tableRow(['', '', itemSummary.display()]));
    } else {
        $("#missionTable > tfoot").html('');
    }
    // 交換所
    html = '';
    var raid_id = data.raid_id;
    var point_summary = 0;
    var point_last = 0;
    var point_exchange_mode = false;
    itemSummary.reset();
    var data_points = raid_id > 0 ? db.raid_event_point[raid_id] : db.event_point[id];
    if (data_points != null) {
        for (var pid in data_points) {
            var data_point = data_points[pid];
            var asset = getAsset(data_point.item_type, data_point.item_id, data_point.item_value);
            var exchange_limit = raid_id > 0 ? 1 : data_point.exchange_limit
            var data_point_sum = data_point.points * exchange_limit;
            html += tableRow([asset, data_point.points, exchange_limit, data_point_sum]);
            // 判斷是點數交換還是到達即可領取
            // 如果是到達即可領取那可換次數都是1
            if (exchange_limit > 1) {
                point_exchange_mode = true;
            }
            point_last = data_point_sum;
            point_summary += point_last;
            // 統計可換物品總和
            itemSummary.add(data_point.item_type, data_point.item_id, data_point.item_value);
        }
    }
    $("#exchangeTable > tbody").html(html);
    // 顯示可換物品總和
    var itemHtml = !point_exchange_mode ? itemSummary.display() : '';
    var total_point = point_exchange_mode ? point_summary : point_last;
    var footerHtml = total_point == 0 ? '' : tableRow([itemHtml, '', '', total_point]);
    $("#exchangeTable > tfoot").html(footerHtml);
}

// 讀取次元之門資料
function loadDimensionData(id) {
	loadDataEvent(id);
    var data_quest = db.dimension_quest[id];
    setTitle(db.dimension_category[id].name, '');
    var $list = $("#questList");
    var html = '';
    for (var questID in data_quest) {
        var quest = data_quest[questID];
        var sub = String.Format('總合力 {1}&nbsp;&nbsp;WAVE {0}', 
			Object.keys(db.dimension_wave[questID]).length, displayLight(quest.required_light));
        var itemHtml = listItemHtml(quest.id, quest.name, sub, "loadDimensionQuestData(" + id + ", " + quest.id + ");");
        html = itemHtml + html; // 難度越高排越上面
    }
    $list.html(html);
	// 有關卡資料時，自動點選第一筆
    var item = $list.find(".list-group-item").first();
    if (item.length) {
        item.click();
        $("#quest").removeClass('hidden');
    } else {
        $("#quest").addClass('hidden');
    }
}

// 讀取共鬥資料
function loadMultiData(id, mrcate) {
    loadDataEvent(id);
    var baseData = db.multi_quest[mrcate][id];
    var missionData = db.multi_quest_mission[id];
    var dropData = db.multi_quest_drop[id];
    var waveData = db.multi_quest_wave[id];
	var gimmickData = db.multi_quest_gimmick[id];
    loadCommonQuestData(baseData, missionData, dropData, waveData, gimmickData);
    setTitle(String.Format("MR{0} {1}", baseData.required_lv, baseData.name), '');
    $("#Recom_lv, #first_clear_bonus, #continue_limit, #required_lv, #exp, #crystal, #job_exp, #speedclear").closest("tr").show();
    $("#raid_point, #clear_treasure, #mission_treasure").closest("tr").hide();
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
	var gimmickData = db.zone_gimmick[id];
    loadCommonQuestData(baseData, missionData, dropData, waveData, gimmickData);
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
	var gimmickData = db.battle_step_gimmick[id];
    loadCommonQuestData(baseData, missionData, dropData, waveData, gimmickData);
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
	var gimmickData = null;   // 無此檔案
    loadCommonQuestData(baseData, missionData, dropData, waveData, gimmickData);
    setTitle(baseData.name, '');
    singleQuestField();
}

function singleQuestField() {
    $("#Recom_lv, #exp, #crystal, #job_exp").closest("tr").show();
    $("#raid_point, #first_clear_bonus, #multi_exp, #continue_limit, #required_lv, #clear_treasure, #mission_treasure").closest("tr").hide();
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
	var gimmickData = db.event_quest_gimmick[questID];
    loadCommonQuestData(baseData, missionData, dropData, waveData, gimmickData);
    // 特殊處理: 特殊情形下required_lv其實是Recom_lv不是MR限制
    var eventData = db.event[eventID];
    switch (eventData.event_type) {
        case 5: // 新職踏破
        case 9: // 試煉之塔
            $("#Recom_lv").html($("#required_lv").html()).closest("tr").show();
            $("#required_lv").html('').closest("tr").hide();
            break;
        default:
            break;
    }
    $("#Recom_lv, #first_clear_bonus, #multi_exp, #raid_point, #clear_treasure, #mission_treasure").closest("tr").hide();
    $("#continue_limit, #required_lv, #exp, #crystal, #job_exp, #speedclear").closest("tr").show();
    $("#questTab").show();
    $("#questList").show();
	$("#dimRewardTable > tbody").html('');
}

function loadDimensionQuestData(eventID, questID) {
    setActive($("#questList"), questID);
    var baseData = db.dimension_quest[eventID][questID];
    var missionData = db.dimension_mission[questID];
    //var dropData = db.event_quest_drop[eventID][questID];
    var waveData = db.dimension_wave[questID];
	var gimmickData = db.dimension_gimmick[questID];
    loadCommonQuestData(baseData, missionData, null, waveData, gimmickData);

	// 無任務跟交換所
	$("#missionTable > tbody, #missionTable > tfoot").html('');
	$("#exchangeTable > tbody, #exchangeTable > tfoot").html('');

	// 增加獎勵
	var html = '';
	for (var index in db.dimension_reward[eventID]) {
		var data = db.dimension_reward[eventID][index];
		var asset = getAsset(data.item_type_1, data.item_id_1, data.item_value_1);
		
		html += tableRow([index, asset]);
	}
	$("#dimRewardTable > tbody").html(html);
	
	// 增加寶藏
	var generateTreasures = function(id, event) {
		var data_treasure = db.dimension_treasure[baseData.clear_treasure_id][eventID];
		var rate_sum = 0;
		// 先進行機率加總
		for (var index in data_treasure) {
			rate_sum += data_treasure[index].rate;
		}
		var html = '';
		for (var index in data_treasure) {
			var data = data_treasure[index];
			if (data.rate === 0) continue;
			
			var asset = getAsset(data.item_type_1, data.item_id_1, data.item_value_1);
			var rate = String.Format("{0}%", (data.rate * 100 / rate_sum).toFixed(1));
			
			html += tableRow([asset, rate]);
		}
		return html;
	}
	$("#clear_treasure > table > tbody").html(generateTreasures(baseData.clear_treasure_id, eventID));
	$("#mission_treasure > table > tbody").html(generateTreasures(baseData.mission_treasure_id, eventID));
	
	$("#Recom_lv").html($("#required_lv").html()).closest("tr").show();
    $("#required_lv").html('').closest("tr").hide();
	
    $("#first_clear_bonus, #multi_exp, #exp, #crystal, #job_exp, #raid_point, #speedclear").closest("tr").hide();
    $("#continue_limit, #clear_treasure, #mission_treasure").closest("tr").show();
    $("#questTab").show();
    $("#questList").show();
}

function ItemSummary() {
	var data = {};
	
	this.reset = function() {
		data = {};
	}
	this.add = function(type, id, value) {
		if (data[type] == null) {
			data[type] = {};
		}
		var prev = data[type][id] || 0;
		data[type][id] = prev + value;
	}
	this.display = function() {
		var list = [];
		for (var item_type in data) {
			for (var item_id in data[item_type]) {
				list.push(getAsset(parseInt(item_type), parseInt(item_id), parseInt(data[item_type][item_id])));
			}
		}
		return String.Format($("#itemListTmpl").html(), list.join('<br />'));
	}
}
var itemSummary = new ItemSummary();

// 共通關卡資料讀取
function loadCommonQuestData(baseData, missionData, dropData, waveData, gimmickData) {
    current_quest = baseData;
    // 基本資料
    var attrs = ['exp', 'crystal', 'multi_exp', 'job_exp', 'required_lv', 'raid_point', 'Recom_lv', 'first_clear_bonus', 'battle_bgm_id', 'boss_bgm_id', 'clear_treasure_value', 'mission_treasure_value'];
    attrs.forEach(function(name) {
        $("#" + name).html(baseData[name]);
    });
    $("#continue_limit").html((baseData["continue_limit"] == -1).display());
    $("#bg_location").html(db.bg_location[baseData.bg_id].name);
    $("#boss1_name").html(getMonsterName(baseData.boss01_id));
    $("#boss2_name").html(getMonsterName(baseData.boss02_id));
	$("#light_element_bonus").html(baseData.light_element_bonus > 0 && baseData.bonus_element_id1 >= 0 ? displayLight(baseData.light_element_bonus) : '---');
	$("#bonus_element_id").html(displayElement(baseData.bonus_element_id1, baseData.bonus_element_id2));
    $("#rareenemy_id").html(baseData.rareenemy_id != null ? getMonsterName(baseData.rareenemy_id) : '無');
    var timeLimit = baseData.time_limit || baseData.timelimit;
    $("#time_limit").html(String.Format("{0}分", timeLimit / 60));
    $("#speedclear").html(String.Format("{0}分", baseData.speedclear / 60));
	
	// 關卡特性
	var ghtml = '';
	if (gimmickData != null) {
		for (var index in gimmickData) {
			var data_i = gimmickData[index];
			var data_g = db.gimmick[data_i.gimmick_id];
			var name = imgXs(path.gimmick(data_i.gimmick_id)) + data_g.gimmick_name;
			ghtml += String.Format('<span class="gimmick" title="{2}">{0} Lv{1}</span><br />', name, data_i.gimmick_lv, data_g.gimmick_comment);
		}
	} else {
		ghtml = '---';
	}
	$("#quest_gimmick").html(ghtml);
	
    // 三冠條件
    if (missionData != null) {
        var i = 1;
        for (var missionID in missionData) {
            $("#mission" + i).html(missionData[missionID].summery.i18n());
            i++;
        }
    }
    $("#mission1, #mission2, #mission3").closest("tr").toggle(missionData != null);
    // 三冠獎勵
    var missionBonusExist = baseData.mission_bonus_type != null;
    if (missionBonusExist) {
        $("#mission_bonus").html(getAsset(baseData.mission_bonus_type, baseData.mission_bonus_id, baseData.mission_bonus_value));
    }
    $("#mission_bonus").closest("tr").toggle(missionBonusExist);
    // 試煉之塔有利屬性
    if (baseData.advantage_job != null && (baseData.advantage_job > 0 || baseData.advantage_element > 0 || baseData.advantage_debuff > 0)) {
        var advantages = [];
        advantages.push(baseData.advantage_job > 0 ? enums.job[baseData.advantage_job] : '-');
        advantages.push(baseData.advantage_element > 0 ? enums.element[baseData.advantage_element] : '-');
        advantages.push(baseData.advantage_debuff > 0 ? enums.debuff[baseData.advantage_debuff] : '-');
        var advantagesText = advantages.join(' / ');
        $("#advantage").html(advantagesText).closest("tr").show();
    } else {
        $("#advantage").closest("tr").hide();
    }
    // 掉落率
	if (dropData != null) {
		for (var prop in dropData) {
			if (prop == 'id' || prop == 'event_id') continue;
			if ($("#" + prop).length == 0) continue;
			var value = dropData[prop];
			$("#" + prop).html(value);
		}
		$("#dropData table").show();
	} else {
		$("#dropData table").hide();
	}

    //console.log(dropData);
    ratioModify(["nocon_clear_rate1", "nocon_clear_rate2", "nocon_clear_rate3"], "nocon_clear_progress");
    ratioModify(["speed_clear_rate1", "speed_clear_rate2", "speed_clear_rate3"], "speed_clear_progress");
    ratioModify(["boss_drop1", "boss_drop2", "boss_drop3"], "boss_drop_progress");
    ratioModify(["mid_drop1", "mid_drop2"], "mid_drop_progress");
    ratioModify(["zako_drop1", "zako_drop2"], "zako_drop_progress");
    // 分布資訊
    var $waveTable = $("#waveData table > tbody");
    var html = '';
    var monsterExist = [
        [],
        [],
        []
    ];
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
	$("#quest [title]").tooltip();
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
    var pass = ratio === 1; // 原始總和即為100%就不用再修改文字
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
    var baseId = db.monster[id].base_id;
    return imgXs(path.monster, baseId) + db.monster_base[db.monster[id].base_id].name;
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
    // monster本身定義的是百分比，hp:10000 = 100倍 atk:100 = 1倍
    var hp;
    var atk;
    if (m_type == 0) {
        hp = current_quest.boss_hp * (data.hp / 100);
        atk = current_quest.boss_atk * (data.atk / 100);
        setMonValue("hp", hp);
        setMonValue("atk", atk);
        setMonValue("break", current_quest.boss_break);
    } else if (m_type == 1) {
        hp = current_quest.mid_hp * (data.hp / 100);
        atk = current_quest.mid_atk * (data.atk / 100);
        setMonValue("hp", hp);
        setMonValue("atk", atk);
        setMonValue("break", current_quest.mid_break);
    } else if (m_type == 2) {
        hp = current_quest.zako_hp * (data.hp / 100);
        atk = current_quest.zako_atk * (data.atk / 100);
        setMonValue("hp", hp);
        setMonValue("atk", atk);
        setMonValue("break", 0);
    }
    // 基本資料
    setMonValue("name", base.name);
    setMonValue("agi", data.agi);
    setMonValue("barrier", data.barrier);
    setMonValue("gravity", data.gravity);
    setMonValue("mass", data.mass);
    setMonValue("hk_resist", (100 - data.hk_resist) + '%');
    setMonValue("floating", (data.floating == 1).display());
    setMonValue("through", (data.through == 0).display());
    setMonValue("poison", String.Format("{0} ({1}%)", (hp * (data.poison / 10000)).toFixed(0), data.poison / 100));
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
    // 抗性 (主抗性由怪物決定，已不使用)
    /*var data_resist = db.monster_resist[data.base_id];
    for (var prop in data_resist) {
        if (prop == 'id' || prop == 'break_flag') continue; // 跳過這兩個屬性
        var value = data_resist[prop];
        if (value > 0) {
            value = '<span class="text-info">' + value + '</span>';
        } else if (value < 0) {
            value = '<span class="text-danger">' + value + '</span>';
        }
        setMonValue(prop, value);
    }*/
    // 使用技能
    var html = ''
    for (var command_id in db.monster_command[id]) {
        var command = db.monster_command[id][command_id];
        var skill = db.monster_skill[command.skill_id];
        var list = getMonsterSkillRow(command, skill, atk);
        html += tableRow(list);
        // 有變換技能
        if (skill.change_skillid > 0) {
            list = getMonsterSkillRow(null, db.monster_skill[skill.change_skillid], atk);
            html += tableRow(list);
        }
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
            part.break_
        ];
        html += tableRow(list);
    }
    $("#monsterPartsTable > tbody").html(html);
    // 清除前次資料
    $("#monsterSkillAtk").hide();
}

function getMonsterSkillRow(command, skill, atk) {
    var special = [];
    for (var i = 1; i <= 4; i++) {
        var summon_id = skill['summon0' + i + '_id'];
        if (summon_id === 0) continue;
        var summon_value = skill['summon0' + i + '_value'];
        var summon_mon_id;
        if (summon_id <= 5) {
            summon_mon_id = current_quest['zako0' + summon_id + '_id'];
        } else if (summon_id <= 9) {
            summon_mon_id = current_quest['mid0' + (summon_id - 5) + '_id'];
        } else {
            summon_mon_id = current_quest['boss0' + (summon_id - 9) + '_id'];
        }
        special.push('召喚怪物 ' + getMonsterName(summon_mon_id) + summon_value.display());
    }
    if (command != null) {
        if (command.rage_flag > 0) {
            if (command.rage_flag === 2) {
                special.push('被打100下後使用');
            } else {
                special.push('rage_flag: ' + command.rage_flag);
            }
        }
        if (command.hprate_flag > 0) {
            special.push('hprate_flag: ' + command.hprate_flag);
        }
    }
    if (skill.break_parts > 0) {
        special.push('部位' + skill.break_parts + ' 破壞時');
        if (skill.change_skillid > 0) {
            special.push('此技能變更為 <span class="monster-skill-name">' + db.monster_skill[skill.change_skillid].name + '</span>');
        }
        if (skill.change_damage > 0) {
            special.push('傷害減少' + (100 - skill.change_damage) + '%');
        }
    }
    // 總傷害為怪物攻擊x每下技能傷害比例
    // 例如怪物攻擊7000，進行倍率4.5，1hit傷害100%的攻擊，傷害就是7000*4.5=31500
    // 傷害比例基本總和會是100，但也有少部分例外
    // 例如Golem的跳躍+落石總傷害比例高達460，實際上中兩下基本就死了也不會全中
    // 此外傷害值還會扣掉屬性跟狀態減免才是最終傷害
    // 目前計算上可能會讓人誤解，所以先用原來的倍率
    var dmg = skill.dmg; // String.Format("{0} ({1})", (atk * skill.dmg).toFixed(0), skill.dmg);
    var list = [
        anchor((command == null ? '└─ ' : '') + skill.name, "loadMonsterSkillAtk(" + skill.id + ")"),
        dmg,
        cdFormat(skill.cd),
        skill.min_range + '-' + skill.max_range,
        special.join('<br />')
    ];
    return list;
}
// 讀取星盤資料
function loadCraftBoardData(id) {
    loadDataEvent(id);
    var html = '';
    var summary = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
    ];
    var id_list = [];
    if (id > 0) {
        id_list.push(id); // 2 = [2]
    } else {
        // 如果是負的，代表為範圍計算
        // 如-2 = [1, 2]  -3 = [1, 2, 3]
        for (var i = 1; i <= -id; i++) {
            id_list.push(i);
        }
    }
    var sumJP = 0;
    id_list.forEach(function(b_id) {
        for (var c_id in db.gift[b_id]) {
            var dataItem = db.gift[b_id][c_id];
            if (dataItem.unlock_jp == 0) continue; // 起始點
            // 全職業
            if (dataItem.type1 === 6) {
                for (var j = 1; j < summary.length; j++) {
                    summary[j][dataItem.type2 - 1] += dataItem.value;
                }
            } else {
                summary[dataItem.type1][dataItem.type2 - 1] += dataItem.value;
            }
            sumJP += dataItem.unlock_jp;
            var job_text = enums.craft_job[dataItem.type1];
            var type_text = enums.craft_type[dataItem.type2];
            var value = displayBoardValue(dataItem.type2 - 1, dataItem.value);
            html += tableRow([job_text, type_text, value]);
        }
    });
    var htmlSummary = '';
    for (var job = 1; job < summary.length; job++) {
        var content = [];
        content.push(enums.craft_job[job]);
        for (var type = 1; type < summary[job].length; type++) {
            var value = summary[job][type];
            if (value === 0) {
                content.push('');
            } else {
                content.push(displayBoardValue(type, value));
            }
        }
        htmlSummary += tableRow(content);
    }
    var htmlCommon = '';
    var stamina = '';
    if (id < 0) {
        stamina = String.Format("30 + {0} = {1}", summary[0][0], 30 + summary[0][0]);
        sumJP = String.Format("{0}（五職業等級總和 {1} 時點滿）", sumJP, sumJP + 4);
    } else {
        stamina = '+' + summary[0][0];
    }
    htmlCommon += tableRow(['體力', stamina]);
    htmlCommon += tableRow(['JP合計', sumJP]);
    $("#craftBoardCommonTable > tbody").html(htmlCommon);
    $("#craftBoardTable > tbody").html(htmlSummary);
    $("#craftBoardDetailTable > tbody").html(html);
}

function displayBoardValue(type, value) {
    return type === 0 ? '+' + value :
        type === 5 ? '-' + value + '%' :
        '+' + value + '%';
}

function setMonValue(className, content) {
    $("#monsterData ." + className).html(content);
}

function displayElement(value1, value2) {
	if (value1 == null || value1 < 0) return '';
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
    if (value1 == 0) return '';
    var value = debuffHtml(value1);
    if (value2 > 0) {
        value += debuffHtml(value2);
    }
    return value;
}

function debuffHtml(value) {
    return String.Format("<kbd class='debuff-{1}'>{0}</kbd>", enums.debuff[value], value);
}

function debuffKbd(value) {
	return String.Format("<kbd class='debuff-{1}'>{0}</kbd>", enums.debuff_name[value], value);
}

// 回傳獎勵名稱
function getAsset(type, id, value) {
    var name = '';
    switch (type) {
        case 1:
            if (id == 1) name = imgXs('images/Item/diamond.png') + '鑽石'
            break;
        case 2: // 道具
            var name = imgXs('images/Item/ci{0}_tex.png', id);
            if (id >= 21) {
                name += extendItemName(id);
            } else {
                name += db.items[id] != null ? db.items[id].name : '';
            }
            break;
        case 3: // 材料
            name = imgXs(path.rune, id) + '<span class="type-rune"></span>' + db.rune[id].name;
            break;
        case 4: // 裝備
            name = imgXs(path.accessory, id) + '<span class="type-accessory"></span>' +
                anchor(getAccessoryNameByUpgradeID(id), "showAccessory(" + getAccessoryIdByUpgradeID(id) + ")");
            break;
        case 5:
            name = imgXs('images/Item/crystal.png') + '經驗水晶';
            break;
        case 6:
            if (id == 1) name = imgXs('images/Item/tear.png') + '妖精之淚'
            break;
        case 7: // 角色
            name = imgXs(path.unit_mini, id) + '<span class="type-unit"></span>' +
                anchor(db.unit[id].name, "showUnit(" + id + ")") +
                getUnitJobComment(db.unit[id]);
            break;
        case 9: // 活動點數
            name = imgXs(path.event_item, id) + db.event_item[id].name;
            break;
        case 10: // 徽章
            name = imgXs(path.icon, id) + '<span class="type-icons"></span>' + db.icons[id].name;
            break;
        case 12: // 武器
            name = imgXs(path.weapon, id) + '<span class="type-weapon"></span>' +
                anchor(db.weapon[id].name, "showWeapon(" + id + ")");
            break;
		case 14:
			name = imgXs(path.key, id) + db.dimension_key[id].name;
			break;
		case 15: // 貢獻點
			if (id == 1) name = imgXs('images/Item/guild_coin.png') + 'ユニオンメダル';
			break;
		case 16: // 覺醒材料
			name = imgXs(path.awaken_item, id) + '<span class="type-awaken"></span>' + db.awakening_item[id].name;
			break;
		case 17: // 衣裝
			var data_skin = db.skin[id];
			name = imgXs(String.Format(path.unit_awaken_mini, padLeft(data_skin.chara_id, 4), padLeft(id, 4))) + '<span class="type-skin"></span>' + data_skin.skin_name;
			break;
    }
    if (!name) {
        return "type:" + type + " id:" + id + " value:" + value;
    } else {
        return name + value.display();
    }
}

function imgXs(path, id, title) {
    if (showImage === false) {
        return '';
    }
    if (id != null) {
        path = String.Format(path, padLeft(id.toString(), 4));
    }
    return String.Format('<img src="{0}" class="img-xs" title="{1}" />', path, title || '');
}

function extendItemName(id) {
    var names = [
        'スマイルポイント',
        'HR確定 武器ガチャチケット',
        'HR以上確定 武器ガチャチケット',
        'SR確定 武器ガチャチケット',
        null,
        null,
        '武器ガチャチケット',
        null,
        'コラボ武器確定 武器ガチャチケット'
    ];
	switch (id) {
		case 30: return 'トレジャーチケット 1枚';
		case 37: return '1周年記念SR確定 武器ガチャチケット 1枚';
		default: return names[id - 21] || ('id: ' + id);
	}
}
var accessoryNames;

function initAccessoryNames() {
    if (accessoryNames == null) {
        // 修改原始資料結構變成單一物件，比較好處理
        accessoryNames = {};
        for (var a in db.accessory_upgrade) {
            for (var b in db.accessory_upgrade[a]) {
                var item = db.accessory_upgrade[a][b];
                accessoryNames[item.id] = {
                    name: item.name,
                    id: item.accessory_id
                };
            }
        }
    }
}

function getAccessoryNameByUpgradeID(id) {
    initAccessoryNames();
    return accessoryNames[id].name;
}

function getAccessoryIdByUpgradeID(id) {
    initAccessoryNames();
    return accessoryNames[id].id;
}
// 計算武器能力值
function calculateWeapon(id, level, awaken) {
    var data = db.weapon[id];
    var calc = function(base, grow, awakening_rate, level, awaken) {
        var value = base + grow * (level - 1);
        while (awaken > 0) {
            value = Math.ceil(value * awakening_rate / 100);
            awaken--;
        }
        return value;
    }
    return {
        hp: calc(data.hp, data.hp_grow, data.hp_awakening_rate, level, awaken),
        atk: calc(data.atk, data.atk_grow, data.atk_awakening_rate, level, awaken),
        agi: calc(data.agi, data.agi_grow, data.agi_awakening_rate, level, awaken),
		light: db.weapn_light_lv[data.rarity][awaken][level][data.event_].light_lv
    }
}
// 計算角色能力值
function calculateUnit(id, level, awaken) {
    var data = db.unit[id];
    var calc = function(base, grow, level) {
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
	var result = {
        hp: calc(data.hp, data.hp_grow, level),
        atk: calc(data.atk, data.atk_grow, level),
        agi: data.agi,
        knockback: calc(data.knock_back_regist, data.knock_back_grow, level)
    };
	// 加上覺醒後數值
	if (awaken > 0 && db.unit_awakening[id] != null) {
		var data_awaken = db.unit_awakening[id][awaken];
		result.hp += data_awaken.hp;
		result.atk += data_awaken.atk;
		result.agi += data_awaken.agi;
		result.knockback += data_awaken.knock_back_regist;
	}
    return result;
}

function tableRow(array) {
    if (array.length == 0) return '';
    return '<tr><td>' + array.join('</td><td>') + '</td></tr>'
}

function anchor(text, onclick) {
    return String.Format('<a href="#" onclick="{1}; return false;">{0}</a>', text, onclick);
}

function renderTable(id, html, dataTablesOption) {
    var $table = $("#" + id);
    $table.children("tbody").html(html);
    $table.DataTable(dataTablesOption || defaultDataTablesOption);
	$table.find("[title]").tooltip();
    $table.wrap("<div class='table-responsive'></div>"); // 增加響應div
}

function showUnitStory(sender) {
    // 讀取Json
    $.getJSON('data/unit_story.json', function(data) {
		db.unit_story = data;
		
		loadUnitStory();
		$(sender).closest("div").hide();
		$("#storyBlock").show();
    });
}

function setDirtyClass() {
    var cssClass = 'dirty';
    if (skipDirty) {
        cssClass += ' hidden';
    }
    return cssClass;
}

function imgHtml(path, id, active) {
	// 有傳id進行字串取代，否則直接以path處理
	if (id != null) {
		path = String.Format(path, padLeft(id.toString(), 4));
	}
    if (active == true || showImage === true) {
        var fileId = path.replace(/^.*[\\\/]/, '').split('_')[0];
        if (showImage === false) {
            return fileId;
        }
        return String.Format('<img src="{0}" alt="{1}" />', path, fileId);
    } else {
        return String.Format('<a href="#" data-src="{0}" onclick="openImage(this); return false;">點選顯示</a>', path);
    }
}

function path2(path, id, index) {
	return String.Format(path, padLeft(id.toString(), 4), padLeft(index, 4));
}

function openImage(sender) {
    $(sender).closest("tbody").find("[data-src]").each(function() {
        var $this = $(this);
        var path = $this.data("src");
        var fileId = path.replace(/^.*[\\\/]/, '').split('_')[0];
        if (showImage === false) {
            $this.after(fileId);
        } else {
            $this.after(String.Format('<img src="{0}" alt="{1}" />', path, fileId));
        }
        $this.remove();
    });
}
var lottery;

function initLottery() {
    $.getJSON('data/lottery.json', function(data) {
        lottery = new LotteryModel(data);
        lottery.initial();
    });
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function initStory() {
    // 讀取Json
	$(".loader").show();
    $.when($.getJSON('data/main_story.json'), $.getJSON('data/event_story.json')).done(function(a1, a2) {
        main_story = a1[0];
        event_story = a2[0];

        var html = '';
        for (var id in main_story) {
            html += listItemHtml(id, main_story[id].title, '', "loadStoryData('" + id + "', 'ms');");
        }
		insertToList("mainStoryTab", html);

        html = '';
        for (var id in event_story) {
            html += listItemHtml(id, event_story[id].title, '', "loadStoryData('" + id + "', 'es');");
        }
		insertToList("eventStoryTab", html);
		$(".loader").hide();
    });
}

function loadStoryData(id, type) {
    loadDataEvent(id);
    var html = (type == 'ms') ? main_story[id].story :
        (type == 'es') ? event_story[id].story : '';
    html = html.replace(/([\S ]+)：/g, "<span class='text-success'>$1</span>").replace(/\n/g, "<br />");
    $("#storyBlock2").html(html).show();
}

function initTreasure() {
    var html = '';
    for (var diff in db.treasure_step_difficulty) {
        for (var step in db.treasure_step_difficulty[diff]) {
            var data = db.treasure_step_difficulty[diff][step];
            var asset = getAsset(data.mission_bonus_type, data.mission_bonus_id, data.mission_bonus_value);
            html += tableRow([diff, step, asset]);
        }
    }
    renderTable("treasureTable", html);
}

function showModal(text) {
    $('#outputModal').find('textarea').val(text).end().modal('show');
}

function showInputModal(callback) {
    $('#inputModal').find('textarea').val('').end()
        .find('.modal-footer > button').unbind("click").bind("click", function() {
            callback && callback.call(this, $("#inputTextarea").val());
        }).end()
        .modal('show');
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
    if (disableTranslate) return this;
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
                // 因為一句可能有兩次，replaceAll寫法不能用，所以直接修改兩次
                value = value.replace(reStyle, '附加<span class="buff-name">$1</span>的BUFF');
                value = value.replace(reStyle, '附加<span class="buff-name">$1</span>的BUFF');
            }
            return value;
        }
    }
    return this;
}
String.prototype.pre = function() {
    //return this.replaceAll('\n', '\\n');
    return '<pre class="comment">' + this + '</pre>';
}
String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};
Number.prototype.display = function() {
    return (this.valueOf() > 1 ? ' ×' + this.valueOf() : '');
};
Boolean.prototype.display = function() {
    return this.valueOf() ? '<i class="glyphicon glyphicon-ok"></i>' : '<i class="glyphicon glyphicon-remove"></i>'
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