function TearsComputeModel() {
	var tearsGlobalData;
	var previous;
	var $tearsTable;
	
	this.initial = function() {
		var itemList = getUnitSortList();
		var html = '',
			html2 = '';
		var commonLvTmpl = $("#setCommonLvTmpl").html();

		for (var i = 0, len = itemList.length; i < len; i++) {
			var data = itemList[i];

			var selectorHtml = String.Format('<input type="number" min="0" max="{0}" step="5" data-rarity="{1}" data-id="{2}" name="unitLv" class="width50" />',
					enums.max_level[data.rarity], data.rarity, data.id) +
				commonLvTmpl +
				$("#setR" + data.rarity + "LvTmpl").html();

			var list = [
				imgHtml(path.unit_mini, data.id),
				anchor(getUnitName(data), "showUnit(" + data.id + ")"),
				data.rarity,
				elementHtml(data.use_element),
				enums.job[data.job_id],
				selectorHtml,
				String.Format('<input type="text" data-id="{0}" data-rarity="{1}" name="unitTear" class="readonly" readonly />', data.id, data.rarity)
			];

			if (data.rarity === 4) {
				html += tableRow(list);
			} else {
				html2 += tableRow(list);
			}
		}

		$tearsTable = $("#tearsComputeTable, #tearsComputeTable2");
		$tearsTable.on("change", "[name='unitLv']", function() {
			var rarity = $(this).data("rarity");
			var value = $(this).val();
			var $total = $(this).closest("tr").find("[name=unitTear]");
			$total.val(computeUseTears(value, rarity));
			updateResultText();
		});

		var dtOption = $.extend({}, defaultDataTablesOption, {
			"searching": false
		});
		renderTable("tearsComputeTable", html, dtOption);
		renderTable("tearsComputeTable2", html2, dtOption);
		
		var $tearsAccount = $("#tearsAccount");
		var $tearsRenameInput = $("#tearsRenameInput");
		updatePrev();
		
		$tearsAccount.change(function() {
			saveToObject(previous);
			loadFromObject(this.value);
			
			updatePrev(this.value);
		}).append("<option selected>帳號1</option>");
		
		var clearAllTears = this.clearAllTears();   // 匿名function無法抓到外部定義的function
				
		$("#tearsCreateAccount").click(function() {
			saveToObject();
			
			var count = 1;
			while ($tearsAccount.has('option:contains("帳號' + count + '")').length) {
				count++;
			}
			
			$tearsAccount.append("<option selected>帳號" + count + "</option>");
			clearAllTears;
			updatePrev();
		});
		
		$("#tearsRenameAccount").click(function() {
			var accountName = $tearsAccount.val();
			var newName = $tearsRenameInput.val();
			
			tearsGlobalData = tearsGlobalData || {};
			if (tearsGlobalData[accountName]) {
				delete tearsGlobalData[accountName];
			}
			$("#tearsAccount > option:selected").html(newName);
			saveToObject();
			updatePrev();
		});
		
		$("#tearsDeleteAccount").click(function() {
			var accountName = $tearsAccount.val();
			tearsGlobalData = tearsGlobalData || {};
			if (tearsGlobalData[accountName]) {
				delete tearsGlobalData[accountName];
			}
			
			// 只剩一個項目時不作刪除
			var $options = $tearsAccount.children("option");
			if ($options.length === 1) {
				clearAllTears;
				$options.filter(":selected").html('帳號1');
			} else {
				$options.filter(":selected").remove();
			}
			updatePrev();
		});
	}
	
	this.setLv = function(sender) {
		var $sender = $(sender);
		var $input = $sender.closest('td').find('[name=unitLv]');
		var value = parseInt($sender.text());
		$input.val(value).change();
	}

	this.addLv = function(sender) {
		var $sender = $(sender);
		var $input = $sender.closest('td').find('[name=unitLv]');
		var value = $sender.text();
		value = parseInt(value.replace('+', ''));
		value = parseInt($input.val()) + value;
		if (value > parseInt($input.attr('max'))) value = parseInt($input.attr('max'));
		if (value < parseInt($input.attr('min'))) value = parseInt($input.attr('min'));
		$input.val(value).change();
	}
	
	function updatePrev(value) {
		previous = value || $("#tearsAccount").val();
		$("#tearsRenameInput").val(previous);
	}
	
	function computeUseTears(lv, rarity) {
		if (lv == null) return 0;

		var max_lv = enums.max_level[rarity];
		var base_lv = max_lv / 2;

		var use_tears = 0;
		for (var i = 0; i < enums.limitbreak[rarity].length; i++) {
			if (lv <= base_lv) break;
			base_lv += 5;
			use_tears += enums.limitbreak[rarity][i];
		}
		return use_tears;
	}

	this.saveToLocal = function() {
		if (typeof(Storage) == "undefined") {
			alert('您的瀏覽器不支援本地儲存');
			return;
		}

		var json = saveCommon();
		localStorage.setItem("useTears", json);
		alert('儲存成功');
	}

	this.saveToText = function() {
		var json = saveCommon;

		hideResultInput();
		$("#saveToText").show().children("textarea").val(json);
	}

	function saveCommon() {
		saveToObject();
		
		return JSON.stringify(tearsGlobalData);
	}

	function saveToObject(accountName) {
		var saveData = {};
		$tearsTable.find("tbody > tr").each(function() {
			var $lv = $(this).find("[name=unitLv]");
			if (!$lv.val()) return;

			var $tear = $(this).find("[name=unitTear]");
			var id = $tear.data("id");
			saveData[id] = {
				lv: parseInt($lv.val()),
				tear: parseInt($tear.val())
			};
		});
		// 將更新內容塞進去
		accountName = accountName || $("#tearsAccount").val();
		tearsGlobalData = tearsGlobalData || {};
		tearsGlobalData[accountName] = saveData;
		console.log(tearsGlobalData);
	}

	this.loadFromLocal = function() {
		if (typeof(Storage) == "undefined") {
			alert('您的瀏覽器不支援本地儲存');
			return;
		}

		var json = localStorage.getItem("useTears");
		if (json == null) {
			alert('沒有儲存的資料');
			return;
		}
		loadCommon(json);
	}

	this.loadFromText = function() {
		hideResultInput();
		$("#loadFromText").show();
	}

	this.loadFromTextButton = function() {
		var json = $("#loadFromText").children("textarea").val();
		if (!json) {
			alert('沒有輸入文字');
			return;
		}
		loadCommon(json);
	}

	function loadCommon(json) {
		tearsGlobalData = JSON.parse(json);
		var accounts = Object.keys(tearsGlobalData);
		var html = '';
		accounts.forEach(function(account) {
			html += '<option>' + account + '</option>';
		});
		$("#tearsAccount").html(html);
		loadFromObject(accounts[0]);
		updatePrev(accounts[0]);

		alert('讀取成功');
	}

	function loadFromObject(account) {
		var saveData = tearsGlobalData[account];
		
		$tearsTable.find("tbody > tr").each(function() {
			var $lv = $(this).find("[name=unitLv]");
			var $tear = $(this).find("[name=unitTear]");
			var id = $tear.data("id");

			var data = saveData[id];
			if (data != null) {
				$lv.val(data.lv);
				$tear.val(data.tear);

			} else {
				$lv.val('');
				$tear.val('');
			}
		});
		updateResultText();
	}

	function updateResultText() {
		var tears = 0;
		var tearsFor4 = 0
		$tearsTable.find("[name=unitTear]").each(function() {
			var $this = $(this);
			var value = parseInt($this.val()) || 0;
			tears += value;
			if ($this.data("rarity") == 4) {
				tearsFor4 += value;
			}
		});
		$("#tearsValue").html(tears);
		$("#tearsFor4Value").html(tearsFor4);

		var units = 0;
		var unitsFree = 0;
		var unitsLv200 = 0;
		$tearsTable.find("[name=unitLv]").each(function() {
			var $this = $(this);
			var lv = $this.val();
			if ($this.data("rarity") == 4 && !!lv) {
				if (lv == 200) {
					unitsLv200++;
				}
				var id = parseInt($this.data("id"));
				if (enums.free_unit.indexOf(id) >= 0) {
					unitsFree++;
				} else {
					units++;
				}
			}
		});
		$("#unitCount").html(units);
		$("#unitFreeCount").html(unitsFree);
		$("#unitLv200Count").html(unitsLv200);
		hideResultInput();
	}

	this.clearAllTears = function() {
		$tearsTable.find("[name=unitLv], [name=unitTear]").val('');
		updateResultText();
		hideResultInput();
	}

	function hideResultInput() {
		$("#saveToText").hide();
		$("#loadFromText").hide();
	}
}