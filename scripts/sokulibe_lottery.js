﻿function LotteryModel(defineObj) {
	var recordUnit = {};
	var record = {};
	var define = defineObj;
	var lotteryData;
	
	var $history = $("#lotteryHistory");
	var $resultDiv = $("#lotteryResult");
	var $result = $resultDiv.children("div");
	var $recordTable = $("#lotteryResultTable > tbody");
	var $lotteryName = $('#lotteryName');
	
	this.initial = function() {
		$.each(lottery.itemList(), function (i, item) {
			$lotteryName.append($('<option>', { 
				value: item.value,
				text : item.text 
			}));
		});
		
		// 最後一個項目固定為自訂，所以自動選取倒數第二個
		$lotteryName.change(function(){
			lottery.change($(this).val());
		}).children("option:nth-last-child(2)").attr("selected", "selected").change();
		
		unitSelectModal
	}
	
	this.reset = function() {
		record = {
			useDiamond: 0,
			useTicket: 0,
			useTicket3: 0,
			useTicket3s: 0,
			useTicket4: 0,
			count: 0,
			gainR4: 0,
			gainR3: 0,
			gainR2: 0,
			tears: 0
		};
		recordUnit = {};
		$result.empty();
		$history.empty();
		update();
		$resultDiv.hide();
	}
	
	this.change = function(id) {
		lotteryData = define[id].data;
		
		if (defineObj[id].basic !== false) {
			// 增加二、三星的角色
			lotteryData.push({
                "rarity": 3,
                "rate": 3000,
                "unit_id": [29, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
                "festival": false
            });
			lotteryData.push({
                "rarity": 2,
                "rate": 6400,
                "unit_id": [21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
                "festival": false
            });
		}
		this.reset();
	}
	
	this.itemList = function() {
		var items = [];
		for (var id in define) {
			items.push({
				text: define[id].name,
				value: id
			});
		}
		return items;
	}
	
	var rateFormat = function (value, count) {
		if (count == 0) return '---';
		else return String.Format('{0} ({1}%)', value, (value * 100 / count).toFixed(1));
	}
	
	var update = function() {
		var array = [
			record.useDiamond,
			record.useTicket,
			record.useTicket3,
			record.useTicket3s,
			record.useTicket4,
			record.count,
			rateFormat(record.gainR4, record.count),
			rateFormat(record.gainR3, record.count),
			rateFormat(record.gainR2, record.count),
			record.tears
		];

		$recordTable.html(tableRow(array));

		var html = '';
		for (var id in recordUnit) {
			html += tableRow([
				anchor(getUnitName(db.unit[id]), "showUnit(" + db.unit[id].id + ")"),
				recordUnit[id]
			]);
		}
		$resultDiv.show();
		$("#lotteryR4Table > tbody").html(html);
		$history[0].scrollTop = $history[0].scrollHeight;
	}
	
	// 計算轉蛋結果
	this.lottery = function(type, diamond) {
		$result.empty();
		switch (type) {
			case 1: // 單抽
				lotteryRarity(1);
				record.useDiamond += diamond;
				break;
			case 2: // 十連抽，最後一抽四星機率加倍
				for (var i = 0; i < 9; i++) {
					lotteryRarity(1);
				}
				lotteryRarity(2);
				record.useDiamond += diamond;
				break;
			case 7: // 有償十連保底，最後一抽必定四星
				for (var i = 0; i < 9; i++) {
					lotteryRarity(1);
				}
				lotteryRarity(5);
				record.useDiamond += diamond;
				break;
			case 3: // 抽獎券
				lotteryRarity(1);
				record.useTicket++;
				break;
			case 4: // 三星券
				lotteryRarity(3);
				record.useTicket3++;
				break;
			case 5: // 必三星券
				lotteryRarity(4);
				record.useTicket3s++;
				break;
			case 6: // 四星券
				lotteryRarity(5);
				record.useTicket4++;
				break;
			default:
				break;
		}
		update();
	}

	var initialData = function(rateType) {
		var newLottery = [];
		var rateRarity4 = 0;
		for (var i = 0; i < lotteryData.length; i++) {
			var data = lotteryData[i];
			if (rateType == 1) { // 正常
				newLottery.push(data);

			} else if (rateType == 2) { // 四星加倍，二星機率扣掉四星機率
				var newData = $.extend({}, data);

				if (data.rarity == 4) {
					rateRarity4 += newData.rarity;
					newData.rate *= 2;
				} else if (data.rarity == 2) {
					newData.rate -= rateRarity4;
				}
				newLottery.push(newData);

			} else if (rateType == 3) {
				if (data.rarity >= 3) {
					newLottery.push(data);
				}
			} else if (rateType == 4) {
				if (data.rarity == 3) {
					newLottery.push(data);
				}
			} else if (rateType == 5) {
				if (data.rarity == 4) {
					newLottery.push(data);
				}
			}
		}
		return newLottery;
	}

	var lotteryRarity = function(rateType) {
		var data = initialData(rateType);

		var sumRate = 0;
		data.forEach(function(obj) {
			sumRate += obj.rate;
		});
		var num = randInt(0, sumRate); // 產生亂數
		console.log(num);

		for (var i = 0; i < data.length; i++) {
			if (num < data[i].rate) {
				var unit_id = draw(data[i].unit_id);
				var unitData = db.unit[unit_id];
				record.count++;
				record["gainR" + unitData.rarity]++;
				// 不是限定角，計算眼淚
				if (data[i].festival == false) {
					record.tears += [6, 15, 100][unitData.rarity - 2];
				}
				if (unitData.rarity >= 4) {
					recordUnit[unit_id] = (recordUnit[unit_id] || 0) + 1;
				}

				var divIndex = parseInt($("#lotteryResult img").length / 5);   // 每五個換一行
				$result.eq(divIndex).append('<div>' + imgHtml(path.unit_mini, unit_id, true) + '</div>');
				$history.append(imgHtml(path.unit_mini, unit_id, true));
				break;
			} else {
				num -= data[i].rate;
			}
		}
	}

	// 從陣列中隨機取出一個項目
	var draw = function(array) {
		var index = randInt(0, array.length);
		return array[index];
	}
	
	this.exportRatio = function() {
		showModal(JSON.stringify(lotteryData));
	}

	this.prepareImportRatio = function() {
		showInputModal(this.importRatio);
	}
	
	function importRatio(text) {
		if (!text) {
			alert('沒有輸入文字');
			return;
		}
		
		var obj = JSON.parse(text);
		define.custom.data = obj;
		
		$lotteryName.val("custom").change();
	}
	
	var initSelectUnitModal = false;
	this.prepareSelectUnit = function() {
		var $modal = $("#unitSelectModal");
		
		if (!initSelectUnitModal) {
			var html = '';
			var itemList = getUnitSortList(true);
			for (var i = 0, len = itemList.length; i < len; i++) {
				var data = itemList[i];
				
				if (data.rarity === 4) {
					var fileName = String.Format(path.unit_mini, padLeft(data.id.toString(), 4));
					html += String.Format('<img src="{0}" alt="{1}" class=" grayscale" />', fileName, data.id);
				}
			}
			var $row = $modal.find(".modal-body");
			$row.html(html).find("img").click(function() {
				$(this).toggleClass('grayscale');
			});
			
			$modal.find(".modal-footer > button").click(function() {
				var selectList = $row.find('img:not(".grayscale")').map(function() {
					return parseInt($(this).attr("alt"));
				}).get();
				
				$modal.modal('hide');
				if (selectList.length) {
					showModal(JSON.stringify({
						"rarity": 4,
						"rate": 600,
						"unit_id": selectList,
						"festival": false
					}));
				}
			});
			
			initSelectUnitModal = true;
		}
		$modal.modal('show');
	}
}
