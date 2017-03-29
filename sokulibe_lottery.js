	var recordUnit = {};
	var record = {};
	var define = defineObj;
	var lotteryData;
	
	var $history = $("#lotteryHistory");
	var $resultDiv = $("#lotteryResult");
	var $result = $resultDiv.children("div");
	var $recordTable = $("#lotteryResultTable > tbody");
	
	this.initial = function() {
		var $lotteryName = $('#lotteryName');
		$.each(lottery.itemList(), function (i, item) {
			$lotteryName.append($('<option>', { 
				value: item.value,
				text : item.text 
			}));
		});
		
		$lotteryName.change(function(){
			lottery.change($(this).val());
		}).children("option:nth-last-child(2)").attr("selected", "selected").change();
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
		console.log(id);
		console.log(define[id].data);
		lotteryData = define[id].data;
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
	
	this.lottery = function(type, diamond) {
		$result.empty();
		switch (type) {
				lotteryRarity(1);
				record.useDiamond += diamond;
				break;
				for (var i = 0; i < 9; i++) {
					lotteryRarity(1);
				}
				lotteryRarity(2);
				record.useDiamond += diamond;
				break;
				for (var i = 0; i < 9; i++) {
					lotteryRarity(1);
				}
				lotteryRarity(5);
				record.useDiamond += diamond;
				break;
				lotteryRarity(1);
				record.useTicket++;
				break;
				lotteryRarity(3);
				record.useTicket3++;
				break;
				lotteryRarity(4);
				record.useTicket3s++;
				break;
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
				newLottery.push(data);

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
		console.log(num);

		for (var i = 0; i < data.length; i++) {
			if (num < data[i].rate) {
				var unit_id = draw(data[i].unit_id);
				var unitData = db.unit[unit_id];
				record.count++;
				record["gainR" + unitData.rarity]++;
				if (data[i].festival == false) {
					record.tears += [6, 15, 100][unitData.rarity - 2];
				}
				if (unitData.rarity >= 4) {
					recordUnit[unit_id] = (recordUnit[unit_id] || 0) + 1;
				}

				$result.eq(divIndex).append('<div>' + imgHtml(path.unit_mini, unit_id, true) + '</div>');
				$history.append(imgHtml(path.unit_mini, unit_id, true));
				break;
			} else {
				num -= data[i].rate;
			}
		}
	}

	var draw = function(array) {
		var index = randInt(0, array.length);
		return array[index];
	}
	
	this.exportRatio = function() {
		$("#lotteryExport").val(JSON.stringify(lotteryData));
		$("#lotteryExportDiv").show();
		$("#lotteryImportDiv").hide();
	}

	this.prepareImportRatio = function() {
		$("#lotteryImport").val('');
		$("#lotteryImportDiv").show();
		$("#lotteryExportDiv").hide();
	}
	
	this.importRatio = function() {
		var obj = JSON.parse($("#lotteryImport").val());
		define.custom.data = obj;
		$("#lotteryImportDiv").hide();
		
		$lotteryName.val("custom").change();
	}
}
